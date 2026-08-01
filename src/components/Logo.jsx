import { useTheme } from "../context/ThemeContext";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";

export default function Logo({ width = 130 }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? logoDark : logoLight;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ position: "relative", width, aspectRatio: "200 / 122", lineHeight: 0 }}>
        <img
          src={src}
          alt="RCS"
          style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
        />
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "calc(78% + 11.5px)",
            transform: "translate(-50%, -50%)",
            fontSize: Math.round(width * 0.13),
            fontWeight: 800,
            letterSpacing: 0.5,
            color: "var(--text-primary)",
          }}
        >
          RCS
        </span>
      </div>
      <span
        style={{
          position: "relative",
          top: 2.5,
          fontSize: 11.5,
          fontWeight: 500,
          color: "var(--text-primary)",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Remote Collaboration System
      </span>
    </div>
  );
}
