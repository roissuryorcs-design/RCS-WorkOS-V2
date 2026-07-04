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

  // ----- RESIZE -----
  const handleResizeMouseDown = (e) => {
    console.log("Resize started for column:", column.id); // ← DEBUG
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = thRef.current?.offsetWidth || column.width;
    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeMouseUp);
    e.preventDefault();
  };

  const handleResizeMouseMove = (e) => {
    if (!isResizing) return;
    const diff = e.clientX - startXRef.current;
    const newWidth = Math.max(30, startWidthRef.current + diff);
    setWidth(newWidth);
    onResize(column.id, newWidth);
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);
  };

  useEffect(() => {
    setWidth(column.width);
  }, [column.width]);

  // ----- DRAG & DROP -----
  const handleDragStart = (e) => {
    if (isAction) {
      e.preventDefault();
      return;
    }
    console.log("Drag start for column:", column.id, "index:", index); // ← DEBUG
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    if (thRef.current) {
      thRef.current.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e) => {
    console.log("Drag end for column:", column.id); // ← DEBUG
    setIsDragging(false);
    if (thRef.current) {
      thRef.current.style.opacity = "1";
      thRef.current.style.borderLeft = "none";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // ← PENTING: diperlukan untuk drop
    e.dataTransfer.dropEffect = "move";
    if (thRef.current && !isAction) {
      thRef.current.style.borderLeft = "2px solid var(--btn-primary-bg)";
    }
  };

  const handleDragLeave = (e) => {
    if (thRef.current) {
      thRef.current.style.borderLeft = "none";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    console.log("Drop on column:", column.id, "index:", index); // ← DEBUG
    if (thRef.current) {
      thRef.current.style.borderLeft = "none";
      thRef.current.style.opacity = "1";
    }
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
    const toIndex = index;
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      console.log("Reordering from", fromIndex, "to", toIndex); // ← DEBUG
      onReorder(fromIndex, toIndex);
    }
    setIsDragging(false);
  };

  // ----- MENU -----
  const toggleMenu = () => {
    console.log("Toggle menu for column:", column.id); // ← DEBUG
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
        transition: "background 0.2s, opacity 0.2s",
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
          {/* Tombol ⋮ untuk menu kolom */}
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
              transition: "opacity 0.2s",
              borderRadius: 2,
              pointerEvents: "auto",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.5)}
            onMouseLeave={(e) => {
              if (!isResizing) e.currentTarget.style.opacity = 0;
            }}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
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
