import { useLanguage } from "../context/LanguageContext";

const TABS = [
  { id: "table", icon: "📋" },
  { id: "dashboard", icon: "📊" },
];

export default function ViewTabs({ currentView, onChange }) {
  const { t } = useLanguage();

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "0 24px",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${isActive ? "var(--btn-primary-bg)" : "transparent"}`,
              marginBottom: -1,
              color: isActive ? "var(--btn-primary-bg)" : "var(--text-secondary)",
              fontWeight: isActive ? 600 : 500,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <span>{tab.icon}</span>
            {t(`app.view${tab.id.charAt(0).toUpperCase()}${tab.id.slice(1)}`)}
          </button>
        );
      })}
    </div>
  );
}
