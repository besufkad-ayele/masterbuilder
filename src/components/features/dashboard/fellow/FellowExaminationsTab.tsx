"use client";

import { useState, useEffect, useMemo } from "react";
import { useFellowDashboard } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    FileText,
    Lock,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    Clock,
    PlayCircle,
    Award
} from "lucide-react";
import { ExamService, Exam, ExamAttempt } from "@/services/ExamService";
import { cn } from "@/lib/utils";

interface FellowExaminationsTabProps {
    fellowId: string;
}

export default function FellowExaminationsTab({ fellowId }: FellowExaminationsTabProps) {
    const { data: dashboardData, loading: dashboardLoading } = useFellowDashboard(fellowId);
    const [exams, setExams] = useState<Exam[]>([]);
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [examResult, setExamResult] = useState<{ score: number, passed: boolean } | null>(null);

    // Use centralized dashboard data instead of fetching
    useEffect(() => {
        if (dashboardData?.exams) {
            setExams(dashboardData.exams);
        }
        if (dashboardData?.examAttempts) {
            setAttempts(dashboardData.examAttempts);
        }
        if (dashboardData) {
            setLoadingExams(false);
        }
    }, [dashboardData]);

    // Calculate competency status
    const competencyStatusMap = useMemo(() => {
        if (!dashboardData) return {};

        const statusMap: Record<string, { unlocked: boolean, reason: string, completed: boolean }> = {};

        dashboardData.competencies.forEach(comp => {
            // Find all BIs for this competency using composite ID format: ${compId}_${biCode}
            const compositePrefix = `${comp.id}_`;
            const biIds = (dashboardData.progress || [])
                .filter(p => p.behavioral_indicator_id.startsWith(compositePrefix))
                .map(p => p.behavioral_indicator_id)
                .filter((v, i, a) => a.indexOf(v) === i);

            // Check if every BI has at least one submitted/approved portfolio
            const hasRequiredPortfolios = biIds.length > 0 && biIds.every(biId => {
                const biPortfolios = dashboardData.portfolios.filter(p => p.behavioral_indicator_id === biId);
                return biPortfolios.some(p => p.status === 'submitted' || p.status === 'approved');
            });
            // Fallback to direct competency_id match on portfolios
            const compPortfolios = dashboardData.portfolios.filter(p => p.competency_id === comp.id);
            const isPortfolioSubmitted = hasRequiredPortfolios || compPortfolios.some(p => p.status === 'submitted' || p.status === 'approved');

            const hasAttempt = attempts.find(a => exams.find(e => e.competency_id === comp.id)?.id === a.exam_id);

            statusMap[comp.id] = {
                unlocked: isPortfolioSubmitted,
                completed: !!hasAttempt?.passed,
                reason: isPortfolioSubmitted ? "Ready for Final Assessment" : "Complete 'Do' Phase Portfolios to unlock examination"
            };
        });

        return statusMap;
    }, [dashboardData, attempts, exams]);

    const handleStartExam = (exam: Exam) => {
        setSelectedExam(exam);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setExamResult(null);
    };

    const handleSubmitExam = async () => {
        if (!selectedExam) return;

        setIsSubmitting(true);
        try {
            let correctCount = 0;
            selectedExam.questions.forEach(q => {
                if (userAnswers[q.id] === q.correct_option_index) {
                    correctCount++;
                }
            });

            const score = Math.round((correctCount / selectedExam.questions.length) * 100);
            const passed = score >= 75;

            await ExamService.submitExamAttempt({
                exam_id: selectedExam.id,
                user_id: fellowId,
                score,
                passed
            });

            setExamResult({ score, passed });

            // Refresh attempts
            const updatedAttempts = await ExamService.getAttemptsByUser(fellowId);
            setAttempts(updatedAttempts);
        } catch (error) {
            console.error("Error submitting exam:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (dashboardLoading || loadingExams) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="size-12 text-primary animate-spin" />
            </div>
        );
    }

    if (selectedExam) {
        const question = selectedExam.questions[currentQuestionIndex];
        const isLastQuestion = currentQuestionIndex === selectedExam.questions.length - 1;

        if (examResult) {
            return (
                <div className="max-w-xl mx-auto space-y-8 py-10 animate-in zoom-in duration-500">
                    <Card className="rounded-[3.5rem] border-2 border-[#E8E4D8] overflow-hidden text-center">
                        <CardHeader className={cn(
                            "py-12",
                            examResult.passed ? "bg-emerald-500" : "bg-amber-500"
                        )}>
                            <div className="size-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-6 text-white border-4 border-white/20">
                                {examResult.passed ? <Award size={48} /> : <AlertCircle size={48} />}
                            </div>
                            <h2 className="text-4xl font-serif font-black text-white italic">{examResult.passed ? "Success!" : "Keep Pushing"}</h2>
                            <p className="text-white/80 font-medium">Competency Mastery Assessment Result</p>
                        </CardHeader>
                        <CardContent className="py-12 px-10 space-y-8">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#8B9B7E] mb-2">Detailed Score</p>
                                <div className="text-7xl font-serif font-black text-[#1B4332]">{examResult.score}%</div>
                                <div className="mt-4 flex justify-center gap-1.5">
                                    {[...Array(10)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-1.5 w-6 rounded-full",
                                                (i + 1) * 10 <= examResult.score
                                                    ? (examResult.passed ? "bg-emerald-500" : "bg-amber-500")
                                                    : "bg-[#E8E4D8]"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            <p className="text-[#1B4332]/60 italic font-serif leading-relaxed">
                                {examResult.passed
                                    ? "Congratulations! You have demonstrated the required mastery level for this competency. Your credentials have been updated."
                                    : "You haven't reached the 75% threshold yet. Take some time to review the modules and your portfolio feedback before trying again."}
                            </p>

                            <Button
                                onClick={() => setSelectedExam(null)}
                                className="w-full h-14 rounded-2xl bg-[#1B4332] text-white font-bold text-lg shadow-xl shadow-primary/20"
                            >
                                Back to Examinations Hub
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return (
            <div className="max-w-3xl mx-auto space-y-8 py-6 animate-in fade-in duration-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-serif font-extrabold text-[#1B4332]">{selectedExam.title}</h2>
                        <p className="text-xs font-black uppercase tracking-widest text-primary/60">Question {currentQuestionIndex + 1} of {selectedExam.questions.length}</p>
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedExam(null)} className="rounded-xl text-destructive hover:bg-destructive/10">Exit Exam</Button>
                </div>

                <div className="h-2 w-full bg-[#E8E4D8] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${((currentQuestionIndex + 1) / selectedExam.questions.length) * 100}%` }}
                    />
                </div>

                <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden">
                    <CardHeader className="bg-muted/30 py-8 px-10">
                        <h3 className="text-2xl font-serif italic text-foreground leading-relaxed">{question.text}</h3>
                    </CardHeader>
                    <CardContent className="p-10 space-y-4">
                        {question.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => setUserAnswers({ ...userAnswers, [question.id]: idx })}
                                className={cn(
                                    "w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group",
                                    userAnswers[question.id] === idx
                                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                                        : "border-[#E8E4D8] hover:border-primary/40 hover:bg-[#FDFCF6]"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "size-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-colors",
                                        userAnswers[question.id] === idx ? "bg-primary text-white border-primary" : "border-[#E8E4D8] text-[#8B9B7E] group-hover:border-primary/40 group-hover:text-primary"
                                    )}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className={cn(
                                        "font-medium",
                                        userAnswers[question.id] === idx ? "text-[#1B4332]" : "text-foreground"
                                    )}>{option}</span>
                                </div>
                                {userAnswers[question.id] === idx && <CheckCircle2 className="size-5 text-primary" />}
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-between items-center px-2">
                    <Button
                        variant="ghost"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        className="rounded-xl h-12"
                    >
                        Previous
                    </Button>
                    {isLastQuestion ? (
                        <Button
                            disabled={Object.keys(userAnswers).length < selectedExam.questions.length || isSubmitting}
                            onClick={handleSubmitExam}
                            className="rounded-2xl h-12 px-10 bg-[#BC4B51] hover:bg-[#A33D42] text-white font-bold shadow-lg"
                        >
                            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <GraduationCap className="size-4 mr-2" />}
                            Finish Mastery Assessment
                        </Button>
                    ) : (
                        <Button
                            disabled={userAnswers[question.id] === undefined}
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="rounded-2xl h-12 px-10 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold shadow-lg"
                        >
                            Next Question
                            <ChevronRight className="size-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="relative">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-primary font-black mb-2">Final Evaluation</p>
                        <h1 className="text-5xl font-serif font-bold text-[#1B4332]">Examinations</h1>
                        <p className="text-[#1B4332]/60 mt-4 max-w-xl italic font-serif">
                            Verify your mastery. Examinations are unlocked once your STAR portfolios are submitted for review.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {dashboardData?.competencies.map(comp => {
                    const status = competencyStatusMap[comp.id];
                    const exam = exams.find(e => e.competency_id === comp.id);
                    const attempt = attempts.find(a => a.exam_id === exam?.id);

                    // User requirement: "the do portfolio is not submitted yet not to be visible"
                    if (!status?.unlocked && !status?.completed) return null;

                    // If exam doesn't exist for this competency yet, handle it
                    if (!exam && !status?.completed) return null;

                    return (
                        <Card
                            key={comp.id}
                            className={cn(
                                "rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden relative group",
                                status?.completed
                                    ? "bg-[#1B4332]/5 border-[#1B4332]/20"
                                    : status?.unlocked
                                        ? "bg-white border-[#E8E4D8] hover:border-primary/40 hover:shadow-2xl"
                                        : "bg-stone-50 border-stone-200 opacity-80"
                            )}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className={cn(
                                        "size-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                                        status?.completed ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"
                                    )}>
                                        <GraduationCap size={24} />
                                    </div>
                                    {status?.completed ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-700 border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase">Mastered</Badge>
                                    ) : status?.unlocked ? (
                                        <Badge className="bg-blue-500/10 text-blue-700 border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase">Unlocked</Badge>
                                    ) : (
                                        <Badge className="bg-stone-200 text-stone-500 border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase">Locked</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl font-serif scroll-m-20">{comp.title}</CardTitle>
                                <CardDescription className="line-clamp-2 text-xs h-8">{comp.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#8B9B7E]">
                                        <span>Status</span>
                                        <span className={cn(status?.completed ? "text-emerald-600" : "text-amber-600")}>
                                            {status?.reason}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[#E8E4D8] rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-1000",
                                                status?.completed ? "bg-emerald-500 w-full" : status?.unlocked ? "bg-blue-500 w-[75%]" : "bg-stone-300 w-[10%]"
                                            )}
                                        />
                                    </div>
                                </div>

                                {attempt && (
                                    <div className="flex items-center gap-4 p-3 bg-white/60 rounded-xl border border-[#E8E4D8] shadow-sm">
                                        <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs">
                                            {attempt.score}%
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black uppercase text-[#8B9B7E]">Last Attempt</p>
                                            <p className="text-xs text-[#1B4332] font-bold">
                                                {new Date(attempt.submitted_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!status?.completed && (
                                    <Button
                                        disabled={!status?.unlocked || !exam}
                                        onClick={() => exam && handleStartExam(exam)}
                                        className={cn(
                                            "w-full h-12 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                                            status?.unlocked
                                                ? "bg-[#1B4332] hover:bg-[#2D6A4F] text-white shadow-lg shadow-primary/10"
                                                : "bg-[#E8E4D8] text-[#8B9B7E] grayscale"
                                        )}
                                    >
                                        {!status?.unlocked ? <Lock size={16} /> : <PlayCircle size={16} />}
                                        {status?.unlocked ? "Begin Final Examination" : "Assessment Locked"}
                                    </Button>
                                )}
                            </CardContent>

                            {!status?.unlocked && (
                                <div className="absolute inset-0 bg-stone-50/10 backdrop-blur-[1px] pointer-events-none" />
                            )}
                        </Card>
                    );
                })}

                {exams.length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4 bg-white/40 backdrop-blur-md rounded-[3.5rem] border-2 border-dashed border-[#E8E4D8]">
                        <div className="size-16 rounded-3xl bg-primary/5 text-primary/20 flex items-center justify-center mx-auto">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-2xl font-serif font-black text-[#1B4332]/40 italic">Assessments Coming Soon</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">Mastery assessments are being prepared for your enrolled competencies. Keep building your leadership portfolio.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
