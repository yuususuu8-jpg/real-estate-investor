import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface PrivacyPolicyScreenProps {
  onGoBack: () => void;
}

export default function PrivacyPolicyScreen({ onGoBack }: PrivacyPolicyScreenProps) {
  const { colors } = useTheme();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const lastUpdated = '2024年1月1日';

  const sections = [
    {
      title: '1. はじめに',
      content: '不動産投資家アプリ（以下「本アプリ」）は、お客様のプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーは、本アプリがどのような情報を収集し、どのように使用・保護するかについて説明します。',
    },
    {
      title: '2. 収集する情報',
      content: '本アプリでは以下の情報を収集することがあります：\n\n• メールアドレス（アカウント登録・認証用）\n• 計算データ（物件情報、収益計算結果など）\n• アプリの使用状況（匿名化された分析データ）',
    },
    {
      title: '3. 情報の使用目的',
      content: '収集した情報は以下の目的で使用されます：\n\n• アカウント管理およびサービスの提供\n• 計算データのクラウド保存・同期\n• サービスの改善・新機能の開発\n• カスタマーサポートの提供',
    },
    {
      title: '4. 情報の共有',
      content: '本アプリは、以下の場合を除き、お客様の個人情報を第三者と共有することはありません：\n\n• お客様の同意がある場合\n• 法令に基づく開示要請があった場合\n• サービス提供に必要なインフラ事業者との共有（Supabase等）',
    },
    {
      title: '5. データの保存',
      content: 'お客様のデータは、セキュリティ対策が施されたクラウドサーバー（Supabase）に保存されます。データは暗号化され、適切なアクセス制御により保護されています。',
    },
    {
      title: '6. データの削除',
      content: 'アカウントを削除すると、関連するすべてのデータが完全に削除されます。データの削除をご希望の場合は、アプリ内のプロフィール設定から行うか、サポートまでご連絡ください。',
    },
    {
      title: '7. Cookie・トラッキング',
      content: '本アプリでは、サービス改善のために匿名化された使用状況データを収集することがあります。これらのデータは個人を特定するものではなく、統計的な分析にのみ使用されます。',
    },
    {
      title: '8. お子様のプライバシー',
      content: '本アプリは、13歳未満のお子様を対象としたサービスではありません。13歳未満のお子様から意図的に個人情報を収集することはありません。',
    },
    {
      title: '9. ポリシーの変更',
      content: '本プライバシーポリシーは、必要に応じて更新されることがあります。重要な変更がある場合は、アプリ内通知またはメールでお知らせします。',
    },
    {
      title: '10. お問い合わせ',
      content: 'プライバシーポリシーに関するご質問やご意見がございましたら、以下までお問い合わせください：\n\nメール: support@example.com',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>プライバシーポリシー</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.updateInfo}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.textSecondary} />
          <Text style={styles.updateText}>最終更新日: {lastUpdated}</Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            本アプリをご利用いただくことで、本プライバシーポリシーに同意したものとみなされます。
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
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  updateText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
