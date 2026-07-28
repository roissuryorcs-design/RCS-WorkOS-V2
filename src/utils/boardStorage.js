export function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function boardKey(base, boardId) {
  return boardId ? `${base}::${boardId}` : base;
}
