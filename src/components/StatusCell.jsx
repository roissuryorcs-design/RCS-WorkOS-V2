import { useState, useRef } from "react";
import Popover from "./Popover";
import { useLanguage } from "../context/LanguageContext";
import { getDefaultStatusKey } from "../i18n/defaults";

// Status is independent per item — unlike Progress, it never rolls up from
// or cascades to parent/child items. Every row, regardless of its position
// in the tree, gets its own directly-settable status.
export default function StatusCell({
  columnId,
  status,
  statuses,
  statusOrder,
  onChange,
  onOpenStatusManager,
}) {
  const { t } = useLanguage();
  const defaultStatusKey = getDefaultStatusKey(t);

  // Pastikan statuses dan statusOrder valid
  const safeStatuses = statuses || {};
  const safeStatusOrder = statusOrder && statusOrder.length > 0
    ? statusOrder.filter(s => safeStatuses[s])
    : Object.keys(safeStatuses);

  // Jika masih kosong, beri default
  const finalStatuses = safeStatusOrder.length > 0 ? safeStatusOrder : [defaultStatusKey];
  const usedStatuses = Object.keys(safeStatuses).length > 0 ? safeStatuses : { [defaultStatusKey]: "#9ca3af" };

  const getColor = (s) => usedStatuses[s] || "#9ca3af";
  const currentStatus = status || finalStatuses[0] || defaultStatusKey;
  const currentColor = getColor(currentStatus);

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const handleSelect = (s) => {
    onChange(s);
    setIsOpen(false);
  };

  const handleManage = () => {
    onOpenStatusManager(columnId);
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          padding: "4px 24px 4px 10px",
          borderRadius: 4,
          border: "1px solid var(--border-color)",
          background: currentColor,
          color: "white",
          cursor: "pointer",
          width: "100%",
          fontWeight: 500,
          fontSize: 12,
          minHeight: 28,
          outline: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          textAlign: "left",
          position: "relative",
        }}
      >
        {currentStatus}
        <span
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 10,
            opacity: 0.85,
          }}
        >
          ▾
        </span>
      </button>

      <Popover
        anchorRef={triggerRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom-start"
        style={{
          background: "var(--bg-modal)",
          border: "1px solid var(--border-color)",
          borderRadius: 6,
          boxShadow: "var(--shadow-md)",
          padding: 4,
          minWidth: 170,
        }}
      >
        {finalStatuses.map((s) => (
          <div
            key={s}
            onClick={() => handleSelect(s)}
            style={{
              background: getColor(s),
              color: "white",
              padding: "6px 10px",
              borderRadius: 4,
              marginBottom: 2,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "filter 0.12s ease, box-shadow 0.12s ease",
              outline: s === currentStatus ? "2px solid var(--text-primary)" : "none",
              outlineOffset: "-2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.15)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {s}
          </div>
        ))}

        <div
          onClick={handleManage}
          style={{
            marginTop: 4,
            paddingTop: 6,
            borderTop: "1px solid var(--border-color)",
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 400,
            color: "var(--text-primary)",
            cursor: "pointer",
            borderRadius: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {t("statusCell.manageStatuses")}
        </div>
      </Popover>
    </div>
  );
}
