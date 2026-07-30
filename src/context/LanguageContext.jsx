import { createContext, useState, useContext, useEffect } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext();

const SUPPORTED_LANGUAGES = ["id", "en"];
const DEFAULT_LANGUAGE = "id";
const STORAGE_KEY = "language";

function getNested(obj, dottedKey) {
  return dottedKey.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

function detectInitialLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  const nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
  return nav.startsWith("en") ? "en" : DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectInitialLanguage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) setLanguageState(lang);
  };

  // {{placeholder}} interpolation, dependency-free. A var with no matching
  // entry in `vars` is left LITERALLY in the output (not silently dropped)
  // — a stray "{{name}}" visibly rendered in a dialog during testing is an
  // unmissable signal that a call site passed the wrong var name.
  const t = (key, vars) => {
    const primary = getNested(translations[language], key);
    const fallback = getNested(translations[DEFAULT_LANGUAGE], key);
    let str = primary ?? fallback ?? key;
    if (vars) {
      str = str.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
      );
      if (import.meta.env.DEV) {
        const leftover = str.match(/\{\{\s*(\w+)\s*\}\}/g);
        if (leftover) {
          console.warn(`[i18n] missing interpolation var(s) ${leftover.join(", ")} for key "${key}"`);
        }
      }
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
