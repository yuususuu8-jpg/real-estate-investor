// キャッシュフロー推移グラフコンポーネント
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../constants/colors';

const screenWidth = Dimensions.get('window').width;

interface CashFlowData {
  propertyPrice: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  annualRent: number;
  annualExpenses: number;
  vacancyRate: number;
}

interface CashFlowChartProps {
  data: CashFlowData;
  yearsToProject?: number;
  showCumulative?: boolean;
  compactMode?: boolean;
}

interface YearlyProjection {
  year: number;
  annualCashFlow: number;
  cumulativeCashFlow: number;
  loanBalance: number;
  equity: number;
  netWorth: number;
}

export function CashFlowChart({
  data,
  yearsToProject = 30,
  showCumulative = true,
  compactMode = false,
}: CashFlowChartProps) {
  const { colors, isDark } = useTheme();
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [dataView, setDataView] = useState<'cashflow' | 'equity' | 'networth'>('cashflow');

  // Calculate yearly projections
  const projections = useMemo((): YearlyProjection[] => {
    const {
      propertyPrice,
      downPayment,
      loanAmount,
      interestRate,
      loanTermYears,
      annualRent,
      annualExpenses,
      vacancyRate,
    } = data;

    // Calculate monthly payment using amortization formula
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = loanTermYears * 12;
    const monthlyPayment = loanAmount > 0 && monthlyRate > 0
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1)
      : loanAmount / totalPayments;

    const annualDebtService = monthlyPayment * 12;
    const effectiveAnnualRent = annualRent * (1 - vacancyRate / 100);

    const results: YearlyProjection[] = [];
    let cumulativeCashFlow = -downPayment; // Start with initial investment
    let remainingLoan = loanAmount;

    for (let year = 1; year <= yearsToProject; year++) {
      // Calculate cash flow for this year
      const annualCashFlow = effectiveAnnualRent - annualExpenses - (year <= loanTermYears ? annualDebtService : 0);
      cumulativeCashFlow += annualCashFlow;

      // Calculate remaining loan balance
      if (year <= loanTermYears && monthlyRate > 0) {
        const paymentsRemaining = (loanTermYears - year) * 12;
        remainingLoan = monthlyPayment * (1 - Math.pow(1 + monthlyRate, -paymentsRemaining)) / monthlyRate;
      } else if (year > loanTermYears) {
        remainingLoan = 0;
      }

      // Assume 2% annual property appreciation
      const currentPropertyValue = propertyPrice * Math.pow(1.02, year);
      const equity = currentPropertyValue - Math.max(0, remainingLoan);
      const netWorth = cumulativeCashFlow + equity - downPayment;

      results.push({
        year,
        annualCashFlow,
        cumulativeCashFlow,
        loanBalance: Math.max(0, remainingLoan),
        equity,
        netWorth,
      });
    }

    return results;
  }, [data, yearsToProject]);

  // Find break-even year
  const breakEvenYear = useMemo(() => {
    const breakEven = projections.find(p => p.cumulativeCashFlow >= 0);
    return breakEven?.year || null;
  }, [projections]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const displayYears = compactMode ? 10 : yearsToProject;
    const step = Math.ceil(displayYears / 10);
    const filteredProjections = projections
      .filter((_, i) => i < displayYears && (i % step === 0 || i === displayYears - 1))
      .slice(0, 10);

    let dataSet: number[];
    switch (dataView) {
      case 'equity':
        dataSet = filteredProjections.map(p => p.equity / 10000);
        break;
      case 'networth':
        dataSet = filteredProjections.map(p => p.netWorth / 10000);
        break;
      case 'cashflow':
      default:
        dataSet = showCumulative
          ? filteredProjections.map(p => p.cumulativeCashFlow / 10000)
          : filteredProjections.map(p => p.annualCashFlow / 10000);
    }

    return {
      labels: filteredProjections.map(p => `${p.year}年`),
      datasets: [{ data: dataSet }],
    };
  }, [projections, dataView, showCumulative, compactMode, yearsToProject]);

  const styles = createStyles(colors, isDark, compactMode);

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      switch (dataView) {
        case 'equity':
          return `rgba(139, 92, 246, ${opacity})`;
        case 'networth':
          return `rgba(16, 185, 129, ${opacity})`;
        default:
          return `rgba(59, 130, 246, ${opacity})`;
      }
    },
    labelColor: () => colors.textSecondary,
    style: { borderRadius: 16 },
    propsForDots: {
      r: compactMode ? '3' : '5',
      strokeWidth: '2',
      stroke: colors.surface,
    },
  };

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 10000) {
      return `${(value / 10000).toFixed(1)}億`;
    }
    return `${value.toFixed(0)}万`;
  };

  // Summary metrics
  const finalYear = projections[projections.length - 1];
  const year10 = projections[9] || finalYear;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>キャッシュフロー推移</Text>
        <View style={styles.chartTypeToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, chartType === 'line' && styles.toggleButtonActive]}
            onPress={() => setChartType('line')}
          >
            <MaterialCommunityIcons
              name="chart-line"
              size={18}
              color={chartType === 'line' ? '#fff' : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, chartType === 'bar' && styles.toggleButtonActive]}
            onPress={() => setChartType('bar')}
          >
            <MaterialCommunityIcons
              name="chart-bar"
              size={18}
              color={chartType === 'bar' ? '#fff' : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Data View Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dataViewSelector}>
        <TouchableOpacity
          style={[styles.dataViewButton, dataView === 'cashflow' && styles.dataViewButtonActive]}
          onPress={() => setDataView('cashflow')}
        >
          <Text style={[styles.dataViewText, dataView === 'cashflow' && styles.dataViewTextActive]}>
            キャッシュフロー
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dataViewButton, dataView === 'equity' && styles.dataViewButtonActive]}
          onPress={() => setDataView('equity')}
        >
          <Text style={[styles.dataViewText, dataView === 'equity' && styles.dataViewTextActive]}>
            エクイティ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dataViewButton, dataView === 'networth' && styles.dataViewButtonActive]}
          onPress={() => setDataView('networth')}
        >
          <Text style={[styles.dataViewText, dataView === 'networth' && styles.dataViewTextActive]}>
            純資産
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {chartType === 'line' ? (
          <LineChart
            data={chartData}
            width={Math.max(screenWidth - 40, chartData.labels.length * 50)}
            height={compactMode ? 180 : 220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            yAxisSuffix="万"
            fromZero={false}
          />
        ) : (
          <BarChart
            data={chartData}
            width={Math.max(screenWidth - 40, chartData.labels.length * 50)}
            height={compactMode ? 180 : 220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisSuffix="万"
            showValuesOnTopOfBars={!compactMode}
            fromZero={false}
            yAxisLabel=""
          />
        )}
      </ScrollView>

      {/* Summary Metrics */}
      {!compactMode && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>10年後累計CF</Text>
            <Text style={[styles.metricValue, year10.cumulativeCashFlow >= 0 ? styles.positive : styles.negative]}>
              {formatCurrency(year10.cumulativeCashFlow)}円
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{yearsToProject}年後累計CF</Text>
            <Text style={[styles.metricValue, finalYear.cumulativeCashFlow >= 0 ? styles.positive : styles.negative]}>
              {formatCurrency(finalYear.cumulativeCashFlow)}円
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>損益分岐点</Text>
            <Text style={[styles.metricValue, breakEvenYear ? styles.positive : styles.negative]}>
              {breakEvenYear ? `${breakEvenYear}年目` : '期間内に到達せず'}
            </Text>
          </View>
        </View>
      )}

      {/* Break-even indicator */}
      {breakEvenYear && (
        <View style={styles.breakEvenBadge}>
          <MaterialCommunityIcons name="flag-checkered" size={16} color="#10B981" />
          <Text style={styles.breakEvenText}>
            投資回収: {breakEvenYear}年目に損益分岐点到達
          </Text>
        </View>
      )}
    </View>
  );
}

interface DetailedCashFlowTableProps {
  data: CashFlowData;
  yearsToShow?: number;
}

// Detailed table component for cash flow breakdown
export function DetailedCashFlowTable({ data, yearsToShow = 10 }: DetailedCashFlowTableProps) {
  const { colors, isDark } = useTheme();

  const projections = useMemo(() => {
    const {
      propertyPrice,
      downPayment,
      loanAmount,
      interestRate,
      loanTermYears,
      annualRent,
      annualExpenses,
      vacancyRate,
    } = data;

    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = loanTermYears * 12;
    const monthlyPayment = loanAmount > 0 && monthlyRate > 0
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1)
      : loanAmount / totalPayments;

    const annualDebtService = monthlyPayment * 12;
    const effectiveAnnualRent = annualRent * (1 - vacancyRate / 100);

    const results = [];
    let cumulativeCashFlow = -downPayment;
    let remainingLoan = loanAmount;

    for (let year = 1; year <= yearsToShow; year++) {
      // Interest and principal breakdown
      let annualInterest = 0;
      let annualPrincipal = 0;

      if (year <= loanTermYears && monthlyRate > 0) {
        // Calculate interest/principal for this year
        for (let month = 1; month <= 12; month++) {
          const interestPayment = remainingLoan * monthlyRate;
          const principalPayment = monthlyPayment - interestPayment;
          annualInterest += interestPayment;
          annualPrincipal += principalPayment;
          remainingLoan = Math.max(0, remainingLoan - principalPayment);
        }
      }

      const annualCashFlow = effectiveAnnualRent - annualExpenses - (year <= loanTermYears ? annualDebtService : 0);
      cumulativeCashFlow += annualCashFlow;

      results.push({
        year,
        grossRent: annualRent,
        effectiveRent: effectiveAnnualRent,
        expenses: annualExpenses,
        interest: annualInterest,
        principal: annualPrincipal,
        debtService: year <= loanTermYears ? annualDebtService : 0,
        cashFlow: annualCashFlow,
        cumulativeCashFlow,
        loanBalance: Math.max(0, remainingLoan),
      });
    }

    return results;
  }, [data, yearsToShow]);

  const styles = createTableStyles(colors, isDark);
  const formatCurrency = (val: number) => `${(val / 10000).toFixed(0)}万`;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={styles.table}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={[styles.cell, styles.headerCell, styles.yearCell]}>年</Text>
          <Text style={[styles.cell, styles.headerCell]}>実質賃料</Text>
          <Text style={[styles.cell, styles.headerCell]}>経費</Text>
          <Text style={[styles.cell, styles.headerCell]}>返済額</Text>
          <Text style={[styles.cell, styles.headerCell]}>CF</Text>
          <Text style={[styles.cell, styles.headerCell]}>累計CF</Text>
          <Text style={[styles.cell, styles.headerCell]}>残債</Text>
        </View>

        {/* Data Rows */}
        {projections.map((row, index) => (
          <View key={row.year} style={[styles.dataRow, index % 2 === 0 && styles.alternateRow]}>
            <Text style={[styles.cell, styles.yearCell]}>{row.year}</Text>
            <Text style={styles.cell}>{formatCurrency(row.effectiveRent)}</Text>
            <Text style={styles.cell}>{formatCurrency(row.expenses)}</Text>
            <Text style={styles.cell}>{formatCurrency(row.debtService)}</Text>
            <Text style={[styles.cell, row.cashFlow >= 0 ? styles.positive : styles.negative]}>
              {formatCurrency(row.cashFlow)}
            </Text>
            <Text style={[styles.cell, row.cumulativeCashFlow >= 0 ? styles.positive : styles.negative]}>
              {formatCurrency(row.cumulativeCashFlow)}
            </Text>
            <Text style={styles.cell}>{formatCurrency(row.loanBalance)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean, compact: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: compact ? 12 : 16,
      marginVertical: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    chartTypeToggle: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 2,
    },
    toggleButton: {
      padding: 6,
      borderRadius: 6,
    },
    toggleButtonActive: {
      backgroundColor: '#3B82F6',
    },
    dataViewSelector: {
      marginBottom: 12,
    },
    dataViewButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
    },
    dataViewButtonActive: {
      backgroundColor: '#3B82F6',
    },
    dataViewText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    dataViewTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    chart: {
      borderRadius: 12,
      marginVertical: 8,
    },
    metricsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    metricCard: {
      flex: 1,
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    metricLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    metricValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    positive: {
      color: '#10B981',
    },
    negative: {
      color: '#EF4444',
    },
    breakEvenBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginTop: 12,
    },
    breakEvenText: {
      fontSize: 13,
      color: '#10B981',
      fontWeight: '600',
      marginLeft: 6,
    },
  });

const createTableStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    table: {
      backgroundColor: colors.surface,
      borderRadius: 8,
    },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    dataRow: {
      flexDirection: 'row',
    },
    alternateRow: {
      backgroundColor: colors.background,
    },
    cell: {
      width: 80,
      paddingVertical: 10,
      paddingHorizontal: 8,
      textAlign: 'center',
      fontSize: 12,
      color: colors.textPrimary,
    },
    headerCell: {
      fontWeight: '600',
      color: colors.textSecondary,
      fontSize: 11,
    },
    yearCell: {
      width: 50,
      fontWeight: '600',
    },
    positive: {
      color: '#10B981',
    },
    negative: {
      color: '#EF4444',
    },
  });
