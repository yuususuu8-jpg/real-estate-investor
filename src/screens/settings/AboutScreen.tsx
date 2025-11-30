import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface AboutScreenProps {
  onGoBack: () => void;
}

export default function AboutScreen({ onGoBack }: AboutScreenProps) {
  const { colors } = useTheme();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const appInfo = {
    name: '不動産投資家アプリ',
    version: '1.0.0',
    buildNumber: '1',
  };

  const handleOpenURL = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>アプリについて</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="home-analytics" size={48} color={colors.white} />
          </View>
          <Text style={styles.appName}>{appInfo.name}</Text>
          <Text style={styles.version}>
            バージョン {appInfo.version} ({appInfo.buildNumber})
          </Text>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.description}>
            不動産投資家アプリは、不動産投資の収益性を簡単に計算・分析できるツールです。
            表面利回り、実質利回り、キャッシュフローなどの重要な投資指標を素早く算出し、
            投資判断をサポートします。
          </Text>
        </View>

        <Text style={styles.sectionTitle}>機能</Text>
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="calculator" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureLabel}>収益計算</Text>
              <Text style={styles.featureDescription}>利回り・キャッシュフローを自動計算</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="map-marker" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureLabel}>都道府県別概算</Text>
              <Text style={styles.featureDescription}>固定資産税・火災保険を自動概算</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="cloud-sync" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureLabel}>クラウド同期</Text>
              <Text style={styles.featureDescription}>複数デバイスでデータを共有</Text>
            </View>
          </View>
          <View style={[styles.featureItem, styles.lastItem]}>
            <MaterialCommunityIcons name="history" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureLabel}>計算履歴</Text>
              <Text style={styles.featureDescription}>過去の計算結果を保存・比較</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>開発者情報</Text>
        <View style={styles.developerContainer}>
          <View style={styles.developerItem}>
            <Text style={styles.developerLabel}>開発</Text>
            <Text style={styles.developerValue}>不動産投資家アプリ開発チーム</Text>
          </View>
          <View style={[styles.developerItem, styles.lastItem]}>
            <Text style={styles.developerLabel}>お問い合わせ</Text>
            <TouchableOpacity onPress={() => handleOpenURL('mailto:support@example.com')}>
              <Text style={styles.developerLink}>support@example.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.copyrightSection}>
          <Text style={styles.copyright}>
            © 2024 不動産投資家アプリ. All rights reserved.
          </Text>
        </View>
      </ScrollView>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  descriptionSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  featuresContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  featureText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  developerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  developerItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  developerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  developerValue: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  developerLink: {
    fontSize: 15,
    color: colors.primary,
  },
  copyrightSection: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  copyright: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
