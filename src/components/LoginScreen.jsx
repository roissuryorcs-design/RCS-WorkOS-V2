import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Logo from "./Logo";

export default function LoginScreen({ initialMode = "signIn", onBack }) {
  const { t } = useLanguage();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState(initialMode); // "signIn" | "signUp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    const result =
      mode === "signIn"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, displayName.trim());
    setSubmitting(false);
    if (result.error) {
      console.error("Auth error:", result.error);
      setError(result.error.message || t("auth.genericError"));
      return;
    }
    if (mode === "signUp") {
      setInfo(t("auth.signUpSuccess"));
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setInfo("");
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 12,
    border: "1px solid var(--border-dark)",
    borderRadius: 6,
    fontSize: 14,
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          width: 360,
          maxWidth: "90vw",
          background: "var(--bg-modal)",
          border: "1px solid var(--border-color)",
          borderRadius: 12,
          boxShadow: "var(--shadow-lg)",
          padding: "28px 28px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Logo width={210} />
        </div>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 12.5,
              marginBottom: 12,
              padding: 0,
            }}
          >
            {t("auth.backToHome")}
          </button>
        )}

        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {mode === "signIn" ? t("auth.signInTitle") : t("auth.signUpTitle")}
        </h2>

        <form onSubmit={handleSubmit}>
          {mode === "signUp" && (
            <input
              type="text"
              placeholder={t("auth.displayNamePlaceholder")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder={t("auth.passwordPlaceholder")}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 12.5,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}
          {info && (
            <div
              style={{
                background: "rgba(34,197,94,0.1)",
                color: "#16a34a",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 12.5,
                marginBottom: 12,
              }}
            >
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "10px",
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? t("auth.loading")
              : mode === "signIn"
              ? t("auth.signInBtn")
              : t("auth.signUpBtn")}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 12.5,
            color: "var(--text-secondary)",
          }}
        >
          {mode === "signIn" ? (
            <>
              {t("auth.noAccount")}{" "}
              <button
                onClick={() => switchMode("signUp")}
                style={{ background: "none", border: "none", color: "var(--btn-primary-bg)", cursor: "pointer", fontWeight: 600, fontSize: 12.5 }}
              >
                {t("auth.switchToSignUp")}
              </button>
            </>
          ) : (
            <>
              {t("auth.haveAccount")}{" "}
              <button
                onClick={() => switchMode("signIn")}
                style={{ background: "none", border: "none", color: "var(--btn-primary-bg)", cursor: "pointer", fontWeight: 600, fontSize: 12.5 }}
              >
                {t("auth.switchToSignIn")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
