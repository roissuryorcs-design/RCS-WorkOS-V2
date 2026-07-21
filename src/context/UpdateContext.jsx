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
  // ADD UPDATE
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
  // ADD REPLY (Bisa reply ke update atau reply ke reply)
  // ============================================================
  const addReply = (updateId, replyData, parentReplyId = null) => {
    if (!replyData || (!replyData.text && !replyData.files)) return;
    
    const newReply = {
      id: Date.now() + Math.random() * 1000,
      text: replyData.text || '',
      files: replyData.files || [],
      author: 'User',
      timestamp: new Date().toISOString(),
      replies: [], // Untuk nested reply
      parentReplyId: parentReplyId,
    };
    
    setUpdates(updates.map(u => {
      if (u.id === updateId) {
        // Cari reply berdasarkan parentReplyId
        if (parentReplyId) {
          const addNestedReply = (replies) => {
            return replies.map(r => {
              if (r.id === parentReplyId) {
                return { ...r, replies: [...r.replies, newReply] };
              }
              if (r.replies && r.replies.length > 0) {
                return { ...r, replies: addNestedReply(r.replies) };
              }
              return r;
            });
          };
          return { ...u, replies: addNestedReply(u.replies) };
        }
        return { ...u, replies: [...u.replies, newReply] };
      }
      return u;
    }));
  };

  // ============================================================
  // EDIT UPDATE
  // ============================================================
  const editUpdate = (updateId, newText) => {
    if (!newText) return;
    setUpdates(updates.map(u => 
      u.id === updateId ? { ...u, text: newText } : u
    ));
  };

  // ============================================================
  // DELETE UPDATE
  // ============================================================
  const deleteUpdate = (updateId) => {
    setUpdates(updates.filter(u => u.id !== updateId));
  };

  // ============================================================
  // EDIT REPLY (Support nested)
  // ============================================================
  const editReply = (updateId, replyId, newText) => {
    if (!newText) return;
    
    const editNestedReply = (replies) => {
      return replies.map(r => {
        if (r.id === replyId) {
          return { ...r, text: newText };
        }
        if (r.replies && r.replies.length > 0) {
          return { ...r, replies: editNestedReply(r.replies) };
        }
        return r;
      });
    };
    
    setUpdates(updates.map(u => {
      if (u.id === updateId) {
        return { ...u, replies: editNestedReply(u.replies) };
      }
      return u;
    }));
  };

  // ============================================================
  // DELETE REPLY (Support nested)
  // ============================================================
  const deleteReply = (updateId, replyId) => {
    const deleteNestedReply = (replies) => {
      return replies
        .filter(r => r.id !== replyId)
        .map(r => {
          if (r.replies && r.replies.length > 0) {
            return { ...r, replies: deleteNestedReply(r.replies) };
          }
          return r;
        });
    };
    
    setUpdates(updates.map(u => {
      if (u.id === updateId) {
        return { ...u, replies: deleteNestedReply(u.replies) };
      }
      return u;
    }));
  };

  // ============================================================
  // PANEL CONTROLS
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
