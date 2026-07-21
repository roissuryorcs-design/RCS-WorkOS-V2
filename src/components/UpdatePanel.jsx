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
  // 🔥 HANDLE MENTION - Deteksi @username
  // ============================================================
  const handleMention = (e) => {
    const value = e.target.value;
    // Deteksi jika user mengetik @
    const lastAt = value.lastIndexOf('@');
    if (lastAt !== -1) {
      // Cek apakah ada spasi setelah @
      const afterAt = value.substring(lastAt + 1);
      if (!afterAt.includes(' ')) {
        // Ini adalah mention yang sedang diketik
        // Bisa ditambahkan autocomplete di sini
        console.log('🔍 Mention detected:', afterAt);
      }
    }
    setNewUpdate(value);
  };

  // ============================================================
  // 🔥 HANDLE UPLOAD FILE
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
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
  };

  // ============================================================
  // 🔥 HANDLE SUBMIT UPDATE (dengan file)
  // ============================================================
  const handleSubmit = (e) => {
    e.preventDefault();
    const text = newUpdate.trim();
    if (text || uploadedFiles.length > 0) {
      // Highlight mention di teks
      const highlightedText = highlightMentions(text);
      
      addUpdate(selectedItem, highlightedText, uploadedFiles);
      setNewUpdate('');
      setUploadedFiles([]);
    }
  };

  // ============================================================
  // 🔥 HIGHLIGHT MENTION
  // ============================================================
  const highlightMentions = (text) => {
    // Ubah @username menjadi <span class="mention">@username</span>
    return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  };

  // ============================================================
  // 🔥 RENDER TEXT WITH MENTION
  // ============================================================
  const renderTextWithMentions = (text) => {
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
  // 🔥 REPLY HANDLER
  // ============================================================
  const handleReplySubmit = (updateId) => {
    if (replyText.trim()) {
      addReply(updateId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
    }
  };

  // ============================================================
  // 🔥 FORMAT FILE SIZE
  // ============================================================
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
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

        {/* Update List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div ref={topRef} />

          {sortedUpdates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#999',
              padding: '40px 20px',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
              <p style={{ margin: 0, fontWeight: 500 }}>No updates yet</p>
              <p style={{ fontSize: '13px', margin: '4px 0 0' }}>
                Share progress or mention a teammate
              </p>
            </div>
          ) : (
            sortedUpdates.map((update) => (
              <div key={update.id} style={{
                padding: '12px 16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '3px solid #4CAF50',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: '#333' }}>
                    {update.author}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#999' }}>
                    {new Date(update.timestamp).toLocaleString()}
                  </span>
                </div>
                
                {/* 🔥 Text dengan mention highlight */}
                <p style={{ margin: '6px 0 8px', fontSize: '14px', color: '#333', wordWrap: 'break-word' }}>
                  {renderTextWithMentions(update.text)}
                </p>

                {/* 🔥 Tampilkan file yang diupload */}
                {update.files && update.files.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                          <div style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden' }}>
                            <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <span>📄</span>
                        )}
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <span style={{ fontSize: '10px', color: '#999' }}>
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
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
                          {renderTextWithMentions(reply.text)}
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
            ))
          )}
        </div>

        {/* ============================================================
            🔥 INPUT - DENGAN UPLOAD & MENTION
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
                  {file.type && file.type.startsWith('image/') ? (
                    <span>🖼️</span>
                  ) : (
                    <span>📄</span>
                  )}
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {/* Tombol Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
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
            </div>

            <input
              ref={inputRef}
              type="text"
              value={newUpdate}
              onChange={handleMention}
              placeholder="Write an update and mention others with @"
              style={{
                flex: 1,
                minWidth: '150px',
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
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#999', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>💡 Press Enter to send</span>
            <span>📎 Upload images or files</span>
            <span>@ Mention someone</span>
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
        .mention {
          color: #1a73e8;
          background: #e8f0fe;
          padding: 0 4px;
          border-radius: 4px;
          font-weight: 500;
        }
      `}</style>
    </>
  );
};

export default UpdatePanel;
