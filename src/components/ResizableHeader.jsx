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
  const isLast = index === totalColumns - 1;

  // ----- RESIZE (Perbaikan) -----
  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Resize started for column:", column.id);
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = thRef.current?.offsetWidth || column.width;
    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e) => {
    if (!isResizing) return;
    e.preventDefault();
    const diff = e.clientX - startXRef.current;
    const newWidth = Math.max(30, startWidthRef.current + diff);
    setWidth(newWidth);
    onResize(column.id, (newWidth / thRef.current?.parentElement?.offsetWidth) * 100);
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);
  };

  useEffect(() => {
    setWidth(column.width);
  }, [column.width]);

  // ----- DRAG & DROP (Perbaikan) -----
  const handleDragStart = (e) => {
    if (isAction) {
      e.preventDefault();
      return;
    }
    console.log("Drag start for column:", column.id, "index:", index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    // Tambahkan drag image agar lebih jelas
    if (thRef.current) {
      thRef.current.style.opacity = "0.5";
      e.dataTransfer.setDragImage(thRef.current, 20, 10);
    }
  };

  const handleDragEnd = (e) => {
    console.log("Drag end for column:", column.id);
    setIsDragging(false);
    if (thRef.current) {
      thRef.current.style.opacity = "1";
      thRef.current.style.borderLeft = "none";
      thRef.current.style.background = "transparent";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (thRef.current && !isAction) {
      thRef.current.style.borderLeft = "2px solid var(--btn-primary-bg)";
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
    console.log("Drop on column:", column.id, "index:", index);
    if (thRef.current) {
      thRef.current.style.borderLeft = "none";
      thRef.current.style.opacity = "1";
      thRef.current.style.background = "transparent";
    }
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
    const toIndex = index;
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      console.log("Reordering from", fromIndex, "to", toIndex);
      // Panggil onReorder langsung
      onReorder(fromIndex, toIndex);
    }
    setIsDragging(false);
  };

  // ----- MENU -----
  const toggleMenu = () => {
    console.log("Toggle menu for column:", column.id);
    setShowMenu(!showMenu);
  };

  // ----- RENDER -----
  return (
    <th
      ref={thRef}
      draggable={!isAction}
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
        userSelect: "none",
        cursor: isAction ? "default" : "grab",
        background: isDragging ? "var(--bg-hover)" : "transparent",
        transition: "background 0.2s, opacity 0.2s, border-color 0.2s",
      }}
      title={isAction ? "Fixed column" : "Drag to reorder"}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
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

          {/* Resize handle */}
          <div
            onMouseDown={handleResizeMouseDown}
            style={{
              position: "absolute",
              right: -4,
              top: 0,
              width: 8,
              height: "100%",
              cursor: "col-resize",
              background: isResizing ? "var(--btn-primary-bg)" : "transparent",
              opacity: isResizing ? 0.5 : 0,
              transition: "opacity 0.2s, background 0.2s",
              borderRadius: 2,
              pointerEvents: "auto",
              zIndex: 10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.5)}
            onMouseLeave={(e) => {
              if (!isResizing) e.currentTarget.style.opacity = 0;
            }}
          />
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
