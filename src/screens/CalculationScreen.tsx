import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  PropertyInput,
  CalculationResult,
  calculatePropertyInvestment,
  formatCurrency,
  formatPercent,
} from '../lib/calculations';
import { useCalculationStore } from '../store/calculationStore';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { PREFECTURES, Prefecture, estimateExpenses } from '../constants/prefectures';
import { sharePDF, printPDF, shareText, ShareData } from '../lib/shareUtils';
import ResultCharts from '../components/ResultCharts';
import { CashFlowChart } from '../components';

type InputField = {
  label: string;
  key: keyof PropertyInput;
  placeholder: string;
  suffix?: string;
  required?: boolean;
  hint?: string;
};

// 万円単位で入力するフィールド
const MAN_YEN_FIELDS: (keyof PropertyInput)[] = ['price', 'downPayment', 'loanAmount', 'monthlyRent'];

const basicFields: InputField[] = [
  { label: '物件価格', key: 'price', placeholder: '0', suffix: '万円', required: true, hint: '【例:1億5千万の物件の場合15000と入力】' },
  { label: '月額家賃収入【満室時】', key: 'monthlyRent', placeholder: '0', suffix: '万円', required: true, hint: '【例:月収1,255,000円の場合125.5と入力】' },
];

const expenseFields: InputField[] = [
  { label: '管理費（月額）', key: 'managementFee', placeholder: '0', suffix: '円' },
  { label: '修繕積立金（月額）', key: 'repairReserve', placeholder: '0', suffix: '円' },
  { label: '固定資産税（年額）', key: 'propertyTax', placeholder: '0', suffix: '円' },
  { label: '火災保険（年額）', key: 'insuranceFee', placeholder: '0', suffix: '円' },
  { label: '空室率', key: 'vacancyRate', placeholder: '5', suffix: '%', hint: '※日本の賃貸不動産投資において、5%は「良好な稼働率」の目安とされているため5%にしています。' },
];

const loanFields: InputField[] = [
  { label: '頭金', key: 'downPayment', placeholder: '0', suffix: '万円' },
  { label: 'ローン金額', key: 'loanAmount', placeholder: '0', suffix: '万円' },
  { label: '金利（年率）', key: 'loanInterestRate', placeholder: '0', suffix: '%' },
];

// 高度な投資指標用フィールド（IRR/NPV計算）
const advancedFields: InputField[] = [
  { label: '想定売却価格', key: 'expectedSellingPrice', placeholder: '0', suffix: '万円', hint: '※空欄の場合は購入価格と同額で計算' },
  { label: '割引率（NPV計算用）', key: 'discountRate', placeholder: '5', suffix: '%', hint: '※一般的には5%を使用' },
];

// 万円単位で入力するフィールドに追加
const MAN_YEN_FIELDS_EXTENDED: (keyof PropertyInput)[] = ['price', 'downPayment', 'loanAmount', 'monthlyRent', 'expectedSellingPrice'];

// 返済期間の選択肢（1-50年）
const LOAN_PERIOD_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1);

// 保有期間の選択肢（1-30年）
const HOLDING_PERIOD_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

export default function CalculationScreen() {
  const { colors, isDark } = useTheme();
  const [inputs, setInputs] = useState<Partial<PropertyInput>>({
    vacancyRate: 5,
    holdingPeriodYears: 10,
    discountRate: 5,
  });
  // 入力中の文字列を保持（小数点入力対応）
  const [inputStrings, setInputStrings] = useState<Record<string, string>>({});
  const [showExpenses, setShowExpenses] = useState(false);
  const [showLoan, setShowLoan] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showLoanPeriodModal, setShowLoanPeriodModal] = useState(false);
  const [showHoldingPeriodModal, setShowHoldingPeriodModal] = useState(false);
  const [showPrefectureModal, setShowPrefectureModal] = useState(false);
  const [selectedPrefecture, setSelectedPrefecture] = useState<Prefecture | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { addCalculation } = useCalculationStore();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const handleInputChange = useCallback((key: keyof PropertyInput, value: string) => {
    // 数字、小数点、カンマのみ許可
    const sanitizedValue = value.replace(/[^0-9.,]/g, '');
    // 入力中の文字列を保持
    setInputStrings(prev => ({
      ...prev,
      [key]: sanitizedValue,
    }));
    // 数値としても保存（計算用）
    const numValue = sanitizedValue === '' ? undefined : parseFloat(sanitizedValue.replace(/,/g, ''));
    setInputs(prev => ({
      ...prev,
      [key]: isNaN(numValue as number) ? prev[key] : numValue,
    }));
    setShowResult(false);
    setIsSaved(false);
  }, []);

  // 表示用の値を取得
  const getDisplayValue = useCallback((key: keyof PropertyInput): string => {
    // 入力中の文字列があればそれを表示
    if (inputStrings[key] !== undefined) {
      return inputStrings[key];
    }
    // なければ数値を文字列に変換
    const value = inputs[key];
    return value !== undefined ? value.toString() : '';
  }, [inputStrings, inputs]);

  // 万円を円に変換するヘルパー関数
  const toYen = (value: number | undefined, key: keyof PropertyInput): number => {
    if (value === undefined) return 0;
    return MAN_YEN_FIELDS_EXTENDED.includes(key) ? value * 10000 : value;
  };

  // 経費を自動概算計算
  const handleAutoEstimate = useCallback(() => {
    if (!inputs.price) {
      Alert.alert('エラー', '物件価格を入力してください');
      return;
    }
    if (!selectedPrefecture) {
      Alert.alert('エラー', '都道府県を選択してください');
      return;
    }

    const priceInYen = inputs.price * 10000; // 万円→円に変換
    const estimate = estimateExpenses(priceInYen, selectedPrefecture);

    setInputs(prev => ({
      ...prev,
      propertyTax: estimate.totalTax,
      insuranceFee: estimate.fireInsurance,
    }));
    // 自動概算結果を文字列としても保存
    setInputStrings(prev => ({
      ...prev,
      propertyTax: estimate.totalTax.toString(),
      insuranceFee: estimate.fireInsurance.toString(),
    }));

    // 経費セクションを開く
    setShowExpenses(true);
    setShowResult(false);
    setIsSaved(false);

    Alert.alert(
      '概算完了',
      `都道府県: ${selectedPrefecture.name}\n\n` +
      `固定資産税: ¥${formatCurrency(estimate.propertyTax)}/年\n` +
      `都市計画税: ¥${formatCurrency(estimate.cityPlanningTax)}/年\n` +
      `合計税金: ¥${formatCurrency(estimate.totalTax)}/年\n` +
      `火災保険: ¥${formatCurrency(estimate.fireInsurance)}/年\n\n` +
      '※概算値です。実際の金額は異なる場合があります。'
    );
  }, [inputs.price, selectedPrefecture]);

  const handleCalculate = useCallback(() => {
    if (!inputs.price || !inputs.monthlyRent) {
      return;
    }

    const calculationInput: PropertyInput = {
      price: toYen(inputs.price, 'price'),
      monthlyRent: toYen(inputs.monthlyRent, 'monthlyRent'),
      managementFee: inputs.managementFee ?? 0,
      repairReserve: inputs.repairReserve ?? 0,
      propertyTax: inputs.propertyTax ?? 0,
      insuranceFee: inputs.insuranceFee ?? 0,
      vacancyRate: inputs.vacancyRate ?? 5,
      downPayment: inputs.downPayment ? toYen(inputs.downPayment, 'downPayment') : undefined,
      loanAmount: toYen(inputs.loanAmount, 'loanAmount'),
      loanInterestRate: inputs.loanInterestRate ?? 0,
      loanPeriodYears: inputs.loanPeriodYears ?? 0,
      // IRR/NPV計算用
      holdingPeriodYears: inputs.holdingPeriodYears ?? 10,
      expectedSellingPrice: inputs.expectedSellingPrice ? toYen(inputs.expectedSellingPrice, 'expectedSellingPrice') : undefined,
      discountRate: inputs.discountRate ?? 5,
    };

    const calculationResult = calculatePropertyInvestment(calculationInput);
    setResult(calculationResult);
    setShowResult(true);
  }, [inputs]);

  const handleClear = useCallback(() => {
    setInputs({ vacancyRate: 5, holdingPeriodYears: 10, discountRate: 5 });
    setInputStrings({});
    setResult(null);
    setShowResult(false);
    setIsSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!inputs.price || !inputs.monthlyRent || !result) return;

    const calculationInput: PropertyInput = {
      price: toYen(inputs.price, 'price'),
      monthlyRent: toYen(inputs.monthlyRent, 'monthlyRent'),
      managementFee: inputs.managementFee ?? 0,
      repairReserve: inputs.repairReserve ?? 0,
      propertyTax: inputs.propertyTax ?? 0,
      insuranceFee: inputs.insuranceFee ?? 0,
      vacancyRate: inputs.vacancyRate ?? 5,
      downPayment: inputs.downPayment ? toYen(inputs.downPayment, 'downPayment') : undefined,
      loanAmount: toYen(inputs.loanAmount, 'loanAmount'),
      loanInterestRate: inputs.loanInterestRate ?? 0,
      loanPeriodYears: inputs.loanPeriodYears ?? 0,
    };

    const title = `${formatCurrency(inputs.price)}万円 / ${formatPercent(result.grossYield)}`;
    await addCalculation(title, calculationInput, result);
    setIsSaved(true);
    Alert.alert('保存完了', '計算結果を履歴に保存しました');
  }, [inputs, result, addCalculation]);

  // 共有用のデータを生成
  const getShareData = useCallback((): ShareData | null => {
    if (!inputs.price || !inputs.monthlyRent || !result) return null;

    const calculationInput: PropertyInput = {
      price: toYen(inputs.price, 'price'),
      monthlyRent: toYen(inputs.monthlyRent, 'monthlyRent'),
      managementFee: inputs.managementFee ?? 0,
      repairReserve: inputs.repairReserve ?? 0,
      propertyTax: inputs.propertyTax ?? 0,
      insuranceFee: inputs.insuranceFee ?? 0,
      vacancyRate: inputs.vacancyRate ?? 5,
      downPayment: inputs.downPayment ? toYen(inputs.downPayment, 'downPayment') : undefined,
      loanAmount: toYen(inputs.loanAmount, 'loanAmount'),
      loanInterestRate: inputs.loanInterestRate ?? 0,
      loanPeriodYears: inputs.loanPeriodYears ?? 0,
    };

    return {
      title: `${formatCurrency(inputs.price)}万円の物件`,
      input: calculationInput,
      result,
    };
  }, [inputs, result]);

  // PDF共有ハンドラー
  const handleSharePDF = useCallback(async () => {
    const shareData = getShareData();
    if (!shareData) return;

    setIsSharing(true);
    try {
      const success = await sharePDF(shareData);
      if (!success) {
        Alert.alert('エラー', 'このデバイスでは共有機能を利用できません');
      }
    } catch (error) {
      console.error('Share PDF error:', error);
      Alert.alert('エラー', 'PDFの共有に失敗しました');
    } finally {
      setIsSharing(false);
    }
  }, [getShareData]);

  // 印刷ハンドラー
  const handlePrint = useCallback(async () => {
    const shareData = getShareData();
    if (!shareData) return;

    setIsSharing(true);
    try {
      await printPDF(shareData);
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('エラー', '印刷に失敗しました');
    } finally {
      setIsSharing(false);
    }
  }, [getShareData]);

  // テキスト共有ハンドラー
  const handleShareText = useCallback(async () => {
    const shareData = getShareData();
    if (!shareData) return;

    setIsSharing(true);
    try {
      const success = await shareText(shareData);
      if (success) {
        Alert.alert('完了', 'テキストをコピーまたは共有しました');
      } else {
        Alert.alert('エラー', 'このデバイスでは共有機能を利用できません');
      }
    } catch (error) {
      console.error('Share text error:', error);
      Alert.alert('エラー', 'テキストの共有に失敗しました');
    } finally {
      setIsSharing(false);
    }
  }, [getShareData]);

  const renderInputField = (field: InputField) => (
    <View key={field.key} style={styles.inputRow}>
      <Text style={styles.inputLabel}>
        {field.label}
        {field.required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={getDisplayValue(field.key)}
          onChangeText={value => handleInputChange(field.key, value)}
          placeholder={field.placeholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType="decimal-pad"
        />
        {field.suffix && <Text style={styles.inputSuffix}>{field.suffix}</Text>}
      </View>
      {field.hint && <Text style={styles.inputHint}>{field.hint}</Text>}
    </View>
  );

  const renderResultCard = (
    title: string,
    value: string,
    subtitle?: string,
    isHighlight?: boolean
  ) => (
    <View style={[styles.resultCard, isHighlight && styles.resultCardHighlight]}>
      <Text style={[styles.resultCardTitle, isHighlight && styles.resultCardTitleHighlight]}>
        {title}
      </Text>
      <Text style={[styles.resultCardValue, isHighlight && styles.resultCardValueHighlight]}>
        {value}
      </Text>
      {subtitle && <Text style={styles.resultCardSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>物件計算</Text>
        <Text style={styles.description}>物件情報を入力して、収益性を計算します</Text>

        {/* 基本情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>
          <View style={styles.sectionContent}>
            {basicFields.map(renderInputField)}
          </View>
        </View>

        {/* 経費（オプション） */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowExpenses(!showExpenses)}
          >
            <Text style={styles.sectionTitle}>経費（オプション）</Text>
            <MaterialCommunityIcons
              name={showExpenses ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {showExpenses && (
            <View style={styles.sectionContent}>
              {/* 都道府県選択と自動概算 */}
              <View style={styles.autoEstimateSection}>
                <Text style={styles.autoEstimateTitle}>
                  <MaterialCommunityIcons name="lightbulb-on" size={16} color={colors.warning} />
                  {' '}経費を自動概算
                </Text>
                <Text style={styles.autoEstimateDescription}>
                  都道府県を選択すると、固定資産税・火災保険を自動計算します
                </Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>都道府県</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowPrefectureModal(true)}
                  >
                    <Text style={[
                      styles.selectButtonText,
                      !selectedPrefecture && styles.selectButtonPlaceholder
                    ]}>
                      {selectedPrefecture ? selectedPrefecture.name : '選択してください'}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[
                    styles.autoEstimateButton,
                    (!inputs.price || !selectedPrefecture) && styles.autoEstimateButtonDisabled,
                  ]}
                  onPress={handleAutoEstimate}
                  disabled={!inputs.price || !selectedPrefecture}
                >
                  <MaterialCommunityIcons name="calculator-variant" size={18} color={colors.white} />
                  <Text style={styles.autoEstimateButtonText}>自動概算する</Text>
                </TouchableOpacity>
                <View style={styles.autoEstimateNote}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.warning} />
                  <Text style={styles.autoEstimateNoteText}>
                    ※概算値のため、実際の金額とは異なる場合があります。{'\n'}
                    固定資産税は築年数・土地面積・建物構造により変動します。{'\n'}
                    正確な金額は物件の固定資産税納税通知書をご確認ください。
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* 手動入力フィールド */}
              <Text style={styles.manualInputTitle}>または手動で入力</Text>
              {expenseFields.map(renderInputField)}
            </View>
          )}
        </View>

        {/* ローン情報（オプション） */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithSwitch}>
            <Text style={styles.sectionTitle}>ローンを利用</Text>
            <Switch
              value={showLoan}
              onValueChange={setShowLoan}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={showLoan ? colors.primary : colors.white}
            />
          </View>
          {showLoan && (
            <View style={styles.sectionContent}>
              {loanFields.map(renderInputField)}
              {/* 返済期間セレクター */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>返済期間</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowLoanPeriodModal(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {inputs.loanPeriodYears ? `${inputs.loanPeriodYears}年` : '選択してください'}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 高度な投資指標（オプション） */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>高度な投資指標（IRR/NPV）</Text>
            </View>
            <MaterialCommunityIcons
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {showAdvanced && (
            <View style={styles.sectionContent}>
              <View style={styles.advancedNote}>
                <MaterialCommunityIcons name="information-outline" size={16} color={colors.info} />
                <Text style={styles.advancedNoteText}>
                  IRR（内部収益率）とNPV（正味現在価値）は、将来の売却を考慮した投資収益性を評価する指標です。
                </Text>
              </View>

              {/* 保有期間セレクター */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>想定保有期間</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowHoldingPeriodModal(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {inputs.holdingPeriodYears ? `${inputs.holdingPeriodYears}年` : '10年'}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {advancedFields.map(renderInputField)}
            </View>
          )}
        </View>

        {/* 計算ボタン */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>クリア</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.calculateButton,
              (!inputs.price || !inputs.monthlyRent) && styles.calculateButtonDisabled,
            ]}
            onPress={handleCalculate}
            disabled={!inputs.price || !inputs.monthlyRent}
          >
            <MaterialCommunityIcons name="calculator" size={20} color={colors.white} />
            <Text style={styles.calculateButtonText}>計算する</Text>
          </TouchableOpacity>
        </View>

        {/* 計算結果 */}
        {showResult && result && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>計算結果</Text>

            {/* 利回り */}
            <View style={styles.resultRow}>
              {renderResultCard('表面利回り', formatPercent(result.grossYield), undefined, true)}
              {renderResultCard('実質利回り', formatPercent(result.netYield), undefined, true)}
            </View>

            {/* キャッシュフロー */}
            <View style={styles.resultRow}>
              {renderResultCard(
                '月間キャッシュフロー',
                `¥${formatCurrency(result.monthlyCashFlow)}`,
                `年間: ¥${formatCurrency(result.annualCashFlow)}`
              )}
              {renderResultCard(
                '自己資金配当率',
                formatPercent(result.ccr),
                result.paybackPeriod !== Infinity
                  ? `回収期間: ${result.paybackPeriod}年`
                  : undefined
              )}
            </View>

            {/* 高度な投資指標 (IRR/NPV) */}
            {(result.irr !== null || result.npv !== null) && (
              <View style={styles.advancedMetricsSection}>
                <View style={styles.advancedMetricsHeader}>
                  <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={colors.primary} />
                  <Text style={styles.advancedMetricsTitle}>高度な投資指標</Text>
                </View>
                <View style={styles.resultRow}>
                  {result.irr !== null ? (
                    renderResultCard(
                      'IRR（内部収益率）',
                      formatPercent(result.irr),
                      `${inputs.holdingPeriodYears ?? 10}年保有時`,
                      true
                    )
                  ) : (
                    <View style={styles.resultCard}>
                      <Text style={styles.resultCardTitle}>IRR（内部収益率）</Text>
                      <Text style={styles.resultCardValueSmall}>計算不可</Text>
                      <Text style={styles.resultCardSubtitle}>キャッシュフローが不十分</Text>
                    </View>
                  )}
                  {result.npv !== null ? (
                    renderResultCard(
                      'NPV（正味現在価値）',
                      `¥${formatCurrency(result.npv)}`,
                      result.npv >= 0 ? '投資価値あり' : '投資価値なし'
                    )
                  ) : (
                    <View style={styles.resultCard}>
                      <Text style={styles.resultCardTitle}>NPV（正味現在価値）</Text>
                      <Text style={styles.resultCardValueSmall}>計算不可</Text>
                    </View>
                  )}
                </View>
                {result.profitabilityIndex !== null && (
                  <View style={styles.piContainer}>
                    <Text style={styles.piLabel}>収益性指数（PI）</Text>
                    <Text style={[
                      styles.piValue,
                      result.profitabilityIndex >= 1 ? styles.piValuePositive : styles.piValueNegative
                    ]}>
                      {result.profitabilityIndex.toFixed(2)}
                    </Text>
                    <Text style={styles.piHint}>
                      {result.profitabilityIndex >= 1
                        ? '1以上のため投資価値あり'
                        : '1未満のため投資価値に注意'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 収支詳細 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>収支詳細</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>年間家賃収入</Text>
                <Text style={styles.detailValue}>
                  ¥{formatCurrency(result.annualRentIncome)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>年間経費</Text>
                <Text style={[styles.detailValue, styles.detailValueNegative]}>
                  -¥{formatCurrency(result.annualExpenses)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>年間純収入（NOI）</Text>
                <Text style={styles.detailValue}>
                  ¥{formatCurrency(result.annualNetIncome)}
                </Text>
              </View>
              {showLoan && result.annualLoanPayment > 0 && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>年間ローン返済</Text>
                    <Text style={[styles.detailValue, styles.detailValueNegative]}>
                      -¥{formatCurrency(result.annualLoanPayment)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>月額ローン返済</Text>
                    <Text style={styles.detailValueSmall}>
                      ¥{formatCurrency(result.monthlyLoanPayment)}/月
                    </Text>
                  </View>
                </>
              )}
              <View style={[styles.detailRow, styles.detailRowTotal]}>
                <Text style={styles.detailLabelTotal}>年間キャッシュフロー</Text>
                <Text
                  style={[
                    styles.detailValueTotal,
                    result.annualCashFlow < 0 && styles.detailValueNegative,
                  ]}
                >
                  ¥{formatCurrency(result.annualCashFlow)}
                </Text>
              </View>
            </View>

            {/* 経費内訳 */}
            {showExpenses && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>経費内訳（年間）</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>管理費</Text>
                  <Text style={styles.detailValueSmall}>
                    ¥{formatCurrency(result.expenses.managementFee)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>修繕積立金</Text>
                  <Text style={styles.detailValueSmall}>
                    ¥{formatCurrency(result.expenses.repairReserve)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>固定資産税</Text>
                  <Text style={styles.detailValueSmall}>
                    ¥{formatCurrency(result.expenses.propertyTax)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>火災保険</Text>
                  <Text style={styles.detailValueSmall}>
                    ¥{formatCurrency(result.expenses.insuranceFee)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>空室損失</Text>
                  <Text style={styles.detailValueSmall}>
                    ¥{formatCurrency(result.expenses.vacancyLoss)}
                  </Text>
                </View>
              </View>
            )}

            {/* グラフ表示 */}
            <ResultCharts result={result} showLoan={showLoan} />

            {/* キャッシュフロー推移グラフ */}
            {showLoan && inputs.loanAmount && inputs.loanPeriodYears && (
              <CashFlowChart
                data={{
                  propertyPrice: toYen(inputs.price!, 'price'),
                  downPayment: toYen(inputs.downPayment ?? 0, 'downPayment'),
                  loanAmount: toYen(inputs.loanAmount, 'loanAmount'),
                  interestRate: inputs.loanInterestRate ?? 0,
                  loanTermYears: inputs.loanPeriodYears,
                  annualRent: result.annualRentIncome,
                  annualExpenses: result.annualExpenses,
                  vacancyRate: inputs.vacancyRate ?? 5,
                }}
                yearsToProject={Math.max(inputs.loanPeriodYears, 30)}
                showCumulative={true}
              />
            )}

            {/* 保存ボタン */}
            <TouchableOpacity
              style={[styles.saveButton, isSaved && styles.saveButtonSaved]}
              onPress={handleSave}
              disabled={isSaved}
            >
              <MaterialCommunityIcons
                name={isSaved ? 'check-circle' : 'content-save'}
                size={20}
                color={isSaved ? colors.success : colors.white}
              />
              <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextSaved]}>
                {isSaved ? '保存済み' : '履歴に保存'}
              </Text>
            </TouchableOpacity>

            {/* 共有ボタン */}
            <View style={styles.shareSection}>
              <Text style={styles.shareSectionTitle}>レポートを共有</Text>
              <View style={styles.shareButtonRow}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleSharePDF}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.primary} />
                  )}
                  <Text style={styles.shareButtonText}>PDF共有</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handlePrint}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialCommunityIcons name="printer" size={24} color={colors.primary} />
                  )}
                  <Text style={styles.shareButtonText}>印刷</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShareText}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialCommunityIcons name="share-variant" size={24} color={colors.primary} />
                  )}
                  <Text style={styles.shareButtonText}>テキスト</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 返済期間選択モーダル */}
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
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LOAN_PERIOD_OPTIONS}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    inputs.loanPeriodYears === item && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setInputs(prev => ({ ...prev, loanPeriodYears: item }));
                    setShowLoanPeriodModal(false);
                    setShowResult(false);
                    setIsSaved(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      inputs.loanPeriodYears === item && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}年
                  </Text>
                  {inputs.loanPeriodYears === item && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* 都道府県選択モーダル */}
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
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PREFECTURES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedPrefecture?.code === item.code && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedPrefecture(item);
                    setShowPrefectureModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedPrefecture?.code === item.code && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedPrefecture?.code === item.code && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* 保有期間選択モーダル */}
      <Modal
        visible={showHoldingPeriodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHoldingPeriodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>想定保有期間を選択</Text>
              <TouchableOpacity onPress={() => setShowHoldingPeriodModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={HOLDING_PERIOD_OPTIONS}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    inputs.holdingPeriodYears === item && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setInputs(prev => ({ ...prev, holdingPeriodYears: item }));
                    setShowHoldingPeriodModal(false);
                    setShowResult(false);
                    setIsSaved(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      inputs.holdingPeriodYears === item && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}年
                  </Text>
                  {inputs.holdingPeriodYears === item && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sectionHeaderWithSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  inputRow: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
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
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  clearButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  calculateButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  calculateButtonDisabled: {
    opacity: 0.5,
  },
  calculateButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  resultSection: {
    marginTop: spacing.md,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  resultCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  resultCardHighlight: {
    backgroundColor: colors.primary,
  },
  resultCardTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resultCardTitleHighlight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  resultCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  resultCardValueHighlight: {
    color: colors.white,
  },
  resultCardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  detailSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailRowTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailLabelTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  detailValueSmall: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValueNegative: {
    color: colors.error,
  },
  detailValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  saveButtonSaved: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.success,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  saveButtonTextSaved: {
    color: colors.success,
  },
  // セレクトボタンのスタイル
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
  // モーダルのスタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
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
  modalList: {
    paddingHorizontal: spacing.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  // 自動概算セクションのスタイル
  autoEstimateSection: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  autoEstimateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  autoEstimateDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  autoEstimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  autoEstimateButtonDisabled: {
    opacity: 0.5,
  },
  autoEstimateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  autoEstimateNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  autoEstimateNoteText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  selectButtonPlaceholder: {
    color: colors.textDisabled,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  manualInputTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  // 共有セクションのスタイル
  shareSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  shareSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  shareButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  shareButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },
  shareButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // 高度な投資指標セクションのスタイル
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  advancedNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.infoBackground,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  advancedNoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.info,
    lineHeight: 18,
  },
  advancedMetricsSection: {
    marginBottom: spacing.md,
  },
  advancedMetricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  advancedMetricsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  resultCardValueSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  piContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  piLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  piValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  piValuePositive: {
    color: colors.success,
  },
  piValueNegative: {
    color: colors.error,
  },
  piHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
