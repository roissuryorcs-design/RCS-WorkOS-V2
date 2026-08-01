import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import FileIcon from "./FileIcon";
import { usePopoverPosition } from "../hooks/usePopoverPosition";
import { useLanguage } from "../context/LanguageContext";
import { uploadToCloudinary, FileTooLargeError } from "../utils/cloudinaryUpload";

export default function FileAttachment({ value, onUpdate, columnId }) {
  const { t } = useLanguage();
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
  const [visibleThumbnails, setVisibleThumbnails] = useState(3);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const previewTimeoutRef = useRef(null);

  // Anchors + portaled positions for the hover/click popups below — all
  // four are portaled to document.body and clamped to stay on-screen
  // (they'd otherwise get clipped by the table's overflow:auto scroll
  // container, or run off the right/bottom edge of the viewport).
  const [previewAnchorEl, setPreviewAnchorEl] = useState(null);
  const previewAnchorRef = useMemo(() => ({ current: previewAnchorEl }), [previewAnchorEl]);
  const previewPopupRef = useRef(null);
  const previewStyle = usePopoverPosition(previewAnchorRef, previewPopupRef, hoveredFileIndex !== null, {
    placement: "right-start",
  });

  const [badgeAnchorEl, setBadgeAnchorEl] = useState(null);
  const badgeAnchorRef = useMemo(() => ({ current: badgeAnchorEl }), [badgeAnchorEl]);
  const badgePopupRef = useRef(null);
  const badgeStyle = usePopoverPosition(badgeAnchorRef, badgePopupRef, showFileList, {
    placement: "right-start",
  });

  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const actionsAnchorRef = useMemo(() => ({ current: actionsAnchorEl }), [actionsAnchorEl]);
  const actionsPopupRef = useRef(null);
  const actionsStyle = usePopoverPosition(actionsAnchorRef, actionsPopupRef, showActionsIndex !== null, {
    placement: "bottom-end",
  });

  const saveFiles = (newFiles) => {
    setFiles(newFiles);
    onUpdate(columnId, JSON.stringify(newFiles));
  };

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const newFile = await uploadToCloudinary(file);
      saveFiles([...files, newFile]);
      setShowPopup(false);
      setShowFileManager(false);
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error instanceof FileTooLargeError ? t("fileAttachment.fileTooLarge") : t("fileAttachment.uploadFailed"));
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
    setShowActionsIndex(null);
    if (files.length <= 1) setShowFileList(false);
  };

  // `fl_attachment` forces a Content-Disposition: attachment response —
  // only used for the explicit "Download" action, since cross-origin URLs
  // ignore the <a download> attribute otherwise and just navigate instead
  // of downloading. "Open"/"View" actions use the plain URL so PDFs open
  // inline in the browser's own viewer.
  const withDownloadFlag = (url) => {
    if (!url || !url.includes("/raw/upload/") || url.includes("/fl_attachment")) return url;
    return url.replace("/raw/upload/", "/raw/upload/fl_attachment/");
  };

  const downloadFile = (url, name) => {
    const a = document.createElement("a");
    a.href = withDownloadFlag(url);
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

  const isVideo = (url) => url && url.match(/\.(mp4|webm|mov|avi|mkv)$/i);
  const isPdf = (url) => url && url.toLowerCase().includes(".pdf");

  // ============================================================
  // PREVIEW COMPONENT
  // ============================================================
  const PreviewContent = ({ file, onDownload, onDelete }) => {
    const isImg = isImage(file.url);
    const isVid = isVideo(file.url);
    const isPdfFile = isPdf(file.url);

    return (
      <div style={{ padding: 8, minWidth: 160, maxWidth: 220 }}>
        <div style={{ marginBottom: 6, borderRadius: 4, overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 80 }}>
          {isImg ? (
            <img
              src={file.url}
              alt={file.name}
              style={{ width: "100%", maxHeight: 120, objectFit: "contain" }}
            />
          ) : isVid ? (
            <video src={file.url} controls style={{ width: "100%", maxHeight: 120 }} />
          ) : (
            <FileIcon fileName={file.name} size={56} />
          )}
        </div>

        <div style={{ 
          fontSize: 13, 
          fontWeight: 500, 
          color: "#1a1a2e", 
          wordBreak: "break-word",
          whiteSpace: "normal",
          overflowWrap: "break-word",
          maxHeight: 40,
          overflow: "hidden",
          lineHeight: 1.3,
          marginBottom: 2,
        }}>
          {file.name || t("fileAttachment.untitled")}
        </div>

        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
          {file.size ? formatSize(file.size) : ""} {file.isLink ? t("fileAttachment.linkTag") : isPdfFile ? "PDF" : ""}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={onDownload}
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
            {t("fileAttachment.download")}
          </button>
          <button
            onClick={onDelete}
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
            {t("fileAttachment.delete")}
          </button>
        </div>
      </div>
    );
  };

  // ============================================================
  // HITUNG JUMLAH THUMBNAIL YANG MUAT
  // ============================================================
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const thumbnailSize = 32;
      const gap = 4;
      const badgeSize = 24; // 20px + gap
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
    setBadgeAnchorEl(e.currentTarget);
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
    setPreviewAnchorEl(e.currentTarget);
    setHoveredFileIndex(index);
  };

  const handleThumbnailLeave = () => {
    previewTimeoutRef.current = setTimeout(() => {
      setHoveredFileIndex(null);
    }, 100);
  };

  const handlePreviewMouseEnter = () => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
  };

  const handlePreviewMouseLeave = () => {
    previewTimeoutRef.current = setTimeout(() => {
      setHoveredFileIndex(null);
    }, 100);
  };

  // ============================================================
  // PREVIEW DI DALAM DAFTAR FILE – DELAY 1 DETIK
  // ============================================================
  const handleListHover = (e, index) => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    setPreviewAnchorEl(e.currentTarget);
    setHoveredFileIndex(index);
  };

  const handleListLeave = () => {
    previewTimeoutRef.current = setTimeout(() => {
      setHoveredFileIndex(null);
    }, 100);
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
          <span style={{ color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>{t("fileAttachment.addFileOrLink")}</span>
        ) : (
          <>
            {files.slice(0, visibleThumbnails).map((file, index) => (
              <div
                key={index}
                style={{ position: "relative", display: "inline-block", flexShrink: 0 }}
                onMouseEnter={(e) => handleThumbnailHover(e, index)}
                onMouseLeave={handleThumbnailLeave}
              >
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
                  ) : file.isLink ? (
                    <span style={{ fontSize: 14 }}>🔗</span>
                  ) : isVideo(file.url) ? (
                    <span style={{ fontSize: 14 }}>🎬</span>
                  ) : (
                    <FileIcon fileName={file.name} size={28} />
                  )}
                </div>

              </div>
            ))}

            {/* Badge +N – ukuran sedang (20px) */}
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
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: "var(--btn-primary-bg)",
                    border: "1px solid var(--btn-primary-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "white",
                    cursor: "pointer",
                    lineHeight: "20px",
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
      {showFileList && files.length > visibleThumbnails && createPortal(
        <div
          ref={badgePopupRef}
          onMouseEnter={handleFileListMouseEnter}
          onMouseLeave={handleFileListMouseLeave}
          style={{
            ...badgeStyle,
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
            {t("fileAttachment.filesCount", { count: files.length })}
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
              onMouseEnter={(e) => handleListHover(e, index)}
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
                ) : file.isLink ? (
                  <span style={{ fontSize: 14 }}>🔗</span>
                ) : (
                  <FileIcon fileName={file.name} size={28} />
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
                  {file.name || t("fileAttachment.untitled")}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {file.size ? formatSize(file.size) : ""}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (showActionsIndex === index) {
                    setShowActionsIndex(null);
                    setActionsAnchorEl(null);
                  } else {
                    setShowActionsIndex(index);
                    setActionsAnchorEl(e.currentTarget);
                  }
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

              {showActionsIndex === index && createPortal(
                <div
                  ref={actionsPopupRef}
                  style={{
                    ...actionsStyle,
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
                    onClick={() => { window.open(file.url, "_blank"); setShowActionsIndex(null); setActionsAnchorEl(null); }}
                    style={{ display: "block", width: "100%", padding: "6px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, color: "#1a1a2e" }}
                  >
                    {t("fileAttachment.openFile")}
                  </button>
                  <button
                    onClick={() => { downloadFile(file.url, file.name); setShowActionsIndex(null); setActionsAnchorEl(null); }}
                    style={{ display: "block", width: "100%", padding: "6px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, color: "#1a1a2e" }}
                  >
                    {t("fileAttachment.download")}
                  </button>
                  <button
                    onClick={() => { if (confirm(t("fileAttachment.deleteFileConfirm", { name: file.name }))) { removeFile(index); } setShowActionsIndex(null); setActionsAnchorEl(null); }}
                    style={{ display: "block", width: "100%", padding: "6px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, color: "#ef4444", borderTop: "1px solid #f3f4f6" }}
                  >
                    {t("fileAttachment.delete")}
                  </button>
                </div>,
                document.body
              )}
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Shared file preview popup — used by both the thumbnail row and the
          +N file list above; whichever last set previewAnchorEl wins. */}
      {hoveredFileIndex !== null && files[hoveredFileIndex] && createPortal(
        <div
          ref={previewPopupRef}
          onMouseEnter={handlePreviewMouseEnter}
          onMouseLeave={handlePreviewMouseLeave}
          style={{
            ...previewStyle,
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            zIndex: 99999,
            pointerEvents: "auto",
          }}
        >
          <PreviewContent
            file={files[hoveredFileIndex]}
            onDownload={() => {
              downloadFile(files[hoveredFileIndex].url, files[hoveredFileIndex].name);
              setHoveredFileIndex(null);
            }}
            onDelete={() => {
              removeFile(hoveredFileIndex);
              setHoveredFileIndex(null);
            }}
          />
        </div>,
        document.body
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
            <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>{t("fileAttachment.addFileOrLinkTitle")}</h3>

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
                {uploading ? t("fileAttachment.uploading") : t("fileAttachment.clickToUploadFile")}
              </div>
              <input ref={fileInputRef} type="file" onChange={handleFileSelect} disabled={uploading} style={{ display: "none" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("fileAttachment.or")}</span>
              <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder={t("fileAttachment.pasteLinkPlaceholder")}
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
                onKeyDown={(e) => { if (e.key === "Enter") handleLinkAdd(); }}
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
                {t("fileAttachment.add")}
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
              {t("fileAttachment.cancel")}
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
            <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>{t("fileAttachment.filesTitle", { count: files.length })}</h3>

            {files.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>{t("fileAttachment.noFilesYet")}</div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                {files.map((file, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderBottom: "1px solid var(--border-light)" }}>
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
                        <img src={file.url} alt={file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : file.isLink ? (
                        <span style={{ fontSize: 20 }}>🔗</span>
                      ) : (
                        <FileIcon fileName={file.name} size={40} />
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
                        {file.name || t("fileAttachment.untitled")}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {file.size ? formatSize(file.size) : ""} {file.isLink ? t("fileAttachment.linkTag") : ""}
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
                        title={t("fileAttachment.download")}
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t("fileAttachment.deleteFileConfirm", { name: file.name }))) {
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
                        title={t("fileAttachment.delete")}
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
                {t("fileAttachment.addFileBtn")}
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
                {t("fileAttachment.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
