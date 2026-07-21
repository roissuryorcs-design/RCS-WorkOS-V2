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

  // 4. RESET JIKA GROUP KOSONG
  useEffect(() => {
    const hasGroups = groups && groups.length > 0;
    if (!hasGroups) {
      setTitle('BOARD TITLE');
      setSubtitle('Sub Title / Description');
      localStorage.setItem('forelBoardTitle', 'BOARD TITLE');
      localStorage.setItem('forelBoardSubtitle', 'Sub Title / Description');
    }
  }, [groups]);

  // 5. HANDLE BLUR
  const handleTitleBlur = () => {
    if (titleRef.current) {
      // Ambil teks dari firstChild (abaikan span)
      const textNode = titleRef.current.firstChild;
      const newText = textNode ? textNode.textContent.trim() : titleRef.current.textContent.trim();
      const cleanText = newText.replace(/✎/g, '').trim();
      if (cleanText && cleanText !== title) {
        setTitle(cleanText);
      }
    }
  };

  const handleSubtitleBlur = () => {
    if (subtitleRef.current) {
      const textNode = subtitleRef.current.firstChild;
      const newText = textNode ? textNode.textContent.trim() : subtitleRef.current.textContent.trim();
      const cleanText = newText.replace(/✎/g, '').trim();
      if (cleanText && cleanText !== subtitle) {
        setSubtitle(cleanText);
      }
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
    <div className="header-sticky" style={{ padding: '20px', borderBottom: '1px solid #333' }}>
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
          position: 'relative',
          fontSize: '24px',
          fontWeight: 700,
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
