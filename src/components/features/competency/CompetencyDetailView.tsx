"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from '@/lib/utils';
import { useRouter } from "next/navigation";

import { CompetencyLibrary, Wave } from "@/types";
import { MediaTabs, SubTabType } from "@/components/features/competency/MediaTabs";
import { BISidebar } from "@/components/features/competency/BISidebar";
import { PhaseTabs } from "@/components/features/competency/PhaseTabs";
import { PhaseHeader } from "@/components/features/competency/PhaseHeader";
import { DoPhaseFlow } from "@/components/features/competency/DoPhaseFlow";
import { VideoSection } from "@/components/features/competency/VideoSection";
import { ArticleSection } from "@/components/features/competency/ArticleSection";
import { QuizModule } from "@/components/features/competency/QuizModule";
import { Lock } from "lucide-react";
import { competencyService } from "@/services/competencyService";
import { firebaseService } from "@/services/firebaseService";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { PhaseProgress } from "@/types";

interface CompetencyDetailViewProps {
    competencyId: string;
    userId: string;
    wave?: Wave | null;
    onBack?: () => void;
}

export const CompetencyDetailView: React.FC<CompetencyDetailViewProps> = ({ competencyId, userId, wave, onBack }) => {
    const router = useRouter();
    const [competency, setCompetency] = useState<CompetencyLibrary | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch competency data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await competencyService.getLibraryItem(competencyId);
                setCompetency(data);
            } catch (error) {
                console.error("Failed to fetch competency details", error);
            } finally {
                setLoading(false);
            }
        };

        if (competencyId) {
            fetchData();
        }
    }, [competencyId]);

    // Domain state
    const [activeBIIndex, setActiveBIIndex] = useState(0);
    const [activePhase, setActivePhase] = useState<'believe' | 'know' | 'do'>('believe');
    const [unlockedPhases, setUnlockedPhases] = useState<Record<string, ('believe' | 'know' | 'do')[]>>({});
    const [completedSubTabs, setCompletedSubTabs] = useState<Record<string, SubTabType[]>>({});
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('video');
    const [phaseProgressData, setPhaseProgressData] = useState<PhaseProgress[]>([]);

    // Load user progress
    useEffect(() => {
        const fetchProgress = async () => {
            if (!userId) return;
            try {
                const progress = await firebaseService.fellow.getFellowProgress(userId);
                setPhaseProgressData(progress);

                // Reconstruct unlockedPhases and completedSubTabs from persistent storage
                const newUnlocked: Record<string, ('believe' | 'know' | 'do')[]> = {};
                const newCompleted: Record<string, SubTabType[]> = {};

                progress.forEach(p => {
                    const biId = p.behavioral_indicator_id;
                    const phase = p.phase_type;

                    // Only process progress items belonging to THIS competency
                    if (!biId.startsWith(`${competencyId}_`)) return;

                    // Extract the raw BI code (e.g., "BI1") for local UI mapping
                    const biCode = biId.replace(`${competencyId}_`, "");

                    if (p.completed_at || p.know_score !== undefined || p.believe_passed) {
                        const nextPhase = phase === 'believe' ? 'know' : (phase === 'know' ? 'do' : null);
                        if (nextPhase) {
                            if (!newUnlocked[biCode]) newUnlocked[biCode] = ['believe'];
                            if (!newUnlocked[biCode].includes(nextPhase as any)) {
                                newUnlocked[biCode].push(nextPhase as any);
                            }
                        }
                    }

                    // Map completed sub-tabs
                    const key = `${biCode}-${phase}`;
                    const completed: SubTabType[] = [];
                    if (p.video_completed) completed.push('video');
                    if (p.article_completed) completed.push('article');
                    if (p.completed_at || p.know_score !== undefined) completed.push('quiz');
                    newCompleted[key] = completed;
                });

                setUnlockedPhases(newUnlocked);
                setCompletedSubTabs(newCompleted);
            } catch (err) {
                console.error("Failed to fetch progress", err);
            }
        };

        fetchProgress();
    }, [userId, competencyId]);

    // Derived state from competency/BI - must be before early returns
    const behavioralIndicators = competency?.competency.behavioral_indicators || [];
    const currentBI = behavioralIndicators[activeBIIndex];
    const currentPhaseContent = (currentBI && activePhase !== 'do') ? currentBI.resources[activePhase as 'believe' | 'know'] : null;

    // Quiz questions from the phase-level quiz
    const quizQuestions = React.useMemo(() => {
        if (!currentPhaseContent || !currentPhaseContent.quiz) return [];
        return currentPhaseContent.quiz.map(q => ({
            question: q.question,
            options: Object.values(q.options).filter(opt => opt !== ""),
            answer: q.options[q.correct_answer as 'A' | 'B' | 'C' | 'D']
        }));
    }, [currentPhaseContent]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCF6] flex flex-col items-center justify-center p-4">
                <LoadingSpinner />
                <p className="mt-4 text-[#8B9B7E]">Loading competency content...</p>
            </div>
        );
    }

    if (!competency) {
        return (
            <div className="min-h-screen bg-[#FDFCF6] flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-[#1B4332]">Competency Not Found</h1>
                <p className="text-[#8B9B7E] mt-2">Could not load content for ID: {competencyId}</p>
                <button
                    onClick={onBack || (() => router.back())}
                    className="mt-6 px-6 py-2 bg-[#C5A059] text-white rounded-full flex items-center hover:bg-[#B69248] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
            </div>
        );
    }

    if (!currentBI) {
        return (
            <div className="min-h-screen bg-[#FDFCF6] flex flex-col items-center justify-center p-4">
                <h1 className="text-xl font-bold text-[#1B4332]">No Behavioral Indicators Found</h1>
                <button onClick={onBack || (() => router.back())} className="mt-4 text-[#C5A059]">Back</button>
            </div>
        );
    }

    const handleBISelect = (index: number) => {
        setActiveBIIndex(index);
        setActivePhase('believe');
        setActiveSubTab('video');
    };

    const isPhaseUnlocked = (phase: 'believe' | 'know' | 'do') => {
        // 1. Check administrative wave lock first
        if (wave?.phase_states) {
            const state = (wave.phase_states as any)[phase];
            if (state === 'locked') return false;
        }

        // 2. Check local progression
        if (phase === 'believe') return true;
        const unlocked = unlockedPhases[currentBI.code] || [];
        return unlocked.includes(phase);
    };

    const getProgressionKey = () => `${currentBI.code}-${activePhase}`;

    const handleSubTabComplete = async (tab: SubTabType) => {
        const biCode = currentBI.code;
        const uniqueBiId = `${competencyId}_${biCode}`;
        const key = getProgressionKey();
        const currentCompleted = completedSubTabs[key] || [];

        if (!currentCompleted.includes(tab)) {
            const nextCompleted = [...currentCompleted, tab];
            setCompletedSubTabs(prev => ({ ...prev, [key]: nextCompleted }));

            // Persist to DB
            try {
                const updates = {
                    [tab === 'video' ? 'video_completed' : 'article_completed']: true
                };
                await firebaseService.fellow.updatePhaseProgress(userId, uniqueBiId, activePhase, updates);

                // Update local state to avoid staleness
                setPhaseProgressData(prev => {
                    const existingIndex = prev.findIndex(p => p.behavioral_indicator_id === uniqueBiId && p.phase_type === activePhase);
                    if (existingIndex > -1) {
                        const updated = [...prev];
                        updated[existingIndex] = { ...updated[existingIndex], ...updates };
                        return updated;
                    }
                    return [...prev, { behavioral_indicator_id: uniqueBiId, phase_type: activePhase, ...updates } as any];
                });
            } catch (err) {
                console.error("Error saving sub-tab progress", err);
            }

            // Auto-switch to next tab
            if (tab === 'video') setActiveSubTab('article');
            else if (tab === 'article') setActiveSubTab('quiz');
        }
    };

    const handleQuizPass = async (score?: number) => {
        const biCode = currentBI.code;
        const uniqueBiId = `${competencyId}_${biCode}`;
        const nextPhase = activePhase === 'believe' ? 'know' : 'do';
        const key = getProgressionKey();

        // Update local state for UI responsiveness
        setUnlockedPhases((prev: Record<string, ('believe' | 'know' | 'do')[]>) => ({
            ...prev,
            [biCode]: [...(prev[biCode] || []), nextPhase as any]
        }));

        setCompletedSubTabs(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), 'quiz' as SubTabType]
        }));

        // Persist to DB
        try {
            const scorePercent = score !== undefined ? (score / quizQuestions.length) * 100 : 100;
            const updates: Partial<PhaseProgress> = {
                completed_at: new Date().toISOString(),
                know_score: scorePercent // Save score for all phases to enable persistent display
            };
            if (activePhase === 'believe') {
                updates.believe_passed = true;
            }

            await firebaseService.fellow.updatePhaseProgress(userId, uniqueBiId, activePhase, updates);

            // Update local state to avoid staleness
            setPhaseProgressData(prev => {
                const existingIndex = prev.findIndex(p => p.behavioral_indicator_id === uniqueBiId && p.phase_type === activePhase);
                if (existingIndex > -1) {
                    const updated = [...prev];
                    updated[existingIndex] = { ...updated[existingIndex], ...updates };
                    return updated;
                }
                return [...prev, { behavioral_indicator_id: uniqueBiId, phase_type: activePhase, ...updates } as any];
            });
        } catch (err) {
            console.error("Error saving quiz pass", err);
        }

        // Move to next phase
        setActivePhase(nextPhase as any);
        setActiveSubTab('video');
    };

    const handleQuizFail = async () => {
        const biCode = currentBI.code;
        const key = getProgressionKey();

        // Optionally persist failure if we want to track attempts, but user request 
        // implies they can go back and the buttons stay completed.
        // So we DON'T reset everything on fail, just don't advance.

        /* 
        setCompletedSubTabs(prev => ({
            ...prev,
            [key]: prev[key].filter(t => t !== 'quiz')
        }));
        */
        setActiveSubTab('video'); // Force back to videos
    };

    const handleUnitComplete = () => {
        if (activeBIIndex < behavioralIndicators.length - 1) {
            handleBISelect(activeBIIndex + 1);
        } else {
            if (onBack) {
                onBack();
            } else {
                router.push('/onboarding/competency-modules');
            }
        }
    };

    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return "";
        let videoId = "";
        try {
            if (url.includes("youtube.com/watch?v=")) {
                videoId = url.split("v=")[1].split("&")[0];
            } else if (url.includes("youtu.be/")) {
                videoId = url.split("youtu.be/")[1].split("?")[0];
            }
        } catch (e) {
            console.warn("Error parsing YouTube URL", url);
            return url;
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    };

    const currentCompletedSubTabs = completedSubTabs[getProgressionKey()] || [];

    return (
        <div className="bg-[#FDFCF6] text-[#1B4332] min-h-screen">
            <nav className="sticky top-0 z-50 bg-[#FDFCF6]/80 backdrop-blur-md border-b border-[#E8E4D8]">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button
                        onClick={onBack || (() => router.push('/onboarding/competency-modules'))}
                        className="group flex items-center text-[#1B4332] hover:text-[#C5A059] transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-white border border-[#E8E4D8] flex items-center justify-center mr-4 group-hover:border-[#C5A059] transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Back to Modules</span>
                    </button>

                    <div className="text-center hidden md:block">
                        <h2 className="text-xs uppercase tracking-[0.2em] text-[#C5A059] font-semibold mb-1">
                            Domain: {competency.competency_domain}
                        </h2>
                        <h1 className="text-xl font-bold font-serif italic uppercase">
                            {currentBI.code}: {currentBI.description ? currentBI.description.split('.')[0] : "Loading..."}
                        </h1>
                    </div>
                    <div className="w-10" />
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
                <BISidebar
                    behavioralIndicators={behavioralIndicators}
                    activeBIIndex={activeBIIndex}
                    onBISelect={handleBISelect}
                    competencyName={competency.competency.name}
                />

                <div className="flex-1 space-y-8 min-w-0">
                    <PhaseTabs
                        activePhase={activePhase}
                        onPhaseSelect={setActivePhase}
                        isPhaseUnlocked={isPhaseUnlocked}
                    />

                    <div className="relative bg-white rounded-3xl border border-[#E8E4D8] overflow-hidden shadow-sm min-h-[600px] flex flex-col">
                        <PhaseHeader activePhase={activePhase} />

                        {/* Overlay if platform locked */}
                        {wave?.phase_states && (wave.phase_states as any)[activePhase] === 'locked' && (
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                                <div className="size-20 rounded-[2.5rem] bg-white border border-[#E8E4D8] shadow-2xl flex items-center justify-center mb-8 animate-in zoom-in-50 duration-700">
                                    <Lock className="size-10 text-[#1B4332]" />
                                </div>
                                <h3 className="text-3xl font-bold text-[#1B4332] font-serif italic mb-4">Phase Locked by Admin</h3>
                                <p className="text-base text-[#1B4332]/70 max-w-sm leading-relaxed">
                                    This phase of the <span className="text-[#C5A059] font-bold">{wave.name}</span> track is currently restricted by your program administrator.
                                </p>
                            </div>
                        )}

                        <div className="p-12 flex-1 flex flex-col">
                            {activePhase === 'do' ? (
                                <DoPhaseFlow
                                    biId={`${competencyId}_${currentBI.code}`}
                                    userId={userId}
                                    instruction={currentBI.resources.do.instruction || "No instructions provided."}
                                    description={currentBI.resources.do.description || ""}
                                    reflectionQuestions={currentBI.resources.do.reflection_questions || []}
                                    onComplete={handleUnitComplete}
                                />
                            ) : (
                                <div className="space-y-8 flex-1 flex flex-col">
                                    <MediaTabs
                                        activeSubTab={activeSubTab}
                                        onSubTabSelect={(tab) => {
                                            if (tab === 'quiz' && (!currentCompletedSubTabs.includes('video') || !currentCompletedSubTabs.includes('article'))) {
                                                // Alert or toast could go here: "Finish videos and articles first"
                                                // return; // Allow for now to unblock testing
                                            }
                                            setActiveSubTab(tab);
                                        }}
                                        completedSubTabs={currentCompletedSubTabs}
                                    />

                                    <div className="flex-1">
                                        {activeSubTab === 'video' && (
                                            <VideoSection
                                                videos={((currentPhaseContent as any)?.videos || []).map((v: any) => ({
                                                    url: v.source || '',
                                                    title: v.title || '  '
                                                }))}
                                                getYouTubeEmbedUrl={getYouTubeEmbedUrl}
                                                onComplete={() => handleSubTabComplete('video')}
                                                isCompleted={currentCompletedSubTabs.includes('video')}
                                            />
                                        )}

                                        {activeSubTab === 'article' && (
                                            <ArticleSection
                                                articles={((currentPhaseContent as any)?.articles || []).map((a: any) => ({
                                                    url: a.source || '',
                                                    title: a.title || '  ',
                                                    image: a.cover_pic_link || ''
                                                }))}
                                                onComplete={() => handleSubTabComplete('article')}
                                                isCompleted={currentCompletedSubTabs.includes('article')}
                                            />
                                        )}

                                        {activeSubTab === 'quiz' && (
                                            <QuizModule
                                                questions={quizQuestions}
                                                onPass={handleQuizPass}
                                                onFail={handleQuizFail}
                                                activePhase={activePhase}
                                                initialScore={phaseProgressData.find(p => p.behavioral_indicator_id === `${competencyId}_${currentBI.code}` && p.phase_type === activePhase)?.know_score}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
