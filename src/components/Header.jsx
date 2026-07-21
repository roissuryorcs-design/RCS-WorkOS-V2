import React, { useState, useEffect } from 'react';

const Header = () => {
  // 1. Inisialisasi State dari LocalStorage agar data awet saat refresh
  const [title, setTitle] = useState(() => {
    return localStorage.getItem('forelBoardTitle') || 'BOARD TITLE';
  });

  const [subtitle, setSubtitle] = useState(() => {
    return localStorage.getItem('forelBoardSubtitle') || 'Sub Title / Description';
  });

  // 2. Fungsi untuk menyimpan perubahan Title
  const handleTitleBlur = (e) => {
    // Ambil teks dari element, exclude span ikon
    const textNode = e.currentTarget.firstChild;
    const newText = textNode ? textNode.textContent.trim() : e.currentTarget.textContent.trim();
    // Bersihkan karakter pensil jika ikut terbawa
    const cleanText = newText.replace(/✎/g, '').trim();
    if (cleanText) {
      setTitle(cleanText);
      localStorage.setItem('forelBoardTitle', cleanText);
      console.log('✅ Title saved:', cleanText);
    }
  };

  // 3. Fungsi untuk menyimpan perubahan Subtitle
  const handleSubtitleBlur = (e) => {
    const textNode = e.currentTarget.firstChild;
    const newText = textNode ? textNode.textContent.trim() : e.currentTarget.textContent.trim();
    const cleanText = newText.replace(/✎/g, '').trim();
    if (cleanText) {
      setSubtitle(cleanText);
      localStorage.setItem('forelBoardSubtitle', cleanText);
      console.log('✅ Subtitle saved:', cleanText);
    }
  };

  // 4. Mencegah baris baru saat tekan Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="header-sticky">
      {/* BAGIAN JUDUL */}
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

      {/* BAGIAN SUBTITLE */}
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
