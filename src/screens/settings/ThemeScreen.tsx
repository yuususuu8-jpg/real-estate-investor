import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface ThemeScreenProps {
  onGoBack: () => void;
}

type ThemeOption = 'light' | 'dark' | 'system';

export default function ThemeScreen({ onGoBack }: ThemeScreenProps) {
  const { colors, themeMode, setThemeMode } = useTheme();

  const themeOptions: { key: ThemeOption; label: string; icon: string; description: string }[] = [
    {
      key: 'light',
      label: 'ライトモード',
      icon: 'white-balance-sunny',
      description: '明るい背景に暗いテキスト',
    },
    {
      key: 'dark',
      label: 'ダークモード',
      icon: 'moon-waning-crescent',
      description: '暗い背景に明るいテキスト',
    },
    {
      key: 'system',
      label: 'システム設定に従う',
      icon: 'cellphone-cog',
      description: 'デバイスの設定に合わせて自動切替',
    },
  ];

  const handleSelectTheme = (theme: ThemeOption) => {
    setThemeMode(theme);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>テーマ</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>外観</Text>
        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionItem,
                themeMode === option.key && styles.optionItemSelected,
              ]}
              onPress={() => handleSelectTheme(option.key)}
            >
              <View style={styles.optionLeft}>
                <View style={[
                  styles.iconContainer,
                  themeMode === option.key && styles.iconContainerSelected,
                ]}>
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={24}
                    color={themeMode === option.key ? colors.white : colors.textSecondary}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[
                    styles.optionLabel,
                    themeMode === option.key && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </View>
              {themeMode === option.key && (
                <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.noteContainer}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.noteText}>
            設定は自動的に保存されます。アプリを再起動しても設定は維持されます。
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    gap: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
