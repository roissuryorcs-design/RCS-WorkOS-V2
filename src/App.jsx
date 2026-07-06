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
  const [statusOrder, setStatusOrder] = useState([]);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [groupColors, setGroupColors] = useState({});

  // LOAD DATA
  useEffect(() => {
    const savedItems = localStorage.getItem("forelItems");
    const savedStatuses = localStorage.getItem("forelStatuses");
    const savedFavs = localStorage.getItem("forelFavorites");
    const savedGroupColors = localStorage.getItem("forelGroupColors");
    const savedStatusOrder = localStorage.getItem("forelStatusOrder");

    const defaultStatuses = { Default: "#9ca3af" };

    // Load statuses
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

    // Load status order
    if (savedStatusOrder) {
      const parsed = JSON.parse(savedStatusOrder);
      const filtered = parsed.filter(s => statuses[s] || s === "Default");
      setStatusOrder(filtered.length > 0 ? filtered : Object.keys(defaultStatuses));
    } else {
      setStatusOrder(Object.keys(defaultStatuses));
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

  // AUTO SAVE
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

  useEffect(() => {
    localStorage.setItem("forelStatusOrder", JSON.stringify(statusOrder));
  }, [statusOrder]);

  // UNDO
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

  // CRUD ITEM
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
    const firstStatus = statusOrder.length > 0 ? statusOrder[0] : "Default";
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

  // GROUP CRUD
  const addGroup = () => {
    const name = prompt("Enter new group name:");
    if (!name || !name.trim()) return;
    if (items.some((item) => item.group === name.trim())) {
      alert(`Group "${name.trim()}" already exists!`);
      return;
    }
    const firstStatus = statusOrder.length > 0 ? statusOrder[0] : "Default";
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

  const renameGroup = (oldName, newName) => {
    if (!newName || !newName.trim()) return;
    if (items.some(item => item.group === newName.trim() && item.group !== oldName)) {
      alert(`Group "${newName.trim()}" already exists!`);
      return;
    }
    const newItems = items.map(item =>
      item.group === oldName ? { ...item, group: newName.trim() } : item
    );
    saveHistory(newItems);
  };

  const updateGroupColor = (groupName, color) => {
    setGroupColors(prev => ({ ...prev, [groupName]: color }));
  };

  // STATUS CRUD
  const addStatus = (name, color) => {
    const finalName = name.trim() || "Default";
    if (statuses[finalName]) {
      alert(`Status "${finalName}" already exists!`);
      return;
    }
    setStatuses({ ...statuses, [finalName]: color || "#9ca3af" });
    // Tambahkan ke statusOrder, pastikan tidak duplikat
    setStatusOrder(prev => {
      if (!prev.includes(finalName)) {
        return [...prev, finalName];
      }
      return prev;
    });
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
    setStatusOrder(prev => prev.filter(s => s !== name));
  };

  const renameStatus = (oldName, newName) => {
    if (!newName || !newName.trim()) return;
    if (statuses[newName.trim()] && newName.trim() !== oldName) {
      alert(`Status "${newName.trim()}" already exists!`);
      return;
    }
    const newStatuses = { ...statuses };
    const color = newStatuses[oldName];
    delete newStatuses[oldName];
    newStatuses[newName.trim()] = color;
    setStatuses(newStatuses);

    const newItems = items.map((item) =>
      item.status === oldName ? { ...item, status: newName.trim() } : item
    );
    setItems(newItems);

    setStatusOrder(prev =>
      prev.map(s => s === oldName ? newName.trim() : s)
    );
  };

  const reorderStatus = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const newOrder = [...statusOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setStatusOrder(newOrder);
  };

  // FAVORITES
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

  // EXPORT
  const exportData = () => {
    const dataStr = JSON.stringify({ items, statuses, groupColors, statusOrder }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forel_data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // FILTER
  const filteredItems = items.filter((it) =>
    it.item.toLowerCase().includes(search.toLowerCase()) ||
    it.document.toLowerCase().includes(search.toLowerCase()) ||
    it.people.toLowerCase().includes(search.toLowerCase())
  );

  // STATS
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

        <BoardTable
          items={filteredItems}
          groups={allGroups}
          statuses={statuses}
          statusOrder={statusOrder}
          groupColors={groupColors}
          onUpdateGroupColor={updateGroupColor}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onAddGroup={addGroup}
          onDeleteGroup={deleteGroup}
          onAddItem={addItem}
          onOpenStatusManager={() => setShowStatusManager(true)}
          onRenameGroup={renameGroup}
        />

        <div className="board-footer">
          <div>Total: <strong>{totalItems}</strong> items</div>
          <div>
            Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending:{" "}
            <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
          </div>
          <div><span style={{ color: "var(--text-light)" }}>💾</span> Saved</div>
        </div>
      </div>

      {showStatusManager && (
        <StatusManager
          statuses={statuses}
          statusOrder={statusOrder}
          onAddStatus={addStatus}
          onUpdateStatusColor={updateStatusColor}
          onDeleteStatus={deleteStatus}
          onRenameStatus={renameStatus}
          onReorderStatus={reorderStatus}
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
