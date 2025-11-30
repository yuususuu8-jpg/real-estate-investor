import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { ThemeColors } from '../constants/colors';
import { OfflineIndicator, NetworkTypeIndicator } from '../components';
import type { NavigationProp } from '../navigation/MainNavigator';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { isOnline, syncStatus } = useNetworkStatus();

  const quickActions = [
    {
      id: '1',
      title: '新規物件計算',
      icon: 'calculator-variant',
      color: '#3B82F6',
      action: () => navigation.navigate('Calculation'),
    },
    {
      id: '2',
      title: 'ポートフォリオ',
      icon: 'chart-pie',
      color: '#F59E0B',
      action: () => navigation.navigate('Portfolio'),
    },
    {
      id: '3',
      title: '計算履歴',
      icon: 'history',
      color: '#8B5CF6',
      action: () => navigation.navigate('History'),
    },
    {
      id: '4',
      title: '設定',
      icon: 'cog',
      color: '#10B981',
      action: () => navigation.navigate('Settings'),
    },
  ];

  const styles = createStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Banner */}
      <OfflineIndicator showSyncStatus={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>不動産投資計算</Text>
              <Text style={styles.subtitle}>収益物件の利回りを簡単計算</Text>
            </View>
            <NetworkTypeIndicator />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
              onPress={action.action}
            >
              <MaterialCommunityIcons
                name={action.icon as any}
                size={32}
                color={action.color}
              />
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>主な機能</Text>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('Calculation')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="calculator" size={24} color="#3B82F6" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>利回り計算</Text>
              <Text style={styles.featureDescription}>
                表面利回り・実質利回り・CCRを自動計算
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.borderDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('Calculation')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chart-line" size={24} color="#8B5CF6" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>キャッシュフロー分析</Text>
              <Text style={styles.featureDescription}>
                年間収支とキャッシュフローを詳細分析
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.borderDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('AIEvaluation')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="brain" size={24} color="#10B981" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI物件評価</Text>
              <Text style={styles.featureDescription}>
                AIが物件のリスクと収益性を評価
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.borderDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('Portfolio')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chart-pie" size={24} color="#F59E0B" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>ポートフォリオ管理</Text>
              <Text style={styles.featureDescription}>
                複数物件の総合分析とリスク管理
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.borderDark} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  quickActions: {
    marginBottom: 30,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 16,
  },
  featuresSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
