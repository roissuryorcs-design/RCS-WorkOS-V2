import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ColumnProvider } from "./context/ColumnContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import BoardTable from "./components/BoardTable";
import StatusManager from "./components/StatusManager";
import "./App.css";

function AppContent() {
  const [items, setItems] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [groupColors, setGroupColors] = useState({});

  useEffect(() => {
    const savedItems = localStorage.getItem("forelItems");
    const savedStatuses = localStorage.getItem("forelStatuses");
    const savedFavs = localStorage.getItem("forelFavorites");
    const savedGroupColors = localStorage.getItem("forelGroupColors");

    const defaultStatuses = { Default: "#9ca3af" };

    if (savedStatuses) {
      const parsed = JSON.parse(savedStatuses);
      if (Object.keys(parsed).length === 0) {
        setStatuses(defaultStatuses);
      } else {
        setStatuses(parsed);
      }
    } else {
      setStatuses(defaultStatuses);
    }

    if (savedItems) {
      setItems(JSON.parse(savedItems));
    } else {
      setItems([
        { id: 1, group: "Target & PLANNING", item: "Scope of Work", document: "", people: "Done", status: "Default", dueDate: "dd/mm/tttt", rev: "R0" },
        { id: 2, group: "Target & PLANNING", item: "GA Drawings", document: "", people: "Done", status: "Default", dueDate: "dd/mm/tttt", rev: "R0" },
        { id: 3, group: "Target & PLANNING", item: "General Arrangement", document: "ID-F-FT-NN1-GAD-FP-0", people: "RS", status: "Default", dueDate: "01/07/2026", rev: "R1" },
        { id: 4, group: "Completed", item: "HVAC Room Arrangement DI", document: "P2104-V-D-GSHD-ME-GA", people: "Done", status: "Default", dueDate: "dd/mm/tttt", rev: "R0" },
        { id: 5, group: "Completed", item: "Layout Drawings", document: "", people: "Done", status: "Default", dueDate: "dd/mm/tttt", rev: "R0" },
      ]);
    }

    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs));
    } else {
      setFavorites(["Workspace", "Administration"]);
    }

    if (savedGroupColors) {
      setGroupColors(JSON.parse(savedGroupColors));
    } else {
      const defaultColors = {};
      const groups = [...new Set(JSON.parse(savedItems || "[]").map(item => item.group))];
      groups.forEach(g => { defaultColors[g] = "#3b82f6"; });
      setGroupColors(defaultColors);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("forelItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("forelStatuses", JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    localStorage.setItem("forelFavorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("forelGroupColors", JSON.stringify(groupColors));
  }, [groupColors]);

  const saveHistory = (newItems) => {
    setHistory((prev) => [...prev, items]);
    setItems(newItems);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setItems(prevState);
  };

  const updateItem = (id, field, value) => {
    const newItems = items.map((it) =>
      it.id === id ? { ...it, [field]: value } : it
    );
    saveHistory(newItems);
  };

  const deleteItem = (id) => {
    if (!confirm("Delete this item?")) return;
    const newItems = items.filter((it) => it.id !== id);
    saveHistory(newItems);
  };

  const addItem = (groupName) => {
    const firstStatus = Object.keys(statuses)[0] || "Default";
    const newItem = {
      id: Date.now(),
      group: groupName || "Target & PLANNING",
      item: "New Task",
      document: "",
      people: "",
      status: firstStatus,
      dueDate: "-",
      rev: "R0",
    };
    saveHistory([...items, newItem]);
  };

  const addGroup = () => {
    const name = prompt("Enter new group name:");
    if (!name || !name.trim()) return;
    if (items.some((item) => item.group === name.trim())) {
      alert(`Group "${name.trim()}" already exists!`);
      return;
    }
    const firstStatus = Object.keys(statuses)[0] || "Default";
    const newItem = {
      id: Date.now(),
      group: name.trim(),
      item: `New Task in ${name.trim()}`,
      document: "",
      people: "",
      status: firstStatus,
      dueDate: "-",
      rev: "R0",
    };
    saveHistory([...items, newItem]);
    setGroupColors(prev => ({ ...prev, [name.trim()]: "#3b82f6" }));
  };

  const deleteGroup = (groupName) => {
    if (!confirm(`Delete entire group "${groupName}" and all its items?`)) return;
    const newItems = items.filter((it) => it.group !== groupName);
    saveHistory(newItems);
    const newColors = { ...groupColors };
    delete newColors[groupName];
    setGroupColors(newColors);
  };

  const updateGroupColor = (groupName, color) => {
    setGroupColors(prev => ({ ...prev, [groupName]: color }));
  };

  const addStatus = (name, color) => {
    const finalName = name.trim() || "Default";
    if (statuses[finalName]) {
      alert(`Status "${finalName}" already exists!`);
      return;
    }
    setStatuses({ ...statuses, [finalName]: color || "#9ca3af" });
  };

  const updateStatusColor = (name, color) => {
    setStatuses({ ...statuses, [name]: color });
  };

  const deleteStatus = (name) => {
    const currentKeys = Object.keys(statuses);
    if (currentKeys.length <= 1) {
      alert("Cannot delete the last status. At least one status must remain.");
      return;
    }
    const remainingStatus = currentKeys.find((k) => k !== name) || "Default";
    const newItems = items.map((it) =>
      it.status === name ? { ...it, status: remainingStatus } : it
    );
    const newStatuses = { ...statuses };
    delete newStatuses[name];
    setStatuses(newStatuses);
    setItems(newItems);
  };

  const addFavorite = () => {
    const name = prompt("Enter favorite name:");
    if (name && name.trim()) {
      setFavorites([...favorites, name.trim()]);
    }
  };

  const removeFavorite = (index) => {
    const newFavs = favorites.filter((_, i) => i !== index);
    setFavorites(newFavs);
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ items, statuses, groupColors }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forel_data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredItems = items.filter((it) =>
    it.item.toLowerCase().includes(search.toLowerCase()) ||
    it.document.toLowerCase().includes(search.toLowerCase()) ||
    it.people.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = filteredItems.length;
  const hasDoneStatus = Object.keys(statuses).includes("Done");
  const doneItems = hasDoneStatus
    ? filteredItems.filter((it) => it.status === "Done").length
    : 0;
  const pendingItems = totalItems - doneItems;
  const allGroups = [...new Set(items.map((item) => item.group))];

  return (
    <div className="app-container">
      <Sidebar
        favorites={favorites}
        onAddFavorite={addFavorite}
        onRemoveFavorite={removeFavorite}
      />

      <div className="main-content">
        <Header title="FOREL FPSO HVAC" subtitle="Engineering" />

        <Toolbar
          search={search}
          onSearchChange={setSearch}
          onAddGroup={addGroup}
          onUndo={undo}
          onExport={exportData}
          canUndo={history.length > 0}
        />

        {/* KONTEN TABEL DENGAN SCROLL HORIZONTAL */}
        <div
          style={{
            overflowX: "auto",
            overflowY: "visible",
            width: "100%",
            height: "auto",
            minHeight: "200px",
          }}
        >
          <BoardTable
            items={filteredItems}
            groups={allGroups}
            statuses={statuses}
            groupColors={groupColors}
            onUpdateGroupColor={updateGroupColor}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onAddGroup={addGroup}
            onDeleteGroup={deleteGroup}
            onAddItem={addItem}
            onOpenStatusManager={() => setShowStatusManager(true)}
          />
        </div>

        {/* FOOTER STICKY – tetap di bawah saat scroll vertikal */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            background: "var(--bg-secondary)",
            borderTop: "1px solid var(--border-color)",
            padding: "8px 16px",
            zIndex: 30,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 13,
            color: "var(--footer-text)",
            gap: 16,
            backdropFilter: "blur(8px)",
            width: "100%",
            minWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <div>
            Total: <strong>{totalItems}</strong> items
          </div>
          <div>
            Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending:{" "}
            <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-light)" }}>💾</span> Saved
          </div>
        </div>
      </div>

      {showStatusManager && (
        <StatusManager
          statuses={statuses}
          onAddStatus={addStatus}
          onUpdateStatusColor={updateStatusColor}
          onDeleteStatus={deleteStatus}
          onClose={() => setShowStatusManager(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ColumnProvider>
        <AppContent />
      </ColumnProvider>
    </ThemeProvider>
  );
}
