jsx
import React, { useState, useEffect } from 'react';

const Header = ({ groups }) => {
  // 1. LOAD DARI LOCALSTORAGE
  // Menggunakan lazy initializer agar hanya berjalan sekali saat refresh
  const [title, setTitle] = useState(() => {
    const saved = localStorage.getItem('forelBoardTitle');
    return saved && saved.trim() !== '' ? saved : 'BOARD TITLE';
  });

  const [subtitle, setSubtitle] = useState(() => {
    const saved = localStorage.getItem('forelBoardSubtitle');
    return saved && saved.trim() !== '' ? saved : 'Sub Title / Description';
  });

  // 2. SIMPAN KE LOCALSTORAGE SETIAP KALI STATE BERUBAH
  useEffect(() => {
    if (title !== 'BOARD TITLE') { // Opsional: jangan simpan jika masih default
      localStorage.setItem('forelBoardTitle', title);
    }
  }, [title]);

  useEffect(() => {
    if (subtitle !== 'Sub Title / Description') {
      localStorage.setItem('forelBoardSubtitle', subtitle);
    }
  }, [subtitle]);

  // 3. LOGIKA HANDLE EDIT (BLUR)
  const handleTitleBlur = (e) => {
    // Mengambil teks saja, mengabaikan elemen <span> ikon pensil
    const newText = e.currentTarget.firstChild ? e.currentTarget.firstChild.textContent.trim() : '';
    const cleanText = newText.replace(/✎/g, '').trim();
    
    if (cleanText && cleanText !== title) {
      setTitle(cleanText);
    }
  };

  const handleSubtitleBlur = (e) => {
    const newText = e.currentTarget.firstChild ? e.currentTarget.firstChild.textContent.trim() : '';
    const cleanText = newText.replace(/✎/g, '').trim();
    
    if (cleanText && cleanText !== subtitle) {
      setSubtitle(cleanText);
    }
  };

  // 4. HANDLE ENTER UNTUK SELESAI EDIT
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="header-sticky" style={{ padding: '20px', borderBottom: '1px solid #333' }}>
      <h1
        className="header-title"
        contentEditable={true}
        onBlur={handleTitleBlur}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning={true}
        spellCheck={false}
        style={{
          cursor: 'text',
          outline: 'none',
          padding: '2px 4px',
          borderRadius: '4px',
          display: 'inline-block',
          margin: 0,
          position: 'relative'
        }}
      >
        {title}
        <span
          className="header-edit-icon"
          contentEditable={false} // Pastikan ikon tidak bisa diedit
          style={{
            fontSize: '14px',
            color: 'var(--text-muted, #8a94a6)',
            marginLeft: '8px',
            fontWeight: 400,
            opacity: 0.6,
            display: 'inline-block',
            pointerEvents: 'none' // Agar tidak mengganggu klik pada teks
          }}
        >
          ✎
        </span>
      </h1>

      <div style={{ marginTop: '4px' }}>
        <p
          className="header-subtitle"
          contentEditable={true}
          onBlur={handleSubtitleBlur}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning={true}
          spellCheck={false}
          style={{
            cursor: 'text',
            outline: 'none',
            padding: '2px 4px',
            borderRadius: '4px',
            display: 'inline-block',
            margin: 0,
            color: 'var(--text-muted, #8a94a6)'
          }}
        >
          {subtitle}
          <span
            className="header-edit-icon"
            contentEditable={false}
            style={{
              fontSize: '12px',
              marginLeft: '6px',
              opacity: 0.6,
              display: 'inline-block',
              pointerEvents: 'none'
            }}
          >
            ✎
          </span>
        </p>
      </div>
    </div>
  );
};

export default Header;
