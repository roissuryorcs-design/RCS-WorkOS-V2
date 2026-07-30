import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import "../css/toolbar.css";

export default function Toolbar({
  search,
  onSearchChange,
  onUndo,
  onExport,
  canUndo,
  onOpenColumnManager, // ← Manage Columns tetap
}) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="toolbar-sticky">
      <input
        className="toolbar-search"
        placeholder={t("toolbar.searchPlaceholder")}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="toolbar-undo-btn"
        style={{
          opacity: canUndo ? 1 : 0.5,
          cursor: canUndo ? "pointer" : "not-allowed",
        }}
      >
        {t("toolbar.undo")}
      </button>

      <button className="toolbar-export-btn" onClick={onExport}>
        {t("toolbar.export")}
      </button>

      {/* Manage Columns - TETAP */}
      <button className="toolbar-column-btn" onClick={onOpenColumnManager}>
        {t("toolbar.manageColumns")}
      </button>

      <button onClick={toggleTheme} className="toolbar-theme-btn">
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>

      <LanguageSwitcher />
    </div>
  );
}
