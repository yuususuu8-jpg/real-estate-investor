import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCalculationStore, SavedCalculation } from '../store/calculationStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatPercent } from '../lib/calculations';
import { exportCalculationsToCsv, exportDetailedReport } from '../lib/exportCsv';
import { CalculationCardSkeleton, FadeInView, SlideInView, AnimatedButton } from '../components';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { NavigationProp } from '../navigation/MainNavigator';

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const {
    calculations,
    deleteCalculation,
    toggleFavorite,
    clearAll,
    syncWithCloud,
    isSyncing,
    lastSyncedAt,
    syncError,
  } = useCalculationStore();
  const { isAuthenticated } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Sync on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      syncWithCloud();
    }
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    await syncWithCloud();
    setRefreshing(false);
  };

  const filteredCalculations =
    filter === 'favorites'
      ? calculations.filter(c => c.isFavorite)
      : calculations;

  const handleDelete = (id: string) => {
    Alert.alert('削除確認', 'この計算履歴を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deleteCalculation(id);
          // Remove from selection if selected
          if (selectedIds.has(id)) {
            const newSet = new Set(selectedIds);
            newSet.delete(id);
            setSelectedIds(newSet);
          }
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('全削除確認', 'すべての計算履歴を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '全削除',
        style: 'destructive',
        onPress: () => {
          clearAll();
          setSelectedIds(new Set());
          setIsCompareMode(false);
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleCompareMode = useCallback(() => {
    if (isCompareMode) {
      setSelectedIds(new Set());
    }
    setIsCompareMode(!isCompareMode);
  }, [isCompareMode]);

  const toggleSelection = useCallback((id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      if (newSet.size >= 5) {
        Alert.alert('選択上限', '比較できる物件は最大5件までです');
        return;
      }
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }, [selectedIds]);

  const handleCompare = useCallback(() => {
    if (selectedIds.size < 2) {
      Alert.alert('選択不足', '比較するには2件以上の物件を選択してください');
      return;
    }
    const selectedCalculations = calculations.filter(c => selectedIds.has(c.id));
    navigation.navigate('Comparison', { calculations: selectedCalculations });
  }, [selectedIds, calculations, navigation]);

  const handleExportAll = useCallback(async () => {
    if (calculations.length === 0) {
      Alert.alert('エクスポート', 'エクスポートするデータがありません');
      return;
    }
    setIsExporting(true);
    try {
      const result = await exportCalculationsToCsv(calculations);
      if (result.success) {
        Alert.alert('エクスポート完了', result.message);
      } else {
        Alert.alert('エクスポートエラー', result.message);
      }
    } finally {
      setIsExporting(false);
    }
  }, [calculations]);

  const handleExportSingle = useCallback(async (calculation: SavedCalculation) => {
    setIsExporting(true);
    try {
      const result = await exportDetailedReport(calculation);
      if (result.success) {
        Alert.alert('エクスポート完了', result.message);
      } else {
        Alert.alert('エクスポートエラー', result.message);
      }
    } finally {
      setIsExporting(false);
    }
  }, []);

  const renderCalculationCard = (calculation: SavedCalculation) => {
    const isSelected = selectedIds.has(calculation.id);

    return (
      <TouchableOpacity
        key={calculation.id}
        style={[
          styles.card,
          isCompareMode && styles.cardSelectable,
          isSelected && styles.cardSelected,
        ]}
        onPress={isCompareMode ? () => toggleSelection(calculation.id) : undefined}
        activeOpacity={isCompareMode ? 0.7 : 1}
      >
        {/* Selection Checkbox */}
        {isCompareMode && (
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && (
                <MaterialCommunityIcons name="check" size={16} color={colors.white} />
              )}
            </View>
          </View>
        )}

        <View style={[styles.cardInner, isCompareMode && styles.cardInnerWithCheckbox]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {calculation.title}
              </Text>
              {!isCompareMode && (
                <TouchableOpacity
                  onPress={async () => await toggleFavorite(calculation.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name={calculation.isFavorite ? 'star' : 'star-outline'}
                    size={24}
                    color={calculation.isFavorite ? colors.warning : colors.textDisabled}
                  />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.cardDate}>{formatDate(calculation.createdAt)}</Text>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardRow}>
              <View style={styles.cardMetric}>
                <Text style={styles.cardMetricLabel}>物件価格</Text>
                <Text style={styles.cardMetricValue}>
                  ¥{formatCurrency(calculation.input.price)}
                </Text>
              </View>
              <View style={styles.cardMetric}>
                <Text style={styles.cardMetricLabel}>月額家賃</Text>
                <Text style={styles.cardMetricValue}>
                  ¥{formatCurrency(calculation.input.monthlyRent)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardRow}>
              <View style={styles.cardMetricHighlight}>
                <Text style={styles.cardMetricLabelHighlight}>表面利回り</Text>
                <Text style={styles.cardMetricValueHighlight}>
                  {formatPercent(calculation.result.grossYield)}
                </Text>
              </View>
              <View style={styles.cardMetricHighlight}>
                <Text style={styles.cardMetricLabelHighlight}>実質利回り</Text>
                <Text style={styles.cardMetricValueHighlight}>
                  {formatPercent(calculation.result.netYield)}
                </Text>
              </View>
              <View style={styles.cardMetric}>
                <Text style={styles.cardMetricLabel}>年間CF</Text>
                <Text
                  style={[
                    styles.cardMetricValue,
                    calculation.result.annualCashFlow < 0 && styles.negativeValue,
                  ]}
                >
                  ¥{formatCurrency(calculation.result.annualCashFlow)}
                </Text>
              </View>
            </View>
          </View>

          {!isCompareMode && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.simulationButton}
                onPress={() => navigation.navigate('Simulation', { calculation })}
              >
                <MaterialCommunityIcons name="chart-line-variant" size={20} color={colors.primary} />
                <Text style={styles.simulationButtonText}>シミュレーション</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => handleExportSingle(calculation)}
                disabled={isExporting}
              >
                <MaterialCommunityIcons name="file-export-outline" size={20} color={colors.success} />
                <Text style={styles.exportButtonText}>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(calculation.id)}
              >
                <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
                <Text style={styles.deleteButtonText}>削除</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const formatLastSync = () => {
    if (!lastSyncedAt) return null;
    const date = new Date(lastSyncedAt);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isCompareMode && selectedIds.size > 0 && styles.scrollContentWithFooter,
        ]}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>計算履歴</Text>
            <Text style={styles.description}>
              {calculations.length}件の計算履歴
              {isCompareMode && selectedIds.size > 0 && ` / ${selectedIds.size}件選択中`}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {calculations.length > 0 && !isCompareMode && (
              <TouchableOpacity
                style={styles.exportAllButton}
                onPress={handleExportAll}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.success} />
                ) : (
                  <MaterialCommunityIcons
                    name="file-export-outline"
                    size={20}
                    color={colors.success}
                  />
                )}
                <Text style={styles.exportAllText}>CSV出力</Text>
              </TouchableOpacity>
            )}
            {isAuthenticated && !isCompareMode && (
              <TouchableOpacity
                style={styles.syncButton}
                onPress={syncWithCloud}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons
                    name="cloud-sync"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}
            {calculations.length > 0 && !isCompareMode && (
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearAllText}>全削除</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sync Status */}
        {isAuthenticated && !isCompareMode && (lastSyncedAt || syncError) && (
          <View style={styles.syncStatus}>
            {syncError ? (
              <Text style={styles.syncErrorText}>{syncError}</Text>
            ) : (
              <Text style={styles.syncSuccessText}>
                最終同期: {formatLastSync()}
              </Text>
            )}
          </View>
        )}

        {calculations.length > 0 && (
          <View style={styles.filterRow}>
            {!isCompareMode && (
              <>
                <TouchableOpacity
                  style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                  onPress={() => setFilter('all')}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter === 'all' && styles.filterButtonTextActive,
                    ]}
                  >
                    すべて
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filter === 'favorites' && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilter('favorites')}
                >
                  <MaterialCommunityIcons
                    name="star"
                    size={16}
                    color={filter === 'favorites' ? colors.white : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter === 'favorites' && styles.filterButtonTextActive,
                    ]}
                  >
                    お気に入り
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[
                styles.compareModeButton,
                isCompareMode && styles.compareModeButtonActive,
              ]}
              onPress={toggleCompareMode}
            >
              <MaterialCommunityIcons
                name={isCompareMode ? 'close' : 'compare'}
                size={18}
                color={isCompareMode ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.compareModeButtonText,
                  isCompareMode && styles.compareModeButtonTextActive,
                ]}
              >
                {isCompareMode ? '終了' : '比較'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Skeleton Loading */}
        {isSyncing && calculations.length === 0 && (
          <>
            <CalculationCardSkeleton />
            <CalculationCardSkeleton />
            <CalculationCardSkeleton />
          </>
        )}

        {/* Calculation Cards with Animation */}
        {filteredCalculations.length > 0 ? (
          filteredCalculations.map((calc, index) => (
            <SlideInView key={calc.id} delay={index * 50} direction="up">
              {renderCalculationCard(calc)}
            </SlideInView>
          ))
        ) : !isSyncing && (
          <FadeInView delay={100}>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name={filter === 'favorites' ? 'star-outline' : 'history'}
                size={64}
                color={colors.border}
              />
              <Text style={styles.emptyText}>
                {filter === 'favorites' ? 'お気に入りがありません' : '履歴がありません'}
              </Text>
              <Text style={styles.emptyDescription}>
                {filter === 'favorites'
                  ? '履歴の星マークをタップしてお気に入りに追加'
                  : '物件を計算すると、ここに履歴が表示されます'}
              </Text>
            </View>
          </FadeInView>
        )}
      </ScrollView>

      {/* Compare Footer */}
      {isCompareMode && selectedIds.size > 0 && (
        <View style={styles.compareFooter}>
          <View style={styles.compareFooterInfo}>
            <Text style={styles.compareFooterText}>
              {selectedIds.size}件選択中
            </Text>
            <Text style={styles.compareFooterHint}>
              {selectedIds.size < 2 ? 'もう1件選択してください' : '比較する準備ができました'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.compareButton,
              selectedIds.size < 2 && styles.compareButtonDisabled,
            ]}
            onPress={handleCompare}
            disabled={selectedIds.size < 2}
          >
            <MaterialCommunityIcons name="compare" size={20} color={colors.white} />
            <Text style={styles.compareButtonText}>比較する</Text>
          </TouchableOpacity>
        </View>
      )}
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
  scrollContentWithFooter: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  syncButton: {
    padding: spacing.xs,
  },
  exportAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  exportAllText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  syncStatus: {
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  syncSuccessText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  syncErrorText: {
    fontSize: 12,
    color: colors.error,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clearAllText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  compareModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  compareModeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  compareModeButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  compareModeButtonTextActive: {
    color: colors.white,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardSelectable: {
    flexDirection: 'row',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardInner: {
    flex: 1,
  },
  cardInnerWithCheckbox: {
    flex: 1,
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardMetric: {
    flex: 1,
  },
  cardMetricHighlight: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
  },
  cardMetricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cardMetricLabelHighlight: {
    fontSize: 11,
    color: colors.primary,
    marginBottom: 2,
  },
  cardMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardMetricValueHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  negativeValue: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.sm,
    paddingTop: 0,
    gap: spacing.sm,
  },
  simulationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  simulationButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.error,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textDisabled,
    textAlign: 'center',
  },
  compareFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  compareFooterInfo: {
    flex: 1,
  },
  compareFooterText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  compareFooterHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  compareButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
