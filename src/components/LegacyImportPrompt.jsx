import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { hasLegacyData, isAlreadyImported, markLegacyImportDone, importLegacyBoards } from "../utils/importLegacyBoards";

// Shown once per account, the first time this browser is opened
// post-login and still has pre-Supabase localStorage board data sitting
// around unimported. Dismissing (in any way) marks it done so it won't
// nag again — re-importing on every login would duplicate boards, since
// there's no "already imported this one" tracking at the board level.
export default function LegacyImportPrompt() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | importing | done | error

  useEffect(() => {
    if (!user) return;
    if (hasLegacyData() && !isAlreadyImported(user.id)) {
      setVisible(true);
    }
  }, [user]);

  if (!visible) return null;

  const handleImport = async () => {
    setStatus("importing");
    const result = await importLegacyBoards(user.id);
    if (result.imported) {
      setStatus("done");
    } else if (result.reason === "empty" || result.reason === "no-legacy-data") {
      markLegacyImportDone(user.id);
      setVisible(false);
    } else {
      setStatus("error");
    }
  };

  const handleDismiss = () => {
    markLegacyImportDone(user.id);
    setVisible(false);
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "var(--bg-modal)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 420,
          width: "90%",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
        }}
      >
        <h3 style={{ marginBottom: 8, fontSize: 16, fontWeight: 600 }}>{t("legacyImport.title")}</h3>

        {status === "idle" && (
          <>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>{t("legacyImport.hint")}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleDismiss}
                style={{ flex: 1, padding: "8px", background: "var(--bg-hover)", border: "none", borderRadius: 6, cursor: "pointer", color: "var(--text-secondary)" }}
              >
                {t("legacyImport.skipBtn")}
              </button>
              <button
                onClick={handleImport}
                style={{ flex: 1, padding: "8px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}
              >
                {t("legacyImport.importBtn")}
              </button>
            </div>
          </>
        )}

        {status === "importing" && (
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("legacyImport.importing")}</p>
        )}

        {status === "done" && (
          <>
            <p style={{ fontSize: 13, color: "#22c55e", marginBottom: 16 }}>{t("legacyImport.doneHint")}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ width: "100%", padding: "8px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}
            >
              {t("legacyImport.reloadBtn")}
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 16 }}>{t("legacyImport.errorHint")}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleDismiss}
                style={{ flex: 1, padding: "8px", background: "var(--bg-hover)", border: "none", borderRadius: 6, cursor: "pointer", color: "var(--text-secondary)" }}
              >
                {t("legacyImport.skipBtn")}
              </button>
              <button
                onClick={handleImport}
                style={{ flex: 1, padding: "8px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}
              >
                {t("legacyImport.retryBtn")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
