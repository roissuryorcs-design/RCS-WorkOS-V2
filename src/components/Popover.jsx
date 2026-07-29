import { useRef } from "react";
import { createPortal } from "react-dom";
import { usePopoverPosition } from "../hooks/usePopoverPosition";

// Generic click-triggered popup: portals to document.body (escapes any
// overflow:auto/hidden ancestor), positions itself relative to `anchorRef`
// via usePopoverPosition (flips/clamps to stay on-screen), and closes on
// click-outside via a full-screen transparent overlay.
export default function Popover({ anchorRef, isOpen, onClose, placement = "bottom-start", className = "", style, children }) {
  const popupRef = useRef(null);
  const position = usePopoverPosition(anchorRef, popupRef, isOpen, { placement });

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="tree-node-popup-overlay" onClick={onClose} />
      <div ref={popupRef} className={className} style={{ ...position, ...style }}>
        {children}
      </div>
    </>,
    document.body
  );
}
