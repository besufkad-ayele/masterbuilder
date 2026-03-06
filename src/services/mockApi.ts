import { firebaseService } from './firebaseService';
import { AdminDashboardState, FellowDashboardState } from '@/types';

// Temporarily keeping the mockApi interface but delegating to firebaseService
export const mockApi = {
  admin: {
    getDashboardState: async (): Promise<AdminDashboardState> => {
      return firebaseService.admin.getDashboardState();
    },
    updateDashboardState: async (updates: Partial<AdminDashboardState>): Promise<void> => {
      console.warn('Update admin dashboard not implemented in Firebase yet', updates);
    },
  },
  fellow: {
    getDashboardState: async (userId?: string): Promise<FellowDashboardState> => {
      // In a real app, we'd get the current user ID from auth
      const currentUserId = userId || localStorage.getItem('ldp_current_user_id') || 'user-fellow-1';
      const state = await firebaseService.fellow.getDashboardState(currentUserId);
      if (!state) throw new Error('Fellow state not found');
      return state;
    },
    updateDashboardState: async (updates: Partial<FellowDashboardState>): Promise<void> => {
      console.warn('Update fellow dashboard not implemented in Firebase yet', updates);
    },
  },
};
