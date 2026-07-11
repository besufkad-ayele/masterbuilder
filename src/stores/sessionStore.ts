import { create } from 'zustand';
import { User } from '@/types';
import { StorageService } from '@/services/storageService';

interface SessionState {
  user: User | null;
  hydrated: boolean;
  hydrate: () => void;
  setUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  hydrated: false,
  hydrate: () => set({ user: StorageService.getCurrentUser(), hydrated: true }),
  setUser: (user) => {
    StorageService.setCurrentUser(user);
    set({ user });
  },
  setAuthToken: (token) => {
    StorageService.setAuthToken(token);
  },
  clearSession: () => {
    StorageService.clearSession();
    set({ user: null });
  },
}));
