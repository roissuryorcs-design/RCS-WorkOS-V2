import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ColumnProvider, useColumns } from "./context/ColumnContext";
import { BoardsProvider, useBoards } from "./context/BoardsContext";
import { boardKey } from "./utils/boardStorage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import BoardTable from "./components/BoardTable";
import StatusManager from "./components/StatusManager";
import ColumnManager from "./components/ColumnManager";
import AddColumnPopup from "./components/AddColumnPopup";
import FormulaEditor from "./components/FormulaEditor";
import "./App.css";
import { UpdateProvider } from './context/UpdateContext';
import UpdatePanel from './components/UpdatePanel';

function BoardWorkspace({ boardId }) {
  const [items, setItems] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState([]);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [activeStatusColumnId, setActiveStatusColumnId] = useState(null);
  const [showAddColumnPopup, setShowAddColumnPopup] = useState(false);
  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  const [activeFormulaColumnId, setActiveFormulaColumnId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasAutoAdded, setHasAutoAdded] = useState(false);

  const { columns, addColumn, renameColumn, toggleColumn, deleteColumn, resetColumns, updateColumnStatuses, updateColumnStatusOrder, updateColumnFormula } = useColumns();

  // ============================================================
  // 🔥 STATE GROUPS - LANGSUNG DARI LOCALSTORAGE
  // ============================================================
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem(boardKey('board-groups', boardId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // ✅ NORMALISASI: "Default" → "Default Group"
          const normalized = parsed.map(g =>
            g === 'Default' ? 'Default Group' : g
          );
          // ✅ SIMPAN KEMBALI KE LOCALSTORAGE
          localStorage.setItem(boardKey('board-groups', boardId), JSON.stringify(normalized));
          return normalized;
        }
      } catch (e) {
        console.error('Error parsing board-groups:', e);
      }
    }
    return ['Default Group'];
  });

  // ============================================================
  // 🔥 STATE GROUP COLORS - DARI LOCALSTORAGE, DEFAULT BIRU
  // ============================================================
  const [groupColors, setGroupColors] = useState(() => {
    const saved = localStorage.getItem(boardKey('forelGroupColors', boardId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error loading groupColors:', e);
      }
    }
    // ✅ Default: Default Group warna biru (#3b82f6)
    return {
      'Default Group': '#3b82f6'
    };
  });

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    const savedItems = localStorage.getItem(boardKey("forelItems", boardId));
    const savedStatuses = localStorage.getItem(boardKey("forelStatuses", boardId));
    const savedGroupColors = localStorage.getItem(boardKey("forelGroupColors", boardId));

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

    let loadedItems = [];
    let groupsFromItems = [];

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
      groupsFromItems = [...new Set(loadedItems.map(item => item.group))];

      // ✅ NORMALISASI: "Default" → "Default Group"
      groupsFromItems = groupsFromItems.map(g =>
        g === 'Default' ? 'Default Group' : g
      );

      if (groupsFromItems.length === 0) {
        groupsFromItems = ["Default Group"];
      }
    } else {
      const defaultGroup = "Default Group";
      groupsFromItems = [defaultGroup];

      loadedItems = Array.from({ length: 3 }, (_, i) => ({
        id: Date.now() + i + Math.random() * 1000,
        group: defaultGroup,
        item: `Task ${i + 1}`,
        document: `DOC-${String(i + 1).padStart(3, '0')}`,
        people: "Assign to...",
        status: "Default",
        dueDate: "",
        rev: "R0",
        children: [],
        isExpanded: false,
      }));

      localStorage.setItem(boardKey("forelItems", boardId), JSON.stringify(loadedItems));
    }

    // AUTO-ADD 3 ITEMS
    let finalItems = loadedItems;
    let needsAutoAdd = false;

    groupsFromItems.forEach(group => {
      const groupItems = finalItems.filter(item => item.group === group);
      if (groupItems.length === 0) {
        needsAutoAdd = true;
      }
    });

    if (needsAutoAdd && groupsFromItems.length > 0) {
      groupsFromItems.forEach(group => {
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

      localStorage.setItem(boardKey("forelItems", boardId), JSON.stringify(finalItems));
      setHasAutoAdded(true);
    }

    setItems(finalItems);

    // ✅ UPDATE groups dari localStorage (jika ada) - DENGAN SIMPAN KEMBALI
    const savedGroups = localStorage.getItem(boardKey('board-groups', boardId));
    if (savedGroups) {
      try {
        const parsed = JSON.parse(savedGroups);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // ✅ NORMALISASI
          const normalized = parsed.map(g =>
            g === 'Default' ? 'Default Group' : g
          );
          setGroups(normalized);
          // ✅ SIMPAN KEMBALI KE LOCALSTORAGE
          localStorage.setItem(boardKey('board-groups', boardId), JSON.stringify(normalized));
        } else {
          setGroups(groupsFromItems);
          localStorage.setItem(boardKey('board-groups', boardId), JSON.stringify(groupsFromItems));
        }
      } catch (e) {
        setGroups(groupsFromItems);
        localStorage.setItem(boardKey('board-groups', boardId), JSON.stringify(groupsFromItems));
      }
    } else {
      setGroups(groupsFromItems);
      localStorage.setItem(boardKey('board-groups', boardId), JSON.stringify(groupsFromItems));
    }

    // ✅ LOAD GROUP COLORS
    if (savedGroupColors) {
      try {
        const parsed = JSON.parse(savedGroupColors);
        if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          setGroupColors(parsed);
        }
      } catch (e) {
        console.error('Error parsing groupColors:', e);
      }
    }

    // ✅ PASTIKAN DEFAULT GROUP PUNYA WARNA DAN SIMPAN
    setGroupColors(prev => {
      const updated = { ...prev };
      if (!updated['Default Group']) {
        updated['Default Group'] = '#3b82f6';
      }
      localStorage.setItem(boardKey('forelGroupColors', boardId), JSON.stringify(updated));
      return updated;
    });

    setIsInitialized(true);
  }, [boardId]);

  // ============================================================
  // AUTO-ADD 3 ITEMS (REAL-TIME)
  // ============================================================
  useEffect(() => {
    if (!isInitialized) return;
    if (hasAutoAdded) return;

    const groupsFromItems = [...new Set(items.map(item => item.group))];
    let needsAutoAdd = false;
    const groupsToCheck = groupsFromItems.length > 0 ? groupsFromItems : ['Default Group'];

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
      localStorage.setItem(boardKey("forelItems", boardId), JSON.stringify(updatedItems));

      setTimeout(() => {
        setHasAutoAdded(false);
      }, 1000);
    }
  }, [items, isInitialized, boardId]);

  // ============================================================
  // 🔥 FORCE AUTO-ADD 3 ITEMS KE DEFAULT GROUP
  // ============================================================
  useEffect(() => {
    if (!isInitialized) return;

    // Cek apakah Default Group ada di groups
    const hasDefaultGroup = groups && Array.isArray(groups) && groups.includes('Default Group');
    if (!hasDefaultGroup) return;

    // Cek items di Default Group
    const defaultItems = items.filter(item => item && item.group === 'Default Group');

    // Jika kurang dari 3 item, tambahkan
    if (defaultItems.length < 3) {
      const startIndex = defaultItems.length;
      const newItems = Array.from({ length: 3 - defaultItems.length }, (_, i) => ({
        id: Date.now() + i + Math.random() * 1000,
        group: 'Default Group',
        item: `Task ${startIndex + i + 1}`,
        document: `DOC-${String(startIndex + i + 1).padStart(3, '0')}`,
        people: "",
        status: "Default",
        dueDate: "",
        rev: "R0",
        children: [],
        isExpanded: false,
      }));

      if (newItems.length > 0) {
        const updatedItems = [...items, ...newItems];
        setItems(updatedItems);
        localStorage.setItem(boardKey("forelItems", boardId), JSON.stringify(updatedItems));
        console.log(`✅ Auto-added ${newItems.length} items to Default Group (total: ${defaultItems.length + newItems.length})`);
      }
    }
  }, [items, groups, isInitialized, boardId]);

  // ============================================================
  // AUTO-SAVE KE localStorage
  // ============================================================
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(boardKey("forelItems", boardId), JSON.stringify(items));
    }
  }, [items, isInitialized, boardId]);

  useEffect(() => {
    localStorage.setItem(boardKey("forelStatuses", boardId), JSON.stringify(statuses));
  }, [statuses, boardId]);

  useEffect(() => {
    localStorage.setItem(boardKey("forelGroupColors", boardId), JSON.stringify(groupColors));
  }, [groupColors, boardId]);

  // ✅ Persist groups whenever they change (single source of truth —
  // renameGroup/deleteGroup/addGroup only ever call setGroups now).
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(boardKey('board-groups', boardId), JSON.stringify(groups));
    }
  }, [groups, isInitialized, boardId]);

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

    setGroups(prev => prev.map(g => g === oldName ? newName.trim() : g));
  };

  const deleteGroup = (groupName) => {
    if (groups.length <= 1) {
      alert("Cannot delete the last group. At least one group must remain.");
      return;
    }
    if (!confirm(`Delete entire group "${groupName}" and all its items?`)) return;
    const newItems = items.filter((it) => it.group !== groupName);
    saveHistory(newItems);
    const newColors = { ...groupColors };
    delete newColors[groupName];
    setGroupColors(newColors);
    setHasAutoAdded(false);
    setGroups(prev => prev.filter(g => g !== groupName));
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
    setGroups(prev => [...prev, groupName]);

    console.log(`✅ Added new group "${groupName}" with 3 items`);
  };

  const updateGroupColor = (groupName, color) => {
    setGroupColors((prev) => ({ ...prev, [groupName]: color }));
  };

  const reorderGroups = (newOrder) => {
    if (!Array.isArray(newOrder) || newOrder.length === 0) return;
    setGroups(newOrder);
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

  const openFormulaEditor = (columnId) => {
    setActiveFormulaColumnId(columnId);
    setShowFormulaEditor(true);
  };

  const handleAddColumn = (name, type) => {
    addColumn(name, type);
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
      if (item.status && item.status.toLowerCase() === "done") count++;
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
  const doneItems = countDoneItems(filteredItems);
  const pendingItems = totalItems - doneItems;

  // ============================================================
  // 🔥 GROUPS DARI STATE, BUKAN DARI ITEMS
  // ============================================================
  const allGroups = groups;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <div className="main-content">
        <Header groups={allGroups || []} boardId={boardId} isReady={isInitialized} />

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
          onOpenFormula={openFormulaEditor}
          onRenameGroup={renameGroup}
          onReorderGroups={reorderGroups}
          onOpenAddColumn={() => setShowAddColumnPopup(true)}
        />

        <div className="board-footer">
          <div className="footer-stats">
            <span>Total: <strong>{totalItems}</strong> items</span>
            <span className="footer-divider">|</span>
            <span>Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong></span>
            <span className="footer-divider">|</span>
            <span>Pending: <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong></span>
          </div>
          <div className="footer-actions">
            <span className="footer-status">
              <span className="status-dot"></span>
              Auto-saved
            </span>
          </div>
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

      {showFormulaEditor && (
        <FormulaEditor
          column={columns.find((c) => c.id === activeFormulaColumnId)}
          columns={columns}
          sampleItem={filteredItems[0]}
          onSave={(formula) => updateColumnFormula(activeFormulaColumnId, formula)}
          onClose={() => setShowFormulaEditor(false)}
        />
      )}
    </>
  );
}

function EmptyWorkspaceState() {
  const { createBoard } = useBoards();

  const handleCreateBoard = () => {
    const name = prompt("New board name:");
    if (name && name.trim()) createBoard(name.trim(), null);
  };

  return (
    <div className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
        <p style={{ fontSize: "16px", marginBottom: "16px" }}>This workspace doesn't have any boards yet.</p>
        <button className="tree-add-btn" onClick={handleCreateBoard}>+ Create board</button>
      </div>
    </div>
  );
}

function AppShellInner() {
  const { activeBoardId } = useBoards();

  return (
    <div className="app-container">
      <Sidebar />

      {activeBoardId ? (
        <ColumnProvider key={activeBoardId} boardId={activeBoardId}>
          <UpdateProvider boardId={activeBoardId}>
            <BoardWorkspace boardId={activeBoardId} />
            <UpdatePanel />
          </UpdateProvider>
        </ColumnProvider>
      ) : (
        <EmptyWorkspaceState />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BoardsProvider>
        <AppShellInner />
      </BoardsProvider>
    </ThemeProvider>
  );
}
