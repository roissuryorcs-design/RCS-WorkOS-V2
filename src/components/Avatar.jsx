// Generic member avatar — shows the profile photo when set, otherwise a
// colored initial-letter circle (same hashed-color idea as WorkspaceSwitcher's
// WorkspaceAvatar, but circular since this represents a person, not a
// workspace, and self-contained/inline so it doesn't depend on sidebar.css).
const AVATAR_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#6366f1"];

function avatarColor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function Avatar({ url, name, size = 32, style }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const seed = name || "?";

  if (url) {
    return (
      <img
        src={url}
        alt={name || ""}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: avatarColor(seed),
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.42,
        flexShrink: 0,
        ...style,
      }}
    >
      {initial}
    </span>
  );
}
