import { useState } from "react";
import StatusCell from "./StatusCell";

export default function Row({
  item,
  groupColor,
  visibleColumns,
  isSelected,
  onToggleSelect,
  onUpdate,
  onDelete,
  onOpenStatusManager,
}) {
  const inputStyle = {
    border: "none",
    background: "transparent",
    fontSize: 13,
    padding: "4px 2px",
    width: "100%",
    color: "var(--text-primary)",
    outline: "none",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  };

  const renderCell = (col) => {
    const value = item[col.id] !== undefined ? item[col.id] : "";
    const type = col.type || "text";

    switch (type) {
      case "status":
        return (
          <StatusCell
            columnId={col.id}
            status={item[col.id]}
            statuses={col.statuses || {}}
            statusOrder={col.statusOrder || []}
            onChange={(val) => onUpdate(col.id, val)}
            onOpenStatusManager={onOpenStatusManager}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => onUpdate(col.id, e.target.value)}
            style={inputStyle}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onUpdate(col.id, e.target.value)}
            style={inputStyle}
          />
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onUpdate(col.id, e.target.checked)}
            style={{ cursor: "pointer", width: 16, height: 16 }}
          />
        );

      case "people":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onUpdate(col.id, e.target.value)}
            style={inputStyle}
            placeholder="Assign to..."
          />
        );

      case "progress":
        const progress = parseInt(value) || 0;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              flex: 1,
              height: 6,
              background: "var(--border-color)",
              borderRadius: 3,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                height: "100%",
                background: progress >= 100 ? "#22c55e" : "#3b82f6",
                borderRadius: 3,
              }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 30 }}>
              {progress}%
            </span>
          </div>
        );

      case "files": {
        const [uploading, setUploading] = useState(false);
        const [fileUrl, setFileUrl] = useState(value || "");

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
              const url = data.secure_url;
              setFileUrl(url);
              onUpdate(col.id, url);
              console.log("✅ Upload success:", url);
            }
          } catch (error) {
            console.error("❌ Upload failed:", error);
            alert("Upload failed. Please try again.");
          } finally {
            setUploading(false);
          }
        };

        const handleFileChange = (e) => {
          const file = e.target.files[0];
          if (file) uploadFile(file);
        };

        const handleRemove = () => {
          setFileUrl("");
          onUpdate(col.id, "");
        };

        const isImage = fileUrl && fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <input
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              style={{
                fontSize: 11,
                maxWidth: 120,
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            />
            {uploading && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>⏳ Uploading...</span>}
            {fileUrl && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {isImage ? (
                  <img
                    src={fileUrl}
                    alt="upload"
                    style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 14 }}>📎</span>
                )}
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 11,
                    color: "var(--btn-primary-bg)",
                    textDecoration: "underline",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 80,
                  }}
                >
                  {fileUrl.split("/").pop() || "file"}
                </a>
                <button
                  onClick={handleRemove}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        );
      }

      default: // text
        return (
          <input
            value={value}
            onChange={(e) => onUpdate(col.id, e.target.value)}
            style={inputStyle}
            placeholder={col.label}
          />
        );
    }
  };

  return (
    <tr
      style={{
        fontSize: 13,
        background: isSelected ? "var(--bg-hover)" : "var(--bg-secondary)",
        borderLeft: `4px solid ${groupColor}`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = "var(--bg-secondary)";
        }
      }}
    >
      {/* Checkbox – STICKY */}
      <td
        style={{
          padding: "6px 8px",
          width: "36px",
          minWidth: "36px",
          maxWidth: "36px",
          borderRight: "2px solid var(--border-color)",
          borderBottom: "2px solid var(--border-color)",
          textAlign: "center",
          boxSizing: "border-box",
          position: "sticky",
          left: 0,
          zIndex: 20,
          background: isSelected ? "var(--bg-hover)" : "var(--bg-secondary)",
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ cursor: "pointer", width: 16, height: 16 }}
        />
      </td>

      {visibleColumns.map((col, idx) => {
        const isLast = idx === visibleColumns.length - 1;
        const isItem = col.id === "item";

        const stickyStyle = isItem
          ? {
              position: "sticky",
              left: "36px",
              zIndex: 20,
              background: isSelected ? "var(--bg-hover)" : "var(--bg-secondary)",
              boxShadow: "inset -2px 0 0 0 var(--border-color)",
            }
          : {};

        return (
          <td
            key={col.id}
            style={{
              padding: "6px 8px",
              borderRight: isLast ? "none" : "2px solid var(--border-color)",
              borderBottom: "2px solid var(--border-color)",
              width: `${col.width}px`,
              minWidth: `${col.width}px`,
              maxWidth: `${col.width}px`,
              boxSizing: "border-box",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              ...stickyStyle,
            }}
          >
            {renderCell(col)}
          </td>
        );
      })}

      {/* Kolom "+" (padding) */}
      <td
        style={{
          padding: "6px 8px",
          width: "50px",
          minWidth: "50px",
          maxWidth: "50px",
          borderRight: "none",
          borderLeft: "2px solid var(--border-color)",
          borderBottom: "2px solid var(--border-color)",
          boxSizing: "border-box",
        }}
      />
    </tr>
  );
}
