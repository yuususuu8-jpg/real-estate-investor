// Offline Indicator Component - ネットワーク状態表示
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetworkStatus, formatTimeSince } from '../hooks/useNetworkStatus';
import { useThemeColors } from '../hooks/useThemeColors';

interface OfflineIndicatorProps {
  showSyncStatus?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

export function OfflineIndicator({
  showSyncStatus = true,
  compact = false,
  onPress
}: OfflineIndicatorProps) {
  const colors = useThemeColors();
  const { networkStatus, syncStatus, isOnline } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Slide animation when offline
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline ? -100 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [isOnline, slideAnim]);

  // Pulse animation for pending changes
  useEffect(() => {
    if (syncStatus.hasPendingChanges && isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [syncStatus.hasPendingChanges, isOnline, pulseAnim]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
    banner: {
      backgroundColor: '#EF4444',
      paddingVertical: compact ? 6 : 10,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    icon: {
      marginRight: 8,
    },
    text: {
      color: '#FFFFFF',
      fontSize: compact ? 12 : 14,
      fontWeight: '600',
    },
    subText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: compact ? 10 : 12,
      marginLeft: 8,
    },
    syncBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warning,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    syncBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
    },
    statusBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    lastSync: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });

  // Compact sync badge (for inline display)
  if (compact && showSyncStatus && syncStatus.hasPendingChanges) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Animated.View
          style={[
            styles.syncBadge,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <MaterialCommunityIcons
            name="cloud-upload-outline"
            size={14}
            color="#FFFFFF"
          />
          <Text style={styles.syncBadgeText}>
            {syncStatus.pendingCount}件未同期
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Offline banner
  if (!isOnline) {
    return (
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <TouchableOpacity
          style={styles.banner}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="wifi-off"
            size={compact ? 16 : 20}
            color="#FFFFFF"
            style={styles.icon}
          />
          <Text style={styles.text}>オフラインです</Text>
          {syncStatus.hasPendingChanges && (
            <Text style={styles.subText}>
              {syncStatus.pendingCount}件の変更を保留中
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Status bar with sync info (optional)
  if (showSyncStatus && !compact) {
    return (
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? colors.success : colors.error }
            ]}
          />
          <Text style={styles.statusText}>
            {isOnline ? 'オンライン' : 'オフライン'}
          </Text>
        </View>
        <Text style={styles.lastSync}>
          最終同期: {formatTimeSince(syncStatus.lastSyncTime)}
        </Text>
      </View>
    );
  }

  return null;
}

// Floating sync button for manual sync
interface SyncButtonProps {
  onSync: () => Promise<void>;
  disabled?: boolean;
}

export function SyncButton({ onSync, disabled = false }: SyncButtonProps) {
  const colors = useThemeColors();
  const { syncStatus, isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSyncing) {
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotate.start();
      return () => rotate.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isSyncing, rotateAnim]);

  const handleSync = async () => {
    if (isSyncing || disabled || !isOnline) return;
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    button: {
      position: 'absolute',
      bottom: 100,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: syncStatus.hasPendingChanges ? colors.warning : colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
      opacity: disabled || !isOnline ? 0.5 : 1,
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
  });

  if (!syncStatus.hasPendingChanges && !isSyncing) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleSync}
      activeOpacity={0.8}
      disabled={disabled || !isOnline}
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <MaterialCommunityIcons
          name={isSyncing ? 'sync' : 'cloud-sync-outline'}
          size={28}
          color="#FFFFFF"
        />
      </Animated.View>
      {syncStatus.pendingCount > 0 && !isSyncing && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{syncStatus.pendingCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Network type indicator
export function NetworkTypeIndicator() {
  const colors = useThemeColors();
  const { networkStatus, isOnline } = useNetworkStatus();

  const getNetworkIcon = () => {
    if (!isOnline) return 'wifi-off';
    switch (networkStatus.type) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'signal-cellular-3';
      case 'ethernet':
        return 'ethernet';
      default:
        return 'web';
    }
  };

  const getNetworkLabel = () => {
    if (!isOnline) return 'オフライン';
    switch (networkStatus.type) {
      case 'wifi':
        return 'Wi-Fi';
      case 'cellular':
        return 'モバイル';
      case 'ethernet':
        return '有線';
      default:
        return '接続中';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: isOnline ? colors.successLight : colors.errorLight,
      borderRadius: 12,
    },
    text: {
      fontSize: 11,
      color: isOnline ? colors.success : colors.error,
      marginLeft: 4,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={getNetworkIcon()}
        size={14}
        color={isOnline ? colors.success : colors.error}
      />
      <Text style={styles.text}>{getNetworkLabel()}</Text>
    </View>
  );
}
