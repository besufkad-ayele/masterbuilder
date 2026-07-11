"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { AdminDashboardState } from '@/types';
import { adminApi } from '@/lib/api';
import { mapAdminDashboard } from '@/lib/api/mappers';

interface AdminDashboardContextType {
  data: AdminDashboardState | null;
  loading: boolean;
  error: Error | null;
  refresh: (forceRefresh?: boolean) => Promise<void>;
}

const AdminDashboardContext = createContext<AdminDashboardContextType | undefined>(undefined);

const CACHE_KEY = 'admin_dashboard_cache';
const CACHE_DURATION_MS = 5 * 60 * 1000;
/** sessionStorage is typically ~5MB; keep headroom for other keys */
const MAX_CACHE_CHARS = 2_500_000;

function readDashboardCache(): AdminDashboardState | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { timestamp, data: cachedData } = JSON.parse(cached) as {
      timestamp: number;
      data: AdminDashboardState;
    };
    if (Date.now() - timestamp >= CACHE_DURATION_MS) return null;
    return cachedData;
  } catch {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

function writeDashboardCache(dashboard: AdminDashboardState): void {
  try {
    const payload = JSON.stringify({ timestamp: Date.now(), data: dashboard });
    if (payload.length > MAX_CACHE_CHARS) {
      sessionStorage.removeItem(CACHE_KEY);
      return;
    }
    sessionStorage.setItem(CACHE_KEY, payload);
  } catch {
    // QuotaExceeded or private mode — never fail the dashboard load for cache
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function AdminDashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminDashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);

      if (!forceRefresh && typeof window !== 'undefined') {
        const cachedData = readDashboardCache();
        if (cachedData) {
          setData(cachedData);
          setError(null);
          setLoading(false);
          return;
        }
      }

      const raw = await adminApi.getDashboard();
      const dashboard = mapAdminDashboard(raw as Record<string, unknown>);
      setData(dashboard);
      if (typeof window !== 'undefined') {
        writeDashboardCache(dashboard);
      }
      setError(null);
    } catch (err) {
      console.error('Critical error in AdminDashboardProvider:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch admin dashboard data';
      if (/unauthorized/i.test(message)) {
        // ApiClient already redirects to `/`; keep loading state quiet
        return;
      }
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AdminDashboardContext.Provider
      value={{ data, loading, error, refresh: () => fetchData(true) }}
    >
      {children}
    </AdminDashboardContext.Provider>
  );
}

export function useAdminDashboardContext() {
  const context = useContext(AdminDashboardContext);
  if (context === undefined) {
    throw new Error('useAdminDashboardContext must be used within an AdminDashboardProvider');
  }
  return context;
}
