import { useState, useRef, useEffect } from "react";

export default function DateCell({ date, onChange, placeholder = "dd/mm/ttt" }) {
  const [inputValue, setInputValue] = useState(date || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(date || "");
  }, [date]);

  // ============================================================
  // FORMAT TANGGAL KE TEXT (dd/mm/yyyy)
  // ============================================================
  const formatDateToText = (val) => {
    if (!val) return "";
    if (val.includes("/")) return val; // Sudah dalam format dd/mm/yyyy
    
    // Jika dari input date (yyyy-mm-dd)
    if (val.includes("-")) {
      const parts = val.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return val;
  };

  // ============================================================
  // KONVERSI KE VALUE UNTUK INPUT DATE (yyyy-mm-dd)
  // ============================================================
  const convertToDateInputValue = (val) => {
    if (!val) return "";
    
    // Jika sudah dalam format dd/mm/yyyy
    if (val.includes("/")) {
      const parts = val.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Jika sudah dalam format yyyy-mm-dd
    if (val.includes("-")) return val;
    
    return "";
  };

  // ============================================================
  // HANDLE PERUBAHAN TANGGAL DARI INPUT DATE
  // ============================================================
  const handleDateChange = (e) => {
    const value = e.target.value;
    // Simpan dalam format dd/mm/yyyy untuk display
    const formattedDate = formatDateToText(value);
    setInputValue(formattedDate);
    
    if (onChange) {
      onChange(formattedDate);
    }
  };

  // ============================================================
  // HANDLE PERUBAHAN TANGGAL DARI TEXT INPUT MANUAL
  // ============================================================
  const handleTextChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Validasi format dd/mm/yyyy
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (datePattern.test(value)) {
      if (onChange) {
        onChange(value);
      }
    }
  };

  // ============================================================
  // HANDLE BLUR - SIMPAN TANGGAL
  // ============================================================
  const handleBlur = () => {
    setIsFocused(false);
    // Coba konversi jika user mengetik manual
    if (inputValue && !inputValue.includes("/")) {
      const converted = formatDateToText(inputValue);
      if (converted && converted !== inputValue) {
        setInputValue(converted);
        if (onChange) {
          onChange(converted);
        }
      }
    }
  };

  // ============================================================
  // TOGGLE DATE PICKER
  // ============================================================
  const toggleDatePicker = (e) => {
    e.stopPropagation();
    setShowDatePicker(!showDatePicker);
    if (!showDatePicker) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.showPicker?.();
        }
      }, 100);
    }
  };

  // ============================================================
  // CLOSE DATE PICKER SAAT KLIK DI LUAR
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDatePicker(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ============================================================
  // RENDER
  // ============================================================
  const displayText = formatDateToText(inputValue);
  const dateInputValue = convertToDateInputValue(inputValue);

  return (
    <div 
      ref={wrapperRef}
      style={{ 
        position: "relative", 
        width: "100%",
        minHeight: "32px",
      }}
    >
      {/* ============================================================
          TAMPILAN DEFAULT: ICON KALENDER + TEXT TANGGAL
          ============================================================ */}
      <div
        onClick={toggleDatePicker}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 10px",
          borderRadius: "4px",
          background: isFocused || showDatePicker ? "var(--bg-hover, #f0f0f0)" : "transparent",
          border: "1px solid transparent",
          borderColor: isFocused || showDatePicker ? "var(--border-color, #ddd)" : "transparent",
          transition: "all 0.2s ease",
          cursor: "pointer",
          width: "100%",
          minHeight: "32px",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-hover, #f5f5f5)";
        }}
        onMouseLeave={(e) => {
          if (!isFocused && !showDatePicker) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        {/* Icon Kalender */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            color: displayText ? "var(--text-primary, #333)" : "var(--text-muted, #999)",
            opacity: displayText ? 0.8 : 0.5,
          }}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>

        {/* Text Tanggal */}
        <span
          style={{
            fontSize: "13px",
            color: displayText ? "var(--text-primary, #333)" : "var(--text-muted, #999)",
            flex: 1,
            fontFamily: "inherit",
            userSelect: "none",
          }}
        >
          {displayText || placeholder}
        </span>
      </div>

      {/* ============================================================
          INPUT DATE (HIDDEN) - AKTIF SAAT DIKLIK
          ============================================================ */}
      {showDatePicker && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 1000,
            marginTop: "4px",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            padding: "8px",
            border: "1px solid #e0e0e0",
            minWidth: "240px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="date"
            value={dateInputValue || ""}
            onChange={handleDateChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              outline: "none",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
            autoFocus
          />
          
          {/* Tombol Clear */}
          {displayText && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setInputValue("");
                setShowDatePicker(false);
                if (onChange) {
                  onChange("");
                }
              }}
              style={{
                marginTop: "8px",
                padding: "4px 12px",
                fontSize: "12px",
                color: "#999",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px",
                width: "100%",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
                e.currentTarget.style.color = "#e74c3c";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#999";
              }}
            >
              ✕ Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
