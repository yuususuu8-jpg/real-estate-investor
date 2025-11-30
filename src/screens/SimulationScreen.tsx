import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LineChart } from 'react-native-chart-kit';
import { SavedCalculation } from '../store/calculationStore';
import { calculatePropertyInvestment, formatCurrency, formatPercent } from '../lib/calculations';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { CashFlowChart, DetailedCashFlowTable } from '../components';

interface SimulationScreenProps {
  calculation: SavedCalculation;
  onGoBack: () => void;
}

const screenWidth = Dimensions.get('window').width;

export default function SimulationScreen({ calculation, onGoBack }: SimulationScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Simulation parameters
  const [interestRate, setInterestRate] = useState(calculation.input.loanInterestRate || 2);
  const [vacancyRate, setVacancyRate] = useState(calculation.input.vacancyRate || 5);
  const [rentChange, setRentChange] = useState(0); // -20% to +20%

  // Calculate with simulation parameters
  const simulatedResult = useMemo(() => {
    const adjustedRent = Math.round(calculation.input.monthlyRent * (1 + rentChange / 100));
    return calculatePropertyInvestment({
      ...calculation.input,
      monthlyRent: adjustedRent,
      vacancyRate,
      loanInterestRate: interestRate,
    });
  }, [calculation.input, interestRate, vacancyRate, rentChange]);

  // Compare with original
  const originalResult = calculation.result;
  const cashFlowDiff = simulatedResult.annualCashFlow - originalResult.annualCashFlow;
  const netYieldDiff = simulatedResult.netYield - originalResult.netYield;

  // Generate chart data for interest rate scenarios
  const interestRateChartData = useMemo(() => {
    const rates = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    const cashflows = rates.map(rate => {
      const result = calculatePropertyInvestment({
        ...calculation.input,
        loanInterestRate: rate,
      });
      return result.annualCashFlow / 10000; // Convert to 万円
    });

    return {
      labels: rates.map(r => `${r}%`),
      datasets: [{
        data: cashflows,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  }, [calculation.input]);

  // Generate chart data for vacancy rate scenarios
  const vacancyRateChartData = useMemo(() => {
    const rates = [0, 5, 10, 15, 20, 25, 30];
    const cashflows = rates.map(rate => {
      const result = calculatePropertyInvestment({
        ...calculation.input,
        vacancyRate: rate,
      });
      return result.annualCashFlow / 10000; // Convert to 万円
    });

    return {
      labels: rates.map(r => `${r}%`),
      datasets: [{
        data: cashflows,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  }, [calculation.input]);

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => colors.textSecondary,
    decimalPlaces: 0,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  const resetSimulation = useCallback(() => {
    setInterestRate(calculation.input.loanInterestRate || 2);
    setVacancyRate(calculation.input.vacancyRate || 5);
    setRentChange(0);
  }, [calculation.input]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>シミュレーション</Text>
        <TouchableOpacity onPress={resetSimulation} style={styles.resetButton}>
          <MaterialCommunityIcons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Property Info */}
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {calculation.title}
          </Text>
          <Text style={styles.propertyPrice}>
            物件価格: ¥{formatCurrency(calculation.input.price)}
          </Text>
        </View>

        {/* Simulation Result Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>シミュレーション結果</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>年間キャッシュフロー</Text>
              <Text style={[
                styles.summaryValue,
                simulatedResult.annualCashFlow < 0 && styles.negativeValue
              ]}>
                ¥{formatCurrency(simulatedResult.annualCashFlow)}
              </Text>
              <View style={styles.diffBadge}>
                <MaterialCommunityIcons
                  name={cashFlowDiff >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={cashFlowDiff >= 0 ? colors.success : colors.error}
                />
                <Text style={[
                  styles.diffText,
                  { color: cashFlowDiff >= 0 ? colors.success : colors.error }
                ]}>
                  ¥{formatCurrency(Math.abs(cashFlowDiff))}
                </Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>実質利回り</Text>
              <Text style={styles.summaryValue}>
                {formatPercent(simulatedResult.netYield)}
              </Text>
              <View style={styles.diffBadge}>
                <MaterialCommunityIcons
                  name={netYieldDiff >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={netYieldDiff >= 0 ? colors.success : colors.error}
                />
                <Text style={[
                  styles.diffText,
                  { color: netYieldDiff >= 0 ? colors.success : colors.error }
                ]}>
                  {Math.abs(netYieldDiff).toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sliders Section */}
        <View style={styles.slidersSection}>
          <Text style={styles.sectionTitle}>パラメータ調整</Text>

          {/* Interest Rate Slider */}
          {calculation.input.loanAmount && calculation.input.loanAmount > 0 && (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>金利</Text>
                <Text style={styles.sliderValue}>{interestRate.toFixed(1)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={5}
                step={0.1}
                value={interestRate}
                onValueChange={setInterestRate}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <View style={styles.sliderRange}>
                <Text style={styles.sliderRangeText}>0.5%</Text>
                <Text style={styles.sliderRangeText}>5%</Text>
              </View>
            </View>
          )}

          {/* Vacancy Rate Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>空室率</Text>
              <Text style={styles.sliderValue}>{vacancyRate.toFixed(0)}%</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={30}
              step={1}
              value={vacancyRate}
              onValueChange={setVacancyRate}
              minimumTrackTintColor={colors.warning}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.warning}
            />
            <View style={styles.sliderRange}>
              <Text style={styles.sliderRangeText}>0%</Text>
              <Text style={styles.sliderRangeText}>30%</Text>
            </View>
          </View>

          {/* Rent Change Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>家賃変動</Text>
              <Text style={[
                styles.sliderValue,
                rentChange > 0 && { color: colors.success },
                rentChange < 0 && { color: colors.error },
              ]}>
                {rentChange > 0 ? '+' : ''}{rentChange.toFixed(0)}%
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={-20}
              maximumValue={20}
              step={1}
              value={rentChange}
              onValueChange={setRentChange}
              minimumTrackTintColor={colors.info}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.info}
            />
            <View style={styles.sliderRange}>
              <Text style={styles.sliderRangeText}>-20%</Text>
              <Text style={styles.sliderRangeText}>+20%</Text>
            </View>
          </View>
        </View>

        {/* Interest Rate Chart */}
        {calculation.input.loanAmount && calculation.input.loanAmount > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>金利シナリオ分析</Text>
            <Text style={styles.chartSubtitle}>金利変動によるキャッシュフローの推移 (万円)</Text>
            <LineChart
              data={interestRateChartData}
              width={screenWidth - spacing.lg * 2 - spacing.md * 2}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withDots
              withInnerLines
              withOuterLines
              withVerticalLabels
              withHorizontalLabels
              fromZero={false}
            />
          </View>
        )}

        {/* Vacancy Rate Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>空室率シナリオ分析</Text>
          <Text style={styles.chartSubtitle}>空室率変動によるキャッシュフローの推移 (万円)</Text>
          <LineChart
            data={vacancyRateChartData}
            width={screenWidth - spacing.lg * 2 - spacing.md * 2}
            height={200}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            }}
            bezier
            style={styles.chart}
            withDots
            withInnerLines
            withOuterLines
            withVerticalLabels
            withHorizontalLabels
            fromZero={false}
          />
        </View>

        {/* Long-term Cash Flow Chart */}
        {calculation.input.loanAmount && calculation.input.loanPeriodYears && (
          <View style={styles.chartSection}>
            <CashFlowChart
              data={{
                propertyPrice: calculation.input.price,
                downPayment: calculation.input.downPayment ?? 0,
                loanAmount: calculation.input.loanAmount,
                interestRate: interestRate,
                loanTermYears: calculation.input.loanPeriodYears,
                annualRent: simulatedResult.annualRentIncome,
                annualExpenses: simulatedResult.annualExpenses,
                vacancyRate: vacancyRate,
              }}
              yearsToProject={Math.max(calculation.input.loanPeriodYears, 30)}
              showCumulative={true}
            />
          </View>
        )}

        {/* Detailed Cash Flow Table */}
        {calculation.input.loanAmount && calculation.input.loanPeriodYears && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>キャッシュフロー詳細表</Text>
            <DetailedCashFlowTable
              data={{
                propertyPrice: calculation.input.price,
                downPayment: calculation.input.downPayment ?? 0,
                loanAmount: calculation.input.loanAmount,
                interestRate: interestRate,
                loanTermYears: calculation.input.loanPeriodYears,
                annualRent: simulatedResult.annualRentIncome,
                annualExpenses: simulatedResult.annualExpenses,
                vacancyRate: vacancyRate,
              }}
              yearsToShow={10}
            />
          </View>
        )}

        {/* Break-even Analysis */}
        <View style={styles.breakEvenSection}>
          <Text style={styles.sectionTitle}>損益分岐点</Text>
          <View style={styles.breakEvenCard}>
            <View style={styles.breakEvenItem}>
              <MaterialCommunityIcons name="percent" size={24} color={colors.primary} />
              <Text style={styles.breakEvenLabel}>CF = 0 となる空室率</Text>
              <Text style={styles.breakEvenValue}>
                {(() => {
                  // Calculate break-even vacancy rate
                  for (let v = 0; v <= 100; v++) {
                    const result = calculatePropertyInvestment({
                      ...calculation.input,
                      vacancyRate: v,
                    });
                    if (result.annualCashFlow <= 0) {
                      return `約${v}%`;
                    }
                  }
                  return '100%以上';
                })()}
              </Text>
            </View>
            {calculation.input.loanAmount && calculation.input.loanAmount > 0 && (
              <View style={styles.breakEvenItem}>
                <MaterialCommunityIcons name="bank" size={24} color={colors.warning} />
                <Text style={styles.breakEvenLabel}>CF = 0 となる金利</Text>
                <Text style={styles.breakEvenValue}>
                  {(() => {
                    // Calculate break-even interest rate
                    for (let i = 0; i <= 100; i += 0.5) {
                      const result = calculatePropertyInvestment({
                        ...calculation.input,
                        loanInterestRate: i,
                      });
                      if (result.annualCashFlow <= 0) {
                        return `約${i.toFixed(1)}%`;
                      }
                    }
                    return '10%以上';
                  })()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <View style={styles.tipCard}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.warning} />
            <Text style={styles.tipText}>
              金利上昇リスクを考慮し、現在より1-2%高い金利でもキャッシュフローがプラスになるか確認しましょう。
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
  resetButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  propertyInfo: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  propertyPrice: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  negativeValue: {
    color: '#FCA5A5',
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  diffText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  slidersSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sliderContainer: {
    marginBottom: spacing.lg,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
  sliderRangeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  chartSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chartSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: 8,
    marginLeft: -spacing.md,
  },
  breakEvenSection: {
    marginBottom: spacing.md,
  },
  breakEvenCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  breakEvenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakEvenLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  breakEvenValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tipsSection: {
    marginBottom: spacing.md,
  },
  tipCard: {
    backgroundColor: colors.warningBackground,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning,
    lineHeight: 20,
  },
});
