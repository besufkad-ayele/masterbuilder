"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { 
    Network, 
    Loader2,
    ChevronRight,
    ArrowUpDown,
    ArrowLeft,
    Users,
    Search,
    Clock
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
import { FellowProgressService } from "@/services/FellowProgressService";
import { CoachService } from "@/services/CoachService";
import { FellowService } from "@/services/FellowService";
import { StorageService } from "@/services/storageService";
import { PeerCircle, FellowProfile, Portfolio } from "@/types";
import FellowPortfolio from "@/components/features/dashboard/fellow/FellowPortfolio";
import { cn } from "@/lib/utils";

export default function CoachFellowsTab() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [circles, setCircles] = useState<PeerCircle[]>([]);
    const [fellows, setFellows] = useState<FellowProfile[]>([]);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [selectedFellowId, setSelectedFellowId] = useState<string | null>(null);
    const [filterCircleId, setFilterCircleId] = useState<string>("all");
    const [filterPortfolioStatus, setFilterPortfolioStatus] = useState<string>("all");
    const [filterFellowStatus, setFilterFellowStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "progress" | "activity">("activity");

    useEffect(() => {
        const fetchData = async () => {
            const user = StorageService.getCurrentUser();
            if (!user || user.role !== 'COACH') return;

            try {
                const circleData = await CoachService.getPeerCirclesByCoachId(user.id);
                setCircles(circleData);

                // Initial filter from URL if present
                const urlCircleId = searchParams.get("circleId");
                if (urlCircleId && circleData.some(c => c.id === urlCircleId)) {
                    setFilterCircleId(urlCircleId);
                }

                // Fetch all fellows across all coach's circles
                const allFellowIds = Array.from(new Set(circleData.flatMap((c: PeerCircle) => c.fellow_ids))) as string[];
                if (allFellowIds.length > 0) {
                    const fellowData = await FellowService.getFellowsByIds(allFellowIds);
                    setFellows(fellowData);

                    // Fetch all portfolios for these fellows using the new service method
                    const portfolioResults = await FellowProgressService.getPortfoliosByUserIds(allFellowIds);
                    setPortfolios(portfolioResults);
                }
            } catch (error) {
                console.error("Error fetching coach fellows data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [searchParams]);

    const filteredFellows = useMemo(() => {
        return fellows.filter(f => {
            const matchesSearch = f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                f.email.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCircle = filterCircleId === "all" || f.peer_circle_id === filterCircleId;
            
            const matchesFellowStatus = filterFellowStatus === "all" || f.status === filterFellowStatus;

            // Smart Portfolio Filtering
            let matchesPortfolioStatus = true;
            if (filterPortfolioStatus !== "all") {
                const fellowPortfolios = portfolios.filter(p => p.user_id === f.user_id);
                if (filterPortfolioStatus === "pending_review") {
                    matchesPortfolioStatus = fellowPortfolios.some(p => p.status === 'submitted' || p.status === 'resubmitted');
                } else if (filterPortfolioStatus === "no_submissions") {
                    matchesPortfolioStatus = fellowPortfolios.length === 0;
                } else {
                    matchesPortfolioStatus = fellowPortfolios.some(p => p.status === filterPortfolioStatus);
                }
            }
            
            return matchesSearch && matchesCircle && matchesFellowStatus && matchesPortfolioStatus;
        }).sort((a, b) => {
            if (sortBy === "name") {
                return a.full_name.localeCompare(b.full_name);
            }
            if (sortBy === "progress") {
                const aPortfolios = portfolios.filter(p => p.user_id === a.user_id && p.status === 'approved').length;
                const bPortfolios = portfolios.filter(p => p.user_id === b.user_id && p.status === 'approved').length;
                return bPortfolios - aPortfolios;
            }
            if (sortBy === "activity") {
                const aLatest = portfolios
                    .filter(p => p.user_id === a.user_id)
                    .map(p => p.updated_at || p.created_at)
                    .sort()
                    .reverse()[0] || "";
                const bLatest = portfolios
                    .filter(p => p.user_id === b.user_id)
                    .map(p => p.updated_at || p.created_at)
                    .sort()
                    .reverse()[0] || "";
                return bLatest.localeCompare(aLatest);
            }
            return 0;
        });
    }, [fellows, portfolios, searchQuery, filterCircleId, filterFellowStatus, filterPortfolioStatus, sortBy]);

    const stats = useMemo(() => {
        const pending = portfolios.filter(p => p.status === 'submitted' || p.status === 'resubmitted').length;
        const totalFellows = fellows.length;
        const activeFellows = fellows.filter(f => f.status === 'Active').length;
        
        return { pending, totalFellows, activeFellows };
    }, [portfolios, fellows]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (selectedFellowId) {
        const fellow = fellows.find(f => f.user_id === selectedFellowId);
        return (
            <div className="space-y-6">
                <Button 
                    variant="ghost" 
                    onClick={() => setSelectedFellowId(null)}
                    className="group font-serif font-bold italic -ml-4"
                >
                    <ArrowLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Fellows List
                </Button>
                
                <div className="flex items-center gap-4 bg-primary/5 p-6 rounded-[2rem] border border-primary/10 mb-8">
                    <div className="size-16 rounded-2xl bg-white border border-primary/10 flex items-center justify-center text-primary text-2xl font-black">
                        {fellow?.full_name[0]}
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-foreground">{fellow?.full_name}</h2>
                        <p className="text-muted-foreground font-serif italic">{fellow?.email}</p>
                    </div>
                    <div className="ml-auto">
                        <Badge className="bg-primary text-white px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-black">
                            {fellow?.status || "FELLOW"}
                        </Badge>
                    </div>
                </div>

                <FellowPortfolio fellowId={selectedFellowId} />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-[#1B4332]">Fellow Portfolio Hub</h1>
                    <p className="text-muted-foreground font-serif italic mt-1">
                        Track, review, and evaluate the progress of your assigned fellows.
                    </p>
                </div>

                {/* Quick Stats Summary */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-5 py-3 rounded-2xl shadow-sm">
                        <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <Clock className="size-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 leading-none">Pending Review</p>
                            <p className="text-xl font-bold text-amber-900">{stats.pending}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-2xl shadow-sm">
                        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 leading-none">Active Fellows</p>
                            <p className="text-xl font-bold text-emerald-900">{stats.activeFellows}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Filter Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-primary/5 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/50" />
                        <Input 
                            placeholder="Search by name or email..." 
                            className="h-14 pl-12 rounded-2xl border-stone-100 bg-stone-50/50 font-serif italic text-base focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={filterCircleId} onValueChange={setFilterCircleId}>
                            <SelectTrigger className="w-[180px] h-14 rounded-2xl border-stone-100 bg-stone-50/50 font-serif italic">
                                <SelectValue placeholder="All Circles" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Circles</SelectItem>
                                {circles.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterFellowStatus} onValueChange={setFilterFellowStatus}>
                            <SelectTrigger className="w-[180px] h-14 rounded-2xl border-stone-100 bg-stone-50/50 font-serif italic">
                                <SelectValue placeholder="Fellow Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Onboarding">Onboarding</SelectItem>
                                <SelectItem value="Graduated">Graduated</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterPortfolioStatus} onValueChange={setFilterPortfolioStatus}>
                            <SelectTrigger className="w-[200px] h-14 rounded-2xl border-stone-100 bg-stone-50/50 font-serif italic">
                                <SelectValue placeholder="Portfolio Review" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Submissions</SelectItem>
                                <SelectItem value="pending_review">Needs Review</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="no_submissions">No Submissions</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-stone-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mr-2">Quick Filters:</p>
                    <Badge 
                        className={cn(
                            "cursor-pointer px-4 py-1.5 rounded-full border shadow-none transition-all",
                            filterPortfolioStatus === "pending_review" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-stone-500 border-stone-100 hover:border-amber-200"
                        )}
                        onClick={() => setFilterPortfolioStatus(filterPortfolioStatus === "pending_review" ? "all" : "pending_review")}
                    >
                        Needs Review ({stats.pending})
                    </Badge>
                    <Badge 
                        className={cn(
                            "cursor-pointer px-4 py-1.5 rounded-full border shadow-none transition-all",
                            filterFellowStatus === "Active" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-stone-500 border-stone-100 hover:border-emerald-200"
                        )}
                        onClick={() => setFilterFellowStatus(filterFellowStatus === "Active" ? "all" : "Active")}
                    >
                        Active ({stats.activeFellows})
                    </Badge>

                    <div className="ml-auto flex items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mr-2">Sort By:</p>
                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                            <SelectTrigger className="w-[140px] h-10 rounded-xl border-stone-100 bg-stone-50/50 text-xs font-bold">
                                <ArrowUpDown className="size-3 mr-2 text-stone-400" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="activity">Latest Activity</SelectItem>
                                <SelectItem value="name">Fellow Name</SelectItem>
                                <SelectItem value="progress">Most Progress</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {filteredFellows.length === 0 ? (
                <Card className="rounded-[2.5rem] border-2 border-dashed border-primary/10 p-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center">
                            <Users className="size-8 text-primary/20" />
                        </div>
                        <div>
                            <p className="text-xl font-serif font-bold italic">No Fellows Found</p>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                {fellows.length === 0 
                                    ? "You don't have any fellows assigned yet." 
                                    : "No fellows match your current filters."}
                            </p>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFellows.map(fellow => {
                        const circle = circles.find(c => c.id === fellow.peer_circle_id);
                        
                        return (
                            <Card 
                                key={fellow.user_id} 
                                className="group relative rounded-[2.5rem] border-2 border-primary/5 bg-white overflow-hidden hover:border-primary/20 hover:shadow-[0_32px_64px_rgba(27,67,50,0.08)] transition-all duration-500 cursor-pointer"
                                onClick={() => setSelectedFellowId(fellow.user_id)}
                            >
                                <CardContent className="p-8">
                                    {/* Header Section */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="relative">
                                            <div className="size-16 rounded-[1.25rem] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-black text-2xl shadow-sm">
                                                {fellow.full_name[0]}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center">
                                                <div className={cn(
                                                    "size-2.5 rounded-full",
                                                    fellow.is_active ? "bg-emerald-500" : "bg-stone-300"
                                                )} />
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge className={cn(
                                                "rounded-full text-[10px] uppercase font-black tracking-widest px-3 py-1 border shadow-none",
                                                fellow.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                fellow.status === 'Onboarding' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                "bg-stone-50 text-stone-600 border-stone-100"
                                            )}>
                                                {fellow.status}
                                            </Badge>
                                            
                                            {portfolios.filter(p => p.user_id === fellow.user_id && (p.status === 'submitted' || p.status === 'resubmitted')).length > 0 && (
                                                <Badge className="bg-amber-500 text-white border-none rounded-full text-[8px] font-black tracking-tighter px-2 h-5">
                                                    PENDING REVIEW
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Fellow Info */}
                                    <div className="space-y-1 mb-6">
                                        <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                                            {fellow.full_name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-serif italic">
                                            {fellow.email}
                                        </p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100/50">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Portfolios</p>
                                            <div className="flex items-end gap-1">
                                                <span className="text-lg font-bold text-foreground leading-none">
                                                    {portfolios.filter(p => p.user_id === fellow.user_id).length}
                                                </span>
                                                <span className="text-[10px] font-medium text-stone-400 mb-0.5">Total</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100/50">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Approved</p>
                                            <div className="flex items-end gap-1">
                                                <span className="text-lg font-bold text-emerald-600 leading-none">
                                                    {portfolios.filter(p => p.user_id === fellow.user_id && p.status === 'approved').length}
                                                </span>
                                                <span className="text-[10px] font-medium text-stone-400 mb-0.5">Verified</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Section */}
                                    <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-primary/40">
                                            <Network className="size-3" />
                                            <span className="truncate max-w-[120px]">{circle?.name || "Unassigned"}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 text-primary font-bold text-xs group-hover:gap-2 transition-all">
                                            Open Portfolio <ChevronRight className="size-3" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
