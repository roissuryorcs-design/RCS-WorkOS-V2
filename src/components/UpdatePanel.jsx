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
  const [editFiles, setEditFiles] = useState([]);
  const [editNewFiles, setEditNewFiles] = useState([]);
  
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyUpdateId, setEditingReplyUpdateId] = useState(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [editReplyFiles, setEditReplyFiles] = useState([]);
  const [editReplyNewFiles, setEditReplyNewFiles] = useState([]);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const editReplyFileInputRef = useRef(null);
  const listContainerRef = useRef(null);
  const replyTextareaRef = useRef(null);

  const itemUpdates = selectedItem ? getItemUpdates(selectedItem) : [];
  const sortedUpdates = [...itemUpdates].reverse();

  // Auto-focus reply textarea saat muncul
  useEffect(() => {
    if (replyingTo && replyTextareaRef.current) {
      setTimeout(() => replyTextareaRef.current.focus(), 100);
    }
  }, [replyingTo]);

  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [itemUpdates]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [closePanel]);

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
  // HANDLE UPLOAD FILE UNTUK EDIT UPDATE
  // ============================================================
  const handleEditFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      file: file,
    }));
    setEditNewFiles([...editNewFiles, ...newFiles]);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const removeEditFile = (fileId, isExisting = false) => {
    if (isExisting) {
      setEditFiles(editFiles.filter(f => f.id !== fileId));
    } else {
      setEditNewFiles(editNewFiles.filter(f => f.id !== fileId));
    }
  };

  // ============================================================
  // HANDLE UPLOAD FILE UNTUK EDIT REPLY
  // ============================================================
  const handleEditReplyFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      file: file,
    }));
    setEditReplyNewFiles([...editReplyNewFiles, ...newFiles]);
    if (editReplyFileInputRef.current) {
      editReplyFileInputRef.current.value = '';
    }
  };

  const removeEditReplyFile = (fileId, isExisting = false) => {
    if (isExisting) {
      setEditReplyFiles(editReplyFiles.filter(f => f.id !== fileId));
    } else {
      setEditReplyNewFiles(editReplyNewFiles.filter(f => f.id !== fileId));
    }
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

  const handleCancelUpdate = () => {
    setNewUpdate('');
    setUploadedFiles([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // ============================================================
  // HANDLE REPLY SUBMIT
  // ============================================================
  const handleReplySubmit = () => {
    if (replyText.trim() || replyFiles.length > 0) {
      const replyData = {
        text: replyText.trim(),
        files: replyFiles,
      };
      addReply(replyingTo.updateId, replyData, replyingTo.parentReplyId || null);
      setReplyText('');
      setReplyFiles([]);
      setReplyingTo(null);
    }
  };

  const handleCancelReply = () => {
    setReplyText('');
    setReplyFiles([]);
    setReplyingTo(null);
  };

  // ============================================================
  // HANDLE EDIT UPDATE
  // ============================================================
  const startEditUpdate = (update) => {
    setEditingUpdateId(update.id);
    setEditText(update.text);
    setEditFiles(update.files || []);
    setEditNewFiles([]);
  };

  const handleSaveEditUpdate = (updateId) => {
    if (editText.trim()) {
      const allFiles = [...editFiles, ...editNewFiles];
      editUpdate(updateId, editText.trim(), allFiles);
      setEditingUpdateId(null);
      setEditText('');
      setEditFiles([]);
      setEditNewFiles([]);
    }
  };

  const handleCancelEditUpdate = () => {
    setEditingUpdateId(null);
    setEditText('');
    setEditFiles([]);
    setEditNewFiles([]);
  };

  const handleDeleteUpdate = (updateId) => {
    if (confirm('Delete this update and all replies?')) {
      deleteUpdate(updateId);
    }
  };

  // ============================================================
  // HANDLE EDIT REPLY
  // ============================================================
  const startEditReply = (updateId, reply) => {
    setEditingReplyId(reply.id);
    setEditingReplyUpdateId(updateId);
    setEditReplyText(reply.text);
    setEditReplyFiles(reply.files || []);
    setEditReplyNewFiles([]);
  };

  const handleSaveEditReply = (updateId, replyId) => {
    if (editReplyText.trim()) {
      const allFiles = [...editReplyFiles, ...editReplyNewFiles];
      editReply(updateId, replyId, editReplyText.trim(), allFiles);
      setEditingReplyId(null);
      setEditingReplyUpdateId(null);
      setEditReplyText('');
      setEditReplyFiles([]);
      setEditReplyNewFiles([]);
    }
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyUpdateId(null);
    setEditReplyText('');
    setEditReplyFiles([]);
    setEditReplyNewFiles([]);
  };

  const handleDeleteReply = (updateId, replyId) => {
    if (confirm('Delete this reply?')) {
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
  // RENDER FILES - LIST DENGAN NOMOR URUT, WARNA BIRU, WRAP TEXT
  // ============================================================
  const renderFiles = (files) => {
    if (!files || files.length === 0) return null;
    return (
      <div style={{ 
        marginTop: '4px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '4px 12px',
        maxWidth: '100%',
      }}>
        {files.map((file, index) => (
          <span key={file.id} style={{
            fontSize: '12px',
            color: '#1a73e8',
            textDecoration: 'underline',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            wordBreak: 'break-all',
            maxWidth: '100%',
          }}>
            {index + 1}. {file.name}
          </span>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDER FILES PREVIEW UNTUK EDIT - DENGAN TOMBOL X
  // ============================================================
  const renderEditFilesPreview = (existingFiles, newFiles, onRemove, isReply = false) => {
    const allFiles = [...existingFiles, ...newFiles];
    if (allFiles.length === 0) return null;
    
    return (
      <div style={{ 
        marginBottom: '4px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '4px 8px',
        maxWidth: '100%',
        padding: '4px 6px',
        background: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #e5e7eb',
      }}>
        {allFiles.map((file, index) => {
          const isNew = newFiles.some(f => f.id === file.id);
          return (
            <div key={file.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              background: isNew ? '#dbeafe' : '#e5e7eb',
              borderRadius: '4px',
              border: isNew ? '1px solid #3b82f6' : '1px solid #d1d5db',
              fontSize: '11px',
              maxWidth: '100%',
              flexWrap: 'wrap',
            }}>
              <span style={{ color: '#1a73e8', fontWeight: 500 }}>{index + 1}.</span>
              <span style={{ 
                color: '#1a73e8', 
                textDecoration: 'underline',
                wordBreak: 'break-all',
                maxWidth: '250px',
              }}>
                {file.name}
              </span>
              <button
                onClick={() => onRemove(file.id, !isNew)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '0 2px',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // RENDER REPLIES (Recursive)
  // ============================================================
  const renderReplies = (replies, updateId, depth = 0) => {
    if (!replies || replies.length === 0) return null;
    
    return (
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '2px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingLeft: depth > 0 ? '16px' : '0',
        borderLeft: depth > 0 ? '2px solid #d1d5db' : 'none',
      }}>
        {replies.map((reply) => {
          const isEditingReply = editingReplyId === reply.id && editingReplyUpdateId === updateId;
          const isReplyingToThis = replyingTo && replyingTo.parentReplyId === reply.id && replyingTo.updateId === updateId;
          
          return (
            <div key={reply.id} style={{
              padding: '6px 10px',
              background: depth > 0 ? '#f0f0f0' : '#f3f4f6',
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
                  {/* 🔥 Preview file di Edit Reply */}
                  {renderEditFilesPreview(
                    editReplyFiles,
                    editReplyNewFiles,
                    (fileId, isExisting) => {
                      if (isExisting) {
                        setEditReplyFiles(editReplyFiles.filter(f => f.id !== fileId));
                      } else {
                        setEditReplyNewFiles(editReplyNewFiles.filter(f => f.id !== fileId));
                      }
                    },
                    true
                  )}

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
                        handleSaveEditReply(updateId, reply.id);
                      }
                      if (e.key === 'Escape') {
                        handleCancelEditReply();
                      }
                    }}
                  />
                  <div style={{ marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <input
                      ref={editReplyFileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleEditReplyFileUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => editReplyFileInputRef.current?.click()}
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
                      onClick={() => handleSaveEditReply(updateId, reply.id)}
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
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
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
                  margin: '4px 0 0',
                  fontSize: '13px',
                  color: '#1f2937',
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}>
                  {renderTextWithMentions(reply.text)}
                </p>
              )}

              {!isEditingReply && reply.files && reply.files.length > 0 && (
                renderFiles(reply.files)
              )}

              <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setReplyingTo({ updateId, parentReplyId: reply.id })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4B5563',
                    fontSize: '10px',
                    cursor: 'pointer',
                    padding: '0 4px',
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
                  onClick={() => startEditReply(updateId, reply)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4B5563',
                    fontSize: '10px',
                    cursor: 'pointer',
                    padding: '0 4px',
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
                  onClick={() => handleDeleteReply(updateId, reply.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '10px',
                    cursor: 'pointer',
                    padding: '0 4px',
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

              {/* 🔥 Reply input dinamis di bawah reply ini */}
              {isReplyingToThis && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 10px',
                  background: '#f0f4f8',
                  borderRadius: '6px',
                  border: '2px solid #d1d5db',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginBottom: '6px',
                    padding: '4px 8px',
                    background: '#e5e7eb',
                    borderRadius: '4px',
                    fontStyle: 'italic',
                  }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>Replying to reply:</span> {reply.text.substring(0, 50)}...
                  </div>

                  {replyFiles.length > 0 && (
                    <div style={{ marginBottom: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {replyFiles.map((file, idx) => (
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
                          <span style={{ color: '#1a73e8' }}>{idx + 1}.</span>
                          <span>{file.name}</span>
                          <button
                            onClick={() => removeReplyFile(file.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '0 2px',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <textarea
                      ref={replyTextareaRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReplySubmit();
                        }
                        if (e.key === 'Escape') {
                          handleCancelReply();
                        }
                      }}
                      placeholder="Write a reply to this reply..."
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
                        minHeight: '44px',
                        backgroundColor: '#ffffff',
                        color: '#1f2937',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#4CAF50'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                          fontSize: '16px',
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
                        onClick={handleReplySubmit}
                        style={{
                          padding: '4px 16px',
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Reply
                      </button>
                      <button
                        onClick={handleCancelReply}
                        style={{
                          padding: '4px 16px',
                          background: '#e5e7eb',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {reply.replies && reply.replies.length > 0 && (
                renderReplies(reply.replies, updateId, depth + 1)
              )}
            </div>
          );
        })}
      </div>
    );
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
          background: 'rgba(0,0,0,0.35)',
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
        {/* HEADER */}
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

        {/* INPUT UPDATE */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '2px solid #d1d5db',
          background: '#f8f9fa',
          flexShrink: 0,
        }}>
          {uploadedFiles.length > 0 && (
            <div style={{ marginBottom: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {uploadedFiles.map((file, idx) => (
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
                  <span style={{ color: '#1a73e8' }}>{idx + 1}.</span>
                  <span style={{ color: '#1a73e8', textDecoration: 'underline', wordBreak: 'break-all' }}>{file.name}</span>
                  <button
                    onClick={() => removeFile(file.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: '14px',
                      padding: '0 4px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Remove file"
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

        {/* UPDATE LIST */}
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
              const isReplyingToUpdate = replyingTo && replyingTo.updateId === update.id && !replyingTo.parentReplyId;
              
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
                        {/* 🔥 Preview file di Edit Update */}
                        {renderEditFilesPreview(
                          editFiles,
                          editNewFiles,
                          (fileId, isExisting) => {
                            if (isExisting) {
                              setEditFiles(editFiles.filter(f => f.id !== fileId));
                            } else {
                              setEditNewFiles(editNewFiles.filter(f => f.id !== fileId));
                            }
                          },
                          false
                        )}

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
                        <div style={{ marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <input
                            ref={editFileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            onChange={handleEditFileUpload}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
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

                    {!isEditingUpdate && update.files && update.files.length > 0 && (
                      renderFiles(update.files)
                    )}

                    <div style={{ marginTop: '6px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid #f3f4f6', paddingTop: '6px' }}>
                      <button
                        onClick={() => setReplyingTo({ updateId: update.id, parentReplyId: null })}
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

                    {/* REPLY INPUT DINAMIS di bawah update */}
                    {isReplyingToUpdate && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 12px',
                        background: '#f0f4f8',
                        borderRadius: '8px',
                        border: '2px solid #d1d5db',
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          marginBottom: '6px',
                          padding: '4px 8px',
                          background: '#e5e7eb',
                          borderRadius: '4px',
                          fontStyle: 'italic',
                        }}>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Replying to update:</span> {update.text.substring(0, 50)}...
                        </div>

                        {replyFiles.length > 0 && (
                          <div style={{ marginBottom: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {replyFiles.map((file, idx) => (
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
                                <span style={{ color: '#1a73e8' }}>{idx + 1}.</span>
                                <span>{file.name}</span>
                                <button
                                  onClick={() => removeReplyFile(file.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    padding: '0 2px',
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <textarea
                            ref={replyTextareaRef}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleReplySubmit();
                              }
                              if (e.key === 'Escape') {
                                handleCancelReply();
                              }
                            }}
                            placeholder="Write a reply..."
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
                              minHeight: '44px',
                              backgroundColor: '#ffffff',
                              color: '#1f2937',
                              transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#4CAF50'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                          />

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                                fontSize: '16px',
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
                              onClick={handleReplySubmit}
                              style={{
                                padding: '4px 16px',
                                background: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              Reply
                            </button>
                            <button
                              onClick={handleCancelReply}
                              style={{
                                padding: '4px 16px',
                                background: '#e5e7eb',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 500,
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* REPLIES LIST */}
                  {update.replies && update.replies.length > 0 && (
                    renderReplies(update.replies, update.id, 0)
                  )}
                </div>
              );
            })
          )}
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
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: #c1c7cd;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        textarea {
          color: #1f2937 !important;
        }
      `}</style>
    </>
  );
};

export default UpdatePanel;
