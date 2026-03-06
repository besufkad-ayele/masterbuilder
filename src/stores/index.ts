// State management setup
import { create } from 'zustand'

export interface AppState {
  // Add your app state here
  user: any | null
  isLoading: boolean
  groundingProgress: Record<string, Set<string>> // moduleId -> set of completed subfactor IDs/URLs/quiz_passed
  groundingScores: Record<string, Record<string, number>> // moduleId -> { "subfactor_0": 80 }
  setUser: (user: any) => void
  setLoading: (loading: boolean) => void
  markGroundingCompleted: (moduleId: string, contentId: string) => void
  setGroundingProgress: (moduleId: string, contentIds: string[]) => void
  setGroundingScore: (moduleId: string, subfactorId: string, score: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isLoading: false,
  groundingProgress: {},
  groundingScores: {},
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  markGroundingCompleted: (moduleId, contentId) => set((state) => {
    const current = state.groundingProgress[moduleId] || new Set();
    const next = new Set(current).add(contentId);
    return {
      groundingProgress: {
        ...state.groundingProgress,
        [moduleId]: next
      }
    };
  }),
  setGroundingProgress: (moduleId, contentIds) => set((state) => ({
    groundingProgress: {
      ...state.groundingProgress,
      [moduleId]: new Set(contentIds)
    }
  })),
  setGroundingScore: (moduleId, subfactorId, score) => set((state) => ({
    groundingScores: {
      ...state.groundingScores,
      [moduleId]: {
        ...(state.groundingScores[moduleId] || {}),
        [subfactorId]: score
      }
    }
  })),
}))
