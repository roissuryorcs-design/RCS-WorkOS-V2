import { useState, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import Popover from "./Popover";

export default function LanguageSwitcher() {
  const { language, setLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef(null);

  return (
    <>
      <button ref={btnRef} className="toolbar-lang-btn" onClick={() => setIsOpen((prev) => !prev)}>
        {t(`languageSwitcher.${language}`)} ▾
      </button>

      <Popover
        anchorRef={btnRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom-end"
        style={{
          background: "var(--bg-modal)",
          border: "1px solid var(--border-color)",
          borderRadius: 6,
          boxShadow: "var(--shadow-md)",
          padding: "4px 0",
          minWidth: 150,
          color: "var(--text-primary)",
        }}
      >
        {languages.map((code) => {
          const isActive = code === language;
          return (
            <button
              key={code}
              onClick={() => {
                setLanguage(code);
                setIsOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                padding: "6px 14px",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 13,
                color: isActive ? "var(--btn-primary-bg)" : "var(--text-primary)",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span style={{ width: 14, flexShrink: 0 }}>{isActive ? "✓" : ""}</span>
              {t(`languageSwitcher.${code}`)}
            </button>
          );
        })}
      </Popover>
    </>
  );
}
