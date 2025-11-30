import React, { useState, useEffect } from 'react';
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
import { useCalculationStore, SavedCalculation } from '../store/calculationStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatPercent } from '../lib/calculations';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

export default function HistoryScreen() {
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
        onPress: clearAll,
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

  const renderCalculationCard = (calculation: SavedCalculation) => (
    <View key={calculation.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {calculation.title}
          </Text>
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

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(calculation.id)}
        >
          <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        contentContainerStyle={styles.scrollContent}
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
            </Text>
          </View>
          <View style={styles.headerActions}>
            {isAuthenticated && (
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
            {calculations.length > 0 && (
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearAllText}>全削除</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sync Status */}
        {isAuthenticated && (lastSyncedAt || syncError) && (
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
          </View>
        )}

        {filteredCalculations.length > 0 ? (
          filteredCalculations.map(renderCalculationCard)
        ) : (
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
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.white,
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
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
    backgroundColor: colors.white,
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
});
