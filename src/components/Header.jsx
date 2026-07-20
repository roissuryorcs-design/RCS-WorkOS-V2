// src/components/Header.jsx

import { useState, useEffect } from "react";

export default function Header({ isDefaultOnly = false }) {
  const [boardName, setBoardName] = useState(() => {
    return localStorage.getItem("boardName") || "BOARD NAME";
  });
  const [description, setDescription] = useState(() => {
    return localStorage.getItem("boardDescription") || "add a description";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempName, setTempName] = useState(boardName);
  const [tempDesc, setTempDesc] = useState(description);

  // Jika hanya default group, gunakan "BOARD NAME" dan "add a description"
  const displayName = isDefaultOnly ? "BOARD NAME" : boardName;
  const displayDesc = isDefaultOnly ? "add a description" : description;

  useEffect(() => {
    localStorage.setItem("boardName", boardName);
  }, [boardName]);

  useEffect(() => {
    localStorage.setItem("boardDescription", description);
  }, [description]);

  // Jika isDefaultOnly true, tidak perlu simpan karena hanya tampilan
  const handleNameClick = () => {
    if (isDefaultOnly) {
      // Jika hanya default group, izinkan edit tapi langsung simpan
      setIsEditingName(true);
      setTempName("BOARD NAME");
      return;
    }
    setIsEditingName(true);
    setTempName(boardName);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    if (isDefaultOnly) {
      // Jika hanya default group, simpan sebagai custom name
      const newName = tempName.trim();
      if (newName && newName !== "BOARD NAME") {
        setBoardName(newName);
      }
      return;
    }
    const newName = tempName.trim();
    if (newName) {
      setBoardName(newName);
    } else {
      setBoardName("BOARD NAME");
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setTempName(boardName);
    }
  };

  const handleDescClick = () => {
    if (isDefaultOnly) {
      setIsEditingDesc(true);
      setTempDesc("add a description");
      return;
    }
    setIsEditingDesc(true);
    setTempDesc(description);
  };

  const handleDescSave = () => {
    setIsEditingDesc(false);
    if (isDefaultOnly) {
      const newDesc = tempDesc.trim();
      if (newDesc && newDesc !== "add a description") {
        setDescription(newDesc);
      }
      return;
    }
    const newDesc = tempDesc.trim();
    if (newDesc) {
      setDescription(newDesc);
    } else {
      setDescription("add a description");
    }
  };

  const handleDescKeyDown = (e) => {
    if (e.key === "Enter") {
      handleDescSave();
    } else if (e.key === "Escape") {
      setIsEditingDesc(false);
      setTempDesc(description);
    }
  };

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
            {displayName}
            <span style={{ fontSize: "14px", color: "var(--text-muted)", marginLeft: "8px", fontWeight: 400 }}>
              ✎
            </span>
          </h1>
        )}

        {/* DESCRIPTION */}
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
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "6px" }}>
              ✎
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
