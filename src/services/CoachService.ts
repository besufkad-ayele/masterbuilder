import { CoachProfile, PeerCircle } from '@/types';
import { coachesApi } from '@/lib/api';
import { mapCoach, mapPeerCircle } from '@/lib/api/mappers';

export const CoachService = {
    /**
     * Get all coaches
     */
    async getAllCoaches(): Promise<CoachProfile[]> {
        const data = await coachesApi.getAll() as Record<string, unknown>[];
        return data.map(mapCoach);
    },

    /**
     * Get all peer circles
     */
    async getAllPeerCircles(): Promise<PeerCircle[]> {
        const data = await coachesApi.getPeerCircles() as Record<string, unknown>[];
        return data.map(mapPeerCircle);
    },

    /**
     * Get peer circle by ID
     */
    async getPeerCircleById(id: string): Promise<PeerCircle | null> {
        const circles = await coachesApi.getPeerCircles() as Record<string, unknown>[];
        const found = circles.find((c) => String(c.id) === id);
        return found ? mapPeerCircle(found) : null;
    },

    /**
     * Create a new coach with Authentication and Profile
     */
    async createCoachWithAuth(email: string, name: string, password?: string, data: Partial<CoachProfile> = {}): Promise<string> {
        const created = await coachesApi.create({
            email,
            fullName: name,
            password,
            specialization: data.specialization,
            isActive: data.is_active ?? true,
        }) as Record<string, unknown>;
        return String(created.id);
    },

    /**
     * Create a new coach profile
     */
    async createCoach(data: Partial<CoachProfile>): Promise<string> {
        const created = await coachesApi.create({
            email: data.email,
            fullName: data.full_name,
            specialization: data.specialization,
            isActive: data.is_active ?? true,
        }) as Record<string, unknown>;
        return String(created.id);
    },

    /**
     * Update coach details
     */
    async updateCoach(id: string, userId: string, updates: Partial<CoachProfile>): Promise<void> {
        await coachesApi.update(id, {
            email: updates.email,
            fullName: updates.full_name,
            specialization: updates.specialization,
            isActive: updates.is_active,
        });
    },

    /**
     * Update coach password
     */
    async updateCoachPassword(userId: string, profileId: string, password: string): Promise<void> {
        await coachesApi.update(profileId, { password });
    },

    /**
     * Delete a coach
     */
    async deleteCoach(id: string, userId: string): Promise<void> {
        await coachesApi.delete(id);
    },

    /**
     * Peer Circle Management
     */
    async createPeerCircle(data: Omit<PeerCircle, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
        const created = await coachesApi.createPeerCircle({
            name: data.name,
            coachId: data.coach_id,
            cohortId: data.cohort_id,
            companyId: data.company_id,
            fellowIds: data.fellow_ids,
        }) as Record<string, unknown>;
        return String(created.id);
    },

    async updatePeerCircle(id: string, updates: Partial<PeerCircle>): Promise<void> {
        await coachesApi.updatePeerCircle(id, {
            name: updates.name,
            fellowIds: updates.fellow_ids,
        });
    },

    async deletePeerCircle(id: string): Promise<void> {
        await coachesApi.deletePeerCircle(id);
    },

    /**
     * Get peer circles for a specific coach
     */
    async getPeerCirclesByCoachId(coachId: string): Promise<PeerCircle[]> {
        const circles = await coachesApi.getPeerCircles() as Record<string, unknown>[];
        return circles
            .filter((c) => String(c.coachId ?? c.coach_id) === coachId)
            .map(mapPeerCircle);
    },

    /**
     * Get coach profile by user ID
     */
    async getCoachByUserId(userId: string): Promise<CoachProfile | null> {
        const coaches = await coachesApi.getAll() as Record<string, unknown>[];
        const found = coaches.find((c) => String(c.userId ?? c.user_id) === userId);
        return found ? mapCoach(found) : null;
    }
};
