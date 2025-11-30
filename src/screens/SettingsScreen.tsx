import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { useNetworkStatus, formatTimeSince } from '../hooks/useNetworkStatus';
import { offlineCache, formatCacheSize } from '../lib/offlineCache';
import { ThemeColors } from '../constants/colors';
import type { NavigationProp } from '../navigation/MainNavigator';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { isOnline, syncStatus } = useNetworkStatus();

  const [cacheStats, setCacheStats] = useState<{
    totalSize: number;
    entryCount: number;
  }>({ totalSize: 0, entryCount: 0 });
  const [isClearing, setIsClearing] = useState(false);

  // Load cache stats
  const loadCacheStats = useCallback(async () => {
    const stats = await offlineCache.getStats();
    setCacheStats({
      totalSize: stats.totalSize,
      entryCount: stats.entryCount,
    });
  }, []);

  useEffect(() => {
    loadCacheStats();
  }, [loadCacheStats]);

  // Clear cache handler
  const handleClearCache = useCallback(() => {
    Alert.alert(
      'キャッシュを削除',
      'オフラインデータのキャッシュを削除します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await offlineCache.clearAll();
              await loadCacheStats();
              Alert.alert('完了', 'キャッシュを削除しました');
            } catch (error) {
              Alert.alert('エラー', 'キャッシュの削除に失敗しました');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  }, [loadCacheStats]);

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしてもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'アカウント',
      items: [
        { icon: 'account', label: 'プロフィール', onPress: () => navigation.navigate('Profile') },
        { icon: 'credit-card', label: 'サブスクリプション', onPress: () => {} },
      ],
    },
    {
      title: 'アプリ',
      items: [
        { icon: 'bell', label: '通知設定', onPress: () => {} },
        { icon: 'palette', label: 'テーマ', onPress: () => navigation.navigate('Theme') },
        { icon: 'translate', label: '言語', onPress: () => navigation.navigate('Language') },
      ],
    },
    {
      title: 'データ',
      items: [
        {
          icon: 'database',
          label: 'キャッシュを削除',
          onPress: handleClearCache,
          rightText: formatCacheSize(cacheStats.totalSize),
        },
        {
          icon: 'cloud-sync',
          label: '同期状態',
          onPress: () => {},
          rightText: isOnline ? (syncStatus.hasPendingChanges ? `${syncStatus.pendingCount}件保留` : '同期済み') : 'オフライン',
        },
      ],
    },
    {
      title: 'サポート',
      items: [
        { icon: 'help-circle', label: 'ヘルプ', onPress: () => navigation.navigate('Help') },
        { icon: 'information', label: 'アプリについて', onPress: () => navigation.navigate('About') },
        { icon: 'shield-check', label: 'プライバシーポリシー', onPress: () => navigation.navigate('PrivacyPolicy') },
      ],
    },
  ];

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>設定</Text>

        {/* User info card */}
        {user && (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <MaterialCommunityIcons name="account" size={32} color={colors.white} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userPlan}>フリープラン</Text>
            </View>
          </View>
        )}

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.settingItem,
                  itemIndex === 0 && styles.firstItem,
                  itemIndex === section.items.length - 1 && styles.lastItem,
                ]}
                onPress={item.onPress}
              >
                <View style={styles.settingItemLeft}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={24}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.settingItemLabel}>{item.label}</Text>
                </View>
                <View style={styles.settingItemRight}>
                  {'rightText' in item && item.rightText && (
                    <Text style={styles.settingItemRightText}>{item.rightText}</Text>
                  )}
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={colors.borderDark}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
          <Text style={styles.logoutText}>ログアウト</Text>
        </TouchableOpacity>

        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  userCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  userPlan: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  firstItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  settingItemRightText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: colors.errorBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  versionSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
