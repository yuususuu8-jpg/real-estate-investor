import React, { useState, useMemo } from 'react';
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

interface HelpScreenProps {
  onGoBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpScreen({ onGoBack }: HelpScreenProps) {
  const { colors } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const faqItems: FAQItem[] = [
    {
      question: '表面利回りと実質利回りの違いは？',
      answer: '表面利回りは年間家賃収入÷物件価格で計算され、経費を考慮しない単純な指標です。実質利回りは経費（管理費、修繕費、固定資産税など）を差し引いた純収入で計算するため、より現実的な収益性を示します。',
    },
    {
      question: '空室率はどのように設定すればよいですか？',
      answer: '一般的には5〜10%程度を見込むことが多いです。立地や物件タイプによって異なりますが、保守的に見積もる場合は10%、好立地の場合は5%程度が目安です。',
    },
    {
      question: 'CCR（自己資金配当率）とは？',
      answer: 'CCR（Cash on Cash Return）は、投資した自己資金に対して年間でどれだけのキャッシュフローが得られるかを示す指標です。CCR = 年間キャッシュフロー ÷ 自己資金 × 100 で計算されます。',
    },
    {
      question: '固定資産税の自動概算はどのように計算されていますか？',
      answer: '物件価格から土地・建物の評価額を概算し、標準税率（固定資産税1.4%、都市計画税0.3%）を乗じて計算しています。実際の税額は物件の詳細や所在地により異なりますので、正確な金額は固定資産税納税通知書をご確認ください。',
    },
    {
      question: 'データはどこに保存されますか？',
      answer: '計算結果はクラウド（Supabase）に安全に保存され、ログインすることで複数のデバイスからアクセスできます。',
    },
  ];

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@example.com?subject=不動産投資家アプリ お問い合わせ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>ヘルプ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>よくある質問</Text>
        <View style={styles.faqContainer}>
          {faqItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity
                style={[
                  styles.faqItem,
                  index === 0 && styles.firstItem,
                  index === faqItems.length - 1 && expandedIndex !== index && styles.lastItem,
                ]}
                onPress={() => handleToggle(index)}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <MaterialCommunityIcons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {expandedIndex === index && (
                <View style={[
                  styles.faqAnswer,
                  index === faqItems.length - 1 && styles.lastItem,
                ]}>
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>お問い合わせ</Text>
        <View style={styles.contactContainer}>
          <TouchableOpacity style={styles.contactItem} onPress={handleContactSupport}>
            <View style={styles.contactLeft}>
              <MaterialCommunityIcons name="email-outline" size={24} color={colors.primary} />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>メールでお問い合わせ</Text>
                <Text style={styles.contactDescription}>support@example.com</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tipsContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={24} color={colors.warning} />
          <View style={styles.tipsText}>
            <Text style={styles.tipsTitle}>使い方のヒント</Text>
            <Text style={styles.tipsDescription}>
              計算結果を保存すると、履歴タブからいつでも確認できます。複数の物件を比較検討する際にご活用ください。
            </Text>
          </View>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  faqContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  firstItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  },
  faqQuestion: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
    fontWeight: '500',
  },
  faqAnswer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  faqAnswerText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  contactContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactText: {
    marginLeft: spacing.md,
  },
  contactLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tipsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.warningBackground,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  tipsText: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  tipsDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
