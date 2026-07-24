// ============================================================
// DEFAULT DATA - TIDAK DIUBAH, TETAP SEBAGAI REFERENSI
// ============================================================
export const DEFAULT_GROUP = {
  id: 'group-default',
  title: 'Default Group',
  isDefault: true,
  isDeletable: true,
  items: [
    {
      id: 'default-item-1',
      item: 'Level 1: Project Phase',
      document: 'DOC-001',
      people: '',
      status: 'Default',
      dueDate: '',
      rev: 'R0',
      isDefault: true,
      children: [
        {
          id: 'default-item-2',
          item: 'Level 2: Task Group',
          document: 'DOC-001-A',
          people: '',
          status: 'Default',
          dueDate: '',
          rev: 'R0',
          isDefault: true,
          children: [
            {
              id: 'default-item-3',
              item: 'Level 3: Specific Task',
              document: 'DOC-001-A-1',
              people: '',
              status: 'Default',
              dueDate: '',
              rev: 'R0',
              isDefault: true,
              children: [
                {
                  id: 'default-item-4',
                  item: 'Level 4: Detail Action',
                  document: 'DOC-001-A-1-a',
                  people: '',
                  status: 'Default',
                  dueDate: '',
                  rev: 'R0',
                  isDefault: true,
                  children: [],
                  isExpanded: false
                }
              ],
              isExpanded: false
            }
          ],
          isExpanded: false
        }
      ],
      isExpanded: false
    }
  ]
};

export const DEFAULT_COLUMNS = [
  { id: "item", title: "ITEM", width: 400 },
  { id: "no_document", title: "NO. DOCUMENT", width: 200 },
  { id: "files", title: "FILES", width: 100 },
  { id: "people", title: "PEOPLE", width: 150 },
  { id: "status", title: "STATUS", width: 140 },
  { id: "due_date", title: "DUE DATE", width: 140 },
  { id: "rev", title: "REV", width: 80 }
];

// ============================================================
// FLATTEN ITEMS (untuk board)
// ============================================================
const flattenItems = (items, parentId = null) => {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  let result = [];
  items.forEach(item => {
    if (!item) return;

    result.push({
      ...item,
      parentId: parentId,
      group: DEFAULT_GROUP.title
    });
    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
      result = result.concat(flattenItems(item.children, item.id));
    }
  });
  return result;
};

export const getDefaultItems = () => {
  return flattenItems(DEFAULT_GROUP.items);
};

// ============================================================
// FUNGSI UTAMA UNTUK GROUP
// ============================================================
export const ensureGroupExists = (groups) => {
  if (!groups || !Array.isArray(groups) || groups.length === 0) {
    return [DEFAULT_GROUP.title];
  }
  return groups;
};

export const deleteGroupSafe = (groups, groupName) => {
  if (!groups || !Array.isArray(groups)) {
    return [DEFAULT_GROUP.title];
  }

  const newGroups = groups.filter(g => g !== groupName);
  if (newGroups.length === 0) {
    return [DEFAULT_GROUP.title];
  }
  return newGroups;
};

export const addGroupSafe = (groups, title) => {
  if (!groups || !Array.isArray(groups)) {
    return [title || DEFAULT_GROUP.title];
  }
  if (title === DEFAULT_GROUP.title) return groups;
  if (groups.includes(title)) return groups;
  return [...groups, title];
};

// ============================================================
// FUNGSI UNTUK CEK APAKAH DEFAULT GROUP AKTIF
// ============================================================
export const isDefaultGroupActive = (groups) => {
  return groups && Array.isArray(groups) && groups.includes(DEFAULT_GROUP.title);
};

// ============================================================
// FUNGSI UNTUK MEMASTIKAN DEFAULT ITEMS ADA
// ============================================================
export const ensureDefaultItems = (items, groups) => {
  if (!items || !Array.isArray(items)) {
    return getDefaultItems();
  }

  if (!isDefaultGroupActive(groups)) return items;

  const defaultItems = items.filter(item => item && item.group === DEFAULT_GROUP.title);
  if (defaultItems.length === 0) {
    return [...items, ...getDefaultItems()];
  }
  return items;
};

// ============================================================
// LOCAL STORAGE
// ============================================================
export const saveGroups = (groups) => {
  if (!groups || !Array.isArray(groups)) {
    return;
  }
  try {
    localStorage.setItem('board-groups', JSON.stringify(groups));
  } catch (e) {
    console.error('Error saving groups to localStorage:', e);
  }
};

export const loadGroups = () => {
  try {
    const saved = localStorage.getItem('board-groups');
    if (saved) {
      const parsed = JSON.parse(saved);
      return ensureGroupExists(parsed);
    }
  } catch (e) {
    console.error('Error loading groups from localStorage:', e);
  }
  return [DEFAULT_GROUP.title];
};

export const saveItems = (items) => {
  if (!items || !Array.isArray(items)) {
    return;
  }
  try {
    localStorage.setItem('forelItems', JSON.stringify(items));
  } catch (e) {
    console.error('Error saving items to localStorage:', e);
  }
};

export const loadItems = () => {
  try {
    const saved = localStorage.getItem('forelItems');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading items from localStorage:', e);
  }
  return getDefaultItems();
};