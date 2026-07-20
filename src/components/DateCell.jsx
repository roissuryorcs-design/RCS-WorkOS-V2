// src/components/DateCell.jsx

import { useState, useRef, useEffect } from "react";

export default function DateCell({ date, onChange, placeholder = "dd/mm/ttt" }) {
  const [inputValue, setInputValue] = useState(date || "");
  const [isOpen, setIsOpen] = useState(false);
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

  const handleDateChange = (e) => {
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

  const convertToDateInputValue = (val) => {
    if (!val) return "";
    if (val.includes("/")) {
      const parts = val.split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    if (val.includes("-")) return val;
    return "";
  };

  const dateInputValue = convertToDateInputValue(inputValue) || inputValue;
  const displayText = formatDisplayDate(inputValue);

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 6px",
          borderRadius: "4px",
          transition: "background 0.15s",
          width: "100%",
          minHeight: "32px",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.showPicker?.(), 100);
        }}
      >
        {/* ICON CALENDAR */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            color: "var(--text-secondary)",
            opacity: 0.8,
          }}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>

        {/* DISPLAY DATE */}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: date ? "var(--text-primary)" : "var(--text-muted)",
          }}
        >
          {displayText || placeholder}
        </span>
      </div>

      {/* HIDDEN DATE INPUT */}
      {isOpen && (
        <input
          ref={inputRef}
          type="date"
          value={dateInputValue || ""}
          onChange={handleDateChange}
          className="date-cell-input"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 100,
            padding: "6px",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            background: "var(--bg-modal)",
            color: "var(--text-primary)",
            marginTop: "4px",
            width: "200px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        />
      )}
    </div>
  );
}
