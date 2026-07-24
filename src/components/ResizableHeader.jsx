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
  isSticky = false,
  stickyLeft = 0,
  isLast = false,
  align = "center",
  showMenuButton = true,
}) {
  // ✅ GUARD: Jika column undefined
  if (!column) {
    return null;
  }

  const [width, setWidth] = useState(column.width || 100);
  const [isResizing, setIsResizing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const thRef = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const isResizingRef = useRef(false);

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const th = thRef.current;
    if (th) {
      th.draggable = false;
      th.style.userSelect = "none";
      th.style.cursor = "col-resize";
    }

    isResizingRef.current = true;
    setIsResizing(true);

    const rect = th?.getBoundingClientRect();
    startX.current = e.clientX;
    startWidth.current = rect?.width || 60;

    const onMove = (ev) => {
      if (!isResizingRef.current) return;
      ev.preventDefault();

      const diff = ev.clientX - startX.current;
      const newWidth = Math.max(40, startWidth.current + diff);

      if (th) {
        th.style.width = newWidth + "px";
      }

      onResize(column.id, newWidth);
      setWidth(newWidth);
    };

    const onUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);

      if (th) {
        th.draggable = true;
        th.style.userSelect = "";
        th.style.cursor = "";
      }

      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const handleDragStart = (e) => {
    if (isResizingRef.current || column.id === "item") {
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
    if (column.id !== "item" && !isResizingRef.current) {
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

  useEffect(() => {
    setWidth(column.width || 100);
    if (thRef.current) {
      thRef.current.style.width = (column.width || 100) + "px";
    }
  }, [column.width]);

  const stickyStyle = isSticky
    ? {
        position: "sticky",
        left: stickyLeft || 0,
        zIndex: 20,
        background: "var(--bg-secondary)",
        boxShadow: "inset -2px 0 0 0 var(--border-color)",
      }
    : {};

  return (
    <th
      ref={thRef}
      draggable={!isResizingRef.current && column.id !== "item"}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: `${width}px`,
        minWidth: 40,
        maxWidth: `${width}px`,
        padding: "8px 8px",
        borderRight: isLast ? "none" : "2px solid var(--border-color)",
        position: "relative",
        userSelect: "none",
        cursor: isResizingRef.current ? "col-resize" : "default",
        background: "transparent",
        transition: "background 0.15s",
        pointerEvents: "auto",
        textAlign: align || "center",
        ...stickyStyle,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          pointerEvents: isResizingRef.current ? "none" : "auto",
          width: "100%",
        }}
      >
        {/* TOMBOL ⋮ DI SEBELAH KIRI TEKS */}
        {showMenuButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-secondary)",
              padding: "0 6px",
              opacity: 0.8,
              transition: "opacity 0.2s, background 0.2s",
              pointerEvents: isResizingRef.current ? "none" : "auto",
              flexShrink: 0,
              borderRadius: "4px",
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = 1;
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = 0.8;
              e.currentTarget.style.background = "transparent";
            }}
            title="Column menu"
          >
            ⋮
          </button>
        )}

        {/* TEKS HEADER */}
        <span
          style={{
            flex: 1,
            textAlign: align || "center",
          }}
        >
          {children}
        </span>

        {/* SPACER KOSONG UNTUK KOLOM TANPA ⋮ */}
        {!showMenuButton && <span style={{ width: 28, flexShrink: 0 }} />}

        {/* RESIZE HANDLE */}
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: "absolute",
            right: -6,
            top: 0,
            width: 14,
            height: "100%",
            cursor: "col-resize",
            background: isResizingRef.current ? "var(--btn-primary-bg)" : "transparent",
            opacity: isResizingRef.current ? 0.8 : 0,
            transition: "opacity 0.2s, background 0.2s",
            borderRadius: 2,
            zIndex: 20,
            borderLeft: isResizingRef.current ? "2px solid var(--btn-primary-bg)" : "none",
            pointerEvents: "auto",
          }}
          onMouseEnter={(e) => {
            if (!isResizingRef.current) {
              e.currentTarget.style.opacity = 0.6;
              e.currentTarget.style.background = "var(--btn-primary-bg)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizingRef.current) {
              e.currentTarget.style.opacity = 0;
              e.currentTarget.style.background = "transparent";
            }
          }}
        />
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