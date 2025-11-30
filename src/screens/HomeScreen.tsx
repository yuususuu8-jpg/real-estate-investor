import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }: any) {
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
      title: '計算履歴',
      icon: 'history',
      color: '#8B5CF6',
      action: () => navigation.navigate('History'),
    },
    {
      id: '3',
      title: '設定',
      icon: 'cog',
      color: '#10B981',
      action: () => navigation.navigate('Settings'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>不動産投資計算</Text>
          <Text style={styles.subtitle}>収益物件の利回りを簡単計算</Text>
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
          
          <View style={styles.featureCard}>
            <MaterialCommunityIcons name="calculator" size={24} color="#3B82F6" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>利回り計算</Text>
              <Text style={styles.featureDescription}>
                表面利回り・実質利回り・CCRを自動計算
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#8B5CF6" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>キャッシュフロー分析</Text>
              <Text style={styles.featureDescription}>
                年間収支とキャッシュフローを詳細分析
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <MaterialCommunityIcons name="brain" size={24} color="#10B981" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI物件評価</Text>
              <Text style={styles.featureDescription}>
                AIが物件のリスクと収益性を評価
              </Text>
            </View>
          </View>
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
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  quickActions: {
    marginBottom: 30,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
  },
  featuresSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});
