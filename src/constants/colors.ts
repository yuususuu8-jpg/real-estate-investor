// Primary colors based on design system
export const COLORS = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB', // Primary Blue
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  success: {
    DEFAULT: '#10B981',
    light: '#D1FAE5',
    dark: '#065F46',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
    dark: '#92400E',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
    dark: '#991B1B',
  },
  info: {
    DEFAULT: '#3B82F6',
    light: '#DBEAFE',
    dark: '#1E40AF',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

// Light theme colors
export const lightColors = {
  primary: COLORS.primary[600],
  primaryLight: COLORS.primary[100],
  secondary: COLORS.primary[500],
  background: COLORS.gray[50],
  surface: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: COLORS.gray[900],
  textSecondary: COLORS.gray[500],
  textDisabled: COLORS.gray[400],
  border: COLORS.gray[200],
  borderDark: COLORS.gray[300],
  divider: COLORS.gray[200],
  success: COLORS.success.DEFAULT,
  successBackground: COLORS.success.light,
  successLight: COLORS.success.light,
  warning: COLORS.warning.DEFAULT,
  warningBackground: COLORS.warning.light,
  error: COLORS.error.DEFAULT,
  errorBackground: COLORS.error.light,
  errorLight: COLORS.error.light,
  info: COLORS.info.DEFAULT,
  infoBackground: COLORS.info.light,
  card: '#FFFFFF',
  cardBackground: '#FFFFFF',
  cardBorder: COLORS.gray[200],
  inputBackground: COLORS.gray[50],
  tabBarBackground: '#FFFFFF',
  tabBarBorder: COLORS.gray[200],
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
};

// Dark theme colors
export const darkColors = {
  primary: COLORS.primary[400],
  primaryLight: COLORS.primary[900],
  secondary: COLORS.primary[400],
  background: '#0F172A',
  surface: '#1E293B',
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textDisabled: '#64748B',
  border: '#334155',
  borderDark: '#475569',
  divider: '#334155',
  success: '#34D399',
  successBackground: '#064E3B',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningBackground: '#78350F',
  error: '#F87171',
  errorBackground: '#7F1D1D',
  errorLight: '#7F1D1D',
  info: '#60A5FA',
  infoBackground: '#1E3A8A',
  card: '#1E293B',
  cardBackground: '#1E293B',
  cardBorder: '#334155',
  inputBackground: '#0F172A',
  tabBarBackground: '#1E293B',
  tabBarBorder: '#334155',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
};

// Simple color access for common usage (default light theme - for backward compatibility)
export const colors = lightColors;

// Theme-aware colors type
export type ThemeColors = typeof lightColors;

// Get colors based on theme
export const getThemeColors = (isDark: boolean): ThemeColors => {
  return isDark ? darkColors : lightColors;
};
