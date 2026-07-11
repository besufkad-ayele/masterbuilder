"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { CoachDashboardState, Cohort, Company, PeerCircle } from '@/types';
import { appService } from '@/services/appService';
import { CoachService } from '@/services/CoachService';
import { companyService } from '@/services/companyService';
import { CohortService } from '@/services/CohortService';
import { StorageService } from '@/services/storageService';

interface CoachDashboardContextValue {
  data: CoachDashboardState | null;
  peerCircles: PeerCircle[];
  companies: Record<string, Company>;
  cohorts: Record<string, Cohort>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const CoachDashboardContext = createContext<CoachDashboardContextValue | undefined>(undefined);

export function CoachDashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CoachDashboardState | null>(null);
  const [peerCircles, setPeerCircles] = useState<PeerCircle[]>([]);
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [cohorts, setCohorts] = useState<Record<string, Cohort>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    const user = StorageService.getCurrentUser();
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [dashboard, circles] = await Promise.all([
        appService.coach.getDashboardState(user.id),
        CoachService.getPeerCirclesByCoachId(user.id),
      ]);

      setData(dashboard);
      setPeerCircles(circles);

      const companyIds = Array.from(new Set(circles.map((c) => c.company_id).filter(Boolean)));
      const cohortIds = Array.from(new Set(circles.map((c) => c.cohort_id).filter(Boolean)));

      const [companyData, cohortData] = await Promise.all([
        Promise.all(companyIds.map((id) => companyService.getById(id))),
        Promise.all(cohortIds.map((id) => CohortService.getCohortById(id))),
      ]);

      setCompanies(
        companyData.reduce((acc, company) => {
          if (company) acc[company.id] = company;
          return acc;
        }, {} as Record<string, Company>),
      );
      setCohorts(
        cohortData.reduce((acc, cohort) => {
          if (cohort) acc[cohort.id] = cohort;
          return acc;
        }, {} as Record<string, Cohort>),
      );
      setError(null);
    } catch (err) {
      console.error('Error in CoachDashboardProvider:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch coach dashboard data';
      if (/unauthorized/i.test(message)) return;
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <CoachDashboardContext.Provider
      value={{ data, peerCircles, companies, cohorts, loading, error, refresh: fetchData }}
    >
      {children}
    </CoachDashboardContext.Provider>
  );
}

export function useCoachDashboardContext() {
  const context = useContext(CoachDashboardContext);
  if (!context) {
    throw new Error('useCoachDashboardContext must be used within CoachDashboardProvider');
  }
  return context;
}
