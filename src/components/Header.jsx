import React, { useState, useEffect, useRef } from 'react';

const Header = ({ groups }) => {
  // 1. LOAD DARI LOCALSTORAGE
  const [title, setTitle] = useState(() => {
    const saved = localStorage.getItem('forelBoardTitle');
    return saved && saved.trim() !== '' ? saved : 'BOARD TITLE';
  });

  const [subtitle, setSubtitle] = useState(() => {
    const saved = localStorage.getItem('forelBoardSubtitle');
    return saved && saved.trim() !== '' ? saved : 'Sub Title / Description';
  });

  // 2. REF UNTUK ELEMENT
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  // 3. SIMPAN KE LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem('forelBoardTitle', title);
  }, [title]);

  useEffect(() => {
    localStorage.setItem('forelBoardSubtitle', subtitle);
  }, [subtitle]);

  // 4. RESET JIKA GROUP KOSONG - DENGAN GUARD
  useEffect(() => {
    // 🔥 GUARD: Hanya reset jika groups SUDAH TERDEFINISI dan kosong
    // Jangan reset jika groups undefined/null (belum load)
    if (groups !== undefined && groups !== null && groups.length === 0) {
      console.log('🔄 No groups found, resetting header to default');
      setTitle('BOARD TITLE');
      setSubtitle('Sub Title / Description');
      localStorage.setItem('forelBoardTitle', 'BOARD TITLE');
      localStorage.setItem('forelBoardSubtitle', 'Sub Title / Description');
    }
  }, [groups]);

  // 5. HANDLE BLUR - VERSI AMAN
  const handleTitleBlur = (e) => {
    const element = e.currentTarget;
    // Gunakan innerText untuk menghindari konflik DOM
    const cleanText = element.innerText.replace(/✎/g, '').trim();
    
    if (cleanText) {
      setTitle(cleanText);
    } else {
      // Jika user menghapus semua teks, kembalikan ke default
      element.innerText = title;
    }
  };

  const handleSubtitleBlur = (e) => {
    const element = e.currentTarget;
    const cleanText = element.innerText.replace(/✎/g, '').trim();
    
    if (cleanText) {
      setSubtitle(cleanText);
    } else {
      element.innerText = subtitle;
    }
  };

  // 6. HANDLE KEYDOWN
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="header-sticky" style={{ padding: '16px 24px' }}>
      {/* TITLE */}
      <h1
        ref={titleRef}
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
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--text-primary, #333)',
        }}
      >
        {title}
        <span
          contentEditable={false}
          style={{
            fontSize: '14px',
            color: '#8a94a6',
            marginLeft: '8px',
            fontWeight: 400,
            opacity: 0.6,
            display: 'inline-block',
            pointerEvents: 'none',
          }}
        >
          ✎
        </span>
      </h1>

      {/* SUBTITLE */}
      <div style={{ marginTop: '4px' }}>
        <p
          ref={subtitleRef}
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
            fontSize: '14px',
            color: 'var(--text-secondary, #8a94a6)',
          }}
        >
          {subtitle}
          <span
            contentEditable={false}
            style={{
              fontSize: '12px',
              marginLeft: '6px',
              opacity: 0.6,
              display: 'inline-block',
              pointerEvents: 'none',
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
