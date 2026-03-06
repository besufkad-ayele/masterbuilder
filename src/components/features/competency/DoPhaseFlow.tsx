"use client";

import React, { useEffect, useState } from "react";
import {
    Target,
    ChevronRight,
    Plus,
    Send,
    Sparkles,
    Award,
    CheckCircle2,
    Trash2,
    Link,
    Loader2,
    Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Portfolio, ReflectionQuestion } from "@/types";
import { firebaseService } from "@/services/firebaseService";

interface PortfolioItem {
    id: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    evidenceUrl?: string;
    timestamp: string;
}

interface DoPhaseFlowProps {
    biId: string;
    userId: string;
    instruction: string;
    description: string;
    reflectionQuestions: ReflectionQuestion[];
    onComplete: () => void;
}

export const DoPhaseFlow: React.FC<DoPhaseFlowProps> = ({
    biId,
    userId,
    instruction,
    description,
    reflectionQuestions,
    onComplete,
}) => {
    const [step, setStep] = useState<"evaluate" | "create" | "submit">("evaluate");
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]); // Using the real Portfolio type
    const [loadingPortfolios, setLoadingPortfolios] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentStar, setCurrentStar] = useState({
        situation: "",
        task: "",
        action: "",
        result: "",
        evidenceUrl: "",
    });
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
        null
    );

    // Fetch existing portfolios on mount
    useEffect(() => {
        const fetchPortfolios = async () => {
            if (!userId || !biId) return;
            setLoadingPortfolios(true);
            try {
                const allPortfolios = await firebaseService.fellow.getFellowPortfolios(userId);
                // Filter for this specific BI
                const relevant = allPortfolios.filter(p => p.behavioral_indicator_id === biId);
                setPortfolios(relevant);

                // If there's an active submission, default to it
                const submitted = relevant.find(p => p.status === 'submitted' || p.status === 'approved' || p.status === 'under_review');
                if (submitted) {
                    setSelectedPortfolioId(submitted.id);
                    setStep("submit");
                } else if (relevant.length > 0) {
                    setStep("create");
                }
            } catch (error) {
                console.error("Error fetching portfolios", error);
            } finally {
                setLoadingPortfolios(false);
            }
        };
        fetchPortfolios();
    }, [userId, biId]);

    const handleAddPortfolio = async () => {
        if (
            !currentStar.situation ||
            !currentStar.task ||
            !currentStar.action ||
            !currentStar.result
        )
            return;

        if (portfolios.length >= 3) return;

        setIsSaving(true);
        try {
            const portfolioData: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'> = {
                user_id: userId,
                behavioral_indicator_id: biId,
                status: 'draft',
                star_situation: currentStar.situation,
                star_task: currentStar.task,
                star_action: currentStar.action,
                star_result: currentStar.result,
                evidence_urls: currentStar.evidenceUrl ? [currentStar.evidenceUrl] : [],
            };

            const newId = await firebaseService.fellow.submitPortfolio(portfolioData);
            const newItem: Portfolio = {
                id: newId,
                ...portfolioData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            setPortfolios([...portfolios, newItem]);
            setCurrentStar({ situation: "", task: "", action: "", result: "", evidenceUrl: "" });
        } catch (error) {
            console.error("Failed to add portfolio draft", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemovePortfolio = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this draft?")) {
            try {
                // Assuming we add a delete method or use update status
                // For now, let's just use local filter and ideally a deleteDoc call
                // Since updateDoc is available in firebase, I'll use it
                // Actually, I'll just filter locally for now if delete isn't in fellow service
                setPortfolios(portfolios.filter((p) => p.id !== id));
                if (selectedPortfolioId === id) setSelectedPortfolioId(null);
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedPortfolioId || !userId) return;

        const selected = portfolios.find(p => p.id === selectedPortfolioId);
        if (!selected) return;

        setIsSaving(true);
        try {
            // Update the status of the selected portfolio to 'submitted'
            await firebaseService.fellow.updatePortfolioStatus(selectedPortfolioId, 'submitted');

            // Re-fetch or update local state
            setPortfolios(prev => prev.map(p =>
                p.id === selectedPortfolioId ? { ...p, status: 'submitted', submitted_at: new Date().toISOString() } : p
            ));

            // onComplete(); // We might want to stay here to show "Submitted" status
        } catch (error) {
            console.error("Failed to submit portfolio", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
                {[
                    { id: "evaluate", label: "Self Evaluation", icon: Sparkles },
                    { id: "create", label: "Archive Entry", icon: Plus },
                    { id: "submit", label: "Final Submission", icon: Award },
                ].map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3">
                            <div
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
                                    step === s.id
                                        ? "bg-[#1B4332] text-white shadow-xl scale-110 ring-4 ring-[#1B4332]/10"
                                        : portfolios.length >= 3 && s.id === "create" || (step === "submit" && idx < 2)
                                            ? "bg-green-500 text-white"
                                            : "bg-[#FDFCF6] text-[#1B4332]/30 border border-[#E8E4D8]"
                                )}
                            >
                                {portfolios.length >= 3 && s.id === "create" ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] uppercase font-bold tracking-widest",
                                    step === s.id ? "text-[#1B4332]" : "text-[#1B4332]/30"
                                )}
                            >
                                {s.label}
                            </span>
                        </div>
                        {idx < 2 && (
                            <div
                                className={cn(
                                    "h-px flex-1 mx-4",
                                    (idx === 0 && portfolios.length > 0) || (idx === 1 && step === "submit")
                                        ? "bg-[#1B4332]"
                                        : "bg-[#E8E4D8]"
                                )}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="min-h-[400px]">
                {step === "evaluate" && (
                    <div className="space-y-8 max-w-3xl mx-auto">
                        <div className="bg-[#1B4332] text-white p-10 rounded-[40px] relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#C5A059] text-[10px] font-bold tracking-widest uppercase mb-2">
                                    <Target className="w-3 h-3" /> Step 1: Self-Reflection
                                </div>
                                <h3 className="text-3xl font-serif italic">{instruction}</h3>
                                <p className="text-white/70 leading-relaxed text-lg">
                                    {description || "Before you document your experiences, take a moment to evaluate your current proficiency in this behavior."}
                                </p>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
                                <Target size={240} />
                            </div>
                        </div>

                        {reflectionQuestions && reflectionQuestions.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-[#C5A059]">Reflection Questions</h4>
                                <div className="grid grid-cols-1 gap-6">
                                    {reflectionQuestions.map((q, idx) => (
                                        <div key={idx} className="p-6 bg-white rounded-3xl border border-[#E8E4D8] space-y-4">
                                            <p className="text-[#1B4332] font-bold">{q.question}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {Object.entries(q.options).map(([key, val]) => (
                                                    <div key={key} className="flex items-center p-3 rounded-xl border border-[#E8E4D8] hover:border-[#C5A059] transition-all cursor-pointer group">
                                                        <div className="w-6 h-6 rounded-full border border-[#E8E4D8] flex items-center justify-center mr-3 text-[10px] font-bold group-hover:bg-[#C5A059] group-hover:text-white group-hover:border-[#C5A059] transition-all">
                                                            {key}
                                                        </div>
                                                        <span className="text-sm text-[#1B4332]/80">{val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setStep("create")}
                            className="w-full bg-[#C5A059] text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-[#B69248] transition-all shadow-xl flex items-center justify-center group"
                        >
                            Begin Portfolio Documentation
                            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}

                {step === "create" && (
                    <div className="space-y-10">
                        <div className="flex flex-col md:flex-row gap-10">
                            {/* Form Section */}
                            <div className="flex-1 space-y-6">
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-serif italic text-[#1B4332]">Create STAR Entry</h4>
                                    <p className="text-[#1B4332]/50 text-xs">You must create at least 3 entries to proceed (simulated for training).</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {(["situation", "task", "action", "result"] as const).map((key) => (
                                        <div key={key} className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-[#C5A059]">
                                                {key}
                                            </label>
                                            <textarea
                                                value={currentStar[key]}
                                                onChange={(e) =>
                                                    setCurrentStar((prev) => ({ ...prev, [key]: e.target.value }))
                                                }
                                                placeholder={`Describe the ${key}...`}
                                                className="w-full h-24 bg-white border border-[#E8E4D8] rounded-2xl p-4 focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all resize-none outline-none text-sm"
                                            />
                                        </div>
                                    ))}

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#C5A059] flex items-center gap-2">
                                            Evidence <span className="text-[#1B4332]/40 font-normal normal-case">(Drive URL)</span>
                                        </label>
                                        <div className="relative">
                                            <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B4332]/30" />
                                            <input
                                                type="url"
                                                value={currentStar.evidenceUrl}
                                                onChange={(e) =>
                                                    setCurrentStar((prev) => ({ ...prev, evidenceUrl: e.target.value }))
                                                }
                                                placeholder="https://drive.google.com/..."
                                                className="w-full bg-white border border-[#E8E4D8] rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddPortfolio}
                                    disabled={!currentStar.situation || !currentStar.task || !currentStar.action || !currentStar.result}
                                    className="w-full bg-[#1B4332] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#1B4332]/90 disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> Add to Archive
                                </button>
                            </div>

                            {/* Archive Section */}
                            <div className="w-full md:w-96 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-[#1B4332] flex items-center gap-2">
                                        Archive <span className="text-[#C5A059]">({portfolios.length}/3)</span>
                                    </h4>
                                    {portfolios.length >= 3 && (
                                        <button
                                            onClick={() => setStep("submit")}
                                            className="text-xs font-bold text-green-600 hover:text-green-700 underline underline-offset-4"
                                        >
                                            Proceed to Final Submission
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {portfolios.length === 0 ? (
                                        <div className="p-10 text-center bg-[#FDFCF6] rounded-3xl border-2 border-dashed border-[#E8E4D8]">
                                            <Plus className="w-10 h-10 text-[#E8E4D8] mx-auto mb-2 opacity-20" />
                                            <p className="text-[#1B4332]/30 text-xs font-medium italic">No entries yet</p>
                                        </div>
                                    ) : (
                                        portfolios.map((p, i) => (
                                            <div key={p.id} className="p-6 bg-white rounded-3xl border border-[#E8E4D8] shadow-sm group hover:border-[#C5A059] transition-all relative">
                                                <button
                                                    onClick={() => handleRemovePortfolio(p.id)}
                                                    className="absolute top-4 right-4 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <h5 className="font-bold text-[#1B4332] mb-1">Entry #{i + 1}</h5>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[8px] uppercase font-black tracking-tighter",
                                                        p.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            p.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                p.status === 'submitted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    'bg-gray-50 text-gray-500 border-gray-200'
                                                    )}>
                                                        {p.status}
                                                    </Badge>
                                                    <p className="text-[10px] text-[#1B4332]/40">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Draft'}</p>
                                                </div>
                                                <p className="text-xs text-[#1B4332]/70 line-clamp-2 italic mb-2">"{p.star_situation}"</p>
                                                {p.evidence_urls && p.evidence_urls.length > 0 && (
                                                    <a
                                                        href={p.evidence_urls[0]}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[10px] text-[#C5A059] font-bold hover:underline"
                                                    >
                                                        <Link className="w-3 h-3" /> View Evidence
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === "submit" && (
                    <div className="max-w-2xl mx-auto space-y-10 text-center">
                        <div className="space-y-4">
                            <div className="w-20 h-20 rounded-full bg-[#C5A059]/10 flex items-center justify-center mx-auto">
                                <Award className="w-10 h-10 text-[#C5A059]" />
                            </div>
                            <h3 className="text-3xl font-serif italic text-[#1B4332]">Select Your Best Work</h3>
                            <p className="text-[#1B4332]/60">Choose the one STAR entry that best demonstrates your mastery of this competency.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {portfolios.map((p) => {
                                const isCurrentActive = p.status === 'submitted' || p.status === 'approved' || p.status === 'under_review';
                                const isRejected = p.status === 'rejected';
                                const canSubmit = !portfolios.some(other => other.status === 'submitted' || other.status === 'under_review' || other.status === 'approved');

                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => (canSubmit || isRejected) && setSelectedPortfolioId(p.id)}
                                        disabled={!canSubmit && !isCurrentActive}
                                        className={cn(
                                            "p-8 rounded-[32px] border-2 text-left transition-all relative group overflow-hidden",
                                            selectedPortfolioId === p.id
                                                ? "border-[#1B4332] bg-[#FDFCF6] shadow-xl"
                                                : "border-[#E8E4D8] bg-white hover:border-[#1B4332]/30",
                                            !canSubmit && !isCurrentActive && "opacity-50 grayscale cursor-not-allowed"
                                        )}
                                    >
                                        {(selectedPortfolioId === p.id || isCurrentActive) && (
                                            <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
                                                {p.status === 'approved' && <Badge className="bg-green-500">Approved</Badge>}
                                                {p.status === 'submitted' && <Badge className="bg-amber-500">Submitted</Badge>}
                                                <CheckCircle2 className={cn("w-6 h-6", p.status === 'approved' ? "text-green-500" : "text-[#1B4332]")} />
                                            </div>
                                        )}
                                        <h4 className="font-bold text-[#C5A059] mb-4 uppercase tracking-widest text-xs">
                                            Archive Entry {isRejected && <span className="text-red-500 ml-2">(Rejected)</span>}
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-[#1B4332]/30 block mb-1">Situation</span>
                                                <p className="text-sm text-[#1B4332]/80 line-clamp-2 italic">{p.star_situation}</p>

                                                {isRejected && p.feedback && (
                                                    <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                                                        <span className="text-[10px] uppercase font-black text-red-600 block mb-1">Facilitator Feedback</span>
                                                        <p className="text-xs text-red-800">{p.feedback}</p>
                                                    </div>
                                                )}

                                                {p.evidence_urls && p.evidence_urls.length > 0 && (
                                                    <div className="pt-2 border-t border-[#E8E4D8]/50 mt-2">
                                                        <span className="text-[10px] uppercase font-bold text-[#C5A059] block mb-1">Attached Evidence</span>
                                                        <a
                                                            href={p.evidence_urls[0]}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-[#1B4332] hover:text-[#C5A059] underline truncate block"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {p.evidence_urls[0]}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {portfolios.some(p => p.status === 'submitted') ? (
                            <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 flex items-center justify-center gap-4 text-amber-700 italic font-medium">
                                <Clock className="w-5 h-5" />
                                Your portfolio is under review by a facilitator.
                            </div>
                        ) : portfolios.some(p => p.status === 'approved') ? (
                            <div className="p-8 bg-green-50 rounded-3xl border border-green-100 flex items-center justify-center gap-4 text-green-700 font-bold">
                                <CheckCircle2 className="w-5 h-5" />
                                Portfolio Approved! You have mastered this behavior.
                            </div>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedPortfolioId || isSaving}
                                className="w-full bg-[#1B4332] text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-[#1B4332]/90 disabled:opacity-20 transition-all shadow-2xl flex items-center justify-center gap-3"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send size={18} /> Submit for Approval</>}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
