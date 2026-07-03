import { useState, useMemo, useEffect } from "react";

export default function App() {
  // ✅ LOAD FROM LOCALSTORAGE
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("forelItems");
    return saved
      ? JSON.parse(saved)
      : [
          // Engineering items
          {
            id: 1,
            item: "Scope of Work",
            document: "ID-F-FT-NN1-GAD-FP-0",
            people: "Done",
            status: "Done",
            dueDate: "dd/mm/tttt",
            rev: "RO",
            category: "Engineering",
            project: "FOREL FPSO HVAC",
          },
          {
            id: 2,
            item: "GA Drawings",
            document: "P2104-V-D-GSHD-ME-GA",
            people: "Done",
            status: "Done",
            dueDate: "dd/mm/tttt",
            rev: "RO",
            category: "Engineering",
            project: "FOREL FPSO HVAC",
          },
          {
            id: 3,
            item: "General Arrangement",
            document: "P2104-V-D-GSHD-ME-LA",
            people: "RS",
            status: "Done",
            dueDate: "dd/mm/tttt",
            rev: "RO",
            category: "Engineering",
            project: "FOREL FPSO HVAC",
          },
          {
            id: 4,
            item: "HVAC Room Arrang",
            document: "",
            people: "Done",
            status: "Done",
            dueDate: "dd/mm/tdd",
            rev: "RO",
            category: "Engineering",
            project: "FOREL FPSO HVAC",
          },
          {
            id: 5,
            item: "Layout Drawings",
            document: "",
            people: "Done",
            status: "Done",
            dueDate: "",
            rev: "",
            category: "Engineering",
            project: "FOREL FPSO HVAC",
          },
          {
            id: 6,
            item: "HVAC System Layout",
            document: "",
            people: "",
            status: "",
            dueDate: "",
            rev: "",
            category: "Engineering",
            project: "FOREL FPSO HVAC",
          },
        ];
  });

  // ✅ AUTO SAVE
  useEffect(() => {
    localStorage.setItem("forelItems", JSON.stringify(items));
  }, [items]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        item: "New Item",
        document: "",
        people: "",
        status: "",
        dueDate: "",
        rev: "",
        category: "Engineering",
        project: "FOREL FPSO HVAC",
      },
    ]);
  };

  const deleteItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // FILTER SYSTEM
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.item.toLowerCase().includes(search.toLowerCase()) ||
        item.document.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        categoryFilter === "All" || item.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [items, search, categoryFilter]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: 260,
          background: "#1a1a2e",
          color: "white",
          padding: "20px 16px",
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 8, color: "#fff" }}>
          FOREL FPSO
        </h2>

        {/* PROJECT SECTION */}
        <div style={{ marginTop: 24 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#9ca3af",
              letterSpacing: "0.5px",
              marginBottom: 12,
            }}
          >
            PROJECT
          </p>

          <div
            style={{
              fontSize: 14,
              padding: "8px 12px",
              borderRadius: 6,
              background: "#2d2d44",
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            📁 Engineering
          </div>
          <div
            style={{
              paddingLeft: 20,
              fontSize: 13,
              color: "#c4c4d6",
              marginBottom: 4,
            }}
          >
            • GA Drawings
          </div>
          <div
            style={{
              paddingLeft: 20,
              fontSize: 13,
              color: "#c4c4d6",
              marginBottom: 4,
            }}
          >
            • Layout Drawings
          </div>
          <div
            style={{
              paddingLeft: 20,
              fontSize: 13,
              color: "#c4c4d6",
              marginBottom: 4,
            }}
          >
            • D&D
          </div>
          <div
            style={{
              paddingLeft: 20,
              fontSize: 13,
              color: "#c4c4d6",
              marginBottom: 4,
            }}
          >
            • P&D 1
          </div>
          <div
            style={{
              paddingLeft: 20,
              fontSize: 13,
              color: "#c4c4d6",
              marginBottom: 4,
            }}
          >
            • Equipment Schedule 4
          </div>
          <div
            style={{
              paddingLeft: 20,
              fontSize: 13,
              color: "#c4c4d6",
              marginBottom: 4,
            }}
          >
            • Commissioning
          </div>
          <div
            style={{
              paddingLeft: 20,
              fontSize: 13,
              color: "#c4c4d6",
              marginBottom: 4,
            }}
          >
            • FAT
          </div>
          <div
            style={{
              paddingLeft: 20,
              fontSize: 13,
              color: "#c4c4d6",
              marginBottom: 4,
            }}
          >
            • SAT
          </div>
          <div
            style={{
              paddingLeft: 20,
              fontSize: 13,
              color: "#c4c4d6",
              marginBottom: 4,
            }}
          >
            • O&M
          </div>
        </div>

        {/* FAVORITES */}
        <div style={{ marginTop: 32 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#9ca3af",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}
          >
            FAVORITES
          </p>
          <div
            style={{
              fontSize: 14,
              padding: "8px 12px",
              borderRadius: 6,
              color: "#c4c4d6",
              border: "1px dashed #4b4b66",
            }}
          >
            + Add favorites
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: "#f8f9fc", padding: "24px 32px" }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1a1a2e" }}>
              FOREL FPSO HVAC
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
              Engineering
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={addItem}
              style={{
                padding: "8px 16px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            placeholder="🔍 Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 14px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              width: 250,
              background: "white",
            }}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="All">All Categories</option>
            <option value="Engineering">Engineering</option>
          </select>
        </div>

        {/* TABLE */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  fontSize: 13,
                  color: "#6b7280",
                  fontWeight: 600,
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                <th style={{ width: "25%" }}>ITEM</th>
                <th style={{ width: "25%" }}>NO. DOCUMENT</th>
                <th style={{ width: "15%" }}>PEOPLE</th>
                <th style={{ width: "15%" }}>STATUS</th>
                <th style={{ width: "15%" }}>DUE DATE</th>
                <th style={{ width: "10%" }}>REV</th>
                <th style={{ width: "5%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    transition: "0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f9fafb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "white")
                  }
                >
                  <td>
                    <input
                      value={item.item}
                      onChange={(e) =>
                        updateItem(item.id, "item", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td>
                    <input
                      value={item.document}
                      onChange={(e) =>
                        updateItem(item.id, "document", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td>
                    <input
                      value={item.people}
                      onChange={(e) =>
                        updateItem(item.id, "people", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td>
                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateItem(item.id, "status", e.target.value)
                      }
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        borderRadius: 4,
                        fontSize: 13,
                        background: "white",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      <option value="">-</option>
                      <option value="To Do">To Do</option>
                      <option value="Working">Working</option>
                      <option value="Review">Review</option>
                      <option value="Done">Done</option>
                    </select>
                  </td>

                  <td>
                    <input
                      value={item.dueDate}
                      onChange={(e) =>
                        updateItem(item.id, "dueDate", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td>
                    <input
                      value={item.rev}
                      onChange={(e) =>
                        updateItem(item.id, "rev", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td>
                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        color: "#9ca3af",
                      }}
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
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid #e5e7eb",
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          <span>🔖 Semua Bookmark</span>
          <span>+ Add</span>
          <span>↩ Undo</span>
          <span>📤 Export</span>
          <span>📉 Collapse</span>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  border: "none",
  background: "transparent",
  fontSize: 14,
  padding: "4px 0",
  width: "100%",
  color: "#1a1a2e",
  outline: "none",
};
