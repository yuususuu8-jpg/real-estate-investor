import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  updateSystemTheme: () => void;
}

const getSystemTheme = () => Appearance.getColorScheme() === 'dark';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'light',
      isDark: false,
      setThemeMode: (mode: ThemeMode) => {
        const isDark = mode === 'system' ? getSystemTheme() : mode === 'dark';
        set({ themeMode: mode, isDark });
      },
      updateSystemTheme: () => {
        const { themeMode } = get();
        if (themeMode === 'system') {
          set({ isDark: getSystemTheme() });
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const isDark = state.themeMode === 'system'
            ? getSystemTheme()
            : state.themeMode === 'dark';
          state.isDark = isDark;
        }
      },
    }
  )
);
