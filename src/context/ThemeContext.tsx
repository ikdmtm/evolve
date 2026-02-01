import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ColorScheme, darkColors, lightColors } from '../theme/colors';
import { SettingsRepository } from '../core/storage/SettingsRepository';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colors: ColorScheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [colors, setColors] = useState<ColorScheme>(darkColors);

  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    try {
      const settingsRepo = new SettingsRepository();
      const savedTheme = await settingsRepo.getTheme();
      applyTheme(savedTheme);
    } catch (error) {
      console.error('Failed to load theme:', error);
      // エラーの場合はデフォルトのダークテーマを使用
      applyTheme('dark');
    }
  }

  function applyTheme(newTheme: Theme) {
    setThemeState(newTheme);
    setColors(newTheme === 'dark' ? darkColors : lightColors);
  }

  async function setTheme(newTheme: Theme) {
    try {
      const settingsRepo = new SettingsRepository();
      await settingsRepo.setTheme(newTheme);
      applyTheme(newTheme);
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  }

  async function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    await setTheme(newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
