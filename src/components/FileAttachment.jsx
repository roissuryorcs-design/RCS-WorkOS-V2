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
  const [hoveredBadge, setHoveredBadge] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileListPopup, setShowFileListPopup] = useState(false);
  const [showFileActions, setShowFileActions] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const badgeRef = useRef(null);

  const saveFiles = (newFiles) => {
    setFiles(newFiles);
    onUpdate(columnId, JSON.stringify(newFiles));
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "rcs_upload");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/lawjar8t/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        const newFile = {
          url: data.secure_url,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        };
        saveFiles([...files, newFile]);
        setShowPopup(false);
        setShowFileManager(false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleLinkAdd = () => {
    if (!linkInput.trim()) return;
    const url = linkInput.trim();
    const newFile = {
      url: url,
      name: url.split("/").pop() || "file",
      isLink: true,
      uploadedAt: new Date().toISOString(),
    };
    saveFiles([...files, newFile]);
    setLinkInput("");
    setShowPopup(false);
    setShowFileManager(false);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    saveFiles(newFiles);
    setShowFileActions(null);
    setSelectedFile(null);
    setShowFileListPopup(false);
  };

  const downloadFile = (url, name) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "file";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return mb + " MB";
  };

  const isImage = (url) => {
    return url && url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
  };

  const isPdf = (url) => url && url.toLowerCase().includes(".pdf");
  const isVideo = (url) => url && url.match(/\.(mp4|webm|mov|avi)$/i);

  // Handler badge hover
  const handleBadgeMouseEnter = (e) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    let top = rect.bottom + 8;
    let left = rect.left + rect.width / 2;
    
    if (top + 300 > viewportHeight) {
      top = rect.top - 300;
    }
    if (left - 180 < 0) left = 180;
    if (left + 180 > viewportWidth) left = viewportWidth - 180;
    
    setPopupPosition({ top, left });
    setShowFileListPopup(true);
    setHoveredBadge(true);
  };

  const handleBadgeMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (!showFileListPopup) {
        setShowFileListPopup(false);
        setHoveredBadge(false);
      }
    }, 300);
  };

  const handleFileListMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleFileListMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowFileListPopup(false);
      setHoveredBadge(false);
      setShowFileActions(null);
    }, 300);
  };

  const openFileManager = () => {
    if (files.length > 0) {
      setShowFileManager(true);
    } else {
      setShowPopup(true);
    }
  };

  const truncateName = (name, maxLength = 30) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Area utama */}
      <div
        onClick={openFileManager}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          minHeight: 32,
          alignItems: "center",
          border: files.length === 0 ? "1px dashed var(--border-color)" : "none",
          borderRadius: 4,
          padding: files.length === 0 ? "8px" : "0",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        {files.length === 0 ? (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>+ Add file or link</span>
        ) : (
          <>
            {/* Thumbnail pertama dengan badge */}
            <div
              ref={badgeRef}
              style={{ position: "relative", display: "inline-block" }}
              onMouseEnter={handleBadgeMouseEnter}
              onMouseLeave={handleBadgeMouseLeave}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  border: "1px solid var(--border-color)",
                  overflow: "hidden",
                  background: "var(--bg-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(files[0].url, "_blank");
                }}
              >
                {isImage(files[0].url) ? (
                  <img
                    src={files[0].url}
                    alt={files[0].name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : isPdf(files[0].url) ? (
                  <span style={{ fontSize: 18 }}>📄</span>
                ) : isVideo(files[0].url) ? (
                  <span style={{ fontSize: 18 }}>🎬</span>
                ) : (
                  <span style={{ fontSize: 18 }}>📎</span>
                )}
                {files.length > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      background: "var(--btn-primary-bg)",
                      color: "white",
                      borderRadius: 10,
                      padding: "0 5px",
                      fontSize: 9,
                      fontWeight: 600,
                      lineHeight: "16px",
                      minWidth: 16,
                      textAlign: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  >
                    +{files.length - 1}
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail lainnya (tanpa badge) */}
            {files.slice(1, 4).map((file, idx) => (
              <div
                key={idx}
                style={{ display: "inline-block" }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    border: "1px solid var(--border-color)",
                    overflow: "hidden",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
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
                    <span style={{ fontSize: 18 }}>📄</span>
                  ) : isVideo(file.url) ? (
                    <span style={{ fontSize: 18 }}>🎬</span>
                  ) : (
                    <span style={{ fontSize: 18 }}>📎</span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Popup daftar file (hover pada badge) */}
      {showFileListPopup && files.length > 1 && (
        <div
          onMouseEnter={handleFileListMouseEnter}
          onMouseLeave={handleFileListMouseLeave}
          style={{
            position: "fixed",
            top: popupPosition.top,
            left: popupPosition.left,
            transform: "translateX(-50%)",
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            padding: "8px 0",
            minWidth: 240,
            maxWidth: 300,
            zIndex: 99999,
            maxHeight: 300,
            overflowY: "auto",
            pointerEvents: "auto",
          }}
        >
          <div style={{ padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
            {files.length} files
          </div>
          {files.map((file, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderBottom: index === files.length - 1 ? "none" : "1px solid #f3f4f6",
                position: "relative",
              }}
              onMouseEnter={() => setSelectedFile(file)}
              onMouseLeave={() => setSelectedFile(null)}
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
              {/* Tombol titik tiga */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFileActions(showFileActions === index ? null : index);
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

              {/* Popup aksi (Open, Download, Delete) */}
              {showFileActions === index && (
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
                    minWidth: 150,
                    padding: "4px 0",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      window.open(file.url, "_blank");
                      setShowFileActions(null);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "6px 14px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#1a1a2e",
                    }}
                  >
                    Open File
                  </button>
                  <button
                    onClick={() => {
                      downloadFile(file.url, file.name);
                      setShowFileActions(null);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "6px 14px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#1a1a2e",
                    }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${file.name}"?`)) {
                        removeFile(index);
                      }
                      setShowFileActions(null);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "6px 14px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#ef4444",
                      borderTop: "1px solid #f3f4f6",
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Popup Add File (modal) */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setShowPopup(false)}
        >
          <div
            style={{
              background: "var(--bg-modal)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "100%",
              color: "var(--text-primary)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: "1px solid var(--border-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
              Add File or Link
            </h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "16px",
                border: "1px dashed var(--border-color)",
                borderRadius: 8,
                textAlign: "center",
                cursor: "pointer",
                marginBottom: 16,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontSize: 32 }}>📁</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
                {uploading ? "Uploading..." : "Click to upload file"}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste image or file link..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid var(--border-dark)",
                  borderRadius: 6,
                  fontSize: 14,
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLinkAdd();
                }}
              />
              <button
                onClick={handleLinkAdd}
                disabled={!linkInput.trim()}
                style={{
                  padding: "8px 16px",
                  background: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                  border: "none",
                  borderRadius: 6,
                  cursor: linkInput.trim() ? "pointer" : "not-allowed",
                  opacity: linkInput.trim() ? 1 : 0.5,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Add
              </button>
            </div>

            <button
              onClick={() => setShowPopup(false)}
              style={{
                width: "100%",
                padding: "8px",
                background: "var(--bg-hover)",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                color: "var(--text-secondary)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border-color)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* File Manager Modal */}
      {showFileManager && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowFileManager(false)}
        >
          <div
            style={{
              background: "var(--bg-modal)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              color: "var(--text-primary)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: "1px solid var(--border-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
              Files ({files.length})
            </h3>

            {files.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>
                No files added yet.
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                {files.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        overflow: "hidden",
                        background: "var(--bg-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      {isImage(file.url) ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: 20 }}>📎</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                        }}
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        {file.name || "Untitled"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {file.size ? formatSize(file.size) : ""} {file.isLink ? "🔗 Link" : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => downloadFile(file.url, file.name)}
                        style={{
                          padding: "4px 8px",
                          background: "var(--btn-primary-bg)",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                        title="Download"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${file.name}"?`)) {
                            removeFile(index);
                          }
                        }}
                        style={{
                          padding: "4px 8px",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  setShowFileManager(false);
                  setShowPopup(true);
                }}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                + Add File
              </button>
              <button
                onClick={() => setShowFileManager(false)}
                style={{
                  padding: "8px 16px",
                  background: "var(--bg-hover)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
