import { GroundingModule } from "@/types";
import { groundingApi } from '@/lib/api';
import { mapGroundingModule, toApiGroundingModule } from '@/lib/api/mappers';

export const groundingService = {
    async getModules(): Promise<GroundingModule[]> {
        const data = await groundingApi.getAll() as Record<string, unknown>[];
        return data.map(mapGroundingModule);
    },

    async getModuleById(id: string): Promise<GroundingModule | null> {
        const data = await groundingApi.getById(id) as Record<string, unknown>;
        return mapGroundingModule(data);
    },

    async getModulesByCompany(companyId: string): Promise<GroundingModule[]> {
        const data = await groundingApi.getAll(companyId) as Record<string, unknown>[];
        return data.map(mapGroundingModule);
    },

    async createModule(item: Omit<GroundingModule, "id" | "created_at" | "updated_at">): Promise<string> {
        const created = await groundingApi.create(toApiGroundingModule(item)) as Record<string, unknown>;
        return String(created.id);
    },

    async updateModule(id: string, item: Partial<GroundingModule>): Promise<void> {
        await groundingApi.update(id, toApiGroundingModule(item));
    },

    async deleteModule(id: string): Promise<void> {
        await groundingApi.delete(id);
    }
};
