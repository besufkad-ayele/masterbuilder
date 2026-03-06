import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    where
} from 'firebase/firestore';
import { AdminProfile, User } from '@/types';

export const AdminManagementService = {
    /**
     * Get all admin profiles
     */
    async getAllAdmins(): Promise<AdminProfile[]> {
        const snapshot = await getDocs(collection(db, 'admin_profiles'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminProfile));
    },

    /**
     * Update user role
     */
    async updateUserRole(userId: string, role: string): Promise<void> {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role });
    },

    /**
     * Create a new admin with Authentication and Profile
     */
    async createAdminWithAuth(email: string, name: string, title?: string): Promise<string> {
        // 1. Create user in Auth + Sync to Firestore 'users' collection
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                name,
                role: 'ADMIN' as const,
                title,
                password: 'Password123!' // Default password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create admin user');
        }

        const { userId } = await response.json();

        // 2. Create the Admin Profile linked to the new UID
        return this.createAdminProfile({
            user_id: userId,
            title,
            is_active: true
        });
    },

    /**
     * Create a new admin profile in Firestore
     */
    async createAdminProfile(data: Partial<AdminProfile>): Promise<string> {
        const adminsRef = collection(db, 'admin_profiles');
        const newDocRef = doc(adminsRef);

        const profile = {
            ...data,
            id: newDocRef.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as AdminProfile;

        const { setDoc } = await import('firebase/firestore');
        await setDoc(newDocRef, profile);
        return newDocRef.id;
    },

    /**
     * Update admin profile and auth
     */
    async updateAdminProfile(id: string, userId: string, updates: any): Promise<void> {
        // 1. Update Auth if name or email changed
        if (updates.name || updates.email) {
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    name: updates.name,
                    email: updates.email
                })
            });
        }

        // 2. Update Firestore profile
        const adminRef = doc(db, 'admin_profiles', id);
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(adminRef, {
            ...updates,
            updated_at: new Date().toISOString()
        });
    },

    /**
     * Delete an admin profile and its associated authentication account
     */
    async deleteAdmin(profileId: string, userId: string): Promise<void> {
        // 1. Delete from Auth and Users collection via API
        const response = await fetch('/api/admin/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete authentication account');
        }

        // 2. Delete the profile document
        const adminRef = doc(db, 'admin_profiles', profileId);
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(adminRef);
    },

    /**
     * Get overall system stats for dashboard
     */
    async getSystemStats(): Promise<any> {
        const users = await getDocs(collection(db, 'users'));
        const companies = await getDocs(collection(db, 'companies'));
        const activeFellows = await getDocs(query(collection(db, 'fellow_profiles'), where('status', '==', 'Active')));

        return {
            totalUsers: users.size,
            totalCompanies: companies.size,
            activeFellows: activeFellows.size
        };
    }
};
