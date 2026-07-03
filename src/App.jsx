import { useState, useEffect } from "react";

export default function App() {
  // ----- STATE -----
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]); // untuk undo

  // ----- LOAD DATA FROM LOCALSTORAGE -----
  useEffect(() => {
    const savedItems = localStorage.getItem("forelItems");
    const savedFavs = localStorage.getItem("forelFavorites");

    if (savedItems) {
      setItems(JSON.parse(savedItems));
    } else {
      setItems([
        {
          id: 1,
          item: "Scope of Work",
          document: "",
          people: "Done",
          status: "Done",
          dueDate: "dd/mm/tttt",
          rev: "R0",
        },
        {
          id: 2,
          item: "GA Drawings",
          document: "",
          people: "Done",
          status: "Done",
          dueDate: "dd/mm/tttt",
          rev: "R0",
        },
        {
          id: 3,
          item: "General Arrangement",
          document: "ID-F-FT-NN1-GAD-FP-0",
          people: "RS",
          status: "Done",
          dueDate: "01/07/2026",
          rev: "R1",
        },
        {
          id: 4,
          item: "HVAC Room Arrangement",
          document: "P2104-V-D-GSHD-ME-GA",
          people: "Done",
          status: "Done",
          dueDate: "dd/mm/tttt",
          rev: "R0",
        },
        {
          id: 5,
          item: "Layout Drawings",
          document: "",
          people: "Done",
          status: "Done",
          dueDate: "dd/mm/tttt",
          rev: "R0",
        },
        {
          id: 6,
          item: "HVAC System Layout",
          document: "P2104-V-D-GSHD-ME-LA",
          people: "Done",
          status: "Done",
          dueDate: "dd/mm/tttt",
          rev: "R0",
        },
        {
          id: 7,
          item: "HVAC System Layout",
          document: "P2104-V-D-GSHD-ME-LA",
          people: "Done",
          status: "Done",
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
  }, []);

  // ----- AUTO SAVE WITH SAVED INDICATOR -----
  useEffect(() => {
    localStorage.setItem("forelItems", JSON.stringify(items));
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [items]);

  useEffect(() => {
    localStorage.setItem("forelFavorites", JSON.stringify(favorites));
  }, [favorites]);

  // ----- UNDO (simpan history setiap perubahan) -----
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

  // ----- CRUD -----
  const updateItem = (id, field, value) => {
    const newItems = items.map((it) =>
      it.id === id ? { ...it, [field]: value } : it
    );
    saveHistory(newItems);
  };

  const deleteItem = (id) => {
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

  // ----- FAVORITES -----
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

  // ----- EXPORT -----
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

  // ----- FILTER & GROUP -----
  const filteredItems = items.filter((it) =>
    it.item.toLowerCase().includes(search.toLowerCase()) ||
    it.document.toLowerCase().includes(search.toLowerCase()) ||
    it.people.toLowerCase().includes(search.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((groups, item) => {
    const key = item.status || "Uncategorized";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});

  // Urutan status yang diinginkan
  const statusOrder = ["To Do", "Working", "Review", "Done"];

  // ----- STATISTIK -----
  const totalItems = filteredItems.length;
  const doneItems = filteredItems.filter((it) => it.status === "Done").length;
  const pendingItems = totalItems - doneItems;

  // ----- STYLE FUNCTIONS -----
  const statusColor = (status) => {
    switch (status) {
      case "Done":
        return "#22c55e";
      case "Working":
        return "#3b82f6";
      case "Review":
        return "#f59e0b";
      case "To Do":
        return "#9ca3af";
      default:
        return "#9ca3af";
    }
  };

  // ----- RENDER -----
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f6f8", fontFamily: "Arial, sans-serif" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: 220,
          background: "#ffffff",
          padding: "24px 16px",
          borderRight: "1px solid #e5e7eb",
          flexShrink: 0,
          height: "100vh",
          position: "sticky",
          top: 0,
          overflowY: "auto",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a2e", marginBottom: 24 }}>
          FOREL FPSO
        </h2>

        {/* PROJECT */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.5px", marginBottom: 12, textTransform: "uppercase" }}>
            PROJECT
          </p>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", marginBottom: 4 }}>Engineering</div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>• GA Drawings</div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>• Layout Drawings</div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>• D&D</div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>• P&D 1</div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>• Equipment Schedule 4</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", marginBottom: 4 }}>Commissioning</div>
          <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>• FAT</div>
          <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>• SAT</div>
          <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>• O&M</div>
        </div>

        {/* FAVORITES */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.5px", marginBottom: 8, textTransform: "uppercase" }}>
            Favorites
          </p>
          {favorites.map((fav, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
                color: "#4b5563",
                padding: "4px 8px",
                borderRadius: 4,
                marginBottom: 2,
              }}
            >
              <span>📁 {fav}</span>
              <button
                onClick={() => removeFavorite(idx)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 12 }}
              >
                ✕
              </button>
            </div>
          ))}
          <div
            onClick={addFavorite}
            style={{
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 4,
              color: "#3b82f6",
              border: "1px dashed #3b82f6",
              cursor: "pointer",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            + Add favorites
          </div>
        </div>

        {/* MORE */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.5px", marginBottom: 8, textTransform: "uppercase" }}>
            MORE
          </p>
          <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 4 }}>Monday AI</div>
          <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 4 }}>Automate</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "24px 32px", background: "#ffffff" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a2e" }}>FOREL FPSO HVAC</h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>Engineering</p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Search */}
            <input
              placeholder="🔍 Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                fontSize: 13,
                width: 180,
              }}
            />

            <button
              onClick={addItem}
              style={{
                padding: "6px 14px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              + Add Item
            </button>

            <button
              onClick={undo}
              disabled={history.length === 0}
              style={{
                padding: "6px 14px",
                background: history.length === 0 ? "#e5e7eb" : "transparent",
                color: history.length === 0 ? "#9ca3af" : "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                cursor: history.length === 0 ? "not-allowed" : "pointer",
                fontSize: 13,
              }}
            >
              ↩ Undo
            </button>

            <button
              onClick={exportData}
              style={{
                padding: "6px 14px",
                background: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              📤 Export
            </button>
          </div>
        </div>

        {/* TABEL DENGAN GROUPING */}
        {statusOrder.map((statusKey) => {
          const tasks = groupedItems[statusKey] || [];
          if (tasks.length === 0) return null;

          return (
            <div key={statusKey} style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1a1a2e",
                  marginBottom: 8,
                  paddingBottom: 4,
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                {statusKey}
              </h3>

              <table width="100%" cellPadding="0" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      fontSize: 12,
                      color: "#6b7280",
                      fontWeight: 600,
                      borderBottom: "1px solid #e5e7eb",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    <th style={{ padding: "8px 8px", width: "22%" }}>ITEM</th>
                    <th style={{ padding: "8px 8px", width: "25%" }}>NO. DOCUMENT</th>
                    <th style={{ padding: "8px 8px", width: "15%" }}>PEOPLE</th>
                    <th style={{ padding: "8px 8px", width: "15%" }}>STATUS</th>
                    <th style={{ padding: "8px 8px", width: "15%" }}>DUE DATE</th>
                    <th style={{ padding: "8px 8px", width: "8%" }}>REV</th>
                    <th style={{ padding: "8px 8px", width: "5%", textAlign: "center" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((it, idx) => (
                    <tr
                      key={it.id}
                      style={{
                        borderBottom: idx === tasks.length - 1 ? "none" : "1px solid #f3f4f6",
                        fontSize: 13,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          value={it.item}
                          onChange={(e) => updateItem(it.id, "item", e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          value={it.document}
                          onChange={(e) => updateItem(it.id, "document", e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          value={it.people}
                          onChange={(e) => updateItem(it.id, "people", e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <select
                          value={it.status}
                          onChange={(e) => updateItem(it.id, "status", e.target.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid #d1d5db",
                            fontSize: 12,
                            background: statusColor(it.status),
                            color: "white",
                            cursor: "pointer",
                            width: "100%",
                            fontWeight: 500,
                          }}
                        >
                          <option value="To Do" style={{ background: "#9ca3af" }}>To Do</option>
                          <option value="Working" style={{ background: "#3b82f6" }}>Working</option>
                          <option value="Review" style={{ background: "#f59e0b" }}>Review</option>
                          <option value="Done" style={{ background: "#22c55e" }}>Done</option>
                        </select>
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          value={it.dueDate}
                          onChange={(e) => updateItem(it.id, "dueDate", e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          value={it.rev}
                          onChange={(e) => updateItem(it.id, "rev", e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        <button
                          onClick={() => deleteItem(it.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#9ca3af" }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid #e5e7eb",
            fontSize: 13,
            color: "#6b7280",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            Total: <strong>{totalItems}</strong> item
          </div>
          <div>
            Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending: <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: saved ? "#22c55e" : "#9ca3af" }}>
              {saved ? "✅" : "💾"}
            </span>
            <span>{saved ? "Saved" : "Saving..."}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  border: "none",
  background: "transparent",
  fontSize: 13,
  padding: "4px 2px",
  width: "100%",
  color: "#1a1a2e",
  outline: "none",
  fontFamily: "Arial, sans-serif",
};
