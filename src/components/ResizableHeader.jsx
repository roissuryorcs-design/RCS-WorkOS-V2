import { useRef, useState, useEffect } from "react";
import ColumnMenu from "./ColumnMenu";

export default function ResizableHeader({
  column,
  onResize,
  onRename,
  onToggle,
  onDelete,
  children,
  isLast = false,
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [width, setWidth] = useState(column.width);
  const thRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = thRef.current?.offsetWidth || column.width;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    const diff = e.clientX - startXRef.current;
    const newWidth = Math.max(30, startWidthRef.current + diff);
    setWidth(newWidth);
    onResize(column.id, newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    setWidth(column.width);
  }, [column.width]);

  // Toggle menu dan close jika klik di luar
  useEffect(() => {
    if (showMenu) {
      const handleClickOutside = (e) => {
        if (thRef.current && !thRef.current.contains(e.target)) {
          setShowMenu(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  return (
    <th
      ref={thRef}
      style={{
        padding: "8px 8px",
        width: `${width}%`,
        borderRight: isLast ? "none" : "2px solid var(--border-color)",
        position: "relative",
        minWidth: 60,
        userSelect: "none",
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
          {/* Tombol ⋮ untuk menu kolom */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--text-muted)",
              padding: "0 4px",
              opacity: 0.6,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
          >
            ⋮
          </button>

          {/* Resize handle */}
          <div
            onMouseDown={handleMouseDown}
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
