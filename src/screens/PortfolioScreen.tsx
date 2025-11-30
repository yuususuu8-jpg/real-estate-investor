// Portfolio Dashboard Screen - 複数物件の総合分析
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useCalculationStore } from '../store/calculationStore';
import { formatCurrency, formatPercent } from '../lib/calculations';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { NavigationProp } from '../navigation/MainNavigator';
import { FadeInView, SlideInView, ScaleInView } from '../components';
import { sharePortfolioReport, printPortfolioReport } from '../lib/reportGenerator';

const screenWidth = Dimensions.get('window').width;

// Chart colors
const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

interface PortfolioStats {
  totalProperties: number;
  totalValue: number;
  totalMonthlyRent: number;
  totalAnnualCashFlow: number;
  averageGrossYield: number;
  averageNetYield: number;
  totalLoanAmount: number;
  totalEquity: number;
  debtRatio: number;
}

export default function PortfolioScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { calculations } = useCalculationStore();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleShareReport = useCallback(async () => {
    if (calculations.length === 0) return;
    setIsGeneratingReport(true);
    try {
      const success = await sharePortfolioReport(calculations);
      if (!success) {
        Alert.alert('エラー', 'このデバイスでは共有機能を利用できません');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      Alert.alert('エラー', 'レポートの生成に失敗しました');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [calculations]);

  const handlePrintReport = useCallback(async () => {
    if (calculations.length === 0) return;
    setIsGeneratingReport(true);
    try {
      await printPortfolioReport(calculations);
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('エラー', '印刷に失敗しました');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [calculations]);

  // Calculate portfolio statistics
  const stats: PortfolioStats = useMemo(() => {
    if (calculations.length === 0) {
      return {
        totalProperties: 0,
        totalValue: 0,
        totalMonthlyRent: 0,
        totalAnnualCashFlow: 0,
        averageGrossYield: 0,
        averageNetYield: 0,
        totalLoanAmount: 0,
        totalEquity: 0,
        debtRatio: 0,
      };
    }

    const totalValue = calculations.reduce((sum, c) => sum + c.input.price, 0);
    const totalMonthlyRent = calculations.reduce((sum, c) => sum + c.input.monthlyRent, 0);
    const totalAnnualCashFlow = calculations.reduce((sum, c) => sum + c.result.annualCashFlow, 0);
    const totalLoanAmount = calculations.reduce((sum, c) => sum + (c.input.loanAmount || 0), 0);

    const weightedGrossYield = calculations.reduce(
      (sum, c) => sum + (c.result.grossYield * c.input.price),
      0
    ) / totalValue;

    const weightedNetYield = calculations.reduce(
      (sum, c) => sum + (c.result.netYield * c.input.price),
      0
    ) / totalValue;

    return {
      totalProperties: calculations.length,
      totalValue,
      totalMonthlyRent,
      totalAnnualCashFlow,
      averageGrossYield: weightedGrossYield,
      averageNetYield: weightedNetYield,
      totalLoanAmount,
      totalEquity: totalValue - totalLoanAmount,
      debtRatio: totalLoanAmount > 0 ? (totalLoanAmount / totalValue) * 100 : 0,
    };
  }, [calculations]);

  // Pie chart data for property distribution
  const pieChartData = useMemo(() => {
    return calculations.slice(0, 5).map((calc, index) => ({
      name: calc.title.length > 10 ? calc.title.substring(0, 10) + '...' : calc.title,
      value: calc.input.price,
      color: CHART_COLORS[index % CHART_COLORS.length],
      legendFontColor: colors.textSecondary,
      legendFontSize: 11,
    }));
  }, [calculations, colors]);

  // Cash flow chart data
  const cashFlowChartData = useMemo(() => {
    const data = calculations.slice(0, 6).map(c => c.result.annualCashFlow / 10000);
    const labels = calculations.slice(0, 6).map((c, i) =>
      c.title.length > 5 ? c.title.substring(0, 5) : c.title
    );

    return {
      labels: labels.length > 0 ? labels : [''],
      datasets: [{
        data: data.length > 0 ? data : [0],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  }, [calculations]);

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => colors.textSecondary,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
    },
  };

  const renderStatCard = (
    icon: string,
    label: string,
    value: string,
    subValue?: string,
    highlight?: boolean
  ) => (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={24}
        color={highlight ? colors.white : colors.primary}
      />
      <Text style={[styles.statLabel, highlight && styles.statLabelHighlight]}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      {subValue && (
        <Text style={[styles.statSubValue, highlight && styles.statSubValueHighlight]}>
          {subValue}
        </Text>
      )}
    </View>
  );

  if (calculations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>ポートフォリオ</Text>
          <View style={styles.placeholder} />
        </View>
        <FadeInView style={styles.emptyContainer}>
          <MaterialCommunityIcons name="briefcase-outline" size={80} color={colors.border} />
          <Text style={styles.emptyTitle}>物件がありません</Text>
          <Text style={styles.emptyText}>
            計算履歴に物件を追加すると、ポートフォリオ分析が表示されます
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Calculation')}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
            <Text style={styles.addButtonText}>物件を追加</Text>
          </TouchableOpacity>
        </FadeInView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>ポートフォリオ</Text>
        <TouchableOpacity
          onPress={handleShareReport}
          style={styles.reportButton}
          disabled={isGeneratingReport}
        >
          {isGeneratingReport ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary Section */}
        <SlideInView delay={0} direction="up">
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>ポートフォリオ概要</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <MaterialCommunityIcons name="home-group" size={32} color={colors.primary} />
                <Text style={styles.summaryLabel}>保有物件数</Text>
                <Text style={styles.summaryValue}>{stats.totalProperties}件</Text>
              </View>
              <View style={styles.summaryCard}>
                <MaterialCommunityIcons name="cash-multiple" size={32} color={colors.success} />
                <Text style={styles.summaryLabel}>総資産価値</Text>
                <Text style={styles.summaryValue}>
                  ¥{formatCurrency(stats.totalValue)}
                </Text>
              </View>
            </View>
          </View>
        </SlideInView>

        {/* Key Metrics */}
        <SlideInView delay={50} direction="up">
          <View style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>主要指標</Text>
            <View style={styles.metricsGrid}>
              {renderStatCard(
                'percent',
                '平均表面利回り',
                formatPercent(stats.averageGrossYield),
                undefined,
                true
              )}
              {renderStatCard(
                'chart-line',
                '平均実質利回り',
                formatPercent(stats.averageNetYield)
              )}
              {renderStatCard(
                'cash-plus',
                '月間収入',
                `¥${formatCurrency(stats.totalMonthlyRent)}`
              )}
              {renderStatCard(
                'trending-up',
                '年間CF',
                `¥${formatCurrency(stats.totalAnnualCashFlow)}`,
                stats.totalAnnualCashFlow >= 0 ? '黒字' : '赤字'
              )}
            </View>
          </View>
        </SlideInView>

        {/* Financial Structure */}
        <SlideInView delay={100} direction="up">
          <View style={styles.financialSection}>
            <Text style={styles.sectionTitle}>財務構造</Text>
            <View style={styles.financialBar}>
              <View
                style={[
                  styles.equityBar,
                  { flex: stats.totalEquity / stats.totalValue || 0 },
                ]}
              />
              <View
                style={[
                  styles.debtBar,
                  { flex: stats.totalLoanAmount / stats.totalValue || 0 },
                ]}
              />
            </View>
            <View style={styles.financialLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={styles.legendText}>
                  自己資本: ¥{formatCurrency(stats.totalEquity)}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.legendText}>
                  借入: ¥{formatCurrency(stats.totalLoanAmount)}
                </Text>
              </View>
            </View>
            <View style={styles.debtRatioContainer}>
              <Text style={styles.debtRatioLabel}>負債比率</Text>
              <Text style={[
                styles.debtRatioValue,
                stats.debtRatio > 80 ? styles.debtRatioHigh : styles.debtRatioNormal
              ]}>
                {formatPercent(stats.debtRatio)}
              </Text>
              <Text style={styles.debtRatioHint}>
                {stats.debtRatio > 80 ? '高リスク' : stats.debtRatio > 50 ? '適正' : '安全'}
              </Text>
            </View>
          </View>
        </SlideInView>

        {/* Property Distribution Chart */}
        {calculations.length > 1 && (
          <SlideInView delay={150} direction="up">
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>物件価値分布</Text>
              <PieChart
                data={pieChartData}
                width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                height={180}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </SlideInView>
        )}

        {/* Cash Flow Chart */}
        {calculations.length > 1 && (
          <SlideInView delay={200} direction="up">
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>物件別キャッシュフロー (万円/年)</Text>
              <LineChart
                data={cashFlowChartData}
                width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          </SlideInView>
        )}

        {/* Property List */}
        <SlideInView delay={250} direction="up">
          <View style={styles.propertyListSection}>
            <Text style={styles.sectionTitle}>物件一覧</Text>
            {calculations.map((calc, index) => (
              <TouchableOpacity
                key={calc.id}
                style={styles.propertyItem}
                onPress={() => navigation.navigate('History')}
              >
                <View style={styles.propertyInfo}>
                  <View
                    style={[
                      styles.propertyColorDot,
                      { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] },
                    ]}
                  />
                  <View style={styles.propertyDetails}>
                    <Text style={styles.propertyName} numberOfLines={1}>
                      {calc.title}
                    </Text>
                    <Text style={styles.propertyValue}>
                      ¥{formatCurrency(calc.input.price)}
                    </Text>
                  </View>
                </View>
                <View style={styles.propertyMetrics}>
                  <Text style={styles.propertyYield}>
                    {formatPercent(calc.result.grossYield)}
                  </Text>
                  <Text style={[
                    styles.propertyCashFlow,
                    calc.result.annualCashFlow < 0 && styles.negativeCashFlow
                  ]}>
                    ¥{formatCurrency(calc.result.annualCashFlow)}/年
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </SlideInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
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
  reportButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summarySection: {
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  metricsSection: {
    marginBottom: spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statCardHighlight: {
    backgroundColor: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statLabelHighlight: {
    color: 'rgba(255,255,255,0.8)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statValueHighlight: {
    color: colors.white,
  },
  statSubValue: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statSubValueHighlight: {
    color: 'rgba(255,255,255,0.7)',
  },
  financialSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  financialBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  equityBar: {
    backgroundColor: colors.success,
  },
  debtBar: {
    backgroundColor: colors.warning,
  },
  financialLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  debtRatioContainer: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  debtRatioLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  debtRatioValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: spacing.xs,
  },
  debtRatioNormal: {
    color: colors.success,
  },
  debtRatioHigh: {
    color: colors.error,
  },
  debtRatioHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chartSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  chart: {
    borderRadius: 8,
    marginLeft: -spacing.md,
  },
  propertyListSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
  },
  propertyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  propertyColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  propertyDetails: {
    flex: 1,
  },
  propertyName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  propertyValue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  propertyMetrics: {
    alignItems: 'flex-end',
  },
  propertyYield: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  propertyCashFlow: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
  negativeCashFlow: {
    color: colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
