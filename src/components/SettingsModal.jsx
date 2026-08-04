import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useProfile } from "../context/ProfileContext";
import { useLanguage } from "../context/LanguageContext";
import { useBoards } from "../context/BoardsContext";
import { uploadToCloudinary, FileTooLargeError } from "../utils/cloudinaryUpload";
import Avatar from "./Avatar";

// Same overlay/box treatment as MemberDirectory — kept consistent across
// every modal in the app rather than introducing a new chrome pattern.
export default function SettingsModal({ onClose }) {
  const { t } = useLanguage();
  const { profile, updateProfile } = useProfile();
  const { workspaces, activeWorkspaceId } = useBoards();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [jobTitle, setJobTitle] = useState(profile?.job_title || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [hobby, setHobby] = useState(profile?.hobby || "");
  const [zoomLink, setZoomLink] = useState(profile?.zoom_link || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // null | "saved" | "error"

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      await updateProfile({ avatar_url: result.url });
    } catch (err) {
      alert(err instanceof FileTooLargeError ? err.message : t("settingsModal.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    const { error } = await updateProfile({
      display_name: displayName.trim() || profile?.email,
      job_title: jobTitle.trim() || null,
      phone: phone.trim() || null,
      hobby: hobby.trim() || null,
      zoom_link: zoomLink.trim() || null,
    });
    setSaving(false);
    setStatus(error ? "error" : "saved");
  };

  const roleLabel = (role) =>
    role === "owner" ? t("memberDirectory.roleOwner") : role === "admin" ? t("memberDirectory.roleAdmin") : t("memberDirectory.roleMember");

  const activeRole = workspaces.find((w) => w.id === activeWorkspaceId)?.role;

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--border-dark)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: 13,
    boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, display: "block" };

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
          padding: 24,
          maxWidth: 460,
          width: "92%",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>{t("settingsModal.title")}</h3>

        {/* Profile card — bigger avatar + name + role badge up top, same
            idea as most account-settings pages (monday.com included). */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
          <div style={{ flexShrink: 0 }}>
            <Avatar url={profile?.avatar_url} name={displayName || profile?.email} size={80} />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                display: "block",
                marginTop: 8,
                width: 80,
                padding: "5px 0",
                borderRadius: 6,
                border: "1px solid var(--border-dark)",
                background: "var(--bg-hover)",
                color: "var(--text-primary)",
                cursor: uploading ? "default" : "pointer",
                fontSize: 11,
              }}
            >
              {uploading ? t("settingsModal.uploading") : t("settingsModal.uploadPhotoBtn")}
            </button>
          </div>
          <div style={{ minWidth: 0, paddingTop: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName || profile?.email}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile?.email}
            </div>
            {activeRole && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 12,
                  background: activeRole === "owner" ? "#f59e0b22" : "var(--bg-hover)",
                  color: activeRole === "owner" ? "#f59e0b" : "var(--text-secondary)",
                }}
              >
                {activeRole === "owner" && "👑"}
                {roleLabel(activeRole)}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>{t("settingsModal.displayNameLabel")}</label>
            <input
              style={inputStyle}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("settingsModal.displayNamePlaceholder")}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("settingsModal.jobTitleLabel")}</label>
            <input
              style={inputStyle}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder={t("settingsModal.jobTitlePlaceholder")}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("settingsModal.phoneLabel")}</label>
            <input
              style={inputStyle}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("settingsModal.phonePlaceholder")}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("settingsModal.hobbyLabel")}</label>
            <input
              style={inputStyle}
              value={hobby}
              onChange={(e) => setHobby(e.target.value)}
              placeholder={t("settingsModal.hobbyPlaceholder")}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("settingsModal.zoomLinkLabel")}</label>
            <input
              style={inputStyle}
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              placeholder={t("settingsModal.zoomLinkPlaceholder")}
            />
          </div>
        </div>

        {/* My workspaces — same idea as "My teams" in the reference, using
            data BoardsContext already loads (no new query needed). */}
        {workspaces.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>{t("settingsModal.myWorkspacesLabel")}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {workspaces.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: "var(--bg-hover)",
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                    {w.role === "owner" && "👑 "}
                    {roleLabel(w.role)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === "saved" && (
          <div style={{ fontSize: 12, color: "#16a34a", marginBottom: 10 }}>{t("settingsModal.saved")}</div>
        )}
        {status === "error" && (
          <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{t("settingsModal.saveFailed")}</div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: "9px",
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              borderRadius: 6,
              cursor: saving ? "default" : "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {t("settingsModal.saveBtn")}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px",
              background: "var(--bg-hover)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
