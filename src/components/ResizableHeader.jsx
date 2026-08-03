import { useRef, useState, useEffect } from "react";
import ColumnMenu from "./ColumnMenu";

let draggedColumn = null;

export default function ResizableHeader({
  column,
  index,
  totalColumns,
  onResize,
  onRename,
  onToggle,
  onDelete,
  onReorder,
  onOpenFormula,
  children,
  isSticky = false,
  stickyLeft = 0,
  isLast = false,
  align = "center",
  showMenuButton = true,
  headerColor, // ✅ PROP BARU
  tooltip,
}) {
  if (!column) return null;

  const [width, setWidth] = useState(column.width || 100);
  const [isResizing, setIsResizing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const thRef = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const isResizingRef = useRef(false);

  const isItemColumn = column.id === "item";
  const isDraggable = !isResizing && !isItemColumn;

  // The Item column is also the sticky/frozen one — on a narrow phone
  // screen, a desktop-set width (often 200-300px+) can alone consume
  // nearly the whole viewport, leaving no room for anything else to
  // appear even after scrolling. Since this width is applied straight
  // to the DOM as an !important inline style (see below), no CSS rule
  // can ever override it — the cap has to happen right here.
  const MOBILE_BREAKPOINT = 768;
  const MOBILE_ITEM_MAX_WIDTH = 91;
  const effectiveWidth = (w) =>
    isItemColumn && window.innerWidth <= MOBILE_BREAKPOINT ? Math.min(w, MOBILE_ITEM_MAX_WIDTH) : w;

  const applyWidth = (th, newWidth) => {
    if (!th) return;
    const w = effectiveWidth(newWidth);
    // ✅ setProperty(..., 'important') supaya menang melawan rule CSS
    // lain yang juga pakai !important (mis. width kolom di board-table).
    th.style.setProperty("width", `${w}px`, "important");
    th.style.setProperty("min-width", `${w}px`, "important");
    th.style.setProperty("max-width", `${w}px`, "important");
  };

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
    startWidth.current = rect?.width || width;

    const onMove = (ev) => {
      if (!isResizingRef.current) return;
      ev.preventDefault();

      const diff = ev.clientX - startX.current;
      const newWidth = Math.max(40, Math.round(startWidth.current + diff));

      applyWidth(th, newWidth);
      setWidth(newWidth);
      onResize(column.id, newWidth);
    };

    const onUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);

      if (th) {
        th.draggable = isDraggable;
        th.style.userSelect = "";
        th.style.cursor = "";
      }

      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  useEffect(() => {
    setWidth(column.width || 100);
    applyWidth(thRef.current, column.width || 100);
  }, [column.width]);

  // Re-caps on rotate/resize (not just on mount) — otherwise turning the
  // phone sideways past the breakpoint, or resizing a desktop window
  // down, wouldn't re-trigger the mobile cap until something else
  // happened to touch column.width.
  useEffect(() => {
    if (!isItemColumn) return;
    const onResize = () => applyWidth(thRef.current, column.width || 100);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isItemColumn, column.width]);

  const handleDragStart = (e) => {
    if (!isDraggable) return;
    e.dataTransfer.setData("text/plain", column.id);
    draggedColumn = { id: column.id, index };
    e.currentTarget.style.opacity = "0.4";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    draggedColumn = null;
  };

  const handleDragOver = (e) => {
    if (!draggedColumn || isItemColumn) return;
    e.preventDefault();
  };

  const handleDrop = (e) => {
    if (isItemColumn) return;
    e.preventDefault();
    if (!draggedColumn || draggedColumn.id === column.id) return;
    onReorder(draggedColumn.index, index);
    draggedColumn = null;
  };

  return (
    <th
      ref={thRef}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        padding: "8px",
        textAlign: align,
        cursor: isDraggable ? "grab" : "default",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {showMenuButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: headerColor || "var(--text-secondary)", // ✅ WARNA IKUT GROUP
            }}
          >
            ⋮
          </button>
        )}

        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontWeight: 700,
            color: headerColor || "#ffffff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: align === "left" ? "left" : "center",
          }}
        >
          {children}
        </span>

        {tooltip && (
          <span
            title={tooltip}
            style={{
              flexShrink: 0,
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: `1px solid ${headerColor || "var(--text-secondary)"}`,
              color: headerColor || "var(--text-secondary)",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "12px",
              textAlign: "center",
              cursor: "help",
              userSelect: "none",
            }}
          >
            i
          </span>
        )}
      </div>

      {showMenu && (
        <ColumnMenu
          column={column}
          anchorRef={thRef}
          onRename={onRename}
          onToggle={onToggle}
          onDelete={onDelete}
          onOpenFormula={onOpenFormula}
          onClose={() => setShowMenu(false)}
        />
      )}

      {/* RESIZE HANDLE */}
      <div
        className="resize-handle"
        onMouseDown={handleResizeStart}
        onDragStart={(e) => e.preventDefault()}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 8,
          height: "100%",
          cursor: "col-resize",
          userSelect: "none",
          zIndex: 30,
        }}
      />
    </th>
  );
}