import { useLanguage } from "../context/LanguageContext";
import Logo from "./Logo";

const FEATURE_KEYS = ["feature1", "feature2", "feature3", "feature4"];
const FEATURE_ICONS = { feature1: "🔄", feature2: "📊", feature3: "💬", feature4: "🌐" };
const FEATURE_COLORS = { feature1: "#3b82f6", feature2: "#f59e0b", feature3: "#a855f7", feature4: "#16a34a" };

const primaryBtnStyle = {
  padding: "12px 26px",
  background: "var(--btn-primary-bg)",
  color: "var(--btn-primary-text)",
  border: "none",
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export default function LandingPage({ onGetStarted }) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        zIndex: 2000,
      }}
    >
      {/* Nav bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 24px",
          background: "var(--bg-primary)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div style={{ transform: "scale(0.7)", transformOrigin: "left center" }}>
          <Logo width={90} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setLanguage(language === "id" ? "en" : "id")}
            style={{ padding: "6px 10px", background: "var(--bg-hover)", border: "1px solid var(--border-dark)", borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: "var(--text-primary)" }}
          >
            {language === "id" ? "🇬🇧 EN" : "🇮🇩 ID"}
          </button>
          <button
            onClick={() => onGetStarted("signIn")}
            style={{ padding: "8px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}
          >
            {t("landing.ctaSignIn")}
          </button>
          <button onClick={() => onGetStarted("signUp")} style={{ ...primaryBtnStyle, padding: "9px 18px", fontSize: 13.5 }}>
            {t("landing.ctaSignUp")} →
          </button>
        </div>
      </div>

      {/* Hero: two columns on desktop */}
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "56px 24px 40px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 48,
        }}
      >
        <div style={{ flex: "1 1 420px", minWidth: 300 }}>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 50px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 18 }}>
            {t("landing.headline")}
          </h1>
          <p style={{ fontSize: 16.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 28, maxWidth: 480 }}>
            {t("landing.subheadline")}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => onGetStarted("signUp")} style={primaryBtnStyle}>
              {t("landing.ctaSignUp")} →
            </button>
            <button
              onClick={() => onGetStarted("signIn")}
              style={{ padding: "12px 26px", background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-dark)", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              {t("landing.ctaSignIn")}
            </button>
          </div>
          <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>{t("landing.microcopy")}</div>
        </div>

        <div style={{ flex: "1 1 420px", minWidth: 300 }}>
          <BoardMockup />
        </div>
      </div>

      {/* Feature cards */}
      <div
        style={{
          maxWidth: 1100,
          margin: "16px auto 0",
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 18,
        }}
      >
        {FEATURE_KEYS.map((key) => (
          <div
            key={key}
            style={{
              background: "var(--bg-modal)",
              border: "1px solid var(--border-color)",
              borderRadius: 14,
              padding: "22px 20px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: `${FEATURE_COLORS[key]}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                marginBottom: 14,
              }}
            >
              {FEATURE_ICONS[key]}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t(`landing.${key}Title`)}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{t(`landing.${key}Desc`)}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "44px 24px 32px", fontSize: 12, color: "var(--text-muted)" }}>
        {t("landing.footer")}
      </div>
    </div>
  );
}

// Stylized, hand-built mock of the board table view (framed like a browser
// window) — stands in for a real product screenshot without needing image
// assets, using the same status-color language the actual app uses.
function BoardMockup() {
  const rows = [
    { name: "UI Redesign", status: "Open", statusColor: "#3b82f6", progress: 65 },
    { name: "API Integration", status: "Stuck", statusColor: "#ef4444", progress: 20 },
    { name: "QA Testing", status: "On Hold", statusColor: "#f59e0b", progress: 40 },
  ];
  const rows2 = [
    { name: "Client Handover", status: "Closed", statusColor: "#16a34a", progress: 100 },
  ];

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid var(--border-color)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        overflow: "hidden",
        background: "var(--bg-modal)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderBottom: "1px solid var(--border-color)" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a" }} />
        <div style={{ flex: 1, marginLeft: 10, height: 18, borderRadius: 5, background: "var(--bg-hover)" }} />
      </div>

      <div style={{ padding: 16 }}>
        <GroupBlock color="#3b82f6" label="Engineering" rows={rows} />
        <div style={{ height: 12 }} />
        <GroupBlock color="#a855f7" label="Commissioning" rows={rows2} />
      </div>
    </div>
  );
}

function GroupBlock({ color, label, rows }) {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: 4, borderRadius: 2, background: color, marginRight: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color, marginBottom: 8 }}>{label}</div>
        {rows.map((r) => (
          <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: 12.5, flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "#fff",
                background: r.statusColor,
                borderRadius: 5,
                padding: "3px 8px",
                whiteSpace: "nowrap",
              }}
            >
              {r.status}
            </span>
            <div style={{ width: 60, height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden", flexShrink: 0 }}>
              <div style={{ width: `${r.progress}%`, height: "100%", background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
