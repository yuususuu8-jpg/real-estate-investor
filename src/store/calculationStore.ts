import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropertyInput, CalculationResult } from '../lib/calculations';

export interface SavedCalculation {
  id: string;
  title: string;
  input: PropertyInput;
  result: CalculationResult;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

interface CalculationState {
  calculations: SavedCalculation[];
  isLoading: boolean;

  // Actions
  addCalculation: (
    title: string,
    input: PropertyInput,
    result: CalculationResult
  ) => SavedCalculation;
  updateCalculation: (id: string, updates: Partial<SavedCalculation>) => void;
  deleteCalculation: (id: string) => void;
  toggleFavorite: (id: string) => void;
  clearAll: () => void;
  getCalculation: (id: string) => SavedCalculation | undefined;
}

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useCalculationStore = create<CalculationState>()(
  persist(
    (set, get) => ({
      calculations: [],
      isLoading: false,

      addCalculation: (title, input, result) => {
        const now = new Date().toISOString();
        const newCalculation: SavedCalculation = {
          id: generateId(),
          title: title || `計算 ${get().calculations.length + 1}`,
          input,
          result,
          createdAt: now,
          updatedAt: now,
          isFavorite: false,
        };

        set(state => ({
          calculations: [newCalculation, ...state.calculations],
        }));

        return newCalculation;
      },

      updateCalculation: (id, updates) => {
        set(state => ({
          calculations: state.calculations.map(calc =>
            calc.id === id
              ? { ...calc, ...updates, updatedAt: new Date().toISOString() }
              : calc
          ),
        }));
      },

      deleteCalculation: id => {
        set(state => ({
          calculations: state.calculations.filter(calc => calc.id !== id),
        }));
      },

      toggleFavorite: id => {
        set(state => ({
          calculations: state.calculations.map(calc =>
            calc.id === id
              ? { ...calc, isFavorite: !calc.isFavorite, updatedAt: new Date().toISOString() }
              : calc
          ),
        }));
      },

      clearAll: () => {
        set({ calculations: [] });
      },

      getCalculation: id => {
        return get().calculations.find(calc => calc.id === id);
      },
    }),
    {
      name: 'calculation-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
