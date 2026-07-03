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
    const newTask = {
      id: Date.now(),
      title: "New Task",
      status: "To Do",
      owner: "-",
      priority: "Low",
      deadline: "-",
      progress: 0,
    };
    setTasks([...tasks, newTask]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>📊 Monday Style Task Table</h2>

      <button onClick={addTask} style={{ marginBottom: 10 }}>
        + Add Task
      </button>

      <table border="1" cellPadding="8" width="100%">
        <thead>
          <tr>
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
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <input
                  value={task.title}
                  onChange={(e) =>
                    updateTask(task.id, "title", e.target.value)
                  }
                />
              </td>

              <td>
                <select
                  value={task.status}
                  onChange={(e) =>
                    updateTask(task.id, "status", e.target.value)
                  }
                >
                  <option>To Do</option>
                  <option>Working</option>
                  <option>Review</option>
                  <option>Done</option>
                </select>
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
                <select
                  value={task.priority}
                  onChange={(e) =>
                    updateTask(task.id, "priority", e.target.value)
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
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

              <td>
                <input
                  type="number"
                  value={task.progress}
                  onChange={(e) =>
                    updateTask(task.id, "progress", e.target.value)
                  }
                />%
              </td>

              <td>
                <button onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
