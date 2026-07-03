import { useState, useEffect } from "react";

export default function App() {
  const [items, setItems] = useState([]);

  // SAFE LOAD LOCALSTORAGE
  useEffect(() => {
    const saved = localStorage.getItem("forelItems");

    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems([
        {
          id: 1,
          item: "Scope of Work",
          document: "",
          status: "Done",
          dueDate: "2026-07-01",
          rev: "R0",
        },
        {
          id: 2,
          item: "GA Drawings",
          document: "",
          status: "Working",
          dueDate: "2026-07-05",
          rev: "R0",
        },
      ]);
    }
  }, []);

  // AUTO SAVE
  useEffect(() => {
    localStorage.setItem("forelItems", JSON.stringify(items));
  }, [items]);

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const deleteItem = (id) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        item: "New Item",
        document: "",
        status: "To Do",
        dueDate: "-",
        rev: "R0",
      },
    ]);
  };

  const statusColor = (status) => {
    switch (status) {
      case "Done":
        return "#22c55e";
      case "Working":
        return "#3b82f6";
      case "Review":
        return "#f59e0b";
      default:
        return "#9ca3af";
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f6f8", fontFamily: "Arial" }}>

      {/* SIDEBAR */}
      <div style={{ width: 220, background: "#111827", color: "white", padding: 20 }}>
        <h2>FOREL FPSO</h2>
        <p style={{ fontSize: 12, opacity: 0.6 }}>Engineering</p>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: 20 }}>

        {/* TOP BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
          <h2>HVAC Table</h2>

          <button
            onClick={addItem}
            style={{
              background: "#111827",
              color: "white",
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer"
            }}
          >
            + Add Item
          </button>
        </div>

        {/* TABLE */}
        <div style={{
          background: "white",
          borderRadius: 12,
          padding: 12,
          boxShadow: "0 4px 18px rgba(0,0,0,0.06)"
        }}>
          <table width="100%" cellPadding="8">
            <thead style={{ textAlign: "left", fontSize: 12, color: "#6b7280" }}>
              <tr>
                <th>ITEM</th>
                <th>DOCUMENT</th>
                <th>STATUS</th>
                <th>DUE</th>
                <th>REV</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {items.map((it) => (
                <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>

                  <td>
                    <input
                      value={it.item}
                      onChange={(e) => updateItem(it.id, "item", e.target.value)}
                      style={input}
                    />
                  </td>

                  <td>
                    <input
                      value={it.document}
                      onChange={(e) => updateItem(it.id, "document", e.target.value)}
                      style={input}
                    />
                  </td>

                  {/* STATUS FIXED (SELECT) */}
                  <td>
                    <select
                      value={it.status}
                      onChange={(e) => updateItem(it.id, "status", e.target.value)}
                      style={{
                        padding: 4,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        background: statusColor(it.status),
                        color: "white"
                      }}
                    >
                      <option>To Do</option>
                      <option>Working</option>
                      <option>Review</option>
                      <option>Done</option>
                    </select>
                  </td>

                  <td>
                    <input
                      value={it.dueDate}
                      onChange={(e) => updateItem(it.id, "dueDate", e.target.value)}
                      style={input}
                    />
                  </td>

                  <td>
                    <input
                      value={it.rev}
                      onChange={(e) => updateItem(it.id, "rev", e.target.value)}
                      style={input}
                    />
                  </td>

                  <td>
                    <button
                      onClick={() => deleteItem(it.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#ef4444"
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

const input = {
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%"
};
