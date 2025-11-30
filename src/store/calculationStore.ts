import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropertyInput, CalculationResult } from '../lib/calculations';
import {
  fetchCloudCalculations,
  uploadCalculation,
  deleteCloudCalculation,
  updateFavoriteStatus,
  LocalCalculation,
} from '../lib/calculationSync';

export interface SavedCalculation {
  id: string;
  title: string;
  input: PropertyInput;
  result: CalculationResult;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  synced?: boolean;
}

interface CalculationState {
  calculations: SavedCalculation[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;

  // Actions
  addCalculation: (
    title: string,
    input: PropertyInput,
    result: CalculationResult
  ) => Promise<SavedCalculation>;
  updateCalculation: (id: string, updates: Partial<SavedCalculation>) => void;
  deleteCalculation: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  clearAll: () => void;
  getCalculation: (id: string) => SavedCalculation | undefined;

  // Sync actions
  syncWithCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  setSyncing: (isSyncing: boolean) => void;
  setSyncError: (error: string | null) => void;
}

// Generate unique ID using UUID format
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useCalculationStore = create<CalculationState>()(
  persist(
    (set, get) => ({
      calculations: [],
      isLoading: false,
      isSyncing: false,
      lastSyncedAt: null,
      syncError: null,

      addCalculation: async (title, input, result) => {
        const now = new Date().toISOString();
        const newCalculation: SavedCalculation = {
          id: generateId(),
          title: title || `計算 ${get().calculations.length + 1}`,
          input,
          result,
          createdAt: now,
          updatedAt: now,
          isFavorite: false,
          synced: false,
        };

        // Add to local state immediately
        set(state => ({
          calculations: [newCalculation, ...state.calculations],
        }));

        // Try to sync with cloud in background
        try {
          const { error } = await uploadCalculation(newCalculation as LocalCalculation);
          if (!error) {
            set(state => ({
              calculations: state.calculations.map(calc =>
                calc.id === newCalculation.id ? { ...calc, synced: true } : calc
              ),
            }));
          }
        } catch {
          // Silently fail - will sync later
        }

        return newCalculation;
      },

      updateCalculation: (id, updates) => {
        set(state => ({
          calculations: state.calculations.map(calc =>
            calc.id === id
              ? { ...calc, ...updates, updatedAt: new Date().toISOString(), synced: false }
              : calc
          ),
        }));
      },

      deleteCalculation: async id => {
        // Remove from local state immediately
        set(state => ({
          calculations: state.calculations.filter(calc => calc.id !== id),
        }));

        // Try to delete from cloud in background
        try {
          await deleteCloudCalculation(id);
        } catch {
          // Silently fail
        }
      },

      toggleFavorite: async id => {
        const calc = get().calculations.find(c => c.id === id);
        if (!calc) return;

        const newFavoriteStatus = !calc.isFavorite;

        // Update local state immediately
        set(state => ({
          calculations: state.calculations.map(c =>
            c.id === id
              ? { ...c, isFavorite: newFavoriteStatus, updatedAt: new Date().toISOString() }
              : c
          ),
        }));

        // Try to sync with cloud in background
        try {
          await updateFavoriteStatus(id, newFavoriteStatus);
        } catch {
          // Silently fail
        }
      },

      clearAll: () => {
        const calculations = get().calculations;
        set({ calculations: [], lastSyncedAt: null });

        // Try to delete all from cloud in background
        calculations.forEach(async calc => {
          try {
            await deleteCloudCalculation(calc.id);
          } catch {
            // Silently fail
          }
        });
      },

      getCalculation: id => {
        return get().calculations.find(calc => calc.id === id);
      },

      // Sync actions
      syncWithCloud: async () => {
        const state = get();
        if (state.isSyncing) return;

        set({ isSyncing: true, syncError: null });

        try {
          // Upload unsynced calculations
          const unsyncedCalcs = state.calculations.filter(c => !c.synced);
          for (const calc of unsyncedCalcs) {
            const { error } = await uploadCalculation(calc as LocalCalculation);
            if (!error) {
              set(s => ({
                calculations: s.calculations.map(c =>
                  c.id === calc.id ? { ...c, synced: true } : c
                ),
              }));
            }
          }

          // Fetch from cloud
          const { data: cloudCalcs, error } = await fetchCloudCalculations();
          if (error) {
            throw error;
          }

          if (cloudCalcs) {
            // Merge cloud calculations with local
            const localIds = new Set(state.calculations.map(c => c.id));
            const newFromCloud = cloudCalcs.filter(c => !localIds.has(c.id));

            if (newFromCloud.length > 0) {
              set(s => ({
                calculations: [
                  ...s.calculations,
                  ...newFromCloud.map(c => ({ ...c, synced: true })),
                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
              }));
            }
          }

          set({
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
            syncError: null,
          });
        } catch (err) {
          set({
            isSyncing: false,
            syncError: err instanceof Error ? err.message : '同期に失敗しました',
          });
        }
      },

      loadFromCloud: async () => {
        set({ isLoading: true, syncError: null });

        try {
          const { data: cloudCalcs, error } = await fetchCloudCalculations();
          if (error) {
            throw error;
          }

          if (cloudCalcs) {
            set({
              calculations: cloudCalcs.map(c => ({ ...c, synced: true })),
              isLoading: false,
              lastSyncedAt: new Date().toISOString(),
            });
          } else {
            set({ isLoading: false });
          }
        } catch (err) {
          set({
            isLoading: false,
            syncError: err instanceof Error ? err.message : '読み込みに失敗しました',
          });
        }
      },

      setSyncing: (isSyncing: boolean) => set({ isSyncing }),
      setSyncError: (error: string | null) => set({ syncError: error }),
    }),
    {
      name: 'calculation-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        calculations: state.calculations,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
