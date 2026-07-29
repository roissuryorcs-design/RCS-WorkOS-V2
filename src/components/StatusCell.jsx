import { useState, useRef } from "react";
import Popover from "./Popover";

// Walks the subtree collecting the status value of every leaf item (an
// item with no children of its own) — intermediate parents don't have a
// "real" manually-set status (they're rollups too), so only leaves count
// toward a parent's cumulative color breakdown.
function collectLeafStatuses(items, columnId) {
  let result = [];
  for (const child of items) {
    const grandchildren = child.children && Array.isArray(child.children) ? child.children : [];
    if (grandchildren.length > 0) {
      result = result.concat(collectLeafStatuses(grandchildren, columnId));
    } else {
      result.push(child[columnId] || null);
    }
  }
  return result;
}

export default function StatusCell({
  columnId,
  status,
  statuses,
  statusOrder,
  itemChildren,
  onChange,
  onOpenStatusManager,
}) {
  // Pastikan statuses dan statusOrder valid
  const safeStatuses = statuses || {};
  const safeStatusOrder = statusOrder && statusOrder.length > 0
    ? statusOrder.filter(s => safeStatuses[s])
    : Object.keys(safeStatuses);

  // Jika masih kosong, beri default
  const finalStatuses = safeStatusOrder.length > 0 ? safeStatusOrder : ["Default"];
  const usedStatuses = Object.keys(safeStatuses).length > 0 ? safeStatuses : { Default: "#9ca3af" };

  const getColor = (s) => usedStatuses[s] || "#9ca3af";
  const currentStatus = status || finalStatuses[0] || "Default";
  const currentColor = getColor(currentStatus);

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const hasChildren = itemChildren && itemChildren.length > 0;

  const handleSelect = (s) => {
    onChange(s);
    setIsOpen(false);
  };

  const handleManage = () => {
    onOpenStatusManager(columnId);
    setIsOpen(false);
  };

  // ============================================================
  // PARENT DENGAN CHILDREN — read-only, warna kumulatif dari leaf children
  // ============================================================
  if (hasChildren) {
    const leafStatuses = collectLeafStatuses(itemChildren, columnId);
    const total = leafStatuses.length;

    const counts = {};
    leafStatuses.forEach((s) => {
      const key = s || finalStatuses[0] || "Default";
      counts[key] = (counts[key] || 0) + 1;
    });

    const segments = finalStatuses
      .filter((s) => counts[s] > 0)
      .map((s) => ({ status: s, count: counts[s], color: getColor(s) }));

    const summary = segments.map((seg) => `${seg.status}: ${seg.count}`).join(", ");

    return (
      <div
        title={total > 0 ? summary : "No sub-items with a status yet"}
        style={{
          display: "flex",
          width: "100%",
          minHeight: 28,
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid var(--border-color)",
          cursor: "default",
        }}
      >
        {total > 0 ? (
          segments.map((seg) => (
            <div
              key={seg.status}
              style={{
                width: `${(seg.count / total) * 100}%`,
                background: seg.color,
              }}
            />
          ))
        ) : (
          <div style={{ width: "100%", background: "var(--bg-hover)" }} />
        )}
      </div>
    );
  }

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
          📝 Manage Statuses...
        </div>
      </Popover>
    </div>
  );
}
