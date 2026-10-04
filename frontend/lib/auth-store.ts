import { create } from 'zustand';
import {
  apiClient,
  deleteSecureItem,
  getSecureItem,
  REFRESH_TOKEN_KEY,
  setSecureItem,
  TOKEN_KEY,
} from './api-client';
import { AuthResponse, LoginPayload, RegisterPayload, User } from './types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  error: string | null;

  // Actions
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,
  error: null,

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      await setSecureItem(TOKEN_KEY, accessToken);
      await setSecureItem(REFRESH_TOKEN_KEY, refreshToken);

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Check onboarding status
      try {
        const statusRes = await apiClient.get('/onboarding/status');
        const completed = Boolean(
          statusRes.data?.onboardingCompleted ?? statusRes.data?.isOnboarded
        );
        set({ isOnboarded: completed });
      } catch {
        set({ isOnboarded: false });
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async ({ email, password, name }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
        name,
      });

      const { accessToken, refreshToken, user } = response.data;

      await setSecureItem(TOKEN_KEY, accessToken);
      await setSecureItem(REFRESH_TOKEN_KEY, refreshToken);

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        isOnboarded: false,
      });
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  loginAsGuest: async () => {
    set({ isLoading: true, error: null });
    try {
      const guestEmail = `guest_${Date.now()}@kemamate.local`;
      const guestPassword = `guest_${Math.random().toString(36).slice(-8)}`;

      // Try registering as a guest user on backend
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        email: guestEmail,
        password: guestPassword,
      });

      const { accessToken, refreshToken, user } = response.data;

      await setSecureItem(TOKEN_KEY, accessToken);
      await setSecureItem(REFRESH_TOKEN_KEY, refreshToken);

      set({
        user: { ...user, isGuest: true },
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        isOnboarded: false,
      });
    } catch {
      // Fallback local guest session if offline
      set({
        user: { id: 'guest-user', email: 'guest@kemamate.local', isGuest: true },
        accessToken: 'guest-token',
        refreshToken: 'guest-refresh',
        isAuthenticated: true,
        isLoading: false,
        isOnboarded: false,
      });
    }
  },

  logout: async () => {
    await deleteSecureItem(TOKEN_KEY);
    await deleteSecureItem(REFRESH_TOKEN_KEY);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await getSecureItem(TOKEN_KEY);
      if (!token) {
        set({ isAuthenticated: false, isLoading: false, user: null });
        return;
      }

      const res = await apiClient.get<{ user: User }>('/auth/me');
      set({
        user: res.data.user,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
      });

      try {
        const statusRes = await apiClient.get('/onboarding/status');
        const completed = Boolean(
          statusRes.data?.onboardingCompleted ?? statusRes.data?.isOnboarded
        );
        set({ isOnboarded: completed });
      } catch {
        set({ isOnboarded: false });
      }
    } catch {
      await deleteSecureItem(TOKEN_KEY);
      await deleteSecureItem(REFRESH_TOKEN_KEY);
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
