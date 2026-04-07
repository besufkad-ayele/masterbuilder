"use client";

import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft,
    Users,
    Calendar,
    Clock,
    TrendingUp,
    Award,
    GraduationCap,
    Mail,
    Phone,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { FellowService } from '@/services/FellowService';
import FellowProgressTracker from '@/components/features/dashboard/admin/FellowProgressTracker';

interface FacilitatorCohortDetailViewProps {
    cohort: any;
    onBack: () => void;
}

const FacilitatorCohortDetailView: React.FC<FacilitatorCohortDetailViewProps> = ({ 
    cohort,
    onBack
}) => {
    const [fellows, setFellows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFellow, setSelectedFellow] = useState<any | null>(null);

    useEffect(() => {
        const fetchCohortFellows = async () => {
            try {
                const allFellows = await FellowService.getAllFellows();
                const cohortFellows = allFellows.filter(f => f.cohort_id === cohort.id);
                setFellows(cohortFellows);
            } catch (error) {
                console.error('Error fetching cohort fellows:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCohortFellows();
    }, [cohort.id]);

    const avgProgress = fellows.length > 0
        ? Math.round(fellows.reduce((acc, f) => acc + (f.overall_progress || 0), 0) / fellows.length)
        : 0;

    // If viewing a specific fellow's progress
    if (selectedFellow) {
        return (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedFellow(null)}
                    className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-full transition-all font-serif font-bold italic px-4 sm:px-6"
                >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Back to Cohort</span>
                    <span className="sm:hidden">Back</span>
                </Button>

                <FellowProgressTracker
                    fellowId={selectedFellow.id}
                    fellowName={selectedFellow.full_name || selectedFellow.name}
                    userId={selectedFellow.user_id}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-full transition-all font-serif font-bold italic px-4 sm:px-6"
            >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Back to Cohorts</span>
                <span className="sm:hidden">Back</span>
            </Button>

            {/* Cohort Header */}
            <Card className="rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden">
                <div className={cn(
                    "h-32 sm:h-40 md:h-48 w-full p-6 sm:p-8 md:p-10 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]"
                )}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <Badge className="rounded-full px-3 sm:px-4 py-1 sm:py-1.5 uppercase text-[9px] sm:text-[10px] font-bold tracking-widest border-none bg-white/20 text-white backdrop-blur-md mb-3 sm:mb-4">
                                {cohort.status}
                            </Badge>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-serif mb-2">
                                {cohort.name}
                            </h1>
                            <p className="text-sm sm:text-base text-white/80">
                                {cohort.wave_level} • {cohort.duration_months} Months
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                                {fellows.length}
                            </p>
                            <p className="text-xs sm:text-sm text-white/80 uppercase tracking-wider">Fellows</p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 sm:p-8 md:p-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-[#8B9B7E] uppercase tracking-wider">Avg. Progress</p>
                                <p className="text-xl sm:text-2xl font-black text-[#1B4332]">{avgProgress}%</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 flex items-center justify-center">
                                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-[#8B9B7E] uppercase tracking-wider">Start Date</p>
                                <p className="text-base sm:text-lg font-bold text-[#1B4332]">
                                    {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'TBD'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center">
                                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-[#8B9B7E] uppercase tracking-wider">Duration</p>
                                <p className="text-base sm:text-lg font-bold text-[#1B4332]">{cohort.duration_months} Months</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 flex items-center justify-center">
                                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-[#8B9B7E] uppercase tracking-wider">Enrollment</p>
                                <p className="text-base sm:text-lg font-bold text-[#1B4332] capitalize">
                                    {cohort.enrollment_mode?.replace('_', ' ') || 'Open'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fellows List */}
            <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1B4332] font-serif mb-4 sm:mb-6">
                    Enrolled Fellows
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {Array(6).fill(0).map((_, i) => (
                            <Card key={i} className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8] animate-pulse">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="h-32 bg-muted/50 rounded-xl" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : fellows.length === 0 ? (
                    <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8]">
                        <CardContent className="p-12 sm:p-16 text-center">
                            <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-[#8B9B7E]/30 mx-auto mb-4" />
                            <h3 className="text-lg sm:text-xl font-bold text-[#1B4332] mb-2">No fellows enrolled yet</h3>
                            <p className="text-sm sm:text-base text-[#8B9B7E]">Fellows will appear here once they join this cohort</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {fellows.map((fellow) => (
                            <Card
                                key={fellow.id}
                                onClick={() => setSelectedFellow(fellow)}
                                className="group rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            >
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-start gap-3 sm:gap-4 mb-4">
                                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 border-primary/20 shrink-0">
                                            <AvatarImage src={fellow.avatar} />
                                            <AvatarFallback className="bg-primary/5 text-primary font-black text-base sm:text-lg">
                                                {fellow.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'F'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base sm:text-lg font-bold text-[#1B4332] truncate">
                                                {fellow.full_name}
                                            </h4>
                                            <Badge className={cn(
                                                "rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase mt-1",
                                                (fellow.status === 'active' || fellow.status === 'Active' || fellow.status === 'ACTIVE' || !fellow.status)
                                                    ? "bg-emerald-100 text-emerald-700" 
                                                    : "bg-gray-100 text-gray-700"
                                            )}>
                                                {fellow.status || 'Active'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#8B9B7E]">
                                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                            <span className="truncate">{fellow.email}</span>
                                        </div>
                                        {fellow.phone && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#8B9B7E]">
                                                <Phone className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                                <span>{fellow.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-[#E8E4D8]">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-primary" />
                                            <span className="text-xs sm:text-sm font-bold text-[#1B4332]">
                                                {fellow.overall_progress || 0}% Complete
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="rounded-lg sm:rounded-xl h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary group-hover:translate-x-1 transition-transform"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacilitatorCohortDetailView;
