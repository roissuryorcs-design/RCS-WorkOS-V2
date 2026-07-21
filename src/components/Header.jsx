import { useState, useEffect } from "react";

export default function Header({ isDefaultOnly = false }) {
  // State untuk menyimpan nama custom
  const [customName, setCustomName] = useState(() => {
    return localStorage.getItem("boardName") || "";
  });
  const [customDesc, setCustomDesc] = useState(() => {
    return localStorage.getItem("boardDescription") || "";
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempDesc, setTempDesc] = useState("");

  // ============================================================
  // 🔥 FIX: LOAD DATA SAAT PERTAMA KALI
  // ============================================================
  useEffect(() => {
    const savedName = localStorage.getItem("boardName");
    const savedDesc = localStorage.getItem("boardDescription");
    
    if (savedName) {
      setCustomName(savedName);
    }
    if (savedDesc) {
      setCustomDesc(savedDesc);
    }
  }, []);

  // ============================================================
  // LOGIKA UTAMA:
  // - Jika isDefaultOnly = true → tampilkan "BOARD NAME"
  // - Jika isDefaultOnly = false → tampilkan customName (jika ada)
  // 🔥 FIX: Jangan override customName dengan "BOARD NAME"
  // ============================================================
  const hasCustomName = customName && customName.trim() !== "";
  const hasCustomDesc = customDesc && customDesc.trim() !== "";

  // 🔥 FIX: Gunakan customName meskipun isDefaultOnly true
  // Tapi tetap tampilkan "BOARD NAME" jika tidak ada customName
  const displayName = hasCustomName ? customName : "BOARD NAME";
  const displayDesc = hasCustomDesc ? customDesc : "add a description";

  // Debug: log untuk memastikan
  console.log("🔵 Header - isDefaultOnly:", isDefaultOnly);
  console.log("🔵 Header - customName:", customName);
  console.log("🔵 Header - displayName:", displayName);

  // ============================================================
  // Simpan ke localStorage
  // ============================================================
  useEffect(() => {
    if (customName) {
      localStorage.setItem("boardName", customName);
    } else {
      localStorage.removeItem("boardName");
    }
  }, [customName]);

  useEffect(() => {
    if (customDesc) {
      localStorage.setItem("boardDescription", customDesc);
    } else {
      localStorage.removeItem("boardDescription");
    }
  }, [customDesc]);

  // ============================================================
  // HANDLE EDIT BOARD NAME
  // ============================================================
  const handleNameClick = () => {
    setIsEditingName(true);
    setTempName(customName || "BOARD NAME");
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    const newName = tempName.trim();
    if (newName && newName !== "BOARD NAME") {
      setCustomName(newName);
    } else {
      setCustomName("");
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setTempName(customName || "BOARD NAME");
    }
  };

  // ============================================================
  // HANDLE EDIT DESCRIPTION
  // ============================================================
  const handleDescClick = () => {
    setIsEditingDesc(true);
    setTempDesc(customDesc || "add a description");
  };

  const handleDescSave = () => {
    setIsEditingDesc(false);
    const newDesc = tempDesc.trim();
    if (newDesc && newDesc !== "add a description") {
      setCustomDesc(newDesc);
    } else {
      setCustomDesc("");
    }
  };

  const handleDescKeyDown = (e) => {
    if (e.key === "Enter") {
      handleDescSave();
    } else if (e.key === "Escape") {
      setIsEditingDesc(false);
      setTempDesc(customDesc || "add a description");
    }
  };

  return (
    <div className="header-container" style={{ padding: "16px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {/* BOARD NAME - TANPA ICON ✎ */}
        {isEditingName ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
            autoFocus
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--text-primary)",
              background: "var(--bg-input)",
              border: "2px solid var(--btn-primary-bg)",
              borderRadius: "4px",
              padding: "2px 8px",
              outline: "none",
              fontFamily: "inherit",
              maxWidth: "400px",
            }}
          />
        ) : (
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              margin: 0,
              color: "var(--text-primary)",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: "4px",
              transition: "background 0.15s",
              display: "inline-block",
              maxWidth: "fit-content",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            onClick={handleNameClick}
            title="Click to edit board name"
          >
            {displayName}
          </h1>
        )}

        {/* DESCRIPTION - TANPA ICON ✎ */}
        {isEditingDesc ? (
          <input
            type="text"
            value={tempDesc}
            onChange={(e) => setTempDesc(e.target.value)}
            onBlur={handleDescSave}
            onKeyDown={handleDescKeyDown}
            autoFocus
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              background: "var(--bg-input)",
              border: "2px solid var(--btn-primary-bg)",
              borderRadius: "4px",
              padding: "2px 8px",
              outline: "none",
              fontFamily: "inherit",
              maxWidth: "300px",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: "4px",
              transition: "background 0.15s",
              display: "inline-block",
              maxWidth: "fit-content",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            onClick={handleDescClick}
            title="Click to edit description"
          >
            {displayDesc}
          </span>
        )}
      </div>
    </div>
  );
}
