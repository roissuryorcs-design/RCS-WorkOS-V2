import { useState, useEffect } from "react";

export default function Header() {
  // ============================================================
  // STATE - LANGSUNG DARI LOCALSTORAGE
  // ============================================================
  const [boardTitle, setBoardTitle] = useState("BOARD TITLE");
  const [boardSubtitle, setBoardSubtitle] = useState("Sub Title / Description");
  const [isLoaded, setIsLoaded] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempDesc, setTempDesc] = useState("");

  // ============================================================
  // 🔥 LOAD DARI LOCALSTORAGE
  // ============================================================
  useEffect(() => {
    const savedTitle = localStorage.getItem("forelBoardTitle");
    const savedSubtitle = localStorage.getItem("forelBoardSubtitle");
    
    console.log("🔵 Loading Header from localStorage:");
    console.log("  - forelBoardTitle:", savedTitle);
    console.log("  - forelBoardSubtitle:", savedSubtitle);
    
    if (savedTitle && savedTitle.trim() !== "") {
      setBoardTitle(savedTitle);
    } else {
      localStorage.setItem("forelBoardTitle", "BOARD TITLE");
      setBoardTitle("BOARD TITLE");
    }
    
    if (savedSubtitle && savedSubtitle.trim() !== "") {
      setBoardSubtitle(savedSubtitle);
    } else {
      localStorage.setItem("forelBoardSubtitle", "Sub Title / Description");
      setBoardSubtitle("Sub Title / Description");
    }
    
    setIsLoaded(true);
  }, []);

  // ============================================================
  // 🔥 SIMPAN KE LOCALSTORAGE
  // ============================================================
  const saveTitle = (newTitle) => {
    console.log("🔵 Saving title:", newTitle);
    setBoardTitle(newTitle);
    localStorage.setItem("forelBoardTitle", newTitle);
    
    // Verifikasi
    const saved = localStorage.getItem("forelBoardTitle");
    console.log("  - Verified saved:", saved);
  };

  const saveSubtitle = (newSubtitle) => {
    console.log("🔵 Saving subtitle:", newSubtitle);
    setBoardSubtitle(newSubtitle);
    localStorage.setItem("forelBoardSubtitle", newSubtitle);
    
    // Verifikasi
    const saved = localStorage.getItem("forelBoardSubtitle");
    console.log("  - Verified saved:", saved);
  };

  // ============================================================
  // HANDLE EDIT NAME
  // ============================================================
  const handleNameClick = () => {
    setIsEditingName(true);
    setTempName(boardTitle);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    const newName = tempName.trim();
    if (newName && newName !== "BOARD TITLE") {
      saveTitle(newName);
    } else {
      saveTitle("BOARD TITLE");
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setTempName(boardTitle);
    }
  };

  // ============================================================
  // HANDLE EDIT SUBTITLE
  // ============================================================
  const handleDescClick = () => {
    setIsEditingDesc(true);
    setTempDesc(boardSubtitle);
  };

  const handleDescSave = () => {
    setIsEditingDesc(false);
    const newDesc = tempDesc.trim();
    if (newDesc && newDesc !== "Sub Title / Description") {
      saveSubtitle(newDesc);
    } else {
      saveSubtitle("Sub Title / Description");
    }
  };

  const handleDescKeyDown = (e) => {
    if (e.key === "Enter") {
      handleDescSave();
    } else if (e.key === "Escape") {
      setIsEditingDesc(false);
      setTempDesc(boardSubtitle);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (!isLoaded) {
    return <div style={{ padding: "16px 24px" }}>Loading...</div>;
  }

  return (
    <div className="header-container" style={{ padding: "16px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {/* BOARD NAME */}
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
            {boardTitle}
          </h1>
        )}

        {/* SUBTITLE */}
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
            {boardSubtitle}
          </span>
        )}
      </div>
    </div>
  );
}
