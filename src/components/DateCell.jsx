jsx
// src/components/DateCell.jsx
import { useState, useRef, useEffect } from "react";

export default function DateCell({ date, onChange, placeholder = "dd/mm/ttt" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(date || "");
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(date || "");
  }, [date]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (onChange) {
      onChange(value);
    }
    setIsOpen(false);
  };

  const formatDisplayDate = (val) => {
    if (!val) return "";
    if (val.includes("-")) {
      const parts = val.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return val;
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          padding: "4px 6px",
          borderRadius: "4px",
          transition: "background 0.15s",
          width: "100%",
          minHeight: "32px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        onClick={() => {
          setIsOpen(true);
          // Menunggu render sebentar sebelum memicu picker browser
          setTimeout(() => {
            if (inputRef.current) {
               inputRef.current.showPicker?.();
               inputRef.current.focus();
            }
          }, 50);
        }}
      >
        <span
          style={{
            fontSize: "16px",
            lineHeight: 1,
            flexShrink: 0,
            color: "var(--text-secondary)",
            opacity: 0.9,
          }}
        >
          📅
        </span>

        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: date ? "var(--text-primary)" : "var(--text-muted)",
          }}
        >
          {date ? formatDisplayDate(date) : placeholder}
        </span>
      </div>

      {isOpen && (
        jsx
<input
  ref={inputRef}
  type="date"
  value={inputValue || ""}
  onChange={handleDateSelect}
  style={{
    position: "absolute",
    top: "100%",
    left: 0,
    zIndex: 100,
    padding: "6px",
    background: "var(--bg-modal)",
    color: "var(--text-primary)",
    colorScheme: "dark", // Pastikan huruf 'S' besar (camelCase)
    WebkitColorScheme: "dark", // Untuk kompatibilitas beberapa versi safari/chrome
  }}
/>
      )}
    </div>
  );
}
