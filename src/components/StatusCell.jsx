import { useState, useRef, useEffect } from "react";

export default function StatusCell({ 
  columnId,
  status,
  statuses,
  statusOrder,
  onChange,
  onOpenStatusManager,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Debug props
  console.log("🔵 StatusCell props:", { columnId, status, statuses, statusOrder, onOpenStatusManager });

  const orderedStatuses = statusOrder && statusOrder.length > 0
    ? statusOrder.filter(s => statuses && statuses[s])
    : Object.keys(statuses || {});

  const getColor = (s) => (statuses && statuses[s]) || "#9ca3af";
  const currentStatus = status || orderedStatuses[0] || "Default";
  const currentColor = getColor(currentStatus);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (s) => {
    console.log("🟢 handleSelect called with:", s, "columnId:", columnId);
    
    if (s === "__manage__") {
      console.log("📝 Opening Status Manager for column:", columnId);
      if (typeof onOpenStatusManager === "function") {
        onOpenStatusManager(columnId);
      } else {
        console.error("❌ onOpenStatusManager is not a function", onOpenStatusManager);
      }
      setIsOpen(false);
      return;
    }
    
    console.log("🔄 Changing status to:", s);
    onChange(s);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Tombol dropdown */}
      <div
        onClick={() => {
          console.log("🖱️ Dropdown clicked, toggling isOpen");
          setIsOpen(!isOpen);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 4,
          border: "1px solid var(--border-color)",
          background: currentColor,
          color: "white",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: 12,
          minHeight: 28,
          transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <span style={{ flex: 1, textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
          {currentStatus}
        </span>
        <span style={{ fontSize: 10, opacity: 0.8, textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>▾</span>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 8,
            boxShadow: "0 8px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)",
            zIndex: 50,
            maxHeight: 240,
            overflowY: "auto",
            padding: "6px 0",
            minWidth: "150px",
          }}
        >
          {orderedStatuses.map((s) => (
            <div
              key={s}
              onClick={() => handleSelect(s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                cursor: "pointer",
                background: status === s ? "var(--bg-hover)" : "transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => {
                if (status !== s) e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: getColor(s),
                  flexShrink: 0,
                  border: "1px solid var(--border-color)",
                }}
              />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>{s}</span>
              {status === s && (
                <span style={{ color: "var(--btn-primary-bg)", fontSize: 14, fontWeight: 600 }}>✓</span>
              )}
            </div>
          ))}

          <div style={{ borderTop: "1px solid var(--border-color)", margin: "4px 12px" }} />

          <div
            onClick={() => handleSelect("__manage__")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 13,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span>📝</span>
            <span>Manage Statuses...</span>
          </div>
        </div>
      )}
    </div>
  );
}
