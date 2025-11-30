// Offline Cache Service - オフラインデータキャッシュ
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_PREFIX = 'offline_cache_';
const CACHE_METADATA_KEY = 'cache_metadata';
const CACHE_VERSION = '1.0.0';

interface CacheMetadata {
  version: string;
  lastCleanup: number;
  totalSize: number;
  entries: {
    [key: string]: {
      size: number;
      createdAt: number;
      expiresAt: number | null;
      accessCount: number;
      lastAccessed: number;
    };
  };
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  priority?: 'low' | 'normal' | 'high';
}

const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

class OfflineCache {
  private metadata: CacheMetadata | null = null;
  private initialized = false;

  // Initialize cache
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const metadataStr = await AsyncStorage.getItem(CACHE_METADATA_KEY);

      if (metadataStr) {
        this.metadata = JSON.parse(metadataStr);

        // Version check - clear cache if version mismatch
        if (this.metadata?.version !== CACHE_VERSION) {
          await this.clearAll();
        }
      } else {
        this.metadata = {
          version: CACHE_VERSION,
          lastCleanup: Date.now(),
          totalSize: 0,
          entries: {},
        };
        await this.saveMetadata();
      }

      // Run cleanup if needed
      if (Date.now() - (this.metadata?.lastCleanup ?? 0) > CLEANUP_INTERVAL) {
        await this.cleanup();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize cache:', error);
      this.metadata = {
        version: CACHE_VERSION,
        lastCleanup: Date.now(),
        totalSize: 0,
        entries: {},
      };
    }
  }

  // Save metadata to storage
  private async saveMetadata(): Promise<void> {
    if (this.metadata) {
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(this.metadata));
    }
  }

  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    await this.init();

    try {
      const cacheKey = CACHE_PREFIX + key;
      const dataStr = await AsyncStorage.getItem(cacheKey);

      if (!dataStr) return null;

      const entryMeta = this.metadata?.entries[key];

      // Check expiration
      if (entryMeta?.expiresAt && Date.now() > entryMeta.expiresAt) {
        await this.remove(key);
        return null;
      }

      // Update access stats
      if (this.metadata && entryMeta) {
        entryMeta.accessCount++;
        entryMeta.lastAccessed = Date.now();
        await this.saveMetadata();
      }

      return JSON.parse(dataStr) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set cached data
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    await this.init();

    try {
      const cacheKey = CACHE_PREFIX + key;
      const dataStr = JSON.stringify(data);
      const size = new Blob([dataStr]).size;

      // Check if we need to make room
      if (this.metadata && this.metadata.totalSize + size > MAX_CACHE_SIZE) {
        await this.evict(size);
      }

      await AsyncStorage.setItem(cacheKey, dataStr);

      // Update metadata
      if (this.metadata) {
        const previousSize = this.metadata.entries[key]?.size ?? 0;
        this.metadata.totalSize = this.metadata.totalSize - previousSize + size;
        this.metadata.entries[key] = {
          size,
          createdAt: Date.now(),
          expiresAt: options.ttl ? Date.now() + options.ttl : Date.now() + DEFAULT_TTL,
          accessCount: 1,
          lastAccessed: Date.now(),
        };
        await this.saveMetadata();
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Remove cached data
  async remove(key: string): Promise<boolean> {
    await this.init();

    try {
      const cacheKey = CACHE_PREFIX + key;
      await AsyncStorage.removeItem(cacheKey);

      if (this.metadata && this.metadata.entries[key]) {
        this.metadata.totalSize -= this.metadata.entries[key].size;
        delete this.metadata.entries[key];
        await this.saveMetadata();
      }

      return true;
    } catch (error) {
      console.error('Cache remove error:', error);
      return false;
    }
  }

  // Check if key exists
  async has(key: string): Promise<boolean> {
    await this.init();

    const entryMeta = this.metadata?.entries[key];
    if (!entryMeta) return false;

    // Check expiration
    if (entryMeta.expiresAt && Date.now() > entryMeta.expiresAt) {
      await this.remove(key);
      return false;
    }

    return true;
  }

  // Clear all cache
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);

      this.metadata = {
        version: CACHE_VERSION,
        lastCleanup: Date.now(),
        totalSize: 0,
        entries: {},
      };
      await this.saveMetadata();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Cleanup expired entries
  async cleanup(): Promise<number> {
    await this.init();

    let removedCount = 0;
    const now = Date.now();

    if (this.metadata) {
      const expiredKeys = Object.entries(this.metadata.entries)
        .filter(([_, entry]) => entry.expiresAt && now > entry.expiresAt)
        .map(([key]) => key);

      for (const key of expiredKeys) {
        await this.remove(key);
        removedCount++;
      }

      this.metadata.lastCleanup = now;
      await this.saveMetadata();
    }

    return removedCount;
  }

  // Evict entries to make room (LRU-like strategy)
  private async evict(neededSpace: number): Promise<void> {
    if (!this.metadata) return;

    // Sort entries by access time and access count
    const sortedEntries = Object.entries(this.metadata.entries)
      .sort((a, b) => {
        // Lower score = more likely to be evicted
        const scoreA = a[1].accessCount + (a[1].lastAccessed / 1000000000);
        const scoreB = b[1].accessCount + (b[1].lastAccessed / 1000000000);
        return scoreA - scoreB;
      });

    let freedSpace = 0;

    for (const [key] of sortedEntries) {
      if (freedSpace >= neededSpace) break;
      freedSpace += this.metadata.entries[key].size;
      await this.remove(key);
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    totalSize: number;
    entryCount: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    await this.init();

    if (!this.metadata) {
      return {
        totalSize: 0,
        entryCount: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }

    const entries = Object.values(this.metadata.entries);
    const timestamps = entries.map(e => e.createdAt);

    return {
      totalSize: this.metadata.totalSize,
      entryCount: entries.length,
      oldestEntry: timestamps.length ? new Date(Math.min(...timestamps)) : null,
      newestEntry: timestamps.length ? new Date(Math.max(...timestamps)) : null,
    };
  }
}

// Singleton instance
export const offlineCache = new OfflineCache();

// Calculation-specific cache helpers
export const calculationCache = {
  async cacheCalculation(id: string, data: any): Promise<boolean> {
    return offlineCache.set(`calculation_${id}`, data, { ttl: 30 * 24 * 60 * 60 * 1000 }); // 30 days
  },

  async getCachedCalculation(id: string): Promise<any | null> {
    return offlineCache.get(`calculation_${id}`);
  },

  async cacheAllCalculations(calculations: any[]): Promise<boolean> {
    return offlineCache.set('all_calculations', calculations, { ttl: DEFAULT_TTL });
  },

  async getAllCachedCalculations(): Promise<any[] | null> {
    return offlineCache.get('all_calculations');
  },

  async removeCalculation(id: string): Promise<boolean> {
    return offlineCache.remove(`calculation_${id}`);
  },
};

// Market data cache helpers
export const marketDataCache = {
  async cacheMarketData(region: string, data: any): Promise<boolean> {
    return offlineCache.set(`market_${region}`, data, { ttl: 24 * 60 * 60 * 1000 }); // 24 hours
  },

  async getCachedMarketData(region: string): Promise<any | null> {
    return offlineCache.get(`market_${region}`);
  },

  async cacheInterestRates(data: any): Promise<boolean> {
    return offlineCache.set('interest_rates', data, { ttl: 24 * 60 * 60 * 1000 }); // 24 hours
  },

  async getCachedInterestRates(): Promise<any | null> {
    return offlineCache.get('interest_rates');
  },
};

// Settings cache helpers
export const settingsCache = {
  async cacheUserSettings(settings: any): Promise<boolean> {
    return offlineCache.set('user_settings', settings);
  },

  async getCachedUserSettings(): Promise<any | null> {
    return offlineCache.get('user_settings');
  },
};

// Export cache stats formatter
export function formatCacheSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
