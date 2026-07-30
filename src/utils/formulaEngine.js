const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseDateValue(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();

  let m = s.match(/^(\d{2})\s*-\s*([A-Za-z]{3})\s*-\s*(\d{4})$/);
  if (m) {
    const mi = MONTHS_SHORT.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
    if (mi !== -1) return new Date(Number(m[3]), mi, Number(m[1]));
  }

  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateValue(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} - ${month} - ${year}`;
}

function coerce(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value;
  const s = String(value).trim();
  if (s !== "" && !isNaN(Number(s))) return Number(s);
  return s;
}

const FUNCS = {
  IF: (cond, a, b) => (cond ? a : b),
  ROUND: (n, d = 0) => {
    const f = Math.pow(10, d);
    return Math.round((Number(n) || 0) * f) / f;
  },
  ABS: (n) => Math.abs(Number(n) || 0),
  SUM: (...nums) => nums.flat().reduce((acc, n) => acc + (Number(n) || 0), 0),
  AVG: (...nums) => {
    const flat = nums.flat();
    return flat.length ? FUNCS.SUM(...flat) / flat.length : 0;
  },
  MIN: (...nums) => Math.min(...nums.flat().map((n) => Number(n) || 0)),
  MAX: (...nums) => Math.max(...nums.flat().map((n) => Number(n) || 0)),
  CONCAT: (...strs) => strs.flat().map((s) => (s === null || s === undefined ? "" : String(s))).join(""),
  LEN: (s) => String(s || "").length,
  UPPER: (s) => String(s || "").toUpperCase(),
  LOWER: (s) => String(s || "").toLowerCase(),
  AND: (...vals) => vals.flat().every(Boolean),
  OR: (...vals) => vals.flat().some(Boolean),
  NOT: (v) => !v,
  TODAY: () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  },
  DATEDIFF: (a, b) => {
    const da = parseDateValue(a);
    const db = parseDateValue(b);
    if (!da || !db) return NaN;
    return Math.round((da.getTime() - db.getTime()) / 86400000);
  },
};

const FUNC_NAMES = Object.keys(FUNCS);

// `descKey` (not a stored `desc` string) — this is static reference text,
// translated at render time by FormulaEditor.jsx via t(descKey), not
// board/seed data, so it doesn't need the "resolve at creation time"
// treatment default-generation code elsewhere in the app needs.
export const FORMULA_FUNCTION_HELP = [
  { name: "IF(cond, a, b)", descKey: "formulaHelp.if" },
  { name: "ROUND(n, d)", descKey: "formulaHelp.round" },
  { name: "ABS(n)", descKey: "formulaHelp.abs" },
  { name: "SUM(a, b, ...)", descKey: "formulaHelp.sum" },
  { name: "AVG(a, b, ...)", descKey: "formulaHelp.avg" },
  { name: "MIN(a, b, ...) / MAX(a, b, ...)", descKey: "formulaHelp.minMax" },
  { name: "CONCAT(a, b, ...)", descKey: "formulaHelp.concat" },
  { name: "LEN(text)", descKey: "formulaHelp.len" },
  { name: "UPPER(text) / LOWER(text)", descKey: "formulaHelp.upperLower" },
  { name: "AND(...) / OR(...) / NOT(x)", descKey: "formulaHelp.andOrNot" },
  { name: "TODAY()", descKey: "formulaHelp.today" },
  { name: "DATEDIFF(a, b)", descKey: "formulaHelp.datediff" },
];

// Ganti "=" tunggal (bukan bagian dari ==, !=, <=, >=) jadi "==" supaya
// formula bisa ditulis dengan gaya spreadsheet ({Status} = "Done").
function normalizeEquals(expr) {
  let out = "";
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "=" && expr[i - 1] !== "=" && expr[i - 1] !== "!" && expr[i - 1] !== "<" && expr[i - 1] !== ">" && expr[i + 1] !== "=") {
      out += "==";
    } else {
      out += ch;
    }
  }
  return out;
}

export function evaluateFormula(formula, item, columns) {
  if (!formula || !formula.trim()) return "";
  try {
    let expr = formula;

    expr = expr.replace(/\{([^}]+)\}/g, (_, ref) => {
      const name = ref.trim();
      const col = (columns || []).find((c) => c && (c.label === name || c.id === name));
      const raw = col ? item?.[col.id] : item?.[name];
      return JSON.stringify(coerce(raw));
    });

    expr = normalizeEquals(expr);

    FUNC_NAMES.forEach((name) => {
      const re = new RegExp(`\\b${name}\\s*\\(`, "g");
      expr = expr.replace(re, `FUNCS.${name}(`);
    });

    // eslint-disable-next-line no-new-func
    const fn = new Function("FUNCS", `"use strict"; return (${expr});`);
    const result = fn(FUNCS);

    if (result instanceof Date) {
      return isNaN(result.getTime()) ? "#ERROR" : formatDateValue(result);
    }
    if (typeof result === "number") {
      if (!isFinite(result)) return "#ERROR";
      return Math.round(result * 1e6) / 1e6;
    }
    if (result === undefined || result === null) return "";
    return result;
  } catch (e) {
    return "#ERROR";
  }
}
