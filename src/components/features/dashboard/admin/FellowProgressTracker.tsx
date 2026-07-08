"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    FileText,
    Brain,
    Heart,
    GraduationCap,
    BookOpen,
    Waves,
    BarChart3,
    ChevronRight,
    CheckCircle2,
    Clock,
    X,
    Loader2,
    ExternalLink,
    AlertCircle,
    UserCircle,
    Star,
    Award as AwardIcon,
    TrendingUp,
    Award,
    ShieldCheck,
    ChevronDown,
    Menu,
    Check,
    Edit2,
} from "lucide-react";
import { FellowProgressService } from "@/services/FellowProgressService";
import { FellowService } from "@/services/FellowService";
import { ExamService, ExamAttempt, ExaminationAttempt } from "@/services/ExamService";
import {
    Portfolio,
    PhaseProgress,
    GroundingResult,
    WaveResult,
    PortfolioStatus,
    BehavioralIndicator,
    Competency,
    Wave,
    GroundingModule,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrackingView =
    | "portfolio"
    | "quiz"
    | "believe"
    | "detail"
    | "competency"
    | "wave"
    | "overall"
    | "performance";

interface FellowProgressTrackerProps {
    fellowId: string;
    fellowName: string;
    userId: string;
}

// ─── Components ───────────────────────────────────────────────────────────────

function SectionHeader({
    icon: Icon,
    title,
    description,
    color,
}: {
    icon: any;
    title: string;
    description?: string;
    color: string;
}) {
    return (
        <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
                <div
                    className={cn(
                        "size-8 sm:size-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
                        color
                    )}
                >
                    <Icon className="size-4 sm:size-5" />
                </div>
                <h3 className="font-serif font-black text-base sm:text-lg md:text-xl text-foreground break-words leading-tight">
                    {title}
                </h3>
            </div>
            {description && (
                <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground font-serif italic ml-10 sm:ml-13 break-words">
                    {description}
                </p>
            )}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 space-y-3 sm:space-y-4">
            <Loader2 className="size-8 sm:size-10 text-primary animate-spin" />
            <p className="text-xs sm:text-sm font-serif italic text-muted-foreground">
                Fetching fellow data...
            </p>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 sm:py-10 md:py-12 text-center border-2 border-dashed border-[#E8E4D8] rounded-xl sm:rounded-2xl bg-muted/5 px-4">
            <AlertCircle className="size-8 sm:size-10 text-muted-foreground/30 mb-2 sm:mb-3" />
            <p className="text-xs sm:text-sm font-serif italic text-muted-foreground break-words max-w-xs">
                {message}
            </p>
        </div>
    );
}

/** Responsive table wrapper — shows table on md+ and cards on mobile */
function ResponsiveTableCard({
    children,
    mobileCards,
}: {
    children: React.ReactNode;
    mobileCards: React.ReactNode;
}) {
    return (
        <>
            {/* Mobile card view */}
            <div className="block md:hidden space-y-3">{mobileCards}</div>
            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto border-2 border-[#E8E4D8] rounded-xl sm:rounded-2xl">
                {children}
            </div>
        </>
    );
}

// ─── View Panels ──────────────────────────────────────────────────────────────

/**
 * PORTFOLIO VIEW (Do Level)
 */
function PortfolioView({
    portfolios,
    biLookup,
    compLookup,
    onReview,
}: {
    portfolios: Portfolio[];
    biLookup: Record<string, BehavioralIndicator>;
    compLookup: Record<string, Competency>;
    onReview: (p: Portfolio) => void;
}) {
    // Local filter state
    const [compFilter, setCompFilter] = useState<string>("all");
    const [biFilter, setBiFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Base filter: map the status filter to one-or-more statuses
    const mapStatusToSet = (key: string) => {
        switch (key) {
            case 'submitted':
                return new Set(['submitted', 'under_review', 'resubmitted']);
            case 'draft':
                return new Set(['draft']);
            case 'approved':
                return new Set(['approved']);
            case 'rejected':
                return new Set(['rejected']);
            case 'all':
            default:
                return null; // null means include all
        }
    };

    const statusSet = mapStatusToSet(statusFilter);

    // Filter portfolios according to selected filters
    const filtered = portfolios.filter((p) => {
        if (statusSet && !statusSet.has(p.status)) return false;
        if (compFilter !== 'all') {
            const bi = biLookup[p.behavioral_indicator_id];
            if (!bi || bi.competency_id !== compFilter) return false;
        }
        if (biFilter !== 'all' && p.behavioral_indicator_id !== biFilter) return false;
        return true;
    });

    // Sort by competency title then BI title for predictable ordering
    const sorted = filtered.sort((a, b) => {
        const biA = biLookup[a.behavioral_indicator_id];
        const biB = biLookup[b.behavioral_indicator_id];
        const compA = biA ? compLookup[biA.competency_id]?.title || '' : '';
        const compB = biB ? compLookup[biB.competency_id]?.title || '' : '';
        if (compA.toLowerCase() < compB.toLowerCase()) return -1;
        if (compA.toLowerCase() > compB.toLowerCase()) return 1;
        const biTitleA = biA?.title || '';
        const biTitleB = biB?.title || '';
        return biTitleA.toLowerCase().localeCompare(biTitleB.toLowerCase());
    });

    const statusBadgeClass = (status: string) =>
        cn(
            "rounded-full text-[9px] sm:text-[10px]",
            status === "approved"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : status === "rejected"
                    ? "bg-red-100 text-red-700 border-red-200"
                    : status === "submitted"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
        );

    return (
        <div className="space-y-4 sm:space-y-6">
            <SectionHeader
                icon={FileText}
                title="Portfolio (Do Level)"
                description="Review STAR submissions and evidence."
                color="bg-emerald-100 text-emerald-700"
            />
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Filter:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 rounded-xl border-2 border-[#E8E4D8] bg-white px-3"
                    >
                        <option value="submitted">Submitted (Pending)</option>
                        <option value="draft">Drafts</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All</option>
                    </select>

                    <select
                        value={compFilter}
                        onChange={(e) => { setCompFilter(e.target.value); setBiFilter('all'); }}
                        className="h-9 rounded-xl border-2 border-[#E8E4D8] bg-white px-3"
                    >
                        <option value="all">All Competencies</option>
                        {Object.values(compLookup).map((c) => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>

                    <select
                        value={biFilter}
                        onChange={(e) => setBiFilter(e.target.value)}
                        className="h-9 rounded-xl border-2 border-[#E8E4D8] bg-white px-3"
                    >
                        <option value="all">All Behavioral Indicators</option>
                        {Object.values(biLookup)
                            .filter((b) => compFilter === 'all' || b.competency_id === compFilter)
                            .map((b) => (
                                <option key={b.id} value={b.id}>{b.title}</option>
                            ))}
                    </select>
                </div>
            </div>

            {sorted.length === 0 ? (
                <EmptyState message="No portfolios match the selected filters." />
            ) : (
                <ResponsiveTableCard
                    mobileCards={sorted.map((p) => {
                        const bi = biLookup[p.behavioral_indicator_id];
                        const comp = bi ? compLookup[bi.competency_id] : null;
                        return (
                            <div
                                key={p.id}
                                className="p-4 rounded-2xl border-2 border-[#E8E4D8] bg-white space-y-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] font-black uppercase text-primary/60 block">
                                            {comp?.title || "Unknown Comp"}
                                        </span>
                                        <span className="font-bold text-foreground text-sm leading-tight block mt-0.5">
                                            {bi?.title || "Unknown BI"}
                                        </span>
                                        {p.star_result && (
                                            <p className="text-xs text-[#1B4332]/60 mt-1 line-clamp-2">{p.star_result}</p>
                                        )}
                                        {typeof p.score !== 'undefined' && p.score !== null && (
                                            <div className="mt-2">
                                                <span className="text-[10px] font-black text-primary mr-2">Score:</span>
                                                <span className="font-bold">{p.score}/50</span>
                                            </div>
                                        )}
                                    </div>
                                    <Badge className={statusBadgeClass(p.status)}>
                                        {p.status.replace("_", " ")}
                                    </Badge>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onReview(p)}
                                    className="rounded-full h-9 font-serif font-bold italic text-xs w-full"
                                >
                                    Review Submission
                                </Button>
                            </div>
                        );
                    })}
                >
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-muted/50 border-b-2 border-[#E8E4D8]">
                            <tr>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                    Competency / BI
                                </th>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                    Result
                                </th>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                    Status
                                </th>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E4D8]">
                            {sorted.map((p) => {
                                const bi = biLookup[p.behavioral_indicator_id];
                                const comp = bi ? compLookup[bi.competency_id] : null;
                                return (
                                    <tr
                                        key={p.id}
                                        className="hover:bg-muted/5 transition-colors"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-primary/60">
                                                    {comp?.title || "Unknown Comp"}
                                                </span>
                                                <span className="font-bold text-foreground line-clamp-1 text-sm">
                                                    {bi?.title || "Unknown BI"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-foreground line-clamp-2">
                                                    {p.star_result || '—'}
                                                </span>
                                                {typeof p.score !== 'undefined' && p.score !== null && (
                                                    <span className="text-[10px] text-muted-foreground mt-1">Score: {p.score}/50</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge className={statusBadgeClass(p.status)}>
                                                {p.status.replace("_", " ")}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onReview(p)}
                                                className="rounded-full h-8 font-serif font-bold italic text-xs"
                                            >
                                                Review
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </ResponsiveTableCard>
            )}
        </div>
    );
}

/**
 * PORTFOLIO REVIEW PANEL (Inline)
 */
function PortfolioReviewPanel({
    portfolio,
    biLookup,
    onClose,
    onSave,
}: {
    portfolio: Portfolio;
    biLookup: Record<string, BehavioralIndicator>;
    onClose: () => void;
    onSave: (
        status: PortfolioStatus,
        feedback: string,
        score: number
    ) => Promise<void>;
}) {
    const [status, setStatus] = useState<PortfolioStatus>(portfolio.status);
    const [feedback, setFeedback] = useState(portfolio.feedback || "");
    const [score, setScore] = useState(portfolio.score || 0);
    const [isSaving, setIsSaving] = useState(false);
    const [scoreError, setScoreError] = useState<string | null>(null);

    const bi = biLookup[portfolio.behavioral_indicator_id];

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // Ensure score is numeric and within range 0-50
            let finalScore = Number(score) || 0;
            if (finalScore < 0) finalScore = 0;
            if (finalScore > 50) finalScore = 50;
            await onSave(status, feedback, finalScore);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 pt-4 border-t-2 border-dashed border-[#E8E4D8] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="size-8 sm:size-10 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                        <FileText className="size-4 sm:size-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary">
                            Reviewing Submission
                        </p>
                        <h4 className="font-serif font-bold text-sm sm:text-base md:text-lg leading-tight break-words">
                            {bi?.title}
                        </h4>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full shrink-0 size-8 sm:size-9"
                >
                    <X className="size-4" />
                </Button>
            </div>

            {/* STAR Content Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                    { label: "Situation", content: portfolio.star_situation },
                    { label: "Task", content: portfolio.star_task },
                    { label: "Action", content: portfolio.star_action },
                    { label: "Result", content: portfolio.star_result },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-[#E8E4D8]"
                    >
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 sm:mb-2">
                            {s.label}
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                            {s.content || "N/A"}
                        </p>
                    </div>
                ))}
            </div>

            {/* Evidence Links */}
            {portfolio.evidence_urls && portfolio.evidence_urls.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Evidence Links / Files
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {portfolio.evidence_urls.map((url, i) => (
                            <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-[#E8E4D8] rounded-xl text-[10px] sm:text-xs font-bold hover:border-primary transition-all group"
                            >
                                <ExternalLink className="size-3 group-hover:text-primary shrink-0" />
                                <span className="truncate">Evidence {i + 1}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin Input */}
            <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-dashed border-[#E8E4D8]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary px-1">
                            Review Status
                        </label>
                        <select
                            className="w-full h-11 px-3 sm:px-4 rounded-xl border-2 border-[#E8E4D8] focus:border-primary outline-none bg-white font-serif font-bold italic text-sm appearance-none"
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value as PortfolioStatus)
                            }
                        >
                            <option value="submitted">Submitted (Pending)</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Needs Revision / Rejected</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary px-1">
                            Performance Score (0-50)
                        </label>
                        <Input
                            type="number"
                            min="0"
                            max="50"
                            value={score}
                            onChange={(e) => {
                                const v = e.target.value;
                                const n = Number(v);
                                if (v === "") {
                                    setScore(0);
                                    setScoreError("Score is required (0-50)");
                                    return;
                                }
                                if (Number.isNaN(n)) {
                                    setScoreError("Invalid number");
                                } else if (n < 0 || n > 50) {
                                    setScoreError("Score must be between 0 and 50");
                                } else {
                                    setScoreError(null);
                                }
                                setScore(n);
                            }}
                            className="rounded-xl border-2 border-[#E8E4D8] h-11"
                        />
                        {scoreError && (
                            <p className="text-[10px] text-red-600 mt-1">{scoreError}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary px-1">
                        Facilitator Feedback
                    </label>
                    <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] min-h-[100px] sm:min-h-[120px] focus:border-primary text-sm"
                        placeholder="Provide detailed feedback for the fellow..."
                    />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <Button
                        variant="outline"
                        className="rounded-full w-full sm:w-auto h-10 sm:h-11"
                        onClick={onClose}
                    >
                        Discard
                    </Button>
                    <Button
                        className="rounded-full px-6 sm:px-8 shadow-lg shadow-primary/20 w-full sm:w-auto h-10 sm:h-11"
                        onClick={handleSubmit}
                        disabled={isSaving || !!scoreError}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            "Save Review"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/**
 * QUIZ VIEW (Know Level)
 */
function QuizView({
    progress,
    biLookup,
    compLookup,
}: {
    progress: PhaseProgress[];
    biLookup: Record<string, BehavioralIndicator>;
    compLookup: Record<string, Competency>;
}) {
    const knowProgress = progress.filter((p) => p.phase_type === "know");

    if (knowProgress.length === 0)
        return <EmptyState message="No quizzes completed yet." />;

    return (
        <div className="space-y-4 sm:space-y-6">
            <SectionHeader
                icon={Brain}
                title="Quiz (Know Level)"
                description="Assessment scores for knowledge modules."
                color="bg-blue-100 text-blue-700"
            />
            <ResponsiveTableCard
                mobileCards={knowProgress.map((p) => {
                    const bi = biLookup[p.behavioral_indicator_id];
                    const comp = bi ? compLookup[bi.competency_id] : null;
                    const isPassed = (p.know_score ?? 0) >= 75;
                    return (
                        <div
                            key={p.id}
                            className="p-4 rounded-2xl border-2 border-[#E8E4D8] bg-white"
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                    <span className="text-[9px] font-black uppercase text-primary/60 block">
                                        {comp?.title || "Unknown Comp"}
                                    </span>
                                    <span className="font-bold text-foreground text-sm leading-tight block mt-0.5">
                                        {bi?.title || "Unknown BI"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-[#E8E4D8]">
                                <span className="font-black text-lg">
                                    {p.know_score ?? 0}%
                                </span>
                                {isPassed ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full text-[10px]">
                                        Passed
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full text-[10px]">
                                        Pending
                                    </Badge>
                                )}
                            </div>
                        </div>
                    );
                })}
            >
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b-2 border-[#E8E4D8]">
                        <tr>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                Competency / BI
                            </th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                Score
                            </th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">
                                Result
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E4D8]">
                        {knowProgress.map((p) => {
                            const bi = biLookup[p.behavioral_indicator_id];
                            const comp = bi ? compLookup[bi.competency_id] : null;
                            const isPassed = (p.know_score ?? 0) >= 75;
                            return (
                                <tr key={p.id} className="hover:bg-muted/5">
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-primary/60">
                                                {comp?.title || "Unknown Comp"}
                                            </span>
                                            <span className="font-bold text-foreground line-clamp-1 text-sm">
                                                {bi?.title || "Unknown BI"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-black text-lg">
                                            {p.know_score ?? 0}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        {isPassed ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full text-[10px]">
                                                Passed
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full text-[10px]">
                                                Pending
                                            </Badge>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </ResponsiveTableCard>
        </div>
    );
}

/**
 * BELIEVE VIEW
 */
function BelieveView({
    progress,
    groundingResult,
    biLookup,
    compLookup,
}: {
    progress: PhaseProgress[];
    groundingResult?: GroundingResult;
    biLookup: Record<string, BehavioralIndicator>;
    compLookup: Record<string, Competency>;
}) {
    const believeProgress = progress.filter((p) => p.phase_type === "believe");

    const missingBIs = believeProgress.filter(
        (p) => !biLookup[p.behavioral_indicator_id]
    );
    const hasMissingData = missingBIs.length > 0;

    return (
        <div className="space-y-4 sm:space-y-6">
            <SectionHeader
                icon={Heart}
                title="Believe Level"
                description="Engagement with foundation and mindsets."
                color="bg-purple-100 text-purple-700"
            />

            {/* Debug Alert */}
            {hasMissingData && (
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-start gap-2 sm:gap-3">
                    <AlertCircle className="size-4 sm:size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-amber-900">
                            Data Sync Issue Detected
                        </p>
                        <p className="text-[10px] sm:text-xs text-amber-700 mt-1">
                            {missingBIs.length} behavioral indicator(s) referenced in
                            progress records are not found in the system.
                        </p>
                        <details className="mt-2">
                            <summary className="text-[10px] sm:text-xs font-bold text-amber-800 cursor-pointer hover:underline">
                                Show Missing IDs
                            </summary>
                            <div className="mt-2 p-2 bg-white rounded-lg border border-amber-200 overflow-x-auto">
                                <code className="text-[9px] sm:text-[10px] text-amber-900 break-all">
                                    {missingBIs
                                        .map((p) => p.behavioral_indicator_id)
                                        .join(", ")}
                                </code>
                            </div>
                        </details>
                    </div>
                </div>
            )}

            {/* Grounding result */}
            {groundingResult && (
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center text-purple-600 shrink-0">
                                <BookOpen className="size-5 sm:size-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-purple-500">
                                    Grounding Module
                                </p>
                                <h4 className="font-serif font-black text-sm sm:text-base md:text-lg truncate">
                                    Introductory Grounding
                                </h4>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Score
                            </p>
                            <p className="text-xl sm:text-2xl font-black text-purple-700">
                                {groundingResult.score ?? 0}%
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {believeProgress.length > 0 ? (
                <ResponsiveTableCard
                    mobileCards={believeProgress.map((p) => {
                        const bi = biLookup[p.behavioral_indicator_id];
                        const comp = bi ? compLookup[bi.competency_id] : null;
                        return (
                            <div
                                key={p.id}
                                className="p-4 rounded-2xl border-2 border-[#E8E4D8] bg-white"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <span className="font-bold text-foreground text-sm block">
                                            {bi?.title ||
                                                `BI ID: ${p.behavioral_indicator_id.slice(0, 8)}...`}
                                        </span>
                                        {!bi && (
                                            <span className="text-[10px] text-amber-600 italic mt-0.5 block">
                                                Data not found
                                            </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground mt-1 block">
                                            {comp?.title || "N/A"}
                                        </span>
                                    </div>
                                    <div className="shrink-0">
                                        {p.believe_passed ? (
                                            <CheckCircle2 className="size-5 text-emerald-500" />
                                        ) : (
                                            <Clock className="size-5 text-amber-500" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                >
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-b-2 border-[#E8E4D8]">
                            <tr>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                    Behavioral Indicator
                                </th>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                    Competency
                                </th>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">
                                    Gatekeeper
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E4D8]">
                            {believeProgress.map((p) => {
                                const bi = biLookup[p.behavioral_indicator_id];
                                const comp = bi ? compLookup[bi.competency_id] : null;
                                return (
                                    <tr key={p.id} className="hover:bg-muted/5">
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground text-sm">
                                                    {bi?.title ||
                                                        `BI ID: ${p.behavioral_indicator_id}`}
                                                </span>
                                                {!bi && (
                                                    <span className="text-[10px] text-amber-600 italic mt-1">
                                                        Data not found - may need to refresh
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {comp?.title || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {p.believe_passed ? (
                                                <CheckCircle2 className="size-5 text-emerald-500 ml-auto" />
                                            ) : (
                                                <Clock className="size-5 text-amber-500 ml-auto" />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </ResponsiveTableCard>
            ) : (
                <EmptyState message="No believe phases started yet." />
            )}
        </div>
    );
}

/**
 * DETAIL & EXAMINATION VIEW
 */
function DetailExamView({
    groundingResults,
    waveResults,
    waves,
    gmLookup,
    onUpdateExamScore,
    onUpdateGroundingScore,
}: {
    groundingResults: GroundingResult[];
    waveResults: WaveResult[];
    waves: Wave[];
    gmLookup: Record<string, GroundingModule>;
    onUpdateExamScore: (waveId: string, score: number) => Promise<void>;
    onUpdateGroundingScore: (resultId: string, score: number) => Promise<void>;
}) {
    const [editingWaveId, setEditingWaveId] = useState<string | null>(null);
    const [editingGroundingId, setEditingGroundingId] = useState<string | null>(null);
    const [editScore, setEditScore] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);

    const handleStartEdit = (waveId: string, currentScore: number) => {
        setEditingWaveId(waveId);
        setEditScore(currentScore);
    };

    const handleStartEditGrounding = (resultId: string, currentScore: number) => {
        setEditingGroundingId(resultId);
        setEditScore(currentScore);
    };

    const handleSave = async (waveId: string) => {
        setIsSaving(true);
        try {
            await onUpdateExamScore(waveId, editScore);
            setEditingWaveId(null);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveGrounding = async (resultId: string) => {
        setIsSaving(true);
        try {
            await onUpdateGroundingScore(resultId, editScore);
            setEditingGroundingId(null);
        } finally {
            setIsSaving(false);
        }
    };
    return (
        <div className="space-y-6 sm:space-y-8">
            <SectionHeader
                icon={GraduationCap}
                title="Detail & Examination"
                description="Integrated results for grounding, exams, and competencies."
                color="bg-amber-100 text-amber-700"
            />

            {/* Grounding Section */}
            <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Grounding Modules
                    </h4>
                    <Badge
                        variant="outline"
                        className="rounded-full text-[9px] sm:text-[10px]"
                    >
                        {groundingResults.length}
                    </Badge>
                </div>
                {groundingResults.length > 0 ? (
                    <ResponsiveTableCard
                        mobileCards={groundingResults.map((r) => {
                            const gm = gmLookup[r.grounding_id];
                            return (
                                <div
                                    key={r.id}
                                    className="p-4 rounded-2xl border-2 border-[#E8E4D8] bg-white"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">
                                                {gm?.name || "Grounding Module"}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-black text-lg">{r.score ?? 0}%</p>
                                            <Badge
                                                className={cn(
                                                    "rounded-full text-[9px]",
                                                    r.is_passed
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                        : "bg-amber-100 text-amber-700 border-amber-200"
                                                )}
                                            >
                                                {r.status === "completed"
                                                    ? "Passed"
                                                    : "In Progress"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    >
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/30 border-b-2 border-[#E8E4D8]">
                                <tr>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                        Module
                                    </th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                        Score
                                    </th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E4D8]">
                                    {groundingResults.map((r) => {
                                        const gm = gmLookup[r.grounding_id];
                                        const isEditing = editingGroundingId === r.id;
                                        return (
                                            <tr key={r.id}>
                                                <td className="px-4 py-4 font-bold text-sm">
                                                    {gm?.name || "Grounding Module"}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={editScore}
                                                                onChange={(e) => setEditScore(Number(e.target.value))}
                                                                className="w-20 h-8 rounded-lg"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSaveGrounding(r.id)}
                                                                disabled={isSaving}
                                                                className="h-8 px-2"
                                                            >
                                                                {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEditingGroundingId(null)}
                                                                className="h-8 px-2"
                                                            >
                                                                <X className="size-3" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-lg">{r.score ?? 0}%</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleStartEditGrounding(r.id, r.score || 0)}
                                                                className="size-6 rounded-full"
                                                            >
                                                                <Edit2 className="size-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <Badge
                                                        className={cn(
                                                            "rounded-full text-[10px]",
                                                            r.is_passed
                                                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                                : "bg-amber-100 text-amber-700 border-amber-200"
                                                        )}
                                                    >
                                                        {r.status === "completed"
                                                            ? "Passed"
                                                            : "In Progress"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </ResponsiveTableCard>
                ) : (
                    <EmptyState message="No grounding modules recorded." />
                )}
            </div>

            {/* Examination Section */}
            <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Final Wave Examinations
                    </h4>
                    <Badge
                        variant="outline"
                        className="rounded-full text-[9px] sm:text-[10px]"
                    >
                        {waveResults.length}
                    </Badge>
                </div>
                {waveResults.length > 0 ? (
                    <ResponsiveTableCard
                        mobileCards={waveResults.map((r) => {
                            const wave = waves.find((w) => w.id === r.wave_id);
                            return (
                                <div
                                    key={r.id}
                                    className="p-4 rounded-2xl border-2 border-[#E8E4D8] bg-white space-y-3"
                                >
                                    <p className="font-bold text-sm">
                                        Wave {wave?.number ?? "?"}: {wave?.name || "Untitled"}
                                    </p>
                                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E8E4D8]">
                                        <div className="text-center flex-1">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground">
                                                Exam
                                            </p>
                                            <p className="font-black text-lg">{r.exam_score}%</p>
                                        </div>
                                        <div className="w-px h-8 bg-[#E8E4D8]" />
                                        <div className="text-center flex-1">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground">
                                                Comp Avg
                                            </p>
                                            <p className="font-black text-lg text-primary">
                                                {r.competency_avg}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    >
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/30 border-b-2 border-[#E8E4D8]">
                                <tr>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                        Wave
                                    </th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                        Exam Score
                                    </th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">
                                        Comp Avg
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E4D8]">
                                    {waveResults.map((r) => {
                                        const wave = waves.find((w) => w.id === r.wave_id);
                                        const isEditing = editingWaveId === r.wave_id;
                                        return (
                                            <tr key={r.id}>
                                                <td className="px-4 py-4 font-bold text-sm">
                                                    Wave {wave?.number ?? "?"}:{" "}
                                                    {wave?.name || "Untitled"}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={editScore}
                                                                onChange={(e) => setEditScore(Number(e.target.value))}
                                                                className="w-20 h-8 rounded-lg"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSave(r.wave_id)}
                                                                disabled={isSaving}
                                                                className="h-8 px-2"
                                                            >
                                                                {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEditingWaveId(null)}
                                                                className="h-8 px-2"
                                                            >
                                                                <X className="size-3" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-lg">{r.exam_score}%</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleStartEdit(r.wave_id, r.exam_score)}
                                                                className="size-6 rounded-full"
                                                            >
                                                                <Edit2 className="size-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold text-primary text-sm">
                                                    {r.competency_avg}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </ResponsiveTableCard>
                ) : (
                    <EmptyState message="No wave examinations completed." />
                )}
            </div>
        </div>
    );
}

/**
 * COMPETENCY LEVEL VIEW
 */
function CompetencyView({
    progress,
    biLookup,
    compLookup,
    portfolios,
    examAttempts,
    groundingResults,
}: {
    progress: PhaseProgress[];
    biLookup: Record<string, BehavioralIndicator>;
    compLookup: Record<string, Competency>;
    portfolios: Portfolio[];
    examAttempts: ExamAttempt[];
    groundingResults: GroundingResult[];
}) {
    const compStats = useMemo(() => {
        return Object.values(compLookup).map((comp) => {
            const biIds = Object.values(biLookup)
                .filter((bi) => bi.competency_id === comp.id)
                .map((bi) => bi.id);

            const groundingScore = groundingResults[0]?.score || 0;
            const examScore =
                examAttempts.find((a) => a.exam_id === comp.id)?.score || 0;

            const composite =
                FellowProgressService.calculateCompetencyTotalScore(
                    biIds,
                    progress,
                    portfolios,
                    groundingScore,
                    examScore
                );

            return { comp, avg: composite };
        });
    }, [
        progress,
        biLookup,
        compLookup,
        portfolios,
        examAttempts,
        groundingResults,
    ]);

    if (compStats.length === 0)
        return <EmptyState message="No competency data tracked yet." />;

    return (
        <div className="space-y-4 sm:space-y-6">
            <SectionHeader
                icon={BookOpen}
                title="Competency Level"
                description="Live proficiency across leadership domains."
                color="bg-teal-100 text-teal-700"
            />
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {compStats.map((s) => (
                    <Card
                        key={s.comp.id}
                        className="rounded-2xl sm:rounded-3xl border-2 border-[#E8E4D8] overflow-hidden"
                    >
                        <CardHeader className="p-3.5 sm:p-4 md:p-5 pb-2">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-serif font-black text-sm sm:text-base md:text-lg truncate pr-2 flex-1 min-w-0">
                                    {s.comp.title}
                                </h4>
                                <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full text-xs sm:text-sm font-black italic shrink-0">
                                    {s.avg}%
                                </Badge>
                            </div>
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {s.comp.category?.toUpperCase() || "Leadership"} •
                                Level: {s.comp.level}
                            </p>
                        </CardHeader>
                        <CardContent className="px-3.5 sm:px-4 md:px-5 pb-3.5 sm:pb-4 md:pb-5 pt-0">
                            <div className="mt-3 h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                    style={{ width: `${s.avg}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/**
 * WAVE LEVEL VIEW
 */
function WaveView({
    waveResults,
    waves,
}: {
    waveResults: WaveResult[];
    waves: Wave[];
}) {
    if (waveResults.length === 0)
        return <EmptyState message="No wave results finalized." />;

    return (
        <div className="space-y-4 sm:space-y-6">
            <SectionHeader
                icon={Waves}
                title="Wave Level"
                description="Finalized results per program wave."
                color="bg-indigo-100 text-indigo-700"
            />
            <div className="space-y-3 sm:space-y-4">
                {waveResults.map((r) => {
                    const wave = waves.find((w) => w.id === r.wave_id);
                    return (
                        <div
                            key={r.id}
                            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border-2 border-[#E8E4D8] shadow-sm space-y-3 sm:space-y-4"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                        Program Wave
                                    </p>
                                    <h4 className="font-serif font-black text-base sm:text-lg md:text-xl leading-tight break-words">
                                        Wave {wave?.number ?? "?"}: {wave?.name || "Result"}
                                    </h4>
                                </div>
                                <div className="text-center bg-primary/5 px-4 sm:px-6 py-2 rounded-xl sm:rounded-2xl border-2 border-primary/10 shrink-0 w-full sm:w-auto">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-primary mb-0.5 sm:mb-1">
                                        Final Score
                                    </p>
                                    <p className="text-xl sm:text-2xl font-black text-primary">
                                        {r.final_score}%
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t-2 border-dashed border-[#E8E4D8] pt-3 sm:pt-4 text-center">
                                <div>
                                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase text-muted-foreground">
                                        Comp Avg
                                    </p>
                                    <p className="text-base sm:text-lg font-black">
                                        {r.competency_avg}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase text-muted-foreground">
                                        Exam
                                    </p>
                                    <p className="text-base sm:text-lg font-black">
                                        {r.exam_score}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase text-muted-foreground">
                                        Grounding
                                    </p>
                                    <p className="text-base sm:text-lg font-black">
                                        {r.grounding_score}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * OVERALL PERFORMANCE VIEW
 */
function OverallView({
    fellowName,
    waveResults,
    portfolios,
    progress,
}: {
    fellowName: string;
    waveResults: WaveResult[];
    portfolios: Portfolio[];
    progress: PhaseProgress[];
}) {
    const overallAvg =
        waveResults.length > 0
            ? Math.round(
                waveResults.reduce((a, b) => a + b.final_score, 0) /
                waveResults.length
            )
            : 0;

    const stats = [
        {
            label: "Program Avg",
            value: `${overallAvg}%`,
            color: "bg-primary text-white",
        },
        {
            label: "Approved",
            value: portfolios.filter((p) => p.status === "approved").length,
            color: "bg-emerald-50 text-emerald-700 border-emerald-100",
        },
        {
            label: "Quizzes",
            value: progress.filter((p) => p.phase_type === "know").length,
            color: "bg-blue-50 text-blue-700 border-blue-100",
        },
        {
            label: "Mindsets",
            value: progress.filter(
                (p) => p.phase_type === "believe" && p.believe_passed
            ).length,
            color: "bg-purple-50 text-purple-700 border-purple-100",
        },
    ];

    return (
        <div className="space-y-6 sm:space-y-8">
            <SectionHeader
                icon={BarChart3}
                title="Overall Performance"
                description="Complete program engagement snapshot."
                color="bg-primary/10 text-primary"
            />

            {/* Big Score Card */}
            <div className="relative text-center py-6 sm:py-8 md:py-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-white to-primary/5 border-2 sm:border-4 border-primary/20 shadow-xl overflow-hidden group px-4">
                <div className="absolute top-0 right-0 p-3 sm:p-6 md:p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <BarChart3 className="size-12 sm:size-20 md:size-24 lg:size-32" />
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] text-primary/60 mb-1 sm:mb-2 relative z-10">
                    Fellow Composite Performance
                </p>
                <p className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-serif font-black text-primary relative z-10">
                    {overallAvg}%
                </p>
                <div className="mt-3 sm:mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 relative z-10">
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full font-black italic text-[9px] sm:text-[10px]">
                        ON TRACK
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-serif italic">
                        Cohort Rank: Top 15%
                    </span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {stats.map((s, i) => (
                    <div
                        key={i}
                        className={cn(
                            "p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 text-center shadow-sm",
                            s.color
                        )}
                    >
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5 sm:mb-1 truncate">
                            {s.label}
                        </p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-serif font-black">
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recent History — mobile cards, desktop table */}
            <div className="space-y-2 sm:space-y-3">
                <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                    Recent Milestone History
                </h4>
                <ResponsiveTableCard
                    mobileCards={
                        <>
                            {waveResults.map((r, i) => (
                                <div
                                    key={`wave-${i}`}
                                    className="p-3 rounded-xl border-2 border-[#E8E4D8] bg-white flex items-center justify-between gap-2"
                                >
                                    <span className="font-bold text-xs truncate">
                                        Wave Result Finalized
                                    </span>
                                    <span className="text-[10px] text-muted-foreground italic font-serif shrink-0">
                                        {r.completed_at
                                            ? new Date(r.completed_at).toLocaleDateString()
                                            : "Recent"}
                                    </span>
                                </div>
                            ))}
                            {portfolios.slice(0, 2).map((p, i) => (
                                <div
                                    key={`port-${i}`}
                                    className="p-3 rounded-xl border-2 border-[#E8E4D8] bg-white flex items-center justify-between gap-2"
                                >
                                    <span className="font-bold text-xs truncate">
                                        Portfolio {p.status}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground italic font-serif shrink-0">
                                        {p.submitted_at
                                            ? new Date(p.submitted_at).toLocaleDateString()
                                            : "Recent"}
                                    </span>
                                </div>
                            ))}
                        </>
                    }
                >
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/30 border-b-2 border-[#E8E4D8]">
                            <tr>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                                    Event
                                </th>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E4D8]">
                            {waveResults.map((r, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-4 font-bold text-sm">
                                        Wave Result Finalized
                                    </td>
                                    <td className="px-4 py-4 text-right text-muted-foreground italic font-serif text-xs">
                                        {r.completed_at
                                            ? new Date(r.completed_at).toLocaleDateString()
                                            : "Recent"}
                                    </td>
                                </tr>
                            ))}
                            {portfolios.slice(0, 2).map((p, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-4 font-bold text-sm">
                                        Portfolio {p.status}
                                    </td>
                                    <td className="px-4 py-4 text-right text-muted-foreground italic font-serif text-xs">
                                        {p.submitted_at
                                            ? new Date(p.submitted_at).toLocaleDateString()
                                            : "Recent"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ResponsiveTableCard>
            </div>
        </div>
    );
}

/**
 * PERFORMANCE BREAKDOWN VIEW (Mirrors Fellow Dashboard)
 */
function PerformanceBreakdownView({
    progress,
    portfolios,
    biLookup,
    compLookup,
    groundingResults,
    examAttempts,
    competencyWaveMeta,
    orderedWaves,
    onUpdateCompExamScore,
}: {
    progress: PhaseProgress[];
    portfolios: Portfolio[];
    biLookup: Record<string, BehavioralIndicator>;
    compLookup: Record<string, Competency>;
    groundingResults: GroundingResult[];
    examAttempts: ExamAttempt[];
    competencyWaveMeta: Record<string, { waveNumber: number; waveName: string; displayOrder: number }>;
    orderedWaves: { number: number; name: string }[];
    onUpdateCompExamScore: (compId: string, score: number) => Promise<void>;
}) {
    const [selectedCompId, setSelectedCompId] = React.useState<string | null>(
        null
    );
    const [isEditingExam, setIsEditingExam] = React.useState(false);
    const [editExamScore, setEditExamScore] = React.useState(0);
    const [isSavingExam, setIsSavingExam] = React.useState(false);

    const handleStartEditExam = (currentScore: number) => {
        // currentScore is out of 100, convert to out of 20 for editing
        setEditExamScore(Math.round(currentScore / 5));
        setIsEditingExam(true);
    };

    const handleSaveExam = async (compId: string) => {
        setIsSavingExam(true);
        try {
            await onUpdateCompExamScore(compId, editExamScore);
            setIsEditingExam(false);
        } finally {
            setIsSavingExam(false);
        }
    };

    const groundingScore = groundingResults[0]?.score || 0;

    const competencyPerformance = React.useMemo(() => {
        return Object.values(compLookup)
            .map((comp) => {
                const biIds = Object.values(biLookup)
                    .filter((bi) => bi.competency_id === comp.id)
                    .map((bi) => bi.id);

                const compExam = examAttempts.find((a) => a.exam_id === comp.id);
                const examScore = compExam?.score || 0;

                const compositeScore =
                    FellowProgressService.calculateCompetencyTotalScore(
                        biIds,
                        progress,
                        portfolios,
                        groundingScore * 10,
                        examScore
                    );

                const biBreakdown = biIds.map((biId) => {
                    const bi = biLookup[biId];
                    const biProgress = progress.filter(
                        (p) => p.behavioral_indicator_id === biId
                    );
                    const biPortfolios = portfolios.filter(
                        (p) => p.behavioral_indicator_id === biId
                    );

                    const believePhase = biProgress.find(
                        (p) => p.phase_type === "believe"
                    );
                    const knowPhase = biProgress.find(
                        (p) => p.phase_type === "know"
                    );
                    const approvedPortfolio = biPortfolios.find(
                        (p) => p.status === "approved"
                    );

                    const knowScore = knowPhase?.know_score || 0;
                    const doScore = approvedPortfolio?.score || 0;
                    const biScore = FellowProgressService.calculateBIScore(
                        biProgress,
                        biPortfolios
                    );

                    return {
                        id: biId,
                        title: bi?.title || biId,
                        description: bi?.description || "",
                        believePassed: believePhase?.believe_passed || false,
                        knowScore,
                        doScore,
                        score: biScore,
                        knowContribution: Math.round((knowScore / 100) * 20),
                        doContribution: Math.round(doScore),
                    };
                });

                return {
                    ...comp,
                    compositeScore,
                    examScore,
                    examContribution: Math.round((examScore / 100) * 20),
                    groundingContribution: groundingScore,
                    biBreakdown,
                };
            })
            .filter((c) => c.biBreakdown.length > 0);
    }, [
        compLookup,
        biLookup,
        progress,
        portfolios,
        groundingScore,
        examAttempts,
    ]);

    // Group competencies by wave (in wave order, then competency display order).
    // Only the fellow's OWN cohort waves/competencies are shown — competencies that
    // belong to other cohorts' waves are excluded entirely.
    const competencyGroups = React.useMemo(() => {
        const hasWaveScope = Object.keys(competencyWaveMeta).length > 0;

        // Fallback: if we couldn't resolve the fellow's cohort waves, show everything
        // in a single group rather than leaking other cohorts' waves.
        if (!hasWaveScope) {
            return competencyPerformance.length
                ? [
                      {
                          key: "all",
                          label: "All Competencies",
                          comps: [...competencyPerformance].sort((a, b) => a.title.localeCompare(b.title)),
                      },
                  ]
                : [];
        }

        const buckets: Record<number, typeof competencyPerformance> = {};
        competencyPerformance.forEach((c) => {
            const meta = competencyWaveMeta[c.id];
            if (!meta) return; // not part of this fellow's cohort — skip
            (buckets[meta.waveNumber] ||= []).push(c);
        });
        Object.values(buckets).forEach((list) =>
            list.sort((a, b) => {
                const ma = competencyWaveMeta[a.id];
                const mb = competencyWaveMeta[b.id];
                if (ma.displayOrder !== mb.displayOrder) return ma.displayOrder - mb.displayOrder;
                return a.title.localeCompare(b.title);
            })
        );
        return Object.keys(buckets)
            .map(Number)
            .sort((a, b) => a - b)
            .map((waveNumber) => ({
                key: `wave-${waveNumber}`,
                label: `Wave ${waveNumber}: ${orderedWaves.find((w) => w.number === waveNumber)?.name || `Wave ${waveNumber}`}`,
                comps: buckets[waveNumber],
            }));
    }, [competencyPerformance, competencyWaveMeta, orderedWaves]);

    const selectedComp = competencyPerformance.find(
        (c) => c.id === selectedCompId
    );
    const selectedBreakdown = selectedComp?.biBreakdown ?? [];
    const totalBIs = selectedBreakdown.length;
    const believePassedCount = selectedBreakdown.filter(
        (bi) => bi.believePassed
    ).length;
    const avgKnow =
        totalBIs > 0
            ? Math.round(
                selectedBreakdown.reduce(
                    (sum, bi) => sum + bi.knowContribution,
                    0
                ) / totalBIs
            )
            : 0;
    const avgDo =
        totalBIs > 0
            ? Math.round(
                selectedBreakdown.reduce(
                    (sum, bi) => sum + bi.doContribution,
                    0
                ) / totalBIs
            )
            : 0;
    const avgScore =
        totalBIs > 0
            ? Math.round(
                selectedBreakdown.reduce((sum, bi) => sum + bi.score, 0) /
                totalBIs
            )
            : 0;
    const groundingContribution = selectedComp?.groundingContribution || 0;
    const examContribution = selectedComp?.examContribution || 0;
    const finalComposite = selectedComp?.compositeScore || 0;
    const preExamTotal = avgScore + groundingContribution;
    const compositeStatus = finalComposite >= 75 ? "Excellence Met" : "In Development";
    const compositeInsight = selectedComp
        ? selectedComp.compositeScore >= 75
            ? "This competency is at mastery threshold. The fellow is holding a strong composite across belief, knowledge, portfolio evidence, grounding, and exam performance."
            : selectedComp.compositeScore > 0
                ? "This competency is progressing, but the largest lift will come from approved portfolio evidence and stronger Know / Do execution."
                : "This competency has not moved yet. Believe and Know completion are the first gates before the performance score can climb."
        : "Select a competency above to view the full performance breakdown.";

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <SectionHeader
                icon={TrendingUp}
                title="Performance Breakdown"
                description="Detailed scoring breakdown with composite calculations and admin-controlled exam edits."
                color="bg-primary/10 text-primary"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                <Card className="p-5 sm:p-6 rounded-[2rem] border-[#E8E4D8] bg-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Star size={72} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-3">
                        Grounding Module
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-serif font-bold text-[#1B4332]">
                            {groundingContribution}
                        </span>
                        <span className="text-sm font-medium text-[#1B4332]/40">/10</span>
                    </div>
                    <p className="text-xs text-[#1B4332]/40 mt-4 leading-relaxed italic">
                        Contributes <span className="text-[#C5A059] font-bold">10%</span> to the full composite score.
                    </p>
                </Card>

                <Card className="p-5 sm:p-6 rounded-[2rem] border-[#E8E4D8] bg-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={72} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-3">
                        Performance Weights
                    </p>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-2">
                        <div>
                            <p className="text-[8px] font-black text-[#1B4332]/40 uppercase mb-1">Know (Quiz)</p>
                            <p className="text-xl font-serif font-bold text-[#1B4332]">20%</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-[#1B4332]/40 uppercase mb-1">Do (Portfolio)</p>
                            <p className="text-xl font-serif font-bold text-[#1B4332]">50%</p>
                        </div>
                        <div className="col-span-2 border-t border-dashed border-[#E8E4D8] pt-2">
                            <p className="text-[8px] font-black text-[#1B4332]/40 uppercase mb-1">Exam Contribution</p>
                            <p className="text-xl font-serif font-bold text-[#1B4332]">20%</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 sm:p-6 rounded-[2rem] border-[#1B4332] bg-[#1B4332] text-white shadow-xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                        <Award size={160} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059] mb-3">
                        Excellence Status
                    </p>
                    <h4 className="text-2xl font-serif font-bold italic mb-2 leading-tight">
                        Mastery Target
                    </h4>
                    <div className="flex items-center gap-3">
                        <div className="h-0.5 flex-1 bg-white/10" />
                        <span className="text-xs font-black text-[#C5A059]">75%+ COMPOSITE</span>
                        <div className="h-0.5 flex-1 bg-white/10" />
                    </div>
                </Card>
            </div>

            {/* Competency Selector — grouped by wave, then competency order */}
            <div className="space-y-4 sm:space-y-5">
                <h4 className="text-xs sm:text-sm font-bold text-foreground px-1">
                    Select Competency to View Breakdown
                </h4>
                {competencyGroups.map((group) => (
                    <div key={group.key} className="space-y-2 sm:space-y-2.5">
                        <div className="flex items-center gap-2 px-1">
                            <Waves className="size-3.5 text-primary/60" />
                            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-primary/70">
                                {group.label}
                            </p>
                            <span className="text-[10px] font-bold text-muted-foreground">
                                ({group.comps.length})
                            </span>
                            <div className="h-px flex-1 bg-[#E8E4D8]" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3">
                            {group.comps.map((comp) => (
                                <button
                                    key={comp.id}
                                    onClick={() => setSelectedCompId(comp.id)}
                                    className={cn(
                                        "p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left active:scale-[0.98]",
                                        selectedCompId === comp.id
                                            ? "bg-primary text-white border-primary shadow-lg scale-[1.01] sm:scale-[1.02]"
                                            : "bg-white border-[#E8E4D8] hover:border-primary/40 hover:shadow-md"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                                        <span
                                            className={cn(
                                                "text-[9px] sm:text-[10px] font-black uppercase tracking-widest",
                                                selectedCompId === comp.id
                                                    ? "text-white/80"
                                                    : "text-primary/60"
                                            )}
                                        >
                                            {comp.code}
                                        </span>
                                        <span
                                            className={cn(
                                                "text-lg sm:text-xl font-serif font-black",
                                                selectedCompId === comp.id
                                                    ? "text-white"
                                                    : "text-primary"
                                            )}
                                        >
                                            {comp.compositeScore}%
                                        </span>
                                    </div>
                                    <p
                                        className={cn(
                                            "text-xs sm:text-sm font-bold line-clamp-1",
                                            selectedCompId === comp.id
                                                ? "text-white"
                                                : "text-foreground"
                                        )}
                                    >
                                        {comp.title}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                {competencyGroups.length === 0 && (
                    <EmptyState message="No competencies available for this fellow yet." />
                )}
            </div>

            {/* Detailed Breakdown */}
            {selectedComp ? (
                <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                    {/* Competency Header */}
                    <Card className="rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-white p-4 sm:p-5 md:p-6 lg:p-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                                    <Badge className="bg-primary text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                        {selectedComp.code}
                                    </Badge>
                                </div>
                                <h3 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-serif font-bold text-foreground break-words leading-tight">
                                    {selectedComp.title}
                                </h3>
                                <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-1 italic line-clamp-2">
                                    {selectedComp.description}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border-2 border-primary/20 text-center shrink-0 w-full sm:w-auto">
                                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-primary mb-0.5 sm:mb-1">
                                    Composite
                                </p>
                                <p className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-primary">
                                    {selectedComp.compositeScore}%
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Global Contributions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
                        <Card className="rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] p-3.5 sm:p-4 md:p-5">
                            <div className="flex items-center gap-3">
                                <div className="size-10 sm:size-12 rounded-lg sm:rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                    <BookOpen className="size-5 sm:size-6 text-amber-700" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Grounding Module
                                    </p>
                                    <p className="text-xl sm:text-2xl font-serif font-black text-foreground">
                                        {selectedComp.groundingContribution}/10
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] p-3.5 sm:p-4 md:p-5">
                            <div className="flex items-center gap-3">
                                <div className="size-10 sm:size-12 rounded-lg sm:rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                    <GraduationCap className="size-5 sm:size-6 text-indigo-700" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Final Exam Contribution (Paper/Digital)
                                    </p>
                                    {isEditingExam ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    value={editExamScore}
                                                    onChange={(e) => setEditExamScore(Number(e.target.value))}
                                                    className="w-24 h-8 rounded-lg pr-8"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-black">/20</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleSaveExam(selectedComp.id)}
                                                disabled={isSavingExam}
                                                className="h-8 px-2"
                                            >
                                                {isSavingExam ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditingExam(false)}
                                                className="h-8 px-2"
                                            >
                                                <X className="size-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className="text-xl sm:text-2xl font-serif font-black text-foreground">
                                                {Math.round(selectedComp.examScore / 5)}/20
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleStartEditExam(selectedComp.examScore)}
                                                className="size-6 rounded-full"
                                            >
                                                <Edit2 className="size-3" />
                                            </Button>
                                        </div>
                                    )}
                                    <p className="text-[9px] text-muted-foreground mt-1 italic">
                                        This value represents the direct 20% weight contribution.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* BI Breakdown — responsive: cards on mobile, table on lg+ */}
                    <Card className="rounded-2xl sm:rounded-3xl border-2 border-[#E8E4D8] overflow-hidden">
                        <div className="p-4 sm:p-5 md:p-6 bg-muted/30 border-b-2 border-[#E8E4D8] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h4 className="text-sm sm:text-base md:text-lg font-serif font-bold text-foreground">
                                    Behavioral Indicator Performance
                                </h4>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                    This mirrors the fellow dashboard detail and adds admin editing for exam inputs.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <div className="size-2 rounded-full bg-blue-500/40" />
                                    <span className="text-[9px] font-black uppercase text-[#1B4332]/40 tracking-wider">
                                        Know
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="size-2 rounded-full bg-emerald-500/40" />
                                    <span className="text-[9px] font-black uppercase text-[#1B4332]/40 tracking-wider">
                                        Do
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile BI Cards */}
                        <div className="block lg:hidden p-3 sm:p-4 space-y-3">
                            {selectedComp.biBreakdown.map((bi, idx) => (
                                <div
                                    key={bi.id}
                                    className="p-3 sm:p-4 rounded-xl border-2 border-[#E8E4D8] bg-white space-y-3"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-xs font-black text-primary shrink-0 mt-0.5">
                                            BI{idx + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-foreground text-sm leading-tight">
                                                {bi.title}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                                                {bi.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#E8E4D8]">
                                        <div className="text-center">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground mb-0.5">
                                                Believe
                                            </p>
                                            {bi.believePassed ? (
                                                <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
                                            ) : (
                                                <Clock className="size-4 text-amber-500 mx-auto" />
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground mb-0.5">
                                                Know
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-sm font-serif font-black",
                                                    bi.knowContribution > 0
                                                        ? "text-foreground"
                                                        : "text-muted-foreground/30"
                                                )}
                                            >
                                                {bi.knowContribution > 0
                                                    ? bi.knowContribution
                                                    : "—"}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground mb-0.5">
                                                Do
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-sm font-serif font-black",
                                                    bi.doContribution > 0
                                                        ? "text-foreground"
                                                        : "text-muted-foreground/30"
                                                )}
                                            >
                                                {bi.doContribution > 0
                                                    ? bi.doContribution
                                                    : "—"}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground mb-0.5">
                                                BI
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-sm font-serif font-black",
                                                    bi.score > 0
                                                        ? "text-primary"
                                                        : "text-muted-foreground/30"
                                                )}
                                            >
                                                {bi.score > 0 ? bi.score : "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Mobile Summary */}
                            <div className="p-3 sm:p-4 rounded-xl bg-primary/5 border-2 border-primary/20 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase text-foreground">
                                        Average BI Score
                                    </span>
                                    <span className="text-xl font-serif font-black text-primary">
                                        {Math.round(
                                            selectedComp.biBreakdown.reduce(
                                                (sum, bi) => sum + bi.score,
                                                0
                                            ) / selectedComp.biBreakdown.length
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                        + Grounding (10) + Exam (20)
                                    </span>
                                    <span className="text-2xl font-serif font-black text-primary">
                                        = {selectedComp.compositeScore}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Desktop BI Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/20 border-b-2 border-[#E8E4D8]">
                                    <tr>
                                        <th className="p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                                            Indicator
                                        </th>
                                        <th className="p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">
                                            Believe
                                        </th>
                                        <th className="p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">
                                            Know (20)
                                        </th>
                                        <th className="p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">
                                            Do (50)
                                        </th>
                                        <th className="p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">
                                            BI Score (70)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E8E4D8]">
                                    {selectedComp.biBreakdown.map((bi, idx) => (
                                        <tr key={bi.id} className="hover:bg-muted/5">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-primary shrink-0">
                                                        BI{idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-foreground text-sm">
                                                            {bi.title}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                                                            {bi.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {bi.believePassed ? (
                                                    <CheckCircle2 className="size-5 text-emerald-500 mx-auto" />
                                                ) : (
                                                    <Clock className="size-5 text-amber-500 mx-auto" />
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span
                                                    className={cn(
                                                        "text-lg font-serif font-black",
                                                        bi.knowContribution > 0
                                                            ? "text-foreground"
                                                            : "text-muted-foreground/30"
                                                    )}
                                                >
                                                    {bi.knowContribution > 0
                                                        ? bi.knowContribution
                                                        : "—"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span
                                                    className={cn(
                                                        "text-lg font-serif font-black",
                                                        bi.doContribution > 0
                                                            ? "text-foreground"
                                                            : "text-muted-foreground/30"
                                                    )}
                                                >
                                                    {bi.doContribution > 0
                                                        ? bi.doContribution
                                                        : "—"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span
                                                    className={cn(
                                                        "text-xl font-serif font-black",
                                                        bi.score > 0
                                                            ? "text-primary"
                                                            : "text-muted-foreground/30"
                                                    )}
                                                >
                                                    {bi.score > 0 ? bi.score : "—"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-primary/5 border-t-2 border-primary/20">
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="p-4 text-right font-black uppercase text-xs text-foreground"
                                        >
                                            Average
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-lg font-serif font-black text-foreground">
                                                {avgKnow}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-lg font-serif font-black text-foreground">
                                                {avgDo}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-xl font-serif font-black text-primary">
                                                {avgScore}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-[#E8E4D8]">
                                        <td
                                            colSpan={4}
                                            className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase"
                                        >
                                            Exam Contribution (20%)
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-xl font-bold text-[#1B4332]">
                                                + {examContribution}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-[#C5A059]/30 bg-[#C5A059]/10">
                                        <td
                                            colSpan={4}
                                            className="p-6 text-right"
                                        >
                                            <span className="text-sm font-black text-[#1B4332] uppercase tracking-wider">
                                                Total Value (Pre-Exam)
                                            </span>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-3xl font-serif font-bold text-[#1B4332]">
                                                    {preExamTotal} <span className="text-lg text-[#1B4332]/50">/ 80</span>
                                                </span>
                                                <div className="h-1 w-12 bg-[#C5A059] rounded-full mt-1" />
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-[#1B4332]/10 bg-white">
                                        <td
                                            colSpan={4}
                                            className="p-6 text-right"
                                        >
                                            <span className="text-sm font-black text-[#1B4332] uppercase tracking-wider">
                                                Final Composite
                                            </span>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-3xl font-serif font-bold text-[#1B4332]">
                                                    {finalComposite}%
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/40 mt-1">
                                                    {compositeStatus}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="p-6 sm:p-8 bg-[#1B4332]/5 flex items-center gap-5 border-t border-[#E8E4D8]">
                            <div className="size-12 rounded-2xl bg-[#1B4332]/5 flex items-center justify-center text-[#1B4332] shrink-0">
                                <Star size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-[#1B4332]/40 tracking-wider">
                                    Performance Insight
                                </p>
                                <p className="text-xs text-[#1B4332] font-medium italic leading-snug mt-1">
                                    {compositeInsight}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <EmptyState message="Select a competency above to view detailed performance breakdown." />
            )}
        </div>
    );
}

// ─── Main Controller ──────────────────────────────────────────────────────────

const TABS: {
    view: TrackingView;
    label: string;
    shortLabel: string;
    icon: any;
    activeClass: string;
    inactiveClass: string;
}[] = [
    {
        view: "portfolio",
        label: "Portfolio",
        shortLabel: "Portfolio",
        icon: FileText,
        activeClass:
            "bg-emerald-100 text-emerald-700 shadow-md ring-2 ring-emerald-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "quiz",
        label: "Quizzes",
        shortLabel: "Quiz",
        icon: Brain,
        activeClass:
            "bg-blue-100 text-blue-700 shadow-md ring-2 ring-blue-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "believe",
        label: "Believe",
        shortLabel: "Believe",
        icon: Heart,
        activeClass:
            "bg-purple-100 text-purple-700 shadow-md ring-2 ring-purple-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "performance",
        label: "Performance",
        shortLabel: "Perf",
        icon: TrendingUp,
        activeClass:
            "bg-rose-100 text-rose-700 shadow-md ring-2 ring-rose-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "detail",
        label: "Examinations",
        shortLabel: "Exams",
        icon: GraduationCap,
        activeClass:
            "bg-amber-100 text-amber-700 shadow-md ring-2 ring-amber-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "competency",
        label: "Competencies",
        shortLabel: "Comp",
        icon: BookOpen,
        activeClass:
            "bg-teal-100 text-teal-700 shadow-md ring-2 ring-teal-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "wave",
        label: "Waves",
        shortLabel: "Waves",
        icon: Waves,
        activeClass:
            "bg-indigo-100 text-indigo-700 shadow-md ring-2 ring-indigo-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "overall",
        label: "Overview",
        shortLabel: "Overview",
        icon: BarChart3,
        activeClass:
            "bg-primary/10 text-primary shadow-md ring-2 ring-primary/20",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
];

/**
 * EXAMINATION REVIEW PANEL
 * Shows every question of each examination the fellow has taken, their answer,
 * MCQ correctness, and inputs for the admin to award marks on written questions.
 */
function ExaminationReviewPanel({ userId }: { userId: string }) {
    const [attempts, setAttempts] = useState<ExaminationAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, Record<string, number>>>({});
    const [notice, setNotice] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const list = await ExamService.getExaminationAttemptsByUser(userId);
            const finished = list.filter((a) => a.status !== "draft");
            setAttempts(finished);
            const initialDrafts: Record<string, Record<string, number>> = {};
            finished.forEach((a) => {
                initialDrafts[a.id] = { ...(a.written_scores || {}) };
            });
            setDrafts(initialDrafts);
        } catch (e) {
            console.error("Failed to load examination attempts", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const setWrittenScore = (attemptId: string, questionId: string, value: number) => {
        setDrafts((prev) => ({
            ...prev,
            [attemptId]: { ...(prev[attemptId] || {}), [questionId]: value },
        }));
    };

    const handleSaveGrades = async (attempt: ExaminationAttempt) => {
        setSavingId(attempt.id);
        try {
            const updated = await ExamService.gradeExaminationAttempt(
                attempt.id,
                drafts[attempt.id] || {},
                "Admin"
            );
            setAttempts((prev) => prev.map((a) => (a.id === attempt.id ? updated : a)));
            setNotice("Grades saved.");
            window.setTimeout(() => setNotice(null), 2500);
        } catch (e) {
            console.error("Failed to save grades", e);
            setNotice("Failed to save grades.");
        } finally {
            setSavingId(null);
        }
    };

    if (loading) return <LoadingState />;

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex items-start justify-between gap-4">
                <SectionHeader
                    icon={GraduationCap}
                    title="Examination Review & Grading"
                    description="Review answers and award marks for written responses."
                    color="bg-blue-100 text-blue-700"
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => load()}
                    className="shrink-0 rounded-xl"
                >
                    Refresh
                </Button>
            </div>

            {notice && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {notice}
                </div>
            )}

            {attempts.length === 0 ? (
                <EmptyState message="This fellow has not submitted any examinations yet." />
            ) : (
                <div className="space-y-6">
                    {attempts.map((attempt) => {
                        const hasUngradedWritten = attempt.competency_results.some((r) => !r.graded);
                        return (
                            <Card key={attempt.id} className="rounded-3xl border-2 border-[#E8E4D8] overflow-hidden">
                                <CardHeader className="bg-muted/30 flex flex-row items-center justify-between gap-3 flex-wrap">
                                    <div className="min-w-0">
                                        <CardTitle className="text-base sm:text-lg font-serif truncate">{attempt.title}</CardTitle>
                                        <p className="text-[11px] text-muted-foreground">
                                            Submitted {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "—"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={cn(
                                                "rounded-full",
                                                attempt.status === "graded"
                                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                    : "bg-blue-100 text-blue-700 border-blue-200"
                                            )}
                                        >
                                            {attempt.status === "graded" ? "Graded" : "Awaiting Review"}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-full font-black">{attempt.score}%</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-5 space-y-6">
                                    {attempt.competency_snapshots.map((snap) => {
                                        const result = attempt.competency_results.find(
                                            (r) => r.competency_id === snap.competency_id
                                        );
                                        return (
                                            <div key={snap.competency_id} className="space-y-3">
                                                <div className="flex items-center justify-between gap-2 border-b border-[#E8E4D8] pb-2">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-primary">
                                                        {snap.competency_title}
                                                    </h4>
                                                    {result && (
                                                        <span className="text-xs font-bold text-muted-foreground">
                                                            {result.mcq_correct}/{result.mcq_total} MCQ • {result.score}%
                                                        </span>
                                                    )}
                                                </div>

                                                {snap.questions.map((q, qi) => {
                                                    const answer = attempt.answers?.[q.id];
                                                    if (q.type === "multiple_choice") {
                                                        const correct = Number(answer) === q.correct_option_index;
                                                        return (
                                                            <div key={q.id} className="rounded-2xl border border-[#E8E4D8] p-4 space-y-2">
                                                                <p className="text-sm font-semibold text-foreground">
                                                                    {qi + 1}. {q.text}
                                                                </p>
                                                                <div className="space-y-1">
                                                                    {q.options.map((opt, oi) => (
                                                                        <div
                                                                            key={oi}
                                                                            className={cn(
                                                                                "flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
                                                                                oi === q.correct_option_index
                                                                                    ? "bg-emerald-50 text-emerald-700 font-bold"
                                                                                    : Number(answer) === oi
                                                                                        ? "bg-red-50 text-red-700"
                                                                                        : "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            <span className="font-black">{String.fromCharCode(65 + oi)}.</span>
                                                                            <span className="flex-1">{opt}</span>
                                                                            {oi === q.correct_option_index && <CheckCircle2 className="size-4" />}
                                                                            {Number(answer) === oi && oi !== q.correct_option_index && <X className="size-4" />}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <p className={cn("text-[11px] font-black uppercase", correct ? "text-emerald-600" : "text-red-600")}>
                                                                    {answer === undefined ? "Not answered" : correct ? "Correct" : "Incorrect"}
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div key={q.id} className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 space-y-3">
                                                            <p className="text-sm font-semibold text-foreground">
                                                                {qi + 1}. {q.text}
                                                            </p>
                                                            <div className="rounded-xl bg-white border border-[#E8E4D8] p-3">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                                                    Fellow&apos;s answer
                                                                </p>
                                                                <p className="text-sm font-serif italic text-[#1B4332] whitespace-pre-wrap">
                                                                    {(answer as string) || "— no answer —"}
                                                                </p>
                                                            </div>
                                                            {q.correct_written_answer && (
                                                                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">
                                                                        Rubric / model answer
                                                                    </p>
                                                                    <p className="text-xs text-emerald-900 whitespace-pre-wrap">{q.correct_written_answer}</p>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-3">
                                                                <label className="text-[11px] font-black uppercase tracking-widest text-blue-700">
                                                                    Award (0–1)
                                                                </label>
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={1}
                                                                    step={0.1}
                                                                    value={
                                                                        drafts[attempt.id]?.[q.id] ?? ""
                                                                    }
                                                                    onChange={(e) =>
                                                                        setWrittenScore(
                                                                            attempt.id,
                                                                            q.id,
                                                                            Math.max(0, Math.min(1, Number(e.target.value)))
                                                                        )
                                                                    }
                                                                    className="w-28 rounded-xl"
                                                                    placeholder="0 – 1"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}

                                    {attempt.competency_results.some((r) => r.written_total > 0) && (
                                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E8E4D8]">
                                            {hasUngradedWritten && (
                                                <span className="text-xs text-amber-600 font-medium mr-auto flex items-center gap-1">
                                                    <Clock className="size-3" /> Written answers still need scores.
                                                </span>
                                            )}
                                            <Button
                                                onClick={() => handleSaveGrades(attempt)}
                                                disabled={savingId === attempt.id}
                                                className="rounded-2xl h-11 px-6 bg-[#1B4332] text-white font-bold"
                                            >
                                                {savingId === attempt.id ? (
                                                    <Loader2 className="size-4 animate-spin mr-2" />
                                                ) : (
                                                    <Check className="size-4 mr-2" />
                                                )}
                                                Save Grades
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function FellowProgressTracker({
    fellowId,
    fellowName,
    userId,
}: FellowProgressTrackerProps) {
    const [activeView, setActiveView] = useState<TrackingView>("portfolio");
    const [reviewingPortfolio, setReviewingPortfolio] =
        useState<Portfolio | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Data State
    const [loading, setLoading] = useState(true);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [progress, setProgress] = useState<PhaseProgress[]>([]);
    const [groundingResults, setGroundingResults] = useState<GroundingResult[]>(
        []
    );
    const [waveResults, setWaveResults] = useState<WaveResult[]>([]);
    const [biLookup, setBiLookup] = useState<
        Record<string, BehavioralIndicator>
    >({});
    const [compLookup, setCompLookup] = useState<Record<string, Competency>>(
        {}
    );
    const [waveLookup, setWaveLookup] = useState<Wave[]>([]);
    const [gmLookup, setGmLookup] = useState<Record<string, GroundingModule>>(
        {}
    );
    const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
    const [competencyWaveMeta, setCompetencyWaveMeta] = useState<
        Record<string, { waveNumber: number; waveName: string; displayOrder: number }>
    >({});
    const [orderedWaves, setOrderedWaves] = useState<{ number: number; name: string }[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                _portfolios,
                _progress,
                _grounding,
                _waveResults,
                _bis,
                _comps,
                _waves,
                _modules,
                _examAttempts,
                _profile,
                _waveComps,
            ] = await Promise.all([
                FellowProgressService.getPortfoliosByFellow(userId),
                FellowProgressService.getPhaseProgressByFellow(userId),
                FellowProgressService.getGroundingResultsByFellow(userId),
                FellowProgressService.getWaveResultsByFellow(userId),
                FellowProgressService.getAllBehavioralIndicators(),
                FellowProgressService.getAllCompetencies(),
                FellowProgressService.getAllWaves(),
                FellowProgressService.getGroundingModules(),
                ExamService.getAttemptsByUser(userId),
                FellowService.getFellowProfile(userId),
                FellowProgressService.getAllWaveCompetencies(),
            ]);

            setPortfolios(
                _portfolios.sort((a, b) =>
                    b.created_at.localeCompare(a.created_at)
                )
            );
            setProgress(_progress);
            setGroundingResults(_grounding);
            setWaveResults(_waveResults);
            setBiLookup(Object.fromEntries(_bis.map((b) => [b.id, b])));
            setCompLookup(Object.fromEntries(_comps.map((c) => [c.id, c])));
            setWaveLookup(_waves);
            setGmLookup(Object.fromEntries(_modules.map((m) => [m.id, m])));
            setExamAttempts(_examAttempts);

            // Build wave -> competency ordering for this fellow's cohort.
            const cohortId = _profile?.cohort_id;
            const cohortWaves = (cohortId ? _waves.filter((w) => w.cohort_id === cohortId) : [])
                .sort((a, b) => a.number - b.number);
            setOrderedWaves(
                cohortWaves.map((w) => ({ number: w.number, name: w.name || `Wave ${w.number}` }))
            );
            const waveById: Record<string, Wave> = Object.fromEntries(cohortWaves.map((w) => [w.id, w]));
            const meta: Record<string, { waveNumber: number; waveName: string; displayOrder: number }> = {};
            _waveComps.forEach((wc) => {
                const w = waveById[wc.wave_id];
                if (!w) return;
                const candidate = {
                    waveNumber: w.number,
                    waveName: w.name || `Wave ${w.number}`,
                    displayOrder: wc.display_order ?? Number.MAX_SAFE_INTEGER,
                };
                const current = meta[wc.competency_id];
                if (
                    !current ||
                    candidate.waveNumber < current.waveNumber ||
                    (candidate.waveNumber === current.waveNumber &&
                        candidate.displayOrder < current.displayOrder)
                ) {
                    meta[wc.competency_id] = candidate;
                }
            });
            setCompetencyWaveMeta(meta);
        } catch (e) {
            console.error("Failed to fetch fellow tracking data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const handleSaveReview = async (
        status: PortfolioStatus,
        feedback: string,
        score: number
    ) => {
        if (!reviewingPortfolio) return;
        try {
            // Update the EXISTING portfolio with review feedback
            // This does NOT create a new portfolio, it updates the existing one
            await FellowProgressService.updatePortfolioReview(
                reviewingPortfolio.id,
                {
                    status,
                    feedback,
                    score,
                    reviewed_by: "Admin",
                }
            );
            
            // Update local state to reflect the changes immediately
            setPortfolios((prev) =>
                prev.map((p) =>
                    p.id === reviewingPortfolio.id
                        ? {
                            ...p,
                            status,
                            feedback,
                            score,
                            reviewed_at: new Date().toISOString(),
                        }
                        : p
                )
            );
            setReviewingPortfolio(null);
        } catch (e) {
            alert("Failed to save review. Please try again.");
        }
    };

    const handleUpdateExamScore = async (waveId: string, score: number) => {
        const result = waveResults.find((r) => r.wave_id === waveId);
        if (!result) return;

        try {
            await FellowProgressService.updateWaveResult(result.id, {
                exam_score: score,
                // Recalculate final score if needed, or let the service handle it next time
                final_score: Math.round((result.competency_avg + score + result.grounding_score) / 3),
            });

            setWaveResults((prev) =>
                prev.map((r) =>
                    r.id === result.id
                        ? {
                            ...r,
                            exam_score: score,
                            final_score: Math.round((r.competency_avg + score + r.grounding_score) / 3),
                        }
                        : r
                )
            );
        } catch (e) {
            alert("Failed to update exam score.");
        }
    };

    const handleUpdateGroundingScore = async (resultId: string, score: number) => {
        try {
            await FellowProgressService.updateGroundingResult(resultId, {
                score: score,
                is_passed: score >= 75,
            });

            setGroundingResults((prev) =>
                prev.map((r) =>
                    r.id === resultId
                        ? {
                            ...r,
                            score: score,
                            is_passed: score >= 75,
                        }
                        : r
                )
            );
        } catch (e) {
            alert("Failed to update grounding score.");
        }
    };

    const handleUpdateCompExamScore = async (compId: string, scoreOutOf20: number) => {
        // Find existing attempt for this competency
        const existingAttempt = examAttempts.find((a) => a.exam_id === compId);
        
        // Normalize 0-20 to 0-100 for internal consistency
        const normalizedScore = scoreOutOf20 * 5;

        try {
            if (existingAttempt) {
                await ExamService.updateExamAttempt(existingAttempt.id, {
                    score: normalizedScore,
                    passed: normalizedScore >= 75,
                });

                setExamAttempts((prev) =>
                    prev.map((a) =>
                        a.id === existingAttempt.id
                            ? { ...a, score: normalizedScore, passed: normalizedScore >= 75 }
                            : a
                    )
                );
            } else {
                // Create a manual attempt record
                const attemptId = await ExamService.submitExamAttempt({
                    exam_id: compId,
                    user_id: userId,
                    score: normalizedScore,
                    passed: normalizedScore >= 75,
                });

                const newAttempt: ExamAttempt = {
                    id: attemptId,
                    exam_id: compId,
                    user_id: userId,
                    score: normalizedScore,
                    passed: normalizedScore >= 75,
                    submitted_at: new Date().toISOString(),
                };

                setExamAttempts((prev) => [...prev, newAttempt]);
            }
        } catch (e) {
            alert("Failed to update competency exam score.");
        }
    };

    if (loading) return <LoadingState />;

    // Calculate quick stats
    const overallAvg =
        waveResults.length > 0
            ? Math.round(
                waveResults.reduce((a, b) => a + b.final_score, 0) /
                waveResults.length
            )
            : 0;
    const approvedPortfolios = portfolios.filter(
        (p) => p.status === "approved"
    ).length;
    const quizzesTaken = progress.filter(
        (p) => p.phase_type === "know"
    ).length;
    const mindsetsLocked = progress.filter(
        (p) => p.phase_type === "believe" && p.believe_passed
    ).length;

    const activeTab = TABS.find((t) => t.view === activeView)!;

    const renderView = () => {
        if (reviewingPortfolio) {
            return (
                <PortfolioReviewPanel
                    portfolio={reviewingPortfolio}
                    biLookup={biLookup}
                    onClose={() => setReviewingPortfolio(null)}
                    onSave={handleSaveReview}
                />
            );
        }

        switch (activeView) {
            case "portfolio":
                return (
                    <PortfolioView
                        portfolios={portfolios}
                        biLookup={biLookup}
                        compLookup={compLookup}
                        onReview={setReviewingPortfolio}
                    />
                );
            case "quiz":
                return (
                    <QuizView
                        progress={progress}
                        biLookup={biLookup}
                        compLookup={compLookup}
                    />
                );
            case "detail":
                return (
                    <div className="space-y-10">
                        <ExaminationReviewPanel userId={userId} />
                        <DetailExamView
                            groundingResults={groundingResults}
                            waveResults={waveResults}
                            waves={waveLookup}
                            gmLookup={gmLookup}
                            onUpdateExamScore={handleUpdateExamScore}
                            onUpdateGroundingScore={handleUpdateGroundingScore}
                        />
                    </div>
                );
            case "competency":
                return (
                    <CompetencyView
                        progress={progress}
                        biLookup={biLookup}
                        compLookup={compLookup}
                        portfolios={portfolios}
                        examAttempts={examAttempts}
                        groundingResults={groundingResults}
                    />
                );
            case "wave":
                return (
                    <WaveView waveResults={waveResults} waves={waveLookup} />
                );
            case "overall":
                return (
                    <OverallView
                        fellowName={fellowName}
                        waveResults={waveResults}
                        portfolios={portfolios}
                        progress={progress}
                    />
                );
            case "performance":
                return (
                    <PerformanceBreakdownView
                        progress={progress}
                        portfolios={portfolios}
                        biLookup={biLookup}
                        compLookup={compLookup}
                        groundingResults={groundingResults}
                        examAttempts={examAttempts}
                        competencyWaveMeta={competencyWaveMeta}
                        orderedWaves={orderedWaves}
                        onUpdateCompExamScore={handleUpdateCompExamScore}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-full overflow-hidden space-y-3 sm:space-y-4 md:space-y-6">
            {/* Quick Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {[
                    {
                        icon: BarChart3,
                        label: "Overall",
                        value: `${overallAvg}%`,
                        sub: "Program Average",
                        gradientFrom: "from-primary/10",
                        gradientTo: "to-primary/5",
                        borderColor: "border-primary/20",
                        iconBg: "bg-primary/20",
                        iconColor: "text-primary",
                        textColor: "text-primary",
                        labelColor: "text-primary/70",
                        subColor: "text-primary/60",
                    },
                    {
                        icon: FileText,
                        label: "Portfolio",
                        value: approvedPortfolios,
                        sub: "Approved Items",
                        gradientFrom: "from-emerald-50",
                        gradientTo: "to-white",
                        borderColor: "border-emerald-100",
                        iconBg: "bg-emerald-100",
                        iconColor: "text-emerald-700",
                        textColor: "text-emerald-700",
                        labelColor: "text-emerald-700/70",
                        subColor: "text-emerald-600/60",
                    },
                    {
                        icon: Brain,
                        label: "Quizzes",
                        value: quizzesTaken,
                        sub: "Completed",
                        gradientFrom: "from-blue-50",
                        gradientTo: "to-white",
                        borderColor: "border-blue-100",
                        iconBg: "bg-blue-100",
                        iconColor: "text-blue-700",
                        textColor: "text-blue-700",
                        labelColor: "text-blue-700/70",
                        subColor: "text-blue-600/60",
                    },
                    {
                        icon: Heart,
                        label: "Mindsets",
                        value: mindsetsLocked,
                        sub: "Locked In",
                        gradientFrom: "from-purple-50",
                        gradientTo: "to-white",
                        borderColor: "border-purple-100",
                        iconBg: "bg-purple-100",
                        iconColor: "text-purple-700",
                        textColor: "text-purple-700",
                        labelColor: "text-purple-700/70",
                        subColor: "text-purple-600/60",
                    },
                ].map((stat, i) => {
                    const StatIcon = stat.icon;
                    return (
                        <div
                            key={i}
                            className={cn(
                                "p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br border-2 min-w-0",
                                stat.gradientFrom,
                                stat.gradientTo,
                                stat.borderColor
                            )}
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                <div
                                    className={cn(
                                        "size-7 sm:size-8 md:size-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
                                        stat.iconBg
                                    )}
                                >
                                    <StatIcon
                                        className={cn(
                                            "size-3.5 sm:size-4 md:size-5",
                                            stat.iconColor
                                        )}
                                    />
                                </div>
                                <p
                                    className={cn(
                                        "text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate",
                                        stat.labelColor
                                    )}
                                >
                                    {stat.label}
                                </p>
                            </div>
                            <p
                                className={cn(
                                    "text-2xl sm:text-3xl md:text-4xl font-serif font-black",
                                    stat.textColor
                                )}
                            >
                                {stat.value}
                            </p>
                            <p
                                className={cn(
                                    "text-[9px] sm:text-[10px] md:text-xs font-medium mt-0.5 sm:mt-1 truncate",
                                    stat.subColor
                                )}
                            >
                                {stat.sub}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Tab Navigation */}
            <div className="w-full max-w-full overflow-hidden">
                {/* Mobile: Dropdown-style Tab Selector */}
                <div className="block sm:hidden">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={cn(
                            "w-full flex items-center justify-between gap-2 p-3 rounded-2xl border-2 border-[#E8E4D8] bg-white shadow-sm transition-all",
                            mobileMenuOpen && "rounded-b-none border-b-0"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <activeTab.icon className="size-4 shrink-0" />
                            <span className="font-serif font-bold text-sm">
                                {activeTab.label}
                            </span>
                            {activeView === "portfolio" && portfolios.length > 0 && (
                                <Badge className="rounded-full bg-primary/10 text-primary border-none text-[8px] font-black px-1.5 py-0.5">
                                    {portfolios.length}
                                </Badge>
                            )}
                        </div>
                        <ChevronDown
                            className={cn(
                                "size-4 text-muted-foreground transition-transform",
                                mobileMenuOpen && "rotate-180"
                            )}
                        />
                    </button>
                    {mobileMenuOpen && (
                        <div className="bg-white border-2 border-t-0 border-[#E8E4D8] rounded-b-2xl shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeView === tab.view;
                                return (
                                    <button
                                        key={tab.view}
                                        onClick={() => {
                                            setActiveView(tab.view);
                                            setReviewingPortfolio(null);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[#E8E4D8] last:border-b-0",
                                            isActive
                                                ? "bg-primary/5 text-primary"
                                                : "text-muted-foreground hover:bg-muted/20 hover:text-foreground active:bg-muted/30"
                                        )}
                                    >
                                        <Icon className="size-4 shrink-0" />
                                        <span className="font-serif font-bold text-sm flex-1">
                                            {tab.label}
                                        </span>
                                        {isActive && (
                                            <CheckCircle2 className="size-4 text-primary shrink-0" />
                                        )}
                                        {tab.view === "portfolio" &&
                                            portfolios.length > 0 && (
                                                <Badge className="rounded-full bg-primary/10 text-primary border-none text-[8px] font-black px-1.5 py-0.5">
                                                    {portfolios.length}
                                                </Badge>
                                            )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Tablet+: Horizontal scrollable tabs */}
                <div className="hidden sm:block bg-white rounded-2xl md:rounded-3xl border-2 border-[#E8E4D8] p-1.5 sm:p-2 shadow-sm overflow-x-auto scrollbar-none">
                    <div className="flex gap-1 sm:gap-1.5 md:gap-2 min-w-max">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeView === tab.view;
                            return (
                                <button
                                    key={tab.view}
                                    onClick={() => {
                                        setActiveView(tab.view);
                                        setReviewingPortfolio(null);
                                    }}
                                    className={cn(
                                        "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl md:rounded-2xl font-serif font-bold text-[10px] sm:text-xs md:text-sm transition-all whitespace-nowrap",
                                        isActive
                                            ? tab.activeClass
                                            : tab.inactiveClass
                                    )}
                                >
                                    <Icon className="size-3.5 sm:size-4 md:size-5 shrink-0" />
                                    {/* Show short labels on sm, full on md+ */}
                                    <span className="hidden md:inline">
                                        {tab.label}
                                    </span>
                                    <span className="md:hidden">
                                        {tab.shortLabel}
                                    </span>
                                    {tab.view === "portfolio" &&
                                        portfolios.length > 0 && (
                                            <Badge className="ml-0.5 sm:ml-1 rounded-full bg-white/80 text-foreground border-none text-[8px] font-black px-1 sm:px-1.5 py-0.5">
                                                {portfolios.length}
                                            </Badge>
                                        )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="w-full max-w-full overflow-hidden bg-white border-2 border-[#E8E4D8] rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-lg animate-in fade-in duration-300">
                {renderView()}
            </div>
        </div>
    );
}