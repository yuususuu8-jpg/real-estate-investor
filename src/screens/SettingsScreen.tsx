import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
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
        
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.settingItem,
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
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  lastItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
