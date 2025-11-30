// Skeleton Loader Component for Loading States
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Shimmer animation component
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)']
      : ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.1)'],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

// Skeleton for calculation card
export function CalculationCardSkeleton() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerRow}>
          <Skeleton width="60%" height={18} />
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
        <Skeleton width="40%" height={14} style={{ marginTop: spacing.xs }} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.row}>
          <View style={styles.metric}>
            <Skeleton width="50%" height={12} />
            <Skeleton width="80%" height={16} style={{ marginTop: spacing.xs }} />
          </View>
          <View style={styles.metric}>
            <Skeleton width="50%" height={12} />
            <Skeleton width="80%" height={16} style={{ marginTop: spacing.xs }} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.highlightBox}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="50%" height={20} style={{ marginTop: spacing.xs }} />
          </View>
          <View style={styles.highlightBox}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="50%" height={20} style={{ marginTop: spacing.xs }} />
          </View>
          <View style={styles.metric}>
            <Skeleton width="50%" height={12} />
            <Skeleton width="80%" height={16} style={{ marginTop: spacing.xs }} />
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <Skeleton width={100} height={36} borderRadius={8} />
        <Skeleton width={60} height={36} borderRadius={8} />
        <Skeleton width={50} height={36} borderRadius={8} />
      </View>
    </View>
  );
}

// Skeleton for home screen
export function HomeSkeleton() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.homeContainer}>
      {/* Title */}
      <Skeleton width="50%" height={28} style={{ marginBottom: spacing.xs }} />
      <Skeleton width="70%" height={16} style={{ marginBottom: spacing.lg }} />

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width="60%" height={12} style={{ marginTop: spacing.sm }} />
          <Skeleton width="40%" height={24} style={{ marginTop: spacing.xs }} />
        </View>
        <View style={styles.statCard}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width="60%" height={12} style={{ marginTop: spacing.sm }} />
          <Skeleton width="40%" height={24} style={{ marginTop: spacing.xs }} />
        </View>
      </View>

      {/* Quick actions */}
      <Skeleton width="40%" height={20} style={{ marginTop: spacing.xl, marginBottom: spacing.md }} />
      <View style={styles.actionRow}>
        <View style={styles.actionButton}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width="80%" height={14} style={{ marginTop: spacing.sm }} />
        </View>
        <View style={styles.actionButton}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width="80%" height={14} style={{ marginTop: spacing.sm }} />
        </View>
        <View style={styles.actionButton}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width="80%" height={14} style={{ marginTop: spacing.sm }} />
        </View>
      </View>

      {/* Recent calculations */}
      <Skeleton width="50%" height={20} style={{ marginTop: spacing.xl, marginBottom: spacing.md }} />
      <CalculationCardSkeleton />
    </View>
  );
}

// Skeleton for result section
export function ResultSkeleton() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.resultContainer}>
      {/* Main result cards */}
      <View style={styles.resultRow}>
        <View style={styles.resultCard}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="80%" height={32} style={{ marginTop: spacing.sm }} />
        </View>
        <View style={styles.resultCard}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="80%" height={32} style={{ marginTop: spacing.sm }} />
        </View>
      </View>

      {/* Detail section */}
      <View style={styles.detailSection}>
        <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.detailRow}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="30%" height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    cardHeader: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardContent: {
      padding: spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    metric: {
      flex: 1,
    },
    highlightBox: {
      flex: 1,
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
      padding: spacing.sm,
      alignItems: 'center',
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
      gap: spacing.sm,
    },
    homeContainer: {
      padding: spacing.lg,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center',
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center',
    },
    resultContainer: {
      padding: spacing.md,
    },
    resultRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    resultCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center',
    },
    detailSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
  });
