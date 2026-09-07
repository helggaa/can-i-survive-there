// src/components/ThemeToggle.tsx
// Accessible and tactile Dark / Light mode toggle button

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      <div className="theme-toggle-icon-wrap">
        {theme === 'light' ? (
          <Moon size={16} className="theme-icon moon" />
        ) : (
          <Sun size={16} className="theme-icon sun" />
        )}
      </div>
      <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  );
};

export default ThemeToggle;
