import { useState, useMemo, useEffect } from "react";

export default function App() {
  // ✅ LOAD FROM LOCALSTORAGE
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved
      ? JSON.parse(saved)
      : [
          // Target & PLANNING
          {
            id: 1,
            title: "Design UI",
            status: "Working",
            files: 13,
            budget: 0,
            lastUpdated: "5 months ago",
            priority: "High",
            notes: "Meeting notes",
            group: "Target & PLANNING",
          },
          {
            id: 2,
            title: "API Setup",
            status: "Review",
            files: 1,
            budget: 0,
            lastUpdated: "4 months ago",
            priority: "Low",
            notes: "Action items",
            group: "Target & PLANNING",
          },
          // Completed
          {
            id: 3,
            title: "Database Migration",
            status: "Done",
            files: 3,
            budget: 6000000,
            lastUpdated: "5 months ago",
            priority: "Medium",
            notes: "Other",
            group: "Completed",
          },
          {
            id: 4,
            title: "User Testing",
            status: "Done",
            files: 1,
            budget: 0,
            lastUpdated: "5 months ago",
            priority: "Low",
            notes: "Other",
            group: "Completed",
          },
        ];
  });

  // ✅ AUTO SAVE
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const updateTask = (id, field, value) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const addTask = (group) => {
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title: "New Task",
        status: "To Do",
        files: 0,
        budget: 0,
        lastUpdated: "Just now",
        priority: "Low",
        notes: "-",
        group: group || "Target & PLANNING",
      },
    ]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const addNewGroup = () => {
    const groupName = prompt("Enter new group name:");
    if (groupName && groupName.trim()) {
      // Add a new group with a sample task
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          title: "New Task",
          status: "To Do",
          files: 0,
          budget: 0,
          lastUpdated: "Just now",
          priority: "Low",
          notes: "-",
          group: groupName.trim(),
        },
      ]);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "To Do":
        return "#9ca3af";
      case "Working":
        return "#3b82f6";
      case "Review":
        return "#f59e0b";
      case "Done":
        return "#22c55e";
      default:
        return "#9ca3af";
    }
  };

  const priorityColor = (p) => {
    switch (p) {
      case "Low":
        return "#22c55e";
      case "Medium":
        return "#f59e0b";
      case "High":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  };

  // FILTER SYSTEM
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.notes.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "All" || t.status === statusFilter;

      const matchPriority =
        priorityFilter === "All" || t.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  // Group tasks by 'group' property
  const groupedTasks = useMemo(() => {
    const groups = {};
    filtered.forEach((task) => {
      const groupName = task.group || "Uncategorized";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(task);
    });
    return groups;
  }, [filtered]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial" }}>
      {/* SIDEBAR - Monday.com Style */}
      <div
        style={{
          width: 260,
          background: "#f5f6f8",
          padding: "20px 16px",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 20, color: "#1a1a2e" }}>
          📊 WorkOS
        </h2>

        {/* Main Menu */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, padding: "8px 12px", borderRadius: 6, background: "#e5e7eb", fontWeight: 500 }}>
            🏠 Home
          </p>
          <p style={{ fontSize: 14, padding: "8px 12px", borderRadius: 6, color: "#4b5563" }}>
            📋 My work
          </p>
          <p style={{ fontSize: 14, padding: "8px 12px", borderRadius: 6, color: "#4b5563" }}>
            ➕ More
          </p>
          <p style={{ fontSize: 14, padding: "8px 12px", borderRadius: 6, color: "#4b5563" }}>
            🤖 Monday AI
          </p>
        </div>

        {/* Favorites */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 8, letterSpacing: "0.5px" }}>
            FAVORITES
          </p>
          <div style={{ fontSize: 14, padding: "8px 12px", borderRadius: 6, background: "#e5e7eb", fontWeight: 500 }}>
            📁 Workspace
          </div>
          <div style={{ fontSize: 14, padding: "8px 12px", borderRadius: 6, color: "#4b5563" }}>
            📁 Administration
          </div>
          <div style={{ fontSize: 14, padding: "8px 12px", borderRadius: 6, color: "#4b5563" }}>
            📁 New Folder
          </div>
          <div style={{ fontSize: 14, padding: "8px 12px", borderRadius: 6, color: "#4b5563" }}>
            📁 New Folder
          </div>
          <div style={{ fontSize: 14, padding: "8px 12px", borderRadius: 6, color: "#4b5563" }}>
            💰 Finance
          </div>
          <div style={{ fontSize: 14, padding: "8px 12px", borderRadius: 6, color: "#4b5563" }}>
            📁 New Folder
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: "#ffffff", padding: "24px 32px" }}>
        {/* TOP BAR - Administration Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1a1a2e" }}>
            Administration
          </h1>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button style={buttonStyle}>📊 Main table</button>
            <button style={buttonStyle}>📅 Calendar</button>
            <button style={buttonStyle}>🔮 Build Vibe view</button>
            <button
              style={{
                ...buttonStyle,
                background: "#3b82f6",
                color: "white",
                border: "none",
              }}
              onClick={() => addTask("Target & PLANNING")}
            >
              + New task
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 12,
          }}
        >
          <input
            placeholder="🔍 Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 14px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              width: 200,
            }}
          />

          <select
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            <option>All</option>
            <option>To Do</option>
            <option>Working</option>
            <option>Review</option>
            <option>Done</option>
          </select>

          <select
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={selectStyle}
          >
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <button style={filterButtonStyle}>👤 Person</button>
          <button style={filterButtonStyle}>🔽 Filter</button>
          <button style={filterButtonStyle}>↕ Sort</button>
          <button style={filterButtonStyle}>👁️ Hide</button>
          <button style={filterButtonStyle}>📊 Group by</button>
        </div>

        {/* TASKS BY GROUP - Monday.com Style */}
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName} style={{ marginBottom: 32 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#1a1a2e",
                marginBottom: 12,
                paddingBottom: 4,
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              {groupName}
            </h3>

            <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                  <th style={{ width: "25%" }}>Task</th>
                  <th style={{ width: "12%" }}>Status</th>
                  <th style={{ width: "10%" }}>Files</th>
                  <th style={{ width: "15%" }}>Budget</th>
                  <th style={{ width: "15%" }}>Last updated</th>
                  <th style={{ width: "10%" }}>Priority</th>
                  <th style={{ width: "13%" }}>Notes</th>
                  <th style={{ width: "5%" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupTasks.map((task) => (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      transition: "0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f9fafb")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "white")
                    }
                  >
                    <td>
                      <input
                        value={task.title}
                        onChange={(e) =>
                          updateTask(task.id, "title", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    <td>
                      <span
                        style={{
                          background: statusColor(task.status),
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {task.status}
                      </span>
                    </td>

                    <td style={{ fontSize: 14, color: "#4b5563" }}>
                      📎 +{task.files}
                    </td>

                    <td>
                      <input
                        value={task.budget === 0 ? "Rp. 0" : `Rp. ${task.budget.toLocaleString()}`}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          updateTask(task.id, "budget", parseInt(value) || 0);
                        }}
                        style={inputStyle}
                      />
                    </td>

                    <td style={{ fontSize: 13, color: "#6b7280" }}>
                      {task.lastUpdated}
                    </td>

                    <td>
                      <span
                        style={{
                          background: priorityColor(task.priority),
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td>
                      <input
                        value={task.notes}
                        onChange={(e) =>
                          updateTask(task.id, "notes", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    <td>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 16,
                          color: "#9ca3af",
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Add task button inside group */}
                <tr>
                  <td colSpan="8">
                    <button
                      onClick={() => addTask(groupName)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#3b82f6",
                        padding: "8px 0",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        width: "100%",
                        textAlign: "left",
                      }}
                    >
                      + Add task
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* ADD NEW GROUP BUTTON */}
        <button
          onClick={addNewGroup}
          style={{
            background: "none",
            border: "1px dashed #d1d5db",
            borderRadius: 8,
            padding: "12px 20px",
            cursor: "pointer",
            fontSize: 14,
            color: "#6b7280",
            width: "100%",
            marginTop: 12,
            transition: "0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          + Add new group
        </button>
      </div>
    </div>
  );
}

// STYLE HELPERS
const buttonStyle = {
  padding: "6px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  fontSize: 13,
  color: "#4b5563",
  transition: "0.2s",
};

const selectStyle = {
  padding: "8px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  background: "white",
  color: "#4b5563",
  cursor: "pointer",
};

const filterButtonStyle = {
  padding: "6px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  fontSize: 13,
  color: "#4b5563",
};

const inputStyle = {
  border: "none",
  background: "transparent",
  fontSize: 14,
  padding: "4px 0",
  width: "100%",
  color: "#1a1a2e",
  outline: "none",
};
