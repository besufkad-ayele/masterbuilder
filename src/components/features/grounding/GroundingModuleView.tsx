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
    PenLine
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { GroundingModule, ExternalSubFactor, InternalVideoSubFactor, InternalDocumentSubFactor } from "@/types";
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
    const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');
    const [activePart, setActivePart] = useState<'part_one' | 'part_two'>('part_one');

    // Part I state
    const [activeSubFactorIdx, setActiveSubFactorIdx] = useState(0);
    const [showPartOneQuiz, setShowPartOneQuiz] = useState(false);
    const [showSubFactorQuiz, setShowSubFactorQuiz] = useState(false);

    // Part II state
    const [activePartTwoSubTab, setActivePartTwoSubTab] = useState<'videos' | 'documents'>('videos');

    // Global Store
    const { groundingProgress, groundingScores, markGroundingCompleted, setGroundingProgress, setGroundingScore } = useAppStore();

    // Derived Tracking state for current moduleId
    const completedItems = useMemo(() => {
        return groundingProgress[moduleData.id] || new Set<string>();
    }, [groundingProgress, moduleData.id]);

    // Initialize tracking state from database results
    React.useEffect(() => {
        if (groundingResults && moduleData.id) {
            const result = groundingResults.find(r => r.grounding_id === moduleData.id);
            if (result) {
                const content = result.completed_content || [];
                const toSet = new Set<string>(content);

                if (result.score !== undefined) {
                    toSet.add('part_one_assessment_passed');
                    setGroundingScore(moduleData.id, 'part_one_assessment', result.score);
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
                await firebaseService.fellow.trackGroundingContent(userId, moduleData.id, url);
            }
        }
    };

    const trackArticle = async (url: string) => {
        if (!completedItems.has(url)) {
            markGroundingCompleted(moduleData.id, url);
            if (userId) {
                await firebaseService.fellow.trackGroundingContent(userId, moduleData.id, url);
            }
        }
    };

    const isCurrentUnitContentDone = useMemo(() => {
        const vUrls = (currentSubFactor.video_urls || []).filter(u => u && u.trim() !== '');
        const aUrls = (currentSubFactor.articles || []).map(a => a.link).filter(l => l && l.trim() !== '');

        return vUrls.every(u => completedItems.has(u)) && aUrls.every(u => completedItems.has(u));
    }, [currentSubFactor, completedItems]);

    const isUnitQuizPassed = useMemo(() => {
        if (!currentSubFactor.quiz || currentSubFactor.quiz.length === 0) return true;
        return completedItems.has(`quiz_passed_subfactor_${activeSubFactorIdx}`);
    }, [currentSubFactor, completedItems, activeSubFactorIdx]);

    const isAllContentRead = useMemo(() => {
        return partOne.sub_factors.every((sf, idx) => {
            const vUrls = (sf.video_urls || []).filter(u => u && u.trim() !== '');
            const aUrls = (sf.articles || []).map(a => a.link).filter(l => l && l.trim() !== '');
            const qPassed = (!sf.quiz || sf.quiz.length === 0) || completedItems.has(`quiz_passed_subfactor_${idx}`);

            return vUrls.every(u => completedItems.has(u)) &&
                aUrls.every(u => completedItems.has(u)) &&
                qPassed;
        });
    }, [partOne.sub_factors, completedItems]);

    const handleNextSubFactor = () => {
        setShowSubFactorQuiz(false);
        if (activeSubFactorIdx < partOne.sub_factors.length - 1) {
            setActiveSubFactorIdx(prev => prev + 1);
        } else {
            if (!completedItems.has('part_one_assessment_passed')) {
                setShowPartOneQuiz(true);
            } else {
                setActivePart('part_two');
            }
        }
    };

    const handleQuizPass = async (score?: number) => {
        if (userId && moduleData.id) {
            setIsSavingScore(true);
            try {
                const totalQuestions = partOne.completion_assessment.quiz_questions.length;
                let percentage10 = 10;
                if (score !== undefined) {
                    const accuracy = score / totalQuestions;
                    percentage10 = Number((accuracy * 10).toFixed(1));
                }

                await firebaseService.fellow.updateGroundingPerformance(
                    userId,
                    moduleData.id,
                    percentage10,
                    'in_progress'
                );

                markGroundingCompleted(moduleData.id, 'part_one_assessment_passed');
                setGroundingScore(moduleData.id, 'part_one_assessment', percentage10);

                await firebaseService.fellow.trackGroundingContent(userId, moduleData.id, 'part_one_assessment_passed');
            } catch (err) {
                console.error("Error saving grounding score:", err);
            } finally {
                setIsSavingScore(false);
            }
        }
        setShowPartOneQuiz(false);
        setActivePart('part_two');
    };

    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
    };

    return (
        <div className="min-h-screen bg-[#FDFCF6] text-[#1B4332] pb-20">
            {/* Premium Header */}
            <nav className="sticky top-0 z-50 bg-[#FDFCF6]/90 backdrop-blur-xl border-b border-[#E8E4D8] shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-20 lg:h-24 flex items-center justify-between">
                    <button
                        onClick={onBack || (() => router.push(`/onboarding/${companyId}`))}
                        className="group flex items-center text-[#1B4332] hover:text-[#C5A059] transition-all"
                    >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white border border-[#E8E4D8] flex items-center justify-center mr-2 sm:mr-3 lg:mr-4 group-hover:border-[#C5A059] group-hover:shadow-lg transition-all">
                            <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Return to</p>
                            <p className="font-bold text-xs lg:text-sm">Dashboard</p>
                        </div>
                    </button>

                    <div className="flex flex-col items-center min-w-0 flex-1 mx-2 sm:mx-4">
                        <h1 className="text-sm sm:text-lg lg:text-2xl font-serif font-bold italic text-[#1B4332] tracking-tight truncate max-w-[160px] sm:max-w-[300px] lg:max-w-none text-center">
                            {moduleData.name}
                        </h1>
                        <div className="hidden sm:flex items-center gap-2 lg:gap-3 mt-1">
                            <span className="h-px w-4 lg:w-8 bg-[#C5A059]/30"></span>
                            <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#C5A059]">Curated Experience</span>
                            <span className="h-px w-4 lg:w-8 bg-[#C5A059]/30"></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-right mr-2 lg:mr-4 hidden md:block">
                            <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Progress</p>
                            <div className="w-16 lg:w-32 h-1.5 lg:h-2 bg-[#E8E4D8] rounded-full mt-1 overflow-hidden">
                                <div
                                    className="h-full bg-[#1B4332] transition-all duration-1000"
                                    style={{ width: viewMode === 'overview' ? '0%' : (activePart === 'part_one' ? `${((activeSubFactorIdx + 1) / partOne.sub_factors.length) * 50}%` : '100%') }}
                                ></div>
                            </div>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-[#1B4332] text-white flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-[#C5A059]" />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
                {/* Part Switcher */}
                {viewMode === 'detail' && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-8 lg:mb-12 p-1.5 sm:p-2 bg-white/50 rounded-xl sm:rounded-[2.5rem] border border-[#E8E4D8] w-full sm:w-fit mx-auto shadow-sm">
                        <button
                            onClick={() => setActivePart('part_one')}
                            className={cn(
                                "flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-4 sm:px-6 lg:px-10 py-2.5 sm:py-3.5 lg:py-4 rounded-lg sm:rounded-[2rem] text-[9px] sm:text-[10px] lg:text-sm font-black uppercase tracking-wider sm:tracking-widest transition-all duration-500",
                                activePart === 'part_one'
                                    ? "bg-[#1B4332] text-white shadow-2xl sm:scale-105"
                                    : "text-[#1B4332]/40 hover:text-[#1B4332] hover:bg-white"
                            )}
                        >
                            <Globe className={cn("w-3 h-3 sm:w-4 sm:h-4", activePart === 'part_one' ? "text-[#C5A059]" : "")} />
                            <span className="hidden sm:inline">Part I:</span> Strategic Context
                        </button>
                        <button
                            onClick={() => setActivePart('part_two')}
                            className={cn(
                                "flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-4 sm:px-6 lg:px-10 py-2.5 sm:py-3.5 lg:py-4 rounded-lg sm:rounded-[2rem] text-[9px] sm:text-[10px] lg:text-sm font-black uppercase tracking-wider sm:tracking-widest transition-all duration-500",
                                activePart === 'part_two'
                                    ? "bg-[#1B4332] text-white shadow-2xl sm:scale-105"
                                    : "text-[#1B4332]/40 hover:text-[#1B4332] hover:bg-white"
                            )}
                        >
                            <Building2 className={cn("w-3 h-3 sm:w-4 sm:h-4", activePart === 'part_two' ? "text-[#C5A059]" : "")} />
                            <span className="hidden sm:inline">Part II:</span> Internal Domain
                        </button>
                    </div>
                )}

                {viewMode === 'overview' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-10 max-w-6xl mx-auto py-4 sm:py-8 lg:py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {/* Part 1 Entry Card */}
                        <div
                            onClick={() => {
                                setActivePart('part_one');
                                setViewMode('detail');
                            }}
                            className="group relative bg-white border-2 border-[#E8E4D8] rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] p-5 sm:p-8 lg:p-12 hover:border-[#C5A059] hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 sm:p-8 lg:p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                <Globe className="w-24 h-24 sm:w-36 sm:h-36 lg:w-[200px] lg:h-[200px]" />
                            </div>
                            <div className="relative z-10 space-y-3 sm:space-y-5 lg:space-y-8">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl lg:rounded-3xl bg-[#C5A059]/10 flex items-center justify-center border-2 border-[#C5A059]/20 group-hover:bg-[#C5A059] group-hover:text-white transition-all">
                                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                                </div>
                                <div>
                                    <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#C5A059] mb-1 sm:mb-2">Section One</p>
                                    <h3 className="text-lg sm:text-2xl lg:text-4xl font-serif font-bold text-[#1B4332]">{partOne.name}</h3>
                                    <p className="text-[#1B4332]/60 mt-2 sm:mt-3 lg:mt-4 leading-relaxed font-serif italic text-xs sm:text-sm lg:text-lg">
                                        Master the external strategic drivers and global trends shaping your organization's future.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-4 text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#1B4332] group-hover:text-[#C5A059] transition-colors">
                                    Enter Strategic Context <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* Part 2 Entry Card */}
                        <div
                            onClick={() => {
                                setActivePart('part_two');
                                setViewMode('detail');
                            }}
                            className="group relative bg-[#FDFCF6] border-2 border-[#E8E4D8] rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] p-5 sm:p-8 lg:p-12 hover:border-[#1B4332] hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 sm:p-8 lg:p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                <Building2 className="w-24 h-24 sm:w-36 sm:h-36 lg:w-[200px] lg:h-[200px]" />
                            </div>
                            <div className="relative z-10 space-y-3 sm:space-y-5 lg:space-y-8">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl lg:rounded-3xl bg-[#1B4332]/10 flex items-center justify-center border-2 border-[#1B4332]/20 group-hover:bg-[#1B4332] group-hover:text-white transition-all">
                                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                                </div>
                                <div>
                                    <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#C5A059] mb-1 sm:mb-2">Section Two</p>
                                    <h3 className="text-lg sm:text-2xl lg:text-4xl font-serif font-bold text-[#1B4332]">{partTwo.name}</h3>
                                    <p className="text-[#1B4332]/60 mt-2 sm:mt-3 lg:mt-4 leading-relaxed font-serif italic text-xs sm:text-sm lg:text-lg">
                                        Explore the internal organizational protocols, values, and strategic frameworks.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-4 text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#1B4332] group-hover:text-[#C5A059] transition-colors">
                                    Enter Internal Domain <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* Module Info Banner */}
                        <div className="md:col-span-2 bg-[#1B4332] rounded-xl sm:rounded-[2rem] lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 border-2 border-[#C5A059]/30 shadow-2xl">
                            <div className="flex items-center gap-3 sm:gap-6">
                                <div className="w-9 h-9 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl lg:rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0">
                                    <Info className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#C5A059]" />
                                </div>
                                <div>
                                    <p className="text-white font-serif italic text-xs sm:text-sm lg:text-lg leading-snug">
                                        Complete both Strategic and Internal domains to finalize your <span className="text-[#C5A059] font-bold">Grounding certification</span>.
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0 text-center sm:text-right">
                                <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-0.5 sm:mb-1">Estimated Time</p>
                                <p className="text-white text-base sm:text-lg lg:text-xl font-bold font-serif">4-6 Hours</p>
                            </div>
                        </div>
                    </div>
                ) : activePart === 'part_one' ? (
                    <div className="space-y-4 sm:space-y-8 lg:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {showPartOneQuiz ? (
                            <div className="max-w-4xl mx-auto">
                                <div className="bg-white rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] border-2 border-[#E8E4D8] p-4 sm:p-8 lg:p-12 shadow-2xl text-center space-y-4 sm:space-y-6 lg:space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 lg:h-2 bg-[#C5A059]"></div>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto border-2 border-[#C5A059]/20">
                                            <ClipboardCheck className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#C5A059]" />
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <h2 className="text-lg sm:text-2xl lg:text-4xl font-serif font-bold text-[#1B4332]">{partOne.completion_assessment.type}</h2>
                                            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#1B4332] text-white border border-[#C5A059]/30 shadow-lg">
                                                <span className="text-[7px] sm:text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Weighting</span>
                                                <span className="h-2.5 sm:h-3 w-px bg-white/20"></span>
                                                <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold">10% of Grounding Score</span>
                                            </div>
                                        </div>
                                        <p className="text-[#1B4332]/60 font-serif italic max-w-xl mx-auto text-xs sm:text-sm lg:text-base">
                                            {partOne.completion_assessment.description}
                                        </p>
                                    </div>

                                    <div className="py-4 sm:py-6 lg:py-8">
                                        {isSavingScore ? (
                                            <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-3 sm:space-y-4">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin"></div>
                                                <p className="text-[10px] sm:text-xs lg:text-sm font-black uppercase tracking-widest text-[#C5A059]">Recording Achievement...</p>
                                            </div>
                                        ) : (
                                            <QuizModule
                                                questions={partOne.completion_assessment.quiz_questions.map(q => ({
                                                    question: q.question,
                                                    options: Object.values(q.options).filter(o => o !== ""),
                                                    answer: q.options[q.correct_answer as keyof typeof q.options],
                                                    explanation: ""
                                                }))}
                                                onPass={handleQuizPass}
                                                onFail={() => { }}
                                                activePhase="believe"
                                            />
                                        )}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowPartOneQuiz(false)}
                                        className="text-[#1B4332]/40 hover:text-[#1B4332] text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-widest"
                                    >
                                        Review Learning Materials
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[350px_1fr] gap-4 sm:gap-8 lg:gap-12 items-start">
                                {/* Lateral Sidebar - SubFactors */}
                                <aside className="space-y-2 sm:space-y-3 lg:space-y-4 lg:sticky lg:top-36">
                                    <div className="pl-3 sm:pl-4 border-l-4 border-[#C5A059] mb-3 sm:mb-6 lg:mb-8">
                                        <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Learning Path</p>
                                        <h3 className="text-base sm:text-lg lg:text-xl font-serif font-bold text-[#1B4332]">{partOne.name}</h3>
                                    </div>

                                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-3 px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0 snap-x lg:snap-none scrollbar-none">
                                        {partOne.sub_factors.map((factor, idx) => {
                                            const isUnlocked = idx === 0 || completedItems.has(`quiz_passed_subfactor_${idx - 1}`);
                                            return (
                                                <button
                                                    key={idx}
                                                    disabled={!isUnlocked}
                                                    onClick={() => {
                                                        if (isUnlocked) {
                                                            setActiveSubFactorIdx(idx);
                                                            setShowPartOneQuiz(false);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "text-left p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl transition-all duration-300 flex items-center justify-between group snap-start",
                                                        "min-w-[180px] sm:min-w-[220px] lg:min-w-0 w-auto lg:w-full shrink-0 lg:shrink",
                                                        !isUnlocked ? "opacity-50 cursor-not-allowed bg-white/20 border-dashed border-[#E8E4D8]" :
                                                            (idx === activeSubFactorIdx && !showPartOneQuiz)
                                                                ? "bg-white border-2 border-[#C5A059] shadow-xl lg:translate-x-4"
                                                                : "bg-white/40 border border-[#E8E4D8] hover:border-[#C5A059]/40"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
                                                        <span className={cn(
                                                            "w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full border flex items-center justify-center text-[8px] sm:text-[9px] lg:text-[10px] font-black shrink-0",
                                                            !isUnlocked ? "bg-black/5 text-[#1B4332]/20 border-transparent" :
                                                                (idx === activeSubFactorIdx && !showPartOneQuiz)
                                                                    ? "bg-[#1B4332] text-white border-[#1B4332]"
                                                                    : "bg-[#FDFCF6] text-[#1B4332]/30 border-[#E8E4D8]"
                                                        )}>
                                                            {idx + 1}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className={cn(
                                                                "text-[11px] sm:text-xs lg:text-sm font-bold transition-colors truncate max-w-[100px] sm:max-w-[140px] lg:max-w-none",
                                                                (idx === activeSubFactorIdx && !showPartOneQuiz) ? "text-[#1B4332]" : "text-[#1B4332]/40"
                                                            )}>
                                                                {factor.name}
                                                            </p>
                                                            {isUnlocked && (
                                                                <p className="text-[7px] sm:text-[8px] lg:text-[9px] uppercase tracking-widest text-[#C5A059] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
                                                                    Explore Unit
                                                                </p>
                                                            )}
                                                            {!isUnlocked && (
                                                                <p className="text-[7px] sm:text-[8px] lg:text-[9px] uppercase tracking-widest text-red-500/50 mt-0.5 flex items-center gap-1">
                                                                    <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Locked
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1.5 sm:ml-2">
                                                        {(completedItems.has(`quiz_passed_subfactor_${idx}`)) ? (
                                                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                                        ) : (
                                                            !isUnlocked ? <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-[#1B4332]/20" /> : <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full border-2 border-[#E8E4D8]" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {/* Final Assessment Entry */}
                                        <button
                                            disabled={!isAllContentRead}
                                            onClick={() => {
                                                if (!completedItems.has('part_one_assessment_passed')) {
                                                    setShowPartOneQuiz(true);
                                                }
                                            }}
                                            className={cn(
                                                "text-left p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl transition-all duration-500 flex items-center justify-between group border-2 snap-start",
                                                "min-w-[180px] sm:min-w-[220px] lg:min-w-0 w-auto lg:w-full shrink-0 lg:shrink",
                                                showPartOneQuiz
                                                    ? "bg-[#1B4332] text-white border-[#C5A059] shadow-2xl lg:translate-x-4"
                                                    : completedItems.has('part_one_assessment_passed')
                                                        ? "bg-green-500/10 border-green-500/30 text-[#1B4332]"
                                                        : isAllContentRead
                                                            ? "bg-[#C5A059]/10 border-[#C5A059]/50 text-[#1B4332] hover:bg-[#C5A059]/20"
                                                            : "bg-white/20 border-dashed border-[#E8E4D8] text-[#1B4332]/20 cursor-not-allowed"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                                <div className={cn(
                                                    "w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center border transition-all shrink-0",
                                                    showPartOneQuiz ? "bg-[#C5A059] border-[#C5A059] text-white"
                                                        : completedItems.has('part_one_assessment_passed') ? "bg-green-500 border-green-500 text-white"
                                                            : "bg-white/50 border-[#E8E4D8]"
                                                )}>
                                                    <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] sm:text-xs lg:text-sm font-bold">Final Assessment</p>
                                                    <p className="text-[7px] sm:text-[8px] uppercase tracking-widest opacity-60">Verification Exam</p>
                                                </div>
                                            </div>

                                            {completedItems.has('part_one_assessment_passed') ? (
                                                <div className="flex flex-col items-end shrink-0 ml-1.5 sm:ml-2">
                                                    <span className="text-[9px] sm:text-[10px] lg:text-xs font-black text-green-600">PASSED</span>
                                                    <span className="text-[7px] sm:text-[8px] lg:text-[10px] uppercase font-bold text-green-600/60">
                                                        {groundingScores[moduleData.id]?.['part_one_assessment'] ?? '--'} / 10
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="shrink-0 ml-1.5 sm:ml-2">
                                                    {!isAllContentRead && <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 opacity-40" />}
                                                    {showPartOneQuiz && <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-[#C5A059]" />}
                                                </div>
                                            )}
                                        </button>
                                    </div>

                                    <div className="mt-4 sm:mt-6 lg:mt-8 p-3 sm:p-4 lg:p-6 bg-[#1B4332] rounded-xl sm:rounded-2xl lg:rounded-3xl text-white shadow-2xl border-2 border-[#C5A059]/30 hidden sm:block">
                                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 lg:mb-4">
                                            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A059]" />
                                            <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Weighting</span>
                                        </div>
                                        <p className="text-lg sm:text-xl lg:text-2xl font-serif font-bold italic mb-1">{partOne.weight}</p>
                                        <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white/50 uppercase font-black tracking-widest leading-relaxed">
                                            Contribution to overall Grounding Module score.
                                        </p>
                                    </div>
                                </aside>

                                {/* Main Content Area */}
                                <div className="space-y-4 sm:space-y-8 lg:space-y-12 min-w-0">
                                    <div className="bg-white rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] border-2 border-[#E8E4D8] overflow-hidden shadow-2xl">
                                        {showSubFactorQuiz && currentSubFactor.quiz && currentSubFactor.quiz.length > 0 ? (
                                            <div className="p-4 sm:p-8 lg:p-12 space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 lg:mb-8 pb-3 sm:pb-4 border-b border-[#E8E4D8] gap-3 sm:gap-4">
                                                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl bg-[#1B4332] flex items-center justify-center shrink-0">
                                                            <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#C5A059]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Unit Assessment</p>
                                                            <h3 className="text-sm sm:text-lg lg:text-2xl font-serif font-bold text-[#1B4332]">{currentSubFactor.name} Quiz</h3>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setShowSubFactorQuiz(false)}
                                                        className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#1B4332]/40 hover:text-[#1B4332]"
                                                    >
                                                        Review Content
                                                    </Button>
                                                </div>

                                                <QuizModule
                                                    questions={currentSubFactor.quiz.map(q => ({
                                                        question: q.question,
                                                        options: q.options,
                                                        answer: q.answer,
                                                        explanation: q.explanation || ""
                                                    }))}
                                                    onPass={async (score) => {
                                                        const quizKey = `quiz_passed_subfactor_${activeSubFactorIdx}`;
                                                        markGroundingCompleted(moduleData.id, quizKey);
                                                        const percentageScore = currentSubFactor.quiz ? Math.round((score / currentSubFactor.quiz.length) * 100) : 100;
                                                        setGroundingScore(moduleData.id, quizKey, percentageScore);

                                                        if (userId) {
                                                            await firebaseService.fellow.trackGroundingContent(userId, moduleData.id, quizKey);
                                                        }
                                                        setShowSubFactorQuiz(false);
                                                        if (activeSubFactorIdx < partOne.sub_factors.length - 1) {
                                                            setActiveSubFactorIdx(prev => prev + 1);
                                                        }
                                                    }}
                                                    onFail={() => { }}
                                                    activePhase="believe"
                                                />
                                            </div>
                                        ) : (
                                            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                                {/* Video Section */}
                                                <div className="space-y-3 sm:space-y-4">
                                                    {(currentSubFactor.video_urls && currentSubFactor.video_urls.length > 0) ? (
                                                        <div className={cn(
                                                            "grid gap-3 sm:gap-4 lg:gap-6",
                                                            currentSubFactor.video_urls.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                                                        )}>
                                                            {currentSubFactor.video_urls.map((url, vIdx) => (
                                                                <div key={vIdx} className="aspect-video bg-[#1B4332] relative group rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
                                                                    {url ? (
                                                                        <iframe
                                                                            src={getYouTubeEmbedUrl(url)}
                                                                            className="w-full h-full"
                                                                            allowFullScreen
                                                                            onLoad={() => trackVideo(url)}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex flex-col items-center justify-center text-white/20 p-4 sm:p-8 lg:p-12 text-center">
                                                                            <Video className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 mb-2 sm:mb-3 lg:mb-4 opacity-10" />
                                                                            <p className="font-serif italic text-xs sm:text-sm lg:text-lg opacity-40">Video path pending...</p>
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 lg:top-8 lg:left-8">
                                                                        <Badge className="bg-black/50 backdrop-blur-md text-white border-0 px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1 lg:py-2 rounded-md sm:rounded-lg lg:rounded-xl flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                                                                            <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-[#C5A059]" />
                                                                            <span className="text-[7px] sm:text-[8px] lg:text-[10px] uppercase font-black tracking-widest">
                                                                                {currentSubFactor.video_urls.length > 1 ? `Video ${vIdx + 1}` : "Unit Video"}
                                                                            </span>
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="aspect-video bg-[#1B4332] relative group rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 p-4 sm:p-8 lg:p-12 text-center">
                                                                <Video className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 mb-2 sm:mb-3 lg:mb-4 opacity-10" />
                                                                <p className="font-serif italic text-xs sm:text-sm lg:text-lg">Curated video content for this unit is currently being finalized.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Article and Context - FULLY RESPONSIVE */}
                                                <div className="p-4 sm:p-8 lg:p-12 space-y-4 sm:space-y-8 lg:space-y-12">
                                                    <div className="flex flex-col space-y-4 sm:space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_400px] lg:gap-12">
                                                        {/* Text Content */}
                                                        <div className="space-y-3 sm:space-y-5 lg:space-y-8">
                                                            <div className="space-y-1.5 sm:space-y-2 lg:space-y-4">
                                                                <p className="text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-[#C5A059]">Core Topic</p>
                                                                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-serif font-bold text-[#1B4332] leading-tight">
                                                                    {currentSubFactor.name}
                                                                </h2>
                                                            </div>

                                                            <div className="pt-3 sm:pt-5 lg:pt-8 border-t border-[#E8E4D8]">
                                                                <p className="text-[#1B4332]/70 font-serif leading-relaxed text-xs sm:text-sm lg:text-base xl:text-lg italic">
                                                                    Explore the fundamental principles of {currentSubFactor.name} through the provided video and article materials. Complete the reflection quiz to proceed.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Articles */}
                                                        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                                                            {currentSubFactor.articles && currentSubFactor.articles.length > 0 && currentSubFactor.articles.map((art, artIdx) => (
                                                                <a
                                                                    key={artIdx}
                                                                    href={art.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={() => trackArticle(art.link)}
                                                                    className="block bg-[#FDFCF6] rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden group hover:border-[#C5A059] transition-all duration-500 hover:shadow-2xl"
                                                                >
                                                                    <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                                                                        {art.image_url ? (
                                                                            <img
                                                                                src={art.image_url}
                                                                                alt={art.title}
                                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-[#1B4332]/5">
                                                                                <FileText className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#1B4332]/10" />
                                                                            </div>
                                                                        )}
                                                                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 lg:top-4 lg:left-4">
                                                                            <Badge className="bg-[#C5A059] text-[#1B4332] border-0 font-black text-[7px] sm:text-[8px] lg:text-[9px] uppercase tracking-widest">
                                                                                {artIdx === 0 ? "Primary Source" : "Reference Read"}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-3 sm:p-5 lg:p-8 space-y-1.5 sm:space-y-2 lg:space-y-4">
                                                                        <h4 className="text-sm sm:text-base lg:text-xl font-serif font-bold text-[#1B4332] group-hover:text-[#C5A059] transition-colors leading-snug line-clamp-2">
                                                                            {art.title || "Read Foundational Article"}
                                                                        </h4>
                                                                        <div className="flex items-center text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059] gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-[#E8E4D8]">
                                                                            Open Resource <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                        </div>
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Bottom action bar */}
                                                    <div className="pt-4 sm:pt-6 lg:pt-12 border-t-2 border-dashed border-[#E8E4D8] flex flex-col gap-4 sm:gap-5 lg:gap-8">
                                                        <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl bg-[#C5A059]/10 flex items-center justify-center border border-[#C5A059]/20 shrink-0">
                                                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#C5A059]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase text-[#C5A059]">Ready to Proceed?</p>
                                                                <p className="text-[10px] sm:text-xs lg:text-sm font-bold text-[#1B4332]/60">Complete the reflection quiz to unlock the next unit.</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 lg:gap-4">
                                                            {currentSubFactor.quiz && currentSubFactor.quiz.length > 0 && (
                                                                isUnitQuizPassed ? (
                                                                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 bg-[#1B4332]/5 text-[#1B4332] rounded-lg sm:rounded-xl lg:rounded-2xl border border-green-500/30">
                                                                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600 shrink-0" />
                                                                        <div>
                                                                            <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Quiz Completed</p>
                                                                            <p className="text-[10px] sm:text-xs lg:text-sm font-bold">Score: {groundingScores[moduleData.id]?.[`quiz_passed_subfactor_${activeSubFactorIdx}`] ?? "100"}%</p>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        disabled={!isCurrentUnitContentDone}
                                                                        onClick={() => setShowSubFactorQuiz(true)}
                                                                        className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-7 bg-[#C5A059] text-[#1B4332] text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] lg:tracking-[0.2em] hover:bg-[#1B4332] hover:text-white transition-all rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 w-full sm:w-auto"
                                                                    >
                                                                        {!isCurrentUnitContentDone ? <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" /> : <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />}
                                                                        Take Unit Quiz
                                                                    </Button>
                                                                )
                                                            )}

                                                            {(isUnitQuizPassed || !currentSubFactor.quiz || currentSubFactor.quiz.length === 0) && (
                                                                <Button
                                                                    onClick={handleNextSubFactor}
                                                                    className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-7 bg-[#1B4332] text-white text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] lg:tracking-[0.2em] hover:bg-[#C5A059] transition-all rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl flex items-center justify-center gap-2 sm:gap-3 group/nav w-full sm:w-auto"
                                                                >
                                                                    <span className="truncate text-[9px] sm:text-[10px] lg:text-xs">
                                                                        {activeSubFactorIdx === partOne.sub_factors.length - 1
                                                                            ? (completedItems.has('part_one_assessment_passed') ? "Proceed to Part II" : "Start Final Assessment")
                                                                            : "Move to Next Unit"}
                                                                    </span>
                                                                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 group-hover/nav:translate-x-2 transition-transform shrink-0" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* PART II: INTERNAL DOMAIN */
                    <div className="space-y-4 sm:space-y-8 lg:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Part II Header */}
                        <div className="bg-[#1B4332] rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] p-4 sm:p-8 lg:p-12 text-white shadow-2xl border-4 border-[#C5A059]/20 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
                                    <span className="h-px w-6 sm:w-8 lg:w-12 bg-[#C5A059]"></span>
                                    <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#C5A059]">Internal Domain</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-serif font-bold mb-2 sm:mb-3 lg:mb-4 leading-tight">{partTwo.name}</h2>
                                <p className="text-white/60 max-w-2xl text-xs sm:text-sm lg:text-base xl:text-lg leading-relaxed font-serif italic">
                                    {partTwo.description}
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 p-4 sm:p-8 lg:p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                                <Building2 className="w-28 h-28 sm:w-40 sm:h-40 lg:w-[300px] lg:h-[300px]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[350px_1fr] gap-4 sm:gap-8 lg:gap-12 items-start">
                            {/* Lateral Sidebar */}
                            <aside className="space-y-2 sm:space-y-3 lg:space-y-4 lg:sticky lg:top-36">
                                <div className="pl-3 sm:pl-4 border-l-4 border-[#C5A059] mb-3 sm:mb-6 lg:mb-8">
                                    <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Navigation</p>
                                    <h3 className="text-base sm:text-lg lg:text-xl font-serif font-bold text-[#1B4332]">Domain Factors</h3>
                                </div>

                                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-3 px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0 snap-x lg:snap-none scrollbar-none">
                                    <button
                                        onClick={() => setActivePartTwoSubTab('videos')}
                                        className={cn(
                                            "text-left p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl transition-all duration-300 flex items-center justify-between group snap-start",
                                            "min-w-[170px] sm:min-w-[200px] lg:min-w-0 w-auto lg:w-full shrink-0 lg:shrink",
                                            activePartTwoSubTab === 'videos'
                                                ? "bg-white border-2 border-[#C5A059] shadow-xl lg:translate-x-4"
                                                : "bg-white/40 border border-[#E8E4D8] hover:border-[#C5A059]/40"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                            <div className={cn(
                                                "w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center transition-all shrink-0",
                                                activePartTwoSubTab === 'videos'
                                                    ? "bg-[#1B4332] text-white"
                                                    : "bg-[#FDFCF6] text-[#1B4332]/30"
                                            )}>
                                                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-[11px] sm:text-xs lg:text-sm font-bold transition-colors",
                                                    activePartTwoSubTab === 'videos' ? "text-[#1B4332]" : "text-[#1B4332]/40"
                                                )}>
                                                    Strategic Addresses
                                                </p>
                                                <p className="text-[7px] sm:text-[8px] lg:text-[9px] uppercase tracking-widest text-[#C5A059] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
                                                    Video Session
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setActivePartTwoSubTab('documents')}
                                        className={cn(
                                            "text-left p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl transition-all duration-300 flex items-center justify-between group snap-start",
                                            "min-w-[170px] sm:min-w-[200px] lg:min-w-0 w-auto lg:w-full shrink-0 lg:shrink",
                                            activePartTwoSubTab === 'documents'
                                                ? "bg-white border-2 border-[#C5A059] shadow-xl lg:translate-x-4"
                                                : "bg-white/40 border border-[#E8E4D8] hover:border-[#C5A059]/40"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                            <div className={cn(
                                                "w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center transition-all shrink-0",
                                                activePartTwoSubTab === 'documents'
                                                    ? "bg-[#1B4332] text-white"
                                                    : "bg-[#FDFCF6] text-[#1B4332]/30"
                                            )}>
                                                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-[11px] sm:text-xs lg:text-sm font-bold transition-colors",
                                                    activePartTwoSubTab === 'documents' ? "text-[#1B4332]" : "text-[#1B4332]/40"
                                                )}>
                                                    Internal Factors
                                                </p>
                                                <p className="text-[7px] sm:text-[8px] lg:text-[9px] uppercase tracking-widest text-[#C5A059] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
                                                    Document Session
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <div className="mt-3 sm:mt-5 lg:mt-8 p-3 sm:p-4 lg:p-6 bg-[#1B4332] rounded-xl sm:rounded-2xl lg:rounded-3xl text-white shadow-2xl border-2 border-[#C5A059]/30 hidden sm:block">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 lg:mb-4">
                                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-[#C5A059]" />
                                        <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Instructions</span>
                                    </div>
                                    <p className="text-[10px] sm:text-xs lg:text-sm font-serif italic text-white/70 leading-relaxed">
                                        Review both the Strategic Addresses and Internal Factors to gain a comprehensive understanding of the internal domain.
                                    </p>
                                </div>
                            </aside>

                            {/* Main Content Area */}
                            <div className="space-y-4 sm:space-y-8 lg:space-y-12 min-w-0">
                                {activePartTwoSubTab === 'videos' ? (
                                    <div className="space-y-4 sm:space-y-8 lg:space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                                        <div className="bg-white rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] border-2 border-[#E8E4D8] p-4 sm:p-8 lg:p-12 shadow-2xl overflow-hidden relative">
                                            <div className="relative z-10 space-y-4 sm:space-y-6 lg:space-y-10">
                                                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                                    <div className="w-9 h-9 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl lg:rounded-[1.25rem] bg-[#1B4332] flex items-center justify-center shrink-0">
                                                        <Video className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-[#C5A059]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Section One</p>
                                                        <h3 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-serif font-black text-[#1B4332]">{partTwo.video_section.title}</h3>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:gap-12">
                                                    {partTwo.video_section.sub_factors.map((item, idx) => (
                                                        <div key={item.id} className="space-y-3 sm:space-y-5 lg:space-y-8 p-1 bg-[#FDFCF6] rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] border border-[#E8E4D8] overflow-hidden">
                                                            <div className="p-3 sm:p-5 lg:p-8 pb-0">
                                                                <h4 className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-serif font-bold text-[#1B4332] leading-tight flex items-center gap-2 sm:gap-3 lg:gap-4">
                                                                    <span className="text-[#C5A059] font-black text-sm sm:text-base lg:text-lg">0{idx + 1}</span>
                                                                    <span className="line-clamp-2">{item.name}</span>
                                                                </h4>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 p-2 sm:p-4 lg:p-6">
                                                                {item.video_urls.map((url, vIdx) => (
                                                                    <div key={vIdx} className="aspect-video rounded-lg sm:rounded-xl lg:rounded-[2rem] overflow-hidden bg-black shadow-lg relative group/video border border-[#E8E4D8]">
                                                                        {url ? (
                                                                            <iframe
                                                                                className="absolute inset-0 w-full h-full"
                                                                                src={getYouTubeEmbedUrl(url)}
                                                                                allowFullScreen
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex flex-col items-center justify-center text-white/10 bg-[#1B4332]">
                                                                                <Video className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 mb-2 sm:mb-3 lg:mb-4 opacity-5" />
                                                                                <p className="font-serif italic text-[9px] sm:text-[10px] lg:text-xs">Video content pending...</p>
                                                                            </div>
                                                                        )}
                                                                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 lg:top-4 lg:left-4">
                                                                            <Badge className="bg-black/60 backdrop-blur-md text-[#C5A059] border-0 px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 font-black text-[6px] sm:text-[7px] lg:text-[8px] uppercase tracking-widest border border-white/10">
                                                                                Part {vIdx + 1}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 sm:space-y-8 lg:space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                                        <div className="bg-white rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] border-2 border-[#E8E4D8] shadow-2xl overflow-hidden">
                                            <div className="p-4 sm:p-8 lg:p-12 space-y-6 sm:space-y-8 lg:space-y-10">
                                                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                                    <div className="w-9 h-9 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl lg:rounded-[1.25rem] bg-[#1B4332] flex items-center justify-center shrink-0">
                                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-[#C5A059]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Section Two</p>
                                                        <h3 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-serif font-black text-[#1B4332]">{partTwo.document_section.title}</h3>
                                                    </div>
                                                </div>

                                                <div className="space-y-8 sm:space-y-12 lg:space-y-16">
                                                    {partTwo.document_section.factors.map((item, idx) => (
                                                        <div key={item.id} className="space-y-4 sm:space-y-6 lg:space-y-10 group">
                                                            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                                                                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl bg-[#FDFCF6] flex items-center justify-center border-2 border-[#E8E4D8] group-hover:border-[#C5A059] transition-all shrink-0">
                                                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#C5A059]" />
                                                                </div>
                                                                <h4 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-serif font-bold text-[#1B4332] tracking-tight line-clamp-2">{item.name}</h4>
                                                            </div>

                                                            {/* Document Content + Resource Card - FULLY RESPONSIVE */}
                                                            <div className="flex flex-col space-y-4 sm:space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_260px] xl:grid-cols-[1fr_300px] lg:gap-8">
                                                                {/* Markdown Content */}
                                                                <div className="bg-[#FDFCF6] p-4 sm:p-6 lg:p-10 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] border-2 border-[#E8E4D8] relative overflow-hidden group-hover:border-[#C5A059]/30 transition-all shadow-inner">
                                                                    <div className="prose prose-sm max-w-none text-[#1B4332]/80 font-serif leading-relaxed italic relative z-10">
                                                                        {item.markdown ? (
                                                                            <ReactMarkdown
                                                                                components={{
                                                                                    h1: ({ node, ...props }) => <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black uppercase mb-3 sm:mb-4 lg:mb-6 text-[#1B4332] border-b-2 border-[#C5A059]/20 pb-2" {...props} />,
                                                                                    h2: ({ node, ...props }) => <h2 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold uppercase mb-2 sm:mb-3 lg:mb-4 text-[#1B4332]" {...props} />,
                                                                                    p: ({ node, ...props }) => <p className="mb-2 sm:mb-3 lg:mb-4 leading-relaxed text-xs sm:text-sm lg:text-base" {...props} />,
                                                                                    strong: ({ node, ...props }) => <strong className="font-black text-primary" {...props} />,
                                                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 sm:pl-5 lg:pl-6 mb-2 sm:mb-3 lg:mb-4 space-y-1 sm:space-y-1.5 lg:space-y-2" {...props} />,
                                                                                    li: ({ node, ...props }) => <li className="pl-0.5 sm:pl-1 text-xs sm:text-sm lg:text-base" {...props} />,
                                                                                }}
                                                                            >
                                                                                {item.markdown}
                                                                            </ReactMarkdown>
                                                                        ) : (
                                                                            <div className="flex flex-col items-center justify-center py-6 sm:py-8 lg:py-10 text-[#1B4332]/20">
                                                                                <PenLine className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-2 sm:mb-3 lg:mb-4 opacity-10" />
                                                                                <p className="font-serif italic text-xs sm:text-sm">Analysis pending...</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Resource Card */}
                                                                <div className="space-y-4 sm:space-y-6">
                                                                    <div className="bg-[#1B4332] p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] flex flex-col items-center text-center space-y-3 sm:space-y-4 lg:space-y-6 relative overflow-hidden h-full shadow-xl">
                                                                        <div className="absolute top-0 right-0 p-4 sm:p-6 lg:p-10 opacity-5 pointer-events-none rotate-12">
                                                                            <Globe className="w-20 h-20 sm:w-28 sm:h-28 lg:w-[200px] lg:h-[200px] text-white" />
                                                                        </div>

                                                                        <div className="relative z-10 space-y-3 sm:space-y-4 lg:space-y-6 flex flex-col h-full">
                                                                            <div className="w-9 h-9 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto border border-white/20 backdrop-blur-xl">
                                                                                <Globe className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-[#C5A059]" />
                                                                            </div>
                                                                            <div className="space-y-1 sm:space-y-1.5 lg:space-y-2">
                                                                                <p className="text-[7px] sm:text-[8px] lg:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#C5A059]">Resource</p>
                                                                                <h5 className="text-sm sm:text-base lg:text-lg xl:text-xl font-serif font-bold text-white leading-tight line-clamp-3">
                                                                                    {item.article_title || "Reference Material"}
                                                                                </h5>
                                                                            </div>

                                                                            <p className="text-white/40 text-[9px] sm:text-[10px] lg:text-xs font-serif italic leading-relaxed flex-grow hidden sm:block">
                                                                                Access the complete foundational document for deeper strategic immersion.
                                                                            </p>

                                                                            {item.article_link ? (
                                                                                <a
                                                                                    href={item.article_link}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1.5 sm:gap-2 lg:gap-3 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 bg-[#C5A059] text-[#1B4332] rounded-lg sm:rounded-xl lg:rounded-2xl text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] lg:tracking-[0.2em] hover:bg-white transition-all shadow-xl w-full justify-center"
                                                                                >
                                                                                    Open Resource
                                                                                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                                                                                </a>
                                                                            ) : (
                                                                                <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-2 border-dashed border-white/20 rounded-lg sm:rounded-xl lg:rounded-2xl text-white/30 text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest w-full">
                                                                                    Link Pending
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Footer */}
            <footer className="fixed bottom-0 left-0 w-full bg-[#1B4332] text-white py-2.5 sm:py-3 lg:py-4 px-3 sm:px-6 lg:px-8 border-t-2 sm:border-t-4 border-[#C5A059]/30 z-[60] shadow-[0_-20px_50px_rgba(27,67,50,0.4)]">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0">
                            <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-[#C5A059] whitespace-nowrap">Part {activePart === 'part_one' ? 'I' : 'II'}</span>
                            <span className="h-3 sm:h-4 w-px bg-white/20 hidden sm:block"></span>
                            <span className="text-[8px] sm:text-[9px] lg:text-[10px] text-white/60 font-medium italic font-serif hidden md:block truncate">Deep Grounding via {activePart === 'part_one' ? 'External Drivers' : 'Internal Frameworks'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
                        <p className="text-[8px] sm:text-[9px] lg:text-[11px] font-black uppercase tracking-wider sm:tracking-widest text-[#C5A059] animate-pulse hidden sm:block">Session Active</p>
                        {activePart === 'part_two' && (
                            <Button
                                onClick={onBack}
                                className="bg-white text-[#1B4332] hover:bg-[#C5A059] hover:text-white px-3 sm:px-5 lg:px-8 h-7 sm:h-8 lg:h-10 rounded-full text-[7px] sm:text-[8px] lg:text-[10px] font-black uppercase tracking-wider sm:tracking-widest transition-all whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Mark All as Studied</span>
                                <span className="sm:hidden">Complete</span>
                            </Button>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};