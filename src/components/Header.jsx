import React, { useState, useEffect, useRef } from 'react';
import { boardKey } from '../utils/boardStorage';
import { useLanguage } from '../context/LanguageContext';

const Header = ({ groups = [], boardId, isReady = true }) => {
  const { t } = useLanguage();
  // 1. LOAD DARI LOCALSTORAGE
  const [title, setTitle] = useState(() => {
    const saved = localStorage.getItem(boardKey('forelBoardTitle', boardId));
    return saved && saved.trim() !== '' ? saved : t('defaults.boardTitle');
  });

  const [subtitle, setSubtitle] = useState(() => {
    const saved = localStorage.getItem(boardKey('forelBoardSubtitle', boardId));
    return saved && saved.trim() !== '' ? saved : t('defaults.boardSubtitle');
  });

  // 🔥 FLAG UNTUK MENCEGAH RESET SAAT REFRESH
  const isInitial = useRef(true);

  // 2. SIMPAN KE LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem(boardKey('forelBoardTitle', boardId), title);
  }, [title, boardId]);

  useEffect(() => {
    localStorage.setItem(boardKey('forelBoardSubtitle', boardId), subtitle);
  }, [subtitle, boardId]);

  // 3. LOGIKA RESET - HANYA JIKA USER MENGHAPUS SEMUA GROUP
  useEffect(() => {
    // Belum siap (board masih loading) - jangan sentuh apa pun
    if (!isReady) return;
    // Jika baru pertama kali render (refresh), skip reset
    if (isInitial.current) {
      isInitial.current = false;
      console.log('🔄 Initial render, skipping reset');
      return;
    }
    // Hanya reset jika groups benar-benar kosong setelah loading selesai
    if (groups.length === 0) {
      console.log('🔄 No groups found, resetting header to default');
      const defaultTitle = t('defaults.boardTitle');
      const defaultSubtitle = t('defaults.boardSubtitle');
      setTitle(defaultTitle);
      setSubtitle(defaultSubtitle);
      localStorage.setItem(boardKey('forelBoardTitle', boardId), defaultTitle);
      localStorage.setItem(boardKey('forelBoardSubtitle', boardId), defaultSubtitle);
    }
  }, [groups, isReady, boardId]);

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
