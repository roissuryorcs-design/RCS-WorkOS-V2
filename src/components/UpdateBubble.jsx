import React from 'react';
import { useUpdates } from '../context/UpdateContext';

const UpdateBubble = ({ itemId }) => {
  const { openPanel, getItemUpdates } = useUpdates();
  const updates = getItemUpdates(itemId);
  const count = updates.length;

  return (
    <button
      onClick={() => openPanel(itemId)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '12px',
        border: 'none',
        background: count > 0 ? '#e8f5e9' : 'transparent',
        color: count > 0 ? '#2e7d32' : '#999',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f0f0f0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = count > 0 ? '#e8f5e9' : 'transparent';
      }}
    >
      💬 {count > 0 && <span>{count}</span>}
    </button>
  );
};

export default UpdateBubble;
