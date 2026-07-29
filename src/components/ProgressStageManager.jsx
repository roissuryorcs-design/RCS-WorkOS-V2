import { useState } from "react";

export default function ProgressStageManager({
  columnId,
  stages,
  onUpdateStages,
  onClose,
}) {
  const [newValue, setNewValue] = useState(50);
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("⚪");
  const [newColor, setNewColor] = useState("#9ca3af");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const sorted = [...stages].sort((a, b) => a.value - b.value);

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) {
      alert("Please enter a stage name.");
      return;
    }
    const value = Math.min(100, Math.max(0, parseInt(newValue, 10) || 0));
    if (stages.some((s) => s.value === value)) {
      alert(`A stage at ${value}% already exists!`);
      return;
    }
    onUpdateStages([...stages, { value, label, icon: newIcon.trim() || "⚪", color: newColor }]);
    setNewLabel("");
    setNewValue(50);
    setNewIcon("⚪");
    setNewColor("#9ca3af");
  };

  const handleDelete = (value) => {
    if (stages.length <= 1) {
      alert("Cannot delete the last stage. At least one stage must remain.");
      return;
    }
    if (!confirm(`Delete stage "${stages.find((s) => s.value === value)?.label}"?`)) return;
    onUpdateStages(stages.filter((s) => s.value !== value));
  };

  const startRename = (index, label) => {
    setEditingIndex(index);
    setEditLabel(label);
  };

  const saveRename = (value) => {
    if (editLabel.trim()) {
      onUpdateStages(stages.map((s) => (s.value === value ? { ...s, label: editLabel.trim() } : s)));
    }
    setEditingIndex(null);
    setEditLabel("");
  };

  const updateValue = (oldValue, rawValue) => {
    const value = Math.min(100, Math.max(0, parseInt(rawValue, 10) || 0));
    if (stages.some((s) => s.value === value && s.value !== oldValue)) return;
    onUpdateStages(stages.map((s) => (s.value === oldValue ? { ...s, value } : s)));
  };

  const updateIcon = (value, icon) => {
    onUpdateStages(stages.map((s) => (s.value === value ? { ...s, icon } : s)));
  };

  const updateColor = (value, color) => {
    onUpdateStages(stages.map((s) => (s.value === value ? { ...s, color } : s)));
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDragOverIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Reordering a value-sorted list doesn't make sense to persist as a
  // separate order — instead dragging just nudges that stage's % value to
  // sit where it was dropped (keeps the "sorted by %" invariant honest).
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (fromIndex === dropIndex) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    const spread = reordered.map((s, i) => ({
      ...s,
      value: Math.round((i / (reordered.length - 1 || 1)) * 100),
    }));
    onUpdateStages(spread);
    setDragOverIndex(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 4, fontSize: 18, fontWeight: 600 }}>
          Manage Progress Stages
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Drag ⠿ to reorder. Click name to rename. At least one stage must remain.
        </p>

        <div style={{ marginBottom: 16 }}>
          {sorted.map((stage, index) => (
            <div
              key={stage.value}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                marginBottom: 4,
                borderRadius: 6,
                borderBottom: "1px solid var(--border-light)",
                background: dragOverIndex === index ? "var(--bg-hover)" : "transparent",
                transition: "background 0.2s, opacity 0.2s",
                cursor: "grab",
              }}
            >
              <span style={{ color: "var(--text-muted)", fontSize: 18, cursor: "grab", userSelect: "none" }}>
                ⠿
              </span>
              <input
                value={stage.icon}
                onChange={(e) => updateIcon(stage.value, e.target.value)}
                style={{
                  width: 30,
                  textAlign: "center",
                  padding: "2px 4px",
                  border: "1px solid var(--border-color)",
                  borderRadius: 4,
                  fontSize: 14,
                  background: "var(--bg-input)",
                }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={stage.value}
                onChange={(e) => updateValue(stage.value, e.target.value)}
                style={{
                  width: 50,
                  padding: "4px 6px",
                  border: "1px solid var(--border-color)",
                  borderRadius: 4,
                  fontSize: 13,
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>%</span>
              {editingIndex === index ? (
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={() => saveRename(stage.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(stage.value);
                    if (e.key === "Escape") { setEditingIndex(null); setEditLabel(""); }
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: "2px 6px",
                    border: "2px solid var(--btn-primary-bg)",
                    borderRadius: 4,
                    fontSize: 14,
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
              ) : (
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    padding: "2px 4px",
                    borderRadius: 3,
                    transition: "background 0.15s",
                  }}
                  onClick={() => startRename(index, stage.label)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  title="Klik untuk rename"
                >
                  {stage.label}
                </span>
              )}
              <input
                type="color"
                value={stage.color}
                onChange={(e) => updateColor(stage.value, e.target.value)}
                style={{ width: 30, height: 30, border: "none", cursor: "pointer", background: "transparent", padding: 0 }}
              />
              <button
                onClick={() => handleDelete(stage.value)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: stages.length <= 1 ? "not-allowed" : "pointer",
                  fontSize: 16,
                  opacity: stages.length <= 1 ? 0.4 : 1,
                  padding: "0 4px",
                }}
                disabled={stages.length <= 1}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="🔘"
            style={{
              width: 40,
              textAlign: "center",
              padding: "6px 4px",
              border: "1px solid var(--border-dark)",
              borderRadius: 6,
              fontSize: 14,
              background: "var(--bg-input)",
            }}
          />
          <input
            type="number"
            min={0}
            max={100}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            style={{
              width: 60,
              padding: "6px 8px",
              border: "1px solid var(--border-dark)",
              borderRadius: 6,
              fontSize: 13,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
          <input
            placeholder="New stage name"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            style={{
              flex: 1,
              minWidth: 100,
              padding: "6px 10px",
              border: "1px solid var(--border-dark)",
              borderRadius: 6,
              fontSize: 13,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            style={{ width: 36, height: 36, border: "none", cursor: "pointer", background: "transparent", padding: 0 }}
          />
          <button
            onClick={handleAdd}
            style={{
              padding: "6px 16px",
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Add
          </button>
        </div>

        <button
          onClick={onClose}
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
          Close
        </button>
      </div>
    </div>
  );
}
