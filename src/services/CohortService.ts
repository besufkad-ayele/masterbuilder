import { Cohort, Competency, Wave, WaveCompetency } from '@/types';
import { cohortsApi, competenciesApi, progressApi } from '@/lib/api';
import { mapCohort, mapCompetency, mapWaveCompetency, toApiCohort } from '@/lib/api/mappers';

const mapWave = (w: Record<string, unknown>): Wave => ({
    id: String(w.id),
    cohort_id: String(w.cohortId ?? w.cohort_id),
    number: Number(w.number),
    name: w.name ? String(w.name) : undefined,
    status: w.status as Wave['status'],
    phase_states: (w.phaseStates ?? w.phase_states) as Wave['phase_states'],
    created_at: String(w.createdAt ?? w.created_at),
    updated_at: String(w.updatedAt ?? w.updated_at),
});

export const CohortService = {
    /**
     * Get all cohorts
     */
    async getAllCohorts(): Promise<Cohort[]> {
        const data = await cohortsApi.getAll() as Record<string, unknown>[];
        return data.map(mapCohort);
    },

    /**
     * Get cohorts for a company
     */
    async getCohortsByCompany(companyId: string): Promise<Cohort[]> {
        const data = await cohortsApi.getAll(companyId) as Record<string, unknown>[];
        return data.map(mapCohort);
    },

    /**
     * Get a specific cohort by ID
     */
    async getCohortById(id: string): Promise<Cohort | null> {
        const data = await cohortsApi.getById(id) as Record<string, unknown>;
        return mapCohort(data);
    },

    /**
     * Create a new cohort
     */
    async createCohort(data: Partial<Cohort>): Promise<string> {
        const created = await cohortsApi.create(toApiCohort(data)) as Record<string, unknown>;
        return String(created.id);
    },

    /**
     * Update an existing cohort's basic fields
     */
    async updateCohort(cohortId: string, updates: Partial<Cohort>): Promise<void> {
        await cohortsApi.update(cohortId, toApiCohort(updates));
    },

    /**
     * Delete a cohort and un-assign its fellows
     */
    async deleteCohort(cohortId: string): Promise<void> {
        await cohortsApi.delete(cohortId);
    },

    /**
     * Create a new cohort with multiple waves and their competencies
     */
    async createCohortWithWaves(params: {
        cohort: Omit<Cohort, 'id' | 'created_at' | 'updated_at' | 'status'>,
        waves: {
            number: number,
            name: string,
            competencyIds: string[],
            activeCompetencyIds: string[],
            status: 'active' | 'upcoming',
            phaseStates?: { believe: string; know: string; do: string; }
        }[],
        fellowIds: string[],
        groundingModuleId?: string,
        isGroundingActive?: boolean
    }): Promise<string> {
        const result = await cohortsApi.createWithWaves({
            cohort: {
                ...toApiCohort(params.cohort as Cohort),
                groundingModuleId: params.groundingModuleId,
                isGroundingActive: params.isGroundingActive ?? false,
            },
            waves: params.waves.map((w) => ({
                number: w.number,
                name: w.name,
                status: w.status,
                phaseStates: w.phaseStates,
                competencyIds: w.competencyIds,
            })),
            fellowIds: params.fellowIds,
        }) as Record<string, unknown>;
        return String(result.id);
    },

    /**
     * Upgrade cohort level (e.g., Junior -> Mid)
     */
    async upgradeCohortLevel(cohortId: string, nextLevel: string): Promise<void> {
        await cohortsApi.update(cohortId, toApiCohort({ wave_level: nextLevel }));
    },

    /**
     * Get master competency library
     */
    async getMasterCompetencies(): Promise<Competency[]> {
        const data = await competenciesApi.getAll() as Record<string, unknown>[];
        return data.map(mapCompetency);
    },

    /** Get waves for a cohort */
    async getWavesByCohort(cohortId: string): Promise<Wave[]> {
        const data = await progressApi.getWaves(cohortId) as Record<string, unknown>[];
        return data.map(mapWave);
    },

    /** Get wave_competencies for a wave */
    async getWaveCompetencies(waveId: string): Promise<WaveCompetency[]> {
        const data = await progressApi.getWaveCompetencies(waveId) as Record<string, unknown>[];
        return data.map(mapWaveCompetency);
    },

    /**
     * Update cohort with waves (replaces existing waves/wave_competencies, updates fellows)
     */
    async updateCohortWithWaves(params: {
        cohortId: string;
        cohort: Partial<Cohort>;
        waves: { id?: string; number: number; name: string; competencyIds: string[]; activeCompetencyIds: string[]; status: 'active' | 'upcoming'; phaseStates?: { believe: string; know: string; do: string; } }[];
        fellowIdsToAdd: string[];
        fellowIdsToRemove: string[];
        groundingModuleId?: string;
        isGroundingActive?: boolean;
    }): Promise<void> {
        await cohortsApi.updateWithWaves(params.cohortId, {
            cohort: toApiCohort(params.cohort),
            waves: params.waves.map((w) => ({
                number: w.number,
                name: w.name,
                status: w.status,
                phaseStates: w.phaseStates,
                competencyIds: w.competencyIds,
            })),
            fellowIdsToAdd: params.fellowIdsToAdd,
            fellowIdsToRemove: params.fellowIdsToRemove,
        });
    },
};
