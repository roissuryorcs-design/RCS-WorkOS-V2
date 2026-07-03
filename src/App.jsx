import { useState, useMemo, useEffect } from "react";

export default function App() {
  // ✅ LOAD FROM LOCALSTORAGE
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("forelItems");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            item: "Scope of Work",
            document: "ID-F-T-NN1-GAD-FP-C",
            people: "Done",
            status: "Done",
            dueDate: "dd/mm/ttt",
            rev: "RO",
          },
          {
            id: 2,
            item: "GA Drawings",
            document: "P2104-V-D-GSHD-ME-<",
            people: "Done",
            status: "Done",
            dueDate: "dd/mm/ttt",
            rev: "RO",
          },
          {
            id: 3,
            item: "General Arrangement",
            document: "P2104-V-D-GSHD-ME-I",
            people: "RS",
            status: "Done",
            dueDate: "dd/mm/ttt",
            rev: "RO",
          },
          {
            id: 4,
            item: "HVAC Room Arrang",
            document: "",
            people: "Done",
            status: "Done",
            dueDate: "dd/mm/ttd",
            rev: "RO",
          },
          {
            id: 5,
            item: "Layout Drawings",
            document: "",
            people: "Done",
            status: "Done",
            dueDate: "dd/mm/ttt",
            rev: "RO",
          },
          {
            id: 6,
            item: "HVAC System Layout",
            document: "",
            people: "Done",
            status: "Done",
            dueDate: "dd/mm/ttd",
            rev: "RO",
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
        item.document.toLowerCase().includes(search.toLowerCase()) ||
        item.people.toLowerCase().includes(search.toLowerCase());

      return matchSearch;
    });
  }, [items, search]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: 240,
          background: "#f5f6f8",
          padding: "24px 16px",
          borderRight: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a2e", marginBottom: 24 }}>
          FOREL FPSO
        </h2>

        {/* PROJECT SECTION */}
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9ca3af",
              letterSpacing: "0.5px",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Project
          </p>

          <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a2e", marginBottom: 4 }}>
            Engineering
          </div>
          <div style={{ paddingLeft: 16, fontSize: 13, color: "#4b5563", marginBottom: 2 }}>
            • GA Drawings
          </div>
          <div style={{ paddingLeft: 16, fontSize: 13, color: "#4b5563", marginBottom: 2 }}>
            • Layout Drawings
          </div>
          <div style={{ paddingLeft: 16, fontSize: 13, color: "#4b5563", marginBottom: 2 }}>
            • D&D
          </div>
          <div style={{ paddingLeft: 16, fontSize: 13, color: "#4b5563", marginBottom: 2 }}>
            • P&D 1
          </div>

          <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a2e", marginTop: 8, marginBottom: 4 }}>
            Equipment Schedule 4
          </div>
          <div style={{ paddingLeft: 16, fontSize: 13, color: "#4b5563", marginBottom: 2 }}>
            • Commissioning
          </div>
          <div style={{ paddingLeft: 16, fontSize: 13, color: "#4b5563", marginBottom: 2 }}>
            • FAT
          </div>
          <div style={{ paddingLeft: 16, fontSize: 13, color: "#4b5563", marginBottom: 2 }}>
            • SAT
          </div>
          <div style={{ paddingLeft: 16, fontSize: 13, color: "#4b5563", marginBottom: 2 }}>
            • O&M
          </div>
        </div>

        {/* FAVORITES */}
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9ca3af",
              letterSpacing: "0.5px",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Favorites
          </p>
          <div
            style={{
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 4,
              color: "#3b82f6",
              border: "1px dashed #3b82f6",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            + Add favorites
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: "#ffffff", padding: "24px 32px" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a2e" }}>
            FOREL FPSO HVAC
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
            Engineering
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 12,
          }}
        >
          <input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
              width: 220,
              background: "white",
            }}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="All">All Categories</option>
            <option value="Engineering">Engineering</option>
          </select>

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
              marginLeft: "auto",
            }}
          >
            + Add Item
          </button>
        </div>

        {/* TABLE */}
        <div style={{ overflowX: "auto" }}>
          <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  fontSize: 12,
                  color: "#6b7280",
                  fontWeight: 600,
                  borderBottom: "2px solid #e5e7eb",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                <th style={{ width: "22%", paddingBottom: 8 }}>Item</th>
                <th style={{ width: "28%", paddingBottom: 8 }}>No. Document</th>
                <th style={{ width: "15%", paddingBottom: 8 }}>People</th>
                <th style={{ width: "15%", paddingBottom: 8 }}>Status</th>
                <th style={{ width: "15%", paddingBottom: 8 }}>Due Date</th>
                <th style={{ width: "8%", paddingBottom: 8 }}>Rev</th>
                <th style={{ width: "5%", paddingBottom: 8, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    transition: "0.15s",
                    fontSize: 14,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f9fafb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "white")
                  }
                >
                  <td style={{ padding: "6px 4px" }}>
                    <input
                      value={item.item}
                      onChange={(e) =>
                        updateItem(item.id, "item", e.target.value)
                      }
                      style={{
                        ...inputStyle,
                        fontWeight: 500,
                        color: "#1a1a2e",
                      }}
                    />
                  </td>

                  <td style={{ padding: "6px 4px" }}>
                    <input
                      value={item.document}
                      onChange={(e) =>
                        updateItem(item.id, "document", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "6px 4px" }}>
                    <input
                      value={item.people}
                      onChange={(e) =>
                        updateItem(item.id, "people", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "6px 4px" }}>
                    <input
                      value={item.status}
                      onChange={(e) =>
                        updateItem(item.id, "status", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "6px 4px" }}>
                    <input
                      value={item.dueDate}
                      onChange={(e) =>
                        updateItem(item.id, "dueDate", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "6px 4px" }}>
                    <input
                      value={item.rev}
                      onChange={(e) =>
                        updateItem(item.id, "rev", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "6px 4px", textAlign: "center" }}>
                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "#9ca3af",
                        padding: "2px 6px",
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
      </div>
    </div>
  );
}

const inputStyle = {
  border: "none",
  background: "transparent",
  fontSize: 14,
  padding: "4px 2px",
  width: "100%",
  color: "#1a1a2e",
  outline: "none",
  fontFamily: "Arial, sans-serif",
};
