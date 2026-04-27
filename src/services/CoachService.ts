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
    deleteDoc,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { CoachProfile, PeerCircle } from '@/types';

export const CoachService = {
    /**
     * Get all coaches
     */
    async getAllCoaches(): Promise<CoachProfile[]> {
        const snapshot = await getDocs(collection(db, 'coach_profiles'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachProfile));
    },

    /**
     * Get all peer circles
     */
    async getAllPeerCircles(): Promise<PeerCircle[]> {
        const snapshot = await getDocs(collection(db, 'peer_circles'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeerCircle));
    },

    /**
     * Get peer circle by ID
     */
    async getPeerCircleById(id: string): Promise<PeerCircle | null> {
        const docRef = doc(db, 'peer_circles', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as PeerCircle) : null;
    },

    /**
     * Create a new coach with Authentication and Profile
     */
    async createCoachWithAuth(email: string, name: string, password?: string, data: Partial<CoachProfile> = {}): Promise<string> {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                name,
                password,
                role: 'COACH' as const
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create coach user');
        }

        const { userId } = await response.json();
        
        return this.createCoach({
            ...data,
            user_id: userId,
            full_name: name,
            email: email,
            temporary_password: password // Store for admin visibility
        });
    },

    /**
     * Create a new coach profile
     */
    async createCoach(data: Partial<CoachProfile>): Promise<string> {
        const coachRef = collection(db, 'coach_profiles');
        const newDocRef = doc(coachRef);

        await setDoc(newDocRef, {
            ...data,
            id: newDocRef.id,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        return newDocRef.id;
    },

    /**
     * Update coach details
     */
    async updateCoach(id: string, userId: string, updates: Partial<CoachProfile>): Promise<void> {
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

        const coachRef = doc(db, 'coach_profiles', id);
        await updateDoc(coachRef, {
            ...updates,
            updated_at: new Date().toISOString()
        });
    },

    /**
     * Update coach password
     */
    async updateCoachPassword(userId: string, profileId: string, password: string): Promise<void> {
        await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                password
            })
        });

        // Update temporary password in Firestore for admin reference
        const coachRef = doc(db, 'coach_profiles', profileId);
        await updateDoc(coachRef, {
            temporary_password: password,
            updated_at: new Date().toISOString()
        });
    },

    /**
     * Delete a coach
     */
    async deleteCoach(id: string, userId: string): Promise<void> {
        // 1. Delete authentication account
        await fetch('/api/admin/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        // 2. Delete profile record
        await deleteDoc(doc(db, 'coach_profiles', id));
    },

    /**
     * Peer Circle Management
     */
    async createPeerCircle(data: Omit<PeerCircle, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
        const circleRef = collection(db, 'peer_circles');
        const newDocRef = doc(circleRef);
        const now = new Date().toISOString();

        await setDoc(newDocRef, {
            ...data,
            id: newDocRef.id,
            created_at: now,
            updated_at: now
        });

        // Update fellow profiles with peer_circle_id
        const batch = [];
        for (const fellowUserId of data.fellow_ids) {
            const q = query(collection(db, 'fellow_profiles'), where('user_id', '==', fellowUserId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                batch.push(updateDoc(doc(db, 'fellow_profiles', snap.docs[0].id), {
                    peer_circle_id: newDocRef.id
                }));
            }
        }
        await Promise.all(batch);

        return newDocRef.id;
    },

    async updatePeerCircle(id: string, updates: Partial<PeerCircle>): Promise<void> {
        const circleRef = doc(db, 'peer_circles', id);
        
        // Get old data to handle fellow profile updates
        const circleDoc = await getDocs(query(collection(db, 'peer_circles'), where('id', '==', id)));
        const oldData = circleDoc.docs[0]?.data() as PeerCircle;

        await updateDoc(circleRef, {
            ...updates,
            updated_at: new Date().toISOString()
        });

        // If fellow_ids changed, update profiles
        if (updates.fellow_ids && oldData) {
            const added = updates.fellow_ids.filter(fid => !oldData.fellow_ids.includes(fid));
            const removed = oldData.fellow_ids.filter(fid => !updates.fellow_ids!.includes(fid));

            const batch = [];
            for (const fid of added) {
                const q = query(collection(db, 'fellow_profiles'), where('user_id', '==', fid));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    batch.push(updateDoc(doc(db, 'fellow_profiles', snap.docs[0].id), {
                        peer_circle_id: id
                    }));
                }
            }
            for (const fid of removed) {
                const q = query(collection(db, 'fellow_profiles'), where('user_id', '==', fid));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    batch.push(updateDoc(doc(db, 'fellow_profiles', snap.docs[0].id), {
                        peer_circle_id: null
                    }));
                }
            }
            await Promise.all(batch);
        }
    },

    async deletePeerCircle(id: string): Promise<void> {
        // 1. Get fellow_ids to clear their profiles
        const circleDoc = await getDocs(query(collection(db, 'peer_circles'), where('id', '==', id)));
        const data = circleDoc.docs[0]?.data() as PeerCircle;
        
        if (data) {
            const batch = [];
            for (const fid of data.fellow_ids) {
                const q = query(collection(db, 'fellow_profiles'), where('user_id', '==', fid));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    batch.push(updateDoc(doc(db, 'fellow_profiles', snap.docs[0].id), {
                        peer_circle_id: null
                    }));
                }
            }
            await Promise.all(batch);
        }

        // 2. Delete the circle
        await deleteDoc(doc(db, 'peer_circles', id));
    },

    /**
     * Get peer circles for a specific coach
     */
    async getPeerCirclesByCoachId(coachId: string): Promise<PeerCircle[]> {
        const q = query(collection(db, 'peer_circles'), where('coach_id', '==', coachId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeerCircle));
    },

    /**
     * Get coach profile by user ID
     */
    async getCoachByUserId(userId: string): Promise<CoachProfile | null> {
        const q = query(collection(db, 'coach_profiles'), where('user_id', '==', userId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CoachProfile;
    }
};
