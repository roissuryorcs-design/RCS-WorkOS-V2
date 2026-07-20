// src/data/treeData.jsx

export const DEFAULT_GROUP = {
  id: 'group-default',
  title: 'Default',
  isDefault: true,
  isDeletable: true,
  color: '#4CAF50',
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
                  isExpanded: false,
                }
              ],
              isExpanded: false,
            }
          ],
          isExpanded: false,
        }
      ],
      isExpanded: false,
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

export const getDefaultItems = () => {
  return DEFAULT_GROUP.items.map(item => ({
    ...item,
    group: DEFAULT_GROUP.title,
  }));
};

// ============================================================
// FUNGSI UTAMA: Pastikan selalu ada 1 group
// ============================================================
export const ensureGroupExists = (groups) => {
  if (!groups || groups.length === 0) {
    return [DEFAULT_GROUP.title];
  }
  return groups;
};

export const deleteGroupSafe = (groups, groupName) => {
  const newGroups = groups.filter(g => g !== groupName);
  if (newGroups.length === 0) {
    return [DEFAULT_GROUP.title];
  }
  return newGroups;
};

export const addGroupSafe = (groups, title) => {
  if (title === DEFAULT_GROUP.title) return groups;
  if (groups.includes(title)) return groups;
  return [...groups, title];
};

export const saveGroups = (groups) => {
  localStorage.setItem('board-groups', JSON.stringify(groups));
};

export const loadGroups = () => {
  const saved = localStorage.getItem('board-groups');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return ensureGroupExists(parsed);
    } catch {
      return [DEFAULT_GROUP.title];
    }
  }
  return [DEFAULT_GROUP.title];
};

export const saveItems = (items) => {
  localStorage.setItem('forelItems', JSON.stringify(items));
};

export const loadItems = () => {
  const saved = localStorage.getItem('forelItems');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.length === 0) {
        return getDefaultItems();
      }
      return parsed;
    } catch {
      return getDefaultItems();
    }
  }
  return getDefaultItems();
};
