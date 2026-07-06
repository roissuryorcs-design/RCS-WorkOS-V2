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

  // Pastikan statuses dan statusOrder valid
  const safeStatuses = statuses || {};
  const safeStatusOrder = statusOrder && statusOrder.length > 0
    ? statusOrder.filter(s => safeStatuses[s])
    : Object.keys(safeStatuses);

  // Jika masih kosong, beri default
  const finalStatuses = safeStatusOrder.length > 0 ? safeStatusOrder : ["Default"];
  const defaultStatuses = { Default: "#9ca3af" };
  const usedStatuses = Object.keys(safeStatuses).length > 0 ? safeStatuses : defaultStatuses;

  const getColor = (s) => usedStatuses[s] || "#9ca3af";
  const currentStatus = status || finalStatuses[0] || "Default";
  const currentColor = getColor(currentStatus);

  // Debug
  console.log("🔵 StatusCell render:", { 
    isOpen, 
    finalStatuses, 
    usedStatuses, 
    currentStatus,
    columnId 
  });

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
    console.log("🟢 handleSelect called with:", s);
    if (s === "__manage__") {
      if (typeof onOpenStatusManager === "function") {
        onOpenStatusManager(columnId);
      }
      setIsOpen(false);
      return;
    }
    onChange(s);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Tombol dropdown */}
      <div
        onClick={() => {
          console.log("🖱️ Dropdown clicked, current isOpen:", isOpen);
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
        }}
      >
        <span style={{ flex: 1 }}>{currentStatus}</span>
        <span style={{ fontSize: 10, opacity: 0.8 }}>▾</span>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            zIndex: 9999,
            maxHeight: 240,
            overflowY: "auto",
            padding: "6px 0",
            minWidth: "150px",
          }}
        >
          {finalStatuses.map((s) => (
            <div
              key={s}
              onClick={() => handleSelect(s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                cursor: "pointer",
                background: status === s ? "#f3f4f6" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
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
                  border: "1px solid #e5e7eb",
                }}
              />
              <span style={{ flex: 1, fontSize: 13, color: "#1a1a2e" }}>{s}</span>
              {status === s && (
                <span style={{ color: "#3b82f6", fontSize: 14 }}>✓</span>
              )}
            </div>
          ))}

          <div style={{ borderTop: "1px solid #e5e7eb", margin: "4px 12px" }} />

          <div
            onClick={() => handleSelect("__manage__")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              cursor: "pointer",
              color: "#6b7280",
              fontSize: 13,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
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
