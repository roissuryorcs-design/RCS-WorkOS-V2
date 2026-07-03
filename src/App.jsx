import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import BoardTable from "./components/BoardTable";
import StatusManager from "./components/StatusManager";
import "./App.css";

function AppContent() {
  // ----- STATE -----
  const [items, setItems] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [groupColors, setGroupColors] = useState({}); // NEW: simpan warna per group

  // ----- LOAD DATA FROM LOCALSTORAGE -----
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
        {
          id: 1,
          group: "Target & PLANNING",
          item: "Scope of Work",
          document: "",
          people: "Done",
          status: "Default",
          dueDate: "dd/mm/tttt",
          rev: "R0",
        },
        {
          id: 2,
          group: "Target & PLANNING",
          item: "GA Drawings",
          document: "",
          people: "Done",
          status: "Default",
          dueDate: "dd/mm/tttt",
          rev: "R0",
        },
        {
          id: 3,
          group: "Target & PLANNING",
          item: "General Arrangement",
          document: "ID-F-FT-NN1-GAD-FP-0",
          people: "RS",
          status: "Default",
          dueDate: "01/07/2026",
          rev: "R1",
        },
        {
          id: 4,
          group: "Completed",
          item: "HVAC Room Arrangement DI",
          document: "P2104-V-D-GSHD-ME-GA",
          people: "Done",
          status: "Default",
          dueDate: "dd/mm/tttt",
          rev: "R0",
        },
        {
          id: 5,
          group: "Completed",
          item: "Layout Drawings",
          document: "",
          people: "Done",
          status: "Default",
          dueDate: "dd/mm/tttt",
          rev: "R0",
        },
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
      // Default warna untuk group yang ada
      const defaultColors = {};
      const groups = [...new Set(JSON.parse(savedItems || "[]").map(item => item.group))];
      groups.forEach(g => {
        defaultColors[g] = "#3b82f6"; // biru default
      });
      setGroupColors(defaultColors);
    }
  }, []);

  // ----- AUTO SAVE -----
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

  // ... (semua fungsi CRUD, undo, export, filter, dll. SAMA SEPERTI SEBELUMNYA) ...
  // (Saya tidak akan tulis ulang semua fungsi di sini agar jawaban tidak terlalu panjang, tapi pastikan semua fungsi tetap ada)

  // ----- FUNGSI UPDATE WARNA GROUP -----
  const updateGroupColor = (groupName, color) => {
    setGroupColors(prev => ({ ...prev, [groupName]: color }));
  };

  // ----- RENDER -----
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
          groupColors={groupColors}
          onUpdateGroupColor={updateGroupColor}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onAddGroup={addGroup}
          onDeleteGroup={deleteGroup}
          onAddItem={addItem}
          onOpenStatusManager={() => setShowStatusManager(true)}
        />

        <div className="board-footer">
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
      <AppContent />
    </ThemeProvider>
  );
}
