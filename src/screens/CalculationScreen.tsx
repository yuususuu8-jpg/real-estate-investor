import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
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
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

type InputField = {
  label: string;
  key: keyof PropertyInput;
  placeholder: string;
  suffix?: string;
  required?: boolean;
};

const basicFields: InputField[] = [
  { label: '物件価格', key: 'price', placeholder: '0', suffix: '円', required: true },
  { label: '月額家賃収入', key: 'monthlyRent', placeholder: '0', suffix: '円', required: true },
];

const expenseFields: InputField[] = [
  { label: '管理費（月額）', key: 'managementFee', placeholder: '0', suffix: '円' },
  { label: '修繕積立金（月額）', key: 'repairReserve', placeholder: '0', suffix: '円' },
  { label: '固定資産税（年額）', key: 'propertyTax', placeholder: '0', suffix: '円' },
  { label: '火災保険（年額）', key: 'insuranceFee', placeholder: '0', suffix: '円' },
  { label: '空室率', key: 'vacancyRate', placeholder: '5', suffix: '%' },
];

const loanFields: InputField[] = [
  { label: '頭金', key: 'downPayment', placeholder: '0', suffix: '円' },
  { label: 'ローン金額', key: 'loanAmount', placeholder: '0', suffix: '円' },
  { label: '金利（年率）', key: 'loanInterestRate', placeholder: '0', suffix: '%' },
  { label: '返済期間', key: 'loanPeriodYears', placeholder: '0', suffix: '年' },
];

export default function CalculationScreen() {
  const [inputs, setInputs] = useState<Partial<PropertyInput>>({
    vacancyRate: 5,
  });
  const [showExpenses, setShowExpenses] = useState(false);
  const [showLoan, setShowLoan] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { addCalculation } = useCalculationStore();

  const handleInputChange = useCallback((key: keyof PropertyInput, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value.replace(/,/g, ''));
    setInputs(prev => ({
      ...prev,
      [key]: numValue,
    }));
    setShowResult(false);
    setIsSaved(false);
  }, []);

  const handleCalculate = useCallback(() => {
    if (!inputs.price || !inputs.monthlyRent) {
      return;
    }

    const calculationInput: PropertyInput = {
      price: inputs.price,
      monthlyRent: inputs.monthlyRent,
      managementFee: inputs.managementFee || 0,
      repairReserve: inputs.repairReserve || 0,
      propertyTax: inputs.propertyTax || 0,
      insuranceFee: inputs.insuranceFee || 0,
      vacancyRate: inputs.vacancyRate || 5,
      downPayment: inputs.downPayment,
      loanAmount: inputs.loanAmount || 0,
      loanInterestRate: inputs.loanInterestRate || 0,
      loanPeriodYears: inputs.loanPeriodYears || 0,
    };

    const calculationResult = calculatePropertyInvestment(calculationInput);
    setResult(calculationResult);
    setShowResult(true);
  }, [inputs]);

  const handleClear = useCallback(() => {
    setInputs({ vacancyRate: 5 });
    setResult(null);
    setShowResult(false);
    setIsSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!inputs.price || !inputs.monthlyRent || !result) return;

    const calculationInput: PropertyInput = {
      price: inputs.price,
      monthlyRent: inputs.monthlyRent,
      managementFee: inputs.managementFee || 0,
      repairReserve: inputs.repairReserve || 0,
      propertyTax: inputs.propertyTax || 0,
      insuranceFee: inputs.insuranceFee || 0,
      vacancyRate: inputs.vacancyRate || 5,
      downPayment: inputs.downPayment,
      loanAmount: inputs.loanAmount || 0,
      loanInterestRate: inputs.loanInterestRate || 0,
      loanPeriodYears: inputs.loanPeriodYears || 0,
    };

    const title = `¥${formatCurrency(inputs.price)} / ${formatPercent(result.grossYield)}`;
    addCalculation(title, calculationInput, result);
    setIsSaved(true);
    Alert.alert('保存完了', '計算結果を履歴に保存しました');
  }, [inputs, result, addCalculation]);

  const renderInputField = (field: InputField) => (
    <View key={field.key} style={styles.inputRow}>
      <Text style={styles.inputLabel}>
        {field.label}
        {field.required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={inputs[field.key]?.toString() || ''}
          onChangeText={value => handleInputChange(field.key, value)}
          placeholder={field.placeholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
        />
        {field.suffix && <Text style={styles.inputSuffix}>{field.suffix}</Text>}
      </View>
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
});
