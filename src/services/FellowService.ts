import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { FellowProfile, User } from '@/types';

export const FellowService = {
    /**
     * Fetch all fellow profiles with optional filters
     */
    async getAllFellows(companyId?: string): Promise<FellowProfile[]> {
        const fellowsRef = collection(db, 'fellow_profiles');
        let q = query(fellowsRef);

        if (companyId) {
            q = query(fellowsRef, where('company_id', '==', companyId));
        }

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FellowProfile));

        // Sort client-side to avoid Firestore index requirements
        return data.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    },

    /**
     * Get a specific fellow profile by user ID
     */
    async getFellowProfile(userId: string): Promise<FellowProfile | null> {
        const q = query(collection(db, 'fellow_profiles'), where('user_id', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FellowProfile;
    },

    /**
     * Create a new fellow with Authentication and Profile
     */
    async createFellowWithAuth(email: string, name: string, profileData: Partial<FellowProfile>): Promise<string> {
        // 1. Create user in Auth + Sync to Firestore 'users' collection
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                name,
                role: 'FELLOW' as const
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create user');
        }

        const { userId } = await response.json();

        // 2. Create the Fellow Profile linked to the new UID
        return this.createFellowProfile({
            ...profileData,
            user_id: userId,
            email: email, // Ensure email is in profile too
        });
    },

    /**
     * Create a new fellow profile and register the unique Fellow ID
     */
    async createFellowProfile(profileData: Partial<FellowProfile>): Promise<string> {
        const fellowsRef = collection(db, 'fellow_profiles');
        const newDocRef = doc(fellowsRef);

        const data = {
            ...profileData,
            id: newDocRef.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: profileData.status || 'Onboarding'
        } as FellowProfile;

        await setDoc(newDocRef, data);
        return newDocRef.id;
    },

    /**
     * Generate a unique fellow ID based on company prefix and current count
     */
    async generateFellowId(companyId: string, companyPrefix: string): Promise<string> {
        const q = query(collection(db, 'fellow_profiles'), where('company_id', '==', companyId));
        const snapshot = await getDocs(q);
        const count = snapshot.size;
        return `${companyPrefix}-F${String(count + 1).padStart(4, '0')}`;
    },

    /**
     * Update fellow profile details
     */
    async updateFellowProfile(id: string, userId: string, updates: Partial<FellowProfile>): Promise<void> {
        // 1. If name or email changed, update Auth
        if (updates.full_name || updates.email) {
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    name: updates.full_name,
                    email: updates.email
                })
            });
        }

        // 2. Update Firestore profile
        const fellowRef = doc(db, 'fellow_profiles', id);
        await updateDoc(fellowRef, {
            ...updates,
            updated_at: new Date().toISOString()
        });
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
        const fellowRef = doc(db, 'fellow_profiles', profileId);
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(fellowRef);
    }
};
