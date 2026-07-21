import React, { createContext, useContext, useState, useEffect } from 'react';

const UpdateContext = createContext();

export const useUpdates = () => useContext(UpdateContext);

export const UpdateProvider = ({ children }) => {
  const [updates, setUpdates] = useState(() => {
    const saved = localStorage.getItem('forelUpdates');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('forelUpdates', JSON.stringify(updates));
  }, [updates]);

  // Tambah update baru
  const addUpdate = (itemId, text, author = 'User') => {
    const newUpdate = {
      id: Date.now(),
      itemId,
      text,
      author,
      timestamp: new Date().toISOString(),
      replies: [],
    };
    setUpdates([...updates, newUpdate]);
  };

  // Tambah reply ke update
  const addReply = (updateId, text, author = 'User') => {
    const newReply = {
      id: Date.now(),
      text,
      author,
      timestamp: new Date().toISOString(),
    };
    setUpdates(updates.map(u => 
      u.id === updateId ? { ...u, replies: [...u.replies, newReply] } : u
    ));
  };

  // Buka panel untuk item tertentu
  const openPanel = (itemId) => {
    setSelectedItem(itemId);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedItem(null);
  };

  // Get updates untuk item tertentu
  const getItemUpdates = (itemId) => {
    return updates.filter(u => u.itemId === itemId);
  };

  const value = {
    updates,
    selectedItem,
    isPanelOpen,
    addUpdate,
    addReply,
    openPanel,
    closePanel,
    getItemUpdates,
  };

  return (
    <UpdateContext.Provider value={value}>
      {children}
    </UpdateContext.Provider>
  );
};
