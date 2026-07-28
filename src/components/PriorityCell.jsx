export const PRIORITY_LEVELS = [
  { name: "Critical", color: "#ef4444" },
  { name: "High", color: "#f97316" },
  { name: "Medium", color: "#f5b800" },
  { name: "Low", color: "#3b82f6" },
  { name: "Best Effort", color: "#9ca3af" },
];

const PRIORITY_COLORS = PRIORITY_LEVELS.reduce((acc, p) => {
  acc[p.name] = p.color;
  return acc;
}, {});

export default function PriorityCell({ priority, onChange }) {
  const current = priority && PRIORITY_COLORS[priority] ? priority : "";
  const currentColor = current ? PRIORITY_COLORS[current] : "var(--border-dark)";

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "4px 28px 4px 10px",
        borderRadius: 4,
        border: "1px solid var(--border-color)",
        background: current ? currentColor : "var(--bg-hover)",
        color: current ? "#ffffff" : "var(--text-muted)",
        cursor: "pointer",
        width: "100%",
        fontWeight: 500,
        fontSize: 12,
        minHeight: 28,
        outline: "none",
        appearance: "auto",
        WebkitAppearance: "auto",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <option value="" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
        -
      </option>
      {PRIORITY_LEVELS.map((p) => (
        <option key={p.name} value={p.name} style={{ background: p.color, color: "#ffffff" }}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
