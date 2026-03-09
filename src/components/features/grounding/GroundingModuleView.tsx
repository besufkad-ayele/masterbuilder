"use client";

import React, { useState, useMemo } from "react";
import {
    ArrowLeft,
    ChevronRight,
    PlayCircle,
    FileText,
    CheckCircle2,
    Globe,
    Building2,
    Lock,
    ArrowRight,
    Video,
    ExternalLink,
    BookOpen,
    ClipboardCheck,
    Info,
    PenLine,
    ChevronDown,
    X,
    Menu,
    Newspaper,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
    GroundingModule,
    ExternalSubFactor,
    InternalVideoSubFactor,
    InternalDocumentSubFactor,
} from "@/types";
import { QuizModule } from "./QuizModule";
import { Badge } from "@/components/ui/badge";
import { firebaseService } from "@/services/firebaseService";
import { useAppStore } from "@/stores";

interface GroundingModuleViewProps {
    moduleData: GroundingModule;
    companyId: string;
    userId?: string;
    groundingResults?: any[];
    onBack?: () => void;
}

export const GroundingModuleView: React.FC<GroundingModuleViewProps> = ({
    moduleData,
    companyId,
    userId,
    groundingResults,
    onBack,
}) => {
    const router = useRouter();
    const [isSavingScore, setIsSavingScore] = useState(false);
    const [viewMode, setViewMode] = useState<"overview" | "detail">("overview");
    const [activePart, setActivePart] = useState<"part_one" | "part_two">(
        "part_one"
    );

    // Part I state
    const [activeSubFactorIdx, setActiveSubFactorIdx] = useState(0);
    const [showPartOneQuiz, setShowPartOneQuiz] = useState(false);
    const [showSubFactorQuiz, setShowSubFactorQuiz] = useState(false);

    // Content tab within each sub-factor: 'videos' or 'articles'
    const [contentTab, setContentTab] = useState<"videos" | "articles">(
        "videos"
    );

    // Mobile sidebar open
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Part II state
    const [activePartTwoSubTab, setActivePartTwoSubTab] = useState<
        "videos" | "documents"
    >("videos");

    // Global Store
    const {
        groundingProgress,
        groundingScores,
        markGroundingCompleted,
        setGroundingProgress,
        setGroundingScore,
    } = useAppStore();

    // Derived Tracking state for current moduleId
    const completedItems = useMemo(() => {
        return groundingProgress[moduleData.id] || new Set<string>();
    }, [groundingProgress, moduleData.id]);

    // Initialize tracking state from database results
    React.useEffect(() => {
        if (groundingResults && moduleData.id) {
            const result = groundingResults.find(
                (r) => r.grounding_id === moduleData.id
            );
            if (result) {
                const content = result.completed_content || [];
                const toSet = new Set<string>(content);

                if (result.score !== undefined) {
                    toSet.add("part_one_assessment_passed");
                    setGroundingScore(
                        moduleData.id,
                        "part_one_assessment",
                        result.score
                    );
                }

                setGroundingProgress(moduleData.id, Array.from(toSet));
            }
        }
    }, [groundingResults, moduleData.id, setGroundingProgress, setGroundingScore]);

    const partOne = moduleData.structure.part_one;
    const partTwo = moduleData.structure.part_two;
    const currentSubFactor = partOne.sub_factors[activeSubFactorIdx];

    const trackVideo = async (url: string) => {
        if (!completedItems.has(url)) {
            markGroundingCompleted(moduleData.id, url);
            if (userId) {
                await firebaseService.fellow.trackGroundingContent(
                    userId,
                    moduleData.id,
                    url
                );
            }
        }
    };

    const trackArticle = async (url: string) => {
        if (!completedItems.has(url)) {
            markGroundingCompleted(moduleData.id, url);
            if (userId) {
                await firebaseService.fellow.trackGroundingContent(
                    userId,
                    moduleData.id,
                    url
                );
            }
        }
    };

    const isCurrentUnitContentDone = useMemo(() => {
        const vUrls = (currentSubFactor.video_urls || []).filter(
            (u) => u && u.trim() !== ""
        );
        const aUrls = (currentSubFactor.articles || [])
            .map((a) => a.link)
            .filter((l) => l && l.trim() !== "");

        return (
            vUrls.every((u) => completedItems.has(u)) &&
            aUrls.every((u) => completedItems.has(u))
        );
    }, [currentSubFactor, completedItems]);

    const isUnitQuizPassed = useMemo(() => {
        if (!currentSubFactor.quiz || currentSubFactor.quiz.length === 0)
            return true;
        return completedItems.has(`quiz_passed_subfactor_${activeSubFactorIdx}`);
    }, [currentSubFactor, completedItems, activeSubFactorIdx]);

    const isAllContentRead = useMemo(() => {
        return partOne.sub_factors.every((sf, idx) => {
            const vUrls = (sf.video_urls || []).filter(
                (u) => u && u.trim() !== ""
            );
            const aUrls = (sf.articles || [])
                .map((a) => a.link)
                .filter((l) => l && l.trim() !== "");
            const qPassed =
                !sf.quiz ||
                sf.quiz.length === 0 ||
                completedItems.has(`quiz_passed_subfactor_${idx}`);

            return (
                vUrls.every((u) => completedItems.has(u)) &&
                aUrls.every((u) => completedItems.has(u)) &&
                qPassed
            );
        });
    }, [partOne.sub_factors, completedItems]);

    const handleNextSubFactor = () => {
        setShowSubFactorQuiz(false);
        setContentTab("videos");
        if (activeSubFactorIdx < partOne.sub_factors.length - 1) {
            setActiveSubFactorIdx((prev) => prev + 1);
        } else {
            if (!completedItems.has("part_one_assessment_passed")) {
                setShowPartOneQuiz(true);
            }
        }
    };

    const handleQuizPass = async (score?: number) => {
        if (userId && moduleData.id) {
            setIsSavingScore(true);
            try {
                const totalQuestions =
                    partOne.completion_assessment.quiz_questions.length;
                let percentage10 = 10;
                if (score !== undefined) {
                    const accuracy = score / totalQuestions;
                    percentage10 = Number((accuracy * 10).toFixed(1));
                }

                await firebaseService.fellow.updateGroundingPerformance(
                    userId,
                    moduleData.id,
                    percentage10,
                    "in_progress"
                );

                markGroundingCompleted(moduleData.id, "part_one_assessment_passed");
                setGroundingScore(
                    moduleData.id,
                    "part_one_assessment",
                    percentage10
                );

                await firebaseService.fellow.trackGroundingContent(
                    userId,
                    moduleData.id,
                    "part_one_assessment_passed"
                );
            } catch (err) {
                console.error("Error saving grounding score:", err);
            } finally {
                setIsSavingScore(false);
            }
        }
        setShowPartOneQuiz(false);
    };

    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return "";
        const regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11
            ? `https://www.youtube.com/embed/${match[2]}`
            : url;
    };

    const videoCount = (currentSubFactor.video_urls || []).filter(
        (u) => u && u.trim() !== ""
    ).length;
    const articleCount = (currentSubFactor.articles || []).filter(
        (a) => a.link && a.link.trim() !== ""
    ).length;

    // Progress calculations
    const totalSubFactors = partOne.sub_factors.length;
    const completedSubFactors = partOne.sub_factors.filter((_, idx) =>
        completedItems.has(`quiz_passed_subfactor_${idx}`)
    ).length;
    const progressPercent = Math.round(
        (completedSubFactors / totalSubFactors) * 100
    );

    return (
        <div className="min-h-screen bg-[#FAFAF7] text-[#1B4332]">
            {/* ─── HEADER ─── */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E8E4D8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        {/* Back */}
                        <button
                            onClick={
                                viewMode === "detail"
                                    ? () => setViewMode("overview")
                                    : onBack || (() => router.push(`/onboarding/${companyId}`))
                            }
                            className="flex items-center gap-2 text-[#1B4332]/70 hover:text-[#1B4332] transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span className="text-sm font-medium hidden sm:inline">
                                {viewMode === "detail" ? "Back to Overview" : "Dashboard"}
                            </span>
                        </button>

                        {/* Title */}
                        <div className="flex flex-col items-center">
                            <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-[#1B4332] truncate max-w-[200px] sm:max-w-none">
                                {moduleData.name}
                            </h1>
                            {viewMode === "detail" && (
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-20 sm:w-32 h-1.5 bg-[#E8E4D8] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#1B4332] rounded-full transition-all duration-700"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-[#1B4332]/50 font-medium">
                                        {progressPercent}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-2">
                            {viewMode === "detail" && (
                                <button
                                    className="lg:hidden w-8 h-8 rounded-lg bg-[#F5F3EE] flex items-center justify-center"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <Menu className="w-4 h-4" />
                                </button>
                            )}
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1B4332] flex items-center justify-center">
                                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A059]" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                {/* ─── OVERVIEW MODE ─── */}
                {viewMode === "overview" && (
                    <div className="py-8 sm:py-12 lg:py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Hero Section */}
                        <div className="text-center mb-10 sm:mb-14 lg:mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1B4332]/5 border border-[#1B4332]/10 mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#1B4332]/60">
                                    Grounding Module
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B4332] mb-3">
                                Choose Your Learning Path
                            </h2>
                            <p className="text-sm sm:text-base text-[#1B4332]/50 max-w-lg mx-auto">
                                Complete both sections to earn your Grounding certification and
                                build a strong strategic foundation.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                            {/* Part I Card */}
                            <div
                                onClick={() => {
                                    setActivePart("part_one");
                                    setViewMode("detail");
                                }}
                                className="group relative bg-white rounded-2xl sm:rounded-3xl border border-[#E8E4D8] p-6 sm:p-8 hover:border-[#C5A059] hover:shadow-xl hover:shadow-[#C5A059]/5 transition-all duration-500 cursor-pointer overflow-hidden"
                            >
                                <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#C5A059]/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C5A059]/20 to-[#C5A059]/5 flex items-center justify-center border border-[#C5A059]/20 group-hover:scale-110 transition-transform">
                                            <Globe className="w-5 h-5 text-[#C5A059]" />
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] font-semibold border-[#C5A059]/30 text-[#C5A059]"
                                        >
                                            {partOne.sub_factors.length} Units
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">
                                            Part I
                                        </p>
                                        <h3 className="text-xl sm:text-2xl font-bold text-[#1B4332]">
                                            {partOne.name}
                                        </h3>
                                        <p className="text-sm text-[#1B4332]/50 leading-relaxed">
                                            Master external strategic drivers and global trends
                                            shaping your organization.
                                        </p>
                                    </div>

                                    {/* Progress indicator */}
                                    <div className="flex items-center justify-between pt-4 border-t border-[#E8E4D8]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-[#E8E4D8] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#1B4332] rounded-full transition-all"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-[#1B4332]/40 font-medium">
                                                {completedSubFactors}/{totalSubFactors}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] group-hover:text-[#C5A059] transition-colors">
                                            Start
                                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Part II Card - LOCKED */}
                            <div className="relative bg-white/60 rounded-2xl sm:rounded-3xl border border-[#E8E4D8] border-dashed p-6 sm:p-8 overflow-hidden select-none">
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
                                    <div className="w-14 h-14 rounded-full bg-[#1B4332]/5 flex items-center justify-center mb-3 border border-[#1B4332]/10">
                                        <Lock className="w-5 h-5 text-[#1B4332]/30" />
                                    </div>
                                    <p className="text-sm font-semibold text-[#1B4332]/40">
                                        Complete Part I to Unlock
                                    </p>
                                    <p className="text-[11px] text-[#1B4332]/25 mt-1">
                                        Pass all units and the final assessment
                                    </p>
                                </div>

                                <div className="opacity-30">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-[#1B4332]/5 flex items-center justify-center border border-[#1B4332]/10">
                                            <Building2 className="w-5 h-5 text-[#1B4332]/40" />
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] font-semibold border-[#1B4332]/10 text-[#1B4332]/30"
                                        >
                                            Locked
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#1B4332]/30">
                                            Part II
                                        </p>
                                        <h3 className="text-xl sm:text-2xl font-bold text-[#1B4332]/40">
                                            {partTwo.name}
                                        </h3>
                                        <p className="text-sm text-[#1B4332]/20 leading-relaxed">
                                            Internal organizational protocols, values, and
                                            frameworks.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-[#E8E4D8]/50">
                                        <span className="text-[10px] text-[#1B4332]/20 font-medium">
                                            Not started
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Banner */}
                        <div className="max-w-4xl mx-auto mt-6 sm:mt-8">
                            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-[#1B4332] rounded-xl sm:rounded-2xl text-white">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                    <Info className="w-4 h-4 text-[#C5A059]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm leading-relaxed">
                                        Complete Part I{" "}
                                        <span className="text-[#C5A059] font-semibold">
                                            Strategic Context
                                        </span>{" "}
                                        first. Part II will unlock after passing the final
                                        assessment.
                                    </p>
                                </div>
                                <div className="hidden sm:block text-right shrink-0 pl-4 border-l border-white/10">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                                        Est. Time
                                    </p>
                                    <p className="text-lg font-bold">4-6h</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── DETAIL MODE: PART I ─── */}
                {viewMode === "detail" && activePart === "part_one" && (
                    <div className="py-6 sm:py-8 lg:py-10 animate-in fade-in duration-500">
                        {showPartOneQuiz ? (
                            /* ── Final Assessment ── */
                            <div className="max-w-3xl mx-auto">
                                <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E4D8] shadow-lg overflow-hidden">
                                    <div className="h-1 bg-gradient-to-r from-[#C5A059] to-[#1B4332]" />
                                    <div className="p-6 sm:p-8 lg:p-10 text-center space-y-6">
                                        <div className="w-16 h-16 bg-[#C5A059]/10 rounded-2xl flex items-center justify-center mx-auto border border-[#C5A059]/20">
                                            <ClipboardCheck className="w-7 h-7 text-[#C5A059]" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-[#1B4332] mb-2">
                                                {partOne.completion_assessment.type}
                                            </h2>
                                            <p className="text-sm text-[#1B4332]/50 max-w-md mx-auto">
                                                {partOne.completion_assessment.description}
                                            </p>
                                            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-[#1B4332] text-white text-[10px] font-bold uppercase tracking-wider">
                                                <span className="text-[#C5A059]">Weight</span>
                                                <span className="w-px h-3 bg-white/20" />
                                                <span>10% of Grounding Score</span>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            {isSavingScore ? (
                                                <div className="flex flex-col items-center py-10 space-y-3">
                                                    <div className="w-10 h-10 border-3 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
                                                    <p className="text-xs font-semibold text-[#C5A059]">
                                                        Recording Achievement...
                                                    </p>
                                                </div>
                                            ) : (
                                                <QuizModule
                                                    questions={partOne.completion_assessment.quiz_questions.map(
                                                        (q) => ({
                                                            question: q.question,
                                                            options: Object.values(q.options).filter(
                                                                (o) => o !== ""
                                                            ),
                                                            answer:
                                                                q.options[
                                                                    q.correct_answer as keyof typeof q.options
                                                                ],
                                                            explanation: "",
                                                        })
                                                    )}
                                                    onPass={handleQuizPass}
                                                    onFail={() => {}}
                                                    activePhase="believe"
                                                />
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setShowPartOneQuiz(false)}
                                            className="text-xs font-medium text-[#1B4332]/30 hover:text-[#1B4332] transition-colors"
                                        >
                                            ← Review Learning Materials
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-6 lg:gap-8 items-start relative">
                                {/* ── Mobile Sidebar Overlay ── */}
                                {sidebarOpen && (
                                    <div
                                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-[300px] bg-white border-r border-[#E8E4D8] shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-left duration-300"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-bold text-[#1B4332]">
                                                    Learning Units
                                                </h3>
                                                <button
                                                    onClick={() => setSidebarOpen(false)}
                                                    className="w-8 h-8 rounded-lg bg-[#F5F3EE] flex items-center justify-center"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {renderSidebar(true)}
                                        </div>
                                    </div>
                                )}

                                {/* ── Desktop Sidebar ── */}
                                <aside className="hidden lg:block w-[280px] xl:w-[300px] shrink-0 sticky top-24">
                                    {renderSidebar(false)}
                                </aside>

                                {/* ── Main Content ── */}
                                <div className="flex-1 min-w-0">
                                    {showSubFactorQuiz &&
                                    currentSubFactor.quiz &&
                                    currentSubFactor.quiz.length > 0 ? (
                                        /* Unit Quiz */
                                        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E4D8] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                                            <div className="h-1 bg-[#C5A059]" />
                                            <div className="p-5 sm:p-8">
                                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E8E4D8]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center">
                                                            <ClipboardCheck className="w-4 h-4 text-[#C5A059]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                                                                Unit Quiz
                                                            </p>
                                                            <h3 className="text-base sm:text-lg font-bold text-[#1B4332]">
                                                                {currentSubFactor.name}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowSubFactorQuiz(false)}
                                                        className="text-[11px] font-medium text-[#1B4332]/30 hover:text-[#1B4332] transition-colors"
                                                    >
                                                        Review Content
                                                    </button>
                                                </div>

                                                <QuizModule
                                                    questions={currentSubFactor.quiz.map((q) => ({
                                                        question: q.question,
                                                        options: q.options,
                                                        answer: q.answer,
                                                        explanation: q.explanation || "",
                                                    }))}
                                                    onPass={async (score) => {
                                                        const quizKey = `quiz_passed_subfactor_${activeSubFactorIdx}`;
                                                        markGroundingCompleted(moduleData.id, quizKey);
                                                        const percentageScore = currentSubFactor.quiz
                                                            ? Math.round(
                                                                  (score /
                                                                      currentSubFactor.quiz.length) *
                                                                      100
                                                              )
                                                            : 100;
                                                        setGroundingScore(
                                                            moduleData.id,
                                                            quizKey,
                                                            percentageScore
                                                        );
                                                        if (userId) {
                                                            await firebaseService.fellow.trackGroundingContent(
                                                                userId,
                                                                moduleData.id,
                                                                quizKey
                                                            );
                                                        }
                                                        setShowSubFactorQuiz(false);
                                                        if (
                                                            activeSubFactorIdx <
                                                            partOne.sub_factors.length - 1
                                                        ) {
                                                            setActiveSubFactorIdx((prev) => prev + 1);
                                                        }
                                                    }}
                                                    onFail={() => {}}
                                                    activePhase="believe"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        /* Content View */
                                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                            {/* Unit Header Card */}
                                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E4D8] p-5 sm:p-7">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#C5A059]/10 flex items-center justify-center border border-[#C5A059]/20 shrink-0">
                                                            <span className="text-sm font-bold text-[#C5A059]">
                                                                {String(activeSubFactorIdx + 1).padStart(
                                                                    2,
                                                                    "0"
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                                                                Unit {activeSubFactorIdx + 1} of{" "}
                                                                {totalSubFactors}
                                                            </p>
                                                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1B4332] leading-tight">
                                                                {currentSubFactor.name}
                                                            </h2>
                                                        </div>
                                                    </div>

                                                    {isUnitQuizPassed && (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                                            <span className="text-[11px] font-semibold text-green-700">
                                                                Completed
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-sm text-[#1B4332]/50 mt-3 leading-relaxed max-w-2xl">
                                                    Explore the fundamental principles of{" "}
                                                    {currentSubFactor.name} through video lectures and
                                                    curated articles. Complete all materials and pass the
                                                    quiz to continue.
                                                </p>
                                            </div>

                                            {/* ── Content Tabs: Videos / Articles ── */}
                                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E4D8] overflow-hidden shadow-sm">
                                                {/* Tab Bar */}
                                                <div className="flex border-b border-[#E8E4D8]">
                                                    <button
                                                        onClick={() => setContentTab("videos")}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold transition-all relative",
                                                            contentTab === "videos"
                                                                ? "text-[#1B4332]"
                                                                : "text-[#1B4332]/35 hover:text-[#1B4332]/60"
                                                        )}
                                                    >
                                                        <Video className="w-4 h-4" />
                                                        <span>Videos</span>
                                                        {videoCount > 0 && (
                                                            <span
                                                                className={cn(
                                                                    "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                                                                    contentTab === "videos"
                                                                        ? "bg-[#1B4332] text-white"
                                                                        : "bg-[#E8E4D8] text-[#1B4332]/40"
                                                                )}
                                                            >
                                                                {videoCount}
                                                            </span>
                                                        )}
                                                        {contentTab === "videos" && (
                                                            <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#1B4332] rounded-full" />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => setContentTab("articles")}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold transition-all relative",
                                                            contentTab === "articles"
                                                                ? "text-[#1B4332]"
                                                                : "text-[#1B4332]/35 hover:text-[#1B4332]/60"
                                                        )}
                                                    >
                                                        <Newspaper className="w-4 h-4" />
                                                        <span>Articles</span>
                                                        {articleCount > 0 && (
                                                            <span
                                                                className={cn(
                                                                    "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                                                                    contentTab === "articles"
                                                                        ? "bg-[#1B4332] text-white"
                                                                        : "bg-[#E8E4D8] text-[#1B4332]/40"
                                                                )}
                                                            >
                                                                {articleCount}
                                                            </span>
                                                        )}
                                                        {contentTab === "articles" && (
                                                            <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#1B4332] rounded-full" />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Tab Content */}
                                                <div className="p-4 sm:p-6 lg:p-8">
                                                    {contentTab === "videos" ? (
                                                        <div className="space-y-4 animate-in fade-in duration-300">
                                                            {currentSubFactor.video_urls &&
                                                            currentSubFactor.video_urls.filter(
                                                                (u) => u && u.trim() !== ""
                                                            ).length > 0 ? (
                                                                <div
                                                                    className={cn(
                                                                        "grid gap-4 sm:gap-5",
                                                                        currentSubFactor.video_urls.filter(
                                                                            (u) => u && u.trim() !== ""
                                                                        ).length > 1
                                                                            ? "grid-cols-1 md:grid-cols-2"
                                                                            : "grid-cols-1 max-w-3xl mx-auto"
                                                                    )}
                                                                >
                                                                    {currentSubFactor.video_urls
                                                                        .filter((u) => u && u.trim() !== "")
                                                                        .map((url, vIdx) => (
                                                                            <div
                                                                                key={vIdx}
                                                                                className="space-y-2"
                                                                            >
                                                                                <div className="aspect-video bg-[#0a0a0a] rounded-xl sm:rounded-2xl overflow-hidden relative group shadow-lg border border-[#E8E4D8]">
                                                                                    <iframe
                                                                                        src={getYouTubeEmbedUrl(url)}
                                                                                        className="w-full h-full"
                                                                                        allowFullScreen
                                                                                        onLoad={() =>
                                                                                            trackVideo(url)
                                                                                        }
                                                                                    />
                                                                                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                                                                                        <Badge className="bg-black/60 backdrop-blur text-white border-0 text-[9px] sm:text-[10px] font-semibold flex items-center gap-1.5 px-2 py-0.5">
                                                                                            <PlayCircle className="w-3 h-3 text-[#C5A059]" />
                                                                                            Video{" "}
                                                                                            {currentSubFactor
                                                                                                .video_urls.length > 1
                                                                                                ? vIdx + 1
                                                                                                : ""}
                                                                                        </Badge>
                                                                                    </div>

                                                                                    {completedItems.has(url) && (
                                                                                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                                                                                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                                                                                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            ) : (
                                                                <div className="aspect-video bg-[#F5F3EE] rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border border-dashed border-[#E8E4D8]">
                                                                    <Video className="w-10 h-10 text-[#1B4332]/10 mb-3" />
                                                                    <p className="text-sm text-[#1B4332]/30 font-medium">
                                                                        Video content coming soon
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4 animate-in fade-in duration-300">
                                                            {currentSubFactor.articles &&
                                                            currentSubFactor.articles.filter(
                                                                (a) => a.link && a.link.trim() !== ""
                                                            ).length > 0 ? (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    {currentSubFactor.articles
                                                                        .filter(
                                                                            (a) =>
                                                                                a.link && a.link.trim() !== ""
                                                                        )
                                                                        .map((art, artIdx) => (
                                                                            <a
                                                                                key={artIdx}
                                                                                href={art.link}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={() =>
                                                                                    trackArticle(art.link)
                                                                                }
                                                                                className="group/art block bg-[#FAFAF7] rounded-xl sm:rounded-2xl border border-[#E8E4D8] overflow-hidden hover:border-[#C5A059] hover:shadow-lg transition-all duration-300"
                                                                            >
                                                                                {/* Article Image */}
                                                                                <div className="aspect-[16/10] relative overflow-hidden bg-[#E8E4D8]/30">
                                                                                    {art.image_url ? (
                                                                                        <img
                                                                                            src={art.image_url}
                                                                                            alt={art.title}
                                                                                            className="w-full h-full object-cover group-hover/art:scale-105 transition-transform duration-500"
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                                            <FileText className="w-8 h-8 text-[#1B4332]/10" />
                                                                                        </div>
                                                                                    )}

                                                                                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                                                                                        <Badge className="bg-[#C5A059] text-[#1B4332] border-0 text-[9px] font-bold uppercase tracking-wider">
                                                                                            {artIdx === 0
                                                                                                ? "Primary"
                                                                                                : "Reference"}
                                                                                        </Badge>
                                                                                    </div>

                                                                                    {completedItems.has(
                                                                                        art.link
                                                                                    ) && (
                                                                                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                                                                                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                                                                                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Article Info */}
                                                                                <div className="p-4 space-y-2">
                                                                                    <h4 className="text-sm sm:text-base font-semibold text-[#1B4332] group-hover/art:text-[#C5A059] transition-colors leading-snug line-clamp-2">
                                                                                        {art.title ||
                                                                                            "Read Article"}
                                                                                    </h4>
                                                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#C5A059] uppercase tracking-wider pt-2 border-t border-[#E8E4D8]">
                                                                                        Open Article
                                                                                        <ExternalLink className="w-3 h-3" />
                                                                                    </div>
                                                                                </div>
                                                                            </a>
                                                                        ))}
                                                                </div>
                                                            ) : (
                                                                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-[#E8E4D8] rounded-xl sm:rounded-2xl bg-[#F5F3EE]">
                                                                    <FileText className="w-10 h-10 text-[#1B4332]/10 mb-3" />
                                                                    <p className="text-sm text-[#1B4332]/30 font-medium">
                                                                        No articles for this unit
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ── Action Bar ── */}
                                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E4D8] p-5 sm:p-6">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 flex items-center justify-center border border-[#C5A059]/20 shrink-0">
                                                            <BookOpen className="w-4 h-4 text-[#C5A059]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                                                                Next Step
                                                            </p>
                                                            <p className="text-xs sm:text-sm text-[#1B4332]/50">
                                                                {isUnitQuizPassed
                                                                    ? "Ready to proceed to the next unit"
                                                                    : isCurrentUnitContentDone
                                                                    ? "Take the quiz to unlock the next unit"
                                                                    : "Complete all videos and articles first"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                                        {currentSubFactor.quiz &&
                                                            currentSubFactor.quiz.length > 0 &&
                                                            (isUnitQuizPassed ? (
                                                                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                                                            Passed
                                                                        </p>
                                                                        <p className="text-xs font-semibold text-green-600">
                                                                            {groundingScores[moduleData.id]?.[
                                                                                `quiz_passed_subfactor_${activeSubFactorIdx}`
                                                                            ] ?? "100"}
                                                                            %
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    disabled={!isCurrentUnitContentDone}
                                                                    onClick={() =>
                                                                        setShowSubFactorQuiz(true)
                                                                    }
                                                                    className="px-5 py-5 bg-[#C5A059] text-[#1B4332] text-xs font-bold uppercase tracking-wider hover:bg-[#b5903f] transition-all rounded-xl shadow-md flex items-center gap-2 disabled:opacity-40 flex-1 sm:flex-initial justify-center"
                                                                >
                                                                    {!isCurrentUnitContentDone ? (
                                                                        <Lock className="w-3.5 h-3.5" />
                                                                    ) : (
                                                                        <ClipboardCheck className="w-3.5 h-3.5" />
                                                                    )}
                                                                    Take Quiz
                                                                </Button>
                                                            ))}

                                                        {(isUnitQuizPassed ||
                                                            !currentSubFactor.quiz ||
                                                            currentSubFactor.quiz.length === 0) && (
                                                            <Button
                                                                onClick={handleNextSubFactor}
                                                                className="px-5 py-5 bg-[#1B4332] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#2d6b4f] transition-all rounded-xl shadow-md flex items-center gap-2 group/btn flex-1 sm:flex-initial justify-center"
                                                            >
                                                                {activeSubFactorIdx ===
                                                                partOne.sub_factors.length - 1
                                                                    ? completedItems.has(
                                                                          "part_one_assessment_passed"
                                                                      )
                                                                        ? "All Complete"
                                                                        : "Final Assessment"
                                                                    : "Next Unit"}
                                                                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ─── Floating Footer ─── */}
            <footer className="fixed bottom-0 left-0 w-full bg-[#1B4332] text-white py-3 px-4 sm:px-6 lg:px-8 border-t border-[#C5A059]/20 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-semibold text-white/60">
                            {viewMode === "overview"
                                ? "Select a section to begin"
                                : `Part I — Unit ${activeSubFactorIdx + 1} of ${totalSubFactors}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] sm:text-xs font-medium text-[#C5A059] hidden sm:inline">
                            {completedSubFactors} of {totalSubFactors} units complete
                        </span>
                        <div className="w-16 sm:w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#C5A059] rounded-full transition-all duration-700"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );

    // ─── Sidebar render helper ───
    function renderSidebar(isMobile: boolean) {
        return (
            <div className="space-y-2">
                {!isMobile && (
                    <div className="pl-3 border-l-[3px] border-[#C5A059] mb-5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                            Learning Path
                        </p>
                        <h3 className="text-base font-bold text-[#1B4332] mt-0.5">
                            {partOne.name}
                        </h3>
                    </div>
                )}

                <div className="space-y-1.5">
                    {partOne.sub_factors.map((factor, idx) => {
                        const isUnlocked =
                            idx === 0 ||
                            completedItems.has(`quiz_passed_subfactor_${idx - 1}`);
                        const isActive = idx === activeSubFactorIdx && !showPartOneQuiz;
                        const isDone = completedItems.has(
                            `quiz_passed_subfactor_${idx}`
                        );

                        return (
                            <button
                                key={idx}
                                disabled={!isUnlocked}
                                onClick={() => {
                                    if (isUnlocked) {
                                        setActiveSubFactorIdx(idx);
                                        setShowPartOneQuiz(false);
                                        setContentTab("videos");
                                        if (isMobile) setSidebarOpen(false);
                                    }
                                }}
                                className={cn(
                                    "w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 group/item",
                                    !isUnlocked
                                        ? "opacity-40 cursor-not-allowed"
                                        : isActive
                                        ? "bg-[#1B4332] text-white shadow-lg"
                                        : "bg-transparent hover:bg-[#F5F3EE]"
                                )}
                            >
                                {/* Number or check */}
                                <div
                                    className={cn(
                                        "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 transition-all",
                                        isDone
                                            ? "bg-green-500 text-white"
                                            : isActive
                                            ? "bg-[#C5A059] text-[#1B4332]"
                                            : "bg-[#E8E4D8]/60 text-[#1B4332]/30"
                                    )}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : !isUnlocked ? (
                                        <Lock className="w-3 h-3" />
                                    ) : (
                                        idx + 1
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p
                                        className={cn(
                                            "text-xs font-semibold truncate transition-colors",
                                            isActive
                                                ? "text-white"
                                                : isDone
                                                ? "text-[#1B4332]/70"
                                                : isUnlocked
                                                ? "text-[#1B4332]/60"
                                                : "text-[#1B4332]/25"
                                        )}
                                    >
                                        {factor.name}
                                    </p>
                                    {!isUnlocked && (
                                        <p className="text-[9px] text-red-400/60 font-medium mt-0.5">
                                            Locked
                                        </p>
                                    )}
                                </div>

                                {isActive && (
                                    <ChevronRight className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Separator */}
                <div className="my-3 border-t border-[#E8E4D8]" />

                {/* Final Assessment Button */}
                <button
                    disabled={!isAllContentRead}
                    onClick={() => {
                        if (!completedItems.has("part_one_assessment_passed")) {
                            setShowPartOneQuiz(true);
                            if (isMobile) setSidebarOpen(false);
                        }
                    }}
                    className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 border-2",
                        showPartOneQuiz
                            ? "bg-[#1B4332] text-white border-[#C5A059] shadow-lg"
                            : completedItems.has("part_one_assessment_passed")
                            ? "bg-green-50 border-green-200"
                            : isAllContentRead
                            ? "bg-[#C5A059]/5 border-[#C5A059]/30 hover:bg-[#C5A059]/10"
                            : "opacity-40 cursor-not-allowed border-dashed border-[#E8E4D8]"
                    )}
                >
                    <div
                        className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                            completedItems.has("part_one_assessment_passed")
                                ? "bg-green-500 text-white"
                                : showPartOneQuiz
                                ? "bg-[#C5A059] text-[#1B4332]"
                                : "bg-[#E8E4D8]/60"
                        )}
                    >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">Final Assessment</p>
                        {completedItems.has("part_one_assessment_passed") ? (
                            <p className="text-[10px] text-green-600 font-semibold mt-0.5">
                                Passed —{" "}
                                {groundingScores[moduleData.id]?.["part_one_assessment"] ??
                                    "--"}{" "}
                                / 10
                            </p>
                        ) : (
                            <p className="text-[9px] text-[#1B4332]/30 font-medium mt-0.5">
                                {isAllContentRead
                                    ? "Ready to take"
                                    : "Complete all units first"}
                            </p>
                        )}
                    </div>
                </button>

                {/* Weight info */}
               
            </div>
        );
    }
};