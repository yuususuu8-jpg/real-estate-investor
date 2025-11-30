// Network Status Hook - オフライン対応
import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SYNC_KEY = 'last_sync_timestamp';
const PENDING_SYNC_KEY = 'pending_sync_data';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  lastChecked: Date;
}

interface SyncStatus {
  lastSyncTime: Date | null;
  hasPendingChanges: boolean;
  pendingCount: number;
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    lastChecked: new Date(),
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    hasPendingChanges: false,
    pendingCount: 0,
  });

  // Load last sync time from storage
  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
        const pendingStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);

        const lastSyncTime = lastSyncStr ? new Date(parseInt(lastSyncStr, 10)) : null;
        const pending: PendingChange[] = pendingStr ? JSON.parse(pendingStr) : [];

        setSyncStatus({
          lastSyncTime,
          hasPendingChanges: pending.length > 0,
          pendingCount: pending.length,
        });
      } catch (error) {
        console.error('Error loading sync status:', error);
      }
    };

    loadSyncStatus();
  }, []);

  // Subscribe to network state changes
  useEffect(() => {
    let subscription: NetInfoSubscription;

    const setupNetworkListener = () => {
      subscription = NetInfo.addEventListener((state: NetInfoState) => {
        setNetworkStatus({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable ?? false,
          type: state.type,
          lastChecked: new Date(),
        });
      });
    };

    // Initial check
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        lastChecked: new Date(),
      });
    });

    setupNetworkListener();

    return () => {
      if (subscription) {
        subscription();
      }
    };
  }, []);

  // Update last sync time
  const updateLastSyncTime = useCallback(async () => {
    const now = Date.now();
    await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());
    setSyncStatus(prev => ({
      ...prev,
      lastSyncTime: new Date(now),
    }));
  }, []);

  // Add pending change
  const addPendingChange = useCallback(async (change: Omit<PendingChange, 'timestamp'>) => {
    try {
      const pendingStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const pending: PendingChange[] = pendingStr ? JSON.parse(pendingStr) : [];

      // Remove existing change for the same id
      const filtered = pending.filter(p => p.id !== change.id);
      const newPending = [...filtered, { ...change, timestamp: Date.now() }];

      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(newPending));
      setSyncStatus(prev => ({
        ...prev,
        hasPendingChanges: true,
        pendingCount: newPending.length,
      }));
    } catch (error) {
      console.error('Error adding pending change:', error);
    }
  }, []);

  // Clear pending changes
  const clearPendingChanges = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PENDING_SYNC_KEY);
      setSyncStatus(prev => ({
        ...prev,
        hasPendingChanges: false,
        pendingCount: 0,
      }));
    } catch (error) {
      console.error('Error clearing pending changes:', error);
    }
  }, []);

  // Get pending changes
  const getPendingChanges = useCallback(async (): Promise<PendingChange[]> => {
    try {
      const pendingStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      return pendingStr ? JSON.parse(pendingStr) : [];
    } catch (error) {
      console.error('Error getting pending changes:', error);
      return [];
    }
  }, []);

  // Refresh network status
  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    setNetworkStatus({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type,
      lastChecked: new Date(),
    });
    return state.isConnected ?? false;
  }, []);

  return {
    networkStatus,
    syncStatus,
    isOnline: networkStatus.isConnected && networkStatus.isInternetReachable,
    updateLastSyncTime,
    addPendingChange,
    clearPendingChanges,
    getPendingChanges,
    refresh,
  };
}

// Format time since last sync
export function formatTimeSince(date: Date | null): string {
  if (!date) return '未同期';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;

  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });
}
