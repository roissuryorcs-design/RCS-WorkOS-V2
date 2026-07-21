jsx
import React, { useState, useEffect, useRef } from 'react';

const Header = ({ groups = [] }) => {
  // 1. LOAD DATA DARI LOCALSTORAGE
  const [title, setTitle] = useState(() => {
    const saved = localStorage.getItem('forelBoardTitle');
    return saved && saved.trim() !== '' ? saved : 'BOARD TITLE';
  });

  const [subtitle, setSubtitle] = useState(() => {
    const saved = localStorage.getItem('forelBoardSubtitle');
    return saved && saved.trim() !== '' ? saved : 'Sub Title / Description';
  });

  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  // 2. SIMPAN KE LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem('forelBoardTitle', title);
  }, [title]);

  useEffect(() => {
    localStorage.setItem('forelBoardSubtitle', subtitle);
  }, [subtitle]);

  // 3. RESET JIKA GROUP KOSONG
  useEffect(() => {
    if (!groups || groups.length === 0) {
      setTitle('BOARD TITLE');
      setSubtitle('Sub Title / Description');
    }
  }, [groups]);

  // 4. HANDLE BLUR (UPDATE STATE)
  const handleBlur = (ref, setter, currentState) => {
    if (ref.current) {
      // Mengambil text content saja, mengabaikan element span (pencil icon)
      const fullText = ref.current.innerText || ref.current.textContent;
      const cleanText = fullText.replace(/✎/g, '').trim();

      if (cleanText && cleanText !== currentState) {
        setter(cleanText);
      } else {
        // Jika kosong, kembalikan ke state awal di dalam DOM
        ref.current.firstChild.textContent = currentState;
      }
    }
  };

  // 5. PREVENT RICH TEXT PASTE
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <header 
      className="header-sticky" 
      style={{ 
        padding: '20px', 
        borderBottom: '1px solid #333',
        display: 'block' 
      }}
    >
      {/* TITLE CONTAINER */}
      <h1
        ref={titleRef}
        className="header-title"
        contentEditable={true}
        suppressContentEditableWarning={true}
        spellCheck={false}
        onBlur={() => handleBlur(titleRef, setTitle, title)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        style={{
          cursor: 'text',
          outline: 'none',
          padding: '2px 4px',
          borderRadius: '4px',
          display: 'inline-block',
          margin: 0,
          position: 'relative',
          fontSize: '24px',
          fontWeight: 700,
          color: '#e8edf5', // Berdasarkan computed style
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
            userSelect: 'none'
          }}
        >
          ✎
        </span>
      </h1>

      {/* SUBTITLE CONTAINER */}
      <div style={{ marginTop: '4px' }}>
        <p
          ref={subtitleRef}
          className="header-subtitle"
          contentEditable={true}
          suppressContentEditableWarning={true}
          spellCheck={false}
          onBlur={() => handleBlur(subtitleRef, setSubtitle, subtitle)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          style={{
            cursor: 'text',
            outline: 'none',
            padding: '2px 4px',
            borderRadius: '4px',
            display: 'inline-block',
            margin: 0,
            color: '#8a94a6',
            fontSize: '14px',
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
              userSelect: 'none'
            }}
          >
            ✎
          </span>
        </p>
      </div>
    </header>
  );
};

export default Header;
