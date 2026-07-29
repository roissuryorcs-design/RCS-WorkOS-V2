import { useState, useLayoutEffect, useCallback } from "react";

const GAP = 4;
const VIEWPORT_MARGIN = 8;

// Computes a `position:fixed` top/left for a popup anchored to a trigger
// element, flipping above/right when the preferred side would overflow the
// viewport, then clamping as a last resort so the popup is always fully
// on-screen. Works with any anchor/popup pair, including portaled popups
// that need to escape a `overflow:auto` ancestor (table scroll container,
// sidebar, nested popups, etc) — since position is computed from
// getBoundingClientRect(), it's correct regardless of DOM nesting.
export function usePopoverPosition(anchorRef, popupRef, isOpen, { placement = "bottom-start" } = {}) {
  const [style, setStyle] = useState({ position: "fixed", top: -9999, left: -9999, visibility: "hidden", zIndex: 3000 });

  const recompute = useCallback(() => {
    const anchor = anchorRef.current;
    const popup = popupRef.current;
    if (!anchor || !popup) return;

    const anchorRect = anchor.getBoundingClientRect();
    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top, left;

    if (placement === "right-start" || placement === "left-start") {
      // Horizontal-primary: prefer beside the anchor (right by default),
      // flip to the other side if that would overflow, then clamp.
      left = placement === "left-start" ? anchorRect.left - GAP - popupWidth : anchorRect.right + GAP;
      if (left + popupWidth > vw - VIEWPORT_MARGIN || left < VIEWPORT_MARGIN) {
        const flipped = placement === "left-start" ? anchorRect.right + GAP : anchorRect.left - GAP - popupWidth;
        if (flipped >= VIEWPORT_MARGIN && flipped + popupWidth <= vw - VIEWPORT_MARGIN) {
          left = flipped;
        }
      }
      left = Math.min(Math.max(left, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vw - VIEWPORT_MARGIN - popupWidth));

      top = anchorRect.top;
      if (top + popupHeight > vh - VIEWPORT_MARGIN) {
        top = Math.max(VIEWPORT_MARGIN, vh - VIEWPORT_MARGIN - popupHeight);
      }
    } else {
      // Vertical-primary: prefer below the anchor, flip above if that would
      // overflow the bottom edge, then clamp as a last resort.
      top = anchorRect.bottom + GAP;
      if (top + popupHeight > vh - VIEWPORT_MARGIN) {
        const above = anchorRect.top - GAP - popupHeight;
        top = above >= VIEWPORT_MARGIN ? above : Math.max(VIEWPORT_MARGIN, vh - VIEWPORT_MARGIN - popupHeight);
      }

      // "bottom-start" aligns to the anchor's left edge, "bottom-end"
      // aligns to the anchor's right edge — then clamp.
      left = placement === "bottom-end" ? anchorRect.right - popupWidth : anchorRect.left;
      if (left + popupWidth > vw - VIEWPORT_MARGIN) {
        left = vw - VIEWPORT_MARGIN - popupWidth;
      }
      if (left < VIEWPORT_MARGIN) {
        left = VIEWPORT_MARGIN;
      }
    }

    // Bail out (return the same object) when nothing actually changed —
    // this is what breaks the render loop when callers pass a fresh
    // `{ current: el }` wrapper on every render (identity changes, so this
    // callback's own identity changes too, re-triggering the effect below;
    // without this equality check that cascades into "Maximum update depth
    // exceeded").
    setStyle((prev) => {
      if (prev.top === top && prev.left === left && prev.visibility === "visible") {
        return prev;
      }
      return { position: "fixed", top, left, visibility: "visible", zIndex: 3000 };
    });
  }, [anchorRef, popupRef, placement]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [isOpen, recompute]);

  return style;
}
