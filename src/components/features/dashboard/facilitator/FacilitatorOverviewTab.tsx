"use client";

import React, { useState, useEffect } from 'react';
import { 
    Users, 
    TrendingUp, 
    Award, 
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Calendar,
    Sparkles,
    GraduationCap,
    Target,
    BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FellowService } from '@/services/FellowService';
import { FellowProgressService } from '@/services/FellowProgressService';
import FacilitatorCohortDetailView from './FacilitatorCohortDetailView';

interface FacilitatorOverviewTabProps {
    company: any;
    cohorts: any[];
    companyId: string;
}

const FacilitatorOverviewTab: React.FC<FacilitatorOverviewTabProps> = ({ 
    company, 
    cohorts,
    companyId 
}) => {
    const [fellows, setFellows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCohort, setSelectedCohort] = useState<any | null>(null);
    const [fellowsProgress, setFellowsProgress] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        const fetchFellows = async () => {
            try {
                const allFellows = await FellowService.getAllFellows();
                const companyFellows = allFellows.filter(f => f.company_id === companyId);
                setFellows(companyFellows);

                // Fetch phase progress for all fellows to calculate real progress
                const progressMap = new Map<string, number>();
                await Promise.all(
                    companyFellows.map(async (fellow) => {
                        try {
                            const phaseProgress = await FellowProgressService.getPhaseProgressByFellow(fellow.id);
                            
                            // Calculate progress: count unique completed phases
                            const completedPhases = phaseProgress.filter(p => {
                                if (p.phase_type === 'believe') return p.believe_passed;
                                if (p.phase_type === 'know') return (p.know_score || 0) >= 70;
                                if (p.phase_type === 'do') return p.do_completed;
                                return false;
                            });

                            // Get unique behavioral indicators that have progress
                            const uniqueBIs = new Set(phaseProgress.map(p => p.behavioral_indicator_id));
                            const totalPhases = uniqueBIs.size * 3; // Each BI has 3 phases
                            
                            const progress = totalPhases > 0 
                                ? Math.round((completedPhases.length / totalPhases) * 100)
                                : 0;
                            
                            progressMap.set(fellow.id, progress);
                        } catch (error) {
                            console.error(`Error fetching progress for fellow ${fellow.id}:`, error);
                            progressMap.set(fellow.id, 0);
                        }
                    })
                );
                
                setFellowsProgress(progressMap);
            } catch (error) {
                console.error('Error fetching fellows:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFellows();
    }, [companyId]);

    // If viewing a specific cohort
    if (selectedCohort) {
        return (
            <FacilitatorCohortDetailView 
                cohort={selectedCohort}
                onBack={() => setSelectedCohort(null)}
            />
        );
    }

    const activeCohorts = cohorts.filter(c => c.status === 'active');
    const totalFellows = fellows.length;
    // Check for various active status values
    const activeFellows = fellows.filter(f => 
        f.status === 'active' || 
        f.status === 'Active' || 
        f.status === 'ACTIVE' ||
        !f.status // If no status field, consider them active
    ).length;
    
    // Calculate completion rate using real progress data
    const completionRate = fellows.length > 0 
        ? Math.round((fellows.filter(f => (fellowsProgress.get(f.id) || 0) >= 100).length / fellows.length) * 100)
        : 0;

    // Calculate average progress using real progress data
    const avgProgress = fellows.length > 0 
        ? Math.round(Array.from(fellowsProgress.values()).reduce((acc, progress) => acc + progress, 0) / fellows.length)
        : 0;

    const stats = [
        {
            label: 'Active Cohorts',
            value: activeCohorts.length,
            total: cohorts.length,
            icon: Users,
            color: 'from-emerald-500 to-teal-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-700',
        },
        {
            label: 'Total Fellows',
            value: activeFellows,
            total: totalFellows,
            icon: GraduationCap,
            color: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
        },
        {
            label: 'Completion Rate',
            value: `${completionRate}%`,
            icon: Target,
            color: 'from-purple-500 to-pink-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700',
        },
        {
            label: 'Avg. Progress',
            value: `${avgProgress}%`,
            icon: BarChart3,
            color: 'from-amber-500 to-orange-600',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-700',
        },
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B4332] font-serif italic leading-tight">
                            Welcome Back
                        </h2>
                        <p className="text-sm sm:text-base text-[#8B9B7E] mt-1 sm:mt-2 font-medium">
                            Here's what's happening with your learning programs today
                        </p>
                    </div>
                    <Button className="rounded-xl sm:rounded-2xl bg-primary text-white hover:bg-primary/90 font-bold h-10 sm:h-12 px-4 sm:px-6 shadow-lg shadow-primary/20 w-full sm:w-auto">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Session
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card 
                            key={index}
                            className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-start justify-between mb-3 sm:mb-4">
                                    <div className={cn(
                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center",
                                        stat.bgColor
                                    )}>
                                        <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", stat.textColor)} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs sm:text-sm text-[#8B9B7E] font-medium uppercase tracking-wider">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-black text-[#1B4332]">
                                        {stat.value}
                                        {stat.total && (
                                            <span className="text-base sm:text-lg text-[#8B9B7E] font-medium ml-1">
                                                / {stat.total}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Active Cohorts Section */}
            <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-[#1B4332] font-serif">Active Cohorts</h3>
                        <p className="text-xs sm:text-sm text-[#8B9B7E] mt-1">Monitoring {activeCohorts.length} learning groups</p>
                    </div>
                    <Button variant="outline" className="rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] font-bold h-9 sm:h-10 px-4 sm:px-6 w-full sm:w-auto">
                        View All Cohorts
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {activeCohorts.slice(0, 3).map((cohort) => (
                        <Card
                            key={cohort.id}
                            className="group relative rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(27,67,50,0.12)] cursor-pointer"
                        >
                            {/* Card Header Gradient */}
                            <div className={cn(
                                "h-24 sm:h-28 md:h-32 w-full p-4 sm:p-6 md:p-8 flex justify-between items-start",
                                "bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]"
                            )}>
                                <Badge className="rounded-full px-3 sm:px-4 py-1 sm:py-1.5 uppercase text-[9px] sm:text-[10px] font-bold tracking-widest border-none bg-white/20 text-white backdrop-blur-md">
                                    {cohort.status}
                                </Badge>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                                </div>
                            </div>

                            {/* Card Content */}
                            <CardContent className="p-4 sm:p-6 md:p-8">
                                <div className="mb-4 sm:mb-6">
                                    <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-[#1B4332] mb-1 sm:mb-2 line-clamp-1">
                                        {cohort.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[#8B9B7E] text-xs sm:text-sm font-medium">
                                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#D4AF37]" />
                                        {cohort.wave_level} Level
                                    </div>
                                </div>

                                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 md:mb-8">
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="text-[#8B9B7E]">Duration</span>
                                        <span className="font-bold text-[#1B4332]">{cohort.duration_months} Months</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="text-[#8B9B7E]">Start Date</span>
                                        <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-[#1B4332]">
                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#1B4332]/40" />
                                            {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'TBD'}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full rounded-xl sm:rounded-2xl h-10 sm:h-12 md:h-14 bg-[#1B4332]/5 text-[#1B4332] hover:bg-[#1B4332] hover:text-white border-none font-bold transition-all duration-300 group-hover:scale-[1.02] text-xs sm:text-sm"
                                    onClick={() => setSelectedCohort(cohort)}
                                >
                                    View Progress
                                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Add New Cohort Card */}
                    <button className="flex flex-col items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border-2 border-dashed border-[#E8E4D8] p-8 sm:p-10 md:p-12 transition-all hover:bg-white hover:border-primary/40 group min-h-[280px] sm:min-h-[320px]">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl sm:rounded-3xl bg-[#FDFCF6] border border-[#E8E4D8] flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary group-hover:border-primary transition-all">
                            <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#1B4332]/40 group-hover:text-white" />
                        </div>
                        <span className="text-base sm:text-lg font-bold text-[#1B4332]/40 group-hover:text-[#1B4332]">Start New Cohort</span>
                        <p className="text-[#8B9B7E] text-xs sm:text-sm text-center mt-2 max-w-[200px]">Launch a new learning journey</p>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <Card className="rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden">
                <CardContent className="p-4 sm:p-6 md:p-8">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#1B4332] font-serif mb-4 sm:mb-6">Recent Fellows</h3>
                    <div className="space-y-3 sm:space-y-4">
                        {loading ? (
                            <p className="text-center text-[#8B9B7E] py-8">Loading activity...</p>
                        ) : fellows.length === 0 ? (
                            <p className="text-center text-[#8B9B7E] py-8">No fellows enrolled yet</p>
                        ) : fellows.slice(0, 5).map((fellow, index) => {
                            const progress = fellowsProgress.get(fellow.id) || 0;
                            const Icon = progress >= 75 ? CheckCircle2 : progress >= 50 ? TrendingUp : Clock;
                            const color = progress >= 75 ? 'text-emerald-600' : progress >= 50 ? 'text-blue-600' : 'text-amber-600';
                            
                            return (
                                <div key={fellow.id || index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-[#FDFCF6] transition-all">
                                    <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border-2 border-[#E8E4D8] flex items-center justify-center shrink-0", color)}>
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm sm:text-base font-bold text-[#1B4332] truncate">{fellow.full_name || 'Fellow'}</p>
                                        <p className="text-xs sm:text-sm text-[#8B9B7E]">
                                            {progress >= 75 ? 'Excellent progress' : progress >= 50 ? 'Making good progress' : 'Getting started'} - {progress}% complete
                                        </p>
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-[#8B9B7E] whitespace-nowrap">
                                        {fellow.status || 'Enrolled'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FacilitatorOverviewTab;
