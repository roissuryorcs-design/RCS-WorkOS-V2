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

  // ============================================================
  // 🔥 ADD UPDATE
  // ============================================================
  const addUpdate = (itemId, text, files = []) => {
    if (!text && files.length === 0) return;
    
    const newUpdate = {
      id: Date.now() + Math.random() * 1000,
      itemId,
      text: text || '',
      author: 'User',
      timestamp: new Date().toISOString(),
      files: files || [],
      replies: [],
    };
    setUpdates([...updates, newUpdate]);
  };

  // ============================================================
  // 🔥 ADD REPLY
  // ============================================================
  const addReply = (updateId, replyData) => {
    if (!replyData || (!replyData.text && !replyData.files)) return;
    
    const newReply = {
      id: Date.now() + Math.random() * 1000,
      text: replyData.text || '',
      files: replyData.files || [],
      author: 'User',
      timestamp: new Date().toISOString(),
    };
    
    setUpdates(updates.map(u => 
      u.id === updateId 
        ? { ...u, replies: [...u.replies, newReply] } 
        : u
    ));
  };

  // ============================================================
  // 🔥 EDIT UPDATE
  // ============================================================
  const editUpdate = (updateId, newText) => {
    if (!newText) return;
    
    setUpdates(updates.map(u => 
      u.id === updateId 
        ? { ...u, text: newText } 
        : u
    ));
  };

  // ============================================================
  // 🔥 DELETE UPDATE
  // ============================================================
  const deleteUpdate = (updateId) => {
    setUpdates(updates.filter(u => u.id !== updateId));
  };

  // ============================================================
  // 🔥 EDIT REPLY
  // ============================================================
  const editReply = (updateId, replyId, newText) => {
    if (!newText) return;
    
    setUpdates(updates.map(u => 
      u.id === updateId 
        ? { 
            ...u, 
            replies: u.replies.map(r => 
              r.id === replyId ? { ...r, text: newText } : r
            ) 
          } 
        : u
    ));
  };

  // ============================================================
  // 🔥 DELETE REPLY
  // ============================================================
  const deleteReply = (updateId, replyId) => {
    setUpdates(updates.map(u => 
      u.id === updateId 
        ? { ...u, replies: u.replies.filter(r => r.id !== replyId) } 
        : u
    ));
  };

  // ============================================================
  // 🔥 PANEL CONTROLS
  // ============================================================
  const openPanel = (itemId) => {
    setSelectedItem(itemId);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedItem(null);
  };

  const getItemUpdates = (itemId) => {
    return updates.filter(u => u.itemId === itemId);
  };

  const value = {
    updates,
    selectedItem,
    isPanelOpen,
    addUpdate,
    addReply,
    editUpdate,
    deleteUpdate,
    editReply,
    deleteReply,
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
