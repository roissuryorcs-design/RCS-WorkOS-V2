import React, { useState, useRef, useEffect } from 'react';
import { useUpdates } from '../context/UpdateContext';

const UpdatePanel = () => {
  const { 
    isPanelOpen, 
    closePanel, 
    selectedItem, 
    getItemUpdates, 
    addUpdate,
    addReply 
  } = useUpdates();

  const [newUpdate, setNewUpdate] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const itemUpdates = selectedItem ? getItemUpdates(selectedItem) : [];

  // Close panel dengan ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [closePanel]);

  // Auto-focus input saat panel terbuka
  useEffect(() => {
    if (isPanelOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [isPanelOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newUpdate.trim()) {
      addUpdate(selectedItem, newUpdate.trim());
      setNewUpdate('');
    }
  };

  const handleReplySubmit = (updateId) => {
    if (replyText.trim()) {
      addReply(updateId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
    }
  };

  if (!isPanelOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closePanel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          maxWidth: '90vw',
          background: 'white',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              💬 Updates
            </h3>
            <span style={{ fontSize: '12px', color: '#999' }}>
              {itemUpdates.length} comments
            </span>
          </div>
          <button
            onClick={closePanel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Daftar Update */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
        }}>
          {itemUpdates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#999',
              padding: '40px 20px',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
              <p style={{ margin: 0 }}>No updates yet</p>
              <p style={{ fontSize: '13px', margin: '4px 0 0' }}>
                Share progress or mention a teammate
              </p>
            </div>
          ) : (
            itemUpdates.map(update => (
              <div key={update.id} style={{
                marginBottom: '16px',
                padding: '12px 16px',
                background: '#f8f9fa',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: '#333' }}>
                    {update.author}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#999' }}>
                    {new Date(update.timestamp).toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: '6px 0 8px', fontSize: '14px', color: '#333' }}>
                  {update.text}
                </p>
                
                {/* Reply button */}
                <button
                  onClick={() => setReplyingTo(replyingTo === update.id ? null : update.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8e8'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  ↳ Reply
                </button>

                {/* Replies */}
                {update.replies && update.replies.length > 0 && (
                  <div style={{ marginTop: '8px', paddingLeft: '16px', borderLeft: '2px solid #e5e7eb' }}>
                    {update.replies.map(reply => (
                      <div key={reply.id} style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: 'white',
                        borderRadius: '4px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '12px', color: '#333' }}>
                            {reply.author}
                          </strong>
                          <span style={{ fontSize: '10px', color: '#999' }}>
                            {new Date(reply.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#333' }}>
                          {reply.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {replyingTo === update.id && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleReplySubmit(update.id);
                        if (e.key === 'Escape') setReplyingTo(null);
                      }}
                      placeholder="Write a reply..."
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleReplySubmit(update.id)}
                      style={{
                        padding: '6px 16px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input baru */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          background: 'white',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef}
              type="text"
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              placeholder="Write an update and mention others with @"
              style={{
                flex: 1,
                padding: '8px 14px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
            />
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#43a047'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
            >
              Send
            </button>
          </form>
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#999' }}>
            💡 Press Enter to send
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default UpdatePanel;
