import React from 'react';
import { LayoutGrid } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ 
  icon: Icon = LayoutGrid, 
  title = "No data found", 
  description = "There are no items to display at the moment.",
  actionLabel,
  onAction,
  className = ""
}) {
  return (
    <div 
      className={`flex flex-col items-center justify-center ${className}`}
      style={{
        background: 'transparent',
        border: '1.5px dashed var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '60px 24px',
        textAlign: 'center'
      }}
    >
      <div className="w-16 h-16 rounded-2xl bg-bg-surface flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-text-muted" />
      </div>
      <h3 style={{ color: 'var(--color-text-heading)', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', maxWidth: '320px', margin: '0 auto 16px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction} 
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            marginTop: '16px',
            cursor: 'pointer'
          }}
          className="hover:opacity-90 transition-opacity active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
