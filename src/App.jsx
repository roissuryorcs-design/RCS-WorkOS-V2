import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import BoardTable from "./components/BoardTable";
import "./App.css";

export default function App() {
  // State
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);

  // Load data dari localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem("forelItems");
    const savedFavs = localStorage.getItem("forelFavorites");

    if (savedItems) {
      setItems(JSON.parse(savedItems));
    } else {
      setItems([
        { id: 1, item: "Scope of Work", document: "", people: "Done", status: "Done", dueDate: "dd/mm/tttt", rev: "R0" },
        { id: 2, item: "GA Drawings", document: "", people: "Done", status: "Done", dueDate: "dd/mm/tttt", rev: "R0" },
        { id: 3, item: "General Arrangement", document: "ID-F-FT-NN1-GAD-FP-0", people: "RS", status: "Done", dueDate: "01/07/2026", rev: "R1" },
        { id: 4, item: "HVAC Room Arrangement DI", document: "P2104-V-D-GSHD-ME-GA", people: "Done", status: "Done", dueDate: "dd/mm/tttt", rev: "R0" },
        { id: 5, item: "Layout Drawings", document: "", people: "Done", status: "Done", dueDate: "dd/mm/tttt", rev: "R0" },
        { id: 6, item: "HVAC System Layout Drawir", document: "P2104-V-D-GSHD-ME-LA", people: "Done", status: "Done", dueDate: "dd/mm/tttt", rev: "R0" },
        { id: 7, item: "HVAC System Layout Drawir", document: "P2104-V-D-GSHD-ME-LA", people: "Done", status: "Done", dueDate: "dd/mm/tttt", rev: "R0" },
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
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [items]);

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

  // CRUD
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

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      item: "New Item",
      document: "",
      people: "",
      status: "To Do",
      dueDate: "-",
      rev: "R0",
    };
    saveHistory([...items, newItem]);
  };

  // ----- GROUP CRUD (BARU) -----
  const addGroup = () => {
    const name = prompt("Enter new group name (e.g., 'On Hold'):");
    if (!name || !name.trim()) return;
    
    // Cek apakah status sudah ada
    if (items.some(item => item.status === name.trim())) {
      alert(`Group "${name.trim()}" already exists!`);
      return;
    }

    // Tambahkan item contoh ke group baru
    const newItem = {
      id: Date.now(),
      item: `New Task in ${name.trim()}`,
      document: "",
      people: "",
      status: name.trim(),
      dueDate: "-",
      rev: "R0",
    };
    saveHistory([...items, newItem]);
  };

  const deleteGroup = (statusToDelete) => {
    // Cek apakah ini status default (To Do, Working, Review, Done)
    const defaultStatuses = ["To Do", "Working", "Review", "Done"];
    if (defaultStatuses.includes(statusToDelete)) {
      alert(`Cannot delete default group: "${statusToDelete}"`);
      return;
    }

    if (!confirm(`Delete entire group "${statusToDelete}" and all its items?`)) return;

    const newItems = items.filter((it) => it.status !== statusToDelete);
    saveHistory(newItems);
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
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forel_items.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter
  const filteredItems = items.filter((it) =>
    it.item.toLowerCase().includes(search.toLowerCase()) ||
    it.document.toLowerCase().includes(search.toLowerCase()) ||
    it.people.toLowerCase().includes(search.toLowerCase())
  );

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
          onAddItem={addItem}
        />

        <BoardTable
          items={filteredItems}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onAddGroup={addGroup}
          onDeleteGroup={deleteGroup}
        />

        <div className="board-footer">
          <div>Total: <strong>{totalItems}</strong> items</div>
          <div>
            Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending:{" "}
            <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="footer-btn" onClick={addItem}>Add</button>
            <button className="footer-btn" onClick={undo} disabled={history.length === 0}>
              Undo
            </button>
            <button className="footer-btn" onClick={exportData}>Export</button>
          </div>
        </div>
      </div>
    </div>
  );
}
