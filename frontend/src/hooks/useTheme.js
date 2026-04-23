import React from 'react';

export function useTheme() {
  const [isDark, setIsDark] = React.useState(
    () => document.documentElement.classList.contains('dark')
  );

  const toggle = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      html.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  return { isDark, toggle };
}
