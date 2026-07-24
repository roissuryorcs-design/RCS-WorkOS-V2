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

  // ✅ PERBAIKAN: Gunakan 'auto' untuk kolom "+"
  const [width, setWidth] = useState(() => {
    if (column.id === 'add-column') {
      return 'auto';
    }
    return column.width || 100;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const thRef = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const isResizingRef = useRef(false);

  const isAddColumn = column.id === 'add-column';

  const handleResizeStart = (e) => {
    // ❌ JANGAN IJIN RESIZE UNTUK KOLOM "+"
    if (isAddColumn) {
      e.preventDefault();
      return;
    }

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
        th.style.setProperty('width', newWidth + 'px', 'important');
        th.style.setProperty('min-width', newWidth + 'px', 'important');
        th.style.setProperty('max-width', newWidth + 'px', 'important');
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
    if (isResizingRef.current || column.id === "item" || isAddColumn) {
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
    if (column.id !== "item" && !isResizingRef.current && !isAddColumn) {
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
    if (!isAddColumn) {
      setWidth(column.width || 100);
      if (thRef.current) {
        thRef.current.style.setProperty('width', (column.width || 100) + 'px', 'important');
        thRef.current.style.setProperty('min-width', (column.width || 100) + 'px', 'important');
        thRef.current.style.setProperty('max-width', (column.width || 100) + 'px', 'important');
      }
    }
  }, [column.width, isAddColumn]);

  const stickyStyle = isSticky
    ? {
        position: "sticky",
        left: stickyLeft || 0,
        zIndex: 20,
        background: "var(--bg-secondary)",
        boxShadow: "inset -2px 0 0 0 var(--border-color)",
      }
    : {};

  // 🔥 JIKA KOLOM "+", RENDER KHUSUS
  if (isAddColumn) {
    return (
      <th
        ref={thRef}
        draggable={false}
        style={{
          width: 'auto',
          minWidth: '50px',
          maxWidth: 'none',
          padding: "8px 4px",
          textAlign: "left",
          cursor: "pointer",
          position: "sticky",
          right: 0,
          zIndex: 20,
          background: "var(--bg-secondary)",
          borderLeft: "2px solid var(--border-color)",
          borderBottom: "2px solid var(--border-color)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        onClick={onResize} // Trigger add column
      >
        <span style={{ fontSize: '18px', fontWeight: 300 }}>+</span>
      </th>
    );
  }

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
        width: typeof width === 'string' ? width : `${width}px`,
        minWidth: 40,
        maxWidth: typeof width === 'string' ? 'none' : `${width}px`,
        padding: "8px 8px",
        borderRight: isLast ? "none" : "2px solid var(--border-color)",
        position: "relative",
        userSelect: "auto",
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

        {/* ✅ RESIZE HANDLE - PAKAI CLASS DAN setProperty */}
        <div
          className="resize-handle"
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