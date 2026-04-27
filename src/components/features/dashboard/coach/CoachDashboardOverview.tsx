"use client";

import { useState, useEffect } from "react";
import { 
    Users, 
    Network, 
    ArrowRight,
    Loader2,
    Calendar,
    Building2,
    Clock,
    ArrowUpRight,
    Search,
    Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FellowProgressService } from "@/services/FellowProgressService";
import { FellowService } from "@/services/FellowService";
import { CoachService } from "@/services/CoachService";
import { StorageService } from "@/services/storageService";
import { companyService } from "@/services/companyService";
import { CohortService } from "@/services/CohortService";
import { PeerCircle, Company, Cohort, Portfolio, FellowProfile } from "@/types";
import { cn } from "@/lib/utils";

export default function CoachDashboardOverview() {
    const [loading, setLoading] = useState(true);
    const [circles, setCircles] = useState<PeerCircle[]>([]);
    const [companies, setCompanies] = useState<Record<string, Company>>({});
    const [cohorts, setCohorts] = useState<Record<string, Cohort>>({});
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [fellows, setFellows] = useState<FellowProfile[]>([]);
    const [coachProfile, setCoachProfile] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const user = StorageService.getCurrentUser();
            if (!user || user.role !== 'COACH') return;

            try {
                const profile = await CoachService.getCoachByUserId(user.id);
                setCoachProfile(profile);

                if (profile) {
                    const circleData = await CoachService.getPeerCirclesByCoachId(user.id);
                    setCircles(circleData);

                    // Fetch company and cohort names
                    const companyIds = Array.from(new Set(circleData.map((c: PeerCircle) => c.company_id)));
                    const cohortIds = Array.from(new Set(circleData.map((c: PeerCircle) => c.cohort_id)));

                    const [companyData, cohortData] = await Promise.all([
                        Promise.all(companyIds.map(id => companyService.getById(id))),
                        Promise.all(cohortIds.map(id => CohortService.getCohortById(id)))
                    ]);

                    const companyMap = companyData.reduce((acc: Record<string, Company>, company) => {
                        if (company) acc[company.id] = company;
                        return acc;
                    }, {} as Record<string, Company>);

                    const cohortMap = cohortData.reduce((acc: Record<string, Cohort>, cohort) => {
                        if (cohort) acc[cohort.id] = cohort;
                        return acc;
                    }, {} as Record<string, Cohort>);

                    setCompanies(companyMap);
                    setCohorts(cohortMap);

                    // Fetch Fellows and Portfolios for smart metrics
                    const allFellowIds = Array.from(new Set(circleData.flatMap((c: PeerCircle) => c.fellow_ids))) as string[];
                    if (allFellowIds.length > 0) {
                        const [fellowData, portfolioData] = await Promise.all([
                            FellowService.getFellowsByIds(allFellowIds),
                            FellowProgressService.getPortfoliosByUserIds(allFellowIds)
                        ]);
                        setFellows(fellowData);
                        setPortfolios(portfolioData);
                    }
                }
            } catch (error) {
                console.error("Error fetching coach dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalFellows = circles.reduce((acc, c) => acc + c.fellow_ids.length, 0);

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-4xl font-serif font-bold text-foreground">
                    Welcome back, <span className="text-primary italic">{coachProfile?.full_name || "Coach"}</span>
                </h1>
                <p className="text-muted-foreground mt-2 font-serif italic text-lg">
                    You are guiding {circles.length} Peer Circles and {totalFellows} Fellows.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-3xl border-2 border-primary/5 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/60">Peer Circles</CardTitle>
                        <Network className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{circles.length}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-serif italic">Active coaching groups</p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-2 border-primary/5 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/60">Total Fellows</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalFellows}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-serif italic">Across all circles</p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-2 border-primary/5 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/60">Pending Reviews</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {portfolios.filter(p => p.status === 'submitted' || p.status === 'resubmitted').length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-serif italic">Needs your attention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Circles */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-serif font-bold">Your Assigned Circles</h2>
                    </div>

                    {circles.length === 0 ? (
                        <Card className="rounded-3xl border-2 border-dashed border-primary/10 p-12 text-center">
                            {/* ... empty state ... */}
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {circles.map(circle => {
                                const circleFellows = fellows.filter(f => circle.fellow_ids.includes(f.user_id));
                                const circlePortfolios = portfolios.filter(p => circle.fellow_ids.includes(p.user_id));
                                const approvedCount = circlePortfolios.filter(p => p.status === 'approved').length;
                                const pendingCount = circlePortfolios.filter(p => p.status === 'submitted' || p.status === 'resubmitted').length;
                                
                                return (
                                    <Card key={circle.id} className="rounded-[2.5rem] border-2 border-primary/5 bg-white overflow-hidden hover:border-primary/20 transition-all group">
                                        <CardHeader className="bg-primary/5 border-b border-primary/5 pb-4">
                                            <div className="flex items-center justify-between">
                                                <Badge className="bg-primary text-white rounded-full font-black text-[10px] uppercase tracking-tighter">
                                                    {circle.fellow_ids.length} Fellows
                                                </Badge>
                                                {pendingCount > 0 && (
                                                    <Badge className="bg-amber-500 text-white rounded-full font-black text-[8px] uppercase tracking-tighter">
                                                        {pendingCount} Pending
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-2xl font-serif font-bold mt-2 group-hover:text-primary transition-colors">
                                                {circle.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground font-serif italic text-stone-400">Circle Progress</span>
                                                    <span className="font-bold text-primary">{approvedCount} Approved</span>
                                                </div>
                                                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary transition-all duration-1000" 
                                                        style={{ width: `${Math.min(100, (approvedCount / (circle.fellow_ids.length * 5 || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 pt-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Building2 className="size-3.5 text-primary/40" />
                                                    <span className="font-bold text-stone-600">{companies[circle.company_id]?.name || "..."}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="size-3.5 text-primary/40" />
                                                    <span className="font-bold text-stone-600">{cohorts[circle.cohort_id]?.name || "..."}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-4">
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full rounded-2xl border-2 border-primary/10 hover:bg-primary hover:text-white transition-all group/btn h-12"
                                                    onClick={() => window.location.href = `/coach?tab=fellows&circleId=${circle.id}`}
                                                >
                                                    Open Portfolio Hub
                                                    <ArrowRight className="ml-2 size-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column: Pending Reviews Sidebar */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-serif font-bold">Needs Attention</h2>
                    <Card className="rounded-[2.5rem] border-2 border-primary/5 bg-white overflow-hidden p-6 shadow-sm">
                        <div className="space-y-4">
                            {portfolios.filter(p => p.status === 'submitted' || p.status === 'resubmitted').length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="size-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                                        <Check className="size-6 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-serif font-bold italic text-stone-500">All caught up!</p>
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">No pending reviews</p>
                                </div>
                            ) : (
                                portfolios
                                    .filter(p => p.status === 'submitted' || p.status === 'resubmitted')
                                    .slice(0, 5)
                                    .map(portfolio => {
                                        const fellow = fellows.find(f => f.user_id === portfolio.user_id);
                                        return (
                                            <div 
                                                key={portfolio.id} 
                                                className="group/item flex items-center gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer border border-transparent hover:border-stone-100"
                                                onClick={() => window.location.href = `/coach?tab=evaluation`}
                                            >
                                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                                    {fellow?.full_name[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{fellow?.full_name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black text-stone-400">
                                                        {portfolio.status === 'resubmitted' ? 'Resubmitted' : 'New Submission'}
                                                    </p>
                                                </div>
                                                <ArrowUpRight className="size-4 text-stone-300 group-hover/item:text-primary transition-colors" />
                                            </div>
                                        );
                                    })
                            )}
                            
                            {portfolios.filter(p => p.status === 'submitted' || p.status === 'resubmitted').length > 5 && (
                                <Button 
                                    variant="ghost" 
                                    className="w-full text-xs font-bold text-primary hover:bg-primary/5"
                                    onClick={() => window.location.href = '/coach?tab=evaluation'}
                                >
                                    View all pending reviews
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Quick Activity Tip */}
                    <Card className="rounded-[2rem] bg-[#1B4332] text-white p-6 border-none shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-serif font-bold italic mb-2">Pro Tip</h3>
                            <p className="text-xs text-emerald-100/70 leading-relaxed font-serif italic">
                                Use the <span className="text-emerald-300 font-bold">Portfolio Hub</span> to batch evaluate submissions across all your peer circles with smart filters.
                            </p>
                        </div>
                        <Search className="absolute -bottom-4 -right-4 size-24 text-emerald-500/10 -rotate-12" />
                    </Card>
                </div>
            </div>
        </div>
    );
}


