function formatPhone(raw) {
  const digits = String(raw || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  const hasPlus = digits.startsWith("+");
  const nums = digits.replace(/\+/g, "");
  const groups = nums.match(/.{1,4}/g) || [];
  return (hasPlus ? "+" : "") + groups.join("-");
}

export default function PhoneCell({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
      <span style={{ fontSize: 13, flexShrink: 0, opacity: value ? 0.8 : 0.4 }}>📞</span>
      <input
        type="tel"
        value={value || ""}
        placeholder="+62 812-3456-7890"
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          const formatted = formatPhone(e.target.value);
          if (formatted !== e.target.value) onChange(formatted);
        }}
        style={{
          border: "none",
          background: "transparent",
          fontSize: 13,
          padding: "4px 2px",
          width: "100%",
          color: "var(--text-primary)",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}
