import { Company } from '@/types';
import { companiesApi, filesApi } from '@/lib/api';
import { mapCompany, toApiCompany } from '@/lib/api/mappers';

export const companyService = {
    /**
     * Get all companies
     */
    async getAll(): Promise<Company[]> {
        const data = await companiesApi.getAll() as Record<string, unknown>[];
        return data.map(mapCompany);
    },

    /**
     * Get a single company by ID
     */
    async getById(id: string): Promise<Company | null> {
        const data = await companiesApi.getById(id) as Record<string, unknown>;
        return mapCompany(data);
    },

    /**
     * Create a new company
     * Rule: ID is derived from name (slugified)
     */
    async create(companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
        const trimmedName = companyData.name.trim();
        const id = trimmedName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        const created = await companiesApi.create({
            ...toApiCompany({ ...companyData, name: trimmedName }),
            id,
        }) as Record<string, unknown>;
        return String(created.id);
    },

    /**
     * Update an existing company
     */
    async update(id: string, companyData: Partial<Company>): Promise<void> {
        await companiesApi.update(id, toApiCompany(companyData));
    },

    /**
     * Delete a company
     */
    async delete(id: string): Promise<void> {
        await companiesApi.delete(id);
    },

    /**
     * Compress image client-side before upload
     */
    async compressLogo(file: File, maxWidth = 512, maxHeight = 512): Promise<Blob> {
        console.log("Service: Starting compression for file:", file.name, file.size, file.type);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                console.log("Service: File read as DataURL complete");
                const img = new Image();
                img.onload = () => {
                    console.log("Service: Image object loaded successfully:", img.width, "x", img.height);
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        console.error("Service: Canvas context error");
                        reject(new Error("Canvas context error"));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);

                    console.log("Service: Drawing to canvas complete, converting to blob...");
                    canvas.toBlob((blob) => {
                        if (blob) {
                            console.log("Service: Compression complete! Final size:", (blob.size / 1024).toFixed(2), "KB");
                            resolve(blob);
                        } else {
                            console.error("Service: toBlob returned null");
                            reject(new Error('Canvas to Blob failed'));
                        }
                    }, 'image/jpeg', 0.85);
                };
                img.onerror = (e) => {
                    console.error("Service: Image load error:", e);
                    reject(new Error("Image load failed"));
                };
                img.src = event.target?.result as string;
            };
            reader.onerror = (e) => {
                console.error("Service: FileReader error:", e);
                reject(e);
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * Upload organization logo with progress tracking
     */
    async uploadLogo(
        file: Blob | File,
        companyName: string,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        if (onProgress) onProgress(50);
        const result = await filesApi.upload(file);
        if (onProgress) onProgress(100);
        return result.url;
    }
};
