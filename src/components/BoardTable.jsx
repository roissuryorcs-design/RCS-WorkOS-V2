import { useState, useRef, useEffect } from "react";
import Row from "./Row";
import ResizableHeader from "./ResizableHeader";
import { useColumns } from "../context/ColumnContext";
import { 
  DEFAULT_GROUP,
  loadGroups, 
  saveGroups, 
  deleteGroupSafe, 
  addGroupSafe,
  ensureGroupExists,
  getDefaultItems
} from "../data/treeData";

export default function BoardTable({
  items,
  groups: externalGroups,
  groupColors: externalGroupColors,
  onUpdateGroupColor: externalOnUpdateGroupColor,
  onUpdateItem,
  onDeleteItem,
  onAddGroup: externalOnAddGroup,
  onDeleteGroup: externalOnDeleteGroup,
  onAddItem,
  onAddSubItem,
  onOpenStatusManager,
  onRenameGroup: externalOnRenameGroup,
  onOpenAddColumn,
  defaultGroupName = DEFAULT_GROUP.title,
}) {
  const {
    updateColumnWidth,
    renameColumn,
    toggleColumn,
    deleteColumn,
    reorderColumns,
    visibleColumns,
  } = useColumns();

  const [groups, setGroups] = useState(() => {
    if (externalGroups && externalGroups.length > 0) {
      return externalGroups;
    }
    return loadGroups();
  });

  const [groupColors, setGroupColors] = useState(() => {
    if (externalGroupColors && Object.keys(externalGroupColors).length > 0) {
      return externalGroupColors;
    }
    const defaultColors = {};
    const loaded = loadGroups();
    loaded.forEach(g => {
      if (g === DEFAULT_GROUP.title) {
        defaultColors[g] = DEFAULT_GROUP.color || '#4CAF50';
      } else {
        defaultColors[g] = '#3b82f6';
      }
    });
    return defaultColors;
  });

  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  useEffect(() => {
    if (externalGroups && externalGroups.length > 0) {
      setGroups(externalGroups);
    }
  }, [externalGroups]);

  useEffect(() => {
    if (externalGroupColors && Object.keys(externalGroupColors).length > 0) {
      setGroupColors(externalGroupColors);
    }
  }, [externalGroupColors]);

  const [collapsed, setCollapsed] = useState({});
  const [popupGroup, setPopupGroup] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleCollapse = (groupName) => {
    setCollapsed((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const closePopup = () => setPopupGroup(null);

  // ============================================================
  // RENAME GROUP: Default BOLEH diubah tapi ditolak oleh parent
  // ============================================================
  const handleRenameGroup = (oldName, newName) => {
    // Serahkan ke parent (App.jsx) untuk validasi
    if (externalOnRenameGroup) {
      externalOnRenameGroup(oldName, newName);
    }
    
    setGroups(prev => prev.map(g => g === oldName ? newName : g));
    setGroupColors(prev => {
      const newColors = { ...prev };
      newColors[newName] = prev[oldName];
      delete newColors[oldName];
      return newColors;
    });
  };

  // ============================================================
  // DELETE GROUP: Default BOLEH dihapus!
  // Parent (App.jsx) akan restore jika semua group hilang
  // ============================================================
  const handleDeleteGroup = (groupName) => {
    // Serahkan ke parent (App.jsx) untuk handle delete & auto-restore
    if (externalOnDeleteGroup) {
      externalOnDeleteGroup(groupName);
    }
    
    setGroups(prev => prev.filter(g => g !== groupName));
    setGroupColors(prev => {
      const newColors = { ...prev };
      delete newColors[groupName];
      return newColors;
    });
  };

  // ============================================================
  // ADD GROUP
  // ============================================================
  const handleAddGroup = () => {
    const newTitle = prompt("Masukkan nama group baru:");
    if (!newTitle || !newTitle.trim()) return;
    
    if (newTitle.trim() === defaultGroupName) {
      alert(`"${defaultGroupName}" adalah nama group default!`);
      return;
    }
    
    if (groups.includes(newTitle.trim())) {
      alert(`Group "${newTitle.trim()}" sudah ada!`);
      return;
    }

    if (externalOnAddGroup) {
      externalOnAddGroup(newTitle.trim());
    }

    setGroups(prev => [...prev, newTitle.trim()]);
    setGroupColors(prev => ({ ...prev, [newTitle.trim()]: '#757575' }));
  };

  // ============================================================
  // UPDATE GROUP COLOR
  // ============================================================
  const handleUpdateGroupColor = (groupName, color) => {
    if (externalOnUpdateGroupColor) {
      externalOnUpdateGroupColor(groupName, color);
    }
    setGroupColors(prev => ({ ...prev, [groupName]: color }));
  };

  // ============================================================
  // ADD ITEM: Default group TIDAK BISA ditambah item
  // ============================================================
  const handleAddItem = (groupName) => {
    if (groupName === defaultGroupName) {
      alert('⚠️ Tidak bisa menambah item ke group default!');
      return;
    }
    if (onAddItem) {
      onAddItem(groupName);
    }
  };

  const grouped = groups.reduce((acc, group) => {
    acc[group] = items.filter((item) => item.group === group);
    return acc;
  }, {});

  const safeColumns = (() => {
    const hasItem = visibleColumns.some((col) => col.id === "item");
    if (hasItem) return visibleColumns;
    return [
      { id: "item", label: "ITEM", type: "text", width: 250, visible: true },
      ...visibleColumns,
    ];
  })();

  const toggleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    if (confirm(`Delete ${selectedItems.length} selected item(s)?`)) {
      selectedItems.forEach((id) => onDeleteItem(id));
      setSelectedItems([]);
    }
  };

  const selectAllInGroup = (groupId, tasks) => {
    const allIds = tasks.map((item) => item.id);
    const allSelected = allIds.every((id) => selectedItems.includes(id));
    if (allSelected) {
      setSelectedItems((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      const newIds = allIds.filter((id) => !selectedItems.includes(id));
      setSelectedItems((prev) => [...prev, ...newIds]);
    }
  };

  const handleAddSubItem = (parentId) => {
    if (!onAddSubItem) return;
    
    const findParent = (items, id) => {
      for (const item of items) {
        if (item.id === id) return item
