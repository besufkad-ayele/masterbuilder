import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { FacilitatorProfile } from '@/types';

export const FacilitatorService = {
    /**
     * Get all facilitators
     */
    async getAllFacilitators(): Promise<FacilitatorProfile[]> {
        const snapshot = await getDocs(collection(db, 'facilitator_profiles'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacilitatorProfile));
    },

    /**
     * Get facilitators for a specific company
     */
    async getFacilitatorsByCompany(companyId: string): Promise<FacilitatorProfile[]> {
        const q = query(
            collection(db, 'facilitator_profiles'),
            where('company_ids', 'array-contains', companyId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacilitatorProfile));
    },

    /**
     * Create a new facilitator with Authentication and Profile
     */
    async createFacilitatorWithAuth(email: string, name: string, data: Partial<FacilitatorProfile>): Promise<string> {
        // 1. Create user in Auth + Sync to Firestore 'users' collection
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                name,
                role: 'FACILITATOR' as const
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create facilitator user');
        }

        const { userId } = await response.json();

        // 2. Create the Facilitator Profile linked to the new UID
        return this.createFacilitator({
            ...data,
            user_id: userId,
            email: email,
        });
    },

    /**
     * Create a new facilitator profile
     */
    async createFacilitator(data: Partial<FacilitatorProfile>): Promise<string> {
        const facilitatorRef = collection(db, 'facilitator_profiles');
        const newDocRef = doc(facilitatorRef);

        await setDoc(newDocRef, {
            ...data,
            id: newDocRef.id,
            is_active: true,
            created_at: new Date().toISOString()
        });

        return newDocRef.id;
    },

    /**
     * Update facilitator details
     */
    async updateFacilitator(id: string, userId: string, updates: Partial<FacilitatorProfile>): Promise<void> {
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
        const facilitatorRef = doc(db, 'facilitator_profiles', id);
        await updateDoc(facilitatorRef, {
            ...updates,
            updated_at: new Date().toISOString()
        });
    },

    /**
     * Delete a facilitator profile and its associated authentication account
     */
    async deleteFacilitator(profileId: string, userId: string): Promise<void> {
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
        const facilitatorRef = doc(db, 'facilitator_profiles', profileId);
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(facilitatorRef);
    },

    /**
     * Assign a facilitator to a company
     */
    async assignToCompany(facilitatorId: string, companyId: string): Promise<void> {
        const facilitatorRef = doc(db, 'facilitator_profiles', facilitatorId);
        const { arrayUnion } = await import('firebase/firestore');
        await updateDoc(facilitatorRef, {
            company_ids: arrayUnion(companyId)
        });
    }
};
