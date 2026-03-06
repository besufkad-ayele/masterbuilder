import { useState, useEffect, useCallback } from 'react';
import { FellowService } from '@/services/FellowService';
import { CohortService } from '@/services/CohortService';
import { FacilitatorService } from '@/services/FacilitatorService';
import { companyService } from '@/services/companyService';
import { AdminManagementService } from '@/services/AdminManagementService';
import { groundingService } from '@/services/groundingService';
import { competencyService } from '@/services/competencyService';
import { AdminDashboardState, FellowDashboardState, User, CompetencyLibrary } from '@/types';
import { ExamService } from '@/services/ExamService';

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const CACHE_KEY = 'admin_dashboard_cache';
  const CACHE_duration = 5 * 60 * 1000; // 5 minutes

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Check cache first
      if (!forceRefresh) {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data: cachedData } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_duration) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }
      }

      const [fellows, cohorts, facilitators, companies, competencies, modules] = await Promise.all([
        FellowService.getAllFellows(),
        CohortService.getAllCohorts(),
        FacilitatorService.getAllFacilitators(),
        companyService.getAll(),
        CohortService.getMasterCompetencies(),
        groundingService.getModules()
      ]);

      const newData = {
        fellows,
        cohorts,
        facilitators,
        companies,
        competencies,
        users: [], // To be implemented or fetched via AdminManagementService if needed
        results: [],
        evaluations: [],
        groundingModules: modules
      } as AdminDashboardState;

      setData(newData);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: newData
      }));

      setError(null);
    } catch (err) {
      console.error("Error in useAdminDashboard:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch admin dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateData = async (updates: Partial<AdminDashboardState>) => {
    console.warn("updateData in hook not fully implemented for dynamic services", updates);
    fetchData(true);
  };

  const refresh = () => fetchData(true);

  return { data, loading, error, refresh, updateData };
}

import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FellowProgressService } from '@/services/FellowProgressService';

export function useFellowDashboard(userId?: string) {
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
      // Fetch detailed data for a specific fellow
      const [profile, userDoc] = await Promise.all([
        FellowService.getFellowProfile(userId),
        getDoc(doc(db, 'users', userId))
      ]);

      if (!profile) throw new Error("Fellow profile not found");

      const userData = userDoc.exists() ? { id: userId, ...userDoc.data() } as User : { id: userId, email: profile.email, name: profile.full_name, role: 'FELLOW' } as User;

      const [company, cohort, allCompetencies, waves, portfolios, progress, waveComps, libraryComps, groundingResults, examAttempts, behavioralIndicators] = await Promise.all([
        companyService.getById(profile.company_id),
        profile.cohort_id ? CohortService.getCohortById(profile.cohort_id) : Promise.resolve(null),
        CohortService.getMasterCompetencies(),
        profile.cohort_id ? FellowProgressService.getWavesByCohort(profile.cohort_id) : Promise.resolve([]),
        FellowProgressService.getPortfoliosByFellow(userId),
        FellowProgressService.getPhaseProgressByFellow(userId),
        FellowProgressService.getAllWaveCompetencies(),
        companyService.getById(profile.company_id).then(c => c ? competencyService.getLibraryByCompany(profile.company_id) : []),
        FellowProgressService.getGroundingResultsByFellow(userId),
        ExamService.getAttemptsByUser(userId),
        FellowProgressService.getAllBehavioralIndicators()
      ]);

      const exams = profile.cohort_id ? await ExamService.getExamsByCohort(profile.cohort_id) : [];

      // Fetch grounding module if assigned and active
      let groundingModule = undefined;
      if (cohort?.grounding_module_id && cohort?.is_grounding_active) {
        groundingModule = await groundingService.getModuleById(cohort.grounding_module_id);
      }

      const transformedLibraryComps = libraryComps.map((lc: CompetencyLibrary) => ({
        id: lc.id,
        code: lc.competency.name.split(' ').map((w: string) => w[0]).join('').toUpperCase(),
        title: lc.competency.name,
        description: lc.competency.definition,
        category: lc.competency_domain,
        level: lc.competency.target_level,
        created_at: lc.created_at,
        updated_at: lc.updated_at
      } as any));

      const combinedCompetencies = [...allCompetencies, ...transformedLibraryComps];

      if (!company) throw new Error("Company not found");

      setData({
        user: userData,
        profile,
        company,
        cohort: cohort || {} as any,
        waves,
        competencies: combinedCompetencies,
        progress: progress,
        portfolios: portfolios,
        waveCompetencies: waveComps,
        groundingModule: groundingModule || undefined,
        groundingResults: groundingResults,
        examAttempts: examAttempts,
        exams: exams,
        behavioralIndicators: behavioralIndicators
      } as any); // Use any to avoid strict type check for now until types are updated
      setError(null);
    } catch (err) {
      console.error("Error in useFellowDashboard:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch fellow dashboard data'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateData = async (updates: Partial<FellowDashboardState>) => {
    // Merge updates into current state for optimistic UI or just refresh
    setData(prev => prev ? { ...prev, ...updates } : null);
    // Optional: fetchData(); 
  };

  return { data, loading, error, refresh: fetchData, updateData };
}

export function useFacilitatorDashboard(companyId: string) {
  const [data, setData] = useState<{
    company: any;
    cohorts: any[];
    loading: boolean;
    error: Error | null;
  }>({
    company: null,
    cohorts: [],
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));
      const [company, cohorts] = await Promise.all([
        companyService.getById(companyId),
        CohortService.getCohortsByCompany(companyId)
      ]);

      setData({
        company,
        cohorts,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error("Error in useFacilitatorDashboard:", err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch facilitator dashboard data')
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
