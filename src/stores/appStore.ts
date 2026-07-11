// State management setup
import { create } from 'zustand';

export interface AppState {
  groundingProgress: Record<string, Set<string>>;
  groundingScores: Record<string, Record<string, number>>;
  markGroundingCompleted: (moduleId: string, contentId: string) => void;
  setGroundingProgress: (moduleId: string, contentIds: string[]) => void;
  setGroundingScore: (moduleId: string, subfactorId: string, score: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  groundingProgress: {},
  groundingScores: {},
  markGroundingCompleted: (moduleId, contentId) =>
    set((state) => {
      const current = state.groundingProgress[moduleId] || new Set();
      const next = new Set(current).add(contentId);
      return {
        groundingProgress: {
          ...state.groundingProgress,
          [moduleId]: next,
        },
      };
    }),
  setGroundingProgress: (moduleId, contentIds) =>
    set((state) => ({
      groundingProgress: {
        ...state.groundingProgress,
        [moduleId]: new Set(contentIds),
      },
    })),
  setGroundingScore: (moduleId, subfactorId, score) =>
    set((state) => ({
      groundingScores: {
        ...state.groundingScores,
        [moduleId]: {
          ...(state.groundingScores[moduleId] || {}),
          [subfactorId]: score,
        },
      },
    })),
}));
