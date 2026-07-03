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
            document: "",
            people: "Done",
            status: "",
            dueDate: "dd/mm/tttt",
            rev: "R0",
          },
          {
            id: 2,
            item: "GA Drawings",
            document: "",
            people: "Done",
            status: "",
            dueDate: "dd/mm/tttt",
            rev: "R0",
          },
          {
            id: 3,
            item: "General Arrangement",
            document: "ID-F-FT-NN1-GAD-FP-0",
            people: "RS",
            status: "",
            dueDate: "",
            rev: "R1",
          },
          {
            id: 4,
            item: "HVAC Room Arrangement",
            document: "P2104-V-D-GSHD-ME-GA",
            people: "Done",
            status: "",
            dueDate: "",
            rev: "R0",
          },
          {
            id: 5,
            item: "Layout Drawings",
            document: "",
            people: "Done",
            status: "",
            dueDate: "dd/mm/tttt",
            rev: "R0",
          },
          {
            id: 6,
            item: "HVAC System Layout",
            document: "P2104-V-D-GSHD-ME-LA",
            people: "Done",
            status: "",
            dueDate: "",
            rev: "R0",
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

  // Calculate statistics
  const totalItems = filtered.length;
  const doneItems = filtered.filter((item) => item.people === "Done").length;
  const pendingItems = totalItems - doneItems;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif", background: "#f0f2f5" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: 220,
          background: "#ffffff",
          padding: "20px 16px",
          borderRight: "1px solid #e5e7eb",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a2e", marginBottom: 24 }}>
          FOREL FPSO
        </h2>

        {/* PROJECT SECTION */}
        <div style={{ flex: 1 }}>
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

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", marginBottom: 4 }}>
              Engineering
            </div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>
              • GA Drawings
            </div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>
              • Layout Drawings
            </div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>
              • D&D
            </div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>
              • P&D 1
            </div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>
              • Equipment Schedule 4
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", marginBottom: 4 }}>
              Commissioning
            </div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>
              • FAT
            </div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>
              • SAT
            </div>
            <div style={{ paddingLeft: 16, fontSize: 12, color: "#4b5563", marginBottom: 2 }}>
              • O&M
            </div>
          </div>
        </div>

        {/* FAVORITES */}
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
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
      <div style={{ flex: 1, padding: "20px 32px", maxWidth: "calc(100% - 220px)" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a2e" }}>
            FOREL FPSO HVAC
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
            Engineering
          </p>
        </div>

        {/* SEARCH BAR */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            alignItems: "center",
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
              width: 200,
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

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
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
              + Add
            </button>
            <button
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
              ↩ Undo
            </button>
            <button
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

        {/* TABLE */}
        <div
          style={{
            background: "white",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
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
                  background: "#f9fafb",
                }}
              >
                <th style={{ padding: "10px 12px", width: "22%" }}>Item</th>
                <th style={{ padding: "10px 12px", width: "28%" }}>No. Document</th>
                <th style={{ padding: "10px 12px", width: "15%" }}>People</th>
                <th style={{ padding: "10px 12px", width: "15%" }}>Status</th>
                <th style={{ padding: "10px 12px", width: "15%" }}>Due Date</th>
                <th style={{ padding: "10px 12px", width: "10%" }}>Rev</th>
                <th style={{ padding: "10px 12px", width: "5%", textAlign: "center" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: index === filtered.length - 1 ? "none" : "1px solid #f3f4f6",
                    transition: "0.15s",
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f9fafb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "white")
                  }
                >
                  <td style={{ padding: "8px 12px" }}>
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

                  <td style={{ padding: "8px 12px" }}>
                    <input
                      value={item.document}
                      onChange={(e) =>
                        updateItem(item.id, "document", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "8px 12px" }}>
                    <input
                      value={item.people}
                      onChange={(e) =>
                        updateItem(item.id, "people", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "8px 12px" }}>
                    <input
                      value={item.status}
                      onChange={(e) =>
                        updateItem(item.id, "status", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "8px 12px" }}>
                    <input
                      value={item.dueDate}
                      onChange={(e) =>
                        updateItem(item.id, "dueDate", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "8px 12px" }}>
                    <input
                      value={item.rev}
                      onChange={(e) =>
                        updateItem(item.id, "rev", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
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

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
            padding: "8px 4px",
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          <div>
            Total: <strong>{totalItems}</strong> item
          </div>
          <div>
            Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending: <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
          </div>
          <div>
            <span style={{ color: "#9ca3af" }}>💾 Saved</span>
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
