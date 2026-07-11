import { CompetencyDictionary, CompetencyLibrary } from "@/types";
import { competenciesApi } from '@/lib/api';
import { mapDictionary, mapLibrary } from '@/lib/api/mappers';

export const competencyService = {
    async getDictionary(): Promise<CompetencyDictionary[]> {
        const data = await competenciesApi.getDictionary() as Record<string, unknown>[];
        return data.map(mapDictionary);
    },

    async getDictionaryItem(id: string): Promise<CompetencyDictionary | null> {
        const items = await this.getDictionary();
        return items.find((i) => i.id === id) ?? null;
    },

    async createDictionaryItem(item: Omit<CompetencyDictionary, "id" | "created_at" | "updated_at">): Promise<string> {
        const created = await competenciesApi.createDictionary({
            code: item.code,
            name: item.name,
            definition: item.definition,
            importance: item.importance,
            proficiencyLevels: item.proficiency_levels,
        }) as Record<string, unknown>;
        return String(created.id);
    },

    async updateDictionaryItem(id: string, item: Partial<CompetencyDictionary>): Promise<void> {
        await competenciesApi.updateDictionary(id, {
            code: item.code,
            name: item.name,
            definition: item.definition,
            importance: item.importance,
            proficiencyLevels: item.proficiency_levels,
        });
    },

    async deleteDictionaryItem(id: string): Promise<void> {
        await competenciesApi.deleteDictionary(id);
    },

    async getLibrary(): Promise<CompetencyLibrary[]> {
        const data = await competenciesApi.getLibrary() as Record<string, unknown>[];
        return data.map(mapLibrary);
    },

    async getLibraryByCompany(companyId: string): Promise<CompetencyLibrary[]> {
        const data = await competenciesApi.getLibrary(companyId) as Record<string, unknown>[];
        return data.map(mapLibrary);
    },

    async getLibraryItem(id: string): Promise<CompetencyLibrary | null> {
        const items = await this.getLibrary();
        return items.find((i) => i.id === id) ?? null;
    },

    async createLibraryItem(item: Omit<CompetencyLibrary, "id" | "created_at" | "updated_at">): Promise<string> {
        const created = await competenciesApi.createLibrary({
            companyId: item.company_id,
            competencyDomain: item.competency_domain,
            dictionaryId: item.dictionary_id,
            competency: item.competency,
        }) as Record<string, unknown>;
        return String(created.id);
    },

    async updateLibraryItem(id: string, item: Partial<CompetencyLibrary>): Promise<void> {
        await competenciesApi.updateLibrary(id, {
            companyId: item.company_id,
            competencyDomain: item.competency_domain,
            dictionaryId: item.dictionary_id,
            competency: item.competency,
        });
    },

    async deleteLibraryItem(id: string): Promise<void> {
        await competenciesApi.deleteLibrary(id);
    }
};
