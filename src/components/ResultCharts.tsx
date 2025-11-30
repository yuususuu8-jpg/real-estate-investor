import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { CalculationResult, formatCurrency } from '../lib/calculations';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface ResultChartsProps {
  result: CalculationResult;
  showLoan: boolean;
}

const screenWidth = Dimensions.get('window').width;

export default function ResultCharts({ result, showLoan }: ResultChartsProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // 経費内訳の円グラフデータ
  const expenseData = useMemo(() => {
    const data = [];

    if (result.expenses.managementFee > 0) {
      data.push({
        name: '管理費',
        amount: result.expenses.managementFee,
        color: '#3B82F6',
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      });
    }

    if (result.expenses.repairReserve > 0) {
      data.push({
        name: '修繕積立金',
        amount: result.expenses.repairReserve,
        color: '#10B981',
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      });
    }

    if (result.expenses.propertyTax > 0) {
      data.push({
        name: '固定資産税',
        amount: result.expenses.propertyTax,
        color: '#F59E0B',
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      });
    }

    if (result.expenses.insuranceFee > 0) {
      data.push({
        name: '火災保険',
        amount: result.expenses.insuranceFee,
        color: '#EF4444',
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      });
    }

    if (result.expenses.vacancyLoss > 0) {
      data.push({
        name: '空室損失',
        amount: result.expenses.vacancyLoss,
        color: '#8B5CF6',
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      });
    }

    return data;
  }, [result.expenses, colors.textSecondary]);

  // 収支バーチャートデータ
  const cashflowData = useMemo(() => {
    const labels = ['家賃収入', '経費', 'NOI'];
    const data = [
      result.annualRentIncome / 10000, // 万円単位
      result.annualExpenses / 10000,
      result.annualNetIncome / 10000,
    ];

    if (showLoan && result.annualLoanPayment > 0) {
      labels.push('ローン返済', 'CF');
      data.push(
        result.annualLoanPayment / 10000,
        result.annualCashFlow / 10000
      );
    }

    return {
      labels,
      datasets: [
        {
          data: data.map(v => Math.abs(v)),
        },
      ],
    };
  }, [result, showLoan]);

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => isDark
      ? `rgba(59, 130, 246, ${opacity})`
      : `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => colors.textSecondary,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  // 経費がない場合は円グラフを表示しない
  const hasExpenses = expenseData.length > 0;

  return (
    <View style={styles.container}>
      {/* 経費内訳円グラフ */}
      {hasExpenses && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>経費内訳（年間）</Text>
          <View style={styles.pieChartContainer}>
            <PieChart
              data={expenseData}
              width={screenWidth - spacing.lg * 4}
              height={180}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          </View>
          <View style={styles.expenseLegend}>
            {expenseData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>
                  {item.name}: ¥{formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 収支バーチャート */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>年間収支サマリー（万円）</Text>
        <View style={styles.barChartContainer}>
          <BarChart
            data={cashflowData}
            width={screenWidth - spacing.lg * 4}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              barPercentage: 0.5,
            }}
            style={styles.barChart}
            showValuesOnTopOfBars
            fromZero
          />
        </View>
        <View style={styles.cashflowLegend}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>
                家賃収入: ¥{formatCurrency(result.annualRentIncome)}
              </Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>
                経費: ¥{formatCurrency(result.annualExpenses)}
              </Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>
                NOI: ¥{formatCurrency(result.annualNetIncome)}
              </Text>
            </View>
          </View>
          {showLoan && result.annualLoanPayment > 0 && (
            <>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>
                    ローン返済: ¥{formatCurrency(result.annualLoanPayment)}
                  </Text>
                </View>
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: result.annualCashFlow >= 0 ? '#10B981' : '#EF4444' }]} />
                  <Text style={[styles.legendText, { fontWeight: '600' }]}>
                    キャッシュフロー: ¥{formatCurrency(result.annualCashFlow)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  chartSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  barChartContainer: {
    alignItems: 'center',
    marginLeft: -spacing.md,
  },
  barChart: {
    borderRadius: 8,
  },
  expenseLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  cashflowLegend: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendRow: {
    marginBottom: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
