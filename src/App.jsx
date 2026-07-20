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
import { 
  DEFAULT_GROUPS, 
  loadGroups, 
  saveGroups, 
  ensureDefaultGroups,
  deleteGroupSafe,
  addGroupSafe 
} from "./data/treeData";
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
  
  // ============================================================
  // STATE UNTUK DEFAULT GROUPS META DATA
  // ============================================================
  const [groupMeta, setGroupMeta] = useState(() => {
    const meta = {};
    const loaded = loadGroups();
    loaded.forEach(g => {
      meta[g.title] = {
        id: g.id,
        isDefault: g.isDefault || false,
        isDeletable: g.isDeletable !== undefined ? g.isDeletable : true,
        color: g.color || '#3b82f6',
      };
    });
    return meta;
  });

  const { columns, addColumn, renameColumn, toggleColumn, deleteColumn, resetColumns, updateColumnStatuses, updateColumnStatusOrder } = useColumns();

  // ============================================================
  // FUNGSI UNTUK MENDAPATKAN DEFAULT ITEMS DARI DEFAULT_GROUPS
  // ============================================================
  const getDefaultItems = () => {
    const defaultItems = [];
    DEFAULT_GROUPS.forEach(group => {
      group.items.forEach(item => {
        defaultItems.push({
          id: item.id,
          group: group.title,
          item: item.name,
          document: item.no_document || "NO. DO",
          people: item.people ? item.people.join(", ") : "",
          status: item.status || "Default",
          dueDate: item.due_date || "dd/mm/ttt",
          rev: item.rev || "R0",
          children: [],
          isExpanded: false,
          isDefault: true, // Tanda bahwa ini item default
        });
      });
    });
    return defaultItems;
  };

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    const savedItems = localStorage.getItem("forelItems");
    const savedStatuses = localStorage.getItem("forelStatuses");
    const savedFavs = localStorage.getItem("forelFavorites");
    const savedGroupColors = localStorage.getItem("forelGroupColors");
    const savedGroupMeta = localStorage.getItem("forelGroupMeta");

    const defaultStatuses = { Default: "#9ca3af" };

    // Load statuses
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

    // Load group meta
    if (savedGroupMeta) {
      try {
        const parsed = JSON.parse(savedGroupMeta);
        setGroupMeta(parsed);
      } catch {
        // use default
      }
    }

    // Load items
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
      
      // Pastikan default items ada
      const defaultItems = getDefaultItems();
      const defaultItemIds = defaultItems.map(item => item.id);
      const existingDefaultIds = parsedItems
        .filter(item => item.isDefault)
        .map(item => item.id);
      
      // Tambahkan default items yang hilang
      const missingDefaultItems = defaultItems.filter(
        item => !existingDefaultIds.includes(item.id)
      );
      
      const mergedItems = [...parsedItems, ...missingDefaultItems];
      setItems(ensureChildren(mergedItems));
    } else {
      // Load default items
      setItems(getDefaultItems());
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
  }, []);

  // ============================================================
  // AUTO SAVE
  // ============================================================
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
    localStorage.setItem("forelGroupMeta", JSON.stringify(groupMeta));
  }, [groupMeta]);

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
        const updatedChildren = updateItemRecursive(it.children, id, field, value);
        return { ...it, children: updatedChildren };
      }
      return it;
    });
  };

  const updateItem = (id, field, value) => {
    // Cek apakah item adalah default
    const item = findItemById(items, id);
    if (item && item.isDefault) {
      // Hanya izinkan update field tertentu (bukan delete)
      if (field === 'item' || field === 'status' || field === 'dueDate' || field === 'people' || field === 'document' || field === 'rev') {
        const newItems = updateItemRecursive(items, id, field, value);
        saveHistory(newItems);
      } else {
        console.warn('⚠️ Cannot update default item field:', field);
      }
      return;
    }
    const newItems = updateItemRecursive(items, id, field, value);
    saveHistory(newItems);
  };

  // ============================================================
  // DELETE ITEM - RECURSIVE (dengan proteksi default)
  // ============================================================
  const deleteItemRecursive = (items, id) => {
    return items
      .filter((it) => {
        // Cek apakah item adalah default
        if (it.id === id && it.isDefault) {
          alert('⚠️ Item default tidak bisa dihapus!');
          return true; // Jangan hapus
        }
        return it.id !== id;
      })
      .map((it) => {
        if (it.children && it.children.length > 0) {
          return { ...it, children: deleteItemRecursive(it.children, id) };
        }
        return it;
      });
  };

  const deleteItem = (id) => {
    const item = findItemById(items, id);
    if (item && item.isDefault) {
      alert('⚠️ Item default tidak bisa dihapus!');
      return;
    }
    if (!confirm("Delete this item?")) return;
    if (item && item.children && item.children.length > 0) {
      if (!confirm(`Item "${item.item}" has ${item.children.length} sub item(s). Delete all?`)) return;
    }
    const newItems = deleteItemRecursive(items, id);
    saveHistory(newItems);
  };

  // ============================================================
  // ADD SUB ITEM (dengan batasan level)
  // ============================================================
  const addSubItem = (parentId, newTitle = null) => {
    const parent = findItemById(items, parentId);
    if (!parent) {
      console.warn('Parent not found for id:', parentId);
      return;
    }

    // Cek apakah parent adalah default
    if (parent.isDefault) {
      alert('⚠️ Tidak bisa menambah sub item ke item default!');
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
      alert('⚠️ Maximum 4 levels reached!');
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
      isDefault: false, // Sub item dari default tidak otomatis default
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
  // ADD ITEM (di group) - dengan proteksi default group
  // ============================================================
  const addItem = (groupName) => {
    // Cek apakah group adalah default
    const meta = groupMeta[groupName];
    if (meta && meta.isDefault) {
      alert('⚠️ Tidak bisa menambah item ke group default!');
      return;
    }

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
      isDefault: false,
    };
    saveHistory([...items, newItem]);
  };

  // ============================================================
  // GROUP CRUD (dengan proteksi default)
  // ============================================================

  const renameGroup = (oldName, newName) => {
    // Cek apakah group adalah default
    const meta = groupMeta[oldName];
    if (meta && meta.isDefault) {
      alert('⚠️ Group default tidak bisa diubah namanya!');
      return;
    }

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

    // Update groupMeta
    const newMeta = { ...groupMeta };
    if (newMeta[oldName]) {
      newMeta[newName.trim()] = { ...newMeta[oldName] };
      delete newMeta[oldName];
      setGroupMeta(newMeta);
    }
  };

  const deleteGroup = (groupName) => {
    // Cek apakah group adalah default
    const meta = groupMeta[groupName];
    if (meta && meta.isDefault) {
      alert('⚠️ Group default tidak bisa dihapus!');
      return;
    }

    if (!confirm(`Delete entire group "${groupName}" and all its items?`)) return;
    const newItems = items.filter((it) => it.group !== groupName);
    saveHistory(newItems);
    const newColors = { ...groupColors };
    delete newColors[groupName];
    setGroupColors(newColors);
    const newMeta = { ...groupMeta };
    delete newMeta[groupName];
    setGroupMeta(newMeta);

    // Jika tidak ada group tersisa, restore default
    const remainingGroups = [...new Set(newItems.map(item => item.group))];
    if (remainingGroups.length === 0) {
      restoreDefaultGroups();
    }
  };

  // ============================================================
  // RESTORE DEFAULT GROUPS
  // ============================================================
  const restoreDefaultGroups = () => {
    const defaultItems = getDefaultItems();
    const newMeta = { ...groupMeta };
    DEFAULT_GROUPS.forEach(g => {
      newMeta[g.title] = {
        id: g.id,
        isDefault: true,
        isDeletable: false,
        color: g.color || '#3b82f6',
      };
    });
    setGroupMeta(newMeta);
    setItems(defaultItems);
    // Update group colors
    const defaultColors = {};
    DEFAULT_GROUPS.forEach(g => {
      defaultColors[g.title] = g.color || '#3b82f6';
    });
    setGroupColors(prev => ({ ...prev, ...defaultColors }));
  };

  const addGroup = () => {
    const name = prompt("Enter new group name:");
    if (!name || !name.trim()) return;
    
    // Cek apakah nama sama dengan default group
    const defaultGroupNames = DEFAULT_GROUPS.map(g => g.title);
    if (defaultGroupNames.includes(name.trim())) {
      alert(`"${name.trim()}" adalah nama group default!`);
      return;
    }
    
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
      isDefault: false,
    };
    saveHistory([...items, newItem]);
    setGroupColors((prev) => ({ ...prev, [name.trim()]: "#3b82f6" }));
    setGroupMeta(prev => ({
      ...prev,
      [name.trim()]: {
        id: `group-${Date.now()}`,
        isDefault: false,
        isDeletable: true,
        color: '#3b82f6',
      }
    }));
  };

  const updateGroupColor = (groupName, color) => {
    setGroupColors((prev) => ({ ...prev, [groupName]: color }));
    setGroupMeta(prev => ({
      ...prev,
      [groupName]: { ...prev[groupName], color: color }
    }));
  };

  // ============================================================
  // GET ALL GROUPS (termasuk default)
  // ============================================================
  const getAllGroups = () => {
    const allGroupNames = [...new Set(items.map((item) => item.group))];
    // Pastikan default groups selalu ada
    const defaultGroupNames = DEFAULT_GROUPS.map(g => g.title);
    const missingDefaults = defaultGroupNames.filter(
      name => !allGroupNames.includes(name)
    );
    return [...allGroupNames, ...missingDefaults];
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
    const dataStr = JSON.stringify({ items, statuses, groupColors, groupMeta }, null, 2);
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
  const allGroups = getAllGroups();

  // ============================================================
  // CEK APAKAH DEFAULT GROUPS ADA
  // ============================================================
  const hasDefaultGroups = allGroups.some(
    group => groupMeta[group]?.isDefault
  );

  return (
    <div className="app-container">
      <Sidebar
        favorites={favorites}
        onAddFavorite={addFavorite}
        onRemoveFavorite={removeFavorite}
      />

      <div className="main-content">
        <Header title="FOREL FPSO HVAC" subtitle="Engineering" />

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
          groupMeta={groupMeta}
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
          <div>
            {hasDefaultGroups && (
              <span style={{ color: "#4CAF50", fontSize: "12px" }}>
                ⭐ Default groups active
              </span>
            )}
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
