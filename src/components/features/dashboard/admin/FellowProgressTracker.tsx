"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { RequiredMark } from "@/components/ui/label";
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
    ChevronUp,
    Menu,
    Check,
    Edit2,
    Sparkles,
} from "lucide-react";
import { FellowProgressService, buildCompetencyPerformance } from "@/services/FellowProgressService";
import { FellowService } from "@/services/FellowService";
import { ExamService, ExamAttempt, ExaminationAttempt, formatExaminationMarks } from "@/services/ExamService";
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
    competencyWaveMeta,
    onReview,
}: {
    portfolios: Portfolio[];
    biLookup: Record<string, BehavioralIndicator>;
    compLookup: Record<string, Competency>;
    competencyWaveMeta: Record<string, { waveNumber: number; waveName: string; displayOrder: number }>;
    onReview: (p: Portfolio) => void;
}) {
    const [compFilter, setCompFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Filter competencies strictly to fellow's active cohort
    const cohortCompList = useMemo(() => {
        const hasWaveScope = Object.keys(competencyWaveMeta || {}).length > 0;
        if (hasWaveScope) {
            return Object.values(compLookup).filter((c) => !!competencyWaveMeta[c.id]);
        }
        return Object.values(compLookup);
    }, [compLookup, competencyWaveMeta]);

    const cohortCompIds = useMemo(() => new Set(cohortCompList.map((c) => c.id)), [cohortCompList]);

    // Map status filter to portfolio statuses
    const mapStatusToSet = (key: string) => {
        switch (key) {
            case "submitted":
                return new Set(["submitted", "under_review", "resubmitted"]);
            case "approved":
                return new Set(["approved"]);
            case "rejected":
                return new Set(["rejected"]);
            case "all":
            default:
                return null;
        }
    };

    const statusSet = mapStatusToSet(statusFilter);

    // Filter portfolios: ONLY show items for fellow's cohort competencies
    const filtered = portfolios.filter((p) => {
        const bi = biLookup[p.behavioral_indicator_id];
        // Must belong to fellow's cohort competency
        if (bi && !cohortCompIds.has(bi.competency_id)) return false;

        if (statusSet && !statusSet.has(p.status)) return false;
        if (compFilter !== "all") {
            if (!bi || bi.competency_id !== compFilter) return false;
        }
        return true;
    });

    // Sort by wave, competency, then BI
    const sorted = filtered.sort((a, b) => {
        const biA = biLookup[a.behavioral_indicator_id];
        const biB = biLookup[b.behavioral_indicator_id];
        const compA = biA ? compLookup[biA.competency_id]?.title || "" : "";
        const compB = biB ? compLookup[biB.competency_id]?.title || "" : "";
        if (compA.toLowerCase() < compB.toLowerCase()) return -1;
        if (compA.toLowerCase() > compB.toLowerCase()) return 1;
        const biTitleA = biA?.title || "";
        const biTitleB = biB?.title || "";
        return biTitleA.toLowerCase().localeCompare(biTitleB.toLowerCase());
    });

    // Portfolio Stats Overview
    const totalCohortPortfolios = filtered.length;
    const approvedCount = filtered.filter((p) => p.status === "approved").length;
    const pendingCount = filtered.filter((p) => ["submitted", "under_review", "resubmitted"].includes(p.status)).length;
    const rejectedCount = filtered.filter((p) => p.status === "rejected").length;
    const avgScore =
        filtered.filter((p) => typeof p.score === "number" && p.score > 0).length > 0
            ? Math.round(
                filtered
                    .filter((p) => typeof p.score === "number" && p.score > 0)
                    .reduce((sum, p) => sum + (p.score || 0), 0) /
                filtered.filter((p) => typeof p.score === "number" && p.score > 0).length
            )
            : 0;

    const statusBadgeClass = (status: string) =>
        cn(
            "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider",
            status === "approved"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : status === "rejected"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : status === "submitted" || status === "under_review"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
        );

    return (
        <div className="space-y-5 sm:space-y-6">
            <SectionHeader
                icon={FileText}
                title="Portfolio Submissions (Do Phase)"
                description="STAR method evidence submissions, status review, and 50-mark performance grading."
                color="bg-emerald-100 text-emerald-700"
            />

            {/* Portfolio Summary Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Approved</p>
                        <CheckCircle2 className="size-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-serif font-black text-emerald-950 mt-1">
                        {approvedCount}
                    </p>
                    <p className="text-[10px] text-emerald-700/70 mt-1 font-medium">Approved Submissions</p>
                </Card>

                <Card className="p-4 sm:p-5 rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/60 to-white shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Pending</p>
                        <Clock className="size-4 text-blue-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-serif font-black text-blue-950 mt-1">
                        {pendingCount}
                    </p>
                    <p className="text-[10px] text-blue-700/70 mt-1 font-medium">Awaiting Evaluation</p>
                </Card>

                <Card className="p-4 sm:p-5 rounded-2xl border-2 border-amber-100 bg-gradient-to-br from-amber-50/60 to-white shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Needs Revision</p>
                        <AlertCircle className="size-4 text-amber-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-serif font-black text-amber-950 mt-1">
                        {rejectedCount}
                    </p>
                    <p className="text-[10px] text-amber-700/70 mt-1 font-medium">Revision Requested</p>
                </Card>

                <Card className="p-4 sm:p-5 rounded-2xl border-2 border-[#1B4332]/20 bg-[#1B4332] text-white shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Average Score</p>
                        <Star className="size-4 text-amber-300" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-serif font-black text-white mt-1">
                        {avgScore} <span className="text-sm font-medium text-white/50">/ 50</span>
                    </p>
                    <p className="text-[10px] text-white/70 mt-1 font-medium">Do Phase Performance</p>
                </Card>
            </div>

            {/* Controls & Filter Bar */}
            <div className="bg-stone-50/90 border-2 border-[#E8E4D8] p-4 sm:p-5 rounded-2xl sm:rounded-3xl space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[#1B4332]">
                        <FileText className="size-5 text-primary" />
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">Filter Portfolio Submissions</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Status Filter Selector */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 pl-3 pr-8 rounded-xl border-2 border-[#E8E4D8] bg-white text-xs font-bold text-foreground focus:border-[#1B4332] outline-none cursor-pointer appearance-none shadow-2xs"
                            >
                                <option value="all">All Statuses ({portfolios.length})</option>
                                <option value="submitted">Pending Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Needs Revision</option>
                            </select>
                            <ChevronDown className="size-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Cohort Competencies Filter Dropdown */}
                        <div className="relative min-w-[220px]">
                            <select
                                value={compFilter}
                                onChange={(e) => setCompFilter(e.target.value)}
                                className="w-full h-10 pl-3 pr-8 rounded-xl border-2 border-[#E8E4D8] bg-white text-xs font-bold text-foreground focus:border-[#1B4332] outline-none cursor-pointer appearance-none shadow-2xs"
                            >
                                <option value="all">All Cohort Competencies ({cohortCompList.length})</option>
                                {cohortCompList.map((c) => {
                                    const meta = competencyWaveMeta[c.id];
                                    const prefix = meta ? `[W${meta.waveNumber}] ` : "";
                                    return (
                                        <option key={c.id} value={c.id}>
                                            {prefix}{c.code} - {c.title}
                                        </option>
                                    );
                                })}
                            </select>
                            <ChevronDown className="size-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Portfolio Submissions Cards Grid */}
            {sorted.length === 0 ? (
                <EmptyState message="No portfolio submissions found matching the selected cohort filters." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sorted.map((p, idx) => {
                        const bi = biLookup[p.behavioral_indicator_id];
                        const comp = bi ? compLookup[bi.competency_id] : null;
                        const meta = comp ? competencyWaveMeta[comp.id] : null;
                        const cleanBITitle = bi?.title ? bi.title.replace(/^BI\d+[\s:-]*/i, "") : "Behavioral Indicator";

                        return (
                            <Card
                                key={p.id}
                                className="rounded-3xl border-2 border-[#E8E4D8] hover:border-[#1B4332]/40 bg-white p-5 space-y-4 shadow-sm transition-all flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className="bg-[#1B4332] text-white text-[9px] font-black uppercase tracking-wider">
                                                    {meta ? `W${meta.waveNumber}:` : ""}{comp?.code || "COMP"}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-muted-foreground truncate">
                                                    {comp?.title}
                                                </span>
                                            </div>
                                            <h4 className="font-serif font-bold text-foreground text-sm sm:text-base leading-tight line-clamp-2">
                                                {cleanBITitle}
                                            </h4>
                                        </div>
                                        <Badge className={statusBadgeClass(p.status)}>
                                            {p.status.replace("_", " ")}
                                        </Badge>
                                    </div>

                                    {/* STAR Method Snippet Preview */}
                                    <div className="space-y-1.5 p-3 rounded-2xl bg-stone-50 border border-[#E8E4D8]">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#1B4332]">
                                            STAR Result Summary
                                        </p>
                                        <p className="text-xs text-foreground/80 line-clamp-2 font-serif italic">
                                            {p.star_result || p.star_action || p.star_situation || "— No STAR content provided —"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-[#E8E4D8]">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <ExternalLink className="size-3.5" />
                                            <span className="font-semibold text-[11px]">
                                                {p.evidence_urls?.length || 0} Evidence Link(s)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase">Score:</span>
                                            <span className="font-serif font-black text-sm text-[#1B4332]">
                                                {typeof p.score === "number" && p.score >= 0 ? `${p.score}/50` : "Not Graded"}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => onReview(p)}
                                        className="w-full h-11 rounded-2xl bg-[#1B4332] text-white font-serif font-bold text-xs shadow-sm hover:bg-[#1B4332]/90"
                                    >
                                        Review Submission & Grade
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
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
                    { label: "Situation", content: portfolio.star_situation, color: "border-indigo-200 bg-indigo-50/40 text-indigo-950", badge: "bg-indigo-100 text-indigo-800" },
                    { label: "Task", content: portfolio.star_task, color: "border-amber-200 bg-amber-50/40 text-amber-950", badge: "bg-amber-100 text-amber-800" },
                    { label: "Action", content: portfolio.star_action, color: "border-emerald-200 bg-emerald-50/40 text-emerald-950", badge: "bg-emerald-100 text-emerald-800" },
                    { label: "Result", content: portfolio.star_result, color: "border-primary/30 bg-primary/5 text-primary-950", badge: "bg-primary text-white" },
                ].map((s) => (
                    <div
                        key={s.label}
                        className={cn("p-4 rounded-2xl border-2 space-y-1.5", s.color)}
                    >
                        <div className="flex items-center justify-between">
                            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", s.badge)}>
                                {s.label}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-serif italic pt-1">
                            {s.content || "N/A"}
                        </p>
                    </div>
                ))}
            </div>

            {/* Evidence Links */}
            {portfolio.evidence_urls && portfolio.evidence_urls.length > 0 && (
                <div className="space-y-2.5 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">
                        Evidence Attachments ({portfolio.evidence_urls.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {portfolio.evidence_urls.map((url, i) => (
                            <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-3.5 py-2.5 bg-white border-2 border-[#E8E4D8] rounded-xl text-xs font-bold text-[#1B4332] hover:border-primary hover:bg-emerald-50/50 transition-all shadow-2xs group"
                            >
                                <ExternalLink className="size-3.5 group-hover:text-primary shrink-0" />
                                <span className="truncate">Evidence File #{i + 1}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin Review Input Form */}
            <div className="space-y-4 pt-4 border-t-2 border-dashed border-[#E8E4D8]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] px-1">
                            Review Decision Status
                        </label>
                        <div className="relative">
                            <select
                                className="w-full h-11 px-4 rounded-xl border-2 border-[#E8E4D8] focus:border-[#1B4332] outline-none bg-white font-serif font-bold text-xs sm:text-sm text-foreground appearance-none cursor-pointer shadow-2xs"
                                value={status}
                                onChange={(e) =>
                                    setStatus(e.target.value as PortfolioStatus)
                                }
                            >
                                <option value="submitted">Submitted (Pending Review)</option>
                                <option value="under_review">Under Review</option>
                                <option value="approved">Approved (Pass)</option>
                                <option value="rejected">Needs Revision / Rejected</option>
                            </select>
                            <ChevronDown className="size-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] px-1">
                            Do Performance Score (0 to 50 Marks)
                            <RequiredMark className="ml-0.5" />
                        </label>
                        <div className="relative">
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
                                className="rounded-xl border-2 border-[#E8E4D8] h-11 font-serif font-bold text-sm pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                / 50
                            </span>
                        </div>
                        {scoreError && (
                            <p className="text-[10px] text-red-600 mt-1 font-bold">{scoreError}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] px-1">
                        Facilitator Feedback & Remarks
                    </label>
                    <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="rounded-2xl border-2 border-[#E8E4D8] min-h-[110px] focus:border-[#1B4332] text-xs sm:text-sm font-serif p-3.5"
                        placeholder="Provide constructve feedback for the fellow..."
                    />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                    <Button
                        variant="outline"
                        className="rounded-2xl w-full sm:w-auto h-11 px-6 font-bold border-[#E8E4D8]"
                        onClick={onClose}
                    >
                        Cancel / Discard
                    </Button>
                    <Button
                        className="rounded-2xl px-8 shadow-md bg-[#1B4332] text-white w-full sm:w-auto h-11 font-bold hover:bg-[#1B4332]/90"
                        onClick={handleSubmit}
                        disabled={isSaving || !!scoreError}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Saving Evaluation...
                            </>
                        ) : (
                            "Save Portfolio Evaluation"
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

    const totalQuizzes = knowProgress.length;
    const passedCount = knowProgress.filter((p) => (p.know_score ?? 0) >= 75).length;
    const pendingCount = totalQuizzes - passedCount;
    const avgScore =
        totalQuizzes > 0
            ? Math.round(knowProgress.reduce((sum, p) => sum + (p.know_score ?? 0), 0) / totalQuizzes)
            : 0;

    if (knowProgress.length === 0)
        return <EmptyState message="No quizzes completed yet." />;

    return (
        <div className="space-y-5 sm:space-y-6">
            <SectionHeader
                icon={Brain}
                title="Quizzes & Knowledge Assessments (Know Phase)"
                description="Comprehensive breakdown of knowledge quiz attempts, pass/fail thresholds, and mastery scores."
                color="bg-blue-100 text-blue-700"
            />

            {/* Quiz Summary Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-4 sm:p-5 rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/60 to-white shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Quiz Average</p>
                        <Brain className="size-4 text-blue-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-serif font-black text-blue-950 mt-1">
                        {avgScore}%
                    </p>
                    <p className="text-[10px] text-blue-700/70 mt-1 font-medium">Know Phase Average</p>
                </Card>

                <Card className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Quizzes Passed</p>
                        <CheckCircle2 className="size-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-serif font-black text-emerald-950 mt-1">
                        {passedCount} <span className="text-sm text-emerald-700/60 font-normal">/ {totalQuizzes}</span>
                    </p>
                    <p className="text-[10px] text-emerald-700/70 mt-1 font-medium">Score ≥ 75%</p>
                </Card>

                <Card className="p-4 sm:p-5 rounded-2xl border-2 border-amber-100 bg-gradient-to-br from-amber-50/60 to-white shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Needs Review</p>
                        <Clock className="size-4 text-amber-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-serif font-black text-amber-950 mt-1">
                        {pendingCount}
                    </p>
                    <p className="text-[10px] text-amber-700/70 mt-1 font-medium">Below 75% Threshold</p>
                </Card>

                <Card className="p-4 sm:p-5 rounded-2xl border-2 border-[#1B4332]/20 bg-[#1B4332] text-white shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Total Assessments</p>
                        <BookOpen className="size-4 text-amber-300" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-serif font-black text-white mt-1">
                        {totalQuizzes}
                    </p>
                    <p className="text-[10px] text-white/70 mt-1 font-medium">Attempt Logs Tracked</p>
                </Card>
            </div>

            <ResponsiveTableCard
                mobileCards={knowProgress.map((p) => {
                    const bi = biLookup[p.behavioral_indicator_id];
                    const comp = bi ? compLookup[bi.competency_id] : null;
                    const score = p.know_score ?? 0;
                    const isPassed = score >= 75;
                    const cleanBITitle = bi?.title ? bi.title.replace(/^BI\d+[\s:-]*/i, "") : "Behavioral Indicator";

                    return (
                        <div
                            key={p.id}
                            className="p-4 rounded-2xl border-2 border-[#E8E4D8] bg-white space-y-3 shadow-xs"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <Badge className="bg-[#1B4332] text-white text-[9px] font-black uppercase">
                                            {comp?.code || "COMP"}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground truncate">
                                            {comp?.title}
                                        </span>
                                    </div>
                                    <h5 className="font-serif font-bold text-foreground text-sm leading-tight">
                                        {cleanBITitle}
                                    </h5>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-[#E8E4D8]">
                                <span className="font-serif font-black text-xl text-[#1B4332]">
                                    {score}%
                                </span>
                                {isPassed ? (
                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full text-[10px] font-black uppercase">
                                        Passed
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 rounded-full text-[10px] font-black uppercase">
                                        Pending / Retake
                                    </Badge>
                                )}
                            </div>
                        </div>
                    );
                })}
            >
                <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-stone-50 border-b-2 border-[#E8E4D8]">
                        <tr>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-[#1B4332]">
                                Competency / Behavioral Indicator
                            </th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-center">
                                Assessment Score
                            </th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E4D8]">
                        {knowProgress.map((p) => {
                            const bi = biLookup[p.behavioral_indicator_id];
                            const comp = bi ? compLookup[bi.competency_id] : null;
                            const score = p.know_score ?? 0;
                            const isPassed = score >= 75;
                            const cleanBITitle = bi?.title ? bi.title.replace(/^BI\d+[\s:-]*/i, "") : "Behavioral Indicator";

                            return (
                                <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="px-4 py-3.5">
                                        <div className="flex flex-col space-y-0.5">
                                            <span className="text-[10px] font-black uppercase text-[#1B4332]/70">
                                                {comp?.code} - {comp?.title || "Unknown Competency"}
                                            </span>
                                            <span className="font-bold text-foreground text-sm">
                                                {cleanBITitle}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-center font-serif font-black text-base text-[#1B4332]">
                                        {score}%
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        {isPassed ? (
                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full text-[10px] font-black uppercase">
                                                Passed
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 rounded-full text-[10px] font-black uppercase">
                                                Pending / Retake
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
 * BELIEVE VIEW (Mindsets & Grounding)
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

    const totalMindsets = believeProgress.length;
    const lockedCount = believeProgress.filter((p) => p.believe_passed).length;
    const lockPercentage = totalMindsets > 0 ? Math.round((lockedCount / totalMindsets) * 100) : 0;

    // Group mindsets by Competency for rich visual presentation
    const groupedMindsets = useMemo(() => {
        const map: Record<string, { comp: Competency | null; items: typeof believeProgress }> = {};

        believeProgress.forEach((p) => {
            const bi = biLookup[p.behavioral_indicator_id];
            const compId = bi?.competency_id || "unknown";
            const comp = bi ? compLookup[compId] : null;

            if (!map[compId]) {
                map[compId] = { comp, items: [] };
            }
            map[compId].items.push(p);
        });

        return Object.values(map);
    }, [believeProgress, biLookup, compLookup]);

    return (
        <div className="space-y-6 sm:space-y-8">
            <SectionHeader
                icon={Heart}
                title="Believe Phase (Mindsets & Grounding)"
                description="Engagement with foundation grounding modules, leadership mindsets, and gatekeeper reflections."
                color="bg-purple-100 text-purple-700"
            />

            {/* Grounding & Mindset Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* 1. Believe Lock-in Donut Card */}
                <Card className="p-6 rounded-3xl border-2 border-purple-100 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                        <Badge className="bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider">
                            Believe Lock-In
                        </Badge>
                        <h4 className="font-serif font-black text-xl text-purple-950">
                            Mindset Mastery
                        </h4>
                        <p className="text-xs text-purple-700 font-medium">
                            {lockedCount} of {totalMindsets} Mindsets Verified
                        </p>
                    </div>
                    <div className="shrink-0">
                        <CompetencyPieChart percentage={lockPercentage} size={90} strokeWidth={9} label="Lock-In" />
                    </div>
                </Card>

                {/* 2. Foundation Grounding Module Score */}
                <Card className="p-6 rounded-3xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                        <Badge className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
                            Grounding Gatekeeper
                        </Badge>
                        <h4 className="font-serif font-black text-xl text-emerald-950 truncate">
                            Introductory Grounding
                        </h4>
                        <p className="text-xs text-emerald-700 font-medium">Foundation Alignment Score</p>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="font-serif font-black text-3xl text-emerald-800">
                            {groundingResult?.score ?? 0}%
                        </span>
                        <Badge className="block mt-1 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                            Passed ✓
                        </Badge>
                    </div>
                </Card>

                {/* 3. Mindset Prerequisites Banner */}
                <Card className="p-6 rounded-3xl border-2 border-[#1B4332]/20 bg-[#1B4332] text-white shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                        <Badge className="bg-amber-400 text-[#1B4332] text-[9px] font-black uppercase">
                            Prerequisites
                        </Badge>
                        <Sparkles className="size-5 text-amber-300" />
                    </div>
                    <div>
                        <h4 className="font-serif font-black text-lg text-white">
                            Know-Phase Unlock
                        </h4>
                        <p className="text-xs text-white/80 font-medium mt-0.5">
                            Locking mindsets enables fellow progression into knowledge quizzes.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Grouped Competencies & Mindset Cards */}
            {groupedMindsets.length > 0 ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">
                            Mindset Reflections by Competency ({groupedMindsets.length})
                        </h4>
                        <span className="text-xs font-bold text-muted-foreground">
                            {lockedCount} Locked • {totalMindsets - lockedCount} Pending
                        </span>
                    </div>

                    <div className="space-y-6">
                        {groupedMindsets.map((g, idx) => {
                            const compTitle = g.comp ? g.comp.title : "Program Competency";
                            const compCode = g.comp ? g.comp.code : `COMP-${idx + 1}`;
                            const compLocked = g.items.filter((i) => i.believe_passed).length;
                            const compTotal = g.items.length;

                            return (
                                <Card key={idx} className="p-5 sm:p-6 rounded-3xl border-2 border-[#E8E4D8] bg-white space-y-4 shadow-xs">
                                    {/* Competency Header */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E4D8]">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-[#1B4332] text-white text-xs font-black uppercase px-2.5 py-1">
                                                {compCode}
                                            </Badge>
                                            <h5 className="font-serif font-black text-base sm:text-lg text-[#1B4332]">
                                                {compTitle}
                                            </h5>
                                        </div>
                                        <Badge className="bg-purple-100 text-purple-900 border-purple-200 text-xs font-bold px-3 py-1 rounded-full">
                                            {compLocked} of {compTotal} Mindsets Locked
                                        </Badge>
                                    </div>

                                    {/* Mindset Cards Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                        {g.items.map((p) => {
                                            const bi = biLookup[p.behavioral_indicator_id];
                                            const cleanBITitle = bi?.title
                                                ? bi.title.replace(/^BI\d+[\s:-]*/i, "")
                                                : "Behavioral Indicator";

                                            return (
                                                <div
                                                    key={p.id}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 transition-all flex items-start justify-between gap-3",
                                                        p.believe_passed
                                                            ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white"
                                                            : "border-amber-200 bg-gradient-to-br from-amber-50/50 to-white"
                                                    )}
                                                >
                                                    <div className="space-y-1.5 min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            {p.believe_passed ? (
                                                                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                                            ) : (
                                                                <Clock className="size-4 text-amber-600 shrink-0" />
                                                            )}
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground truncate">
                                                                Gatekeeper Indicator
                                                            </span>
                                                        </div>
                                                        <h6 className="font-serif font-bold text-sm text-foreground leading-snug">
                                                            {cleanBITitle}
                                                        </h6>
                                                    </div>

                                                    <div className="shrink-0 pt-0.5">
                                                        {p.believe_passed ? (
                                                            <Badge className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs">
                                                                Locked In ✓
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs">
                                                                Pending ⏳
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <EmptyState message="No believe phases started yet for this fellow." />
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
 * REUSABLE CIRCULAR PIE/DONUT CHART FOR COMPETENCY MASTERY
 */
function CompetencyPieChart({
    percentage,
    size = 140,
    strokeWidth = 14,
    label = "Mastery",
}: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

    const colorClass =
        percentage >= 75
            ? "stroke-[#1B4332]"
            : percentage >= 50
                ? "stroke-amber-500"
                : "stroke-indigo-600";

    const isSmall = size < 75;
    const isMedium = size >= 75 && size < 110;

    return (
        <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className="stroke-stone-200/80"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className={cn("transition-all duration-1000 ease-out", colorClass)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-0.5 pointer-events-none">
                <span
                    className={cn(
                        "font-serif font-black text-[#1B4332] leading-none tracking-tighter",
                        isSmall
                            ? "text-[11px]"
                            : isMedium
                                ? "text-base"
                                : "text-2xl sm:text-3xl"
                    )}
                >
                    {percentage}%
                </span>
                {label && !isSmall && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * COMPETENCY LEVEL MATRIX VIEW
 */
function CompetencyView({
    progress,
    biLookup,
    compLookup,
    portfolios,
    examAttempts,
    groundingResults,
    competencyWaveMeta,
}: {
    progress: PhaseProgress[];
    biLookup: Record<string, BehavioralIndicator>;
    compLookup: Record<string, Competency>;
    portfolios: Portfolio[];
    examAttempts: ExamAttempt[];
    groundingResults: GroundingResult[];
    competencyWaveMeta: Record<string, { waveNumber: number; waveName: string; displayOrder: number }>;
}) {
    const behavioralIndicators = useMemo(() => Object.values(biLookup), [biLookup]);
    const groundingScore = useMemo(() => groundingResults[0]?.score || 0, [groundingResults]);

    // Cohort-filtered competency list
    const cohortCompList = useMemo(() => {
        const hasWaveScope = Object.keys(competencyWaveMeta || {}).length > 0;
        let list = Object.values(compLookup);
        if (hasWaveScope) {
            list = list.filter((c) => !!competencyWaveMeta[c.id]);
        }
        return list.sort((a, b) => {
            const metaA = competencyWaveMeta[a.id];
            const metaB = competencyWaveMeta[b.id];
            if (metaA && metaB && metaA.waveNumber !== metaB.waveNumber) {
                return metaA.waveNumber - metaB.waveNumber;
            }
            return (metaA?.displayOrder || 0) - (metaB?.displayOrder || 0);
        });
    }, [compLookup, competencyWaveMeta]);

    // Selected competency state
    const [selectedCompId, setSelectedCompId] = useState<string>("");

    useEffect(() => {
        if (cohortCompList.length > 0 && (!selectedCompId || !cohortCompList.some((c) => c.id === selectedCompId))) {
            setSelectedCompId(cohortCompList[0].id);
        }
    }, [cohortCompList, selectedCompId]);

    // Compute detailed performance for all cohort competencies
    const compStats = useMemo(() => {
        return cohortCompList.map((comp) => {
            const performance = buildCompetencyPerformance(comp, {
                progress,
                portfolios,
                behavioralIndicators,
                examAttempts,
                groundingScoreOutOf10: groundingScore,
                biLookup,
            });
            const meta = competencyWaveMeta[comp.id];
            return {
                comp,
                meta,
                performance,
                avg: performance.compositeScore,
            };
        });
    }, [
        cohortCompList,
        progress,
        portfolios,
        behavioralIndicators,
        examAttempts,
        groundingScore,
        biLookup,
        competencyWaveMeta,
    ]);

    const activeStat = useMemo(() => {
        return compStats.find((s) => s.comp.id === selectedCompId) || compStats[0];
    }, [compStats, selectedCompId]);

    if (compStats.length === 0)
        return <EmptyState message="No competency data tracked for this cohort." />;

    return (
        <div className="space-y-6 sm:space-y-8">
            <SectionHeader
                icon={BookOpen}
                title="Competency Matrix & Pie Chart Analytics"
                description="Interactive competency selection, completion percentage pie charts, and granular BI performance breakdown."
                color="bg-teal-100 text-teal-700"
            />

            {/* 1. Competency Selection Cards Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">
                        Select Cohort Competency ({compStats.length})
                    </h4>
                    <span className="text-xs font-bold text-muted-foreground">Click a card to inspect analytics</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {compStats.map((s) => {
                        const isSelected = s.comp.id === selectedCompId;
                        return (
                            <button
                                key={s.comp.id}
                                onClick={() => setSelectedCompId(s.comp.id)}
                                className={cn(
                                    "p-4 rounded-2xl text-left border-2 transition-all flex items-center justify-between gap-3 shadow-2xs group cursor-pointer",
                                    isSelected
                                        ? "border-[#1B4332] bg-gradient-to-br from-emerald-50/90 to-white ring-2 ring-[#1B4332]/20 shadow-sm"
                                        : "border-[#E8E4D8] bg-white hover:border-[#1B4332]/40 hover:bg-stone-50/60"
                                )}
                            >
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <Badge
                                            className={cn(
                                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                                                isSelected ? "bg-[#1B4332] text-white" : "bg-stone-100 text-stone-700"
                                            )}
                                        >
                                            {s.meta ? `W${s.meta.waveNumber}` : ""}:{s.comp.code}
                                        </Badge>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                            Level {s.comp.level}
                                        </span>
                                    </div>
                                    <h5 className="font-serif font-bold text-xs sm:text-sm text-foreground leading-tight line-clamp-2">
                                        {s.comp.title}
                                    </h5>
                                </div>

                                {/* Mini Pie Chart Gauge with Fixed Font Scaling */}
                                <div className="shrink-0 flex items-center pl-2">
                                    <CompetencyPieChart percentage={s.avg} size={58} strokeWidth={7} label="" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Selected Competency Detailed Pie Chart & Mastery Dashboard */}
            {activeStat && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <Card className="rounded-3xl border-2 border-[#E8E4D8] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
                        {/* Header Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E8E4D8]">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                {/* Main Pie Chart Ring */}
                                <CompetencyPieChart percentage={activeStat.avg} size={130} strokeWidth={14} label="Composite" />

                                <div className="space-y-2 min-w-0 flex-1 pt-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className="bg-[#1B4332] text-white text-xs font-black uppercase tracking-wider">
                                            {activeStat.meta ? `Wave ${activeStat.meta.waveNumber}: ` : ""}{activeStat.comp.code}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-full text-xs font-bold border-[#E8E4D8]">
                                            Level {activeStat.comp.level}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-full text-xs font-bold border-[#E8E4D8]">
                                            Category: {activeStat.comp.category || "Leadership"}
                                        </Badge>
                                    </div>

                                    <h3 className="font-serif font-black text-xl sm:text-2xl text-[#1B4332]">
                                        {activeStat.comp.title}
                                    </h3>

                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                        {activeStat.comp.description || "Mastery evaluation across Believe, Know, Do phases, and wave examinations."}
                                    </p>
                                </div>
                            </div>

                            {/* Overall Status Badge */}
                            <div className="flex flex-col items-start md:items-end justify-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E8E4D8]">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                    Mastery Threshold (75%)
                                </span>
                                {activeStat.avg >= 75 ? (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-200">
                                        <CheckCircle2 className="size-5 text-emerald-700 shrink-0" />
                                        <span className="font-serif font-black text-sm">Target Met (Mastered)</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200">
                                        <Clock className="size-5 text-amber-700 shrink-0" />
                                        <span className="font-serif font-black text-sm">In Progress ({75 - activeStat.avg}% remaining)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Phase Components Breakdown Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Believe Phase */}
                            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                                <div className="flex items-center justify-between text-purple-900">
                                    <span className="text-[10px] font-black uppercase tracking-wider">Believe Phase</span>
                                    <Heart className="size-4 text-purple-600" />
                                </div>
                                <p className="text-xl font-serif font-black text-purple-950">
                                    {activeStat.performance.biBreakdown.filter((b) => b.believePassed).length} / {activeStat.performance.biBreakdown.length}
                                </p>
                                <p className="text-[10px] font-semibold text-purple-700">Mindsets Locked</p>
                            </div>

                            {/* Know Phase */}
                            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                                <div className="flex items-center justify-between text-blue-900">
                                    <span className="text-[10px] font-black uppercase tracking-wider">Know Phase (Quizzes)</span>
                                    <Brain className="size-4 text-blue-600" />
                                </div>
                                <p className="text-xl font-serif font-black text-blue-950">
                                    {Math.round(
                                        activeStat.performance.biBreakdown.reduce((a, b) => a + b.knowScore, 0) /
                                        (activeStat.performance.biBreakdown.length || 1)
                                    )}%
                                </p>
                                <p className="text-[10px] font-semibold text-blue-700">Knowledge Quiz Average</p>
                            </div>

                            {/* Do Phase */}
                            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                                <div className="flex items-center justify-between text-emerald-900">
                                    <span className="text-[10px] font-black uppercase tracking-wider">Do Phase (Portfolio)</span>
                                    <FileText className="size-4 text-emerald-600" />
                                </div>
                                <p className="text-xl font-serif font-black text-emerald-950">
                                    {Math.round(
                                        activeStat.performance.biBreakdown.reduce((a, b) => a + b.doScore, 0) /
                                        (activeStat.performance.biBreakdown.length || 1)
                                    )} <span className="text-xs text-emerald-700 font-normal">/ 50</span>
                                </p>
                                <p className="text-[10px] font-semibold text-emerald-700">STAR Evidence Evaluation</p>
                            </div>

                            {/* Exam Score */}
                            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                                <div className="flex items-center justify-between text-amber-900">
                                    <span className="text-[10px] font-black uppercase tracking-wider">Wave Examination</span>
                                    <GraduationCap className="size-4 text-amber-600" />
                                </div>
                                <p className="text-xl font-serif font-black text-amber-950">
                                    {activeStat.performance.examScore}%
                                </p>
                                <p className="text-[10px] font-semibold text-amber-700">Final Wave Exam Grade</p>
                            </div>
                        </div>

                        {/* 3. Behavioral Indicator Granular Table */}
                        <div className="space-y-3 pt-4 border-t border-[#E8E4D8]">
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#1B4332]">
                                Behavioral Indicators ({activeStat.performance.biBreakdown.length})
                            </h4>

                            <ResponsiveTableCard
                                mobileCards={activeStat.performance.biBreakdown.map((bi) => (
                                    <div key={bi.id} className="p-4 rounded-2xl border-2 border-[#E8E4D8] bg-white space-y-2">
                                        <p className="font-serif font-bold text-sm text-foreground">
                                            {bi.title.replace(/^BI\d+[\s:-]*/i, "")}
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-stone-100 text-xs">
                                            <div>
                                                <span className="text-[9px] font-bold text-muted-foreground block">Believe</span>
                                                <span className="font-bold">{bi.believePassed ? "✓ Passed" : "Pending"}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-muted-foreground block">Know</span>
                                                <span className="font-bold">{bi.knowScore}%</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-muted-foreground block">Do</span>
                                                <span className="font-bold">{bi.doScore}/50</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            >
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-stone-50 border-b-2 border-[#E8E4D8]">
                                        <tr>
                                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-[#1B4332]">
                                                Behavioral Indicator
                                            </th>
                                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-center">
                                                Believe (Mindset)
                                            </th>
                                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-center">
                                                Know (Quiz)
                                            </th>
                                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-center">
                                                Do (Portfolio)
                                            </th>
                                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">
                                                BI Composite Score
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8E4D8]">
                                        {activeStat.performance.biBreakdown.map((bi) => (
                                            <tr key={bi.id} className="hover:bg-stone-50/50">
                                                <td className="px-4 py-3.5 font-bold text-foreground">
                                                    {bi.title.replace(/^BI\d+[\s:-]*/i, "")}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {bi.believePassed ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">Passed</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground text-[10px]">Pending</Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center font-bold">
                                                    {bi.knowScore}%
                                                </td>
                                                <td className="px-4 py-3.5 text-center font-bold">
                                                    {bi.doScore} / 50
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-serif font-black text-sm text-[#1B4332]">
                                                    {bi.score}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </ResponsiveTableCard>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

/**
 * WAVE LEVEL TIMELINE VIEW
 */
function WaveView({
    waveResults,
    waves,
}: {
    waveResults: WaveResult[];
    waves: Wave[];
}) {
    if (waveResults.length === 0)
        return <EmptyState message="No wave results finalized for this fellow." />;

    return (
        <div className="space-y-6 sm:space-y-8">
            <SectionHeader
                icon={Waves}
                title="Wave Timeline & Milestones"
                description="Chronological wave progress tracking, composite wave grades, and milestone evaluations."
                color="bg-indigo-100 text-indigo-700"
            />

            {/* Timeline Cards Container */}
            <div className="relative space-y-6 before:absolute before:inset-0 before:left-6 sm:before:left-8 before:w-1 before:bg-[#E8E4D8] before:z-0">
                {waveResults.map((r, idx) => {
                    const wave = waves.find((w) => w.id === r.wave_id);
                    const isPassed = r.final_score >= 75;

                    return (
                        <div key={r.id} className="relative z-10 flex items-start gap-4 sm:gap-6">
                            {/* Wave Number Circle Icon */}
                            <div
                                className={cn(
                                    "size-12 sm:size-16 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-white font-serif font-black shadow-md shrink-0 border-4 border-white",
                                    isPassed ? "bg-[#1B4332]" : "bg-indigo-600"
                                )}
                            >
                                <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider">Wave</span>
                                <span className="text-base sm:text-xl font-serif font-black leading-none">
                                    {wave?.number ?? (idx + 1)}
                                </span>
                            </div>

                            {/* Wave Details Card */}
                            <Card className="flex-1 rounded-3xl border-2 border-[#E8E4D8] bg-white p-5 sm:p-6 space-y-4 shadow-sm hover:border-[#1B4332]/40 transition-all">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E4D8]">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className="bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase tracking-wider">
                                                Milestone Wave {wave?.number ?? (idx + 1)}
                                            </Badge>
                                            {isPassed && (
                                                <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                                                    Mastery Met ✓
                                                </Badge>
                                            )}
                                        </div>
                                        <h4 className="font-serif font-black text-lg sm:text-xl text-[#1B4332]">
                                            {wave?.name || `Program Wave ${idx + 1}`}
                                        </h4>
                                    </div>

                                    {/* Final Wave Score Pill */}
                                    <div className="flex items-center gap-3 bg-stone-50 px-4 py-2 rounded-2xl border border-[#E8E4D8]">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                Wave Grade
                                            </p>
                                            <p className="text-2xl font-serif font-black text-[#1B4332]">
                                                {r.final_score}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Component Score Contributions Grid */}
                                <div className="grid grid-cols-3 gap-3 text-center pt-1">
                                    <div className="p-3 rounded-2xl bg-stone-50 border border-[#E8E4D8]">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground">Competency Avg</p>
                                        <p className="font-serif font-black text-base text-foreground mt-0.5">{r.competency_avg}%</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                                        <p className="text-[9px] font-black uppercase text-amber-800">Final Exam</p>
                                        <p className="font-serif font-black text-base text-amber-950 mt-0.5">{r.exam_score}%</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                                        <p className="text-[9px] font-black uppercase text-purple-800">Grounding</p>
                                        <p className="font-serif font-black text-base text-purple-950 mt-0.5">{r.grounding_score}%</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * OVERALL PROGRAM PERFORMANCE VIEW
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
    const overallAvg = useMemo(() => {
        if (waveResults.length === 0) return 0;
        return Math.round(
            waveResults.reduce((a, b) => a + b.final_score, 0) / waveResults.length
        );
    }, [waveResults]);

    // 1. Believe Phase Stats
    const believeProgress = useMemo(() => progress.filter((p) => p.phase_type === "believe"), [progress]);
    const believeLocked = useMemo(() => believeProgress.filter((p) => p.believe_passed).length, [believeProgress]);
    const believePct = useMemo(() => believeProgress.length > 0 ? Math.round((believeLocked / believeProgress.length) * 100) : 0, [believeProgress, believeLocked]);

    // 2. Know Phase Stats
    const knowProgress = useMemo(() => progress.filter((p) => p.phase_type === "know"), [progress]);
    const knowAvg = useMemo(() => {
        if (knowProgress.length === 0) return 0;
        return Math.round(knowProgress.reduce((a, b) => a + (b.know_score ?? 0), 0) / knowProgress.length);
    }, [knowProgress]);

    // 3. Do Phase (Portfolio) Stats
    const approvedPortfolios = useMemo(() => portfolios.filter((p) => p.status === "approved"), [portfolios]);
    const doAvgScore = useMemo(() => {
        if (approvedPortfolios.length === 0) return 0;
        const total = approvedPortfolios.reduce((a, b) => a + ((b as any).score ?? (b as any).do_score ?? 0), 0);
        return Math.round((total / (approvedPortfolios.length * 50)) * 100);
    }, [approvedPortfolios]);

    // 4. Examination Stats
    const examAvg = useMemo(() => {
        if (waveResults.length === 0) return 0;
        return Math.round(waveResults.reduce((a, b) => a + b.exam_score, 0) / waveResults.length);
    }, [waveResults]);

    return (
        <div className="space-y-6 sm:space-y-8">
            <SectionHeader
                icon={BarChart3}
                title="Program Overview & Executive Mastery Dashboard"
                description="Holistic evaluation across Believe, Know, Do, and Examination phases for this fellow."
                color="bg-[#1B4332]/10 text-[#1B4332]"
            />

            {/* Hero Executive Performance Banner */}
            <Card className="relative overflow-hidden rounded-3xl border-2 border-[#1B4332]/20 bg-gradient-to-br from-[#1B4332] via-[#1B4332] to-[#2D5A43] text-white p-6 sm:p-10 shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="space-y-3 text-center md:text-left flex-1 min-w-0">
                        <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                            <Badge className="bg-amber-400 text-[#1B4332] text-xs font-black uppercase tracking-wider px-3 py-1">
                                Executive Fellow Dashboard
                            </Badge>
                            <Badge className="bg-white/20 text-white border-white/30 text-xs font-bold px-3 py-1">
                                {waveResults.length} Waves Tracked
                            </Badge>
                        </div>
                        <h2 className="font-serif font-black text-2xl sm:text-4xl text-white">
                            {fellowName}
                        </h2>
                        <p className="text-xs sm:text-sm text-white/80 max-w-xl font-serif italic">
                            Composite progress score combining Mindset Reflections (Believe), Quizzes (Know), STAR Evidence (Do), and Wave Final Exams.
                        </p>
                    </div>

                    {/* Donut Chart Mastery Display */}
                    <div className="shrink-0 flex flex-col items-center bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/20">
                        <CompetencyPieChart percentage={overallAvg} size={130} strokeWidth={14} label="Program Avg" />
                        <Badge className="mt-3 bg-emerald-400 text-[#1B4332] text-[10px] font-black uppercase">
                            Overall Status: On Track ✓
                        </Badge>
                    </div>
                </div>
            </Card>

            {/* 4-Phase Deep Dive Donut Cards Matrix */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] px-1">
                    Leadership Development Phase Gauges (4-Phase Mastery)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Phase 1: Believe */}
                    <Card className="p-5 rounded-3xl border-2 border-purple-100 bg-gradient-to-br from-purple-50/70 to-white shadow-xs flex items-center justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-purple-700">
                                <Heart className="size-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Believe Phase</span>
                            </div>
                            <h5 className="font-serif font-bold text-base text-purple-950">
                                Mindsets
                            </h5>
                            <p className="text-[11px] text-purple-800 font-medium">
                                {believeLocked} of {believeProgress.length} Locked
                            </p>
                        </div>
                        <div className="shrink-0">
                            <CompetencyPieChart percentage={believePct} size={64} strokeWidth={7} label="Believe" />
                        </div>
                    </Card>

                    {/* Phase 2: Know */}
                    <Card className="p-5 rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/70 to-white shadow-xs flex items-center justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-blue-700">
                                <Brain className="size-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Know Phase</span>
                            </div>
                            <h5 className="font-serif font-bold text-base text-blue-950">
                                Quizzes
                            </h5>
                            <p className="text-[11px] text-blue-800 font-medium">
                                {knowProgress.length} Completed
                            </p>
                        </div>
                        <div className="shrink-0">
                            <CompetencyPieChart percentage={knowAvg} size={64} strokeWidth={7} label="Know" />
                        </div>
                    </Card>

                    {/* Phase 3: Do */}
                    <Card className="p-5 rounded-3xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white shadow-xs flex items-center justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-emerald-700">
                                <FileText className="size-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Do Phase</span>
                            </div>
                            <h5 className="font-serif font-bold text-base text-emerald-950">
                                Portfolios
                            </h5>
                            <p className="text-[11px] text-emerald-800 font-medium">
                                {approvedPortfolios.length} Approved
                            </p>
                        </div>
                        <div className="shrink-0">
                            <CompetencyPieChart percentage={doAvgScore} size={64} strokeWidth={7} label="Do" />
                        </div>
                    </Card>

                    {/* Phase 4: Examination */}
                    <Card className="p-5 rounded-3xl border-2 border-amber-100 bg-gradient-to-br from-amber-50/70 to-white shadow-xs flex items-center justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-amber-800">
                                <GraduationCap className="size-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Exams</span>
                            </div>
                            <h5 className="font-serif font-bold text-base text-amber-950">
                                Wave Exams
                            </h5>
                            <p className="text-[11px] text-amber-800 font-medium">
                                {waveResults.length} Milestone Waves
                            </p>
                        </div>
                        <div className="shrink-0">
                            <CompetencyPieChart percentage={examAvg} size={64} strokeWidth={7} label="Exam" />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Wave Milestones Summary Bar */}
            {waveResults.length > 0 && (
                <Card className="p-5 sm:p-6 rounded-3xl border-2 border-[#E8E4D8] bg-white space-y-4 shadow-xs">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">
                        Milestone Wave Final Scores ({waveResults.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {waveResults.map((r, idx) => (
                            <div key={r.id} className="p-4 rounded-2xl border border-[#E8E4D8] bg-stone-50/60 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-black uppercase text-[#1B4332]/70">
                                        Milestone Wave {idx + 1}
                                    </span>
                                    <h6 className="font-serif font-bold text-sm text-foreground">
                                        Wave Composite Score
                                    </h6>
                                </div>
                                <span className="font-serif font-black text-xl text-[#1B4332]">
                                    {r.final_score}%
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
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
        const behavioralIndicators = Object.values(biLookup);
        return Object.values(compLookup)
            .map((comp) => {
                const performance = buildCompetencyPerformance(comp, {
                    progress,
                    portfolios,
                    behavioralIndicators,
                    examAttempts,
                    groundingScoreOutOf10: groundingScore,
                    biLookup,
                });

                return {
                    ...comp,
                    compositeScore: performance.compositeScore,
                    examScore: performance.examScore,
                    examContribution: performance.examContribution,
                    groundingContribution: performance.groundingContribution,
                    biBreakdown: performance.biBreakdown,
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
    // Filter competencies so ONLY those belonging to the fellow's cohort are shown
    const cohortCompetencies = React.useMemo(() => {
        const hasWaveScope = Object.keys(competencyWaveMeta).length > 0;
        if (hasWaveScope) {
            return competencyPerformance.filter((c) => !!competencyWaveMeta[c.id]);
        }
        return competencyPerformance;
    }, [competencyPerformance, competencyWaveMeta]);

    // Group competencies by wave for the selector
    const competencyGroups = React.useMemo(() => {
        const buckets: Record<number, typeof cohortCompetencies> = {};
        cohortCompetencies.forEach((c) => {
            const meta = competencyWaveMeta[c.id];
            const waveNum = meta ? meta.waveNumber : 1;
            (buckets[waveNum] ||= []).push(c);
        });

        return Object.keys(buckets)
            .map(Number)
            .sort((a, b) => a - b)
            .map((waveNumber) => ({
                key: `wave-${waveNumber}`,
                waveNumber,
                label: `Wave ${waveNumber}: ${orderedWaves.find((w) => w.number === waveNumber)?.name || `Wave ${waveNumber}`}`,
                comps: buckets[waveNumber].sort((a, b) => {
                    const ma = competencyWaveMeta[a.id];
                    const mb = competencyWaveMeta[b.id];
                    if (ma && mb && ma.displayOrder !== mb.displayOrder) return ma.displayOrder - mb.displayOrder;
                    return a.title.localeCompare(b.title);
                }),
            }));
    }, [cohortCompetencies, competencyWaveMeta, orderedWaves]);

    const [selectedWaveNumber, setSelectedWaveNumber] = React.useState<number | "all">("all");

    // Competencies visible based on the selected wave dropdown filter
    const visibleCompetencies = React.useMemo(() => {
        if (selectedWaveNumber === "all") return cohortCompetencies;
        return cohortCompetencies.filter(
            (c) => competencyWaveMeta[c.id]?.waveNumber === selectedWaveNumber
        );
    }, [cohortCompetencies, competencyWaveMeta, selectedWaveNumber]);

    // Auto-select first competency if none selected or if switching waves
    React.useEffect(() => {
        if (visibleCompetencies.length > 0) {
            const isCurrentlyVisible = visibleCompetencies.some((c) => c.id === selectedCompId);
            if (!isCurrentlyVisible) {
                setSelectedCompId(visibleCompetencies[0].id);
            }
        }
    }, [visibleCompetencies, selectedCompId]);

    const selectedComp = cohortCompetencies.find(
        (c) => c.id === selectedCompId
    ) || visibleCompetencies[0] || cohortCompetencies[0];

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

            {/* Wave Selector Dropdown & Larger Competency Tabs Bar */}
            <div className="space-y-4 bg-stone-50/90 border-2 border-[#E8E4D8] p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-[#1B4332]">
                        <div className="size-10 rounded-xl bg-[#1B4332]/10 flex items-center justify-center text-[#1B4332] shrink-0">
                            <Waves className="size-5" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                Program Waves ({competencyGroups.length} Waves Total)
                            </p>
                            <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                Select Wave to Filter Competencies
                            </h4>
                        </div>
                    </div>

                    {/* Wave Selector Dropdown */}
                    <div className="relative min-w-[260px] sm:min-w-[320px]">
                        <select
                            value={selectedWaveNumber}
                            onChange={(e) => {
                                const val = e.target.value === "all" ? "all" : Number(e.target.value);
                                setSelectedWaveNumber(val);
                            }}
                            className="w-full h-11 sm:h-12 pl-4 pr-10 rounded-2xl border-2 border-[#E8E4D8] bg-white font-serif font-bold text-xs sm:text-sm text-foreground focus:border-[#1B4332] focus:outline-none transition-all cursor-pointer shadow-xs appearance-none"
                        >
                            <option value="all">All Waves ({cohortCompetencies.length} Competencies)</option>
                            {competencyGroups.map((group) => (
                                <option key={group.key} value={group.waveNumber}>
                                    {group.label} ({group.comps.length} Competencies)
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="size-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                {/* Larger, Taller Competency Switcher Tabs */}
                {visibleCompetencies.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-[#E8E4D8]">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                Competencies in {selectedWaveNumber === "all" ? "All Waves" : `Wave ${selectedWaveNumber}`} ({visibleCompetencies.length})
                            </p>
                            <span className="text-[10px] font-serif italic text-muted-foreground">
                                Click a tab below to view detailed breakdown
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none">
                            {visibleCompetencies.map((comp) => {
                                const isSelected = selectedComp?.id === comp.id;
                                const meta = competencyWaveMeta[comp.id];
                                return (
                                    <button
                                        key={comp.id}
                                        onClick={() => setSelectedCompId(comp.id)}
                                        className={cn(
                                            "flex items-center gap-2.5 h-11 sm:h-12 px-4 py-2.5 rounded-2xl border-2 font-serif font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 active:scale-[0.98]",
                                            isSelected
                                                ? "bg-[#1B4332] text-white border-[#1B4332] shadow-lg scale-[1.02]"
                                                : "bg-white text-foreground border-[#E8E4D8] hover:border-[#1B4332]/40 hover:bg-emerald-50/50 shadow-xs"
                                        )}
                                    >
                                        <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md", isSelected ? "bg-amber-400 text-amber-950 font-bold" : "bg-primary/10 text-primary")}>
                                            {meta ? `W${meta.waveNumber}:` : ""}{comp.code}
                                        </span>
                                        <span className="truncate max-w-[180px] sm:max-w-[240px]">{comp.title}</span>
                                        <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-black shrink-0", isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800")}>
                                            {comp.compositeScore}%
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
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
                            {selectedComp.biBreakdown.map((bi, idx) => {
                                const cleanTitle = bi.title.replace(/^BI\d+[\s:-]*/i, "");
                                return (
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
                                                    {cleanTitle}
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
                                );
                            })}

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
                                            ) / (selectedComp.biBreakdown.length || 1)
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                        + Grounding ({groundingContribution}) + Exam ({examContribution})
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
                                    {selectedComp.biBreakdown.map((bi, idx) => {
                                        const cleanTitle = bi.title.replace(/^BI\d+[\s:-]*/i, "");
                                        return (
                                            <tr key={bi.id} className="hover:bg-muted/5">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="inline-flex px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-black shrink-0">
                                                            BI{idx + 1}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-foreground text-sm">
                                                                {cleanTitle}
                                                            </p>
                                                            {bi.description && (
                                                                <p className="text-[10px] text-muted-foreground line-clamp-1">
                                                                    {bi.description}
                                                                </p>
                                                            )}
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
                                        );
                                    })}
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
        view: "performance",
        label: "Performance Breakdown",
        shortLabel: "Performance",
        icon: TrendingUp,
        activeClass:
            "bg-rose-100 text-rose-700 shadow-md ring-2 ring-rose-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "detail",
        label: "Examinations & Grading",
        shortLabel: "Exams",
        icon: GraduationCap,
        activeClass:
            "bg-amber-100 text-amber-700 shadow-md ring-2 ring-amber-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "portfolio",
        label: "Portfolio (Do)",
        shortLabel: "Portfolio",
        icon: FileText,
        activeClass:
            "bg-emerald-100 text-emerald-700 shadow-md ring-2 ring-emerald-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "competency",
        label: "Competency Matrix",
        shortLabel: "Competencies",
        icon: BookOpen,
        activeClass:
            "bg-teal-100 text-teal-700 shadow-md ring-2 ring-teal-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "quiz",
        label: "Quizzes (Know)",
        shortLabel: "Quizzes",
        icon: Brain,
        activeClass:
            "bg-blue-100 text-blue-700 shadow-md ring-2 ring-blue-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "believe",
        label: "Mindsets (Believe)",
        shortLabel: "Mindsets",
        icon: Heart,
        activeClass:
            "bg-purple-100 text-purple-700 shadow-md ring-2 ring-purple-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "wave",
        label: "Wave Timeline",
        shortLabel: "Waves",
        icon: Waves,
        activeClass:
            "bg-indigo-100 text-indigo-700 shadow-md ring-2 ring-indigo-200",
        inactiveClass:
            "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
    },
    {
        view: "overall",
        label: "Program Overview",
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

    // Track which exam attempt cards are expanded
    const [expandedAttemptIds, setExpandedAttemptIds] = useState<Set<string>>(new Set());

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
            // Default expand the first exam attempt if available
            if (finished.length > 0) {
                setExpandedAttemptIds(new Set([finished[0].id]));
            }
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

    const toggleExpand = (attemptId: string) => {
        setExpandedAttemptIds((prev) => {
            const next = new Set(prev);
            if (next.has(attemptId)) {
                next.delete(attemptId);
            } else {
                next.add(attemptId);
            }
            return next;
        });
    };

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
            setNotice("Grades saved successfully.");
            window.setTimeout(() => setNotice(null), 2500);
        } catch (e) {
            console.error("Failed to save grades", e);
            setNotice("Failed to save grades.");
        } finally {
            setSavingId(null);
        }
    };

    const handleApproveResults = async (attempt: ExaminationAttempt) => {
        setSavingId(attempt.id);
        try {
            const updated = await ExamService.approveExaminationResults(attempt.id, "Admin");
            setAttempts((prev) => prev.map((a) => (a.id === attempt.id ? updated : a)));
            setNotice("Results approved and published to the fellow.");
            window.setTimeout(() => setNotice(null), 2500);
        } catch (e) {
            console.error("Failed to approve results", e);
            setNotice("Failed to approve results.");
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
                    title="Examinations & Grading"
                    description="Review fellow examination attempts, evaluate written answers, and publish grades."
                    color="bg-blue-100 text-blue-700"
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => load()}
                    className="shrink-0 rounded-xl gap-2 font-bold"
                >
                    Refresh
                </Button>
            </div>

            {notice && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 animate-in fade-in">
                    {notice}
                </div>
            )}

            {attempts.length === 0 ? (
                <EmptyState message="This fellow has not submitted any examinations yet." />
            ) : (
                <div className="space-y-5">
                    {attempts.map((attempt) => {
                        const competencyResults = attempt.competency_results || [];
                        const hasUngradedWritten = competencyResults.some((r) => !r.graded);
                        const hasWrittenQuestions =
                            competencyResults.some((r) => r.written_total > 0) ||
                            (attempt.competency_snapshots || []).some((snap) =>
                                snap.questions.some((q) => q.type === "written")
                            );
                        const isExpanded = expandedAttemptIds.has(attempt.id);
                        const totalEarned = competencyResults.reduce(
                            (sum, r) => sum + (r.marks_earned ?? r.mcq_correct),
                            0
                        );
                        const totalMax = competencyResults.reduce(
                            (sum, r) => sum + (r.marks_total ?? r.mcq_total + r.written_total),
                            0
                        );

                        return (
                            <Card
                                key={attempt.id}
                                className={cn(
                                    "rounded-3xl border-2 transition-all overflow-hidden",
                                    isExpanded
                                        ? "border-[#1B4332] shadow-lg"
                                        : "border-[#E8E4D8] hover:border-[#1B4332]/40 bg-white"
                                )}
                            >
                                {/* Clickable Header / Selection Card */}
                                <div
                                    onClick={() => toggleExpand(attempt.id)}
                                    className="p-4 sm:p-5 md:p-6 bg-stone-50/80 hover:bg-stone-100/80 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div
                                            className={cn(
                                                "size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs",
                                                attempt.status === "graded"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-blue-100 text-blue-800"
                                            )}
                                        >
                                            <GraduationCap className="size-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge
                                                    className={cn(
                                                        "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                                                        attempt.status === "graded"
                                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                            : "bg-blue-100 text-blue-800 border-blue-300"
                                                    )}
                                                >
                                                    {attempt.status === "graded" ? "Graded" : "Awaiting Review"}
                                                </Badge>
                                                {hasUngradedWritten && (
                                                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 rounded-full px-2.5 py-0.5 text-[10px] font-black">
                                                        Needs Score
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="text-base sm:text-lg font-serif font-bold text-foreground truncate">
                                                {attempt.title}
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground">
                                                Submitted {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-3.5 pt-3 md:pt-0 border-t md:border-t-0 border-[#E8E4D8]">
                                        <div className="bg-white px-4 py-2 rounded-2xl border-2 border-[#E8E4D8] text-center shadow-xs">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                Total Score
                                            </p>
                                            <p className="text-base sm:text-lg font-serif font-black text-[#1B4332]">
                                                {formatExaminationMarks(totalEarned, totalMax)}
                                            </p>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl gap-2 font-bold text-xs text-[#1B4332] border-[#E8E4D8] bg-white hover:bg-emerald-50"
                                        >
                                            <span>{isExpanded ? "Hide Questions" : "View Questions & Grade"}</span>
                                            {isExpanded ? <ChevronUp className="size-4 text-primary" /> : <ChevronDown className="size-4 text-primary" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Expandable Details Section */}
                                {isExpanded && (
                                    <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 border-t-2 border-[#E8E4D8] bg-white animate-in fade-in duration-200">
                                        {attempt.competency_snapshots.map((snap) => {
                                            const result = competencyResults.find(
                                                (r) => r.competency_id === snap.competency_id
                                            );
                                            return (
                                                <div key={snap.competency_id} className="space-y-4">
                                                    <div className="flex items-center justify-between gap-2 border-b-2 border-[#E8E4D8] pb-2.5">
                                                        <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#1B4332]">
                                                            {snap.competency_title}
                                                        </h4>
                                                        {result && (
                                                            <Badge className="bg-[#1B4332]/10 text-[#1B4332] text-xs font-bold rounded-full px-3 py-1">
                                                                {formatExaminationMarks(
                                                                    result.marks_earned ?? result.mcq_correct,
                                                                    result.marks_total ?? result.mcq_total + result.written_total
                                                                )}{" "}
                                                                marks
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {snap.questions.map((q, qi) => {
                                                        const answer = attempt.answers?.[q.id];
                                                        if (q.type === "multiple_choice") {
                                                            const correct = Number(answer) === q.correct_option_index;
                                                            return (
                                                                <div key={q.id} className="rounded-2xl border-2 border-[#E8E4D8] p-4 sm:p-5 space-y-3 bg-stone-50/50">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <p className="text-sm font-bold text-foreground">
                                                                            {qi + 1}. {q.text}
                                                                        </p>
                                                                        <Badge className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase shrink-0", correct ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                                                                            {answer === undefined ? "Not answered" : correct ? "Correct" : "Incorrect"}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="space-y-1.5 pt-1">
                                                                        {q.options.map((opt, oi) => (
                                                                            <div
                                                                                key={oi}
                                                                                className={cn(
                                                                                    "flex items-center gap-2.5 text-xs px-3.5 py-2.5 rounded-xl border transition-all",
                                                                                    oi === q.correct_option_index
                                                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-bold"
                                                                                        : Number(answer) === oi
                                                                                            ? "bg-red-50 border-red-200 text-red-900"
                                                                                            : "bg-white border-[#E8E4D8] text-muted-foreground"
                                                                                )}
                                                                            >
                                                                                <span className="font-black shrink-0">{String.fromCharCode(65 + oi)}.</span>
                                                                                <span className="flex-1">{opt}</span>
                                                                                {oi === q.correct_option_index && <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />}
                                                                                {Number(answer) === oi && oi !== q.correct_option_index && <X className="size-4 text-red-600 shrink-0" />}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div key={q.id} className="rounded-2xl border-2 border-blue-200 bg-blue-50/30 p-4 sm:p-5 space-y-4">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <p className="text-sm font-bold text-foreground">
                                                                        {qi + 1}. {q.text}
                                                                    </p>
                                                                    <Badge className="bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase shrink-0">
                                                                        Written Question
                                                                    </Badge>
                                                                </div>
                                                                <div className="rounded-2xl bg-white border-2 border-[#E8E4D8] p-4 space-y-1">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                                        Fellow&apos;s Submitted Answer
                                                                    </p>
                                                                    <p className="text-sm font-serif italic text-[#1B4332] whitespace-pre-wrap leading-relaxed">
                                                                        {(answer as string) || "— no answer provided —"}
                                                                    </p>
                                                                </div>
                                                                {q.correct_written_answer && (
                                                                    <div className="rounded-2xl bg-emerald-50/80 border-2 border-emerald-200 p-4 space-y-1">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-800">
                                                                            Grading Rubric / Model Answer
                                                                        </p>
                                                                        <p className="text-xs text-emerald-950 whitespace-pre-wrap leading-relaxed">{q.correct_written_answer}</p>
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-blue-200/60">
                                                                    <label className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                                                                        <span>Award Marks (0.0 to 1.0):</span>
                                                                    </label>
                                                                    <div className="flex items-center gap-2">
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
                                                                            className="w-32 h-10 rounded-xl font-serif font-bold text-sm border-2 border-blue-300 bg-white"
                                                                            placeholder="Score (0–1)"
                                                                        />
                                                                        <span className="text-xs font-bold text-blue-900">/ 1.0 mark</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}

                                        {/* Action Controls for this Examination */}
                                        {hasWrittenQuestions ? (
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t-2 border-[#E8E4D8]">
                                                {hasUngradedWritten ? (
                                                    <span className="text-xs text-amber-700 font-bold flex items-center gap-1.5">
                                                        <Clock className="size-4" /> Written answers pending evaluation.
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                                                        <CheckCircle2 className="size-4" /> All written answers evaluated.
                                                    </span>
                                                )}
                                                <Button
                                                    onClick={() => handleSaveGrades(attempt)}
                                                    disabled={savingId === attempt.id}
                                                    className="rounded-2xl h-11 px-6 bg-[#1B4332] text-white font-bold shadow-md hover:bg-[#1B4332]/90"
                                                >
                                                    {savingId === attempt.id ? (
                                                        <Loader2 className="size-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Check className="size-4 mr-2" />
                                                    )}
                                                    Save & Publish Grades
                                                </Button>
                                            </div>
                                        ) : attempt.status === "submitted" && (
                                            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-[#E8E4D8]">
                                                <Button
                                                    onClick={() => handleApproveResults(attempt)}
                                                    disabled={savingId === attempt.id}
                                                    className="rounded-2xl h-11 px-6 bg-[#1B4332] text-white font-bold shadow-md hover:bg-[#1B4332]/90"
                                                >
                                                    {savingId === attempt.id ? (
                                                        <Loader2 className="size-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Check className="size-4 mr-2" />
                                                    )}
                                                    Approve & Publish Results
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                )}
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
    const [activeView, setActiveView] = useState<TrackingView>("performance");
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
                        competencyWaveMeta={competencyWaveMeta}
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
                        competencyWaveMeta={competencyWaveMeta}
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