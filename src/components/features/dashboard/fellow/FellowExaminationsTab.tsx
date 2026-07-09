"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useFellowDashboard } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    Lock,
    CheckCircle2,
    GraduationCap,
    Clock,
    PlayCircle,
    Edit3,
    ChevronRight,
    ChevronLeft,
    ShieldAlert,
    Layers,
} from "lucide-react";
import {
    ExamService,
    Examination,
    ExaminationAttempt,
    ExaminationCompetencySnapshot,
    formatExaminationMarks,
} from "@/services/ExamService";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface FellowExaminationsTabProps {
    fellowId: string;
}

type Phase = "hub" | "running" | "result";

const shuffle = <T,>(arr: T[]): T[] => {
    const items = [...arr];
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
};

export default function FellowExaminationsTab({ fellowId }: FellowExaminationsTabProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: dashboardData, loading: dashboardLoading, refresh: refreshDashboard } = useFellowDashboard(fellowId);

    const [phase, setPhase] = useState<Phase>("hub");
    const [attempt, setAttempt] = useState<ExaminationAttempt | null>(null);
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    const [compIndex, setCompIndex] = useState(0);
    const [qIndex, setQIndex] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isStarting, setIsStarting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultAttempt, setResultAttempt] = useState<ExaminationAttempt | null>(null);
    const [wasForcedSubmit, setWasForcedSubmit] = useState(false);
    const [submittedAnsweredCount, setSubmittedAnsweredCount] = useState(0);
    const [submittedTotalQuestions, setSubmittedTotalQuestions] = useState(0);
    const [notice, setNotice] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

    const submissionGuardRef = useRef(false);
    const lastSavedRef = useRef<number>(0);

    const examinations: Examination[] = useMemo(
        () => (dashboardData?.examinations || []).filter((e: Examination) => e.is_enabled),
        [dashboardData]
    );
    const attemptsByExam: Record<string, ExaminationAttempt> = useMemo(() => {
        const map: Record<string, ExaminationAttempt> = {};
        (dashboardData?.examinationAttempts || []).forEach((a: ExaminationAttempt) => {
            map[a.examination_id] = a;
        });
        return map;
    }, [dashboardData]);

    const competencyTitleById = useMemo(() => {
        const entries = (dashboardData?.competencies || []).map((c: any) => [c.id, c.title] as const);
        return Object.fromEntries(entries) as Record<string, string>;
    }, [dashboardData]);

    const pushNotice = (type: "success" | "error" | "warning", message: string) => {
        setNotice({ type, message });
        window.setTimeout(() => setNotice((prev) => (prev?.message === message ? null : prev)), 3200);
    };

    /* ─── Live refs (avoid stale closures inside the timer) ─────────────── */
    const answersRef = useRef(answers);
    const compIndexRef = useRef(compIndex);
    const qIndexRef = useRef(qIndex);
    const remainingRef = useRef(remainingSeconds);
    const submitRef = useRef<(opts?: { forced?: boolean }) => void>(() => {});
    const autoSubmittedRef = useRef(false);
    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { compIndexRef.current = compIndex; }, [compIndex]);
    useEffect(() => { qIndexRef.current = qIndex; }, [qIndex]);
    useEffect(() => { remainingRef.current = remainingSeconds; }, [remainingSeconds]);

    /* ─── Autosave draft ────────────────────────────────────────────────── */
    const persistDraft = useCallback(
        async (
            attemptRef: ExaminationAttempt,
            nextAnswers: Record<string, string | number>,
            state: { current_competency_index: number; current_question_index: number; remaining_seconds: number }
        ) => {
            try {
                await ExamService.saveExaminationDraft(attemptRef.examination_id, fellowId, {
                    answers: nextAnswers,
                    draft_state: state,
                });
                lastSavedRef.current = Date.now();
            } catch (e) {
                console.error("Failed to autosave exam draft", e);
            }
        },
        [fellowId]
    );

    // Debounced autosave on answer / navigation change.
    // NOTE: intentionally NOT tied to `remainingSeconds` — otherwise the ticking
    // clock would reset the debounce every second and the draft would never save.
    useEffect(() => {
        if (phase !== "running" || !attempt) return;
        const handle = window.setTimeout(() => {
            void persistDraft(attempt, answers, {
                current_competency_index: compIndex,
                current_question_index: qIndex,
                remaining_seconds: remainingRef.current,
            });
        }, 700);
        return () => window.clearTimeout(handle);
    }, [answers, compIndex, qIndex, phase, attempt, persistDraft]);

    // Single countdown interval per running attempt (created once — not re-created every tick).
    useEffect(() => {
        if (phase !== "running" || !attempt) return;
        const timer = window.setInterval(() => {
            setRemainingSeconds((prev) => {
                const next = Math.max(prev - 1, 0);
                // Persist remaining time every ~15s without spamming Firestore.
                if (next > 0 && next % 15 === 0) {
                    void persistDraft(attempt, answersRef.current, {
                        current_competency_index: compIndexRef.current,
                        current_question_index: qIndexRef.current,
                        remaining_seconds: next,
                    });
                }
                return next;
            });
        }, 1000);
        return () => window.clearInterval(timer);
    }, [phase, attempt, persistDraft]);

    // Auto-submit exactly once when the clock reaches zero.
    useEffect(() => {
        if (phase !== "running" || !attempt) return;
        if (remainingSeconds > 0) return;
        if (autoSubmittedRef.current) return;
        autoSubmittedRef.current = true;
        console.log("[Exam Submit] Time expired → auto-submitting via submit hook.");
        submitRef.current?.({ forced: true });
    }, [phase, attempt, remainingSeconds]);

    // Warn on accidental close / navigation while an exam is running
    useEffect(() => {
        if (phase !== "running") return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [phase]);

    /* ─── Start ─────────────────────────────────────────────────────────── */
    const enterRunner = (att: ExaminationAttempt) => {
        autoSubmittedRef.current = false;
        submissionGuardRef.current = false;
        setAttempt(att);
        setAnswers(att.answers || {});
        setCompIndex(0);
        setQIndex(0);
        setRemainingSeconds(
            (examinations.find((e) => e.id === att.examination_id)?.time_allocated_minutes || 60) * 60
        );
        setResultAttempt(null);
        setWasForcedSubmit(false);
        setSubmittedAnsweredCount(0);
        setSubmittedTotalQuestions(0);
        setPhase("running");
    };

    const handleStart = async (examination: Examination, skipCode = false) => {
        // Verify access code
        let verified = skipCode;
        if (!verified && typeof window !== "undefined") {
            verified = window.sessionStorage.getItem(`verified_exam_${examination.id}`) === "1";
        }
        if (!verified) {
            const input = window.prompt("Enter the examination access code to start:", "");
            if (input === null) return;
            if (input.trim().toUpperCase() !== String(examination.access_code || "").trim().toUpperCase()) {
                pushNotice("error", "Invalid examination access code.");
                return;
            }
            if (typeof window !== "undefined") {
                window.sessionStorage.setItem(`verified_exam_${examination.id}`, "1");
            }
        }

        setIsStarting(true);
        try {
            const banks = await Promise.all(
                (examination.competency_ids || []).map((id) =>
                    ExamService.getQuestionBank(examination.cohort_id, id)
                )
            );
            const snapshots: ExaminationCompetencySnapshot[] = (examination.competency_ids || [])
                .map((id, i) => ({
                    competency_id: id,
                    competency_title: competencyTitleById[id] || "Competency",
                    questions: shuffle(banks[i]?.questions || []),
                }))
                .filter((s) => s.questions.length > 0);

            if (!snapshots.length) {
                pushNotice("warning", "This examination has no questions yet.");
                return;
            }

            const created = await ExamService.startExaminationAttempt({
                examination,
                userId: fellowId,
                snapshots,
            });
            if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(`submitted_exam_${examination.id}`);
            }
            enterRunner(created);

            const params = new URLSearchParams(searchParams.toString());
            params.set("tab", "exams");
            params.delete("startExam");
            router.replace(`${pathname}?${params.toString()}`);
        } catch (e) {
            console.error("Failed to start examination", e);
            pushNotice("error", "Could not start examination.");
        } finally {
            setIsStarting(false);
        }
    };

    // Deep link from the forced-exam gate: ?startExam=<id>
    useEffect(() => {
        const startId = searchParams.get("startExam");
        if (!startId || phase !== "hub" || !examinations.length) return;
        const target = examinations.find((e) => e.id === startId);
        if (target) void handleStart(target, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, examinations, phase]);

    /* ─── Question sequencing ───────────────────────────────────────────── */
    const snapshots = attempt?.competency_snapshots || [];
    const currentSnapshot = snapshots[compIndex];
    const currentQuestion = currentSnapshot?.questions[qIndex];
    const totalQuestions = snapshots.reduce((sum, s) => sum + s.questions.length, 0);
    const answeredCount = useMemo(
        () => snapshots.reduce((sum, s) => sum + s.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length, 0),
        [snapshots, answers]
    );
    const isVeryLastQuestion =
        compIndex === snapshots.length - 1 && qIndex === (currentSnapshot?.questions.length || 0) - 1;
    const isVeryFirstQuestion = compIndex === 0 && qIndex === 0;

    const goNext = () => {
        if (!currentSnapshot) return;
        if (qIndex < currentSnapshot.questions.length - 1) {
            setQIndex(qIndex + 1);
        } else if (compIndex < snapshots.length - 1) {
            setCompIndex(compIndex + 1);
            setQIndex(0);
        }
    };
    const goPrev = () => {
        if (qIndex > 0) {
            setQIndex(qIndex - 1);
        } else if (compIndex > 0) {
            const prevComp = compIndex - 1;
            setCompIndex(prevComp);
            setQIndex(snapshots[prevComp].questions.length - 1);
        }
    };
    const goTo = (ci: number, qi: number) => {
        setCompIndex(ci);
        setQIndex(qi);
    };

    /* ─── Submit ────────────────────────────────────────────────────────── */
    const handleSubmit = async ({ forced = false }: { forced?: boolean } = {}) => {
        console.log("[Exam Submit] handleSubmit called", {
            forced,
            hasAttempt: !!attempt,
            examinationId: attempt?.examination_id,
            fellowId,
            answerCount: Object.keys(answers).length,
            answers,
            remainingSeconds,
        });

        if (!attempt) {
            console.warn("[Exam Submit] Aborted: no active attempt in state.");
            return;
        }
        // Manual submissions are only accepted after 60% of the allocated time is used.
        if (!forced) {
            const total = (examinations.find((e) => e.id === attempt.examination_id)?.time_allocated_minutes || 60) * 60;
            const elapsed = total - remainingSeconds;
            console.log("[Exam Submit] 60% time gate check", {
                totalSeconds: total,
                elapsedSeconds: elapsed,
                requiredSeconds: total * 0.6,
                passesGate: total <= 0 || elapsed >= total * 0.6,
            });
            if (total > 0 && total - remainingSeconds < total * 0.6) {
                const unlockIn = Math.ceil(total * 0.6 - (total - remainingSeconds));
                const mm = String(Math.floor(unlockIn / 60)).padStart(2, "0");
                const ss = String(unlockIn % 60).padStart(2, "0");
                console.warn(`[Exam Submit] Blocked by 60% time gate. Unlocks in ${mm}:${ss}.`);
                pushNotice("warning", `You can submit only after 60% of the time is used. Unlocks in ${mm}:${ss}.`);
                return;
            }
        }
        if (submissionGuardRef.current) {
            console.warn("[Exam Submit] Aborted: submission already in progress (guard).");
            return;
        }
        submissionGuardRef.current = true;
        setIsSubmitting(true);
        try {
            console.log("[Exam Submit] Calling ExamService.submitExaminationAttempt...", {
                examinationId: attempt.examination_id,
                fellowId,
            });
            const submitted = await ExamService.submitExaminationAttempt(attempt.examination_id, fellowId, answers);
            console.log("[Exam Submit] SUCCESS — attempt saved", {
                status: submitted.status,
                score: submitted.score,
                passed: submitted.passed,
                competencyResults: submitted.competency_results,
            });
            if (typeof window !== "undefined") {
                // Mark as submitted so the layout's forced-exam gate won't re-trigger,
                // and clear the verification so a future retake asks for the code again.
                window.sessionStorage.setItem(`submitted_exam_${attempt.examination_id}`, "1");
                window.sessionStorage.removeItem(`verified_exam_${attempt.examination_id}`);
                window.dispatchEvent(new Event("exam-submitted"));
            }
            setResultAttempt(submitted);
            setWasForcedSubmit(forced);
            setSubmittedAnsweredCount(
                (submitted.competency_snapshots || []).reduce(
                    (sum, s) =>
                        sum +
                        s.questions.filter(
                            (q) => answers[q.id] !== undefined && answers[q.id] !== ""
                        ).length,
                    0
                )
            );
            setSubmittedTotalQuestions(
                (submitted.competency_snapshots || []).reduce((sum, s) => sum + s.questions.length, 0)
            );
            setPhase("result");
            console.log("[Exam Submit] Refreshing dashboard data...");
            await refreshDashboard();
            console.log("[Exam Submit] Dashboard refreshed. Flow complete.");
        } catch (e) {
            console.error("[Exam Submit] FAILED to submit examination", e);
            const msg = e instanceof Error ? e.message : String(e);
            pushNotice("error", `Submit failed: ${msg}`);
        } finally {
            setIsSubmitting(false);
            submissionGuardRef.current = false;
            console.log("[Exam Submit] handleSubmit finished (guard released).");
        }
    };

    // Always keep the ref pointing at the latest submit handler so the countdown's
    // auto-submit (on timeout) invokes the current closure with up-to-date answers.
    submitRef.current = handleSubmit;

    const noticeBanner = notice ? (
        <div className="fixed top-6 right-6 z-[320]">
            <Card
                className={cn(
                    "rounded-xl border shadow-xl min-w-[300px]",
                    notice.type === "success" && "border-emerald-200 bg-emerald-50",
                    notice.type === "error" && "border-red-200 bg-red-50",
                    notice.type === "warning" && "border-amber-200 bg-amber-50"
                )}
            >
                <CardContent className="py-3 px-4 text-sm font-medium text-[#1B4332]">{notice.message}</CardContent>
            </Card>
        </div>
    ) : null;

    if (dashboardLoading) {
        return (
            <>
                {noticeBanner}
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="size-12 text-primary animate-spin" />
                </div>
            </>
        );
    }

    /* ─── RESULT SCREEN (full-screen overlay) ───────────────────────────── */
    if (phase === "result" && resultAttempt) {
        return (
            <>
                {noticeBanner}
                <div className="fixed inset-0 z-[300] bg-[#FDFCF6] overflow-y-auto">
                    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8 animate-in zoom-in duration-500">
                        <Card className="rounded-[3rem] border-2 border-[#E8E4D8] overflow-hidden text-center">
                            <CardHeader className="py-12 bg-[#1B4332]">
                                <div className="size-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-6 text-white border-4 border-white/20">
                                    {wasForcedSubmit ? <Clock size={48} /> : <CheckCircle2 size={48} />}
                                </div>
                                <h2 className="text-4xl font-serif font-black text-white italic">
                                    {wasForcedSubmit ? "Time's Up" : "Submitted Successfully"}
                                </h2>
                                <p className="text-white/80 font-medium">
                                    {wasForcedSubmit ? "Your examination was submitted automatically" : "Your examination has been received"}
                                </p>
                            </CardHeader>
                            <CardContent className="py-10 px-8 space-y-8">
                                {wasForcedSubmit && (
                                    <div className="rounded-2xl border border-[#E8E4D8] bg-white p-6">
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#8B9B7E] mb-2">
                                            Questions Answered
                                        </p>
                                        <div className="text-5xl font-serif font-black text-[#1B4332]">
                                            {submittedAnsweredCount}/{submittedTotalQuestions}
                                        </div>
                                    </div>
                                )}

                                <p className="text-[#1B4332]/70 italic font-serif leading-relaxed">
                                    {wasForcedSubmit
                                        ? "Your answers have been saved. Your exam result will be visible soon after approval by the academic team."
                                        : "Thank you for completing your examination. Your result will be displayed after approval by the academic team."}
                                </p>

                                <Button
                                    onClick={() => {
                                        setPhase("hub");
                                        setAttempt(null);
                                        setResultAttempt(null);
                                        setWasForcedSubmit(false);
                                    }}
                                    className="w-full h-14 rounded-2xl bg-[#1B4332] text-white font-bold text-lg shadow-xl shadow-primary/20"
                                >
                                    Back to Examinations
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </>
        );
    }

    /* ─── RUNNER (full-screen locked overlay, sidebar hidden) ───────────── */
    if (phase === "running" && attempt && currentSnapshot && currentQuestion) {
        const totalSeconds = (examinations.find((e) => e.id === attempt.examination_id)?.time_allocated_minutes || 60) * 60;
        const timeRatio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
        const timeColor = timeRatio > 0.5 ? "text-emerald-600" : timeRatio > 0.25 ? "text-amber-500" : "text-red-600";
        const formattedTime = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
        const compRemaining = currentSnapshot.questions.length - (qIndex + 1);
        const elapsedSeconds = totalSeconds - remainingSeconds;
        const canSubmit = totalSeconds > 0 ? elapsedSeconds >= totalSeconds * 0.6 : true;
        const unlockInSeconds = Math.max(0, Math.ceil(totalSeconds * 0.6 - elapsedSeconds));
        const unlockLabel = `${String(Math.floor(unlockInSeconds / 60)).padStart(2, "0")}:${String(unlockInSeconds % 60).padStart(2, "0")}`;
        const isAnswered = (q: { id: string }) =>
            answers[q.id] !== undefined && answers[q.id] !== "";

        const submitButton = (className: string) => (
            <Button
                disabled={!canSubmit || isSubmitting}
                onClick={() => handleSubmit()}
                className={cn(
                    "font-bold shadow-lg",
                    canSubmit ? "bg-[#BC4B51] hover:bg-[#A33D42] text-white" : "bg-[#E8E4D8] text-[#8B9B7E]",
                    className
                )}
            >
                {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                ) : canSubmit ? (
                    <GraduationCap className="size-4 mr-2" />
                ) : (
                    <Lock className="size-4 mr-2" />
                )}
                {canSubmit ? "Submit Examination" : `Submit unlocks in ${unlockLabel}`}
            </Button>
        );

        return (
            <>
                {noticeBanner}
                <div className="fixed inset-0 z-[300] bg-[#FDFCF6] flex flex-col">
                    {/* Locked exam header (replaces sidebar) */}
                    <div className="border-b border-[#E8E4D8] bg-white/70 backdrop-blur-md">
                        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="size-11 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center shrink-0">
                                    <ShieldAlert className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Examination in progress</p>
                                    <h2 className="text-lg font-serif font-bold text-[#1B4332] truncate">{attempt.title}</h2>
                                </div>
                            </div>
                            <div className={cn("text-right font-black tracking-wider", timeColor)}>
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Time Remaining</p>
                                <p className="text-2xl tabular-nums">{formattedTime}</p>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-[#E8E4D8]">
                            <div
                                className={cn(
                                    "h-full transition-all duration-500",
                                    timeRatio > 0.5 ? "bg-emerald-500" : timeRatio > 0.25 ? "bg-amber-500" : "bg-red-600"
                                )}
                                style={{ width: `${Math.max(0, Math.min(100, timeRatio * 100))}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* LEFT: question navigator */}
                        <aside className="hidden md:flex w-72 flex-col border-r border-[#E8E4D8] bg-white/50">
                            <div className="p-5 border-b border-[#E8E4D8] space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-widest text-[#1B4332]">Questions</p>
                                    <span className="text-xs font-bold text-primary">{answeredCount}/{totalQuestions}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <span className="size-3 rounded bg-blue-500" /> Answered
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="size-3 rounded bg-stone-200" /> Unanswered
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                                {snapshots.map((snap, ci) => {
                                    const offset = snapshots
                                        .slice(0, ci)
                                        .reduce((sum, s) => sum + s.questions.length, 0);
                                    return (
                                        <div key={snap.competency_id} className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 truncate">
                                                {ci + 1}. {snap.competency_title}
                                            </p>
                                            <div className="grid grid-cols-5 gap-2">
                                                {snap.questions.map((q, qi) => {
                                                    const num = offset + qi + 1;
                                                    const answered = isAnswered(q);
                                                    const current = ci === compIndex && qi === qIndex;
                                                    return (
                                                        <button
                                                            key={q.id}
                                                            onClick={() => goTo(ci, qi)}
                                                            title={`Question ${num}`}
                                                            className={cn(
                                                                "size-9 rounded-lg text-xs font-black border-2 flex items-center justify-center transition-all",
                                                                answered
                                                                    ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                                                                    : "bg-stone-100 text-stone-500 border-stone-200 hover:border-primary/40",
                                                                current && "ring-2 ring-primary ring-offset-1 ring-offset-[#FDFCF6]"
                                                            )}
                                                        >
                                                            {num}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-4 border-t border-[#E8E4D8] space-y-2">
                                {submitButton("w-full h-12 rounded-2xl")}
                                {!canSubmit && (
                                    <p className="text-[10px] text-center text-muted-foreground font-medium">
                                        You may submit after 60% of the time is used.
                                    </p>
                                )}
                            </div>
                        </aside>

                        {/* RIGHT: current question */}
                        <main className="flex-1 overflow-y-auto">
                            <div className="max-w-3xl mx-auto px-6 py-6">
                                {/* Context bar */}
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-4">
                                    <div className="flex items-center gap-2 text-[#1B4332] font-bold">
                                        <Layers className="size-4 text-primary" />
                                        <span>
                                            Competency {compIndex + 1} of {snapshots.length}: {currentSnapshot.competency_title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground font-semibold">
                                        <span>Question {qIndex + 1} / {currentSnapshot.questions.length}</span>
                                        <span>{compRemaining} left here</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mb-6">
                                    {snapshots.map((s, i) => (
                                        <div
                                            key={s.competency_id}
                                            className={cn(
                                                "h-1.5 flex-1 rounded-full transition-all",
                                                i < compIndex ? "bg-emerald-500" : i === compIndex ? "bg-primary" : "bg-[#E8E4D8]"
                                            )}
                                        />
                                    ))}
                                </div>

                                <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden">
                                    <CardHeader className="bg-muted/30 py-8 px-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                                                {currentQuestion.type === "multiple_choice" ? "Multiple Choice" : "Written Response"}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-serif italic text-foreground leading-relaxed">{currentQuestion.text}</h3>
                                    </CardHeader>
                                    <CardContent className="p-10 space-y-4">
                                        {currentQuestion.type === "multiple_choice" ? (
                                            <div className="space-y-4">
                                                {currentQuestion.options.map((option, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setAnswers({ ...answers, [currentQuestion.id]: idx })}
                                                        className={cn(
                                                            "w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group",
                                                            answers[currentQuestion.id] === idx
                                                                ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                                                                : "border-[#E8E4D8] hover:border-primary/40 hover:bg-[#FDFCF6]"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={cn(
                                                                    "size-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-colors",
                                                                    answers[currentQuestion.id] === idx
                                                                        ? "bg-primary text-white border-primary"
                                                                        : "border-[#E8E4D8] text-[#8B9B7E] group-hover:border-primary/40 group-hover:text-primary"
                                                                )}
                                                            >
                                                                {String.fromCharCode(65 + idx)}
                                                            </div>
                                                            <span className={cn("font-medium", answers[currentQuestion.id] === idx ? "text-[#1B4332]" : "text-foreground")}>
                                                                {option}
                                                            </span>
                                                        </div>
                                                        {answers[currentQuestion.id] === idx && <CheckCircle2 className="size-5 text-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-xs text-[#1B4332]/60 font-medium italic">
                                                    Provide a detailed response. Your answer will be reviewed by the academic team.
                                                </p>
                                                <Textarea
                                                    value={(answers[currentQuestion.id] as string) || ""}
                                                    onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                                                    placeholder="Type your answer here..."
                                                    className="min-h-[220px] rounded-[2rem] border-2 border-[#E8E4D8] p-8 text-lg font-serif italic focus-visible:ring-primary/20"
                                                />
                                                <div className="flex items-center justify-end gap-2 text-[#8B9B7E]">
                                                    <Edit3 className="size-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Essay Part</span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <div className="flex justify-between items-center gap-3 px-2 py-6">
                                    <Button
                                        variant="ghost"
                                        disabled={isVeryFirstQuestion}
                                        onClick={goPrev}
                                        className="rounded-xl h-12"
                                    >
                                        <ChevronLeft className="size-4 mr-1" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        {/* Mobile submit (left panel is hidden on small screens) */}
                                        <div className="md:hidden">{submitButton("h-12 px-6 rounded-2xl")}</div>
                                        {!isVeryLastQuestion && (
                                            <Button
                                                onClick={goNext}
                                                className="rounded-2xl h-12 px-10 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold shadow-lg"
                                            >
                                                Next
                                                <ChevronRight className="size-4 ml-2" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground pb-8">
                                    Your answers save automatically. Do not close this window until you submit.
                                </p>
                            </div>
                        </main>
                    </div>
                </div>
            </>
        );
    }

    /* ─── HUB ───────────────────────────────────────────────────────────── */
    return (
        <>
            {noticeBanner}
            <div className="space-y-10 animate-in fade-in duration-500">
                <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-primary font-black mb-2">Final Evaluation</p>
                    <h1 className="text-5xl font-serif font-bold text-[#1B4332]">Examinations</h1>
                    <p className="text-[#1B4332]/60 mt-4 max-w-xl italic font-serif">
                        Examinations assigned to you appear here. Once you begin, you cannot leave until you submit.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {examinations.map((exam) => {
                        const att = attemptsByExam[exam.id];
                        const isPortalOpen = exam.is_portal_open;
                        const isDraft = att?.status === "draft";
                        const isSubmitted = att?.status === "submitted";
                        const isGraded = att?.status === "graded";
                        const lockedBySubmission = (isSubmitted || isGraded) && !exam.allow_retake;
                        const startable = isPortalOpen && !lockedBySubmission;

                        let statusLabel = "Ready";
                        let statusTone = "text-blue-600";
                        if (isDraft) { statusLabel = "In Progress"; statusTone = "text-amber-600"; }
                        else if (isSubmitted) { statusLabel = "Submitted"; statusTone = "text-blue-600"; }
                        else if (isGraded) { statusLabel = att?.passed ? "Passed" : "Not Passed"; statusTone = att?.passed ? "text-emerald-600" : "text-red-600"; }
                        else if (!isPortalOpen) { statusLabel = "Portal Closed"; statusTone = "text-stone-500"; }

                        const totalMarksEarned = (att?.competency_results || []).reduce(
                            (sum, r) => sum + (r.marks_earned ?? r.mcq_correct),
                            0
                        );
                        const totalMarks = (att?.competency_results || []).reduce(
                            (sum, r) => sum + (r.marks_total ?? r.mcq_total + r.written_total),
                            0
                        );

                        return (
                            <Card
                                key={exam.id}
                                className={cn(
                                    "rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden relative",
                                    isGraded && att?.passed
                                        ? "bg-[#1B4332]/5 border-[#1B4332]/20"
                                        : isSubmitted
                                            ? "bg-white border-blue-100"
                                            : startable
                                                ? "bg-white border-[#E8E4D8] hover:border-primary/40 hover:shadow-2xl"
                                                : "bg-stone-50 border-stone-200"
                                )}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className={cn(
                                            "size-12 rounded-2xl flex items-center justify-center mb-4",
                                            isGraded && att?.passed ? "bg-emerald-500 text-white"
                                                : isSubmitted ? "bg-blue-500 text-white"
                                                    : "bg-primary/10 text-primary"
                                        )}>
                                            {isSubmitted ? <CheckCircle2 size={24} /> : <GraduationCap size={24} />}
                                        </div>
                                        <Badge
                                            className={cn(
                                                "border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase",
                                                isDraft ? "bg-amber-500/10 text-amber-700"
                                                    : isSubmitted ? "bg-blue-500/10 text-blue-700"
                                                        : isGraded ? (att?.passed ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700")
                                                            : isPortalOpen ? "bg-blue-500/10 text-blue-700" : "bg-stone-200 text-stone-500"
                                            )}
                                        >
                                            {statusLabel}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl font-serif">{exam.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 text-xs">
                                        {(exam.competency_ids || []).map((id) => competencyTitleById[id] || "Competency").join(", ")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-5">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#8B9B7E]">
                                        <span className="flex items-center gap-1"><Layers className="size-3" /> {(exam.competency_ids || []).length} Competencies</span>
                                        <span className="flex items-center gap-1"><Clock className="size-3" /> {exam.time_allocated_minutes}m</span>
                                    </div>

                                    {!isSubmitted && (
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-[#8B9B7E]">Status</span>
                                            <span className={statusTone}>{statusLabel}</span>
                                        </div>
                                    )}

                                    {isSubmitted && (
                                        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 text-center">
                                            <p className="text-xs text-[#1B4332]/80 leading-relaxed">
                                                Examination ended — Thank you, you have submitted your answers. Your result will appear here after approval.
                                            </p>
                                        </div>
                                    )}

                                    {isGraded && att?.competency_results && att.competency_results.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#8B9B7E]">
                                                <span>Overall (1 mark per question)</span>
                                                <span className="text-[#1B4332]">
                                                    {formatExaminationMarks(totalMarksEarned, totalMarks)}
                                                </span>
                                            </div>
                                            {att.competency_results.map((r) => {
                                                const earned = r.marks_earned ?? r.mcq_correct;
                                                const total = r.marks_total ?? r.mcq_total + r.written_total;
                                                return (
                                                    <div
                                                        key={r.competency_id}
                                                        className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-[#E8E4D8]"
                                                    >
                                                        <p className="text-xs text-[#1B4332] font-bold truncate pr-2">
                                                            {r.competency_title}
                                                        </p>
                                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0 font-black">
                                                            {formatExaminationMarks(earned, total)}
                                                        </Badge>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <Button
                                        disabled={!startable || isStarting}
                                        onClick={() => handleStart(exam)}
                                        className={cn(
                                            "w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2",
                                            startable ? "bg-[#1B4332] hover:bg-[#2D6A4F] text-white shadow-lg" : "bg-[#E8E4D8] text-[#8B9B7E]"
                                        )}
                                    >
                                        {isStarting ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : !startable ? (
                                            <Lock size={16} />
                                        ) : (
                                            <PlayCircle size={16} />
                                        )}
                                        {lockedBySubmission ? "Locked"
                                            : !isPortalOpen ? "Portal Closed"
                                                : "Begin Examination"}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {examinations.length === 0 && (
                        <div className="col-span-full py-20 text-center space-y-4 bg-white/40 backdrop-blur-md rounded-[3.5rem] border-2 border-dashed border-[#E8E4D8]">
                            <div className="size-16 rounded-3xl bg-primary/5 text-primary/20 flex items-center justify-center mx-auto">
                                <Clock size={32} />
                            </div>
                            <h3 className="text-2xl font-serif font-black text-[#1B4332]/40 italic">No Examinations Assigned</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                You have no enabled examinations right now. Check back when your administrators publish one.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
