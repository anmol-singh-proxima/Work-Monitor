import { useEffect, useState } from 'react';

const storageKey = 'work-monitor-theme';

function getInitialTheme() {
  const applied = document.documentElement.dataset.theme;
  if (applied === 'light' || applied === 'dark') {
    return applied;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (error) {
      /* localStorage unavailable (private browsing, etc.) — theme just won't persist */
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  return { theme, toggleTheme };
}
