"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { FellowDashboardState } from '@/types';
import { appService } from '@/services/appService';
import { sanitizeExaminationAttemptForFellow } from '@/services/ExamService';

interface FellowDashboardContextValue {
  data: FellowDashboardState | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const FellowDashboardContext = createContext<FellowDashboardContextValue | undefined>(undefined);

export function FellowDashboardProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<FellowDashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const state = await appService.fellow.getDashboardState(userId);
      if (!state) throw new Error('Fellow profile not found');
      setData({
        ...state,
        examinationAttempts: (state.examinationAttempts || []).map((attempt) =>
          sanitizeExaminationAttemptForFellow(attempt as never),
        ),
      });
      setError(null);
    } catch (err) {
      console.error('Error in FellowDashboardProvider:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch fellow dashboard data';
      if (/unauthorized/i.test(message)) return;
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const onExamSubmitted = () => {
      fetchData();
    };
    window.addEventListener('exam-submitted', onExamSubmitted);
    return () => window.removeEventListener('exam-submitted', onExamSubmitted);
  }, [fetchData]);

  return (
    <FellowDashboardContext.Provider value={{ data, loading, error, refresh: fetchData }}>
      {children}
    </FellowDashboardContext.Provider>
  );
}

export function useFellowDashboardContext() {
  const context = useContext(FellowDashboardContext);
  if (!context) {
    throw new Error('useFellowDashboardContext must be used within FellowDashboardProvider');
  }
  return context;
}
