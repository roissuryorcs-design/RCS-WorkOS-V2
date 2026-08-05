import React, { useState, useRef, useEffect } from 'react';
import { useUpdates } from '../context/UpdateContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useBoards } from '../context/BoardsContext';
import { supabase } from '../lib/supabaseClient';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import TranslateToggle from './TranslateToggle';

const UpdatePanel = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { fetchWorkspaceMembers } = useBoards();
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

  // Resolves @word tokens against workspace members' display names (first
  // word only — matches renderTextWithMentions' existing single-word @token
  // regex below, so what lights up as a mention visually is exactly what
  // can resolve to a real notification) and inserts one notifications row
  // per matched member, excluding the author. Best-effort: a failed insert
  // doesn't block the comment itself, which already sent successfully.
  // board_id/item_id are denormalized onto the notification (same idea as
  // updates.board_id) so the bell can deep-link straight back to this
  // item's comment thread without an extra lookup at click time.
  const notifyMentions = async (text, createdRow) => {
    const tokens = [...text.matchAll(/@(\w+)/g)].map((m) => m[1].toLowerCase());
    if (tokens.length === 0) return;
    const members = await fetchWorkspaceMembers();
    const matchedUserIds = new Set();
    members.forEach((m) => {
      if (m.userId === user.id) return;
      const firstWord = (m.displayName || m.email || '').trim().split(/\s+/)[0]?.toLowerCase();
      if (firstWord && tokens.includes(firstWord)) matchedUserIds.add(m.userId);
    });
    if (matchedUserIds.size === 0) return;
    const { error } = await supabase.from('notifications').insert(
      [...matchedUserIds].map((userId) => ({
        user_id: userId,
        actor_id: user.id,
        type: 'mention',
        source_type: 'update',
        source_id: createdRow.id,
        board_id: createdRow.board_id,
        item_id: createdRow.item_id,
        preview: text.slice(0, 120),
      }))
    );
    if (error) console.error('Error creating mention notifications:', error);
  };

  const [newUpdate, setNewUpdate] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [replyFiles, setReplyFiles] = useState([]);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [uploadingReply, setUploadingReply] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [uploadingEditReply, setUploadingEditReply] = useState(false);

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
  // HANDLE UPLOAD FILE UNTUK UPDATE — real Cloudinary uploads, not
  // ephemeral blob URLs (those died on refresh and never actually
  // persisted anywhere — `file: file` doesn't survive JSON serialization).
  // ============================================================
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (files.length === 0) return;
    setUploadingNew(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadToCloudinary(f)));
      setUploadedFiles((prev) => [...prev, ...uploaded.map((u) => ({ ...u, id: u.url }))]);
    } catch (err) {
      console.error('Upload failed:', err);
      alert(t('fileAttachment.uploadFailed'));
    } finally {
      setUploadingNew(false);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
  };

  // ============================================================
  // HANDLE UPLOAD FILE UNTUK REPLY
  // ============================================================
  const handleReplyFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (replyFileInputRef.current) replyFileInputRef.current.value = '';
    if (files.length === 0) return;
    setUploadingReply(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadToCloudinary(f)));
      setReplyFiles((prev) => [...prev, ...uploaded.map((u) => ({ ...u, id: u.url }))]);
    } catch (err) {
      console.error('Upload failed:', err);
      alert(t('fileAttachment.uploadFailed'));
    } finally {
      setUploadingReply(false);
    }
  };

  const removeReplyFile = (fileId) => {
    setReplyFiles(replyFiles.filter(f => f.id !== fileId));
  };

  // ============================================================
  // HANDLE UPLOAD FILE UNTUK EDIT UPDATE
  // ============================================================
  const handleEditFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
    if (files.length === 0) return;
    setUploadingEdit(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadToCloudinary(f)));
      setEditNewFiles((prev) => [...prev, ...uploaded.map((u) => ({ ...u, id: u.url }))]);
    } catch (err) {
      console.error('Upload failed:', err);
      alert(t('fileAttachment.uploadFailed'));
    } finally {
      setUploadingEdit(false);
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
  const handleEditReplyFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (editReplyFileInputRef.current) editReplyFileInputRef.current.value = '';
    if (files.length === 0) return;
    setUploadingEditReply(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadToCloudinary(f)));
      setEditReplyNewFiles((prev) => [...prev, ...uploaded.map((u) => ({ ...u, id: u.url }))]);
    } catch (err) {
      console.error('Upload failed:', err);
      alert(t('fileAttachment.uploadFailed'));
    } finally {
      setUploadingEditReply(false);
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Guards against a race where hitting Enter/Kirim while a file is
    // still mid-upload sends the message before uploadedFiles has the
    // finished upload — the attachment would land, orphaned, on
    // whatever gets sent next instead of the message the user meant it
    // for.
    if (uploadingNew) return;
    const text = newUpdate.trim();
    if (text || uploadedFiles.length > 0) {
      const created = await addUpdate(selectedItem, text, uploadedFiles);
      setNewUpdate('');
      setUploadedFiles([]);
      if (created && text) notifyMentions(text, created);
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
  const handleReplySubmit = async () => {
    if (uploadingReply) return;
    if (replyText.trim() || replyFiles.length > 0) {
      const text = replyText.trim();
      const replyData = { text, files: replyFiles };
      const created = await addReply(replyingTo.updateId, replyData, replyingTo.parentReplyId || null);
      setReplyText('');
      setReplyFiles([]);
      setReplyingTo(null);
      if (created && text) notifyMentions(text, created);
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
    if (uploadingEdit) return;
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
    if (confirm(t('updatePanel.deleteUpdateConfirm'))) {
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
    if (uploadingEditReply) return;
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
    if (confirm(t('updatePanel.deleteReplyConfirm'))) {
      deleteReply(updateId, replyId);
    }
  };

  // ============================================================
  // RENDER TEXT WITH MENTION
  // ============================================================
  const renderTextWithMentions = (text) => {
    if (!text) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('updatePanel.emptyUpdate')}</span>;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} style={{
            color: 'var(--btn-primary-bg)',
            background: 'rgba(59,130,246,0.15)',
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
          <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" style={{
            fontSize: '12px',
            color: 'var(--btn-primary-bg)',
            textDecoration: 'underline',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            wordBreak: 'break-all',
            maxWidth: '100%',
          }}>
            {index + 1}. {file.name}
          </a>
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
        background: 'var(--bg-hover)',
        borderRadius: '4px',
        border: '1px solid var(--border-color)',
      }}>
        {allFiles.map((file, index) => {
          const isNew = newFiles.some(f => f.id === file.id);
          return (
            <div key={file.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              background: isNew ? 'rgba(59,130,246,0.18)' : 'var(--bg-hover)',
              borderRadius: '4px',
              border: isNew ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border-dark)',
              fontSize: '11px',
              maxWidth: '100%',
              flexWrap: 'wrap',
            }}>
              <span style={{ color: 'var(--btn-primary-bg)', fontWeight: 500 }}>{index + 1}.</span>
              <span style={{ 
                color: 'var(--btn-primary-bg)', 
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
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title={t('updatePanel.removeFile')}
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
        borderTop: '2px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingLeft: depth > 0 ? '16px' : '0',
        borderLeft: depth > 0 ? '2px solid var(--border-dark)' : 'none',
      }}>
        {replies.map((reply) => {
          const isEditingReply = editingReplyId === reply.id && editingReplyUpdateId === updateId;
          const isReplyingToThis = replyingTo && replyingTo.parentReplyId === reply.id && replyingTo.updateId === updateId;
          
          return (
            <div key={reply.id} style={{
              padding: '6px 10px',
              background: depth > 0 ? 'var(--bg-hover)' : 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {renderAvatar(reply.author, 20)}
                  <strong style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {reply.author || t('updatePanel.defaultAuthor')}
                  </strong>
                </div>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {formatDate(reply.timestamp)}
                </span>
              </div>

              {isEditingReply ? (
                <div style={{ marginTop: '4px' }}>
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
                      border: '2px solid var(--btn-primary-bg)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: '30px',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
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
                      disabled={uploadingEditReply}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '14px',
                        cursor: uploadingEditReply ? 'default' : 'pointer',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        transition: 'background 0.2s',
                        opacity: uploadingEditReply ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      title={t('updatePanel.uploadFile')}
                    >
                      {uploadingEditReply ? '⏳' : '📎'}
                    </button>
                    <button
                      onClick={() => handleSaveEditReply(updateId, reply.id)}
                      style={{
                        padding: '2px 10px',
                        background: 'var(--btn-primary-bg)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {t('updatePanel.save')}
                    </button>
                    <button
                      onClick={handleCancelEditReply}
                      style={{
                        padding: '2px 10px',
                        background: 'var(--bg-active)',
                        color: 'var(--text-primary)',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      {t('updatePanel.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}>
                  {renderTextWithMentions(reply.text)}
                </p>
              )}

              {!isEditingReply && reply.files && reply.files.length > 0 && (
                renderFiles(reply.files)
              )}

              {!isEditingReply && <TranslateToggle text={reply.text} />}

              <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setReplyingTo({ updateId, parentReplyId: reply.id })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '10px',
                    cursor: 'pointer',
                    padding: '0 4px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {t('updatePanel.reply')}
                </button>
                <button
                  onClick={() => startEditReply(updateId, reply)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '10px',
                    cursor: 'pointer',
                    padding: '0 4px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {t('updatePanel.edit')}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {t('updatePanel.delete')}
                </button>
              </div>

              {/* 🔥 REPLY INPUT DINAMIS - dengan preview attachment */}
              {isReplyingToThis && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 10px',
                  background: 'var(--bg-hover)',
                  borderRadius: '6px',
                  border: '2px solid var(--border-dark)',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                    padding: '4px 8px',
                    background: 'var(--bg-hover)',
                    borderRadius: '4px',
                    fontStyle: 'italic',
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('updatePanel.replyingToReply')}</span> {reply.text.substring(0, 50)}...
                  </div>

                  {/* 🔥 PREVIEW FILE DI REPLY - DENGAN WARNA BIRU DAN NOMOR URUT */}
                  {replyFiles.length > 0 && (
                    <div style={{ 
                      marginBottom: '6px', 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '4px 8px',
                      maxWidth: '100%',
                      padding: '4px 6px',
                      background: 'var(--bg-card)',
                      borderRadius: '4px',
                      border: '1px solid var(--border-dark)',
                    }}>
                      {replyFiles.map((file, idx) => (
                        <div key={file.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          background: 'rgba(59,130,246,0.18)',
                          borderRadius: '4px',
                          border: '1px solid var(--btn-primary-bg)',
                          fontSize: '11px',
                          maxWidth: '100%',
                          flexWrap: 'wrap',
                        }}>
                          <span style={{ color: 'var(--btn-primary-bg)', fontWeight: 500 }}>{idx + 1}.</span>
                          <span style={{ 
                            color: 'var(--btn-primary-bg)', 
                            textDecoration: 'underline',
                            wordBreak: 'break-all',
                            maxWidth: '200px',
                          }}>
                            {file.name}
                          </span>
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
                              borderRadius: '4px',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title={t('updatePanel.removeFile')}
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
                      placeholder={t('updatePanel.replyToReplyPlaceholder')}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid var(--border-dark)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        minHeight: '44px',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--btn-primary-bg)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-dark)'}
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
                        disabled={uploadingReply}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '16px',
                          cursor: uploadingReply ? 'default' : 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                          transition: 'background 0.2s',
                          opacity: uploadingReply ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title={t('updatePanel.uploadFile')}
                      >
                        {uploadingReply ? '⏳' : '📎'}
                      </button>
                      <button
                        onClick={handleReplySubmit}
                        style={{
                          padding: '4px 16px',
                          background: 'var(--btn-primary-bg)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {t('updatePanel.replyBtn')}
                      </button>
                      <button
                        onClick={handleCancelReply}
                        style={{
                          padding: '4px 16px',
                          background: 'var(--bg-active)',
                          color: 'var(--text-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        {t('updatePanel.cancel')}
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

  // ============================================================
  // AVATAR - INISIAL WARNA-WARNI PER AUTHOR
  // ============================================================
  const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e'];
  const getAvatarColor = (name) => {
    const str = name || t('updatePanel.defaultAuthor');
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const renderAvatar = (name, size = 24) => (
    <span style={{
      width: size,
      height: size,
      minWidth: size,
      borderRadius: '50%',
      background: getAvatarColor(name),
      color: '#ffffff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.45),
      fontWeight: 700,
      flexShrink: 0,
      lineHeight: 1,
    }}>
      {(name || t('updatePanel.defaultAuthor')).trim().charAt(0).toUpperCase()}
    </span>
  );

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
          background: 'var(--bg-card)',
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
          borderBottom: '2px solid var(--border-dark)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-hover)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('updatePanel.updatesTitle')}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
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
              color: 'var(--text-secondary)',
              padding: '2px 6px',
              borderRadius: '4px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* INPUT UPDATE */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '2px solid var(--border-dark)',
          background: 'var(--bg-hover)',
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
                  background: 'var(--bg-card)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-dark)',
                  fontSize: '11px',
                }}>
                  <span style={{ color: 'var(--btn-primary-bg)' }}>{idx + 1}.</span>
                  <span style={{ color: 'var(--btn-primary-bg)', textDecoration: 'underline', wordBreak: 'break-all' }}>{file.name}</span>
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
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title={t('updatePanel.removeFile')}
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
              placeholder={t('updatePanel.newUpdatePlaceholder')}
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '2px solid var(--border-dark)',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '36px',
                transition: 'border-color 0.2s',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--btn-primary-bg)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-dark)'}
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
                  disabled={uploadingNew}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    cursor: uploadingNew ? 'default' : 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)',
                    transition: 'background 0.2s',
                    opacity: uploadingNew ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  title={t('updatePanel.uploadFile')}
                >
                  {uploadingNew ? '⏳' : '📎'}
                </button>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {t('updatePanel.shiftEnterHint')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(newUpdate.trim() || uploadedFiles.length > 0) && (
                  <button
                    type="button"
                    onClick={handleCancelUpdate}
                    style={{
                      padding: '4px 12px',
                      background: 'var(--bg-active)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      borderRadius: '14px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                  >
                    {t('updatePanel.cancel')}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploadingNew}
                  style={{
                    padding: '4px 16px',
                    background: 'var(--btn-primary-bg)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '12px',
                    cursor: uploadingNew ? 'default' : 'pointer',
                    transition: 'background 0.2s',
                    fontWeight: 600,
                    opacity: uploadingNew ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--btn-primary-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--btn-primary-bg)'}
                >
                  {uploadingNew ? t('fileAttachment.uploading') : t('updatePanel.send')}
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
            backgroundColor: 'var(--bg-card)',
          }}
        >
          {sortedUpdates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: '40px 20px',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('updatePanel.noUpdatesYet')}</p>
            </div>
          ) : (
            sortedUpdates.map((update) => {
              const isEditingUpdate = editingUpdateId === update.id;
              const isReplyingToUpdate = replyingTo && replyingTo.updateId === update.id && !replyingTo.parentReplyId;
              
              return (
                <div key={update.id} style={{
                  border: '2px solid var(--border-dark)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-card)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {/* UPDATE */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderAvatar(update.author, 26)}
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                          {update.author || t('updatePanel.defaultAuthor')}
                        </strong>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {formatDate(update.timestamp)}
                      </span>
                    </div>

                    {isEditingUpdate ? (
                      <div style={{ marginTop: '6px' }}>
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
                            border: '2px solid var(--btn-primary-bg)',
                            borderRadius: '4px',
                            fontSize: '13px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            minHeight: '40px',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-primary)',
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
                            disabled={uploadingEdit}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '14px',
                              cursor: uploadingEdit ? 'default' : 'pointer',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)',
                              transition: 'background 0.2s',
                              opacity: uploadingEdit ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title={t('updatePanel.uploadFile')}
                          >
                            {uploadingEdit ? '⏳' : '📎'}
                          </button>
                          <button
                            onClick={() => handleSaveEditUpdate(update.id)}
                            style={{
                              padding: '2px 12px',
                              background: 'var(--btn-primary-bg)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {t('updatePanel.save')}
                          </button>
                          <button
                            onClick={handleCancelEditUpdate}
                            style={{
                              padding: '2px 12px',
                              background: 'var(--bg-hover)',
                              color: 'var(--text-primary)',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            {t('updatePanel.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{
                        margin: '4px 0 6px',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
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

                    {!isEditingUpdate && <TranslateToggle text={update.text} />}

                    <div style={{ marginTop: '6px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                      <button
                        onClick={() => setReplyingTo({ updateId: update.id, parentReplyId: null })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '0 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {t('updatePanel.reply')}
                      </button>
                      <button
                        onClick={() => startEditUpdate(update)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '0 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {t('updatePanel.edit')}
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
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {t('updatePanel.delete')}
                      </button>
                    </div>

                    {/* REPLY INPUT DINAMIS di bawah update */}
                    {isReplyingToUpdate && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 12px',
                        background: 'var(--bg-hover)',
                        borderRadius: '8px',
                        border: '2px solid var(--border-dark)',
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          marginBottom: '6px',
                          padding: '4px 8px',
                          background: 'var(--bg-hover)',
                          borderRadius: '4px',
                          fontStyle: 'italic',
                        }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('updatePanel.replyingToUpdate')}</span> {update.text.substring(0, 50)}...
                        </div>

                        {/* 🔥 PREVIEW FILE DI REPLY - DENGAN WARNA BIRU DAN NOMOR URUT */}
                        {replyFiles.length > 0 && (
                          <div style={{ 
                            marginBottom: '6px', 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '4px 8px',
                            maxWidth: '100%',
                            padding: '4px 6px',
                            background: 'var(--bg-card)',
                            borderRadius: '4px',
                            border: '1px solid var(--border-dark)',
                          }}>
                            {replyFiles.map((file, idx) => (
                              <div key={file.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                                background: 'rgba(59,130,246,0.18)',
                                borderRadius: '4px',
                                border: '1px solid var(--btn-primary-bg)',
                                fontSize: '11px',
                                maxWidth: '100%',
                                flexWrap: 'wrap',
                              }}>
                                <span style={{ color: 'var(--btn-primary-bg)', fontWeight: 500 }}>{idx + 1}.</span>
                                <span style={{ 
                                  color: 'var(--btn-primary-bg)', 
                                  textDecoration: 'underline',
                                  wordBreak: 'break-all',
                                  maxWidth: '200px',
                                }}>
                                  {file.name}
                                </span>
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
                                    borderRadius: '4px',
                                    transition: 'background 0.2s',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  title={t('updatePanel.removeFile')}
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
                            placeholder={t('updatePanel.replyPlaceholder')}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '2px solid var(--border-dark)',
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              minHeight: '44px',
                              backgroundColor: 'var(--bg-input)',
                              color: 'var(--text-primary)',
                              transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--btn-primary-bg)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-dark)'}
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
                              disabled={uploadingReply}
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '16px',
                                cursor: uploadingReply ? 'default' : 'pointer',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)',
                                transition: 'background 0.2s',
                                opacity: uploadingReply ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              title={t('updatePanel.uploadFile')}
                            >
                              {uploadingReply ? '⏳' : '📎'}
                            </button>
                            <button
                              onClick={handleReplySubmit}
                              style={{
                                padding: '4px 16px',
                                background: 'var(--btn-primary-bg)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              {t('updatePanel.replyBtn')}
                            </button>
                            <button
                              onClick={handleCancelReply}
                              style={{
                                padding: '4px 16px',
                                background: 'var(--bg-active)',
                                color: 'var(--text-primary)',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 500,
                              }}
                            >
                              {t('updatePanel.cancel')}
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
          background: var(--bg-hover);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: var(--text-light);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
        textarea {
          color: var(--text-primary) !important;
        }
      `}</style>
    </>
  );
};

export default UpdatePanel;
