import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { colors } from '../constants/colors';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();

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
        { icon: 'account', label: 'プロフィール', onPress: () => {} },
        { icon: 'credit-card', label: 'サブスクリプション', onPress: () => {} },
      ],
    },
    {
      title: 'アプリ',
      items: [
        { icon: 'bell', label: '通知設定', onPress: () => {} },
        { icon: 'palette', label: 'テーマ', onPress: () => {} },
        { icon: 'translate', label: '言語', onPress: () => {} },
      ],
    },
    {
      title: 'サポート',
      items: [
        { icon: 'help-circle', label: 'ヘルプ', onPress: () => {} },
        { icon: 'information', label: 'アプリについて', onPress: () => {} },
        { icon: 'shield-check', label: 'プライバシーポリシー', onPress: () => {} },
      ],
    },
  ];

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
                    color="#6B7280"
                  />
                  <Text style={styles.settingItemLabel}>{item.label}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#D1D5DB"
                />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
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
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  settingItemLabel: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
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
    color: '#9CA3AF',
  },
});
