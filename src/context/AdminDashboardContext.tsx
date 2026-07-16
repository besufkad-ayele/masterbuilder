"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { FellowService } from '@/services/FellowService';
import { CohortService } from '@/services/CohortService';
import { FacilitatorService } from '@/services/FacilitatorService';
import { companyService } from '@/services/companyService';
import { groundingService } from '@/services/groundingService';
import { firebaseService } from '@/services/firebaseService';
import { auth } from '@/lib/firebase';
import { AdminDashboardState } from '@/types';

interface AdminDashboardContextType {
    data: AdminDashboardState | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

const AdminDashboardContext = createContext<AdminDashboardContextType | undefined>(undefined);

export function AdminDashboardProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<AdminDashboardState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const fetchData = useCallback(async () => {
        if (!auth.currentUser) {
            setLoading(false);
            setError(new Error('You must be signed in to load admin data.'));
            return;
        }

        try {
            setLoading(true);

            // Ensure token is attached before Firestore reads
            await auth.currentUser.getIdToken();

            const [
                fellows,
                cohorts,
                facilitators,
                companies,
                competencies,
                modules,
                notifications
            ] = await Promise.allSettled([
                FellowService.getAllFellows(),
                CohortService.getAllCohorts(),
                FacilitatorService.getAllFacilitators(),
                companyService.getAll(),
                CohortService.getMasterCompetencies(),
                groundingService.getModules(),
                firebaseService.notifications.getNotifications('admins', false)
            ]);

            setData({
                fellows: fellows.status === 'fulfilled' ? fellows.value : [],
                cohorts: cohorts.status === 'fulfilled' ? cohorts.value : [],
                facilitators: facilitators.status === 'fulfilled' ? facilitators.value : [],
                companies: companies.status === 'fulfilled' ? companies.value : [],
                competencies: competencies.status === 'fulfilled' ? competencies.value : [],
                users: [],
                results: [],
                evaluations: [],
                groundingModules: modules.status === 'fulfilled' ? modules.value : [],
                notifications: (notifications && notifications.status === 'fulfilled') ? notifications.value : [],
                coaches: [],
                peerCircles: [],
            });

            [fellows, cohorts, facilitators, companies, competencies, modules, notifications].forEach((res, i) => {
                if (res.status === 'rejected') {
                    console.error(`AdminDashboard Error index ${i}:`, res.reason);
                }
            });

            setError(null);
        } catch (err) {
            console.error("Critical error in AdminDashboardProvider:", err);
            setError(err instanceof Error ? err : new Error('Failed to fetch admin dashboard data'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            const signedIn = !!firebaseUser;
            setIsAuthenticated(signedIn);

            if (signedIn) {
                void fetchData();
            } else {
                setData(null);
                setLoading(false);
                setError(null);
            }
        });

        return () => unsubscribe();
    }, [fetchData]);

    return (
        <AdminDashboardContext.Provider
            value={{
                data,
                loading: loading || !isAuthenticated,
                error,
                refresh: fetchData,
            }}
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
