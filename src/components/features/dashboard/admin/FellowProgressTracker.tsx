"use client";

import { useState, useEffect, useMemo } from "react";
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
    Award as AwardIcon
} from "lucide-react";
import { FellowProgressService } from "@/services/FellowProgressService";
import { ExamService, ExamAttempt } from "@/services/ExamService";
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
    | "overall";

interface FellowProgressTrackerProps {
    fellowId: string;
    fellowName: string;
    userId: string;
}

// ─── Components ───────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, description, color }: { icon: any; title: string, description?: string, color: string }) {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
                <div className={cn("size-10 rounded-2xl flex items-center justify-center", color)}>
                    <Icon className="size-5" />
                </div>
                <h3 className="font-serif font-black text-xl text-foreground">{title}</h3>
            </div>
            {description && <p className="text-sm text-muted-foreground font-serif italic ml-13">{description}</p>}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="size-10 text-primary animate-spin" />
            <p className="text-sm font-serif italic text-muted-foreground">Fetching fellow data...</p>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-[#E8E4D8] rounded-[2rem] bg-muted/5">
            <AlertCircle className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-serif italic text-muted-foreground">{message}</p>
        </div>
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
    if (portfolios.length === 0) return <EmptyState message="No portfolios submitted yet." />;

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={FileText}
                title="Portfolio (Do Level)"
                description="Review STAR submissions and evidence."
                color="bg-emerald-100 text-emerald-700"
            />
            <div className="overflow-hidden border-2 border-[#E8E4D8] rounded-2xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b-2 border-[#E8E4D8]">
                        <tr>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Competency / BI</th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Status</th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E4D8]">
                        {portfolios.map((p) => {
                            const bi = biLookup[p.behavioral_indicator_id];
                            const comp = bi ? compLookup[bi.competency_id] : null;
                            return (
                                <tr key={p.id} className="hover:bg-muted/5 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-primary/60">{comp?.title || "Unknown Comp"}</span>
                                            <span className="font-bold text-foreground line-clamp-1">{bi?.title || "Unknown BI"}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge className={cn("rounded-full text-[10px]",
                                            p.status === 'approved' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                p.status === 'rejected' ? "bg-red-100 text-red-700 border-red-200" :
                                                    p.status === 'submitted' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                        "bg-amber-100 text-amber-700 border-amber-200"
                                        )}>
                                            {p.status.replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onReview(p)}
                                            className="rounded-full h-8 font-serif font-bold italic"
                                        >
                                            Review
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
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
    onSave: (status: PortfolioStatus, feedback: string, score: number) => Promise<void>;
}) {
    const [status, setStatus] = useState<PortfolioStatus>(portfolio.status);
    const [feedback, setFeedback] = useState(portfolio.feedback || "");
    const [score, setScore] = useState(portfolio.score || 0);
    const [isSaving, setIsSaving] = useState(false);

    const bi = biLookup[portfolio.behavioral_indicator_id];

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            await onSave(status, feedback, score);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 pt-4 border-t-2 border-dashed border-[#E8E4D8] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="size-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Reviewing Submission</p>
                        <h4 className="font-serif font-bold text-lg leading-tight">{bi?.title}</h4>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                    <X className="size-4" />
                </Button>
            </div>

            {/* STAR Content Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { label: "Situation", content: portfolio.star_situation },
                    { label: "Task", content: portfolio.star_task },
                    { label: "Action", content: portfolio.star_action },
                    { label: "Result", content: portfolio.star_result },
                ].map((s) => (
                    <div key={s.label} className="p-4 rounded-2xl bg-muted/30 border border-[#E8E4D8]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{s.label}</p>
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{s.content || "N/A"}</p>
                    </div>
                ))}
            </div>

            {/* Evidence Links */}
            {portfolio.evidence_urls && portfolio.evidence_urls.length > 0 && (
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Evidence Links / Files</p>
                    <div className="flex flex-wrap gap-2">
                        {portfolio.evidence_urls.map((url, i) => (
                            <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#E8E4D8] rounded-xl text-xs font-bold hover:border-primary transition-all group"
                            >
                                <ExternalLink className="size-3 group-hover:text-primary" />
                                Evidence Item {i + 1}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin Input */}
            <div className="space-y-4 pt-4 border-t border-dashed border-[#E8E4D8]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Review Status</label>
                        <select
                            className="w-full h-11 px-4 rounded-xl border-2 border-[#E8E4D8] focus:border-primary outline-none bg-white font-serif font-bold italic"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as PortfolioStatus)}
                        >
                            <option value="submitted">Submitted (Pending)</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Needs Revision / Rejected</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Performance Score (0-100)</label>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            className="rounded-xl border-2 border-[#E8E4D8] h-11"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Facilitator Feedback</label>
                    <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="rounded-2xl border-2 border-[#E8E4D8] min-h-[120px] focus:border-primary"
                        placeholder="Provide detailed feedback for the fellow..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" className="rounded-full" onClick={onClose}>
                        Discard
                    </Button>
                    <Button
                        className="rounded-full px-8 shadow-lg shadow-primary/20"
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Saving Review...
                            </>
                        ) : "Save Review"}
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
    const knowProgress = progress.filter(p => p.phase_type === 'know');

    if (knowProgress.length === 0) return <EmptyState message="No quizzes completed yet." />;

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={Brain}
                title="Quiz (Know Level)"
                description="Assessment scores for knowledge modules."
                color="bg-blue-100 text-blue-700"
            />
            <div className="overflow-hidden border-2 border-[#E8E4D8] rounded-2xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b-2 border-[#E8E4D8]">
                        <tr>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Competency / BI</th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Score</th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">Result</th>
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
                                            <span className="text-[10px] font-black uppercase text-primary/60">{comp?.title || "Unknown Comp"}</span>
                                            <span className="font-bold text-foreground line-clamp-1">{bi?.title || "Unknown BI"}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-black text-lg">{p.know_score ?? 0}%</span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        {isPassed ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full text-[10px]">Passed</Badge>
                                        ) : (
                                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full text-[10px]">Pending</Badge>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * BELIEVE VIEW
 */
function BelieveView({
    progress,
    groundingResult, // Passing single grounding result if relevant
    biLookup,
    compLookup,
}: {
    progress: PhaseProgress[];
    groundingResult?: GroundingResult;
    biLookup: Record<string, BehavioralIndicator>;
    compLookup: Record<string, Competency>;
}) {
    const believeProgress = progress.filter(p => p.phase_type === 'believe');

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={Heart}
                title="Believe Level"
                description="Engagement with foundation and mindsets."
                color="bg-purple-100 text-purple-700"
            />

            {/* Grounding result integration if exists */}
            {groundingResult && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-purple-600">
                            <BookOpen className="size-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-500">Grounding Module</p>
                            <h4 className="font-serif font-black text-lg">Introductory Grounding</h4>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score</p>
                        <p className="text-2xl font-black text-purple-700">{groundingResult.score ?? 0}%</p>
                    </div>
                </div>
            )}

            {believeProgress.length > 0 ? (
                <div className="overflow-hidden border-2 border-[#E8E4D8] rounded-2xl">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-b-2 border-[#E8E4D8]">
                            <tr>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Behavioral Indicator</th>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">Gatekeeper</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E4D8]">
                            {believeProgress.map((p) => {
                                const bi = biLookup[p.behavioral_indicator_id];
                                return (
                                    <tr key={p.id} className="hover:bg-muted/5">
                                        <td className="px-4 py-4">
                                            <span className="font-bold text-foreground">{bi?.title || "Unknown BI"}</span>
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
                </div>
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
}: {
    groundingResults: GroundingResult[];
    waveResults: WaveResult[];
    waves: Wave[];
    gmLookup: Record<string, GroundingModule>;
}) {
    return (
        <div className="space-y-8">
            <SectionHeader
                icon={GraduationCap}
                title="Detail & Examination"
                description="Integrated results for grounding, exams, and competencies."
                color="bg-amber-100 text-amber-700"
            />

            {/* Grounding Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Grounding Modules</h4>
                    <Badge variant="outline" className="rounded-full text-[10px]">{groundingResults.length}</Badge>
                </div>
                {groundingResults.length > 0 ? (
                    <div className="overflow-hidden border-2 border-[#E8E4D8] rounded-2xl bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/30 border-b-2 border-[#E8E4D8]">
                                <tr>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Module</th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Score</th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E4D8]">
                                {groundingResults.map((r) => {
                                    const gm = gmLookup[r.grounding_id];
                                    return (
                                        <tr key={r.id}>
                                            <td className="px-4 py-4 font-bold">{gm?.name || "Grounding Module"}</td>
                                            <td className="px-4 py-4 font-black text-lg">{r.score ?? 0}%</td>
                                            <td className="px-4 py-4 text-right whitespace-nowrap">
                                                <Badge className={cn("rounded-full text-[10px]",
                                                    r.is_passed ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
                                                )}>
                                                    {r.status === 'completed' ? 'Passed' : 'In Progress'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState message="No grounding modules recorded." />
                )}
            </div>

            {/* Examination Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Final Wave Examinations</h4>
                    <Badge variant="outline" className="rounded-full text-[10px]">{waveResults.length}</Badge>
                </div>
                {waveResults.length > 0 ? (
                    <div className="overflow-hidden border-2 border-[#E8E4D8] rounded-2xl bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/30 border-b-2 border-[#E8E4D8]">
                                <tr>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Wave</th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Exam Score</th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">Comp Avg</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E4D8]">
                                {waveResults.map((r) => {
                                    const wave = waves.find(w => w.id === r.wave_id);
                                    return (
                                        <tr key={r.id}>
                                            <td className="px-4 py-4 font-bold">Wave {wave?.number ?? "?"}: {wave?.name || "Untitled"}</td>
                                            <td className="px-4 py-4 font-black text-lg">{r.exam_score}%</td>
                                            <td className="px-4 py-4 text-right font-bold text-primary">{r.competency_avg}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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
        return Object.values(compLookup).map(comp => {
            const biIds = Object.values(biLookup)
                .filter(bi => bi.competency_id === comp.id)
                .map(bi => bi.id);

            const groundingScore = groundingResults[0]?.score || 0;
            const examScore = examAttempts.find(a => a.exam_id === comp.id)?.score || 0;

            const composite = FellowProgressService.calculateCompetencyTotalScore(
                biIds,
                progress,
                portfolios,
                groundingScore,
                examScore
            );

            return { comp, avg: composite };
        });
    }, [progress, biLookup, compLookup, portfolios, examAttempts, groundingResults]);

    if (compStats.length === 0) return <EmptyState message="No competency data tracked yet." />;

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={BookOpen}
                title="Competency Level"
                description="Live proficiency across leadership domains."
                color="bg-teal-100 text-teal-700"
            />
            <div className="grid grid-cols-1 gap-4">
                {compStats.map((s) => (
                    <Card key={s.comp.id} className="rounded-3xl border-2 border-[#E8E4D8] overflow-hidden">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <h4 className="font-serif font-black text-lg truncate pr-10">{s.comp.title}</h4>
                                <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full text-sm font-black italic">
                                    {s.avg}%
                                </Badge>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.comp.category?.toUpperCase() || "Leadership"} • Targeted Level: {s.comp.level}</p>
                        </CardHeader>
                        <CardContent className="px-5 pb-5 pt-0">
                            <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden">
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
function WaveView({ waveResults, waves }: { waveResults: WaveResult[]; waves: Wave[] }) {
    if (waveResults.length === 0) return <EmptyState message="No wave results finalized." />;

    return (
        <div className="space-y-6">
            <SectionHeader
                icon={Waves}
                title="Wave Level"
                description="Finalized results per program wave."
                color="bg-indigo-100 text-indigo-700"
            />
            <div className="space-y-4">
                {waveResults.map((r) => {
                    const wave = waves.find(w => w.id === r.wave_id);
                    return (
                        <div key={r.id} className="p-5 rounded-[2.5rem] bg-white border-2 border-[#E8E4D8] shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Program Wave</p>
                                    <h4 className="font-serif font-black text-xl leading-tight">Wave {wave?.number ?? "?"}: {wave?.name || "Result"}</h4>
                                </div>
                                <div className="text-center bg-primary/5 px-6 py-2 rounded-2xl border-2 border-primary/10">
                                    <p className="text-[10px] font-black uppercase text-primary mb-1">Final Score</p>
                                    <p className="text-2xl font-black text-primary">{r.final_score}%</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-t-2 border-dashed border-[#E8E4D8] pt-4 text-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap">Competency Avg</p>
                                    <p className="text-lg font-black">{r.competency_avg}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap">Exam Score</p>
                                    <p className="text-lg font-black">{r.exam_score}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap">Grounding</p>
                                    <p className="text-lg font-black">{r.grounding_score}%</p>
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
    progress
}: {
    fellowName: string;
    waveResults: WaveResult[];
    portfolios: Portfolio[];
    progress: PhaseProgress[];
}) {
    const overallAvg = waveResults.length > 0
        ? Math.round(waveResults.reduce((a, b) => a + b.final_score, 0) / waveResults.length)
        : 0;

    const stats = [
        { label: "Final Program Avg", value: `${overallAvg}%`, color: "bg-primary text-white" },
        { label: "Approved Portfolios", value: portfolios.filter(p => p.status === 'approved').length, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        { label: "Quizzes Taken", value: progress.filter(p => p.phase_type === 'know').length, color: "bg-blue-50 text-blue-700 border-blue-100" },
        { label: "Mindsets Locked", value: progress.filter(p => p.phase_type === 'believe' && p.believe_passed).length, color: "bg-purple-50 text-purple-700 border-purple-100" },
    ];

    return (
        <div className="space-y-8">
            <SectionHeader
                icon={BarChart3}
                title="Overall Performance"
                description="Complete program engagement snapshot."
                color="bg-primary/10 text-primary"
            />

            {/* Big Score Card */}
            <div className="relative text-center py-10 rounded-[3rem] bg-gradient-to-br from-primary/10 via-white to-primary/5 border-4 border-primary/20 shadow-xl overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <BarChart3 size={120} />
                </div>
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Fellow Composite Performance</p>
                <p className="text-8xl font-serif font-black text-primary">{overallAvg}%</p>
                <div className="mt-6 flex items-center justify-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full font-black italic">ON TRACK</Badge>
                    <span className="text-xs text-muted-foreground font-serif italic">Cohort Rank: Top 15%</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className={cn("p-5 rounded-[2rem] border-2 text-center shadow-sm", s.color)}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{s.label}</p>
                        <p className="text-3xl font-serif font-black">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent History Table */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Recent Milestone History</h4>
                <div className="overflow-hidden border-2 border-[#E8E4D8] rounded-2xl bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/30 border-b-2 border-[#E8E4D8]">
                            <tr>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Event</th>
                                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E4D8]">
                            {waveResults.map((r, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-4 font-bold">Wave Result Finalized</td>
                                    <td className="px-4 py-4 text-right text-muted-foreground italic font-serif">
                                        {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : 'Recent'}
                                    </td>
                                </tr>
                            ))}
                            {portfolios.slice(0, 2).map((p, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-4 font-bold">Portfolio {p.status}</td>
                                    <td className="px-4 py-4 text-right text-muted-foreground italic font-serif">
                                        {p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : 'Recent'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Main Controller ──────────────────────────────────────────────────────────

export default function FellowProgressTracker({
    fellowId,
    fellowName,
    userId,
}: FellowProgressTrackerProps) {
    const [activeView, setActiveView] = useState<TrackingView | null>(null);
    const [reviewingPortfolio, setReviewingPortfolio] = useState<Portfolio | null>(null);

    // Data State
    const [loading, setLoading] = useState(true);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [progress, setProgress] = useState<PhaseProgress[]>([]);
    const [groundingResults, setGroundingResults] = useState<GroundingResult[]>([]);
    const [waveResults, setWaveResults] = useState<WaveResult[]>([]);
    const [biLookup, setBiLookup] = useState<Record<string, BehavioralIndicator>>({});
    const [compLookup, setCompLookup] = useState<Record<string, Competency>>({});
    const [waveLookup, setWaveLookup] = useState<Wave[]>([]);
    const [gmLookup, setGmLookup] = useState<Record<string, GroundingModule>>({});
    const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);

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
                _examAttempts
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
            ]);

            setPortfolios(_portfolios.sort((a, b) => b.created_at.localeCompare(a.created_at)));
            setProgress(_progress);
            setGroundingResults(_grounding);
            setWaveResults(_waveResults);
            setBiLookup(Object.fromEntries(_bis.map(b => [b.id, b])));
            setCompLookup(Object.fromEntries(_comps.map(c => [c.id, c])));
            setWaveLookup(_waves);
            setGmLookup(Object.fromEntries(_modules.map(m => [m.id, m])));
            setExamAttempts(_examAttempts);
        } catch (e) {
            console.error("Failed to fetch fellow tracking data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const handleSaveReview = async (status: PortfolioStatus, feedback: string, score: number) => {
        if (!reviewingPortfolio) return;
        try {
            await FellowProgressService.updatePortfolioReview(reviewingPortfolio.id, {
                status,
                feedback,
                score,
                reviewed_by: "Admin", // Should be actual logged in user
            });
            // Update local state without full fetch
            setPortfolios(prev => prev.map(p => p.id === reviewingPortfolio.id ? { ...p, status, feedback, score, reviewed_at: new Date().toISOString() } : p));
            setReviewingPortfolio(null);
        } catch (e) {
            alert("Failed to save review. Please try again.");
        }
    };

    const toggleView = (view: TrackingView) => {
        if (activeView === view && !reviewingPortfolio) setActiveView(null);
        else {
            setActiveView(view);
            setReviewingPortfolio(null);
        }
    };

    if (loading) return (
        <div className="bg-white border-4 border-primary/10 rounded-[3.5rem] p-6 shadow-2xl">
            <LoadingState />
        </div>
    );

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
                return <PortfolioView portfolios={portfolios} biLookup={biLookup} compLookup={compLookup} onReview={setReviewingPortfolio} />;
            case "quiz":
                return <QuizView progress={progress} biLookup={biLookup} compLookup={compLookup} />;
            case "believe":
                return <BelieveView progress={progress} groundingResult={groundingResults[0]} biLookup={biLookup} compLookup={compLookup} />;
            case "detail":
                return <DetailExamView groundingResults={groundingResults} waveResults={waveResults} waves={waveLookup} gmLookup={gmLookup} />;
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
                return <WaveView waveResults={waveResults} waves={waveLookup} />;
            case "overall":
                return <OverallView fellowName={fellowName} waveResults={waveResults} portfolios={portfolios} progress={progress} />;
            default:
                return null;
        }
    };

    const TRACKER_BUTTONS: { view: TrackingView; label: string; icon: any; color: string; count?: number }[] = [
        { view: "portfolio", label: "Portfolio (Do Level)", icon: FileText, color: "text-emerald-700 bg-emerald-50 border-emerald-200", count: portfolios.length },
        { view: "quiz", label: "Quiz (Know Level)", icon: Brain, color: "text-blue-700 bg-blue-50 border-blue-200" },
        { view: "believe", label: "Believe Level", icon: Heart, color: "text-purple-700 bg-purple-50 border-purple-200" },
        { view: "detail", label: "Detail & Examination", icon: GraduationCap, color: "text-amber-700 bg-amber-50 border-amber-200" },
        { view: "competency", label: "Competency Level", icon: BookOpen, color: "text-teal-700 bg-teal-50 border-teal-200" },
        { view: "wave", label: "Wave Level", icon: Waves, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
        { view: "overall", label: "Overall Performance", icon: BarChart3, color: "text-primary bg-primary/10 border-primary/20 shadow-sm" },
    ];

    return (
        <div className="space-y-4">
            {/* Nav Grid */}
            <div className="grid grid-cols-1 gap-2">
                {TRACKER_BUTTONS.map((btn) => {
                    const Icon = btn.icon;
                    const isActive = activeView === btn.view;
                    return (
                        <button
                            key={btn.view}
                            onClick={() => toggleView(btn.view)}
                            className={cn(
                                "relative w-full flex items-center gap-3 p-4 rounded-3xl border-2 transition-all duration-300 text-left group overflow-hidden",
                                btn.color,
                                isActive ? "scale-[0.98] ring-4 ring-primary/10 border-primary/40 shadow-inner translate-y-0.5" : "hover:scale-[1.01] hover:shadow-md"
                            )}
                        >
                            <div className="size-10 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center shrink-0">
                                <Icon className="size-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase tracking-wider leading-tight">{btn.label}</p>
                                <p className="text-[10px] opacity-60 mt-0.5">Live program metric</p>
                            </div>
                            {btn.count !== undefined && btn.count > 0 && (
                                <Badge className="absolute top-3 right-8 rounded-full bg-white/80 text-foreground border-none text-[8px] font-black">{btn.count}</Badge>
                            )}
                            <ChevronRight className={cn("size-4 transition-transform", isActive && "rotate-90")} />
                        </button>
                    );
                })}
            </div>

            {/* Content Panel */}
            {activeView && (
                <div className="bg-white border-4 border-primary/10 rounded-[3.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500 origin-top">
                    {renderView()}
                </div>
            )}
        </div>
    );
}
