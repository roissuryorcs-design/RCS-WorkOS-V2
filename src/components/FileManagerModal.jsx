import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useBoards } from "../context/BoardsContext";
import { useFileManager } from "../context/FileManagerContext";
import { useLanguage } from "../context/LanguageContext";
import FileIcon from "./FileIcon";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageUrl(url) {
  return url && /\.(jpe?g|gif|png|webp|svg|bmp)$/i.test(url);
}

// A single file row: icon/thumbnail, name/meta, and a "⋮" menu with
// move/download/delete — used for every section (manual/item/update/
// message unfiled buckets, and inside a custom folder alike).
function FileRow({ file, folders, onMove, onDelete }) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const rowRef = useRef(null);

  return (
    <div
      ref={rowRef}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderBottom: "1px solid var(--border-light)",
        position: "relative",
      }}
    >
      {isImageUrl(file.url) ? (
        <img src={file.url} alt={file.name} style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
      ) : (
        <FileIcon fileName={file.name} size={28} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {formatSize(file.size)}
          {file.size ? " · " : ""}
          {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : ""}
        </div>
      </div>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-secondary)", padding: 4 }}
      >
        ⋮
      </button>
      {menuOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 6,
              zIndex: 11,
              background: "var(--bg-modal)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              boxShadow: "var(--shadow-md)",
              minWidth: 200,
              padding: 6,
            }}
          >
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              style={{ display: "block", padding: "6px 10px", fontSize: 13, color: "var(--text-primary)", textDecoration: "none", borderRadius: 5 }}
            >
              {t("fileManager.download")}
            </a>
            {folders.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  const val = e.target.value;
                  setMenuOpen(false);
                  if (val === "__root__") onMove(file, null);
                  else if (val) onMove(file, val);
                }}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  fontSize: 12.5,
                  border: "1px solid var(--border-color)",
                  borderRadius: 5,
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  marginTop: 2,
                }}
              >
                <option value="" disabled>
                  {t("fileManager.moveToFolder")}
                </option>
                <option value="__root__">{t("fileManager.moveToRoot")}</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete(file);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 10px",
                fontSize: 13,
                color: "#e2445c",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderRadius: 5,
                marginTop: 2,
              }}
            >
              {t("fileManager.deleteBtn")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FileSection({ title, files, folders, onMove, onDelete }) {
  if (!files || files.length === 0) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>{title}</div>
      <div style={{ border: "1px solid var(--border-light)", borderRadius: 8, overflow: "hidden" }}>
        {files.map((f, i) => (
          <FileRow key={f.id || `${f.sourceType}-${f.sourceId}-${f.url}-${i}`} file={f} folders={folders} onMove={onMove} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export default function FileManagerModal({ onClose }) {
  const { t } = useLanguage();
  const { nodes } = useBoards();
  const { boardData, loadBoardFiles, getBoardFiles, createFolder, deleteFolder, moveFileToFolder, uploadManualFile, deleteFile } = useFileManager();
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [folderPath, setFolderPath] = useState([]); // array of {id, name}
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const fileInputRef = useRef(null);

  const topLevelNodes = nodes.filter((n) => !n.parentId);
  const childrenOf = (id) => nodes.filter((n) => n.parentId === id);

  useEffect(() => {
    if (selectedBoardId && !boardData[selectedBoardId]?.loaded && !boardData[selectedBoardId]?.loading) {
      loadBoardFiles(selectedBoardId);
    }
  }, [selectedBoardId, boardData, loadBoardFiles]);

  const selectBoard = (boardId) => {
    setSelectedBoardId(boardId);
    setFolderPath([]);
    setSearch("");
  };

  const currentFolderId = folderPath.length ? folderPath[folderPath.length - 1].id : null;
  const boardFiles = selectedBoardId ? getBoardFiles(selectedBoardId) : null;
  const allFolders = boardFiles?.folders || [];
  const subFolders = allFolders.filter((f) => f.parentId === currentFolderId);
  const selectedBoard = nodes.find((n) => n.id === selectedBoardId);

  const query = search.trim().toLowerCase();
  const filterFiles = (list) => (query ? list.filter((f) => (f.name || "").toLowerCase().includes(query)) : list);

  const handleMove = (file, folderId) => moveFileToFolder(selectedBoardId, file, folderId);
  const handleDelete = (file) => {
    if (!confirm(t("fileManager.deleteFileConfirm"))) return;
    deleteFile(selectedBoardId, file);
  };

  const handleNewFolder = () => {
    const name = prompt(t("fileManager.newFolderPrompt"));
    if (name && name.trim()) createFolder(selectedBoardId, currentFolderId, name);
  };

  const handleDeleteCurrentFolder = () => {
    const last = folderPath[folderPath.length - 1];
    if (!last) return;
    if (!confirm(t("fileManager.deleteFolderConfirm"))) return;
    deleteFolder(selectedBoardId, last.id).then(() => setFolderPath((p) => p.slice(0, -1)));
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      await uploadManualFile(selectedBoardId, currentFolderId, file);
    }
    setUploading(false);
  };

  // Scoped to whatever's currently visible: a folder's own files when
  // drilled in, or all of the board's unfiled sections at root — not
  // recursive into sub-folders, to keep the archive predictable.
  const handleDownloadZip = async () => {
    const filesToZip = currentFolderId ? filterFiles(inFolder) : [...unfiled.manual, ...unfiled.item, ...unfiled.update, ...unfiled.message];
    if (!filesToZip.length) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const usedNames = new Set();
      await Promise.all(
        filesToZip.map(async (f) => {
          try {
            const res = await fetch(f.url);
            const blob = await res.blob();
            let name = f.name || "file";
            if (usedNames.has(name)) {
              const dot = name.lastIndexOf(".");
              const base = dot > 0 ? name.slice(0, dot) : name;
              const ext = dot > 0 ? name.slice(dot) : "";
              name = `${base}_${Math.random().toString(36).slice(2, 6)}${ext}`;
            }
            usedNames.add(name);
            zip.file(name, blob);
          } catch (err) {
            console.error("Error fetching file for zip:", f.url, err);
          }
        })
      );
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(selectedBoard?.name || "files").replace(/[^\w\- ]/g, "").trim() || "files"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  };

  const renderNode = (node, depth) => {
    if (node.type === "board") {
      return (
        <div
          key={node.id}
          onClick={() => selectBoard(node.id)}
          style={{
            padding: "6px 10px",
            paddingLeft: 10 + depth * 16,
            fontSize: 13,
            cursor: "pointer",
            borderRadius: 6,
            background: selectedBoardId === node.id ? "var(--bg-active)" : "transparent",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          📋 {node.name}
        </div>
      );
    }
    const children = childrenOf(node.id);
    return (
      <div key={node.id}>
        <div style={{ padding: "6px 10px", paddingLeft: 10 + depth * 16, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
          📁 {node.name}
        </div>
        {children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  const unfiled = boardFiles?.unfiled || { manual: [], item: [], update: [], message: [] };
  const inFolder = boardFiles?.byFolder?.[currentFolderId] || [];
  const isLoading = selectedBoardId && !boardData[selectedBoardId]?.loaded;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-modal)",
          borderRadius: 12,
          width: "90vw",
          maxWidth: 1100,
          height: "85vh",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>🗂️ {t("fileManager.title")}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 18 }}>
            ✕
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border-color)", overflowY: "auto", padding: 8 }}>
            {topLevelNodes.map((n) => renderNode(n, 0))}
          </div>

          <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: 16 }}>
            {!selectedBoardId ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", marginTop: 40 }}>{t("fileManager.pickBoard")}</div>
            ) : isLoading ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>…</div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                  <span style={{ cursor: "pointer" }} onClick={() => setFolderPath([])}>
                    {selectedBoard?.name}
                  </span>
                  {folderPath.map((f, i) => (
                    <span key={f.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span>/</span>
                      <span style={{ cursor: "pointer" }} onClick={() => setFolderPath(folderPath.slice(0, i + 1))}>
                        {f.name}
                      </span>
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("fileManager.searchPlaceholder")}
                    style={{
                      flex: "1 1 200px",
                      padding: "7px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border-dark)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      fontSize: 13,
                    }}
                  />
                  <button onClick={handleNewFolder} style={btnStyle}>
                    {t("fileManager.newFolderBtn")}
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={btnStyle}>
                    {uploading ? t("fileManager.uploading") : t("fileManager.uploadBtn")}
                  </button>
                  <input ref={fileInputRef} type="file" multiple hidden onChange={handleUpload} />
                  <button onClick={handleDownloadZip} disabled={zipping} style={btnStyle}>
                    {zipping ? t("fileManager.zipping") : t("fileManager.downloadAllBtn")}
                  </button>
                  {currentFolderId && subFolders.length === 0 && inFolder.length === 0 && (
                    <button onClick={handleDeleteCurrentFolder} style={{ ...btnStyle, color: "#e2445c" }}>
                      {t("fileManager.deleteBtn")}
                    </button>
                  )}
                </div>

                {subFolders.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {subFolders.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setFolderPath([...folderPath, { id: f.id, name: f.name }])}
                        style={{
                          padding: "8px 14px",
                          border: "1px solid var(--border-color)",
                          borderRadius: 8,
                          fontSize: 13,
                          cursor: "pointer",
                          background: "var(--bg-card)",
                        }}
                      >
                        📁 {f.name}
                      </div>
                    ))}
                  </div>
                )}

                {currentFolderId ? (
                  filterFiles(inFolder).length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("fileManager.emptyFolder")}</div>
                  ) : (
                    <FileSection title="" files={filterFiles(inFolder)} folders={allFolders} onMove={handleMove} onDelete={handleDelete} />
                  )
                ) : (
                  <>
                    <FileSection title={t("fileManager.sectionManual")} files={filterFiles(unfiled.manual)} folders={allFolders} onMove={handleMove} onDelete={handleDelete} />
                    <FileSection title={t("fileManager.sectionItem")} files={filterFiles(unfiled.item)} folders={allFolders} onMove={handleMove} onDelete={handleDelete} />
                    <FileSection title={t("fileManager.sectionUpdate")} files={filterFiles(unfiled.update)} folders={allFolders} onMove={handleMove} onDelete={handleDelete} />
                    <FileSection title={t("fileManager.sectionMessage")} files={filterFiles(unfiled.message)} folders={allFolders} onMove={handleMove} onDelete={handleDelete} />
                    {!unfiled.manual.length && !unfiled.item.length && !unfiled.update.length && !unfiled.message.length && (
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("fileManager.noFiles")}</div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const btnStyle = {
  padding: "7px 12px",
  background: "transparent",
  color: "var(--btn-primary-bg)",
  border: "1px solid var(--btn-primary-bg)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12.5,
  whiteSpace: "nowrap",
};
