import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { Cohort, Competency, Wave, WaveCompetency } from '@/types';

/** Remove keys whose value is undefined so Firestore never sees them */
const stripUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;

export const CohortService = {
    /**
     * Get all cohorts
     */
    async getAllCohorts(): Promise<Cohort[]> {
        const snapshot = await getDocs(collection(db, 'cohorts'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cohort));
    },

    /**
     * Get cohorts for a company
     */
    async getCohortsByCompany(companyId: string): Promise<Cohort[]> {
        const q = query(collection(db, 'cohorts'), where('company_id', '==', companyId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cohort));
    },

    /**
     * Get a specific cohort by ID
     */
    async getCohortById(id: string): Promise<Cohort | null> {
        const d = await getDoc(doc(db, 'cohorts', id));
        return d.exists() ? { id: d.id, ...d.data() } as Cohort : null;
    },

    /**
     * Create a new cohort
     */
    async createCohort(data: Partial<Cohort>): Promise<string> {
        const cohortRef = collection(db, 'cohorts');
        const newDocRef = doc(cohortRef);

        await setDoc(newDocRef, {
            ...data,
            id: newDocRef.id,
            status: 'upcoming',
            created_at: new Date().toISOString()
        });

        return newDocRef.id;
    },

    /**
     * Update an existing cohort's basic fields
     */
    async updateCohort(cohortId: string, updates: Partial<Cohort>): Promise<void> {
        const cohortRef = doc(db, 'cohorts', cohortId);
        await updateDoc(cohortRef, stripUndefined({
            ...updates,
            updated_at: new Date().toISOString()
        } as Record<string, unknown>));
    },

    /**
     * Delete a cohort and un-assign its fellows
     */
    async deleteCohort(cohortId: string): Promise<void> {
        const batch = writeBatch(db);

        // Un-assign fellows
        const fellowsQ = query(collection(db, 'fellow_profiles'), where('cohort_id', '==', cohortId));
        const fellowsSnap = await getDocs(fellowsQ);
        fellowsSnap.docs.forEach(d => {
            batch.update(d.ref, { cohort_id: null, updated_at: new Date().toISOString() });
        });

        // Delete associated waves and wave_competencies
        const wavesQ = query(collection(db, 'waves'), where('cohort_id', '==', cohortId));
        const wavesSnap = await getDocs(wavesQ);
        for (const waveDoc of wavesSnap.docs) {
            const wcQ = query(collection(db, 'wave_competencies'), where('wave_id', '==', waveDoc.id));
            const wcSnap = await getDocs(wcQ);
            wcSnap.docs.forEach(wc => batch.delete(wc.ref));
            batch.delete(waveDoc.ref);
        }

        // Delete the cohort itself
        batch.delete(doc(db, 'cohorts', cohortId));

        await batch.commit();
    },


    /**
     * Create a new cohort with multiple waves and their competencies
     */
    async createCohortWithWaves(params: {
        cohort: Omit<Cohort, 'id' | 'created_at' | 'updated_at' | 'status'>,
        waves: {
            number: number,
            name: string,
            competencyIds: string[],
            activeCompetencyIds: string[],
            status: 'active' | 'upcoming',
            phaseStates?: { believe: string; know: string; do: string; }
        }[],
        fellowIds: string[],
        groundingModuleId?: string,
        isGroundingActive?: boolean
    }): Promise<string> {
        const batch = writeBatch(db);

        // 1. Create Cohort
        const cohortRef = doc(collection(db, 'cohorts'));
        const cohortId = cohortRef.id;
        const now = new Date().toISOString();

        batch.set(cohortRef, stripUndefined({
            ...params.cohort,
            id: cohortId,
            status: (params.cohort as any).status || 'upcoming',
            grounding_module_id: params.groundingModuleId,
            is_grounding_active: params.isGroundingActive ?? false,
            created_at: now,
            updated_at: now
        } as Record<string, unknown>));

        // 2. Create Waves and WaveCompetencies
        for (const waveData of params.waves) {
            const waveRef = doc(collection(db, 'waves'));
            const waveId = waveRef.id;

            batch.set(waveRef, {
                id: waveId,
                cohort_id: cohortId,
                number: waveData.number,
                name: waveData.name,
                status: waveData.status || 'upcoming',
                phase_states: waveData.phaseStates ?? { believe: 'locked', know: 'locked', do: 'locked' },
                created_at: now,
                updated_at: now
            });

            // Associate Competencies
            for (const compId of waveData.competencyIds) {
                const wcRef = doc(collection(db, 'wave_competencies'));
                batch.set(wcRef, {
                    id: wcRef.id,
                    wave_id: waveId,
                    competency_id: compId,
                    is_active: waveData.activeCompetencyIds.includes(compId),
                    created_at: now
                });
            }
        }

        // 3. Update Fellows
        for (const fellowId of params.fellowIds) {
            const fellowRef = doc(db, 'fellow_profiles', fellowId);
            batch.update(fellowRef, {
                cohort_id: cohortId,
                updated_at: now
            });
        }

        await batch.commit();
        return cohortId;
    },

    /**
     * Upgrade cohort level (e.g., Junior -> Mid)
     */
    async upgradeCohortLevel(cohortId: string, nextLevel: string): Promise<void> {
        const cohortRef = doc(db, 'cohorts', cohortId);
        await updateDoc(cohortRef, {
            level: nextLevel,
            updated_at: new Date().toISOString()
        });
    },

    /**
     * Get master competency library
     */
    async getMasterCompetencies(): Promise<Competency[]> {
        const q = query(collection(db, 'competencies'), orderBy('title', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Competency));
    },

    /** Get waves for a cohort */
    async getWavesByCohort(cohortId: string): Promise<Wave[]> {
        const q = query(collection(db, 'waves'), where('cohort_id', '==', cohortId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Wave));
    },

    /** Get wave_competencies for a wave */
    async getWaveCompetencies(waveId: string): Promise<WaveCompetency[]> {
        const q = query(collection(db, 'wave_competencies'), where('wave_id', '==', waveId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as WaveCompetency));
    },

    /**
     * Update cohort with waves (replaces existing waves/wave_competencies, updates fellows)
     */
    async updateCohortWithWaves(params: {
        cohortId: string;
        cohort: Partial<Cohort>;
        waves: { id?: string; number: number; name: string; competencyIds: string[]; activeCompetencyIds: string[]; status: 'active' | 'upcoming'; phaseStates?: { believe: string; know: string; do: string; } }[];
        fellowIdsToAdd: string[];
        fellowIdsToRemove: string[];
        groundingModuleId?: string;
        isGroundingActive?: boolean;
    }): Promise<void> {
        const batch = writeBatch(db);
        const now = new Date().toISOString();

        // 1. Update cohort
        batch.update(doc(db, 'cohorts', params.cohortId), stripUndefined({
            ...params.cohort,
            grounding_module_id: params.groundingModuleId !== undefined ? params.groundingModuleId : params.cohort.grounding_module_id,
            is_grounding_active: params.isGroundingActive !== undefined ? params.isGroundingActive : params.cohort.is_grounding_active,
            updated_at: now,
        } as Record<string, unknown>));

        // 2. Delete all existing waves + wave_competencies then recreate
        const wavesQ = query(collection(db, 'waves'), where('cohort_id', '==', params.cohortId));
        const wavesSnap = await getDocs(wavesQ);
        for (const waveDoc of wavesSnap.docs) {
            const wcQ = query(collection(db, 'wave_competencies'), where('wave_id', '==', waveDoc.id));
            const wcSnap = await getDocs(wcQ);
            wcSnap.docs.forEach(wc => batch.delete(wc.ref));
            batch.delete(waveDoc.ref);
        }

        // 3. Recreate waves + wave_competencies
        for (const waveData of params.waves) {
            const waveRef = doc(collection(db, 'waves'));
            const waveId = waveRef.id;
            batch.set(waveRef, {
                id: waveId,
                cohort_id: params.cohortId,
                number: waveData.number,
                name: waveData.name,
                status: waveData.status,
                phase_states: waveData.phaseStates ?? { believe: 'locked', know: 'locked', do: 'locked' },
                created_at: now,
                updated_at: now,
            });
            for (const compId of waveData.competencyIds) {
                const wcRef = doc(collection(db, 'wave_competencies'));
                batch.set(wcRef, {
                    id: wcRef.id,
                    wave_id: waveId,
                    competency_id: compId,
                    is_active: waveData.activeCompetencyIds.includes(compId),
                    created_at: now,
                });
            }
        }

        // 4. Un-assign removed fellows
        for (const fId of params.fellowIdsToRemove) {
            batch.update(doc(db, 'fellow_profiles', fId), { cohort_id: null, updated_at: now });
        }

        // 5. Assign new fellows
        for (const fId of params.fellowIdsToAdd) {
            batch.update(doc(db, 'fellow_profiles', fId), { cohort_id: params.cohortId, updated_at: now });
        }

        await batch.commit();
    },
};
