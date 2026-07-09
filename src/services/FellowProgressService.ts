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
import type { Exam, ExamAttempt } from '@/services/ExamService';

export interface CompetencyBiBreakdown {
    id: string;
    title: string;
    description: string;
    believePassed: boolean;
    knowScore: number;
    doScore: number;
    score: number;
    knowContribution: number;
    doContribution: number;
}

export interface CompetencyPerformanceMetrics {
    compositeScore: number;
    examScore: number;
    examContribution: number;
    groundingContribution: number;
    hasExamAttempt: boolean;
    biBreakdown: CompetencyBiBreakdown[];
}

/** Resolve BI ids for a competency from progress records and the BI registry. */
export function resolveCompetencyBiIds(
    competencyId: string,
    progress: PhaseProgress[],
    behavioralIndicators: BehavioralIndicator[]
): string[] {
    const compositePrefix = `${competencyId}_`;
    const fromProgress = progress
        .map((p) => p.behavioral_indicator_id)
        .filter((id) => id.startsWith(compositePrefix))
        .filter((v, i, a) => a.indexOf(v) === i);

    const fromRegistry = behavioralIndicators
        .filter((bi) => bi.competency_id === competencyId)
        .map((bi) => bi.id);

    const merged = [...fromProgress];
    fromRegistry.forEach((id) => {
        if (!merged.includes(id)) merged.push(id);
    });

    return merged;
}

/** Match admin performance logic for competency exam scores. */
export function resolveCompetencyExamScore(
    competencyId: string,
    examAttempts: ExamAttempt[],
    exams?: Pick<Exam, 'id' | 'competency_id'>[]
): { score: number; hasAttempt: boolean } {
    const compExam = exams?.find((e) => e.competency_id === competencyId);
    const attempt = examAttempts.find(
        (a) => a.exam_id === competencyId || (compExam && a.exam_id === compExam.id)
    );
    if (!attempt) return { score: 0, hasAttempt: false };

    const score = attempt.score || 0;
    const examinationId = attempt.examination_id;
    const isPendingDigital = !!examinationId && attempt.status !== 'graded';
    if (isPendingDigital) return { score: 0, hasAttempt: false };

    return {
        score,
        hasAttempt: score > 0 || attempt.status === 'graded',
    };
}

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

    async updateWaveResult(resultId: string, updates: Partial<WaveResult>): Promise<void> {
        const ref = doc(db, 'wave_results', resultId);
        await updateDoc(ref, {
            ...updates,
            updated_at: new Date().toISOString(),
        });
    },

    async updateGroundingResult(resultId: string, updates: Partial<GroundingResult>): Promise<void> {
        const ref = doc(db, 'grounding_results', resultId);
        await updateDoc(ref, {
            ...updates,
            updated_at: new Date().toISOString(),
        });
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

    /**
     * Updates an existing portfolio with review feedback from admin/facilitator.
     * This method UPDATES the existing portfolio document, it does NOT create a new one.
     * @param portfolioId - The ID of the existing portfolio to update
     * @param review - Review data including status, feedback, score, and reviewer
     */
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
        // Portfolio score is now entered directly out of 50 by admin
        const approvedPortfolio = portfolios.find(p => p.status === 'approved');
        const doScore = approvedPortfolio ? (approvedPortfolio.score || 0) : 0;

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

export function buildCompetencyPerformance(
    competency: Competency,
    options: {
        progress: PhaseProgress[];
        portfolios: Portfolio[];
        behavioralIndicators: BehavioralIndicator[];
        examAttempts: ExamAttempt[];
        exams?: Pick<Exam, 'id' | 'competency_id'>[];
        groundingScoreOutOf10: number;
        biLookup?: Record<string, BehavioralIndicator>;
    }
): CompetencyPerformanceMetrics {
    const {
        progress,
        portfolios,
        behavioralIndicators,
        examAttempts,
        exams,
        groundingScoreOutOf10,
        biLookup,
    } = options;

    const biIds = resolveCompetencyBiIds(competency.id, progress, behavioralIndicators);
    const { score: examScore, hasAttempt: hasExamAttempt } = resolveCompetencyExamScore(
        competency.id,
        examAttempts,
        exams
    );

    const compositeScore = FellowProgressService.calculateCompetencyTotalScore(
        biIds,
        progress,
        portfolios,
        groundingScoreOutOf10 * 10,
        examScore
    );

    const biBreakdown = biIds.map((biId) => {
        const biInfo = biLookup?.[biId] ?? behavioralIndicators.find((bi) => bi.id === biId);
        const shortCode = biId.includes('_') ? biId.split('_').slice(1).join('_') : biId;
        const biProgress = progress.filter((p) => p.behavioral_indicator_id === biId);
        const biPortfolios = portfolios.filter((p) => p.behavioral_indicator_id === biId);
        const believePhase = biProgress.find((p) => p.phase_type === 'believe');
        const knowPhase = biProgress.find((p) => p.phase_type === 'know');
        const approvedPortfolio = biPortfolios.find((p) => p.status === 'approved');
        const knowScore = knowPhase?.know_score || 0;
        const doScore = approvedPortfolio?.score || 0;

        return {
            id: biId,
            title: biInfo?.title || shortCode || 'Indicator',
            description: biInfo?.description || '',
            believePassed: believePhase?.believe_passed || false,
            knowScore,
            doScore,
            score: FellowProgressService.calculateBIScore(biProgress, biPortfolios),
            knowContribution: knowScore > 0 ? Math.round((knowScore / 100) * 20) : 0,
            doContribution: doScore > 0 ? Math.round(doScore) : 0,
        };
    });

    return {
        compositeScore,
        examScore,
        examContribution: Math.round((examScore / 100) * 20),
        groundingContribution: groundingScoreOutOf10,
        hasExamAttempt,
        biBreakdown,
    };
}
