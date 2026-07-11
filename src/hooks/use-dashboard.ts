import { useAdminDashboardContext } from '@/context/AdminDashboardContext';
import { useFellowDashboardContext } from '@/context/FellowDashboardContext';
import { useCoachDashboardContext } from '@/context/CoachDashboardContext';
import { CohortService } from '@/services/CohortService';
import { companyService } from '@/services/companyService';
import { AdminDashboardState, FellowDashboardState } from '@/types';
import { useCallback, useEffect, useState } from 'react';

/** @deprecated Use useAdminDashboardContext directly */
export function useAdminDashboard() {
  return useAdminDashboardContext();
}

export function useFellowDashboard(_userId?: string) {
  return useFellowDashboardContext();
}

export function useCoachDashboard() {
  return useCoachDashboardContext();
}

export function useFacilitatorDashboard(companyId: string) {
  const [data, setData] = useState<{
    company: Awaited<ReturnType<typeof companyService.getById>>;
    cohorts: Awaited<ReturnType<typeof CohortService.getCohortsByCompany>>;
    loading: boolean;
    error: Error | null;
  }>({
    company: null,
    cohorts: [],
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true }));
      const [company, cohorts] = await Promise.all([
        companyService.getById(companyId),
        CohortService.getCohortsByCompany(companyId),
      ]);

      setData({
        company,
        cohorts,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error in useFacilitatorDashboard:', err);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch facilitator dashboard data'),
      }));
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [fetchData, companyId]);

  return { ...data, refresh: fetchData };
}

export type { AdminDashboardState, FellowDashboardState };
