import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { PropertyInput, calculatePropertyInvestment, formatCurrency } from '../lib/calculations';
import { evaluateProperty, AIEvaluationResult, RiskFactor } from '../lib/aiEvaluation';
import { PREFECTURES, Prefecture, estimateExpenses } from '../constants/prefectures';

const PROPERTY_TYPES = [
  { key: 'apartment', label: 'アパート' },
  { key: 'mansion', label: 'マンション' },
  { key: 'house', label: '一戸建て' },
  { key: 'commercial', label: '商業ビル' },
  { key: 'other', label: 'その他' },
] as const;

// 返済期間の選択肢（1-50年）
const LOAN_PERIOD_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1);

export default function AIEvaluationScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  // Input states
  const [price, setPrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [vacancyRate, setVacancyRate] = useState('5');
  const [managementFee, setManagementFee] = useState('');
  const [repairReserve, setRepairReserve] = useState('');
  const [propertyTax, setPropertyTax] = useState('');
  const [insuranceFee, setInsuranceFee] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanInterestRate, setLoanInterestRate] = useState('');
  const [loanPeriodYears, setLoanPeriodYears] = useState('');
  const [buildingAge, setBuildingAge] = useState('');
  const [selectedPrefecture, setSelectedPrefecture] = useState<Prefecture | null>(null);
  const [propertyType, setPropertyType] = useState<typeof PROPERTY_TYPES[number]['key']>('apartment');
  const [memo, setMemo] = useState('');

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIEvaluationResult | null>(null);
  const [showPrefectureModal, setShowPrefectureModal] = useState(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);
  const [showLoanPeriodModal, setShowLoanPeriodModal] = useState(false);

  // Key to force ScrollView remount when result changes
  const [scrollKey, setScrollKey] = useState(0);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const canEvaluate = price && monthlyRent;

  const handleEvaluate = useCallback(async () => {
    if (!canEvaluate) return;

    setIsLoading(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const priceNum = parseFloat(price) * 10000; // 万円→円
    const monthlyRentNum = parseFloat(monthlyRent) * 10000; // 万円→円

    const propertyInput: PropertyInput = {
      price: priceNum,
      monthlyRent: monthlyRentNum,
      managementFee: managementFee ? parseFloat(managementFee) : 0,
      repairReserve: repairReserve ? parseFloat(repairReserve) : 0,
      propertyTax: propertyTax ? parseFloat(propertyTax) : 0,
      insuranceFee: insuranceFee ? parseFloat(insuranceFee) : 0,
      vacancyRate: vacancyRate ? parseFloat(vacancyRate) : 5,
      loanAmount: loanAmount ? parseFloat(loanAmount) * 10000 : 0,
      loanInterestRate: loanInterestRate ? parseFloat(loanInterestRate) : 0,
      loanPeriodYears: loanPeriodYears ? parseInt(loanPeriodYears) : 0,
    };

    const calculationResult = calculatePropertyInvestment(propertyInput);

    const evaluation = evaluateProperty({
      propertyInput,
      calculationResult,
      location: selectedPrefecture?.name,
      propertyType: propertyType as any,
      buildingAge: buildingAge ? parseInt(buildingAge) : undefined,
      memo: memo || undefined,
    });

    setResult(evaluation);
    setIsLoading(false);
    // Increment key to force ScrollView remount at top position
    setScrollKey(prev => prev + 1);
  }, [
    canEvaluate,
    price,
    monthlyRent,
    managementFee,
    repairReserve,
    propertyTax,
    insuranceFee,
    vacancyRate,
    loanAmount,
    loanInterestRate,
    loanPeriodYears,
    selectedPrefecture,
    propertyType,
    buildingAge,
    memo,
  ]);

  const handleReset = useCallback(() => {
    setResult(null);
    setPrice('');
    setMonthlyRent('');
    setVacancyRate('5');
    setManagementFee('');
    setRepairReserve('');
    setPropertyTax('');
    setInsuranceFee('');
    setLoanAmount('');
    setLoanInterestRate('');
    setLoanPeriodYears('');
    setBuildingAge('');
    setSelectedPrefecture(null);
    setPropertyType('apartment');
    setMemo('');
  }, []);

  // 都道府県選択時に固定資産税と火災保険を自動概算
  const handlePrefectureSelect = useCallback((prefecture: Prefecture) => {
    setSelectedPrefecture(prefecture);
    setShowPrefectureModal(false);

    // 物件価格が入力されていれば自動概算
    if (price) {
      const priceInYen = parseFloat(price) * 10000; // 万円→円
      const estimate = estimateExpenses(priceInYen, prefecture);
      setPropertyTax(estimate.totalTax.toString());
      setInsuranceFee(estimate.fireInsurance.toString());
    }
  }, [price]);

  const getRatingColor = (rating: AIEvaluationResult['overallRating']) => {
    switch (rating) {
      case 'excellent':
        return colors.success;
      case 'good':
        return colors.primary;
      case 'fair':
        return colors.warning;
      case 'poor':
        return colors.error;
    }
  };

  const getRatingText = (rating: AIEvaluationResult['overallRating']) => {
    switch (rating) {
      case 'excellent':
        return '優良';
      case 'good':
        return '良好';
      case 'fair':
        return '普通';
      case 'poor':
        return '要注意';
    }
  };

  const getRiskLevelColor = (level: RiskFactor['level']) => {
    switch (level) {
      case 'low':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'high':
        return colors.error;
    }
  };

  const getRiskLevelText = (level: RiskFactor['level']) => {
    switch (level) {
      case 'low':
        return '低';
      case 'medium':
        return '中';
      case 'high':
        return '高';
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    suffix?: string,
    keyboardType: 'numeric' | 'decimal-pad' = 'decimal-pad'
  ) => (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType={keyboardType}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );

  const renderScoreCircle = (score: number, label: string, color: string) => (
    <View style={styles.scoreCircleContainer}>
      <View style={[styles.scoreCircle, { borderColor: color }]}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );

  if (result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setResult(null)} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>AI評価結果</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          key={`result-scroll-${scrollKey}`}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Overall Score Card */}
          <View style={[styles.overallCard, { borderLeftColor: getRatingColor(result.overallRating) }]}>
            <View style={styles.overallHeader}>
              <View>
                <Text style={styles.overallTitle}>総合評価</Text>
                <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(result.overallRating) }]}>
                  <Text style={styles.ratingBadgeText}>{getRatingText(result.overallRating)}</Text>
                </View>
              </View>
              <View style={styles.overallScoreContainer}>
                <Text style={[styles.overallScore, { color: getRatingColor(result.overallRating) }]}>
                  {result.overallScore}
                </Text>
                <Text style={styles.overallScoreMax}>/100</Text>
              </View>
            </View>
          </View>

          {/* Score Breakdown */}
          <View style={styles.scoreBreakdown}>
            {renderScoreCircle(result.profitabilityScore, '収益性', colors.primary)}
            {renderScoreCircle(result.cashFlowScore, 'CF', colors.success)}
            {renderScoreCircle(100 - result.riskScore, '安全性', colors.warning)}
          </View>

          {/* Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>評価サマリー</Text>
            </View>
            <Text style={styles.summaryText}>{result.summary}</Text>
          </View>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="thumb-up-outline" size={20} color={colors.success} />
                <Text style={styles.sectionTitle}>強み</Text>
              </View>
              {result.strengths.map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                  <Text style={styles.listItemText}>{strength}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Weaknesses */}
          {result.weaknesses.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="alert-outline" size={20} color={colors.error} />
                <Text style={styles.sectionTitle}>課題・リスク</Text>
              </View>
              {result.weaknesses.map((weakness, index) => (
                <View key={index} style={styles.listItem}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.listItemText}>{weakness}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Memo Analysis */}
          {result.memoAnalysis && result.memoAnalysis.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="note-text-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>メモからの分析</Text>
              </View>
              {result.memoAnalysis.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <MaterialCommunityIcons
                    name={item.startsWith('[プラス]') ? 'plus-circle' : item.startsWith('[注意]') ? 'alert-circle' : 'information'}
                    size={16}
                    color={item.startsWith('[プラス]') ? colors.success : item.startsWith('[注意]') ? colors.warning : colors.textSecondary}
                  />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Risk Factors */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="shield-alert-outline" size={20} color={colors.warning} />
              <Text style={styles.sectionTitle}>リスク評価</Text>
            </View>
            {result.riskFactors.map((risk, index) => (
              <View key={index} style={styles.riskItem}>
                <View style={styles.riskHeader}>
                  <Text style={styles.riskCategory}>{risk.category}</Text>
                  <View style={[styles.riskLevelBadge, { backgroundColor: getRiskLevelColor(risk.level) }]}>
                    <Text style={styles.riskLevelText}>{getRiskLevelText(risk.level)}</Text>
                  </View>
                </View>
                <Text style={styles.riskDescription}>{risk.description}</Text>
              </View>
            ))}
          </View>

          {/* Recommendations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>推奨事項</Text>
            </View>
            {result.recommendations.map((rec, index) => (
              <View key={index} style={styles.listItem}>
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
                <Text style={styles.listItemText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
              <Text style={styles.secondaryButtonText}>新規評価</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.primaryButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>AI物件評価</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="brain" size={24} color={colors.primary} />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>AIが物件を多角的に評価</Text>
            <Text style={styles.infoBannerText}>
              収益性、リスク、キャッシュフローを分析し、投資判断をサポートします
            </Text>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>基本情報（必須）</Text>
          {renderInput('物件価格', price, setPrice, '0', '万円')}
          {renderInput('月額家賃収入', monthlyRent, setMonthlyRent, '0', '万円')}
        </View>

        {/* Property Details */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>物件詳細（任意）</Text>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>都道府県</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowPrefectureModal(true)}
            >
              <Text style={selectedPrefecture ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                {selectedPrefecture?.name || '選択してください'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.inputHint}>
              ※物件価格入力後に選択すると、固定資産税・火災保険を自動概算
            </Text>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>物件タイプ</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowPropertyTypeModal(true)}
            >
              <Text style={styles.selectButtonText}>
                {PROPERTY_TYPES.find(t => t.key === propertyType)?.label || '選択'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {renderInput('築年数', buildingAge, setBuildingAge, '0', '年', 'numeric')}
        </View>

        {/* Expenses */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>経費情報（任意）</Text>
          {renderInput('空室率', vacancyRate, setVacancyRate, '5', '%')}
          <Text style={styles.inputHint}>
            ※日本の賃貸不動産投資において、5%は「良好な稼働率」の目安とされているため5%にしています。
          </Text>
          {renderInput('管理費（月額）', managementFee, setManagementFee, '0', '円')}
          {renderInput('修繕積立金（月額）', repairReserve, setRepairReserve, '0', '円')}
          {renderInput('固定資産税（年額）', propertyTax, setPropertyTax, '0', '円')}
          <Text style={styles.inputHint}>
            ※概算値のため、実際の金額とは異なる場合があります。{'\n'}
            固定資産税は築年数・土地面積・建物構造により変動します。{'\n'}
            正確な金額は物件の固定資産税納税通知書をご確認ください。
          </Text>
          {renderInput('火災保険（年額）', insuranceFee, setInsuranceFee, '0', '円')}
        </View>

        {/* Loan Info */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>ローン情報（任意）</Text>
          {renderInput('借入金額', loanAmount, setLoanAmount, '0', '万円')}
          {renderInput('金利（年率）', loanInterestRate, setLoanInterestRate, '0', '%')}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>返済期間</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowLoanPeriodModal(true)}
            >
              <Text style={loanPeriodYears ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                {loanPeriodYears ? `${loanPeriodYears}年` : '選択してください'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Memo Section */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>メモ・特記事項（任意）</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>物件に関する補足情報</Text>
            <TextInput
              style={styles.memoInput}
              value={memo}
              onChangeText={setMemo}
              placeholder="例: 駅徒歩5分、リフォーム済み、大学近くで学生需要あり、管理組合がしっかりしている など"
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.inputHint}>
              ※入力した内容はAI評価に反映されます
            </Text>
          </View>
        </View>

        {/* Evaluate Button */}
        <TouchableOpacity
          style={[styles.evaluateButton, !canEvaluate && styles.evaluateButtonDisabled]}
          onPress={handleEvaluate}
          disabled={!canEvaluate || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="brain" size={20} color={colors.white} />
              <Text style={styles.evaluateButtonText}>AIで評価する</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Prefecture Modal */}
      <Modal
        visible={showPrefectureModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrefectureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>都道府県を選択</Text>
              <TouchableOpacity onPress={() => setShowPrefectureModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PREFECTURES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handlePrefectureSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {selectedPrefecture?.code === item.code && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Property Type Modal */}
      <Modal
        visible={showPropertyTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPropertyTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>物件タイプを選択</Text>
              <TouchableOpacity onPress={() => setShowPropertyTypeModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={styles.modalItem}
                onPress={() => {
                  setPropertyType(type.key);
                  setShowPropertyTypeModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{type.label}</Text>
                {propertyType === type.key && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Loan Period Modal */}
      <Modal
        visible={showLoanPeriodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLoanPeriodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>返済期間を選択</Text>
              <TouchableOpacity onPress={() => setShowLoanPeriodModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LOAN_PERIOD_OPTIONS}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setLoanPeriodYears(item.toString());
                    setShowLoanPeriodModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}年</Text>
                  {loanPeriodYears === item.toString() && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    padding: spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  infoBannerText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  formSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  inputRow: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputSuffix: {
    paddingRight: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  memoInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  selectButtonPlaceholder: {
    fontSize: 16,
    color: colors.textDisabled,
  },
  evaluateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  evaluateButtonDisabled: {
    opacity: 0.5,
  },
  evaluateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  // Result styles
  overallCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  ratingBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  ratingBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  overallScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  overallScore: {
    fontSize: 48,
    fontWeight: '700',
  },
  overallScoreMax: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  scoreCircleContainer: {
    alignItems: 'center',
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  riskItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  riskCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  riskLevelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  riskLevelText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  riskDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
});
