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
}) {
  // ... (semua state dan fungsi tetap sama)

  // ============================================================
  // STICKY – dengan border menggunakan box-shadow
  // ============================================================
  const stickyStyle = isSticky
    ? {
        position: "sticky",
        left: stickyLeft || 0,
        zIndex: 20,
        background: "var(--bg-secondary)",
        // Gunakan box-shadow untuk border kanan
        boxShadow: "inset -2px 0 0 0 var(--border-color)",
      }
    : {};

  // ... (render)
}
