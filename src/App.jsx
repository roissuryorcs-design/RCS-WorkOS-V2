import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import BoardTable from "./components/BoardTable";
import StatusManager from "./components/StatusManager";
import "./App.css";

export default function App() {
  // State
  const [items, setItems] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [showStatusManager, setShowStatusManager] = useState(false);

  // Load data dari localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem("forelItems");
    const savedStatuses = localStorage.getItem("forelStatuses");
    const savedFavs = localStorage.getItem("forelFavorites");

    const defaultStatuses = { "Default": "#9ca3af" };

    if (savedStatuses) {
      const parsed = JSON.parse(savedStatuses);
      // Pastikan setidaknya ada satu status
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
  }, []);

  // Auto-save
  useEffect(() => {
    localStorage.setItem("forelItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("forelStatuses", JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    localStorage.setItem("forelFavorites", JSON.stringify(favorites));
  }, [favorites]);

  // Undo helper
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

  // CRUD Item
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

  // ----- GROUP CRUD -----
  const addGroup = () => {
    const name = prompt("Enter new group name:");
    if (!name || !name.trim()) return;
    if (items.some(item => item.group === name.trim())) {
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
  };

  const deleteGroup = (groupName) => {
    if (!confirm(`Delete entire group "${groupName}" and all its items?`)) return;
    const newItems = items.filter((it) => it.group !== groupName);
    saveHistory(newItems);
  };

  // ----- STATUS CRUD -----
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
    // Ubah item dengan status ini ke status pertama yang tersisa (selain yang dihapus)
    const remainingStatus = currentKeys.find(k => k !== name) || "Default";
    const newItems = items.map((it) =>
      it.status === name ? { ...it, status: remainingStatus } : it
    );
    const newStatuses = { ...statuses };
    delete newStatuses[name];
    setStatuses(newStatuses);
    setItems(newItems);
  };

  // Favorites
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

  // Export
  const exportData = () => {
    const dataStr = JSON.stringify({ items, statuses }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forel_data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter
  const filteredItems = items.filter((it) =>
    it.item.toLowerCase().includes(search.toLowerCase()) ||
    it.document.toLowerCase().includes(search.toLowerCase()) ||
    it.people.toLowerCase().includes(search.toLowerCase())
  );

  const allGroups = [...new Set(items.map(item => item.group))];

  const totalItems = filteredItems.length;
  const doneItems = filteredItems.filter((it) => it.status === "Done").length;
  const pendingItems = totalItems - doneItems;

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
          onAddItem={() => {
            const firstGroup = allGroups[0] || "Target & PLANNING";
            addItem(firstGroup);
          }}
        />

        <BoardTable
          items={filteredItems}
          groups={allGroups}
          statuses={statuses}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onAddGroup={addGroup}
          onDeleteGroup={deleteGroup}
          onAddItem={addItem}
          onOpenStatusManager={() => setShowStatusManager(true)}
        />

        <div className="board-footer">
          <div>Total: <strong>{totalItems}</strong> items</div>
          <div>
            Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending:{" "}
            <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="footer-btn" onClick={() => {
              const firstGroup = allGroups[0] || "Target & PLANNING";
              addItem(firstGroup);
            }}>Add</button>
            <button className="footer-btn" onClick={undo} disabled={history.length === 0}>
              Undo
            </button>
            <button className="footer-btn" onClick={exportData}>Export</button>
          </div>
        </div>
      </div>

      {/* Status Manager Modal */}
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
