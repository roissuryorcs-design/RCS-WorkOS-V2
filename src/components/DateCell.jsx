// src/components/DateCell.jsx

import { useState, useRef, useEffect } from "react";

export default function DateCell({ date, onChange, placeholder = "dd/mm/ttt" }) {
  const [inputValue, setInputValue] = useState(date || "");
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(date || "");
  }, [date]);

  const handleDateChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (onChange) {
      onChange(value);
    }
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

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 6px",
          borderRadius: "4px",
          transition: "background 0.15s",
          width: "100%",
          minHeight: "32px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <input
          ref={inputRef}
          type="date"
          value={dateInputValue || ""}
          onChange={handleDateChange}
          placeholder={placeholder}
          className="date-cell-input"
          style={{
            width: "100%",
            padding: "4px 2px",
            fontSize: "13px",
            color: "var(--text-primary)",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "inherit",
            cursor: "pointer",
            minHeight: "28px",
          }}
        />
      </div>
    </div>
  );
}
