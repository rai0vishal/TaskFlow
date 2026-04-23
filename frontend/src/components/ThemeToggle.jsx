import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize based on the class set by the inline script in index.html
    setIsDark(document.documentElement.classList.contains('dark'));
    
    // Optional: observer in case theme changes from other tabs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    const dark = html.classList.toggle('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    setIsDark(dark);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      style={{
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-bg-surface)',
        border: '0.5px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
      className="group theme-icon hover:bg-primary-light hover:border-primary"
    >
      {isDark ? (
        <Sun 
          size={18} 
          className="text-text-muted group-hover:text-primary transition-colors duration-150"
        />
      ) : (
        <Moon 
          size={18} 
          className="text-text-muted group-hover:text-primary transition-colors duration-150"
        />
      )}
    </button>
  );
}
