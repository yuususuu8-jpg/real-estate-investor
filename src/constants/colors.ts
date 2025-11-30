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
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
  },
  info: {
    DEFAULT: '#3B82F6',
    light: '#DBEAFE',
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

// Simple color access for common usage
export const colors = {
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
  warning: COLORS.warning.DEFAULT,
  warningBackground: COLORS.warning.light,
  error: COLORS.error.DEFAULT,
  errorBackground: COLORS.error.light,
  info: COLORS.info.DEFAULT,
  infoBackground: COLORS.info.light,
};
