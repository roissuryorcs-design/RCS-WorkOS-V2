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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [editText, setEditText] = useState('');
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const topRef = useRef(null);

  const itemUpdates = selectedItem ? getItemUpdates(selectedItem) : [];
  const sortedUpdates = [...itemUpdates].reverse();

  // Scroll ke atas saat update baru
  useEffect(() => {
    if (topRef.current && itemUpdates.length > 0) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [itemUpdates]);

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

  // ============================================================
  // HANDLE MENTION
  // ============================================================
  const handleMention = (e) => {
    setNewUpdate(e.target.value);
  };

  // ============================================================
  // HANDLE UPLOAD FILE
  // ============================================================
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      file: file,
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
  };

  // ============================================================
  // HANDLE SUBMIT UPDATE
  // ============================================================
  const handleSubmit = (e) => {
    e.preventDefault();
    const text = newUpdate.trim();
    if (text || uploadedFiles.length > 0) {
      addUpdate(selectedItem, text, uploadedFiles);
      setNewUpdate('');
      setUploadedFiles([]);
    }
  };

  // ============================================================
  // HANDLE REPLY SUBMIT
  // ============================================================
  const handleReplySubmit = (updateId) => {
    if (replyText.trim()) {
      addReply(updateId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
    }
  };

  // ============================================================
  // HANDLE EDIT UPDATE
  // ============================================================
  const startEdit = (update) => {
    setEditingUpdateId(update.id);
    setEditText(update.text);
  };

  const saveEdit = (updateId) => {
    // Update logic di context
    // Untuk sekarang, kita simpan di localStorage
    const updates = JSON.parse(localStorage.getItem('forelUpdates') || '[]');
    const updated = updates.map(u => {
      if (u.id === updateId) {
        return { ...u, text: editText };
      }
      return u;
    });
    localStorage.setItem('forelUpdates', JSON.stringify(updated));
    setEditingUpdateId(null);
    setEditText('');
    // Refresh
    window.dispatchEvent(new Event('storage'));
  };

  // ============================================================
  // HANDLE DELETE UPDATE
  // ============================================================
  const deleteUpdate = (updateId) => {
    if (confirm('Delete this update?')) {
      const updates = JSON.parse(localStorage.getItem('forelUpdates') || '[]');
      const filtered = updates.filter(u => u.id !== updateId);
      localStorage.setItem('forelUpdates', JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
    }
  };

  // ============================================================
  // RENDER TEXT WITH MENTION
  // ============================================================
  const renderTextWithMentions = (text) => {
    if (!text) return <span style={{ color: '#999', fontStyle: 'italic' }}>Empty update</span>;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} style={{
            color: '#1a73e8',
            background: '#e8f0fe',
            padding: '0 4px',
            borderRadius: '4px',
            fontWeight: 500,
          }}>
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // ============================================================
  // FORMAT FILE SIZE
  // ============================================================
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
          width: '460px',
          maxWidth: '92vw',
          background: 'white',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* ============================================================
            HEADER
            ============================================================ */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa',
          flexShrink: 0,
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

        {/* ============================================================
            UPDATE LIST - Terbaru di ATAS
            ============================================================ */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
        }}>
          <div ref={topRef} />

          {sortedUpdates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#999',
              padding: '60px 20px',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '16px' }}>No updates yet</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0' }}>
                Share progress or mention a teammate
              </p>
            </div>
          ) : (
            sortedUpdates.map((update) => {
              const isEditing = editingUpdateId === update.id;
              return (
                <div key={update.id} style={{
                  marginBottom: '20px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  {/* Update */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '3px solid #4CAF50',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <strong style={{ fontSize: '13px', color: '#333' }}>
                        {update.author || 'User'}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#999' }}>
                        {formatDate(update.timestamp)}
                      </span>
                    </div>

                    {/* Edit mode */}
                    {isEditing ? (
                      <div style={{ marginTop: '6px' }}>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #4CAF50',
                            borderRadius: '4px',
                            fontSize: '13px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            minHeight: '60px',
                          }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.shiftKey) {
                              e.preventDefault();
                              saveEdit(update.id);
                            }
                            if (e.key === 'Escape') {
                              setEditingUpdateId(null);
                            }
                          }}
                        />
                        <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => saveEdit(update.id)}
                            style={{
                              padding: '4px 16px',
                              background: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUpdateId(null)}
                            style={{
                              padding: '4px 16px',
                              background: '#e5e7eb',
                              color: '#333',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: '6px 0 8px', fontSize: '14px', color: '#333', wordWrap: 'break-word' }}>
                        {renderTextWithMentions(update.text)}
                      </p>
                    )}

                    {/* Files */}
                    {update.files && update.files.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {update.files.map((file, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            background: 'white',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb',
                            fontSize: '12px',
                          }}>
                            {file.type && file.type.startsWith('image/') ? (
                              <div style={{ width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden' }}>
                                <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <span>📄</span>
                            )}
                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.name}
                            </span>
                            <span style={{ fontSize: '10px', color: '#999' }}>
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                      <button
                        onClick={() => startEdit(update)}
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
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => deleteUpdate(update.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e74c3c',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fde8e8'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        ✕ Delete
                      </button>
                    </div>

                    {/* Reply input */}
                    {replyingTo === update.id && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleReplySubmit(update.id);
                            if (e.key === 'Escape') setReplyingTo(null);
                          }}
                          placeholder="Write a reply and mention others with @"
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

                  {/* ============================================================
                      REPLIES - Ditampilkan di bawah update
                      ============================================================ */}
                  {update.replies && update.replies.length > 0 && (
                    <div style={{ marginTop: '8px', paddingLeft: '24px', borderLeft: '2px solid #e5e7eb' }}>
                      {update.replies.map((reply) => (
                        <div key={reply.id} style={{
                          marginTop: '8px',
                          padding: '10px 14px',
                          background: '#fafafa',
                          borderRadius: '6px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                            <strong style={{ fontSize: '12px', color: '#333' }}>
                              {reply.author || 'User'}
                            </strong>
                            <span style={{ fontSize: '10px', color: '#999' }}>
                              {formatDate(reply.timestamp)}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#333' }}>
                            {renderTextWithMentions(reply.text)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ============================================================
            INPUT - DI BAWAH (dengan textarea)
            ============================================================ */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          background: 'white',
          flexShrink: 0,
        }}>
          {/* Preview uploaded files */}
          {uploadedFiles.length > 0 && (
            <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {uploadedFiles.map((file) => (
                <div key={file.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  {file.type && file.type.startsWith('image/') ? <span>🖼️</span> : <span>📄</span>}
                  <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(file.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#999',
                      fontSize: '14px',
                      padding: '0 4px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {/* Textarea - bisa nulis banyak */}
            <textarea
              ref={inputRef}
              value={newUpdate}
              onChange={handleMention}
              placeholder="Write an update and mention others with @"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '60px',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    color: '#666',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  title="Upload file"
                >
                  📎
                </button>
                <span style={{ fontSize: '11px', color: '#999' }}>
                  Shift+Enter untuk new line
                </span>
              </div>
              <button
                type="submit"
                style={{
                  padding: '8px 24px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#43a047'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
              >
                Send
              </button>
            </div>
          </form>
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
