import { useState } from "react";

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

  const priorityColor = (priority) => {
    switch (priority) {
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

  return (
    <div style={{ padding: 20, fontFamily: "Arial", background: "#f9fafb" }}>
      <h2>📊 WorkOS Task Board</h2>

      <button
        onClick={addTask}
        style={{
          marginBottom: 15,
          padding: "8px 12px",
          border: "none",
          background: "#111827",
          color: "white",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        + Add Task
      </button>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <thead style={{ background: "#f3f4f6" }}>
          <tr>
            <th style={{ padding: 10 }}>Task</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Priority</th>
            <th>Deadline</th>
            <th>Progress</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>
                <input
                  value={task.title}
                  onChange={(e) =>
                    updateTask(task.id, "title", e.target.value)
                  }
                  style={{ padding: 6 }}
                />
              </td>

              <td>
                <span
                  style={{
                    background: statusColor(task.status),
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
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
                <span
                  style={{
                    background: priorityColor(task.priority),
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  {task.priority}
                </span>
              </td>

              <td>
                <input
                  type="date"
                  value={task.deadline}
                  onChange={(e) =>
                    updateTask(task.id, "deadline", e.target.value)
                  }
                />
              </td>

              <td style={{ width: 120 }}>
                <div
                  style={{
                    width: "100%",
                    height: 8,
                    background: "#e5e7eb",
                    borderRadius: 5,
                  }}
                >
                  <div
                    style={{
                      width: `${task.progress}%`,
                      height: "100%",
                      background: "#3b82f6",
                      borderRadius: 5,
                    }}
                  />
                </div>
              </td>

              <td>
                <button onClick={() => deleteTask(task.id)}>❌</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
