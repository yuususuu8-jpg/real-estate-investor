import React, { useMemo } from 'react';
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
import { BarChart } from 'react-native-chart-kit';
import { SavedCalculation } from '../store/calculationStore';
import { formatCurrency, formatPercent } from '../lib/calculations';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface ComparisonScreenProps {
  calculations: SavedCalculation[];
  onGoBack: () => void;
}

const screenWidth = Dimensions.get('window').width;

// Comparison chart colors
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ComparisonScreen({ calculations, onGoBack }: ComparisonScreenProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Short labels for charts (truncate to 8 chars)
  const shortLabels = calculations.map((calc, index) => {
    const label = calc.title.length > 8 ? calc.title.substring(0, 8) + '...' : calc.title;
    return label || `物件${index + 1}`;
  });

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => colors.textSecondary,
    barPercentage: 0.6,
    decimalPlaces: 1,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  // Yield comparison data
  const yieldData = {
    labels: shortLabels,
    datasets: [{
      data: calculations.map(c => c.result.grossYield),
    }],
  };

  // Net yield comparison data
  const netYieldData = {
    labels: shortLabels,
    datasets: [{
      data: calculations.map(c => c.result.netYield),
    }],
  };

  // Cashflow comparison data (in 万円)
  const cashflowData = {
    labels: shortLabels,
    datasets: [{
      data: calculations.map(c => Math.abs(c.result.annualCashFlow) / 10000),
    }],
  };

  // Price comparison data (in 万円)
  const priceData = {
    labels: shortLabels,
    datasets: [{
      data: calculations.map(c => c.input.price / 10000),
    }],
  };

  const renderComparisonMetric = (
    label: string,
    values: (string | number)[],
    colors?: string[],
    suffix?: string
  ) => (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricValues}>
        {values.map((value, index) => (
          <View key={index} style={styles.metricValueContainer}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] },
              ]}
            />
            <Text
              style={[
                styles.metricValue,
                colors && colors[index] ? { color: colors[index] } : null,
              ]}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
              {suffix}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const getBestIndex = (values: number[], higherIsBetter = true): number => {
    if (higherIsBetter) {
      return values.indexOf(Math.max(...values));
    }
    return values.indexOf(Math.min(...values.filter(v => v > 0)));
  };

  const grossYields = calculations.map(c => c.result.grossYield);
  const netYields = calculations.map(c => c.result.netYield);
  const cashflows = calculations.map(c => c.result.annualCashFlow);
  const prices = calculations.map(c => c.input.price);

  const bestGrossYieldIndex = getBestIndex(grossYields);
  const bestNetYieldIndex = getBestIndex(netYields);
  const bestCashflowIndex = getBestIndex(cashflows);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>物件比較</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Property Legend */}
        <View style={styles.legendSection}>
          {calculations.map((calc, index) => (
            <View key={calc.id} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] },
                ]}
              />
              <Text style={styles.legendText} numberOfLines={1}>
                {calc.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>比較サマリー</Text>

          <View style={styles.summaryCard}>
            <MaterialCommunityIcons
              name="trophy"
              size={20}
              color={CHART_COLORS[bestGrossYieldIndex]}
            />
            <Text style={styles.summaryLabel}>表面利回り最高</Text>
            <Text style={styles.summaryValue}>
              {calculations[bestGrossYieldIndex]?.title}
            </Text>
            <Text style={styles.summaryHighlight}>
              {formatPercent(grossYields[bestGrossYieldIndex])}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <MaterialCommunityIcons
              name="star"
              size={20}
              color={CHART_COLORS[bestNetYieldIndex]}
            />
            <Text style={styles.summaryLabel}>実質利回り最高</Text>
            <Text style={styles.summaryValue}>
              {calculations[bestNetYieldIndex]?.title}
            </Text>
            <Text style={styles.summaryHighlight}>
              {formatPercent(netYields[bestNetYieldIndex])}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <MaterialCommunityIcons
              name="cash"
              size={20}
              color={CHART_COLORS[bestCashflowIndex]}
            />
            <Text style={styles.summaryLabel}>キャッシュフロー最高</Text>
            <Text style={styles.summaryValue}>
              {calculations[bestCashflowIndex]?.title}
            </Text>
            <Text style={[
              styles.summaryHighlight,
              cashflows[bestCashflowIndex] < 0 && styles.negativeText
            ]}>
              ¥{formatCurrency(cashflows[bestCashflowIndex])}
            </Text>
          </View>
        </View>

        {/* Yield Comparison Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>表面利回り比較 (%)</Text>
          <BarChart
            data={yieldData}
            width={screenWidth - spacing.lg * 2 - spacing.md * 2}
            height={180}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </View>

        {/* Net Yield Comparison Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>実質利回り比較 (%)</Text>
          <BarChart
            data={netYieldData}
            width={screenWidth - spacing.lg * 2 - spacing.md * 2}
            height={180}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </View>

        {/* Cashflow Comparison Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>年間キャッシュフロー比較 (万円)</Text>
          <BarChart
            data={cashflowData}
            width={screenWidth - spacing.lg * 2 - spacing.md * 2}
            height={180}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </View>

        {/* Detailed Comparison Table */}
        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>詳細比較</Text>

          {renderComparisonMetric(
            '物件価格',
            prices.map(p => `¥${formatCurrency(p)}`)
          )}
          {renderComparisonMetric(
            '月額家賃',
            calculations.map(c => `¥${formatCurrency(c.input.monthlyRent)}`)
          )}
          {renderComparisonMetric(
            '表面利回り',
            grossYields.map(y => formatPercent(y))
          )}
          {renderComparisonMetric(
            '実質利回り',
            netYields.map(y => formatPercent(y))
          )}
          {renderComparisonMetric(
            '年間経費',
            calculations.map(c => `¥${formatCurrency(c.result.annualExpenses)}`)
          )}
          {renderComparisonMetric(
            '年間CF',
            cashflows.map(cf => `¥${formatCurrency(cf)}`),
            cashflows.map(cf => cf >= 0 ? colors.success : colors.error)
          )}
          {calculations.some(c => c.result.ccr > 0) && renderComparisonMetric(
            'CCR',
            calculations.map(c => c.result.ccr > 0 ? formatPercent(c.result.ccr) : '-')
          )}
          {calculations.some(c => c.result.monthlyLoanPayment > 0) && renderComparisonMetric(
            '月額ローン返済',
            calculations.map(c => c.result.monthlyLoanPayment > 0
              ? `¥${formatCurrency(c.result.monthlyLoanPayment)}`
              : '-'
            )
          )}
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
    paddingBottom: spacing['2xl'],
  },
  legendSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
    maxWidth: '48%',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  summarySection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  summaryHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  negativeText: {
    color: colors.error,
  },
  chartSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: 8,
    marginLeft: -spacing.md,
  },
  tableSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  metricRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metricValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
