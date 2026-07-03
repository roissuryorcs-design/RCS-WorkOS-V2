import { useState, useEffect } from "react";

export default function App() {
  // ----- STATE -----
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);

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
          item: "HVAC Room Arrangement DI",
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
          item: "HVAC System Layout Drawir",
          document: "P2104-V-D-GSHD-ME-LA",
          people: "Done",
          status: "Done",
          dueDate: "dd/mm/tttt",
          rev: "R0",
        },
        {
          id: 7,
          item: "HVAC System Layout Drawir",
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

  // ----- AUTO SAVE -----
  useEffect(() => {
    localStorage.setItem("forelItems", JSON.stringify(items));
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [items]);

  useEffect(() => {
    localStorage.setItem("forelFavorites", JSON.stringify(favorites));
  }, [favorites]);

  // ----- UNDO -----
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

  // ----- FILTER -----
  const filteredItems = items.filter((it) =>
    it.item.toLowerCase().includes(search.toLowerCase()) ||
    it.document.toLowerCase().includes(search.toLowerCase()) ||
    it.people.toLowerCase().includes(search.toLowerCase())
  );

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
    <div style={styles.appContainer}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>FOREL FPSO</h2>

        {/* PROJECT */}
        <div style={styles.sidebarSection}>
          <p style={styles.sidebarSectionTitle}>PROJECT</p>
          <div style={styles.sidebarItem}>Engineering</div>
          <div style={styles.sidebarSubItem}>• GA Drawings</div>
          <div style={styles.sidebarSubItem}>• Layout Drawings</div>
          <div style={styles.sidebarSubItem}>• D&D</div>
          <div style={styles.sidebarSubItem}>• P&D 1</div>
          <div style={styles.sidebarSubItem}>• Equipment Schedule 4</div>
          <div style={{ ...styles.sidebarItem, marginTop: 8 }}>Commissioning</div>
          <div style={styles.sidebarSubItem}>• FAT</div>
          <div style={styles.sidebarSubItem}>• SAT</div>
          <div style={styles.sidebarSubItem}>• O&M</div>
        </div>

        {/* FAVORITES */}
        <div style={styles.sidebarSection}>
          <p style={styles.sidebarSectionTitle}>FAVORITES</p>
          {favorites.map((fav, idx) => (
            <div key={idx} style={styles.favoriteItem}>
              <span>📁 {fav}</span>
              <button
                onClick={() => removeFavorite(idx)}
                style={styles.favoriteRemoveBtn}
              >
                ✕
              </button>
            </div>
          ))}
          <div onClick={addFavorite} style={styles.addFavoriteBtn}>
            + Add favorites
          </div>
        </div>

        {/* MORE */}
        <div style={styles.sidebarSection}>
          <p style={styles.sidebarSectionTitle}>MORE</p>
          <div style={styles.sidebarItem}>Monday AI</div>
          <div style={styles.sidebarItem}>Automate</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.mainContent}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>FOREL FPSO HVAC</h1>
            <p style={styles.headerSubtitle}>Engineering</p>
          </div>
        </div>

        {/* SEARCH */}
        <div style={styles.toolbar}>
          <input
            placeholder="🔍 Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* TABLE */}
        <div style={styles.tableWrapper}>
          <table width="100%" cellPadding="0" style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>ITEM</th>
                <th style={styles.th}>NO. DOCUMENT</th>
                <th style={styles.th}>PEOPLE</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>DUE DATE</th>
                <th style={styles.th}>REV</th>
                <th style={{ ...styles.th, width: "5%", textAlign: "center" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => (
                <tr
                  key={it.id}
                  style={{
                    ...styles.tr,
                    borderBottom: idx === filteredItems.length - 1 ? "none" : "1px solid #f3f4f6",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <td style={styles.td}>
                    <input
                      value={it.item}
                      onChange={(e) => updateItem(it.id, "item", e.target.value)}
                      style={styles.input}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      value={it.document}
                      onChange={(e) => updateItem(it.id, "document", e.target.value)}
                      style={styles.input}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      value={it.people}
                      onChange={(e) => updateItem(it.id, "people", e.target.value)}
                      style={styles.input}
                    />
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: statusColor(it.status),
                      }}
                    >
                      {it.status || "To Do"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <input
                      value={it.dueDate}
                      onChange={(e) => updateItem(it.id, "dueDate", e.target.value)}
                      style={styles.input}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      value={it.rev}
                      onChange={(e) => updateItem(it.id, "rev", e.target.value)}
                      style={styles.input}
                    />
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <button
                      onClick={() => deleteItem(it.id)}
                      style={styles.deleteBtn}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            Total: <strong>{totalItems}</strong> items
          </div>
          <div style={styles.footerCenter}>
            Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending:{" "}
            <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
          </div>
          <div style={styles.footerRight}>
            <button onClick={addItem} style={styles.footerBtn}>
              Add
            </button>
            <button
              onClick={undo}
              disabled={history.length === 0}
              style={{
                ...styles.footerBtn,
                opacity: history.length === 0 ? 0.5 : 1,
                cursor: history.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Undo
            </button>
            <button onClick={exportData} style={styles.footerBtn}>
              Export
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={styles.footerBtn}
            >
              {isExpanded ? "Expand" : "Collapse"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f6f8",
    fontFamily: "Arial, sans-serif",
  },

  // ----- SIDEBAR -----
  sidebar: {
    width: 220,
    background: "#ffffff",
    padding: "24px 16px",
    borderRight: "1px solid #e5e7eb",
    flexShrink: 0,
    height: "100vh",
    position: "sticky",
    top: 0,
    overflowY: "auto",
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#1a1a2e",
    marginBottom: 24,
  },
  sidebarSection: {
    marginBottom: 24,
  },
  sidebarSectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9ca3af",
    letterSpacing: "0.5px",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  sidebarItem: {
    fontSize: 13,
    fontWeight: 500,
    color: "#1a1a2e",
    marginBottom: 2,
  },
  sidebarSubItem: {
    paddingLeft: 16,
    fontSize: 12,
    color: "#4b5563",
    marginBottom: 2,
  },
  favoriteItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    color: "#4b5563",
    padding: "4px 8px",
    borderRadius: 4,
    marginBottom: 2,
  },
  favoriteRemoveBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    fontSize: 12,
  },
  addFavoriteBtn: {
    fontSize: 13,
    padding: "6px 12px",
    borderRadius: 4,
    color: "#3b82f6",
    border: "1px dashed #3b82f6",
    cursor: "pointer",
    textAlign: "center",
    marginTop: 4,
  },

  // ----- MAIN CONTENT -----
  mainContent: {
    flex: 1,
    padding: "24px 32px",
    background: "#ffffff",
  },

  // ----- HEADER -----
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },

  // ----- TOOLBAR -----
  toolbar: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  searchInput: {
    padding: "6px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: 13,
    width: 200,
  },

  // ----- TABLE -----
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
  },
  theadRow: {
    textAlign: "left",
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 600,
    borderBottom: "2px solid #e5e7eb",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  th: {
    padding: "8px 8px",
    width: "auto",
  },
  tr: {
    fontSize: 13,
    transition: "0.15s",
  },
  td: {
    padding: "6px 8px",
  },
  input: {
    border: "none",
    background: "transparent",
    fontSize: 13,
    padding: "4px 2px",
    width: "100%",
    color: "#1a1a2e",
    outline: "none",
    fontFamily: "Arial, sans-serif",
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
    color: "white",
    fontWeight: 500,
    display: "inline-block",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "#9ca3af",
  },

  // ----- FOOTER -----
  footer: {
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
  },
  footerLeft: {
    flex: 1,
  },
  footerCenter: {
    flex: 1,
    textAlign: "center",
  },
  footerRight: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  footerBtn: {
    padding: "4px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    color: "#4b5563",
  },
};
