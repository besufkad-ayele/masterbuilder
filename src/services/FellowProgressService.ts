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
import { apiClient, groundingApi, progressApi } from '@/lib/api';
import {
    mapPortfolio,
    mapPhaseProgress,
    mapGroundingResult,
    mapWaveResult,
    mapBehavioralIndicator,
    mapCompetency,
    mapWaveCompetency,
    mapGroundingModule,
} from '@/lib/api/mappers';

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

const mapWave = (w: Record<string, unknown>): Wave => ({
    id: String(w.id),
    cohort_id: String(w.cohortId ?? w.cohort_id),
    number: Number(w.number),
    name: w.name ? String(w.name) : undefined,
    status: w.status as Wave['status'],
    phase_states: (w.phaseStates ?? w.phase_states) as Wave['phase_states'],
    created_at: String(w.createdAt ?? w.created_at),
    updated_at: String(w.updatedAt ?? w.updated_at),
});

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
        const data = await progressApi.getPortfolios(userId) as Record<string, unknown>[];
        return data.map(mapPortfolio);
    },

    async getPortfoliosByUserIds(userIds: string[]): Promise<Portfolio[]> {
        if (!userIds || userIds.length === 0) return [];
        const results = await Promise.all(
            userIds.map((userId) => progressApi.getPortfolios(userId) as Promise<Record<string, unknown>[]>)
        );
        return results.flat().map(mapPortfolio);
    },

    async getPhaseProgressByFellow(userId: string): Promise<PhaseProgress[]> {
        const data = await progressApi.getPhaseProgress(userId) as Record<string, unknown>[];
        return data.map(mapPhaseProgress);
    },

    async getGroundingResultsByFellow(userId: string): Promise<GroundingResult[]> {
        const data = await progressApi.getGroundingResults(userId) as Record<string, unknown>[];
        return data.map(mapGroundingResult);
    },

    async getWaveResultsByFellow(userId: string): Promise<WaveResult[]> {
        const data = await progressApi.getWaveResults(userId) as Record<string, unknown>[];
        return data.map(mapWaveResult);
    },

    async updateWaveResult(resultId: string, updates: Partial<WaveResult>): Promise<void> {
        await apiClient.patch(`/progress/wave-results/${resultId}`, {
            examScore: updates.exam_score,
            finalScore: updates.final_score,
            competencyAvg: updates.competency_avg,
            groundingScore: updates.grounding_score,
        });
    },

    async updateGroundingResult(resultId: string, updates: Partial<GroundingResult>): Promise<void> {
        if (updates.fellow_id && updates.grounding_id) {
            await progressApi.upsertGroundingResult({
                fellowId: updates.fellow_id,
                groundingId: updates.grounding_id,
                score: updates.score,
                isPassed: updates.is_passed,
                status: updates.status,
            });
            return;
        }
        await apiClient.patch(`/progress/grounding-results/${resultId}`, {
            score: updates.score,
            isPassed: updates.is_passed,
            status: updates.status,
        });
    },

    async getAllBehavioralIndicators(): Promise<BehavioralIndicator[]> {
        const data = await progressApi.getBehavioralIndicators() as Record<string, unknown>[];
        return data.map(mapBehavioralIndicator);
    },

    async getAllCompetencies(): Promise<Competency[]> {
        const data = await progressApi.getCompetencies() as Record<string, unknown>[];
        return data.map(mapCompetency);
    },

    async getWavesByCohort(cohortId: string): Promise<Wave[]> {
        const data = await progressApi.getWaves(cohortId) as Record<string, unknown>[];
        return data.map(mapWave);
    },

    async getAllWaves(): Promise<Wave[]> {
        const data = await progressApi.getWaves() as Record<string, unknown>[];
        return data.map(mapWave);
    },

    async getAllWaveCompetencies(): Promise<WaveCompetency[]> {
        const data = await progressApi.getWaveCompetencies() as Record<string, unknown>[];
        return data.map(mapWaveCompetency);
    },

    async getGroundingModules(): Promise<GroundingModule[]> {
        const data = await groundingApi.getAll() as Record<string, unknown>[];
        return data.map(mapGroundingModule);
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
        await progressApi.reviewPortfolio(portfolioId, {
            status: review.status,
            feedback: review.feedback,
            score: review.score,
            reviewedBy: review.reviewed_by,
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
