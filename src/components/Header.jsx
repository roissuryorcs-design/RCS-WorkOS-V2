import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useMobileNav } from '../context/MobileNavContext';

// title/subtitle now live in the `boards` table (columns existed since
// Phase 1 but were never wired up — this component was still 100%
// localStorage, so collaborators never saw each other's board title at
// all). Loaded per boardId + kept live via Realtime, same pattern as
// every other Supabase-backed context in this app.
const Header = ({ groups = [], boardId, isReady = true }) => {
  const { t } = useLanguage();
  const { setSidebarOpen } = useMobileNav();
  const [title, setTitle] = useState(t('defaults.boardTitle'));
  const [subtitle, setSubtitle] = useState(t('defaults.boardSubtitle'));

  // 🔥 FLAG UNTUK MENCEGAH RESET SAAT REFRESH
  const isInitial = useRef(true);

  // 1. LOAD DARI SUPABASE
  useEffect(() => {
    let cancelled = false;
    isInitial.current = true;
    Promise.all([
      supabase.from('boards').select('title, subtitle').eq('id', boardId).single(),
      // Fallback source when title was never set (e.g. legacy-imported
      // boards whose old in-page title was left blank) — the sidebar
      // name is a far more useful default than a generic placeholder.
      supabase.from('nodes').select('name').eq('id', boardId).single(),
    ]).then(([{ data, error }, { data: nodeData }]) => {
      if (cancelled) return;
      if (error) {
        console.error('Error loading board header:', error);
        return;
      }
      if (data) {
        const fallbackTitle = (nodeData && nodeData.name) || t('defaults.boardTitle');
        setTitle(data.title && data.title.trim() !== '' ? data.title : fallbackTitle);
        setSubtitle(data.subtitle && data.subtitle.trim() !== '' ? data.subtitle : t('defaults.boardSubtitle'));
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // 2. REALTIME — pick up title/subtitle edits from other collaborators.
  useEffect(() => {
    if (!boardId) return;
    const channel = supabase
      .channel(`board-header:${boardId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${boardId}` },
        (payload) => {
          if (payload.new.title != null) setTitle(payload.new.title);
          if (payload.new.subtitle != null) setSubtitle(payload.new.subtitle);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const persistTitle = (val) => {
    setTitle(val);
    supabase.from('boards').update({ title: val }).eq('id', boardId).then(({ error }) => {
      if (error) console.error('Error updating board title:', error);
    });
  };

  const persistSubtitle = (val) => {
    setSubtitle(val);
    supabase.from('boards').update({ subtitle: val }).eq('id', boardId).then(({ error }) => {
      if (error) console.error('Error updating board subtitle:', error);
    });
  };

  // 3. LOGIKA RESET - HANYA JIKA USER MENGHAPUS SEMUA GROUP
  useEffect(() => {
    // Belum siap (board masih loading) - jangan sentuh apa pun
    if (!isReady) return;
    // Jika baru pertama kali render (refresh), skip reset
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    // Hanya reset jika groups benar-benar kosong setelah loading selesai
    if (groups.length === 0) {
      const defaultTitle = t('defaults.boardTitle');
      const defaultSubtitle = t('defaults.boardSubtitle');
      persistTitle(defaultTitle);
      persistSubtitle(defaultSubtitle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, isReady, boardId]);

  // 4. HANDLE BLUR
  const handleBlur = (e, persister, current) => {
    const val = e.currentTarget.innerText.replace(/✎/g, '').trim();
    if (val) {
      persister(val);
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
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label={t('sidebar.openMenu')}>
        ☰
      </button>
      {/* TITLE */}
      <h1
        contentEditable={true}
        suppressContentEditableWarning={true}
        spellCheck={false}
        onBlur={(e) => handleBlur(e, persistTitle, title)}
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
          onBlur={(e) => handleBlur(e, persistSubtitle, subtitle)}
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
