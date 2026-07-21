import React, { useState, useRef, useEffect } from 'react';
import { useUpdates } from '../context/UpdateContext';

const UpdatePanel = () => {
  const { 
    isPanelOpen, 
    closePanel, 
    selectedItem, 
    getItemUpdates, 
    addUpdate,
    addReply,
    editUpdate,
    deleteUpdate,
    editReply,
    deleteReply,
  } = useUpdates();

  const [newUpdate, setNewUpdate] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [replyFiles, setReplyFiles] = useState([]);
  
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [editText, setEditText] = useState('');
  
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyUpdateId, setEditingReplyUpdateId] = useState(null);
  const [editReplyText, setEditReplyText] = useState('');

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);
  const listContainerRef = useRef(null);

  const itemUpdates = selectedItem ? getItemUpdates(selectedItem) : [];
  const sortedUpdates = [...itemUpdates].reverse();

  // Debug: Log jumlah update
  useEffect(() => {
    console.log('📊 Updates loaded:', itemUpdates.length);
  }, [itemUpdates]);

  // Scroll ke atas saat update baru
  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
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
  // HANDLE UPLOAD FILE UNTUK UPDATE
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
  // HANDLE UPLOAD FILE UNTUK REPLY
  // ============================================================
  const handleReplyFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      file: file,
    }));
    setReplyFiles([...replyFiles, ...newFiles]);
    if (replyFileInputRef.current) {
      replyFileInputRef.current.value = '';
    }
  };

  const removeReplyFile = (fileId) => {
    setReplyFiles(replyFiles.filter(f => f.id !== fileId));
  };

  // ============================================================
  // 🔥 HANDLE SUBMIT UPDATE
  // ============================================================
  const handleSubmit = (e) => {
    e.preventDefault();
    const text = newUpdate.trim();
    if (text || uploadedFiles.length > 0) {
      console.log('📝 Submitting update:', text, uploadedFiles.length);
      addUpdate(selectedItem, text, uploadedFiles);
      setNewUpdate('');
      setUploadedFiles([]);
    }
  };

  // ============================================================
  // 🔥 CANCEL UPDATE
  // ============================================================
  const handleCancelUpdate = () => {
    setNewUpdate('');
    setUploadedFiles([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // ============================================================
  // 🔥 HANDLE REPLY SUBMIT
  // ============================================================
  const handleReplySubmit = (updateId) => {
    console.log('📝 Submitting reply:', replyText, replyFiles.length);
    if (replyText.trim() || replyFiles.length > 0) {
      const replyData = {
        text: replyText.trim(),
        files: replyFiles,
      };
      addReply(updateId, replyData);
      setReplyText('');
      setReplyFiles([]);
      setReplyingTo(null);
    }
  };

  // ============================================================
  // 🔥 CANCEL REPLY
  // ============================================================
  const handleCancelReply = () => {
    setReplyText('');
    setReplyFiles([]);
    setReplyingTo(null);
  };

  // ============================================================
  // 🔥 HANDLE EDIT UPDATE
  // ============================================================
  const startEditUpdate = (update) => {
    setEditingUpdateId(update.id);
    setEditText(update.text);
  };

  const handleSaveEditUpdate = (updateId) => {
    if (editText.trim()) {
      console.log('📝 Saving edit update:', editText);
      editUpdate(updateId, editText.trim());
      setEditingUpdateId(null);
      setEditText('');
    }
  };

  const handleCancelEditUpdate = () => {
    setEditingUpdateId(null);
    setEditText('');
  };

  // ============================================================
  // 🔥 HANDLE DELETE UPDATE
  // ============================================================
  const handleDeleteUpdate = (updateId) => {
    if (confirm('Delete this update and all replies?')) {
      console.log('🗑️ Deleting update:', updateId);
      deleteUpdate(updateId);
    }
  };

  // ============================================================
  // 🔥 HANDLE EDIT REPLY
  // ============================================================
  const startEditReply = (updateId, reply) => {
    setEditingReplyId(reply.id);
    setEditingReplyUpdateId(updateId);
    setEditReplyText(reply.text);
  };

  const handleSaveEditReply = (updateId, replyId) => {
    if (editReplyText.trim()) {
      console.log('📝 Saving edit reply:', editReplyText);
      editReply(updateId, replyId, editReplyText.trim());
      setEditingReplyId(null);
      setEditingReplyUpdateId(null);
      setEditReplyText('');
    }
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyUpdateId(null);
    setEditReplyText('');
  };

  // ============================================================
  // 🔥 HANDLE DELETE REPLY
  // ============================================================
  const handleDeleteReply = (updateId, replyId) => {
    if (confirm('Delete this reply?')) {
      console.log('🗑️ Deleting reply:', replyId);
      deleteReply(updateId, replyId);
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
            padding: '0 6px',
            borderRadius: '4px',
            fontWeight: 600,
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
      <div
        onClick={closePanel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '480px',
          maxWidth: '92vw',
          background: '#ffffff',
          boxShadow: '-4px 0 32px rgba(0,0,0,0.2)',
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
          padding: '10px 16px',
          borderBottom: '2px solid #d1d5db',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
              💬 Updates
            </h3>
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
              {itemUpdates.length}
            </span>
          </div>
          <button
            onClick={closePanel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '2px 6px',
              borderRadius: '4px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* ============================================================
            INPUT UPDATE
            ============================================================ */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '2px solid #d1d5db',
          background: '#f8f9fa',
          flexShrink: 0,
        }}>
          {uploadedFiles.length > 0 && (
            <div style={{ marginBottom: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {uploadedFiles.map((file) => (
                <div key={file.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: '#ffffff',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '11px',
                }}>
                  {file.type && file.type.startsWith('image/') ? <span>🖼️</span> : <span>📄</span>}
                  <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(file.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      fontSize: '12px',
                      padding: '0 2px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            <textarea
              ref={inputRef}
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              placeholder="Write an update and mention others with @"
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '36px',
                transition: 'border-color 0.2s',
                backgroundColor: '#ffffff',
                color: '#1f2937',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: '#6b7280',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  title="Upload file"
                >
                  📎
                </button>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  Shift+Enter new line
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(newUpdate.trim() || uploadedFiles.length > 0) && (
                  <button
                    type="button"
                    onClick={handleCancelUpdate}
                    style={{
                      padding: '4px 12px',
                      background: '#e5e7eb',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '14px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  style={{
                    padding: '4px 16px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#43a047'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
                >
                  Send
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ============================================================
            UPDATE LIST
            ============================================================ */}
        <div
          ref={listContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#f9fafb',
          }}
        >
          {sortedUpdates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#9ca3af',
              padding: '40px 20px',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#6b7280' }}>No updates yet</p>
            </div>
          ) : (
            sortedUpdates.map((update) => {
              const isEditingUpdate = editingUpdateId === update.id;
              return (
                <div key={update.id} style={{
                  border: '2px solid #9ca3af',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {/* UPDATE */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
                      <strong style={{ fontSize: '13px', color: '#1f2937', fontWeight: 700 }}>
                        {update.author || 'User'}
                      </strong>
                      <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>
                        {formatDate(update.timestamp)}
                      </span>
                    </div>

                    {isEditingUpdate ? (
                      <div style={{ marginTop: '6px' }}>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '2px solid #4CAF50',
                            borderRadius: '4px',
                            fontSize: '13px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            minHeight: '40px',
                            backgroundColor: '#ffffff',
                            color: '#1f2937',
                          }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.shiftKey) {
                              e.preventDefault();
                              handleSaveEditUpdate(update.id);
                            }
                            if (e.key === 'Escape') {
                              handleCancelEditUpdate();
                            }
                          }}
                        />
                        <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleSaveEditUpdate(update.id)}
                            style={{
                              padding: '2px 12px',
                              background: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditUpdate}
                            style={{
                              padding: '2px 12px',
                              background: '#e5e7eb',
                              color: '#374151',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{
                        margin: '4px 0 6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        wordWrap: 'break-word',
                        fontWeight: 400,
                        lineHeight: 1.5,
                      }}>
                        {renderTextWithMentions(update.text)}
                      </p>
                    )}

                    {update.files && update.files.length > 0 && (
                      <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {update.files.map((file, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            background: '#f3f4f6',
                            borderRadius: '4px',
                            border: '1px solid #d1d5db',
                            fontSize: '11px',
                          }}>
                            {file.type && file.type.startsWith('image/') ? (
                              <div style={{ width: '30px', height: '30px', borderRadius: '2px', overflow: 'hidden' }}>
                                <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <span>📄</span>
                            )}
                            <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                              {file.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: '6px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid #f3f4f6', paddingTop: '6px' }}>
                      <button
                        onClick={() => setReplyingTo(replyingTo === update.id ? null : update.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4B5563',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '0 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8e8'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        ↳ Reply
                      </button>
                      <button
                        onClick={() => startEditUpdate(update)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4B5563',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '0 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8e8'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUpdate(update.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '0 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fde8e8'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        ✕ Delete
                      </button>
                    </div>

                    {/* ============================================================
                        REPLY INPUT
                        ============================================================ */}
                    {replyingTo === update.id && (
                      <div style={{ marginTop: '8px', padding: '8px 10px', background: '#f3f4f6', borderRadius: '6px' }}>
                        {replyFiles.length > 0 && (
                          <div style={{ marginBottom: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {replyFiles.map((file) => (
                              <div key={file.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                                background: '#ffffff',
                                borderRadius: '4px',
                                border: '1px solid #d1d5db',
                                fontSize: '10px',
                              }}>
                                <span>📄</span>
                                <span style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file.name}
                                </span>
                                <button
                                  onClick={() => removeReplyFile(file.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#9ca3af',
                                    fontSize: '10px',
                                    padding: '0 2px',
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleReplySubmit(update.id);
                              }
                              if (e.key === 'Escape') {
                                handleCancelReply();
                              }
                            }}
                            placeholder="Write a reply..."
                            style={{
                              flex: 1,
                              minWidth: '120px',
                              padding: '4px 10px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px',
                              outline: 'none',
                              fontFamily: 'inherit',
                              color: '#1f2937',
                            }}
                            autoFocus
                          />
                          <input
                            ref={replyFileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            onChange={handleReplyFileUpload}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => replyFileInputRef.current?.click()}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '14px',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: '#6b7280',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8e8'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Upload file"
                          >
                            📎
                          </button>
                          <button
                            onClick={() => handleReplySubmit(update.id)}
                            style={{
                              padding: '2px 12px',
                              background: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Reply
                          </button>
                          <button
                            onClick={handleCancelReply}
                            style={{
                              padding: '2px 12px',
                              background: '#e5e7eb',
                              color: '#374151',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ============================================================
                      REPLIES LIST
                      ============================================================ */}
                  {update.replies && update.replies.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '2px solid #e5e7eb',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}>
                      {update.replies.map((reply) => {
                        const isEditingReply = editingReplyId === reply.id && editingReplyUpdateId === update.id;
                        return (
                          <div key={reply.id} style={{
                            padding: '6px 10px',
                            background: '#f3f4f6',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
                              <strong style={{ fontSize: '11px', color: '#1f2937', fontWeight: 700 }}>
                                {reply.author || 'User'}
                              </strong>
                              <span style={{ fontSize: '9px', color: '#6b7280', fontWeight: 500 }}>
                                {formatDate(reply.timestamp)}
                              </span>
                            </div>

                            {isEditingReply ? (
                              <div style={{ marginTop: '4px' }}>
                                <textarea
                                  value={editReplyText}
                                  onChange={(e) => setEditReplyText(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '4px 8px',
                                    border: '2px solid #4CAF50',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    minHeight: '30px',
                                    backgroundColor: '#ffffff',
                                    color: '#1f2937',
                                  }}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveEditReply(update.id, reply.id);
                                    }
                                    if (e.key === 'Escape') {
                                      handleCancelEditReply();
                                    }
                                  }}
                                />
                                <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => handleSaveEditReply(update.id, reply.id)}
                                    style={{
                                      padding: '2px 10px',
                                      background: '#4CAF50',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEditReply}
                                    style={{
                                      padding: '2px 10px',
                                      background: '#e5e7eb',
                                      color: '#374151',
                                      border: 'none
