import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { translateText } from "../utils/translate";

// Small "Translate" link shown under an Update/reply's text — translates
// on demand (not automatically, to stay well within the free API's daily
// word cap) from whichever of the app's 2 languages the viewer *isn't*
// currently using, into the one they are. No language detection: this
// app only has 2 UI languages, so "the other one" is a reasonable
// default matching the described use case (one collaborator writes in
// Indonesian, another reads in English).
export default function TranslateToggle({ text }) {
  const { language, t } = useLanguage();
  const [translated, setTranslated] = useState(null);
  const [showTranslated, setShowTranslated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  if (!text || !text.trim()) return null;

  const targetLang = language;
  const sourceLang = language === "id" ? "en" : "id";

  const handleClick = async () => {
    if (showTranslated) {
      setShowTranslated(false);
      return;
    }
    if (translated) {
      setShowTranslated(true);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const result = await translateText(text, sourceLang, targetLang);
      setTranslated(result);
      setShowTranslated(true);
    } catch (err) {
      console.error("Translate failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showTranslated && translated && (
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 12.5,
            color: "var(--text-secondary)",
            fontStyle: "italic",
            lineHeight: 1.4,
            paddingLeft: 8,
            borderLeft: "2px solid var(--border-dark)",
          }}
        >
          {translated}
        </p>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          fontSize: 10,
          cursor: loading ? "default" : "pointer",
          padding: "0 4px",
          borderRadius: 4,
          fontWeight: 600,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? t("updatePanel.translating") : showTranslated ? t("updatePanel.showOriginal") : t("updatePanel.translate")}
      </button>
      {error && (
        <span style={{ fontSize: 10, color: "#ef4444", marginLeft: 4 }}>{t("updatePanel.translateFailed")}</span>
      )}
    </>
  );
}
