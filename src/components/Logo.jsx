import { useTheme } from "../context/ThemeContext";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";

// Matches the brand sheet: purple accent on light backgrounds, gold
// accent on dark ones — same Lakers palette as the badge itself.
const ACCENT_LIGHT = "#542583";
const ACCENT_DARK = "#fdb827";

export default function Logo({ width = 130 }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? logoDark : logoLight;
  const accent = theme === "dark" ? ACCENT_DARK : ACCENT_LIGHT;
  const lineWidth = Math.max(14, Math.round(width * 0.1));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width, aspectRatio: "948 / 278", lineHeight: 0 }}>
        <img
          src={src}
          alt="RCS"
          style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ width: lineWidth, height: 1.5, background: accent, borderRadius: 1 }} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: accent,
            whiteSpace: "nowrap",
          }}
        >
          Remote Collaboration System
        </span>
        <span style={{ width: lineWidth, height: 1.5, background: accent, borderRadius: 1 }} />
      </div>
    </div>
  );
}
