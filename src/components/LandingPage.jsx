import { useLanguage } from "../context/LanguageContext";
import Logo from "./Logo";

const FEATURE_KEYS = ["feature1", "feature2", "feature3", "feature4"];
const FEATURE_ICONS = { feature1: "🔄", feature2: "📊", feature3: "💬", feature4: "🌐" };

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", maxWidth: 1080, margin: "0 auto" }}>
        <Logo width={90} />
        <button
          onClick={() => setLanguage(language === "id" ? "en" : "id")}
          style={{
            padding: "6px 12px",
            background: "var(--bg-hover)",
            border: "1px solid var(--border-dark)",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12.5,
            color: "var(--text-primary)",
          }}
        >
          {language === "id" ? "🇬🇧 English" : "🇮🇩 Indonesia"}
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
          {t("landing.headline")}
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 32 }}>
          {t("landing.subheadline")}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => onGetStarted("signUp")}
            style={{
              padding: "12px 28px",
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("landing.ctaSignUp")}
          </button>
          <button
            onClick={() => onGetStarted("signIn")}
            style={{
              padding: "12px 28px",
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border-dark)",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("landing.ctaSignIn")}
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1000,
          margin: "24px auto 0",
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {FEATURE_KEYS.map((key) => (
          <div
            key={key}
            style={{
              background: "var(--bg-modal)",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: "20px 18px",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 10 }}>{FEATURE_ICONS[key]}</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 6 }}>{t(`landing.${key}Title`)}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{t(`landing.${key}Desc`)}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "40px 24px", fontSize: 12, color: "var(--text-muted)" }}>
        {t("landing.footer")}
      </div>
    </div>
  );
}
