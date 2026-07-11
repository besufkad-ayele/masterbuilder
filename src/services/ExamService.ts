import { examsApi } from '@/lib/api';
import { mapExam, mapExamAttempt, mapExamination, mapExaminationAttempt } from '@/lib/api/mappers';
import { toApiExam, toApiExamAttempt, toApiExamination, toApiExaminationAttempt } from '@/lib/api/examMappers';

export interface ExamQuestion {
    id: string;
    type: 'multiple_choice' | 'written';
    text: string;
    options: string[]; // Only for multiple_choice
    correct_option_index?: number; // Only for multiple_choice
    correct_written_answer?: string; // Optional reference for auto-grading or admin review
}

export interface Exam {
    id: string;
    competency_id: string;
    cohort_id: string;
    title: string;
    questions: ExamQuestion[];
    access_code: string;
    time_allocated_minutes: number;
    is_enabled: boolean;
    allow_retake: boolean;
    is_portal_open: boolean;
    created_at: string;
    updated_at: string;
}

export interface ExamAttempt {
    id: string;
    exam_id: string;
    examination_id?: string;
    user_id: string;
    score: number;
    passed: boolean;
    answers?: Record<string, any>; // Store actual answers for review
    submitted_at: string;
    status?: 'submitted' | 'graded';
    graded_by?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * NEW EXAM MODEL
 *
 *  competency_question_banks  – one question bank per (cohort, competency)
 *  examinations               – an exam that targets selected competencies AND
 *                               selected fellows, holding the access code / timer
 *  examination_attempts       – one doc per (examination, fellow); it is the live
 *                               draft first, then transitions to submitted/graded.
 *                               A per-competency mirror is written to the legacy
 *                               `exam_attempts` collection for backward-compatible
 *                               scoring in the rest of the app.
 * ────────────────────────────────────────────────────────────────────────── */

export interface CompetencyQuestionBank {
    id: string; // `${cohort_id}__${competency_id}`
    cohort_id: string;
    competency_id: string;
    questions: ExamQuestion[];
    created_at: string;
    updated_at: string;
}

export interface Examination {
    id: string;
    cohort_id: string;
    title: string;
    competency_ids: string[]; // ordered list of competencies to examine
    fellow_ids: string[]; // targeted fellow user_ids
    access_code: string;
    time_allocated_minutes: number;
    is_enabled: boolean;
    is_portal_open: boolean;
    allow_retake: boolean;
    created_at: string;
    updated_at: string;
}

export interface ExaminationCompetencySnapshot {
    competency_id: string;
    competency_title: string;
    questions: ExamQuestion[];
}

export interface CompetencyResult {
    competency_id: string;
    competency_title: string;
    mcq_correct: number;
    mcq_total: number;
    written_total: number;
    marks_earned: number; // each question is worth 1 mark (written may be partial 0..1)
    marks_total: number;
    score: number; // 0-100
    graded: boolean; // true when there are no ungraded written questions
}

/** Format marks earned out of total (1 mark per question). */
export const formatExaminationMarks = (earned: number, total: number): string => {
    const earnedLabel = Number.isInteger(earned) ? String(earned) : earned.toFixed(1);
    return `${earnedLabel}/${total}`;
};

/** Hide scores from fellows until an admin publishes results. */
export const sanitizeExaminationAttemptForFellow = (
    attempt: ExaminationAttempt
): ExaminationAttempt => {
    if (attempt.status !== 'submitted') return attempt;
    return {
        ...attempt,
        score: 0,
        passed: false,
        competency_results: [],
    };
};

export interface ExaminationAttemptDraftState {
    current_competency_index: number;
    current_question_index: number;
    remaining_seconds: number;
}

export interface ExaminationAttempt {
    id: string; // `${examination_id}__${user_id}`
    examination_id: string;
    user_id: string;
    cohort_id: string;
    title: string;
    competency_snapshots: ExaminationCompetencySnapshot[];
    answers: Record<string, string | number>; // questionId -> selected option index | written text
    written_scores: Record<string, number>; // questionId -> admin-awarded 0..1 (fraction of full marks)
    competency_results: CompetencyResult[];
    score: number; // overall 0-100
    passed: boolean;
    has_written: boolean;
    status: 'draft' | 'submitted' | 'graded';
    started_at: string;
    submitted_at?: string;
    updated_at: string;
    graded_by?: string;
    draft_state?: ExaminationAttemptDraftState;
}

const attemptId = (examinationId: string, userId: string) => `${examinationId}__${userId}`;

const parseAttemptDocId = (attemptDocId: string): { examinationId: string; userId: string } => {
    const sepIndex = attemptDocId.indexOf('__');
    if (sepIndex === -1) {
        throw new Error('Invalid examination attempt id');
    }
    return {
        examinationId: attemptDocId.slice(0, sepIndex),
        userId: attemptDocId.slice(sepIndex + 2),
    };
};

/** Compute per-competency + overall scores from snapshots, answers and written scores. */
export const computeExaminationScores = (
    snapshots: ExaminationCompetencySnapshot[],
    answers: Record<string, string | number>,
    writtenScores: Record<string, number>
): { competency_results: CompetencyResult[]; score: number; passed: boolean; has_written: boolean } => {
    const competency_results: CompetencyResult[] = [];
    let totalEarned = 0; // in "question equivalents" (0..totalQuestions)
    let totalQuestions = 0;
    let hasWritten = false;

    snapshots.forEach((snap) => {
        let mcqCorrect = 0;
        let mcqTotal = 0;
        let writtenTotal = 0;
        let compEarned = 0;
        let compUngraded = false;

        snap.questions.forEach((q) => {
            if (q.type === 'multiple_choice') {
                mcqTotal += 1;
                if (answers[q.id] !== undefined && Number(answers[q.id]) === q.correct_option_index) {
                    mcqCorrect += 1;
                    compEarned += 1;
                }
            } else {
                hasWritten = true;
                writtenTotal += 1;
                const awarded = writtenScores[q.id];
                if (awarded === undefined || awarded === null) {
                    compUngraded = true;
                } else {
                    // Written answers are graded on a 0..1 scale (fraction of full marks).
                    compEarned += Math.max(0, Math.min(1, awarded));
                }
            }
        });

        const compQuestions = mcqTotal + writtenTotal;
        const compScore = compQuestions > 0 ? Math.round((compEarned / compQuestions) * 100) : 0;
        totalEarned += compEarned;
        totalQuestions += compQuestions;

        competency_results.push({
            competency_id: snap.competency_id,
            competency_title: snap.competency_title,
            mcq_correct: mcqCorrect,
            mcq_total: mcqTotal,
            written_total: writtenTotal,
            marks_earned: compEarned,
            marks_total: compQuestions,
            score: compScore,
            graded: !compUngraded,
        });
    });

    const score = totalQuestions > 0 ? Math.round((totalEarned / totalQuestions) * 100) : 0;
    return { competency_results, score, passed: score >= 75, has_written: hasWritten };
};

export const ExamService = {
    async getExamsByCohortAndCompetency(cohortId: string, competencyId: string): Promise<Exam[]> {
        const data = await examsApi.getAll(cohortId, competencyId) as Record<string, unknown>[];
        return data.map((d) => mapExam(d) as unknown as Exam);
    },

    async getExamsByCohort(cohortId: string): Promise<Exam[]> {
        const data = await examsApi.getAll(cohortId) as Record<string, unknown>[];
        return data.map((d) => mapExam(d) as unknown as Exam);
    },

    async getExamById(id: string): Promise<Exam | null> {
        try {
            const data = await examsApi.getById(id) as Record<string, unknown>;
            return mapExam(data) as unknown as Exam;
        } catch {
            return null;
        }
    },

    async createOrUpdateExam(exam: Partial<Exam>): Promise<string> {
        const payload = toApiExam(exam);
        if (exam.id) {
            await examsApi.update(exam.id, payload);
            return exam.id;
        }
        const created = await examsApi.create(payload) as Record<string, unknown>;
        return String(created.id);
    },

    async deleteExam(id: string): Promise<void> {
        await examsApi.delete(id);
    },

    async submitExamAttempt(attempt: Omit<ExamAttempt, 'id' | 'submitted_at'>): Promise<string> {
        const created = await examsApi.createAttempt({
            ...toApiExamAttempt(attempt),
            submittedAt: new Date().toISOString(),
        }) as Record<string, unknown>;
        return String(created.id);
    },

    async getAttemptsByUser(userId: string): Promise<ExamAttempt[]> {
        const data = await examsApi.getAttempts(userId) as Record<string, unknown>[];
        return data.map((d) => mapExamAttempt(d) as unknown as ExamAttempt);
    },

    async updateExamAttempt(attemptId: string, updates: Partial<ExamAttempt>): Promise<void> {
        await examsApi.updateAttempt(attemptId, toApiExamAttempt(updates));
    },

    /* ─── Question banks (per cohort + competency) ────────────────────────── */

    async getQuestionBank(cohortId: string, competencyId: string): Promise<CompetencyQuestionBank | null> {
        const banks = await examsApi.getQuestionBanks(cohortId) as Record<string, unknown>[];
        const found = banks.find((b) => String(b.competencyId ?? b.competency_id) === competencyId);
        return found ? ({ id: String(found.id), cohort_id: cohortId, competency_id: competencyId, questions: found.questions as ExamQuestion[], created_at: '', updated_at: '' }) : null;
    },

    async getQuestionBanksByCohort(cohortId: string): Promise<CompetencyQuestionBank[]> {
        const banks = await examsApi.getQuestionBanks(cohortId) as Record<string, unknown>[];
        return banks.map((b) => ({
            id: String(b.id),
            cohort_id: cohortId,
            competency_id: String(b.competencyId ?? b.competency_id),
            questions: (b.questions ?? []) as ExamQuestion[],
            created_at: String(b.createdAt ?? ''),
            updated_at: String(b.updatedAt ?? ''),
        }));
    },

    async saveQuestionBank(cohortId: string, competencyId: string, questions: ExamQuestion[]): Promise<void> {
        await examsApi.saveQuestionBank({ cohortId, competencyId, questions });
    },

    /* ─── Examinations ────────────────────────────────────────────────────── */

    async getExaminationsByCohort(cohortId: string): Promise<Examination[]> {
        const data = await examsApi.getExaminations(cohortId) as Record<string, unknown>[];
        return data.map((d) => mapExamination(d) as unknown as Examination);
    },

    async getExaminationById(id: string): Promise<Examination | null> {
        try {
            const data = await examsApi.getExamination(id) as Record<string, unknown>;
            return mapExamination(data) as unknown as Examination;
        } catch {
            return null;
        }
    },

    /** Enabled + portal-open examinations that target the given fellow. */
    async getExaminationsForFellow(cohortId: string, userId: string): Promise<Examination[]> {
        const data = await examsApi.getExaminations(cohortId, userId) as Record<string, unknown>[];
        return data.map((d) => mapExamination(d) as unknown as Examination);
    },

    async createOrUpdateExamination(examination: Partial<Examination>): Promise<string> {
        const payload = toApiExamination(examination);
        if (examination.id) {
            await examsApi.updateExamination(examination.id, payload);
            return examination.id;
        }
        const created = await examsApi.createExamination(payload) as Record<string, unknown>;
        return String(created.id);
    },

    async deleteExamination(id: string): Promise<void> {
        await examsApi.deleteExamination(id);
    },

    /* ─── Examination attempts / drafts ───────────────────────────────────── */

    async getExaminationAttempt(examinationId: string, userId: string): Promise<ExaminationAttempt | null> {
        const attempts = await examsApi.getExaminationAttempts(userId, examinationId) as Record<string, unknown>[];
        const found = attempts[0];
        return found ? mapExaminationAttempt(found) as unknown as ExaminationAttempt : null;
    },

    async getExaminationAttemptsByUser(userId: string): Promise<ExaminationAttempt[]> {
        const data = await examsApi.getExaminationAttempts(userId) as Record<string, unknown>[];
        return data.map((d) => mapExaminationAttempt(d) as unknown as ExaminationAttempt);
    },

    async getExaminationAttemptsByExamination(examinationId: string): Promise<ExaminationAttempt[]> {
        const data = await examsApi.getExaminationAttempts(undefined, examinationId) as Record<string, unknown>[];
        return data.map((d) => mapExaminationAttempt(d) as unknown as ExaminationAttempt);
    },

    /** Create/replace the live attempt doc when a fellow starts (or retakes) an exam. */
    async startExaminationAttempt(params: {
        examination: Examination;
        userId: string;
        snapshots: ExaminationCompetencySnapshot[];
    }): Promise<ExaminationAttempt> {
        const id = attemptId(params.examination.id, params.userId);
        const now = new Date().toISOString();
        const attempt: ExaminationAttempt = {
            id,
            examination_id: params.examination.id,
            user_id: params.userId,
            cohort_id: params.examination.cohort_id,
            title: params.examination.title,
            competency_snapshots: params.snapshots,
            answers: {},
            written_scores: {},
            competency_results: [],
            score: 0,
            passed: false,
            has_written: params.snapshots.some(s => s.questions.some(q => q.type === 'written')),
            status: 'draft',
            started_at: now,
            updated_at: now,
            draft_state: {
                current_competency_index: 0,
                current_question_index: 0,
                remaining_seconds: (params.examination.time_allocated_minutes || 60) * 60,
            },
        };
        await examsApi.upsertExaminationAttempt(toApiExaminationAttempt(attempt));
        return attempt;
    },

    /** Autosave answers + navigation/timer state while the exam is in progress. */
    async saveExaminationDraft(
        examinationId: string,
        userId: string,
        updates: { answers?: Record<string, string | number>; draft_state?: ExaminationAttemptDraftState }
    ): Promise<void> {
        await examsApi.upsertExaminationAttempt({
            examinationId,
            userId,
            ...toApiExaminationAttempt({
                examination_id: examinationId,
                user_id: userId,
                answers: updates.answers,
                draft_state: updates.draft_state,
                status: 'draft',
            }),
        });
    },

    /** Submit the attempt. Scores are computed for admin review but stay hidden from fellows until approved. */
    async submitExaminationAttempt(
        examinationId: string,
        userId: string,
        answers: Record<string, string | number>
    ): Promise<ExaminationAttempt> {
        const id = attemptId(examinationId, userId);
        console.log('[ExamService.submitExaminationAttempt] start', { attemptDocId: id, examinationId, userId });

        const attempts = await examsApi.getExaminationAttempts(userId, examinationId) as Record<string, unknown>[];
        const found = attempts[0];
        if (!found) {
            console.error('[ExamService.submitExaminationAttempt] No attempt doc found at', id);
            throw new Error('Examination attempt not found');
        }
        const current = mapExaminationAttempt(found) as unknown as ExaminationAttempt;

        const { competency_results, score, passed, has_written } = computeExaminationScores(
            current.competency_snapshots,
            answers,
            current.written_scores || {}
        );
        const now = new Date().toISOString();
        const status: ExaminationAttempt['status'] = 'submitted';
        console.log('[ExamService.submitExaminationAttempt] computed scores', { score, passed, has_written, status, competency_results });

        const updated: Partial<ExaminationAttempt> = {
            answers,
            competency_results,
            score,
            passed,
            has_written,
            status,
            submitted_at: now,
            updated_at: now,
            draft_state: undefined,
        };

        await examsApi.upsertExaminationAttempt(toApiExaminationAttempt({ ...current, ...updated }));
        console.log('[ExamService.submitExaminationAttempt] examination_attempts doc written');

        try {
            await this.mirrorToLegacyAttempts({ ...current, ...updated } as ExaminationAttempt, competency_results, status);
            console.log('[ExamService.submitExaminationAttempt] legacy exam_attempts mirrored — done');
        } catch (mirrorErr) {
            console.warn('[ExamService.submitExaminationAttempt] legacy mirror failed (non-fatal)', mirrorErr);
        }
        return sanitizeExaminationAttemptForFellow({ ...current, ...updated } as ExaminationAttempt);
    },

    /** Admin publishes MCQ-only examination results (no written questions). */
    async approveExaminationResults(
        attemptDocId: string,
        approvedBy: string
    ): Promise<ExaminationAttempt> {
        const { examinationId, userId } = parseAttemptDocId(attemptDocId);
        const attempts = await examsApi.getExaminationAttempts(userId, examinationId) as Record<string, unknown>[];
        const found = attempts[0];
        if (!found) throw new Error('Examination attempt not found');
        const current = mapExaminationAttempt(found) as unknown as ExaminationAttempt;
        if (current.status !== 'submitted') {
            throw new Error('Only submitted examinations can be approved');
        }
        if ((current.competency_results || []).some((r) => r.written_total > 0)) {
            throw new Error('Examinations with written questions must be graded individually');
        }
        return this.gradeExaminationAttempt(attemptDocId, {}, approvedBy);
    },

    /** Admin grades written answers; recompute scores and finalize status. */
    async gradeExaminationAttempt(
        attemptDocId: string,
        writtenScores: Record<string, number>,
        gradedBy: string
    ): Promise<ExaminationAttempt> {
        const { examinationId, userId } = parseAttemptDocId(attemptDocId);
        const attempts = await examsApi.getExaminationAttempts(userId, examinationId) as Record<string, unknown>[];
        const found = attempts[0];
        if (!found) throw new Error('Examination attempt not found');
        const current = mapExaminationAttempt(found) as unknown as ExaminationAttempt;

        const mergedWritten = { ...(current.written_scores || {}), ...writtenScores };
        const { competency_results, score, passed, has_written } = computeExaminationScores(
            current.competency_snapshots,
            current.answers || {},
            mergedWritten
        );
        const allWrittenGraded = competency_results.every(r => r.graded);
        const now = new Date().toISOString();
        const status: ExaminationAttempt['status'] = allWrittenGraded ? 'graded' : 'submitted';

        const updated: Partial<ExaminationAttempt> = {
            written_scores: mergedWritten,
            competency_results,
            score,
            passed,
            has_written,
            status,
            graded_by: gradedBy,
            updated_at: now,
        };

        await examsApi.upsertExaminationAttempt(toApiExaminationAttempt({ ...current, ...updated }));

        try {
            await this.mirrorToLegacyAttempts({ ...current, ...updated } as ExaminationAttempt, competency_results, status);
        } catch (mirrorErr) {
            console.warn('[ExamService.gradeExaminationAttempt] legacy mirror failed (non-fatal)', mirrorErr);
        }
        return { ...current, ...updated } as ExaminationAttempt;
    },

    /**
     * Write one legacy `exam_attempts` doc per competency (id = `${examinationId}__${competencyId}__${userId}`,
     * exam_id = competency_id) so the existing composite scoring keeps working.
     */
    async mirrorToLegacyAttempts(
        attempt: ExaminationAttempt,
        results: CompetencyResult[],
        status: ExaminationAttempt['status']
    ): Promise<void> {
        const now = new Date().toISOString();
        await Promise.all(
            results.map(async (r) => {
                const legacyId = `${attempt.examination_id}__${r.competency_id}__${attempt.user_id}`;
                const published = status === 'graded';
                const payload = toApiExamAttempt({
                    exam_id: r.competency_id,
                    examination_id: attempt.examination_id,
                    user_id: attempt.user_id,
                    score: published ? r.score : 0,
                    passed: published ? r.score >= 75 : false,
                    status: status === 'draft' ? 'submitted' : status,
                    submitted_at: attempt.submitted_at || now,
                });
                try {
                    await examsApi.updateAttempt(legacyId, payload);
                } catch {
                    await examsApi.createAttempt(payload);
                }
            })
        );
    }
};
