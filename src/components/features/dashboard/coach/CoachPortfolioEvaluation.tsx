"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    FileSearch, 
    Loader2, 
    Search,
    Clock,
    ChevronRight,
    ExternalLink,
    MessageSquare,
    ArrowUpDown,
    Calendar,
    User as UserIcon,
    Briefcase
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FellowProgressService } from "@/services/FellowProgressService";
import { CoachService } from "@/services/CoachService";
import { FellowService } from "@/services/FellowService";
import { StorageService } from "@/services/storageService";
import { PeerCircle, FellowProfile, Portfolio, PortfolioStatus, BehavioralIndicator } from "@/types";
import { cn } from "@/lib/utils";

export default function CoachPortfolioEvaluation() {
    const [loading, setLoading] = useState(true);
    const [circles, setCircles] = useState<PeerCircle[]>([]);
    const [fellows, setFellows] = useState<FellowProfile[]>([]);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCircleId, setFilterCircleId] = useState<string>("all");
    const [filterFellowId, setFilterFellowId] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("pending"); // pending, needs_feedback, all
    const [filterDomain, setFilterDomain] = useState<string>("all"); // all, ly, lo, lorg
    const [behavioralIndicators, setBehavioralIndicators] = useState<BehavioralIndicator[]>([]);
    
    // Review state
    const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
    const [reviewFeedback, setReviewFeedback] = useState("");
    const [submitting, setSubmitting] = useState(false);
    
    const [sortBy, setSortBy] = useState<string>("date_desc"); // date_desc, date_asc, name_asc

    useEffect(() => {
        const fetchData = async () => {
            const user = StorageService.getCurrentUser();
            if (!user || user.role !== 'COACH') return;

            try {
                const circleData = await CoachService.getPeerCirclesByCoachId(user.id);
                setCircles(circleData);

                const allFellowIds = Array.from(new Set(circleData.flatMap(c => c.fellow_ids)));
                if (allFellowIds.length > 0) {
                    const [fellowData, portfolioResults, biData] = await Promise.all([
                        FellowService.getFellowsByIds(allFellowIds),
                        FellowProgressService.getPortfoliosByUserIds(allFellowIds),
                        FellowProgressService.getAllBehavioralIndicators()
                    ]);
                    setFellows(fellowData);
                    setPortfolios(portfolioResults);
                    setBehavioralIndicators(biData);
                }
            } catch (error) {
                console.error("Error fetching evaluation data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredPortfolios = useMemo(() => {
        let results = portfolios.filter(p => {
            const fellow = fellows.find(f => f.user_id === p.user_id);
            if (!fellow) return false;

            const matchesSearch = 
                fellow.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (p.star_situation || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.star_action || "").toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCircle = filterCircleId === "all" || fellow.peer_circle_id === filterCircleId;
            const matchesFellow = filterFellowId === "all" || fellow.user_id === filterFellowId;
            
            let matchesStatus = true;
            if (filterStatus === "pending") {
                matchesStatus = p.status === 'submitted' || p.status === 'resubmitted';
            } else if (filterStatus === "needs_feedback") {
                matchesStatus = (p.status === 'submitted' || p.status === 'resubmitted') && (!p.feedback || p.feedback.trim() === "");
            } else if (filterStatus !== "all") {
                matchesStatus = p.status === filterStatus;
            }

            const matchesDomain = filterDomain === "all" || p.behavioral_indicator_id.toLowerCase().startsWith(filterDomain.toLowerCase());

            return matchesSearch && matchesCircle && matchesFellow && matchesStatus && matchesDomain;
        });

        // Sorting
        return results.sort((a, b) => {
            if (sortBy === "date_desc") {
                return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
            }
            if (sortBy === "date_asc") {
                return new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime();
            }
            if (sortBy === "name_asc") {
                const fellowA = fellows.find(f => f.user_id === a.user_id)?.full_name || "";
                const fellowB = fellows.find(f => f.user_id === b.user_id)?.full_name || "";
                return fellowA.localeCompare(fellowB);
            }
            return 0;
        });
    }, [portfolios, fellows, searchQuery, filterCircleId, filterFellowId, filterStatus, filterDomain, sortBy]);

    const handleReview = (portfolio: Portfolio) => {
        setSelectedPortfolio(portfolio);
        setReviewFeedback(portfolio.feedback || "");
    };

    const submitReview = async () => {
        if (!selectedPortfolio) return;
        
        setSubmitting(true);
        try {
            const user = StorageService.getCurrentUser();
            // Keep the current status, just add feedback
            await FellowProgressService.updatePortfolioReview(selectedPortfolio.id, {
                status: selectedPortfolio.status as PortfolioStatus,
                feedback: reviewFeedback,
                reviewed_by: user?.id
            });

            // Update local state
            setPortfolios(prev => prev.map(p => 
                p.id === selectedPortfolio.id 
                ? { ...p, feedback: reviewFeedback, updated_at: new Date().toISOString() } 
                : p
            ));
            
            setSelectedPortfolio(null);
        } catch (error) {
            console.error("Error submitting review:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const pendingCount = portfolios.filter(p => p.status === 'submitted' || p.status === 'resubmitted').length;
    const reviewedCount = portfolios.filter(p => p.feedback && p.feedback.trim() !== "").length;

    return (
        <div className="space-y-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-[#1B4332]">Portfolio Review Hub</h1>
                    <p className="text-muted-foreground font-serif italic mt-1">
                        Review submissions and provide constructive feedback to your fellows.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-5 py-3 rounded-2xl shadow-sm">
                        <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <Clock className="size-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 leading-none">Awaiting Review</p>
                            <p className="text-xl font-bold text-amber-900">{pendingCount}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-2xl shadow-sm">
                        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <MessageSquare className="size-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 leading-none">Reviewed</p>
                            <p className="text-xl font-bold text-emerald-900">{reviewedCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-primary/5 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/50" />
                        <Input 
                            placeholder="Search by fellow name or BI code..." 
                            className="h-14 pl-12 rounded-2xl border-stone-100 bg-stone-50/50 font-serif italic text-base focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={filterCircleId} onValueChange={(val) => {
                            setFilterCircleId(val);
                            setFilterFellowId("all"); // Reset fellow when circle changes
                        }}>
                            <SelectTrigger className="w-[160px] h-14 rounded-2xl border-stone-100 bg-stone-50/50 font-serif italic">
                                <SelectValue placeholder="All Circles" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Circles</SelectItem>
                                {circles.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterFellowId} onValueChange={setFilterFellowId}>
                            <SelectTrigger className="w-[180px] h-14 rounded-2xl border-stone-100 bg-stone-50/50 font-serif italic">
                                <SelectValue placeholder="All Fellows" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Fellows</SelectItem>
                                {fellows
                                    .filter(f => filterCircleId === "all" || f.peer_circle_id === filterCircleId)
                                    .map(f => (
                                        <SelectItem key={f.user_id} value={f.user_id}>{f.full_name}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>

                        <Select value={filterDomain} onValueChange={setFilterDomain}>
                            <SelectTrigger className="w-[140px] h-14 rounded-2xl border-stone-100 bg-stone-50/50 font-serif italic">
                                <SelectValue placeholder="Domain" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Domains</SelectItem>
                                <SelectItem value="ly">Lead Yourself</SelectItem>
                                <SelectItem value="lo">Lead Others</SelectItem>
                                <SelectItem value="lorg">Lead Organization</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[160px] h-14 rounded-2xl border-stone-100 bg-stone-50/50 font-serif italic">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="pending">Awaiting Review</SelectItem>
                                <SelectItem value="needs_feedback">Needs Feedback</SelectItem>
                                <SelectItem value="all">All Submissions</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[160px] h-14 rounded-2xl border-stone-100 bg-stone-50/50 font-serif italic">
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className="size-3 text-stone-400" />
                                    <SelectValue placeholder="Sort By" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="date_desc">Newest First</SelectItem>
                                <SelectItem value="date_asc">Oldest First</SelectItem>
                                <SelectItem value="name_asc">Fellow Name</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Submissions Grid */}
            {filteredPortfolios.length === 0 ? (
                <Card className="rounded-[2.5rem] border-2 border-dashed border-primary/10 p-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center">
                            <FileSearch className="size-8 text-primary/20" />
                        </div>
                        <div>
                            <p className="text-xl font-serif font-bold italic">No Submissions Found</p>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                There are no submissions matching your current filters.
                            </p>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPortfolios.map(portfolio => {
                        const fellow = fellows.find(f => f.user_id === portfolio.user_id);
                        const circle = circles.find(c => c.id === fellow?.peer_circle_id);
                        const bi = behavioralIndicators.find(b => b.code === portfolio.behavioral_indicator_id || b.id === portfolio.behavioral_indicator_id);
                        const isPending = portfolio.status === 'submitted' || portfolio.status === 'resubmitted';

                        return (
                            <Card 
                                key={portfolio.id}
                                className={cn(
                                    "group rounded-[2rem] border-2 transition-all duration-300 overflow-hidden",
                                    isPending ? "border-amber-100 bg-amber-50/10 hover:border-amber-200" : "border-primary/5 bg-white hover:border-primary/20"
                                )}
                            >
                                <CardContent className="p-0">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-sm">
                                                    {fellow?.full_name[0]}
                                                </div>
                                                <div>
                                                    <h3 className="font-serif font-bold text-foreground leading-tight">{fellow?.full_name}</h3>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">{circle?.name}</p>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "rounded-full text-[9px] uppercase font-black tracking-widest px-2 py-0.5",
                                                portfolio.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                isPending ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                "bg-rose-50 text-rose-700 border-rose-100"
                                            )}>
                                                {portfolio.status}
                                            </Badge>
                                        </div>

                                        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 mb-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="size-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-[10px] font-black text-primary">
                                                    {bi?.code ? bi.code.substring(0, 2).toUpperCase() : 'BI'}
                                                </div>
                                                <span className="text-xs font-bold text-foreground">{portfolio.behavioral_indicator_id}</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-stone-800 mb-1 line-clamp-1">{bi?.title}</h4>
                                            <p className="text-xs text-muted-foreground italic line-clamp-2">
                                                {portfolio.star_situation || portfolio.star_action || "No description provided."}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                                            <div className="flex items-center gap-4">
                                                {portfolio.evidence_urls && portfolio.evidence_urls.length > 0 && (
                                                    <a 
                                                        href={portfolio.evidence_urls[0]} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors"
                                                    >
                                                        <ExternalLink className="size-3" />
                                                        View Artifact
                                                    </a>
                                                )}
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                                                    <Clock className="size-3" />
                                                    {new Date(portfolio.updated_at || portfolio.created_at).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <Button 
                                                size="sm" 
                                                variant="default"
                                                className="rounded-full h-8 text-[10px] font-black uppercase tracking-widest px-4 bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/20"
                                                onClick={() => handleReview(portfolio)}
                                            >
                                                Review
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Review Dialog */}
            <Dialog open={!!selectedPortfolio} onOpenChange={(open) => !open && setSelectedPortfolio(null)}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                Portfolio Review
                            </Badge>
                            <span className="text-xs font-medium text-primary/60">BI: {selectedPortfolio?.behavioral_indicator_id}</span>
                        </div>
                        <DialogTitle className="text-3xl font-serif font-bold text-foreground">
                            {fellows.find(f => f.user_id === selectedPortfolio?.user_id)?.full_name}
                        </DialogTitle>
                        <DialogDescription className="font-serif italic text-base">
                            Review the submission and provide constructive feedback for growth.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                        {/* Description */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Submission Description</p>
                            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 font-serif italic text-foreground leading-relaxed">
                                                {selectedPortfolio?.star_situation && <p><strong>Situation:</strong> {selectedPortfolio.star_situation}</p>}
                                                {selectedPortfolio?.star_task && <p><strong>Task:</strong> {selectedPortfolio.star_task}</p>}
                                                {selectedPortfolio?.star_action && <p><strong>Action:</strong> {selectedPortfolio.star_action}</p>}
                                                {selectedPortfolio?.star_result && <p><strong>Result:</strong> {selectedPortfolio.star_result}</p>}
                                                {!selectedPortfolio?.star_situation && !selectedPortfolio?.star_action && "No description provided."}
                            </div>
                        </div>

                        {/* Artifact Link */}
                        {selectedPortfolio?.evidence_urls && selectedPortfolio.evidence_urls.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Submitted Evidence</p>
                                <a 
                                    href={selectedPortfolio.evidence_urls[0]} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-4 rounded-2xl border border-primary/10 bg-white hover:bg-primary/5 transition-all group"
                                >
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <FileSearch className="size-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-foreground">Review Artifact</p>
                                        <p className="text-xs text-muted-foreground">Click to open the submitted document in a new tab</p>
                                    </div>
                                    <ExternalLink className="size-4 text-stone-300" />
                                </a>
                            </div>
                        )}

                        {/* Feedback Only */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Your Feedback</p>
                            <Textarea 
                                placeholder="Provide constructive feedback on what was done well and areas for growth..."
                                className="min-h-[140px] rounded-2xl border-stone-200 focus:border-primary font-serif p-4"
                                value={reviewFeedback}
                                onChange={(e) => setReviewFeedback(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-stone-50/50 border-t border-stone-100 flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            className="rounded-full h-12 border-stone-200 hover:bg-stone-50 font-black text-[10px] uppercase tracking-widest"
                            onClick={() => setSelectedPortfolio(null)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="rounded-full h-12 flex-1 bg-primary hover:bg-primary-dark text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                            onClick={submitReview}
                            disabled={submitting || !reviewFeedback.trim()}
                        >
                            {submitting ? (
                                <Loader2 className="size-4 animate-spin mr-2" />
                            ) : (
                                <MessageSquare className="size-4 mr-2" />
                            )}
                            Send Feedback
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
