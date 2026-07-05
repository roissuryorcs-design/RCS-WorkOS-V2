import { useRef, useState, useEffect } from "react";
import ColumnMenu from "./ColumnMenu";

export default function ResizableHeader({
  column,
  index,
  totalColumns,
  onResize,
  onRename,
  onToggle,
  onDelete,
  onReorder,
  children,
}) {
  const [width, setWidth] = useState(column.width);
  const [isResizing, setIsResizing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const thRef = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const isProtected = column.id === "item" || column.id === "action";
  const isLast = index === totalColumns - 1;

  // ============================================================
  // RESIZE - Perbaikan utama
  // ============================================================
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation(); // ← PENTING: cegah event drag
    console.log("🔵 Resize start:", column.id);

    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = thRef.current?.offsetWidth || 60;

    const onMove = (ev) => {
      if (!isResizing) return;
      ev.preventDefault();
      
      const diff = ev.clientX - startX.current;
      const newWidth = Math.max(40, startWidth.current + diff);
      const parentWidth = thRef.current?.parentElement?.offsetWidth || 800;
      const percent = Math.min(50, Math.max(5, (newWidth / parentWidth) * 100));
      
      console.log(`📐 Resize: ${newWidth}px → ${percent.toFixed(1)}%`);
      
      setWidth(percent);
      onResize(column.id, percent);
    };

    const onUp = () => {
      console.log("🔴 Resize end:", column.id);
      setIsResizing(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  useEffect(() => {
    setWidth(column.width);
  }, [column.width]);

  // ============================================================
  // DRAG & DROP (tetap)
  // ============================================================
  const handleDragStart = (e) => {
    if (isProtected) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ from: index }));
    e.currentTarget.style.opacity = "0.4";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    e.currentTarget.style.borderLeft = "none";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isProtected) {
      e.currentTarget.style.borderLeft = "3px solid var(--btn-primary-bg)";
      e.currentTarget.style.background = "var(--bg-hover)";
    }
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.borderLeft = "none";
    e.currentTarget.style.background = "transparent";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderLeft = "none";
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.opacity = "1";
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.from !== undefined && data.from !== index) {
        onReorder(data.from, index);
      }
    } catch {
      // fallback
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <th
      ref={thRef}
      draggable={!isProtected}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: `${width}%`,
        minWidth: 60,
        maxWidth: `${width}%`,
        padding: "8px 8px",
        borderRight: isLast ? "none" : "2px solid var(--border-color)",
        position: "relative",
        userSelect: "none",
        cursor: isProtected ? "default" : isResizing ? "col-resize" : "grab",
        background: "transparent",
        transition: "background 0.15s, opacity 0.15s",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <span>{children}</span>

        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Tombol Menu */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--text-muted)",
              padding: "0 4px",
              opacity: 0.5,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.5)}
          >
            ⋮
          </button>

          {/* Resize Handle - Hanya untuk non-proteksi */}
          {!isProtected && (
            <div
              onMouseDown={handleResizeStart}
              style={{
                position: "absolute",
                right: -6,
                top: 0,
                width: 14,
                height: "100%",
                cursor: "col-resize",
                background: isResizing ? "var(--btn-primary-bg)" : "transparent",
                opacity: isResizing ? 0.8 : 0,
                transition: "opacity 0.2s, background 0.2s",
                borderRadius: 2,
                zIndex: 20,
                borderLeft: isResizing ? "2px solid var(--btn-primary-bg)" : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = 0.6;
                e.currentTarget.style.background = "var(--btn-primary-bg)";
              }}
              onMouseLeave={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.opacity = 0;
                  e.currentTarget.style.background = "transparent";
                }
              }}
            />
          )}
        </div>
      </div>

      {showMenu && (
        <ColumnMenu
          column={column}
          onRename={onRename}
          onToggle={onToggle}
          onDelete={onDelete}
          onClose={() => setShowMenu(false)}
        />
      )}
    </th>
  );
}
