// src/data/treeData.jsx

export const INITIAL_DATA = [
  {
    id: "group-default-1",
    title: "Default Board Group",
    color: "#3b82f6",
    isDefault: true,
    isDeletable: false,  // Tambahkan ini
    items: [
      {
        id: "lvl1-item-1",
        name: "Level 1: Project Phase",
        no_document: "DOC-001",
        status: "Working on it",
        rev: "A",
        subItems: [
          {
            id: "lvl2-item-1",
            name: "Level 2: Task Group",
            no_document: "DOC-001-A",
            status: "Stuck",
            rev: "0",
            subItems: [
              {
                id: "lvl3-item-1",
                name: "Level 3: Specific Task",
                no_document: "DOC-001-A-1",
                status: "Done",
                rev: "1",
                subItems: [
                  {
                    id: "lvl4-item-1",
                    name: "Level 4: Detail Action",
                    no_document: "DOC-001-A-1-a",
                    status: "Working on it",
                    rev: "0",
                    subItems: []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const DEFAULT_COLUMNS = [
  { id: "item", title: "ITEM", width: 400 },
  { id: "no_document", title: "NO. DOCUMENT", width: 200 },
  { id: "files", title: "FILES", width: 100 },
  { id: "people", title: "PEOPLE", width: 150 },
  { id: "status", title: "STATUS", width: 140 },
  { id: "due_date", title: "DUE DATE", width: 140 },
  { id: "rev", title: "REV", width: 80 }
];

// ========== TAMBAHKAN INI DI BAWAH ==========

// Data default untuk 4 level (standalone)
export const DEFAULT_GROUPS = [
  {
    id: 'group-level-1',
    title: 'Level 1',
    isDefault: true,
    isDeletable: false,
    color: '#4CAF50',
    items: [
      { id: 'item-1-1', name: 'Contoh Item Level 1', no_document: 'DOC-001', people: ['John Doe'], status: 'On Track', due_date: '2026-07-25', rev: 'A', subItems: [] },
      { id: 'item-1-2', name: 'Contoh Item Level 1 - 2', no_document: 'DOC-002', people: ['Jane Smith'], status: 'At Risk', due_date: '2026-07-28', rev: 'B', subItems: [] },
    ]
  },
  {
    id: 'group-level-2',
    title: 'Level 2',
    isDefault: true,
    isDeletable: false,
    color: '#2196F3',
    items: [
      { id: 'item-2-1', name: 'Contoh Item Level 2', no_document: 'DOC-003', people: ['Mike Johnson'], status: 'Pending', due_date: '2026-08-01', rev: 'C', subItems: [] },
    ]
  },
  {
    id: 'group-level-3',
    title: 'Level 3',
    isDefault: true,
    isDeletable: false,
    color: '#FF9800',
    items: [
      { id: 'item-3-1', name: 'Contoh Item Level 3', no_document: 'DOC-004', people: ['Sarah Wilson'], status: 'Blocked', due_date: '2026-08-05', rev: 'D', subItems: [] },
    ]
  },
  {
    id: 'group-level-4',
    title: 'Level 4',
    isDefault: true,
    isDeletable: false,
    color: '#9C27B0',
    items: [
      { id: 'item-4-1', name: 'Contoh Item Level 4', no_document: 'DOC-005', people: ['Robert Brown'], status: 'Completed', due_date: '2026-08-10', rev: 'E', subItems: [] },
    ]
  }
];

// Fungsi untuk memastikan default groups selalu ada
export const ensureDefaultGroups = (groups) => {
  if (!groups || groups.length === 0) {
    return DEFAULT_GROUPS.map(g => ({ ...g, items: g.items.map(item => ({ ...item, subItems: [] })) }));
  }

  const defaultGroupIds = DEFAULT_GROUPS.map(g => g.id);
  const existingDefaultIds = groups
    .filter(g => g.isDefault)
    .map(g => g.id);

  const missingDefaultIds = defaultGroupIds.filter(
    id => !existingDefaultIds.includes(id)
  );

  if (missingDefaultIds.length === 0) {
    return groups;
  }

  const missingGroups = DEFAULT_GROUPS.filter(g => 
    missingDefaultIds.includes(g.id)
  ).map(g => ({ ...g, items: g.items.map(item => ({ ...item, subItems: [] })) }));

  return [...groups, ...missingGroups];
};

// Fungsi untuk hapus group dengan proteksi
export const deleteGroupSafe = (groups, groupId) => {
  const groupToDelete = groups.find(g => g.id === groupId);

  if (!groupToDelete || !groupToDelete.isDeletable) {
    console.warn('⚠️ Group default tidak bisa dihapus!');
    return groups;
  }

  const newGroups = groups.filter(g => g.id !== groupId);

  if (newGroups.length === 0) {
    return DEFAULT_GROUPS.map(g => ({ ...g, items: g.items.map(item => ({ ...item, subItems: [] })) }));
  }

  const hasDefault = newGroups.some(g => g.isDefault);
  if (!hasDefault) {
    return [...DEFAULT_GROUPS.map(g => ({ ...g, items: g.items.map(item => ({ ...item, subItems: [] })) })), ...newGroups];
  }

  return newGroups;
};

// Fungsi untuk tambah group baru
export const addGroupSafe = (groups, title, color = '#757575') => {
  const newGroup = {
    id: `group-${Date.now()}`,
    title: title,
    isDefault: false,
    isDeletable: true,
    color: color,
    items: []
  };

  return [...groups, newGroup];
};

// Simpan ke localStorage
export const saveGroups = (groups) => {
  localStorage.setItem('board-groups', JSON.stringify(groups));
};

// Load dari localStorage
export const loadGroups = () => {
  const saved = localStorage.getItem('board-groups');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return ensureDefaultGroups(parsed);
    } catch {
      return DEFAULT_GROUPS.map(g => ({ ...g, items: g.items.map(item => ({ ...item, subItems: [] })) }));
    }
  }
  return DEFAULT_GROUPS.map(g => ({ ...g, items: g.items.map(item => ({ ...item, subItems: [] })) }));
};
