import React, { useState, useEffect, useRef } from 'react';

const Header = ({ groups = [] }) => {
  // 1. LOAD DARI LOCALSTORAGE
  const [title, setTitle] = useState(() => {
    const saved = localStorage.getItem('forelBoardTitle');
    return saved && saved.trim() !== '' ? saved : 'BOARD TITLE';
  });

  const [subtitle, setSubtitle] = useState(() => {
    const saved = localStorage.getItem('forelBoardSubtitle');
    return saved && saved.trim() !== '' ? saved : 'Sub Title / Description';
  });

  // 🔥 FLAG UNTUK MENCEGAH RESET SAAT REFRESH
  const isInitial = useRef(true);

  // 2. SIMPAN KE LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem('forelBoardTitle', title);
  }, [title]);

  useEffect(() => {
    localStorage.setItem('forelBoardSubtitle', subtitle);
  }, [subtitle]);

  // 3. LOGIKA RESET - HANYA JIKA USER MENGHAPUS SEMUA GROUP
  useEffect(() => {
    // Jika baru pertama kali render (refresh), skip reset
    if (isInitial.current) {
      isInitial.current = false;
      console.log('🔄 Initial render, skipping reset');
      return;
    }
    // Hanya reset jika groups benar-benar kosong setelah loading selesai
    if (groups.length === 0) {
      console.log('🔄 No groups found, resetting header to default');
      setTitle('BOARD TITLE');
      setSubtitle('Sub Title / Description');
      localStorage.setItem('forelBoardTitle', 'BOARD TITLE');
      localStorage.setItem('forelBoardSubtitle', 'Sub Title / Description');
    }
  }, [groups]);

  // 4. HANDLE BLUR
  const handleBlur = (e, setter, current) => {
    const val = e.currentTarget.innerText.replace(/✎/g, '').trim();
    if (val) {
      setter(val);
    } else {
      e.currentTarget.innerText = current;
    }
  };

  // 5. HANDLE KEYDOWN
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  // 6. STYLE
  const style = {
    cursor: 'text',
    outline: 'none',
    display: 'inline-block',
    margin: 0,
  };

  return (
    <div className="header-sticky" style={{ padding: '16px 24px' }}>
      {/* TITLE */}
      <h1
        contentEditable={true}
        suppressContentEditableWarning={true}
        spellCheck={false}
        onBlur={(e) => handleBlur(e, setTitle, title)}
        onKeyDown={handleKeyDown}
        style={{
          ...style,
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
            opacity: 0.5,
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
          contentEditable={true}
          suppressContentEditableWarning={true}
          spellCheck={false}
          onBlur={(e) => handleBlur(e, setSubtitle, subtitle)}
          onKeyDown={handleKeyDown}
          style={{
            ...style,
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
              opacity: 0.5,
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
