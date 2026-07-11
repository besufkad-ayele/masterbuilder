import { AdminProfile } from '@/types';
import { adminsApi, usersApi, adminApi } from '@/lib/api';
import { mapAdminProfile } from '@/lib/api/mappers';

export const AdminManagementService = {
    /**
     * Get all admin profiles
     */
    async getAllAdmins(): Promise<AdminProfile[]> {
        const data = await adminsApi.getAll() as Record<string, unknown>[];
        return data.map(mapAdminProfile);
    },

    /**
     * Update user role
     */
    async updateUserRole(userId: string, role: string): Promise<void> {
        await usersApi.update(userId, { role });
    },

    /**
     * Create a new admin with Authentication and Profile
     */
    async createAdminWithAuth(email: string, name: string, title?: string): Promise<string> {
        const created = await adminsApi.create({
            email,
            name,
            title,
            password: 'Password123!',
        }) as Record<string, unknown>;
        const profile = created.adminProfile as Record<string, unknown> | undefined;
        return String(profile?.id ?? created.id);
    },

    /**
     * Update admin profile and auth
     */
    async updateAdminProfile(id: string, userId: string, updates: Partial<AdminProfile> & { name?: string; email?: string }): Promise<void> {
        await adminsApi.update(id, {
            name: updates.name,
            email: updates.email,
            title: updates.title,
            isActive: updates.is_active,
            phone: updates.phone,
            location: updates.location,
            bio: updates.bio,
        });
    },

    /**
     * Delete an admin profile and its associated authentication account
     */
    async deleteAdmin(profileId: string, userId: string): Promise<void> {
        await adminsApi.delete(profileId);
    },

    /**
     * Get overall system stats for dashboard
     */
    async getSystemStats(): Promise<{ totalUsers: number; totalCompanies: number; activeFellows: number }> {
        const dashboard = await adminApi.getDashboard() as Record<string, unknown>;
        const fellows = (dashboard.fellows as Record<string, unknown>[]) ?? [];
        return {
            totalUsers: ((dashboard.users as unknown[]) ?? []).length,
            totalCompanies: ((dashboard.companies as unknown[]) ?? []).length,
            activeFellows: fellows.filter((f) => f.status === 'Active' || f.isActive).length,
        };
    }
};
