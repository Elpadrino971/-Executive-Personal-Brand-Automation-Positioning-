import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  company?: string;
  position?: string;
  tier: string;
  status: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.login(email, password);
      set({ user: data.user, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Login failed', isLoading: false });
      throw error;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.register(data);
      set({ user: response.user, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Registration failed', isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null });
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await api.getProfile();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to fetch profile', isLoading: false });
    }
  },
}));
