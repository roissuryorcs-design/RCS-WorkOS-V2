jsx
// src/data/treeData.jsx

export const INITIAL_DATA = [
  {
    id: "group-default-1",
    title: "Default Board Group",
    color: "#3b82f6", // Biru default seperti di UI Anda
    isDefault: true,   // Penanda agar tidak bisa dihapus
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
                    subItems: [] // Level terakhir
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

// Opsional: Kolom default jika Anda butuh referensi kolom
export const DEFAULT_COLUMNS = [
  { id: "item", title: "ITEM", width: 400 },
  { id: "no_document", title: "NO. DOCUMENT", width: 200 },
  { id: "files", title: "FILES", width: 100 },
  { id: "people", title: "PEOPLE", width: 150 },
  { id: "status", title: "STATUS", width: 140 },
  { id: "due_date", title: "DUE DATE", width: 140 },
  { id: "rev", title: "REV", width: 80 }
];
