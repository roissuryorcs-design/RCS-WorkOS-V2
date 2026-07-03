import { useState, useMemo } from "react";

export default function App() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Design UI",
      status: "Working",
      owner: "Andi",
      priority: "High",
      deadline: "2026-07-10",
      progress: 60,
    },
    {
      id: 2,
      title: "API Setup",
      status: "Done",
      owner: "Budi",
      priority: "Medium",
      deadline: "2026-07-08",
      progress: 100,
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const updateTask = (id, field, value) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title: "New Task",
        status: "To Do",
        owner: "-",
        priority: "Low",
        deadline: "-",
        progress: 0,
      },
    ]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
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

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.owner.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "All" || t.status === statusFilter;

      const matchPriority =
        priorityFilter === "All" || t.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial" }}>

      {/* SIDEBAR */}
      <div style={{ width: 220, background: "#111827", color: "white", padding: 20 }}>
        <h2 style={{ fontSize: 18 }}>⚡ WorkOS</h2>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Dashboard</p>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Projects</p>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Tasks</p>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, background: "#f4f6fa", padding: 20 }}>

        {/* TOP BAR */}
        <div style={{
          display: "flex",
          gap: 10,
          marginBottom: 15,
          background: "white",
          padding: 10,
          borderRadius: 10
        }}>
          <input
            placeholder="Search task / owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option>To Do</option>
            <option>Working</option>
            <option>Review</option>
            <option>Done</option>
          </select>

          <select onChange={(e) => setPriorityFilter(e.target.value)}>
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <button onClick={addTask}>+ Add Task</button>
        </div>

        {/* TABLE CARD */}
        <div style={{
          background: "white",
          borderRadius: 12,
          padding: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
        }}>
          <table width="100%" cellPadding="10">
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th>Task</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Priority</th>
                <th>Deadline</th>
                <th>Progress</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  style={{ borderBottom: "1px solid #eee" }}
                >
                  <td>
                    <input
                      value={task.title}
                      onChange={(e) =>
                        updateTask(task.id, "title", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <span style={{
                      background: statusColor(task.status),
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12
                    }}>
                      {task.status}
                    </span>
                  </td>

                  <td>
                    <input
                      value={task.owner}
                      onChange={(e) =>
                        updateTask(task.id, "owner", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <span style={{
                      background: priorityColor(task.priority),
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12
                    }}>
                      {task.priority}
                    </span>
                  </td>

                  <td>{task.deadline}</td>

                  <td style={{ width: 120 }}>
                    <div style={{
                      height: 8,
                      background: "#e5e7eb",
                      borderRadius: 5
                    }}>
                      <div style={{
                        width: `${task.progress}%`,
                        height: "100%",
                        background: "#3b82f6",
                        borderRadius: 5
                      }} />
                    </div>
                  </td>

                  <td>
                    <button onClick={() => deleteTask(task.id)}>
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
