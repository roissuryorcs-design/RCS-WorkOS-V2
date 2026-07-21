import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ColumnProvider, useColumns } from "./context/ColumnContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import BoardTable from "./components/BoardTable";
import StatusManager from "./components/StatusManager";
import ColumnManager from "./components/ColumnManager";
import AddColumnPopup from "./components/AddColumnPopup";
import "./App.css";

function AppContent() {
  const [items, setItems] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [groupColors, setGroupColors] = useState({});
  const [activeStatusColumnId, setActiveStatusColumnId] = useState(null);
  const [showAddColumnPopup, setShowAddColumnPopup] = useState(false);
  const [boardTitle, setBoardTitle] = useState("FOREL FPSO HVAC");
  const [boardSubtitle, setBoardSubtitle] = useState("Sub Title / Description");

  const { columns, addColumn, renameColumn, toggleColumn, deleteColumn, resetColumns, updateColumnStatuses, updateColumnStatusOrder } = useColumns();

  // ============================================================
  // CEK: Jika semua group dihapus, reset board title & subtitle ke default
  // ============================================================
  useEffect(() => {
    const allGroups = [...new Set(items.map((item) => item.group))];
    if (allGroups.length === 0 && items.length === 0) {
      setBoardTitle("BOARD TITLE");
      setBoardSubtitle("Sub Title / Description");
    }
  }, [items]);

  // ============================================================
  // FUNGSI UNTUK RESET BOARD TITLE (opsional)
  // ============================================================
  const resetBoardTitle = () => {
    setBoardTitle("BOARD TITLE");
  };

  // ----- LOAD DATA -----
  useEffect(() => {
    const savedItems = localStorage.getItem("forelItems");
    const savedStatuses = localStorage.getItem("forelStatuses");
    const savedFavs = localStorage.getItem("forelFavorites");
    const savedGroupColors = localStorage.getItem("forelGroupColors");
    const savedBoardTitle = localStorage.getItem("forelBoardTitle");
    const savedBoardSubtitle = localStorage.getItem("forelBoardSubtitle");

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
      const parsedItems = JSON.parse(savedItems);
      const ensureChildren = (items) => {
        return items.map(item => ({
          ...item,
          children: item.children || [],
          isExpanded: item.isExpanded !== undefined ? item.isExpanded : false,
          ...(item.children ? { children: ensureChildren(item.children) } : {})
        }));
      };
      setItems(ensureChildren(parsedItems));
    } else {
      setItems([
        { 
          id: 1, 
          group: "Target & PLANNING", 
          item: "Scope of Work", 
          document: "NO. DO", 
          people: "Done", 
          status: "Default", 
          dueDate: "dd/mm/ttt", 
          rev: "R0",
          children: [],
          isExpanded: false,
        },
        { 
          id: 2, 
          group: "Target & PLANNING", 
          item: "GA Drawings", 
          document: "NO. DO", 
          people: "Done", 
          status: "Default", 
          dueDate: "dd/mm/ttt", 
          rev: "R0",
          children: [
            {
              id: 6,
              item: "General Arrangement",
              document: "ID-F-FT-NN1-GAD-FP-0",
              people: "RS",
              status: "Default",
              dueDate: "01/07/2026",
              rev: "R1",
              children: [
                {
                  id: 7,
                  item: "HVAC Room Arrangement",
                  document: "P2104-V-D-GSHD-ME-GA",
                  people: "Done",
                  status: "Default",
                  dueDate: "dd/mm/ttt",
                  rev: "R0",
                  children: [
                    {
                      id: 8,
                      item: "Drawing A",
                      document: "DWG-A-001",
                      people: "John",
                      status: "Default",
                      dueDate: "dd/mm/ttt",
                      rev: "R1",
                      children: [],
                      isExpanded: false,
                    },
                    {
                      id: 9,
                      item: "Drawing B",
                      document: "DWG-B-002",
                      people: "Jane",
                      status: "Default",
                      dueDate: "dd/mm/ttt",
                      rev: "R0",
                      children: [],
                      isExpanded: false,
                    }
                  ],
                  isExpanded: true,
                }
              ],
              isExpanded: true,
            }
          ],
          isExpanded: true,
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
          children: [],
          isExpanded: false,
        },
        { 
          id: 4, 
          group: "Completed", 
          item: "HVAC Room Arrangement DI", 
          document: "P2104-V-D-GSHD-ME-GA", 
          people: "Done", 
          status: "Default", 
          dueDate: "dd/mm/ttt", 
          rev: "R0",
          children: [],
          isExpanded: false,
        },
        { 
          id: 5, 
          group: "Completed", 
          item: "Layout Drawings", 
          document: "NO. DO", 
          people: "Done", 
          status: "Default", 
          dueDate: "dd/mm/ttt", 
          rev: "R0",
          children: [],
          isExpanded: false,
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
      const defaultColors = {};
      const groups = [...new Set(JSON.parse(savedItems || "[]").map(item => item.group))];
      groups.forEach(g => { defaultColors[g] = "#3b82f6"; });
      setGroupColors(defaultColors);
    }

    if (savedBoardTitle) {
      setBoardTitle(savedBoardTitle);
    }

    if (savedBoardSubtitle) {
      setBoardSubtitle(savedBoardSubtitle);
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

  useEffect(() => {
    localStorage.setItem("forelBoardTitle", boardTitle);
  }, [boardTitle]);

  useEffect(() => {
    localStorage.setItem("forelBoardSubtitle", boardSubtitle);
  }, [boardSubtitle]);

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

  // ============================================================
  // FIND ITEM BY ID - RECURSIVE
  // ============================================================
  const findItemById = (items, id) => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children && item.children.length > 0) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // ============================================================
  // UPDATE ITEM - RECURSIVE
  // ============================================================
  const updateItemRecursive = (items, id, field, value) => {
    return items.map((it) => {
      if (it.id === id) {
        return { ...it, [field]: value };
      }
      if (it.children && it.children.length > 0) {
        return { ...it, children: updateItemRecursive(it.children, id, field, value) };
      }
      return it;
    });
  };

  const updateItem = (id, field, value) => {
    const newItems = updateItemRecursive(items, id, field, value);
    saveHistory(newItems);
  };

  // ============================================================
  // DELETE ITEM - RECURSIVE
  // ============================================================
  const deleteItemRecursive = (items, id) => {
    return items
      .filter((it) => it.id !== id)
      .map((it) => {
        if (it.children && it.children.length > 0) {
          return { ...it, children: deleteItemRecursive(it.children, id) };
        }
        return it;
      });
  };

  const deleteItem = (id) => {
    if (!confirm("Delete this item?")) return;
    const item = findItemById(items, id);
    if (item && item.children && item.children.length > 0) {
      if (!confirm(`Item "${item.item}" has ${item.children.length} sub item(s). Delete all?`)) return;
    }
    const newItems = deleteItemRecursive(items, id);
    saveHistory(newItems);
  };

  // ============================================================
  // ADD SUB ITEM
  // ============================================================
  const addSubItem = (parentId, newTitle = null) => {
    const parent = findItemById(items, parentId);
    if (!parent) {
      console.warn('Parent not found for id:', parentId);
      return;
    }

    const getDepthForParent = (items, id, currentDepth = 0) => {
      for (const item of items) {
        if (item.id === id) {
          return currentDepth;
        }
        if (item.children && item.children.length > 0) {
          const found = getDepthForParent(item.children, id, currentDepth + 1);
          if (found !== -1) return found;
        }
      }
      return -1;
    };

    const currentDepth = getDepthForParent(items, parentId, 0);

    if (currentDepth >= 3) {
      alert('Maximum 4 levels reached for this item!');
      return;
    }

    const getLevelName = (depth) => {
      if (depth <= 0) return "New Task";
      if (depth === 1) return "Sub Item";
      if (depth === 2) return "Sub Sub Item";
      if (depth === 3) return "Sub Sub Sub Item";
      return "New Task";
    };

    const finalTitle = newTitle || getLevelName(currentDepth + 1);

    const newItem = {
      id: Date.now(),
      group: parent.group || "Target & PLANNING",
      item: finalTitle,
      document: "NO. DO",
      people: "",
      status: "Default",
      dueDate: "dd/mm/ttt",
      rev: "R0",
      children: [],
      isExpanded: false,
    };

    const addChildRecursive = (items) => {
      return items.map((it) => {
        if (it.id === parentId) {
          return {
            ...it,
            children: [...(it.children || []), newItem],
            isExpanded: true,
          };
        }
        if (it.children && it.children.length > 0) {
          return {
            ...it,
            children: addChildRecursive(it.children)
          };
        }
        return it;
      });
    };

    const newItems = addChildRecursive(items);
    saveHistory(newItems);
  };

  // ----- ADD ITEM (di group) -----
  const addItem = (groupName) => {
    const firstStatus = "Default";
    const newItem = {
      id: Date.now(),
      group: groupName || "Target & PLANNING",
      item: "New Task",
      document: "NO. DO",
      people: "",
      status: firstStatus,
      dueDate: "dd/mm/ttt",
      rev: "R0",
      children: [],
      isExpanded: false,
    };
    saveHistory([...items, newItem]);
  };

  // ============================================================
  // GROUP CRUD
  // ============================================================

  const renameGroup = (oldName, newName) => {
    if (!newName || !newName.trim()) return;
    if (items.some((item) => item.group === newName.trim() && item.group !== oldName)) {
      alert(`Group "${newName.trim()}" already exists!`);
      return;
    }
    
    const renameGroupRecursive = (items) => {
      return items.map((it) => {
        const updated = it.group === oldName ? { ...it, group: newName.trim() } : it;
        if (updated.children && updated.children.length > 0) {
          return { ...updated, children: renameGroupRecursive(updated.children) };
        }
        return updated;
      });
    };

    const newItems = renameGroupRecursive(items);
    saveHistory(newItems);
    
    const newColors = { ...groupColors };
    if (newColors[oldName] !== undefined) {
      newColors[newName.trim()] = newColors[oldName];
      delete newColors[oldName];
      setGroupColors(newColors);
    }
  };

  const deleteGroup = (groupName) => {
    if (!confirm(`Delete entire group "${groupName}" and all its items?`)) return;
    const newItems = items.filter((it) => it.group !== groupName);
    saveHistory(newItems);
    const newColors = { ...groupColors };
    delete newColors[groupName];
    setGroupColors(newColors);
  };

  const addGroup = () => {
    const name = prompt("Enter new group name:");
    if (!name || !name.trim()) return;
    if (items.some((item) => item.group === name.trim())) {
      alert(`Group "${name.trim()}" already exists!`);
      return;
    }
    const firstStatus = "Default";
    const newItem = {
      id: Date.now(),
      group: name.trim(),
      item: `New Task in ${name.trim()}`,
      document: "NO. DO",
      people: "",
      status: firstStatus,
      dueDate: "dd/mm/ttt",
      rev: "R0",
      children: [],
      isExpanded: false,
    };
    saveHistory([...items, newItem]);
    setGroupColors((prev) => ({ ...prev, [name.trim()]: "#3b82f6" }));
  };

  const updateGroupColor = (groupName, color) => {
    setGroupColors((prev) => ({ ...prev, [groupName]: color }));
  };

  // ----- STATUS CRUD -----
  const addStatus = (name, color) => {
    const finalName = name.trim() || "Default";
    if (statuses[finalName]) {
      alert(`Status "${finalName}" already exists!`);
      return;
    }
    setStatuses({ ...statuses, [finalName]: color || "#9ca3af" });
  };

  const updateStatusColor = (name, color) => {
    setStatuses({ ...statuses, [name]: color });
  };

  const deleteStatus = (name) => {
    const currentKeys = Object.keys(statuses);
    if (currentKeys.length <= 1) {
      alert("Cannot delete the last status. At least one status must remain.");
      return;
    }
    const remainingStatus = currentKeys.find((k) => k !== name) || "Default";
    
    const updateStatusRecursive = (items) => {
      return items.map((it) => {
        const updated = it.status === name ? { ...it, status: remainingStatus } : it;
        if (updated.children && updated.children.length > 0) {
          return { ...updated, children: updateStatusRecursive(updated.children) };
        }
        return updated;
      });
    };

    const newItems = updateStatusRecursive(items);
    const newStatuses = { ...statuses };
    delete newStatuses[name];
    setStatuses(newStatuses);
    setItems(newItems);
  };

  const renameStatus = (oldName, newName) => {
    if (!newName || !newName.trim()) return;
    if (statuses[newName.trim()] && newName.trim() !== oldName) {
      alert(`Status "${newName.trim()}" already exists!`);
      return;
    }
    const newStatuses = { ...statuses };
    const color = newStatuses[oldName];
    delete newStatuses[oldName];
    newStatuses[newName.trim()] = color;
    setStatuses(newStatuses);
    
    const renameStatusRecursive = (items) => {
      return items.map((it) => {
        const updated = it.status === oldName ? { ...it, status: newName.trim() } : it;
        if (updated.children && updated.children.length > 0) {
          return { ...updated, children: renameStatusRecursive(updated.children) };
        }
        return updated;
      });
    };

    const newItems = renameStatusRecursive(items);
    setItems(newItems);
  };

  const openStatusManager = (columnId) => {
    setActiveStatusColumnId(columnId);
    setShowStatusManager(true);
  };

  const handleAddColumn = (name, type) => {
    addColumn(name, type);
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
    const dataStr = JSON.stringify({ items, statuses, groupColors }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forel_data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================
  // FILTER & SEARCH
  // ============================================================
  const filterItemsRecursive = (items, searchTerm) => {
    const lowerSearch = searchTerm.toLowerCase();
    return items
      .map((item) => {
        const matches = 
          item.item.toLowerCase().includes(lowerSearch) ||
          (item.document && item.document.toLowerCase().includes(lowerSearch)) ||
          (item.people && item.people.toLowerCase().includes(lowerSearch));

        let filteredChildren = [];
        if (item.children && item.children.length > 0) {
          filteredChildren = filterItemsRecursive(item.children, searchTerm);
        }

        if (matches || filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren,
            isExpanded: filteredChildren.length > 0 ? true : item.isExpanded,
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  // ----- STATS -----
  const countAllItems = (items) => {
    let count = 0;
    items.forEach((item) => {
      count++;
      if (item.children && item.children.length > 0) {
        count += countAllItems(item.children);
      }
    });
    return count;
  };

  const countDoneItems = (items) => {
    let count = 0;
    items.forEach((item) => {
      if (item.status === "Done") count++;
      if (item.children && item.children.length > 0) {
        count += countDoneItems(item.children);
      }
    });
    return count;
  };

  const filteredItems = search.trim() === "" 
    ? items 
    : filterItemsRecursive(items, search);

  const totalItems = countAllItems(filteredItems);
  const hasDoneStatus = Object.keys(statuses).includes("Done");
  const doneItems = hasDoneStatus ? countDoneItems(filteredItems) : 0;
  const pendingItems = totalItems - doneItems;
  const allGroups = [...new Set(items.map((item) => item.group))];

  return (
    <div className="app-container">
      <Sidebar
        favorites={favorites}
        onAddFavorite={addFavorite}
        onRemoveFavorite={removeFavorite}
      />

      <div className="main-content">
        {/* ============================================================
            HEADER DENGAN BOARD TITLE & SUB TITLE DINAMIS
            ============================================================ */}
        <div className="header-sticky">
          <h1 
            className="header-title" 
            title="Click to edit board name"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const newTitle = e.target.textContent.trim();
              if (newTitle) {
                setBoardTitle(newTitle);
              } else {
                e.target.textContent = boardTitle;
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
              }
            }}
            style={{
              cursor: 'text',
              outline: 'none',
              padding: '2px 4px',
              borderRadius: '4px',
              position: 'relative',
            }}
          >
            {boardTitle}
            <span 
              className="header-edit-icon"
              style={{ 
                fontSize: '14px', 
                color: 'var(--text-muted)', 
                marginLeft: '8px', 
                fontWeight: 400,
                opacity: 0,
                transition: 'opacity 0.2s ease',
                display: 'inline-block',
              }}
            >
              ✎
            </span>
          </h1>
          
          <p 
            className="header-subtitle"
            title="Click to edit subtitle"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const newSubtitle = e.target.textContent.trim();
              if (newSubtitle) {
                setBoardSubtitle(newSubtitle);
              } else {
                e.target.textContent = boardSubtitle;
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
              }
            }}
            style={{
              cursor: 'text',
              outline: 'none',
              padding: '2px 4px',
              borderRadius: '4px',
              position: 'relative',
              display: 'inline-block',
              margin: 0,
            }}
          >
            {boardSubtitle}
            <span 
              className="header-edit-icon"
              style={{ 
                fontSize: '12px', 
                color: 'var(--text-muted)', 
                marginLeft: '6px', 
                fontWeight: 400,
                opacity: 0,
                transition: 'opacity 0.2s ease',
                display: 'inline-block',
              }}
            >
              ✎
            </span>
          </p>
        </div>

        <Toolbar
          search={search}
          onSearchChange={setSearch}
          onAddGroup={addGroup}
          onUndo={undo}
          onExport={exportData}
          canUndo={history.length > 0}
          onOpenColumnManager={() => setShowColumnManager(true)}
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
          onAddSubItem={addSubItem}
          onOpenStatusManager={openStatusManager}
          onRenameGroup={renameGroup}
          onOpenAddColumn={() => setShowAddColumnPopup(true)}
        />

        <div className="board-footer">
          <div>Total: <strong>{totalItems}</strong> items</div>
          <div>
            Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending:{" "}
            <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
          </div>
          <div><span style={{ color: "var(--text-light)" }}>💾</span> Saved</div>
        </div>
      </div>

      {showStatusManager && (
        <StatusManager
          columnId={activeStatusColumnId}
          statuses={columns.find((c) => c.id === activeStatusColumnId)?.statuses || {}}
          statusOrder={columns.find((c) => c.id === activeStatusColumnId)?.statusOrder || []}
          onUpdateStatuses={(newStatuses) => {
            updateColumnStatuses(activeStatusColumnId, newStatuses);
          }}
          onUpdateStatusOrder={(newOrder) => {
            updateColumnStatusOrder(activeStatusColumnId, newOrder);
          }}
          onClose={() => setShowStatusManager(false)}
        />
      )}

      {showColumnManager && (
        <ColumnManager
          columns={columns}
          onAddColumn={addColumn}
          onDeleteColumn={deleteColumn}
          onToggleColumn={toggleColumn}
          onRenameColumn={renameColumn}
          onResetColumns={resetColumns}
          onClose={() => setShowColumnManager(false)}
        />
      )}

      {showAddColumnPopup && (
        <AddColumnPopup
          onAdd={handleAddColumn}
          onClose={() => setShowAddColumnPopup(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ColumnProvider>
        <AppContent />
      </ColumnProvider>
    </ThemeProvider>
  );
}
