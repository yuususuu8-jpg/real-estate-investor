import React, { useState, useMemo } from 'react';
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

interface LanguageScreenProps {
  onGoBack: () => void;
}

type LanguageOption = 'ja' | 'en';

export default function LanguageScreen({ onGoBack }: LanguageScreenProps) {
  const { colors } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>('ja');

  const styles = useMemo(() => createStyles(colors), [colors]);

  const languageOptions: { key: LanguageOption; label: string; nativeLabel: string }[] = [
    {
      key: 'ja',
      label: '日本語',
      nativeLabel: '日本語',
    },
    {
      key: 'en',
      label: '英語',
      nativeLabel: 'English',
    },
  ];

  const handleSelectLanguage = (language: LanguageOption) => {
    setSelectedLanguage(language);
    // TODO: Implement language persistence and actual language switching
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>言語</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>表示言語</Text>
        <View style={styles.optionsContainer}>
          {languageOptions.map((option, index) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionItem,
                index === languageOptions.length - 1 && styles.lastItem,
                selectedLanguage === option.key && styles.optionItemSelected,
              ]}
              onPress={() => handleSelectLanguage(option.key)}
            >
              <View style={styles.optionText}>
                <Text style={[
                  styles.optionLabel,
                  selectedLanguage === option.key && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.optionNativeLabel}>{option.nativeLabel}</Text>
              </View>
              {selectedLanguage === option.key && (
                <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.noteContainer}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.noteText}>
            英語対応は現在開発中です。近日中に対応予定です。
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
  lastItem: {
    borderBottomWidth: 0,
  },
  optionItemSelected: {
    backgroundColor: colors.primaryLight,
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
  optionNativeLabel: {
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
