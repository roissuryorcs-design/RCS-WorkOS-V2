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
  const [boardTitle, setBoardTitle] = useState("BOARD TITLE");
  const [boardSubtitle, setBoardSubtitle] = useState("Sub Title / Description");
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasAutoAdded, setHasAutoAdded] = useState(false);

  const { columns, addColumn, renameColumn, toggleColumn, deleteColumn, resetColumns, updateColumnStatuses, updateColumnStatusOrder } = useColumns();

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    const savedItems = localStorage.getItem("forelItems");
    const savedStatuses = localStorage.getItem("forelStatuses");
    const savedFavs = localStorage.getItem("forelFavorites");
    const savedGroupColors = localStorage.getItem("forelGroupColors");
    const savedBoardTitle = localStorage.getItem("forelBoardTitle");
    const savedBoardSubtitle = localStorage.getItem("forelBoardSubtitle");

    const defaultStatuses = { Default: "#9ca3af" };

    // ============================================================
    // LOAD BOARD TITLE - PRIORITASKAN LOCALSTORAGE
    // ============================================================
    if (savedBoardTitle && savedBoardTitle.trim() !== "") {
      setBoardTitle(savedBoardTitle);
    } else {
      setBoardTitle("BOARD TITLE");
    }

    if (savedBoardSubtitle && savedBoardSubtitle.trim() !== "") {
      setBoardSubtitle(savedBoardSubtitle);
    } else {
      setBoardSubtitle("Sub Title / Description");
    }

    // LOAD STATUSES
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

    // LOAD ITEMS
    let loadedItems = [];
    let allGroups = [];

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
      loadedItems = ensureChildren(parsedItems);
      allGroups = [...new Set(loadedItems.map(item => item.group))];
      
      if (allGroups.length === 0) {
        allGroups = ["Default Group"];
      }
    } else {
      const defaultGroup = "Default Group";
      allGroups = [defaultGroup];
      
      loadedItems = [
        { 
          id: 1, 
          group: defaultGroup, 
          item: "Task 1", 
          document: "DOC-001", 
          people: "Assign to...", 
          status: "Default", 
          dueDate: "", 
          rev: "R0",
          children: [],
          isExpanded: false,
        },
        { 
          id: 2, 
          group: defaultGroup, 
          item: "Task 2", 
          document: "DOC-002", 
          people: "Assign to...", 
          status: "Default", 
          dueDate: "", 
          rev: "R0",
          children: [],
          isExpanded: false,
        },
        { 
          id: 3, 
          group: defaultGroup, 
          item: "Task 3", 
          document: "DOC-003", 
          people: "Assign to...", 
          status: "Default", 
          dueDate: "", 
          rev: "R0",
          children: [],
          isExpanded: false,
        },
      ];
      
      localStorage.setItem("forelItems", JSON.stringify(loadedItems));
    }

    // AUTO-ADD 3 ITEMS
    let finalItems = loadedItems;
    let needsAutoAdd = false;
    
    allGroups.forEach(group => {
      const groupItems = finalItems.filter(item => item.group === group);
      if (groupItems.length === 0) {
        needsAutoAdd = true;
      }
    });
    
    if (needsAutoAdd && allGroups.length > 0) {
      allGroups.forEach(group => {
        const groupItems = finalItems.filter(item => item.group === group);
        if (groupItems.length === 0) {
          const startIndex = finalItems.filter(item => item.group === group).length;
          const newItems = Array.from({ length: 3 }, (_, i) => ({
            id: Date.now() + i + Math.random() * 1000,
            group: group,
            item: `Task ${startIndex + i + 1}`,
            document: `DOC-${String(startIndex + i + 1).padStart(3, '0')}`,
            people: "",
            status: "Default",
            dueDate: "",
            rev: "R0",
            children: [],
            isExpanded: false,
          }));
          finalItems = [...finalItems, ...newItems];
          console.log(`✅ Auto-added 3 items to group "${group}"`);
        }
      });
      
      localStorage.setItem("forelItems", JSON.stringify(finalItems));
      setHasAutoAdded(true);
    }

    setItems(finalItems);

    // LOAD FAVORITES
    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs));
    } else {
      setFavorites(["Workspace", "Administration"]);
    }

    // LOAD GROUP COLORS
    if (savedGroupColors) {
      setGroupColors(JSON.parse(savedGroupColors));
    } else {
      const defaultColors = {};
      const groups = [...new Set(finalItems.map(item => item.group))];
      if (groups.length === 0) {
        defaultColors["Default Group"] = "#3b82f6";
      } else {
        groups.forEach(g => { defaultColors[g] = "#3b82f6"; });
      }
      setGroupColors(defaultColors);
    }

    setIsInitialized(true);
  }, []);

  // ============================================================
  // AUTO-ADD 3 ITEMS (REAL-TIME)
  // ============================================================
  useEffect(() => {
    if (!isInitialized) return;
    if (hasAutoAdded) return;
    
    const allGroups = [...new Set(items.map(item => item.group))];
    let needsAutoAdd = false;
    const groupsToCheck = allGroups.length > 0 ? allGroups : ['Default Group'];
    
    groupsToCheck.forEach(group => {
      const groupItems = items.filter(item => item.group === group);
      if (groupItems.length === 0) {
        needsAutoAdd = true;
      }
    });
    
    if (needsAutoAdd && groupsToCheck.length > 0) {
      setHasAutoAdded(true);
      let updatedItems = [...items];
      
      groupsToCheck.forEach(group => {
        const groupItems = updatedItems.filter(item => item.group === group);
        if (groupItems.length === 0) {
          const startIndex = updatedItems.filter(item => item.group === group).length;
          const newItems = Array.from({ length: 3 }, (_, i) => ({
            id: Date.now() + i + Math.random() * 1000,
            group: group,
            item: `Task ${startIndex + i + 1}`,
            document: `DOC-${String(startIndex + i + 1).padStart(3, '0')}`,
            people: "",
            status: "Default",
            dueDate: "",
            rev: "R0",
            children: [],
            isExpanded: false,
          }));
          updatedItems = [...updatedItems, ...newItems];
          console.log(`✅ Auto-added 3 items to group "${group}" (real-time)`);
        }
      });
      
      setItems(updatedItems);
      localStorage.setItem("forelItems", JSON.stringify(updatedItems));
      
      setTimeout(() => {
        setHasAutoAdded(false);
      }, 1000);
    }
  }, [items, isInitialized]);

  // ============================================================
  // AUTO-SAVE
  // ============================================================
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("forelItems", JSON.stringify(items));
    }
  }, [items, isInitialized]);

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

  // ============================================================
  // 🔥 FIX: HAPUS RESET TITLE SAAT GROUP KOSONG
  // ============================================================
  // useEffect(() => {
  //   const allGroups = [...new Set(items.map((item) => item.group))];
  //   if (allGroups.length === 0 && items.length === 0) {
  //     setBoardTitle("BOARD TITLE");
  //     setBoardSubtitle("Sub Title / Description");
  //   }
  // }, [items]);

  // ============================================================
  // HANDLER UNTUK HEADER
  // ============================================================
  const handleTitleChange = (newTitle) => {
    setBoardTitle(newTitle);
    localStorage.setItem("forelBoardTitle", newTitle);
  };

  const handleSubtitleChange = (newSubtitle) => {
    setBoardSubtitle(newSubtitle);
    localStorage.setItem("forelBoardSubtitle", newSubtitle);
  };

  // ============================================================
  // UNDO
  // ============================================================
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
    setHasAutoAdded(false);
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
      group: parent.group || "Default Group",
      item: finalTitle,
      document: "NO. DO",
      people: "",
      status: "Default",
      dueDate: "",
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

  // ============================================================
  // ADD ITEM (di group)
  // ============================================================
  const addItem = (groupName) => {
    const firstStatus = "Default";
    const groupItems = items.filter(item => item.group === groupName);
    
    const newItem = {
      id: Date.now(),
      group: groupName || "Default Group",
      item: `Task ${groupItems.length + 1}`,
      document: `DOC-${String(groupItems.length + 1).padStart(3, '0')}`,
      people: "",
      status: firstStatus,
      dueDate: "",
      rev: "R0",
      children: [],
      isExpanded: false,
    };
    saveHistory([...items, newItem]);
    setHasAutoAdded(false);
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
    setHasAutoAdded(false);
  };

  // ============================================================
  // ADD GROUP - DENGAN AUTO-ADD 3 ITEM
  // ============================================================
  const addGroup = () => {
    const name = prompt("Enter new group name:");
    if (!name || !name.trim()) return;
    if (items.some((item) => item.group === name.trim())) {
      alert(`Group "${name.trim()}" already exists!`);
      return;
    }
    
    const groupName = name.trim();
    const firstStatus = "Default";
    
    const newItems = Array.from({ length: 3 }, (_, i) => ({
      id: Date.now() + i + Math.random() * 1000,
      group: groupName,
      item: `Task ${i + 1} in ${groupName}`,
      document: `DOC-${String(i + 1).padStart(3, '0')}`,
      people: "",
      status: firstStatus,
      dueDate: "",
      rev: "R0",
      children: [],
      isExpanded: false,
    }));
    
    const updatedItems = [...items, ...newItems];
    saveHistory(updatedItems);
    setGroupColors((prev) => ({ ...prev, [groupName]: "#3b82f6" }));
    setHasAutoAdded(false);
    
    console.log(`✅ Added new group "${groupName}" with 3 items`);
  };

  const updateGroupColor = (groupName, color) => {
    setGroupColors((prev) => ({ ...prev, [groupName]: color }));
  };

  // ============================================================
  // STATUS CRUD
  // ============================================================
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

  // ============================================================
  // FAVORITES
  // ============================================================
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

  // ============================================================
  // EXPORT
  // ============================================================
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

  // ============================================================
  // STATS
  // ============================================================
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="app-container">
      <Sidebar
        favorites={favorites}
        onAddFavorite={addFavorite}
        onRemoveFavorite={removeFavorite}
      />

      <div className="main-content">
        {/* ============================================================
            HEADER - PAKAI COMPONENT HEADER (TANPA ICON ✎)
            ============================================================ */}
        <Header
          boardTitle={boardTitle}
          boardSubtitle={boardSubtitle}
          onTitleChange={handleTitleChange}
          onSubtitleChange={handleSubtitleChange}
        />

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

      {/* MODALS */}
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
