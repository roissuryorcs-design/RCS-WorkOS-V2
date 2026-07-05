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
  const [isResizing, setIsResizing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [width, setWidth] = useState(column.width);
  const [isDragging, setIsDragging] = useState(false);
  const thRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const isAction = column.id === "action";
  const isItem = column.id === "item";
  const isLast = index === totalColumns - 1;

  // ============================================================
  // RESIZE (Dengan event yang lebih robust)
  // ============================================================
  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("🟢 Resize MOUSE DOWN for column:", column.id);
    
    if (thRef.current) {
      thRef.current.draggable = false;
      thRef.current.style.userSelect = "none";
    }
    
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = thRef.current?.getBoundingClientRect().width || 60;
    console.log("📐 Start width (px):", startWidthRef.current);
    
    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e) => {
    if (!isResizing) return;
    e.preventDefault();
    
    const diff = e.clientX - startXRef.current;
    const newWidthPx = Math.max(40, startWidthRef.current + diff);
    
    // Hitung persen berdasarkan parent tabel
    const parentWidth = thRef.current?.parentElement?.offsetWidth || 800;
    const newWidthPercent = Math.min(50, Math.max(5, (newWidthPx / parentWidth) * 100));
    
    console.log(`📐 Resize: ${newWidthPx}px → ${newWidthPercent.toFixed(1)}%`);
    
    setWidth(newWidthPercent);
    onResize(column.id, newWidthPercent);
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
    console.log("🔴 Resize MOUSE UP for column:", column.id);
    
    if (thRef.current) {
      thRef.current.draggable = true;
      thRef.current.style.userSelect = "";
    }
    
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);
  };

  // ============================================================
  // DRAG & DROP (ITEM tidak bisa di-drag)
  // ============================================================
  const handleDragStart = (e) => {
    if (isAction || isResizing || isItem) {
      e.preventDefault();
      console.log(`⛔ Drag blocked for ${column.id}`);
      return;
    }
    console.log("🟢 Drag start for column:", column.id, "index:", index);
    setIsDragging(true);
    
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({
      fromIndex: index,
      columnId: column.id
    }));
    
    if (thRef.current) {
      thRef.current.style.opacity = "0.4";
      thRef.current.style.background = "var(--bg-hover)";
    }
  };

  const handleDragEnd = (e) => {
    console.log("🔴 Drag end for column:", column.id);
    setIsDragging(false);
    if (thRef.current) {
      thRef.current.style.opacity = "1";
      thRef.current.style.background = "transparent";
      thRef.current.style.borderLeft = "none";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (thRef.current && !isAction && !isResizing && !isItem) {
      thRef.current.style.borderLeft = "3px solid var(--btn-primary-bg)";
      thRef.current.style.background = "var(--bg-hover)";
    }
  };

  const handleDragLeave = (e) => {
    if (thRef.current) {
      thRef.current.style.borderLeft = "none";
      thRef.current.style.background = "transparent";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    console.log("🟢 Drop on column:", column.id, "index:", index);
    
    if (thRef.current) {
      thRef.current.style.borderLeft = "none";
      thRef.current.style.background = "transparent";
      thRef.current.style.opacity = "1";
    }
    
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const fromIndex = data.fromIndex;
      
      if (fromIndex !== undefined && fromIndex !== index) {
        console.log(`🔄 Reordering from ${fromIndex} to ${index}`);
        onReorder(fromIndex, index);
      }
    } catch (err) {
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
      if (!isNaN(fromIndex) && fromIndex !== index) {
        console.log(`🔄 Reordering from ${fromIndex} to ${index} (fallback)`);
        onReorder(fromIndex, index);
      }
    }
    
    setIsDragging(false);
  };

  // ============================================================
  // MENU
  // ============================================================
  const toggleMenu = () => {
    console.log("🟢 Toggle menu for column:", column.id);
    setShowMenu(!showMenu);
  };

  // ============================================================
  // RENDER
  // ============================================================
  const cursorType = isAction ? "default" : isItem ? "default" : isResizing ? "col-resize" : "grab";

  return (
    <th
      ref={thRef}
      draggable={!isAction && !isResizing && !isItem}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        padding: "8px 8px",
        width: `${width}%`,
        borderRight: isLast ? "none" : "2px solid var(--border-color)",
        position: "relative",
        minWidth: 60,
        maxWidth: `${width}%`,
        userSelect: "none",
        cursor: cursorType,
        background: isDragging ? "var(--bg-hover)" : "transparent",
        transition: "background 0.2s, opacity 0.2s, border-color 0.2s",
        pointerEvents: isResizing ? "auto" : "auto",
      }}
      title={isAction ? "Fixed column" : isItem ? "Protected column (cannot delete/drag/hide)" : isResizing ? "Resizing..." : "Drag to reorder"}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          pointerEvents: isResizing ? "none" : "auto",
        }}
      >
        <span style={{ pointerEvents: "none" }}>{children}</span>

        <div style={{ display: "flex", alignItems: "center", pointerEvents: "none" }}>
          {/* Tombol ⋮ */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--text-muted)",
              padding: "0 4px",
              opacity: 0.6,
              transition: "opacity 0.2s",
              pointerEvents: "auto",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
          >
            ⋮
          </button>

          {/* Resize handle - hanya untuk non-action */}
          {!isAction && (
            <div
              onMouseDown={handleResizeMouseDown}
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
                pointerEvents: "auto",
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
