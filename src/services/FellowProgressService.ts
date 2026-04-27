import { db } from '@/lib/firebase';
import {
    collection, getDocs, query, where, doc, updateDoc
} from 'firebase/firestore';
import {
    Portfolio,
    PhaseProgress,
    GroundingResult,
    WaveResult,
    BehavioralIndicator,
    Competency,
    Wave,
    WaveCompetency,
    PortfolioStatus,
    GroundingModule,
} from '@/types';

export const FellowProgressService = {

    async getPortfoliosByFellow(userId: string): Promise<Portfolio[]> {
        const q = query(collection(db, 'portfolios'), where('user_id', '==', userId));
        const s = await getDocs(q);
        return s.docs.map(d => ({ id: d.id, ...d.data() } as Portfolio));
    },

    async getPortfoliosByUserIds(userIds: string[]): Promise<Portfolio[]> {
        if (!userIds || userIds.length === 0) return [];

        const portfoliosRef = collection(db, 'portfolios');
        const chunks = [];
        for (let i = 0; i < userIds.length; i += 10) {
            chunks.push(userIds.slice(i, i + 10));
        }

        const results: Portfolio[] = [];
        for (const chunk of chunks) {
            const q = query(portfoliosRef, where('user_id', 'in', chunk));
            const snapshot = await getDocs(q);
            results.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Portfolio)));
        }
        return results;
    },

    async getPhaseProgressByFellow(userId: string): Promise<PhaseProgress[]> {
        const q = query(collection(db, 'phase_progress'), where('user_id', '==', userId));
        const s = await getDocs(q);
        return s.docs.map(d => ({ id: d.id, ...d.data() } as PhaseProgress));
    },

    async getGroundingResultsByFellow(userId: string): Promise<GroundingResult[]> {
        const q = query(collection(db, 'grounding_results'), where('fellow_id', '==', userId));
        const s = await getDocs(q);
        return s.docs.map(d => ({ id: d.id, ...d.data() } as GroundingResult));
    },

    async getWaveResultsByFellow(userId: string): Promise<WaveResult[]> {
        const q = query(collection(db, 'wave_results'), where('user_id', '==', userId));
        const s = await getDocs(q);
        return s.docs.map(d => ({ id: d.id, ...d.data() } as WaveResult));
    },

    async getAllBehavioralIndicators(): Promise<BehavioralIndicator[]> {
        // Get standalone behavioral indicators
        const biSnapshot = await getDocs(collection(db, 'behavioral_indicators'));
        const standaloneBIs = biSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as BehavioralIndicator));

        // Get behavioral indicators from competency library
        const librarySnapshot = await getDocs(collection(db, 'competency_library'));
        const libraryBIs: BehavioralIndicator[] = [];

        librarySnapshot.docs.forEach(doc => {
            const library = doc.data();
            const libraryId = doc.id;
            
            if (library.competency?.behavioral_indicators) {
                library.competency.behavioral_indicators.forEach((bi: any, index: number) => {
                    libraryBIs.push({
                        id: `${libraryId}_BI${index + 1}`,
                        competency_id: libraryId,
                        code: bi.code || `BI${index + 1}`,
                        title: bi.description || bi.code || `Behavioral Indicator ${index + 1}`,
                        description: bi.description || '',
                        level: library.competency.target_level || 'Basic',
                        created_at: library.created_at || new Date().toISOString(),
                        updated_at: library.updated_at || new Date().toISOString()
                    } as BehavioralIndicator);
                });
            }
        });

        // Combine both sources
        return [...standaloneBIs, ...libraryBIs];
    },

    async getAllCompetencies(): Promise<Competency[]> {
        // Get standalone competencies
        const compSnapshot = await getDocs(collection(db, 'competencies'));
        const standaloneComps = compSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Competency));

        // Get competencies from competency library
        const librarySnapshot = await getDocs(collection(db, 'competency_library'));
        const libraryComps: Competency[] = librarySnapshot.docs.map(doc => {
            const library = doc.data();
            return {
                id: doc.id,
                code: library.competency?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase() || 'COMP',
                title: library.competency?.name || 'Competency',
                description: library.competency?.definition || '',
                category: library.competency_domain?.toLowerCase().includes('yourself') ? 'ly' : 
                         library.competency_domain?.toLowerCase().includes('others') ? 'lo' : 
                         library.competency_domain?.toLowerCase().includes('organization') ? 'lorg' : 'general',
                level: library.competency?.target_level || 'Basic',
                created_at: library.created_at || new Date().toISOString(),
                updated_at: library.updated_at || new Date().toISOString()
            } as Competency;
        });

        // Combine both sources
        return [...standaloneComps, ...libraryComps];
    },

    async getWavesByCohort(cohortId: string): Promise<Wave[]> {
        const q = query(collection(db, 'waves'), where('cohort_id', '==', cohortId));
        const s = await getDocs(q);
        return s.docs.map(d => ({ id: d.id, ...d.data() } as Wave));
    },

    async getAllWaves(): Promise<Wave[]> {
        const s = await getDocs(collection(db, 'waves'));
        return s.docs.map(d => ({ id: d.id, ...d.data() } as Wave));
    },

    async getAllWaveCompetencies(): Promise<WaveCompetency[]> {
        const s = await getDocs(collection(db, 'wave_competencies'));
        return s.docs.map(d => ({ id: d.id, ...d.data() } as WaveCompetency));
    },

    async getGroundingModules(): Promise<GroundingModule[]> {
        const s = await getDocs(collection(db, 'grounding_modules'));
        return s.docs.map(d => ({ id: d.id, ...d.data() } as GroundingModule));
    },

    async updatePortfolioReview(
        portfolioId: string,
        review: {
            status: PortfolioStatus;
            feedback: string;
            score?: number;
            reviewed_by?: string;
        }
    ): Promise<void> {
        const ref = doc(db, 'portfolios', portfolioId);
        await updateDoc(ref, {
            ...review,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    },

    /**
     * Calculates the weighted score for a single Behavioral Indicator.
     * Logic:
     * - Believe: Pass/Fail Gatekeeper. If not passed, score is 0.
     * - Know: 20% (Quiz Score out of 100 normalized to 20)
     * - Do: 50% (Approved Portfolio Score out of 100 normalized to 50)
     * Limit: Up to 3 portfolios can be submitted, only one approved is used.
     */
    calculateBIScore(
        progress: PhaseProgress[],
        portfolios: Portfolio[]
    ): number {
        const believe = progress.find(p => p.phase_type === 'believe');
        const know = progress.find(p => p.phase_type === 'know');

        // 1. Believe (Gatekeeper)
        // If Believe is failed or missing, the entire BI score is 0
        if (!believe?.believe_passed) return 0;

        // 2. Know (20%)
        // Result converted to 20% (Assumes know_score is 0-100)
        const knowScore = ((know?.know_score || 0) / 100) * 20;

        // 3. Do (50%)
        // Find the first approved portfolio specifically for this BI
        // User mentioned "only one of it pass the evaluation and get scored"
        const approvedPortfolio = portfolios.find(p => p.status === 'approved');
        const doScore = approvedPortfolio ? ((approvedPortfolio.score || 0) / 100) * 50 : 0;

        // Returns score out of 70 (Know 20 + Do 50)
        return Math.min(Math.round(knowScore + doScore), 70);
    },

    /**
     * Aggregates results across multiple BIs for a Competency and includes Exam & Grounding.
     * Formula: (Grounding * 0.1) + (Avg BI Know/Do * 0.7) + (Exam * 0.2)
     */
    calculateCompetencyTotalScore(
        biIds: string[],
        allProgress: PhaseProgress[],
        allPortfolios: Portfolio[],
        groundingScore: number, // Normalized out of 100
        examScore: number // Normalized out of 100
    ): number {
        if (biIds.length === 0) return 0;

        const biScores = biIds.map(biId => {
            const biProgress = allProgress.filter(p => p.behavioral_indicator_id === biId);
            const biPortfolios = allPortfolios.filter(p => p.behavioral_indicator_id === biId);
            return this.calculateBIScore(biProgress, biPortfolios);
        });

        // Avg of BIs (each BI is max 70)
        const biAverage = biScores.reduce((a, b) => a + b, 0) / biIds.length;

        // Final Composite:
        // Grounding (10%) + BI Avg (Know/Do 70%) + Exam (20%)
        const compositeGrounding = (groundingScore / 100) * 10;
        const compositeExam = (examScore / 100) * 20;

        return Math.round(compositeGrounding + biAverage + compositeExam);
    },

    /**
     * Legacy helper used for compatibility, now utilizes the new logic but returns Avg BI score
     */
    calculateCompetencyScore(
        biIds: string[],
        allProgress: PhaseProgress[],
        allPortfolios: Portfolio[]
    ): number {
        if (biIds.length === 0) return 0;
        const scores = biIds.map(biId => {
            const biProgress = allProgress.filter(p => p.behavioral_indicator_id === biId);
            const biPortfolios = allPortfolios.filter(p => p.behavioral_indicator_id === biId);
            return this.calculateBIScore(biProgress, biPortfolios);
        });
        // Returns avg out of 70, but we scale it to 100 for visual consistency if needed
        return Math.round((scores.reduce((a, b) => a + b, 0) / biIds.length) * (100 / 70));
    }
};
