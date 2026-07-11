import type { Exam, ExamAttempt, Examination, ExaminationAttempt } from './ExamService';

type ApiRecord = Record<string, unknown>;

export function toApiExam(exam: Partial<Exam>): ApiRecord {
  return {
    cohortId: exam.cohort_id,
    competencyId: exam.competency_id,
    title: exam.title,
    questions: exam.questions,
    accessCode: exam.access_code,
    timeAllocatedMinutes: exam.time_allocated_minutes,
    isEnabled: exam.is_enabled,
    allowRetake: exam.allow_retake,
    isPortalOpen: exam.is_portal_open,
  };
}

export function toApiExamAttempt(attempt: Partial<ExamAttempt>): ApiRecord {
  return {
    examId: attempt.exam_id,
    examinationId: attempt.examination_id,
    userId: attempt.user_id,
    score: attempt.score,
    passed: attempt.passed,
    answers: attempt.answers,
    status: attempt.status,
    gradedBy: attempt.graded_by,
    submittedAt: attempt.submitted_at,
  };
}

export function toApiExamination(exam: Partial<Examination>): ApiRecord {
  return {
    cohortId: exam.cohort_id,
    title: exam.title,
    competencyIds: exam.competency_ids,
    fellowIds: exam.fellow_ids,
    accessCode: exam.access_code,
    timeAllocatedMinutes: exam.time_allocated_minutes,
    isEnabled: exam.is_enabled,
    isPortalOpen: exam.is_portal_open,
    allowRetake: exam.allow_retake,
  };
}

export function toApiExaminationAttempt(attempt: Partial<ExaminationAttempt>): ApiRecord {
  return {
    examinationId: attempt.examination_id,
    userId: attempt.user_id,
    cohortId: attempt.cohort_id,
    title: attempt.title,
    score: attempt.score,
    passed: attempt.passed,
    answers: attempt.answers,
    writtenScores: attempt.written_scores,
    competencyResults: attempt.competency_results,
    competencySnapshots: attempt.competency_snapshots,
    draftState: attempt.draft_state,
    hasWritten: attempt.has_written,
    status: attempt.status,
    startedAt: attempt.started_at,
  };
}
