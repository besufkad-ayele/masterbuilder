"use client";

import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    TrendingUp,
    Users,
    Award,
    Clock,
    Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FellowService } from '@/services/FellowService';
import { FellowProgressService } from '@/services/FellowProgressService';

interface FacilitatorAnalyticsTabProps {
    companyId: string;
    cohorts: any[];
}

interface FellowWithProgress {
    id: string;
    user_id: string;
    full_name: string;
    status?: string;
    cohort_id?: string;
    calculatedProgress: number;
}

const FacilitatorAnalyticsTab: React.FC<FacilitatorAnalyticsTabProps> = ({ 
    companyId,
    cohorts
}) => {
    const [fellows, setFellows] = useState<FellowWithProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFellowsWithProgress = async () => {
            try {
                const allFellows = await FellowService.getAllFellows();
                const companyFellows = allFellows.filter(f => f.company_id === companyId);
                
                // Calculate real progress for each fellow
                const fellowsWithProgress = await Promise.all(
                    companyFellows.map(async (fellow) => {
                        try {
                            const phaseProgress = await FellowProgressService.getPhaseProgressByFellow(fellow.user_id);
                            const totalPhases = phaseProgress.length;
                            const completedPhases = phaseProgress.filter(p => p.status === 'completed').length;
                            const calculatedProgress = totalPhases > 0 
                                ? Math.round((completedPhases / totalPhases) * 100)
                                : 0;

                            return {
                                id: fellow.id,
                                user_id: fellow.user_id,
                                full_name: fellow.full_name,
                                status: fellow.status,
                                cohort_id: fellow.cohort_id,
                                calculatedProgress
                            } as FellowWithProgress;
                        } catch (error) {
                            return {
                                id: fellow.id,
                                user_id: fellow.user_id,
                                full_name: fellow.full_name,
                                status: fellow.status,
                                cohort_id: fellow.cohort_id,
                                calculatedProgress: 0
                            } as FellowWithProgress;
                        }
                    })
                );

                setFellows(fellowsWithProgress);
            } catch (error) {
                console.error('Error fetching fellows:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFellowsWithProgress();
    }, [companyId]);

    // Calculate real metrics from database with calculated progress
    const avgCompletionRate = fellows.length > 0
        ? Math.round(fellows.reduce((acc, f) => acc + f.calculatedProgress, 0) / fellows.length)
        : 0;

    // Check for various active status values
    const activeFellowsCount = fellows.filter(f => 
        f.status === 'active' || 
        f.status === 'Active' || 
        f.status === 'ACTIVE' ||
        !f.status
    ).length;

    const activeEngagement = fellows.length > 0
        ? Math.round((activeFellowsCount / fellows.length) * 100)
        : 0;

    const activeCohorts = cohorts.filter(c => c.status === 'active').length;

    const metrics = [
        { 
            label: 'Avg. Completion Rate', 
            value: `${avgCompletionRate}%`, 
            icon: Target, 
            color: 'emerald',
            description: 'Average progress across all fellows'
        },
        { 
            label: 'Active Engagement', 
            value: `${activeEngagement}%`, 
            icon: TrendingUp, 
            color: 'blue',
            description: 'Percentage of active fellows'
        },
        { 
            label: 'Active Fellows', 
            value: activeFellowsCount.toString(), 
            icon: Users, 
            color: 'purple',
            description: 'Currently enrolled and active'
        },
        { 
            label: 'Active Cohorts', 
            value: activeCohorts.toString(), 
            icon: Award, 
            color: 'amber',
            description: 'Running learning programs'
        },
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B4332] font-serif italic">
                    Analytics & Insights
                </h2>
                <p className="text-sm sm:text-base text-[#8B9B7E] mt-1 sm:mt-2 font-medium">
                    Real-time performance metrics from your learning programs
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8] animate-pulse">
                            <CardContent className="p-4 sm:p-6">
                                <div className="h-32 bg-muted/50 rounded-xl" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {metrics.map((metric, index) => {
                        const Icon = metric.icon;
                        return (
                            <Card key={index} className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8] hover:shadow-xl transition-all">
                                <CardContent className="p-4 sm:p-6">
                                    <div className={cn(
                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4",
                                        metric.color === 'emerald' && "bg-emerald-50",
                                        metric.color === 'blue' && "bg-blue-50",
                                        metric.color === 'purple' && "bg-purple-50",
                                        metric.color === 'amber' && "bg-amber-50"
                                    )}>
                                        <Icon className={cn(
                                            "w-5 h-5 sm:w-6 sm:h-6",
                                            metric.color === 'emerald' && "text-emerald-600",
                                            metric.color === 'blue' && "text-blue-600",
                                            metric.color === 'purple' && "text-purple-600",
                                            metric.color === 'amber' && "text-amber-600"
                                        )} />
                                    </div>
                                    <p className="text-xs sm:text-sm text-[#8B9B7E] font-medium uppercase tracking-wider mb-1">
                                        {metric.label}
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-black text-[#1B4332] mb-2">
                                        {metric.value}
                                    </p>
                                    <p className="text-xs text-[#8B9B7E]">
                                        {metric.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Cohort Performance Breakdown */}
            <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8]">
                <CardContent className="p-4 sm:p-6 md:p-8">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#1B4332] font-serif mb-4 sm:mb-6">
                        Cohort Performance
                    </h3>
                    {loading ? (
                        <div className="space-y-4">
                            {Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cohorts.length === 0 ? (
                                <p className="text-center text-[#8B9B7E] py-8">No cohorts available</p>
                            ) : cohorts.map((cohort) => {
                                const cohortFellows = fellows.filter(f => f.cohort_id === cohort.id);
                                const cohortProgress = cohortFellows.length > 0
                                    ? Math.round(cohortFellows.reduce((acc, f) => acc + f.calculatedProgress, 0) / cohortFellows.length)
                                    : 0;

                                return (
                                    <div key={cohort.id} className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#FDFCF6] border border-[#E8E4D8]">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                            <div>
                                                <h4 className="text-base sm:text-lg font-bold text-[#1B4332]">{cohort.name}</h4>
                                                <p className="text-xs sm:text-sm text-[#8B9B7E]">{cohortFellows.length} fellows enrolled</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl sm:text-2xl font-black text-[#1B4332]">{cohortProgress}%</p>
                                                <p className="text-xs text-[#8B9B7E]">Avg. Progress</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-[#E8E4D8] rounded-full h-2 sm:h-3 overflow-hidden">
                                            <div 
                                                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${cohortProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FacilitatorAnalyticsTab;
