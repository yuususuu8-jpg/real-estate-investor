import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { getThemeColors, ThemeColors } from '../constants/colors';

export interface UseThemeReturn {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

export function useTheme(): UseThemeReturn {
  const { themeMode, isDark, setThemeMode, updateSystemTheme } = useThemeStore();

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      updateSystemTheme();
    });

    return () => subscription.remove();
  }, [updateSystemTheme]);

  const colors = getThemeColors(isDark);

  return {
    colors,
    isDark,
    themeMode,
    setThemeMode,
  };
}
