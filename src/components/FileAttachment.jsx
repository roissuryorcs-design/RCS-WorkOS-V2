import { useState, useRef, useEffect } from "react";

export default function FileAttachment({ value, onUpdate, columnId }) {
  const [files, setFiles] = useState(() => {
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return value ? [{ url: value, name: value.split("/").pop() || "file" }] : [];
    }
  });
  const [showPopup, setShowPopup] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [showFileList, setShowFileList] = useState(false);
  const [hoveredFileIndex, setHoveredFileIndex] = useState(null);
  const [showActionsIndex, setShowActionsIndex] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [visibleThumbnails, setVisibleThumbnails] = useState(3);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const fileListRef = useRef(null);
  const previewTimeoutRef = useRef(null);

  // ... (fungsi saveFiles, uploadFile, handleFileSelect, handleLinkAdd, removeFile, downloadFile, formatSize, isImage, isPdf, isVideo) sama seperti sebelumnya

  // ============================================================
  // HITUNG JUMLAH THUMBNAIL YANG MUAT
  // ============================================================
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const thumbnailSize = 32;
      const gap = 4;
      const badgeSize = 32;
      const maxFit = Math.floor((containerWidth - badgeSize - gap) / (thumbnailSize + gap));
      let count = Math.max(1, Math.min(maxFit, files.length > 1 ? files.length - 1 : files.length));
      if (files.length <= 1) count = 1;
      setVisibleThumbnails(count);
    }
  }, [files, containerRef.current?.offsetWidth]);

  // ============================================================
  // HOVER BADGE +N
  // ============================================================
  const handleBadgeMouseEnter = (e) => {
    if (files.length <= 1) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    const rect = e.currentTarget.getBoundingClientRect();
    let left = rect.right + 8;
    let top = rect.top;
    
    const popupWidth = 280;
    if (left + popupWidth > window.innerWidth) {
      left = rect.left - popupWidth - 8;
    }
    if (top + 350 > window.innerHeight) {
      top = window.innerHeight - 350 - 10;
    }
    
    setPopupPosition({ top, left });
    setShowFileList(true);
  };

  const handleBadgeMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowFileList(false);
      setHoveredFileIndex(null);
    }, 300);
  };

  const handleFileListMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleFileListMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowFileList(false);
      setHoveredFileIndex(null);
      setShowActionsIndex(null);
    }, 300);
  };

  // ============================================================
  // HOVER THUMBNAIL INDIVIDUAL – DELAY 1 DETIK
  // ============================================================
  const handleThumbnailHover = (e, index) => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    let left = rect.right + 8;
    let top = rect.top;
    
    const popupWidth = 220;
    if (left + popupWidth > window.innerWidth) {
      left = rect.left - popupWidth - 8;
    }
    if (top + 200 > window.innerHeight) {
      top = window.innerHeight - 200 - 10;
    }
    
    setPopupPosition({ top, left });
    setHoveredFileIndex(index);
  };

  const handleThumbnailLeave = () => {
    previewTimeoutRef.current = setTimeout(() => {
      setHoveredFileIndex(null);
    }, 1000); // ← 1 DETIK
  };

  const handlePreviewMouseEnter = () => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
  };

  const handlePreviewMouseLeave = () => {
    previewTimeoutRef.current = setTimeout(() => {
      setHoveredFileIndex(null);
    }, 1000); // ← 1 DETIK
  };

  // ============================================================
  // PREVIEW DI DALAM DAFTAR FILE – DELAY 1 DETIK (konsisten)
  // ============================================================
  const handleListHover = (index) => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    setHoveredFileIndex(index);
  };

  const handleListLeave = () => {
    previewTimeoutRef.current = setTimeout(() => {
      setHoveredFileIndex(null);
    }, 1000); // ← 1 DETIK
  };

  const openFileManager = () => {
    if (files.length > 0) {
      setShowFileManager(true);
    } else {
      setShowPopup(true);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  const showBadge = files.length > visibleThumbnails;

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", overflow: "hidden" }}>
      {/* Area utama */}
      <div
        onClick={openFileManager}
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: 4,
          minHeight: 32,
          alignItems: "center",
          border: files.length === 0 ? "1px dashed var(--border-color)" : "none",
          borderRadius: 4,
          padding: files.length === 0 ? "6px 8px" : "2px 0",
          cursor: "pointer",
          transition: "background 0.15s",
          overflow: "hidden",
        }}
      >
        {files.length === 0 ? (
          <span style={{ color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>+ Add file or link</span>
        ) : (
          <>
            {files.slice(0, visibleThumbnails).map((file, index) => (
              <div
                key={index}
                style={{ position: "relative", display: "inline-block", flexShrink: 0 }}
                onMouseEnter={(e) => handleThumbnailHover(e, index)}
                onMouseLeave={handleThumbnailLeave}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 4,
                    border: "1px solid var(--border-color)",
                    overflow: "hidden",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(file.url, "_blank");
                  }}
                >
                  {isImage(file.url) ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : isPdf(file.url) ? (
                    <span style={{ fontSize: 14 }}>📄</span>
                  ) : isVideo(file.url) ? (
                    <span style={{ fontSize: 14 }}>🎬</span>
                  ) : file.isLink ? (
                    <span style={{ fontSize: 14 }}>🔗</span>
                  ) : (
                    <span style={{ fontSize: 14 }}>📎</span>
                  )}
                </div>

                {/* Preview thumbnail */}
                {hoveredFileIndex === index && (
                  <div
                    onMouseEnter={handlePreviewMouseEnter}
                    onMouseLeave={handlePreviewMouseLeave}
                    style={{
                      position: "fixed",
                      top: popupPosition.top,
                      left: popupPosition.left,
                      background: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                      padding: 8,
                      minWidth: 160,
                      maxWidth: 220,
                      zIndex: 99999,
                      pointerEvents: "auto",
                    }}
                  >
                    {isImage(file.url) && (
                      <div style={{ marginBottom: 4, borderRadius: 4, overflow: "hidden" }}>
                        <img
                          src={file.url}
                          alt={file.name}
                          style={{ width: "100%", maxHeight: 100, objectFit: "contain" }}
                        />
                      </div>
                    )}
                    {isVideo(file.url) && (
                      <div style={{ marginBottom: 4, borderRadius: 4, overflow: "hidden", background: "#000" }}>
                        <video src={file.url} controls style={{ width: "100%", maxHeight: 100 }} />
                      </div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", wordBreak: "break-all" }}>
                      {file.name || "Untitled"}
                    </div>
                    {file.size && (
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                        {formatSize(file.size)}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      {file.isLink ? "🔗 Link" : "📎 File"}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button
                        onClick={() => {
                          downloadFile(file.url, file.name);
                          setHoveredFileIndex(null);
                        }}
                        style={{
                          padding: "2px 10px",
                          background: "var(--btn-primary-bg)",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => {
                          removeFile(index);
                          setHoveredFileIndex(null);
                        }}
                        style={{
                          padding: "2px 10px",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Badge +N */}
            {showBadge && (
              <div
                style={{
                  display: "inline-block",
                  flexShrink: 0,
                  marginLeft: 2,
                }}
                onMouseEnter={handleBadgeMouseEnter}
                onMouseLeave={handleBadgeMouseLeave}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 4,
                    background: "var(--btn-primary-bg)",
                    border: "1px solid var(--btn-primary-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  +{files.length - visibleThumbnails}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Popup daftar file (+N) */}
      {showFileList && files.length > visibleThumbnails && (
        <div
          ref={fileListRef}
          onMouseEnter={handleFileListMouseEnter}
          onMouseLeave={handleFileListMouseLeave}
          style={{
            position: "fixed",
            top: popupPosition.top,
            left: popupPosition.left,
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            padding: "0",
            minWidth: 220,
            maxWidth: 300,
            zIndex: 99999,
            maxHeight: 350,
            overflowY: "auto",
            pointerEvents: "auto",
          }}
        >
          <div style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
            {files.length} files
          </div>
          {files.map((file, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderBottom: index === files.length - 1 ? "none" : "1px solid #f3f4f6",
                position: "relative",
                background: hoveredFileIndex === index ? "#f3f4f6" : "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={() => handleListHover(index)}
              onMouseLeave={handleListLeave}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  overflow: "hidden",
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isImage(file.url) ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 14 }}>📎</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#1a1a2e",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                  onClick={() => window.open(file.url, "_blank")}
                >
                  {file.name || "Untitled"}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {file.size ? formatSize(file.size) : ""}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionsIndex(showActionsIndex === index ? null : index);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "#6b7280",
                  padding: "0 4px",
                }}
              >
                ⋮
              </button>

              {showActionsIndex === index && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: 4,
                    background: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 100000,
                    minWidth: 140,
                    padding: "4px 0",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { window.open(file.url, "_blank"); setShowActionsIndex(null); }}
                    style={{ display: "block", width: "100%", padding: "6px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, color: "#1a1a2e" }}
                  >
                    Open File
                  </button>
                  <button
                    onClick={() => { downloadFile(file.url, file.name); setShowActionsIndex(null); }}
                    style={{ display: "block", width: "100%", padding: "6px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, color: "#1a1a2e" }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${file.name}"?`)) { removeFile(index); } setShowActionsIndex(null); }}
                    style={{ display: "block", width: "100%", padding: "6px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, color: "#ef4444", borderTop: "1px solid #f3f4f6" }}
                  >
                    Delete
                  </button>
                </div>
              )}

              {/* PREVIEW DI DALAM LIST +N – dengan delay 1 detik */}
              {hoveredFileIndex === index && (
                <div
                  style={{
                    position: "fixed",
                    left: (fileListRef.current?.getBoundingClientRect().right || 0) + 8,
                    top: (fileListRef.current?.getBoundingClientRect().top || 0) + 40,
                    background: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    padding: 4,
                    zIndex: 100000,
                    maxWidth: 180,
                    maxHeight: 180,
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  {isImage(file.url) ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: 180 }}
                    />
                  ) : isVideo(file.url) ? (
                    <video src={file.url} controls style={{ width: "100%", maxHeight: 140 }} />
                  ) : (
                    <div style={{ padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 40 }}>
                        {file.isLink ? "🔗" : isPdf(file.url) ? "📄" : "📎"}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", wordBreak: "break-all" }}>
                        {file.name || "Untitled"}
                      </div>
                      {file.size && (
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          {formatSize(file.size)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Popup Add File (modal) */}
      {showPopup && (
        // ... (sama seperti sebelumnya, tidak diubah)
      )}

      {/* File Manager Modal */}
      {showFileManager && (
        // ... (sama seperti sebelumnya, tidak diubah)
      )}
    </div>
  );
}
