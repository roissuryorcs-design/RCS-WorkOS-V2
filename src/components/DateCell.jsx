import { useState, useRef, useEffect } from "react";

export default function DateCell({ date, onChange, placeholder = "dd - mm - yy" }) {
  const [inputValue, setInputValue] = useState(date || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // ============================================================
  // NAMA BULAN (SINGKAT)
  // ============================================================
  const MONTHS_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // ============================================================
  // CEK APAKAH VALUE ADALAH TANGGAL VALID
  // ============================================================
  const isValidDate = (val) => {
    if (!val) return false;
    // Cek format "DD - MMM - YYYY"
    const pattern = /^(\d{2})\s*-\s*([A-Za-z]{3})\s*-\s*(\d{4})$/;
    return pattern.test(val);
  };

  // ============================================================
  // FORMAT TANGGAL KE "DD - MMM - YYYY"
  // ============================================================
  const formatDateToText = (val) => {
    if (!val) return "";
    
    // Jika sudah dalam format "DD - MMM - YYYY"
    const pattern = /^(\d{2})\s*-\s*([A-Za-z]{3})\s*-\s*(\d{4})$/;
    if (pattern.test(val)) {
      return val;
    }
    
    // Jika dari input date (yyyy-mm-dd)
    if (val.includes("-") && val.length === 10) {
      const parts = val.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parseInt(parts[1]) - 1;
        const day = parts[2];
        if (month >= 0 && month <= 11) {
          return `${day} - ${MONTHS_SHORT[month]} - ${year}`;
        }
      }
    }
    
    // Jika dalam format dd/mm/yyyy
    if (val.includes("/")) {
      const parts = val.split("/");
      if (parts.length === 3) {
        const day = parts[0];
        const month = parseInt(parts[1]) - 1;
        const year = parts[2];
        if (month >= 0 && month <= 11) {
          return `${day} - ${MONTHS_SHORT[month]} - ${year}`;
        }
      }
    }
    
    return val;
  };

  // ============================================================
  // KONVERSI KE VALUE UNTUK INPUT DATE (yyyy-mm-dd)
  // ============================================================
  const convertToDateInputValue = (val) => {
    if (!val) return "";
    
    // Jika dalam format "DD - MMM - YYYY"
    const pattern = /^(\d{2})\s*-\s*([A-Za-z]{3})\s*-\s*(\d{4})$/;
    const match = val.match(pattern);
    if (match) {
      const day = match[1].padStart(2, '0');
      const monthName = match[2];
      const year = match[3];
      const monthIndex = MONTHS_SHORT.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
      if (monthIndex !== -1) {
        const month = String(monthIndex + 1).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    
    // Jika dalam format dd/mm/yyyy
    if (val.includes("/")) {
      const parts = val.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Jika dalam format yyyy-mm-dd
    if (val.includes("-") && val.length === 10) {
      return val;
    }
    
    return "";
  };

  // ============================================================
  // HANDLE PERUBAHAN TANGGAL DARI INPUT DATE
  // ============================================================
  const handleDateChange = (e) => {
    const value = e.target.value;
    if (value) {
      const formattedDate = formatDateToText(value);
      setInputValue(formattedDate);
      if (onChange) {
        onChange(formattedDate);
      }
    } else {
      setInputValue("");
      if (onChange) {
        onChange("");
      }
    }
  };

  // ============================================================
  // HANDLE BLUR
  // ============================================================
  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      setShowDatePicker(false);
    }, 200);
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
  
  // Tentukan apakah value adalah tanggal valid
  const hasValidDate = isValidDate(displayText);

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
            color: hasValidDate ? "var(--text-primary, #333)" : "var(--text-muted, #999)",
            opacity: hasValidDate ? 0.8 : 0.5,
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
            color: hasValidDate ? "var(--text-primary, #333)" : "var(--text-muted, #999)",
            flex: 1,
            fontFamily: "inherit",
            userSelect: "none",
            fontWeight: hasValidDate ? 500 : 400,
          }}
        >
          {hasValidDate ? displayText : placeholder}
        </span>
      </div>

      {/* ============================================================
          DATE PICKER POPUP
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
            padding: "12px",
            border: "1px solid #e0e0e0",
            minWidth: "260px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input Date */}
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

          {/* Info Format */}
          <div
            style={{
              fontSize: "11px",
              color: "#999",
              marginTop: "6px",
              textAlign: "center",
            }}
          >
            Format: <strong>DD - MMM - YYYY</strong> (contoh: 23 - May - 2026)
          </div>

          {/* Tombol Clear */}
          {hasValidDate && (
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
                transition: "all 0.2s ease",
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
