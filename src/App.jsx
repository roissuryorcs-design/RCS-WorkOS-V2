import { useState, useEffect } from "react";

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
            dueDate: "dd/mm/tTTT",
            rev: "R0",
          },
          {
            id: 2,
            item: "GA Drawings",
            document: "",
            people: "Done",
            status: "",
            dueDate: "dd/mm/tTTT",
            rev: "R0",
          },
          {
            id: 3,
            item: "General Arrangement",
            document: "ID-F-PT-NN1-GAD-FP-0",
            people: "RS",
            status: "",
            dueDate: "01/07/2026",
            rev: "R1",
          },
          {
            id: 4,
            item: "HVAC Room Arrangement DI",
            document: "P2104-V-D-GSHD-ME-GA",
            people: "Done",
            status: "",
            dueDate: "dd/mm/tTTT",
            rev: "R0",
          },
          {
            id: 5,
            item: "Layout Drawings",
            document: "",
            people: "Done",
            status: "",
            dueDate: "dd/mm/tTTT",
            rev: "R0",
          },
          {
            id: 6,
            item: "HVAC System Layout Drawir",
            document: "P2104-V-D-GSHD-ME-LA",
            people: "Done",
            status: "",
            dueDate: "dd/mm/tTTT",
            rev: "R0",
          },
          {
            id: 7,
            item: "HVAC System Layout Drawir",
            document: "P2104-V-D-GSHD-ME-LA",
            people: "Done",
            status: "",
            dueDate: "dd/mm/tTTT",
            rev: "R0",
          },
        ];
  });

  // ✅ AUTO SAVE
  useEffect(() => {
    localStorage.setItem("forelItems", JSON.stringify(items));
  }, [items]);

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const deleteItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculate statistics
  const totalItems = items.length;
  const doneItems = items.filter((item) => item.people === "Done").length;
  const pendingItems = totalItems - doneItems;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif", background: "#f5f6f8" }}>
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

        {/* PROJECT SECTION */}
        <div style={{ marginBottom: 24 }}>
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
            PROJECT
          </p>

          <div style={{ marginBottom: 12 }}>
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

        {/* FAVORITES */}
        <div style={{ marginBottom: 24 }}>
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

        {/* MORE */}
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
            MORE
          </p>
          <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 4 }}>
            Monday AI
          </div>
          <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 4 }}>
            Automate
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "24px 32px", background: "#ffffff" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a2e" }}>
            FOREL FPSO HVAC
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
            Engineering
          </p>
        </div>

        {/* TABLE */}
        <div style={{ overflowX: "auto" }}>
          <table width="100%" cellPadding="0" style={{ borderCollapse: "collapse" }}>
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
                <th style={{ padding: "10px 8px", width: "22%" }}>ITEM</th>
                <th style={{ padding: "10px 8px", width: "28%" }}>NO. DOCUMENT</th>
                <th style={{ padding: "10px 8px", width: "15%" }}>PEOPLE</th>
                <th style={{ padding: "10px 8px", width: "15%" }}>STATUS</th>
                <th style={{ padding: "10px 8px", width: "15%" }}>DUE DATE</th>
                <th style={{ padding: "10px 8px", width: "10%" }}>REV</th>
                <th style={{ padding: "10px 8px", width: "5%", textAlign: "center" }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: index === items.length - 1 ? "none" : "1px solid #f3f4f6",
                    fontSize: 13,
                  }}
                >
                  <td style={{ padding: "8px 8px" }}>
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

                  <td style={{ padding: "8px 8px" }}>
                    <input
                      value={item.document}
                      onChange={(e) =>
                        updateItem(item.id, "document", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "8px 8px" }}>
                    <input
                      value={item.people}
                      onChange={(e) =>
                        updateItem(item.id, "people", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "8px 8px" }}>
                    <input
                      value={item.status}
                      onChange={(e) =>
                        updateItem(item.id, "status", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "8px 8px" }}>
                    <input
                      value={item.dueDate}
                      onChange={(e) =>
                        updateItem(item.id, "dueDate", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "8px 8px" }}>
                    <input
                      value={item.rev}
                      onChange={(e) =>
                        updateItem(item.id, "rev", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={{ padding: "8px 8px", textAlign: "center" }}>
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
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid #e5e7eb",
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          <div>
            Total: <strong>{totalItems}</strong> item
          </div>
          <div>
            Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending: <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
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
