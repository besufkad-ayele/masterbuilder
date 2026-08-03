import {
    Company,
    User,
    FellowProfile,
    FacilitatorProfile,
    AdminProfile,
    CoachProfile,
    PeerCircle,
    Cohort,
    Wave,
    Competency,
    PhaseProgress,
    Portfolio,
    WaveResult,
    WaveCompetency,
    AdminDashboardState,
    FellowDashboardState,
    CoachDashboardState,
    CompetencyDictionary,
    GroundingModule,
    PhaseType,
    PortfolioStatus,
    LDPNotification
} from '@/types';

import { groundingService } from './groundingService';
import { FellowProgressService } from './FellowProgressService';
import { ExamService } from './ExamService';
import {
  notificationsApi,
  usersApi,
  companiesApi,
  cohortsApi,
  fellowsApi,
  coachesApi,
  progressApi,
  adminApi,
  facilitatorsApi,
  adminsApi,
  authApi,
  groundingApi,
  competenciesApi,
} from '@/lib/api';
import {
  mapAdminProfile,
  mapNotification,
  toApiNotification,
  mapUser,
  mapCompany,
  mapCohort,
  mapGroundingModule,
  mapCoach,
  mapFellow,
  mapFacilitator,
  mapFellowDashboard,
  mapCoachDashboard,
  mapPhaseProgress,
  mapPortfolio,
  mapWaveCompetency,
  mapGroundingResult,
  mapCompetency,
  mapPeerCircle,
  mapAdminDashboard,
  mapWaveResult,
  toApiPortfolio,
  toApiProgress,
} from '@/lib/api/mappers';

export const appService = {
    // --- Shared Getters ---
    async getUser(id: string): Promise<User | null> {
        try {
            const data = await usersApi.getById(id) as Record<string, unknown>;
            return mapUser(data);
        } catch {
            return null;
        }
    },

    async getAdminProfile(userId: string): Promise<AdminProfile | null> {
        const admins = await adminsApi.getAll() as Record<string, unknown>[];
        const found = admins.find((a) => String(a.userId ?? (a.user as Record<string, unknown>)?.id) === userId);
        return found ? mapAdminProfile(found) : null;
    },

    async getFacilitatorProfile(userId: string): Promise<FacilitatorProfile | null> {
        const all = await facilitatorsApi.getAll() as Record<string, unknown>[];
        const found = all.find((f) => String(f.userId ?? f.user_id) === userId);
        return found ? mapFacilitator(found) : null;
    },

    async getCompany(id: string): Promise<Company | null> {
        try {
            const data = await companiesApi.getById(id) as Record<string, unknown>;
            return mapCompany(data);
        } catch {
            return null;
        }
    },

    async getCohort(id: string): Promise<Cohort | null> {
        try {
            const data = await cohortsApi.getById(id) as Record<string, unknown>;
            return mapCohort(data);
        } catch {
            return null;
        }
    },

    async getGroundingModule(id: string): Promise<GroundingModule | null> {
        try {
            const data = await groundingApi.getById(id) as Record<string, unknown>;
            return mapGroundingModule(data);
        } catch {
            return null;
        }
    },

    async getCompanyCohorts(companyId: string): Promise<Cohort[]> {
        const data = await cohortsApi.getAll(companyId) as Record<string, unknown>[];
        return data.map(mapCohort);
    },

    async getCoachProfile(userId: string): Promise<CoachProfile | null> {
        const coaches = await coachesApi.getAll() as Record<string, unknown>[];
        const found = coaches.find((c) => String(c.userId ?? (c.user as Record<string, unknown>)?.id) === userId);
        return found ? mapCoach(found) : null;
    },

    async getPeerCircle(id: string): Promise<PeerCircle | null> {
        const circles = await coachesApi.getPeerCircles() as Record<string, unknown>[];
        const found = circles.find((c) => String(c.id) === id);
        return found ? mapPeerCircle(found) : null;
    },

    async getCoachPeerCircle(coachId: string): Promise<PeerCircle | null> {
        const circles = await coachesApi.getPeerCircles() as Record<string, unknown>[];
        const found = circles.find((c) => String(c.coachId ?? c.coach_id) === coachId);
        return found ? mapPeerCircle(found) : null;
    },

    // --- Admin Methods ---
    admin: {
        async getDashboardState(): Promise<AdminDashboardState> {
            const raw = await adminApi.getDashboard();
            return mapAdminDashboard(raw as Record<string, unknown>);
        },

        async getUsers(): Promise<User[]> {
            const data = await usersApi.getAll() as Record<string, unknown>[];
            return data.map(mapUser);
        },

        async getCompanies(): Promise<Company[]> {
            const data = await companiesApi.getAll() as Record<string, unknown>[];
            return data.map(mapCompany);
        },

        async getCohorts(): Promise<Cohort[]> {
            const data = await cohortsApi.getAll() as Record<string, unknown>[];
            return data.map(mapCohort);
        },

        async getFellowProfiles(): Promise<FellowProfile[]> {
            const data = await fellowsApi.getAll() as Record<string, unknown>[];
            return data.map(mapFellow);
        },

        async getFacilitatorProfiles(): Promise<FacilitatorProfile[]> {
            const data = await facilitatorsApi.getAll() as Record<string, unknown>[];
            return data.map(mapFacilitator);
        },

        async getCoachProfiles(): Promise<CoachProfile[]> {
            const data = await coachesApi.getAll() as Record<string, unknown>[];
            return data.map(mapCoach);
        },

        async getPeerCircles(): Promise<PeerCircle[]> {
            const data = await coachesApi.getPeerCircles() as Record<string, unknown>[];
            return data.map(mapPeerCircle);
        },

        async createPeerCircle(data: PeerCircle): Promise<void> {
            await coachesApi.createPeerCircle({
                name: data.name,
                coachId: data.coach_id,
                cohortId: data.cohort_id,
                companyId: data.company_id,
                fellowIds: data.fellow_ids,
            });
        },

        async updatePeerCircle(id: string, updates: Partial<PeerCircle>): Promise<void> {
            await coachesApi.updatePeerCircle(id, {
                name: updates.name,
                fellowIds: updates.fellow_ids,
            });
        },

        async createCoachProfile(data: CoachProfile): Promise<void> {
            await coachesApi.create({
                email: data.email,
                fullName: data.full_name,
                specialization: data.specialization,
                isActive: data.is_active,
            });
        },

        async getCompetencies(): Promise<Competency[]> {
            const data = await progressApi.getCompetencies() as Record<string, unknown>[];
            return data.map(mapCompetency);
        },

        async getWaveResults(): Promise<WaveResult[]> {
            const dashboard = await adminApi.getDashboard() as Record<string, unknown>;
            return ((dashboard.results as Record<string, unknown>[]) ?? []).map(mapWaveResult);
        },

        async getPortfolios(): Promise<Portfolio[]> {
            const dashboard = await adminApi.getDashboard() as Record<string, unknown>;
            return ((dashboard.evaluations as Record<string, unknown>[]) ?? []).map(mapPortfolio);
        },

        async getGroundingModules(): Promise<GroundingModule[]> {
            return groundingService.getModules();
        },

        async createCompany(companyData: Company): Promise<void> {
            await companiesApi.create(companyData);
        },

        async createGroundingModule(item: GroundingModule): Promise<void> {
            await groundingService.createModule(item);
        },

        async deleteGroundingItem(id: string): Promise<void> {
            await groundingService.deleteModule(id);
        },

        async getCompany(id: string): Promise<Company | null> {
            return appService.getCompany(id);
        },

        async getCohort(id: string): Promise<Cohort | null> {
            return appService.getCohort(id);
        },

        async getGroundingLibraries(): Promise<GroundingModule[]> {
            return this.getGroundingModules();
        }
    },

    // --- Fellow Methods & Precise Scoring ---
    fellow: {
        async getDashboardState(userId: string): Promise<FellowDashboardState | null> {
            const data = await fellowsApi.getDashboard(userId) as Record<string, unknown> | null;
            if (!data) return null;

            const mapped = mapFellowDashboard(data);

            try {
                const [allWaveComps, allComps] = await Promise.all([
                    progressApi.getWaveCompetencies() as Promise<Record<string, unknown>[]>,
                    competenciesApi.getAll() as Promise<Record<string, unknown>[]>,
                ]);

                if (allWaveComps && Array.isArray(allWaveComps)) {
                    const mappedWaveComps = allWaveComps.map(mapWaveCompetency);
                    const existingLinkIds = new Set((mapped.waveCompetencies || []).map(wc => `${wc.wave_id}_${wc.competency_id}`));
                    const newWaveComps = mappedWaveComps.filter(wc => !existingLinkIds.has(`${wc.wave_id}_${wc.competency_id}`));
                    mapped.waveCompetencies = [...(mapped.waveCompetencies || []), ...newWaveComps];
                }

                if (allComps && Array.isArray(allComps)) {
                    const mappedComps = allComps.map(mapCompetency);
                    const existingCompIds = new Set((mapped.competencies || []).map(c => c.id));
                    const newComps = mappedComps.filter(c => !existingCompIds.has(c.id));
                    mapped.competencies = [...(mapped.competencies || []), ...newComps];
                }
            } catch (e) {
                console.warn("Fallback fetching for fellow dashboard wave competencies failed:", e);
            }

            return mapped;
        },

        async getWaveCompetenceIds(waveId?: string): Promise<string[]> {
            if (!waveId) return [];
            const data = await progressApi.getWaveCompetencies(waveId) as Record<string, unknown>[];
            return data.map((wc) => String(wc.competencyId ?? wc.competency_id));
        },

        async calculateCompetencyResult(userId: string, competencyId: string): Promise<number> {
            const biData = await progressApi.getBehavioralIndicators() as Record<string, unknown>[];
            const biIds = biData
                .filter((bi) => String(bi.competencyId ?? bi.competency_id) === competencyId)
                .map((bi) => String(bi.id));

            if (biIds.length === 0) return 0;

            const [progress, portfolios, groundingResults, profile] = await Promise.all([
                this.getFellowProgress(userId),
                this.getFellowPortfolios(userId),
                this.getGroundingResults(userId),
                this.getFellowProfile(userId)
            ]);

            const groundingScore = groundingResults[0]?.score || 0;

            let examScore = 0;
            if (profile?.cohort_id) {
                const exams = await ExamService.getExamsByCohortAndCompetency(profile.cohort_id, competencyId);
                if (exams.length > 0) {
                    const attempts = await ExamService.getAttemptsByUser(userId);
                    const compExamAttempt = attempts.find(a => a.exam_id === exams[0].id);
                    examScore = compExamAttempt?.score || 0;
                }
            }

            return FellowProgressService.calculateCompetencyTotalScore(
                biIds,
                progress,
                portfolios,
                groundingScore,
                examScore
            );
        },

        async calculateBIScore(userId: string, biId: string): Promise<number> {
            const progress = await this.getFellowProgress(userId);
            const portfolios = await this.getFellowPortfolios(userId);

            const biProgress = progress.filter(p => p.behavioral_indicator_id === biId);
            const biPortfolios = portfolios.filter(p => p.behavioral_indicator_id === biId);

            return FellowProgressService.calculateBIScore(biProgress, biPortfolios);
        },

        async getGroundingResults(userId: string): Promise<any[]> {
            const data = await progressApi.getGroundingResults(userId) as Record<string, unknown>[];
            return data.map(mapGroundingResult);
        },

        async getFellowProfile(userId: string): Promise<FellowProfile | null> {
            const fellows = await fellowsApi.getAll() as Record<string, unknown>[];
            const found = fellows.find((f) => String(f.userId ?? f.user_id) === userId);
            return found ? mapFellow(found) : null;
        },

        async getCohortWaves(cohortId: string): Promise<Wave[]> {
            const data = await progressApi.getWaves(cohortId) as Record<string, unknown>[];
            return data.map((w) => ({
                id: String(w.id),
                cohort_id: String(w.cohortId ?? w.cohort_id),
                number: Number(w.number),
                name: w.name ? String(w.name) : undefined,
                status: w.status as Wave['status'],
                phase_states: (w.phaseStates ?? w.phase_states) as Wave['phase_states'],
                created_at: String(w.createdAt ?? w.created_at),
                updated_at: String(w.updatedAt ?? w.updated_at),
            }));
        },

        async getCompetencies(): Promise<Competency[]> {
            const data = await progressApi.getCompetencies() as Record<string, unknown>[];
            return data.map(mapCompetency);
        },

        async getFellowProgress(userId: string): Promise<PhaseProgress[]> {
            const data = await progressApi.getPhaseProgress(userId) as Record<string, unknown>[];
            return data.map(mapPhaseProgress);
        },

        async getFellowPortfolios(userId: string): Promise<Portfolio[]> {
            const data = await progressApi.getPortfolios(userId) as Record<string, unknown>[];
            return data.map(mapPortfolio);
        },

        async getAllWaveCompetencies(): Promise<WaveCompetency[]> {
            const data = await progressApi.getWaveCompetencies() as Record<string, unknown>[];
            return data.map(mapWaveCompetency);
        },

        async getCompetencyDetails(id: string): Promise<CompetencyDictionary | null> {
            const dictionary = await competenciesApi.getDictionary() as Record<string, unknown>[];
            const found = dictionary.find((entry) => String(entry.id) === id);
            return found ? { id: String(found.id), ...found } as CompetencyDictionary : null;
        },

        async initializeProgress(userId: string, type: 'grounding' | 'competency', targetId: string) {
            await progressApi.initialize({ userId, type, targetId });
        },

        async submitPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
            const created = await progressApi.submitPortfolio(toApiPortfolio(portfolio)) as Record<string, unknown>;
            return String(created.id);
        },

        async updatePortfolioStatus(id: string, status: PortfolioStatus): Promise<void> {
            await progressApi.updatePortfolio(id, { status });
        },

        async updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<void> {
            await progressApi.updatePortfolio(id, toApiPortfolio(updates));
        },

        async updatePhaseProgress(userId: string, biId: string, phaseType: PhaseType, updates: Partial<PhaseProgress>): Promise<void> {
            await progressApi.upsertPhaseProgress(toApiProgress({
                user_id: userId,
                behavioral_indicator_id: biId,
                phase_type: phaseType,
                ...updates,
            }));
        },

        async trackGroundingContent(userId: string, targetId: string, contentId: string) {
            await progressApi.upsertGroundingResult({
                fellowId: userId,
                groundingId: targetId,
                status: 'in_progress',
                completedContent: [contentId],
            });
        },

        async updateGroundingPerformance(userId: string, targetId: string, score: number, status: 'in_progress' | 'completed' = 'completed') {
            await progressApi.upsertGroundingResult({
                fellowId: userId,
                groundingId: targetId,
                status,
                score,
                isPassed: score >= 5,
            });
        }
    },

    coach: {
        async getDashboardState(userId: string): Promise<CoachDashboardState | null> {
            const data = await coachesApi.getDashboard(userId) as Record<string, unknown> | null;
            return data ? mapCoachDashboard(data) : null;
        }
    },

    notifications: {
        async getNotifications(audience?: string, onlyActive: boolean = true): Promise<LDPNotification[]> {
            const data = await notificationsApi.getAll(audience) as Record<string, unknown>[];
            let all = data.map(mapNotification);
            if (!onlyActive) {
                // API returns active only; sufficient for now
            }
            if (!audience || audience === 'all') return all;
            return all.filter(n =>
                n.target_audience === 'all' ||
                n.target_audience === audience ||
                (audience === 'fellows' && n.target_audience === 'fellows') ||
                (audience === 'admins' && (n.target_audience === 'admins' || n.target_audience === 'all'))
            );
        },

        async createNotification(notification: Omit<LDPNotification, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
            const created = await notificationsApi.create(toApiNotification(notification)) as Record<string, unknown>;
            return String(created.id);
        },

        async updateNotification(id: string, updates: Partial<LDPNotification>): Promise<void> {
            await notificationsApi.update(id, toApiNotification(updates));
        },

        async deleteNotification(id: string): Promise<void> {
            await notificationsApi.delete(id);
        }
    },

    auth: {
        async changePassword(newPassword: string, currentPassword?: string): Promise<void> {
            await authApi.changePassword(currentPassword || 'Password123!', newPassword);
        }
    }
};
