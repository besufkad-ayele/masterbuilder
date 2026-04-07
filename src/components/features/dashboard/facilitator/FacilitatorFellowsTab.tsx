"use client";

import React, { useState, useEffect } from 'react';
import { 
    GraduationCap, 
    Search,
    Filter,
    Mail,
    Phone,
    MapPin,
    Award,
    TrendingUp,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { FellowService } from '@/services/FellowService';
import { FellowProgressService } from '@/services/FellowProgressService';
import FellowProgressTracker from '@/components/features/dashboard/admin/FellowProgressTracker';

interface FacilitatorFellowsTabProps {
    companyId: string;
    cohorts: any[];
}

interface FellowWithProgress {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar?: string;
    status?: string;
    cohort_id?: string;
    company_id: string;
    overall_progress: number;
    calculatedProgress: number;
}

const FacilitatorFellowsTab: React.FC<FacilitatorFellowsTabProps> = ({ 
    companyId,
    cohorts
}) => {
    const [fellows, setFellows] = useState<FellowWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCohort, setSelectedCohort] = useState<string>('all');
    const [selectedFellow, setSelectedFellow] = useState<any | null>(null);

    useEffect(() => {
        const fetchFellowsWithProgress = async () => {
            try {
                const allFellows = await FellowService.getAllFellows();
                const companyFellows = allFellows.filter(f => f.company_id === companyId);
                
                // Calculate real progress for each fellow
                const fellowsWithProgress = await Promise.all(
                    companyFellows.map(async (fellow) => {
                        try {
                            // Fetch phase progress to calculate real progress
                            const phaseProgress = await FellowProgressService.getPhaseProgressByFellow(fellow.user_id);
                            
                            // Calculate progress: count completed phases
                            const totalPhases = phaseProgress.length;
                            const completedPhases = phaseProgress.filter(p => p.status === 'completed').length;
                            const calculatedProgress = totalPhases > 0 
                                ? Math.round((completedPhases / totalPhases) * 100)
                                : 0;

                            return {
                                ...fellow,
                                calculatedProgress
                            } as FellowWithProgress;
                        } catch (error) {
                            console.error(`Error calculating progress for ${fellow.full_name}:`, error);
                            return {
                                ...fellow,
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

    const filteredFellows = fellows.filter(fellow => {
        const matchesSearch = fellow.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            fellow.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCohort = selectedCohort === 'all' || fellow.cohort_id === selectedCohort;
        return matchesSearch && matchesCohort;
    });

    // If a fellow is selected, show their detailed progress
    if (selectedFellow) {
        return (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedFellow(null)}
                    className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-full transition-all font-serif font-bold italic px-4 sm:px-6"
                >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Back to Fellows List</span>
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B4332] font-serif italic">
                        Fellows Management
                    </h2>
                    <p className="text-sm sm:text-base text-[#8B9B7E] mt-1 sm:mt-2 font-medium">
                        Monitor and support {fellows.length} fellows in their learning journey
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#8B9B7E] h-4 w-4 sm:h-5 sm:w-5" />
                    <Input
                        placeholder="Search fellows by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 sm:pl-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif text-sm sm:text-base"
                    />
                </div>
                
                <select
                    value={selectedCohort}
                    onChange={(e) => setSelectedCohort(e.target.value)}
                    className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] font-bold text-sm sm:text-base bg-white"
                >
                    <option value="all">All Cohorts</option>
                    {cohorts.map(cohort => (
                        <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
                    ))}
                </select>
            </div>

            {/* Fellows Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8] animate-pulse">
                            <CardContent className="p-4 sm:p-6">
                                <div className="h-32 bg-muted/50 rounded-xl" />
                            </CardContent>
                        </Card>
                    ))
                ) : filteredFellows.map((fellow) => (
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
                                        {fellow.calculatedProgress}% Complete
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

            {filteredFellows.length === 0 && !loading && (
                <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8]">
                    <CardContent className="p-12 sm:p-16 text-center">
                        <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-[#8B9B7E]/30 mx-auto mb-4" />
                        <h3 className="text-lg sm:text-xl font-bold text-[#1B4332] mb-2">No fellows found</h3>
                        <p className="text-sm sm:text-base text-[#8B9B7E]">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FacilitatorFellowsTab;
