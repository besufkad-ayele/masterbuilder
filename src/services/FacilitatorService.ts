import { FacilitatorProfile } from '@/types';
import { facilitatorsApi } from '@/lib/api';
import { mapFacilitator } from '@/lib/api/mappers';

export const FacilitatorService = {
    /**
     * Get all facilitators
     */
    async getAllFacilitators(): Promise<FacilitatorProfile[]> {
        const data = await facilitatorsApi.getAll() as Record<string, unknown>[];
        return data.map(mapFacilitator);
    },

    /**
     * Get facilitators for a specific company
     */
    async getFacilitatorsByCompany(companyId: string): Promise<FacilitatorProfile[]> {
        const all = await facilitatorsApi.getAll() as Record<string, unknown>[];
        return all
            .map(mapFacilitator)
            .filter((f) => f.company_ids?.includes(companyId));
    },

    /**
     * Create a new facilitator with Authentication and Profile
     */
    async createFacilitatorWithAuth(email: string, name: string, data: Partial<FacilitatorProfile>): Promise<string> {
        const created = await facilitatorsApi.create({
            email,
            fullName: name,
            companyIds: data.company_ids,
            specialization: data.specialization,
            department: data.department,
        }) as Record<string, unknown>;
        return String(created.id);
    },

    /**
     * Create a new facilitator profile
     */
    async createFacilitator(data: Partial<FacilitatorProfile>): Promise<string> {
        const created = await facilitatorsApi.create({
            email: data.email,
            fullName: data.full_name,
            companyIds: data.company_ids,
            specialization: data.specialization,
            department: data.department,
        }) as Record<string, unknown>;
        return String(created.id);
    },

    /**
     * Update facilitator details
     */
    async updateFacilitator(id: string, userId: string, updates: Partial<FacilitatorProfile>): Promise<void> {
        await facilitatorsApi.update(id, {
            email: updates.email,
            fullName: updates.full_name,
            companyIds: updates.company_ids,
            specialization: updates.specialization,
            department: updates.department,
            isActive: updates.is_active,
            phone: updates.phone,
            location: updates.location,
            bio: updates.bio,
        });
    },

    /**
     * Delete a facilitator profile and its associated authentication account
     */
    async deleteFacilitator(profileId: string, userId: string): Promise<void> {
        await facilitatorsApi.delete(profileId);
    },

    /**
     * Assign a facilitator to a company
     */
    async assignToCompany(facilitatorId: string, companyId: string): Promise<void> {
        const all = await facilitatorsApi.getAll() as Record<string, unknown>[];
        const current = all.find((f) => String(f.id) === facilitatorId);
        const existing = current ? mapFacilitator(current).company_ids ?? [] : [];
        if (!existing.includes(companyId)) {
            await facilitatorsApi.update(facilitatorId, {
                companyIds: [...existing, companyId],
            });
        }
    }
};
