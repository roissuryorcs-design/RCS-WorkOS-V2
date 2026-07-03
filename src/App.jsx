import { useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import Sidebar from "./components/Sidebar";
import BoardTable from "./components/BoardTable";
import "./App.css";

export default function App() {
  // Data utama: workspaces → boards → items
  const [workspaces, setWorkspaces] = useLocalStorage("workosData", []);

  // State aktif
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [search, setSearch] = useState("");

  // Helpers
  const getActiveWorkspace = () => workspaces.find((w) => w.id === activeWorkspaceId);
  const getActiveBoard = () => {
    const ws = getActiveWorkspace();
    return ws ? ws.boards.find((b) => b.id === activeBoardId) : null;
  };

  // Filter items berdasarkan search
  const getFilteredItems = () => {
    const board = getActiveBoard();
    if (!board) return [];
    return board.items.filter(
      (item) =>
        item.item.toLowerCase().includes(search.toLowerCase()) ||
        item.document.toLowerCase().includes(search.toLowerCase()) ||
        item.people.toLowerCase().includes(search.toLowerCase())
    );
  };

  // ----- WORKSPACE CRUD -----
  const addWorkspace = () => {
    const name = prompt("Enter workspace name:");
    if (!name || !name.trim()) return;
    const newWs = {
      id: Date.now(),
      name: name.trim(),
      boards: [],
    };
    setWorkspaces([...workspaces, newWs]);
    setActiveWorkspaceId(newWs.id);
  };

  // ----- BOARD CRUD -----
  const addBoard = (workspaceId) => {
    const name = prompt("Enter board name:");
    if (!name || !name.trim()) return;
    const newBoard = {
      id: Date.now(),
      name: name.trim(),
      description: "",
      items: [],
    };
    setWorkspaces(
      workspaces.map((ws) =>
        ws.id === workspaceId ? { ...ws, boards: [...ws.boards, newBoard] } : ws
      )
    );
    setActiveBoardId(newBoard.id);
  };

  // ----- ITEM CRUD -----
  const addItem = () => {
    const board = getActiveBoard();
    if (!board) return alert("Select a board first!");
    const newItem = {
      id: Date.now(),
      item: "New Task",
      document: "",
      people: "",
      status: "To Do",
      dueDate: "-",
      rev: "R0",
    };
    setWorkspaces(
      workspaces.map((ws) =>
        ws.id === activeWorkspaceId
          ? {
              ...ws,
              boards: ws.boards.map((b) =>
                b.id === activeBoardId ? { ...b, items: [...b.items, newItem] } : b
              ),
            }
          : ws
      )
    );
  };

  const updateItem = (itemId, field, value) => {
    setWorkspaces(
      workspaces.map((ws) =>
        ws.id === activeWorkspaceId
          ? {
              ...ws,
              boards: ws.boards.map((b) =>
                b.id === activeBoardId
                  ? {
                      ...b,
                      items: b.items.map((item) =>
                        item.id === itemId ? { ...item, [field]: value } : item
                      ),
                    }
                  : b
              ),
            }
          : ws
      )
    );
  };

  const deleteItem = (itemId) => {
    if (!confirm("Delete this item?")) return;
    setWorkspaces(
      workspaces.map((ws) =>
        ws.id === activeWorkspaceId
          ? {
              ...ws,
              boards: ws.boards.map((b) =>
                b.id === activeBoardId
                  ? { ...b, items: b.items.filter((item) => item.id !== itemId) }
                  : b
              ),
            }
          : ws
      )
    );
  };

  // ----- SELECT -----
  const selectWorkspace = (id) => {
    setActiveWorkspaceId(id);
    const ws = workspaces.find((w) => w.id === id);
    if (ws && ws.boards.length > 0) {
      setActiveBoardId(ws.boards[0].id);
    } else {
      setActiveBoardId(null);
    }
  };

  const selectBoard = (id) => {
    setActiveBoardId(id);
  };

  // ----- RENDER -----
  const activeBoard = getActiveBoard();
  const filteredItems = getFilteredItems();

  const totalItems = filteredItems.length;
  const doneItems = filteredItems.filter((it) => it.status === "Done").length;
  const pendingItems = totalItems - doneItems;

  return (
    <div className="app-container">
      <Sidebar
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        activeBoardId={activeBoardId}
        onSelectWorkspace={selectWorkspace}
        onSelectBoard={selectBoard}
        onAddWorkspace={addWorkspace}
        onAddBoard={addBoard}
      />

      <div className="main-content">
        <div className="header">
          <div>
            <h1 className="header-title">{activeBoard?.name || "Select a Board"}</h1>
            <p className="header-subtitle">{activeBoard?.description || "No description"}</p>
          </div>
        </div>

        {activeBoard ? (
          <>
            <div className="toolbar">
              <input
                className="toolbar-search"
                placeholder="🔍 Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="toolbar-add-btn" onClick={addItem}>
                + Add Item
              </button>
            </div>

            <BoardTable
              items={filteredItems}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
            />

            <div className="board-footer">
              <div>
                Total: <strong>{totalItems}</strong> item
              </div>
              <div>
                Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending:{" "}
                <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
              </div>
              <div>
                <span style={{ color: "#9ca3af" }}>💾</span> Saved
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>No Board Selected</h3>
            <p>Create a workspace and board from the sidebar to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
