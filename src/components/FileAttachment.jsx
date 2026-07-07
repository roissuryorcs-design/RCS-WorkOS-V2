import { useState, useRef } from "react";

export default function FileAttachment({ value, onUpdate, columnId }) {
  const [files, setFiles] = useState(() => {
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return value ? [{ url: value, name: value.split("/").pop() || "file" }] : [];
    }
  });
  const [showPopup, setShowPopup] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [hoveredFile, setHoveredFile] = useState(null);
  const fileInputRef = useRef(null);

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
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setShowPopup(false);
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
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    saveFiles(newFiles);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return mb + " MB";
  };

  const isImage = (url) => {
    return url && url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Thumbnail area */}
      <div
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
        onClick={() => setShowPopup(true)}
        onMouseEnter={(e) => {
          if (files.length === 0) e.currentTarget.style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (files.length === 0) e.currentTarget.style.background = "transparent";
        }}
      >
        {files.length === 0 ? (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>+ Add file or link</span>
        ) : (
          files.map((file, index) => (
            <div
              key={index}
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredFile(index)}
              onMouseLeave={() => setHoveredFile(null)}
            >
              {/* Thumbnail */}
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
                  window.open(file.url, "_blank");
                }}
              >
                {isImage(file.url) ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 18 }}>📎</span>
                )}
                {/* Badge jumlah file */}
                {index === 0 && files.length > 1 && (
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
                    }}
                  >
                    +{files.length - 1}
                  </div>
                )}
              </div>

              {/* Hover popup detail */}
              {hoveredFile === index && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--bg-modal)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    padding: 12,
                    minWidth: 200,
                    zIndex: 100,
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {file.name}
                  </div>
                  {file.size && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {formatSize(file.size)}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {file.isLink ? "🔗 Link" : "📎 File"}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                      setHoveredFile(null);
                    }}
                    style={{
                      marginTop: 8,
                      padding: "2px 10px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 11,
                      pointerEvents: "auto",
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Popup untuk upload/link */}
      {showPopup && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setShowPopup(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 4,
              background: "var(--bg-modal)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
              zIndex: 1000,
              padding: 16,
              minWidth: 280,
              maxWidth: 300,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--text-primary)" }}>
              Add File or Link
            </h4>

            {/* Upload file */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "12px",
                border: "1px dashed var(--border-color)",
                borderRadius: 6,
                textAlign: "center",
                cursor: "pointer",
                marginBottom: 12,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontSize: 24 }}>📁</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
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

            {/* Or separator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
            </div>

            {/* Paste link */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste image or file link..."
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  border: "1px solid var(--border-dark)",
                  borderRadius: 4,
                  fontSize: 13,
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
                  padding: "6px 12px",
                  background: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                  border: "none",
                  borderRadius: 4,
                  cursor: linkInput.trim() ? "pointer" : "not-allowed",
                  opacity: linkInput.trim() ? 1 : 0.5,
                  fontSize: 13,
                }}
              >
                Add
              </button>
            </div>

            <button
              onClick={() => setShowPopup(false)}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "6px",
                background: "var(--bg-hover)",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
