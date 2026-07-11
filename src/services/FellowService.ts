import { FellowProfile } from '@/types';
import { fellowsApi } from '@/lib/api';
import { mapFellow, toApiFellow } from '@/lib/api/mappers';

export const FellowService = {
    /**
     * Fetch all fellow profiles with optional filters
     */
    async getAllFellows(companyId?: string, cohortId?: string): Promise<FellowProfile[]> {
        const data = await fellowsApi.getAll(companyId, cohortId) as Record<string, unknown>[];
        return data.map(mapFellow);
    },

    /**
     * Get a specific fellow profile by user ID
     */
    async getFellowProfile(userId: string): Promise<FellowProfile | null> {
        const all = await fellowsApi.getAll() as Record<string, unknown>[];
        const match = all.find((f) => f.userId === userId || f.user_id === userId);
        return match ? mapFellow(match) : null;
    },

    /**
     * Create a new fellow with Authentication and Profile
     */
    async createFellowWithAuth(email: string, name: string, profileData: Partial<FellowProfile>): Promise<string> {
        const fellowId = profileData.fellow_id || await this.generateFellowId(
            profileData.company_id!,
            profileData.organization?.substring(0, 3).toUpperCase() || 'FEL',
        );
        const created = await fellowsApi.create(toApiFellow({
            ...profileData,
            email,
            full_name: name,
            fellow_id: fellowId,
        })) as Record<string, unknown>;
        return String(created.id);
    },

    /**
     * Generate a unique fellow ID based on company prefix and current count
     */
    async generateFellowId(companyId: string, companyPrefix: string): Promise<string> {
        return fellowsApi.generateId(companyId, companyPrefix);
    },

    /**
     * Update fellow profile details
     */
    async updateFellowProfile(id: string, userId: string, updates: Partial<FellowProfile>): Promise<void> {
        await fellowsApi.update(id, toApiFellow(updates));
    },

    /**
     * Assign fellow to a cohort
     */
    async assignToCohort(fellowId: string, userId: string, cohortId: string): Promise<void> {
        return this.updateFellowProfile(fellowId, userId, { cohort_id: cohortId });
    },

    /**
     * Delete a fellow profile and its associated authentication account
     */
    async deleteFellow(profileId: string, userId: string): Promise<void> {
        await fellowsApi.delete(profileId);
    },

    /**
     * Get fellows by their user IDs
     */
    async getFellowsByIds(userIds: string[]): Promise<FellowProfile[]> {
        if (!userIds || userIds.length === 0) return [];
        const all = await fellowsApi.getAll() as Record<string, unknown>[];
        return all
            .filter((f) => userIds.includes(String(f.userId ?? f.user_id)))
            .map(mapFellow);
    }
};
