import { useState, useRef, useEffect } from "react";

export default function StatusCell({ status, statuses, statusOrder, onChange, onOpenStatusManager }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Urutan status berdasarkan statusOrder, fallback ke Object.keys
  const orderedStatuses = statusOrder && statusOrder.length > 0
    ? statusOrder.filter(s => statuses[s])
    : Object.keys(statuses);

  const getColor = (s) => statuses[s] || "#9ca3af";
  const currentColor = getColor(status || orderedStatuses[0] || "Default");

  // Tutup dropdown saat klik di luar
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
    if (s === "__manage__") {
      onOpenStatusManager();
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
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 8px",
          borderRadius: 4,
          border: "1px solid #d1d5db",
          background: currentColor,
          color: "white",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: 12,
          minHeight: 28,
          position: "relative",
          transition: "background 0.2s",
        }}
      >
        <span style={{ flex: 1 }}>{status || orderedStatuses[0] || "Default"}</span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
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
            borderRadius: 6,
            boxShadow: "var(--shadow-md)",
            zIndex: 50,
            maxHeight: 200,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {orderedStatuses.map((s) => (
            <div
              key={s}
              onClick={() => handleSelect(s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                cursor: "pointer",
                background: status === s ? "var(--bg-hover)" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => {
                if (status !== s) e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: getColor(s),
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>{s}</span>
              {status === s && (
                <span style={{ color: "var(--btn-primary-bg)", fontSize: 14 }}>✓</span>
              )}
            </div>
          ))}

          {/* Garis pemisah */}
          <div style={{ borderTop: "1px solid var(--border-color)", margin: "4px 8px" }} />

          {/* Opsi Manage Statuses */}
          <div
            onClick={() => handleSelect("__manage__")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 13,
              transition: "background 0.15s",
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
