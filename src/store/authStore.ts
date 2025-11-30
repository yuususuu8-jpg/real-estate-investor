import { create } from 'zustand';
import { User, Session, AuthError } from '@supabase/supabase-js';
import {
  supabase,
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signOut as supabaseSignOut,
  getSession,
  resetPassword as supabaseResetPassword,
} from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  pendingSignUp: boolean; // サインアップ中はauth state changeを無視

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: AuthError }>;
  resetPendingSignUp: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  pendingSignUp: false,

  setUser: user =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setSession: session =>
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
    }),

  setLoading: isLoading => set({ isLoading }),

  setError: error => set({ error }),

  clearError: () => set({ error: null }),

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, session, error } = await supabaseSignIn(email, password);
      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error };
      }
      set({
        user,
        session,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'ログインに失敗しました';
      set({ error: errorMessage, isLoading: false });
      return { success: false };
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null, pendingSignUp: true });
    try {
      const { error } = await supabaseSignUp(email, password);
      if (error) {
        set({ error: error.message, isLoading: false, pendingSignUp: false });
        return { success: false, error };
      }
      // サインアップ成功後は自動ログインしない（メール確認画面を表示するため）
      // isAuthenticatedはfalseのままにする
      // pendingSignUpはtrueのままにして、onAuthStateChangeでの自動ログインを防ぐ
      set({ isLoading: false });
      return { success: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '登録に失敗しました';
      set({ error: errorMessage, isLoading: false, pendingSignUp: false });
      return { success: false };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabaseSignOut();
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabaseResetPassword(email);
      set({ isLoading: false });
      if (error) {
        set({ error: error.message });
        return { success: false, error };
      }
      return { success: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'パスワードリセットに失敗しました';
      set({ error: errorMessage, isLoading: false });
      return { success: false };
    }
  },

  resetPendingSignUp: () => {
    set({ pendingSignUp: false });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { session } = await getSession();
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        // サインアップ中は自動ログインを無視
        if (get().pendingSignUp) {
          return;
        }
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        });
      });
    } catch (_e) {
      set({ isLoading: false });
    }
  },
}));
