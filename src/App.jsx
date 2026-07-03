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
  const [sortBy, setSortBy] = useState("none");

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

  const filteredTasks = useMemo(() => {
    let data = [...tasks];

    // SEARCH
    if (search) {
      data = data.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.owner.toLowerCase().includes(search.toLowerCase())
      );
    }

    // STATUS FILTER
    if (statusFilter !== "All") {
      data = data.filter((t) => t.status === statusFilter);
    }

    // PRIORITY FILTER
    if (priorityFilter !== "All") {
      data = data.filter((t) => t.priority === priorityFilter);
    }

    // SORTING
    if (sortBy === "deadline") {
      data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortBy === "progress") {
      data.sort((a, b) => b.progress - a.progress);
    } else if (sortBy === "priority") {
      const order = { High: 3, Medium: 2, Low: 1 };
      data.sort((a, b) => order[b.priority] - order[a.priority]);
    }

    return data;
  }, [tasks, search, statusFilter, priorityFilter, sortBy]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial", background: "#f9fafb" }}>
      <h2>📊 WorkOS Advanced Dashboard</h2>

      {/* CONTROL BAR */}
      <div style={{ marginBottom: 15, display: "flex", gap: 10, flexWrap: "wrap" }}>
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

        <select onChange={(e) => setSortBy(e.target.value)}>
          <option value="none">No Sort</option>
          <option value="deadline">Sort by Deadline</option>
          <option value="progress">Sort by Progress</option>
          <option value="priority">Sort by Priority</option>
        </select>

        <button onClick={addTask}>+ Add Task</button>
      </div>

      {/* TABLE */}
      <table width="100%" border="1" cellPadding="8">
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
          {filteredTasks.map((task) => (
            <tr key={task.id}>
              <td>
                <input
                  value={task.title}
                  onChange={(e) =>
                    updateTask(task.id, "title", e.target.value)
                  }
                />
              </td>

              <td>{task.status}</td>
              <td>{task.owner}</td>
              <td>{task.priority}</td>
              <td>{task.deadline}</td>

              <td>{task.progress}%</td>

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
