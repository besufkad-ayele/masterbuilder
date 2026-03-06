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
    orderBy
} from 'firebase/firestore';

export interface ExamQuestion {
    id: string;
    text: string;
    options: string[];
    correct_option_index: number;
}

export interface Exam {
    id: string;
    competency_id: string;
    cohort_id: string;
    title: string;
    questions: ExamQuestion[];
    created_at: string;
    updated_at: string;
}

export interface ExamAttempt {
    id: string;
    exam_id: string;
    user_id: string;
    score: number;
    passed: boolean;
    submitted_at: string;
}

export const ExamService = {
    async getExamsByCohortAndCompetency(cohortId: string, competencyId: string): Promise<Exam[]> {
        const q = query(
            collection(db, 'exams'),
            where('cohort_id', '==', cohortId),
            where('competency_id', '==', competencyId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
    },

    async getExamsByCohort(cohortId: string): Promise<Exam[]> {
        const q = query(
            collection(db, 'exams'),
            where('cohort_id', '==', cohortId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
    },

    async getExamById(id: string): Promise<Exam | null> {
        const d = await getDoc(doc(db, 'exams', id));
        return d.exists() ? { id: d.id, ...d.data() } as Exam : null;
    },

    async createOrUpdateExam(exam: Partial<Exam>): Promise<string> {
        const examRef = exam.id ? doc(db, 'exams', exam.id) : doc(collection(db, 'exams'));
        const now = new Date().toISOString();
        const data = {
            ...exam,
            id: examRef.id,
            updated_at: now,
            created_at: exam.created_at || now
        };
        await setDoc(examRef, data);
        return examRef.id;
    },

    async deleteExam(id: string): Promise<void> {
        await deleteDoc(doc(db, 'exams', id));
    },

    async submitExamAttempt(attempt: Omit<ExamAttempt, 'id' | 'submitted_at'>): Promise<string> {
        const attemptRef = doc(collection(db, 'exam_attempts'));
        const now = new Date().toISOString();
        await setDoc(attemptRef, {
            ...attempt,
            id: attemptRef.id,
            submitted_at: now
        });
        return attemptRef.id;
    },

    async getAttemptsByUser(userId: string): Promise<ExamAttempt[]> {
        const q = query(collection(db, 'exam_attempts'), where('user_id', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamAttempt));
    }
};
