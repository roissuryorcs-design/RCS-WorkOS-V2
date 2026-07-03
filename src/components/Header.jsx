import "../css/header.css";

export default function Header({ title, subtitle }) {
  return (
    <div 
      className="header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--bg-secondary)",
        padding: "12px 0 8px 0",
        borderBottom: "1px solid var(--border-color)",
        marginBottom: 16,
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div>
        <h1 
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--text-primary)", // ← Pakai CSS variables
            margin: 0,
            transition: "color 0.3s ease",
          }}
        >
          {title || "FOREL FPSO HVAC"}
        </h1>
        <p 
          style={{
            fontSize: 14,
            color: "var(--text-muted)", // ← Pakai CSS variables
            marginTop: 2,
            transition: "color 0.3s ease",
          }}
        >
          {subtitle || "Engineering"}
        </p>
      </div>
    </div>
  );
}
