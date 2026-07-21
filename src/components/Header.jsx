import React, { useState, useEffect } from 'react';

const Header = ({ groups }) => {
  // 1. 🔥 LOAD DARI LOCALSTORAGE - PASTI
  const [title, setTitle] = useState(() => {
    const saved = localStorage.getItem('forelBoardTitle');
    console.log('🔵 Load title from localStorage:', saved);
    return saved !== null && saved !== '' ? saved : 'BOARD TITLE';
  });

  const [subtitle, setSubtitle] = useState(() => {
    const saved = localStorage.getItem('forelBoardSubtitle');
    console.log('🔵 Load subtitle from localStorage:', saved);
    return saved !== null && saved !== '' ? saved : 'Sub Title / Description';
  });

  // 2. 🔥 SIMPAN KE LOCALSTORAGE SETIAP BERUBAH
  useEffect(() => {
    console.log('💾 Saving title:', title);
    localStorage.setItem('forelBoardTitle', title);
  }, [title]);

  useEffect(() => {
    console.log('💾 Saving subtitle:', subtitle);
    localStorage.setItem('forelBoardSubtitle', subtitle);
  }, [subtitle]);

  // 3. 🔥 RESET JIKA GROUP KOSONG
  useEffect(() => {
    const hasGroups = groups && groups.length > 0;
    if (!hasGroups) {
      console.log('🔄 No groups, resetting to default');
      setTitle('BOARD TITLE');
      setSubtitle('Sub Title / Description');
      localStorage.setItem('forelBoardTitle', 'BOARD TITLE');
      localStorage.setItem('forelBoardSubtitle', 'Sub Title / Description');
    }
  }, [groups]);

  // 4. HANDLE BLUR - SIMPAN SAAT EDIT SELESAI
  const handleTitleBlur = (e) => {
    // Ambil teks dari firstChild (abaikan span icon)
    const textNode = e.currentTarget.firstChild;
    const newText = textNode ? textNode.textContent.trim() : e.currentTarget.textContent.trim();
    // Bersihkan dari karakter ✎
    const cleanText = newText.replace(/✎/g, '').trim();
    console.log('📝 Title blurred, new text:', cleanText);
    if (cleanText) {
      setTitle(cleanText);
    }
  };

  const handleSubtitleBlur = (e) => {
    const textNode = e.currentTarget.firstChild;
    const newText = textNode ? textNode.textContent.trim() : e.currentTarget.textContent.trim();
    const cleanText = newText.replace(/✎/g, '').trim();
    console.log('📝 Subtitle blurred, new text:', cleanText);
    if (cleanText) {
      setSubtitle(cleanText);
    }
  };

  // 5. HANDLE KEYDOWN - ENTER UNTUK SELESAI EDIT
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="header-sticky">
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
          position: 'relative',
        }}
      >
        {title}
        <span
          className="header-edit-icon"
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginLeft: '8px',
            fontWeight: 400,
            opacity: 0.5,
            transition: 'opacity 0.2s ease',
            display: 'inline-block',
          }}
        >
          ✎
        </span>
      </h1>

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
          position: 'relative',
          display: 'inline-block',
          margin: 0,
        }}
      >
        {subtitle}
        <span
          className="header-edit-icon"
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginLeft: '6px',
            fontWeight: 400,
            opacity: 0.5,
            transition: 'opacity 0.2s ease',
            display: 'inline-block',
          }}
        >
          ✎
        </span>
      </p>
    </div>
  );
};

export default Header;
