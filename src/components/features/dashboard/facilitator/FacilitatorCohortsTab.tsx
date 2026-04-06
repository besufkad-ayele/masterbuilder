"use client";

import React, { useState } from 'react';
import { 
    Users, 
    Calendar, 
    ArrowRight,
    Sparkles,
    Search,
    Filter,
    LayoutGrid,
    List,
    Clock,
    TrendingUp,
    Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import FacilitatorCohortDetailView from './FacilitatorCohortDetailView';

interface FacilitatorCohortsTabProps {
    cohorts: any[];
    companyId: string;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
}

const FacilitatorCohortsTab: React.FC<FacilitatorCohortsTabProps> = ({ 
    cohorts,
    companyId,
    viewMode,
    onViewModeChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all');
    const [selectedCohort, setSelectedCohort] = useState<any | null>(null);

    const filteredCohorts = cohorts.filter(cohort => {
        const matchesSearch = cohort.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || cohort.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // If viewing a specific cohort
    if (selectedCohort) {
        return (
            <FacilitatorCohortDetailView 
                cohort={selectedCohort}
                onBack={() => setSelectedCohort(null)}
            />
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B4332] font-serif italic">
                        Cohort Management
                    </h2>
                    <p className="text-sm sm:text-base text-[#8B9B7E] mt-1 sm:mt-2 font-medium">
                        Manage and monitor all learning cohorts
                    </p>
                </div>
                <Button className="rounded-xl sm:rounded-2xl bg-primary text-white hover:bg-primary/90 font-bold h-10 sm:h-12 px-4 sm:px-6 shadow-lg shadow-primary/20 w-full sm:w-auto">
                    <Users className="w-4 h-4 mr-2" />
                    Create New Cohort
                </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#8B9B7E] h-4 w-4 sm:h-5 sm:w-5" />
                    <Input
                        placeholder="Search cohorts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 sm:pl-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif text-sm sm:text-base"
                    />
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                    <div className="flex items-center bg-white p-1 rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8]">
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => onViewModeChange('grid')}
                            className={cn(
                                "rounded-lg sm:rounded-xl h-8 w-8 sm:h-10 sm:w-10",
                                viewMode === 'grid' ? "bg-primary/10 text-primary" : "text-[#8B9B7E]"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => onViewModeChange('list')}
                            className={cn(
                                "rounded-lg sm:rounded-xl h-8 w-8 sm:h-10 sm:w-10",
                                viewMode === 'list' ? "bg-primary/10 text-primary" : "text-[#8B9B7E]"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button 
                        variant="outline" 
                        className="rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] font-bold h-10 sm:h-12 px-3 sm:px-6"
                    >
                        <Filter className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Filter</span>
                    </Button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'all', label: 'All Cohorts', count: cohorts.length },
                    { id: 'active', label: 'Active', count: cohorts.filter(c => c.status === 'active').length },
                    { id: 'upcoming', label: 'Upcoming', count: cohorts.filter(c => c.status === 'upcoming').length },
                    { id: 'completed', label: 'Completed', count: cohorts.filter(c => c.status === 'completed').length },
                ].map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setFilterStatus(filter.id as any)}
                        className={cn(
                            "px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap",
                            filterStatus === filter.id
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-white text-[#8B9B7E] border-2 border-[#E8E4D8] hover:border-primary/40"
                        )}
                    >
                        {filter.label} ({filter.count})
                    </button>
                ))}
            </div>

            {/* Cohorts Grid/List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredCohorts.map((cohort) => (
                        <Card
                            key={cohort.id}
                            onClick={() => setSelectedCohort(cohort)}
                            className="group relative rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(27,67,50,0.12)] cursor-pointer"
                        >
                            {/* Card Header Gradient */}
                            <div className={cn(
                                "h-24 sm:h-28 md:h-32 w-full p-4 sm:p-6 md:p-8 flex justify-between items-start",
                                cohort.status === 'active'
                                    ? "bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]"
                                    : cohort.status === 'upcoming'
                                    ? "bg-gradient-to-br from-[#78350F] to-[#B45309]"
                                    : "bg-gradient-to-br from-[#E8E4D8] to-[#D4CDBE]"
                            )}>
                                <Badge className={cn(
                                    "rounded-full px-3 sm:px-4 py-1 sm:py-1.5 uppercase text-[9px] sm:text-[10px] font-bold tracking-widest border-none",
                                    cohort.status === 'active' || cohort.status === 'upcoming' 
                                        ? "bg-white/20 text-white backdrop-blur-md" 
                                        : "bg-white/60 text-[#1B4332]"
                                )}>
                                    {cohort.status}
                                </Badge>
                                <div className={cn(
                                    "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border",
                                    cohort.status === 'active' || cohort.status === 'upcoming'
                                        ? "bg-white/10 backdrop-blur-md border-white/20"
                                        : "bg-white/60 border-[#1B4332]/20"
                                )}>
                                    <Users className={cn(
                                        "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6",
                                        cohort.status === 'active' || cohort.status === 'upcoming' ? "text-white" : "text-[#1B4332]"
                                    )} />
                                </div>
                            </div>

                            {/* Card Content */}
                            <CardContent className="p-4 sm:p-6 md:p-8">
                                <div className="mb-4 sm:mb-6">
                                    <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-[#1B4332] mb-1 sm:mb-2 line-clamp-2">
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
                                        <span className="text-[#8B9B7E]">Enrollment</span>
                                        <span className="font-bold text-[#1B4332] capitalize">{cohort.enrollment_mode?.replace('_', ' ')}</span>
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCohort(cohort);
                                    }}
                                >
                                    View Details
                                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {filteredCohorts.map((cohort) => (
                        <Card
                            key={cohort.id}
                            onClick={() => setSelectedCohort(cohort)}
                            className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8] overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                        >
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
                                        cohort.status === 'active' ? "bg-emerald-100" : "bg-amber-100"
                                    )}>
                                        <Users className={cn(
                                            "w-6 h-6 sm:w-8 sm:h-8",
                                            cohort.status === 'active' ? "text-emerald-600" : "text-amber-600"
                                        )} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                            <h4 className="text-lg sm:text-xl font-bold text-[#1B4332] truncate">
                                                {cohort.name}
                                            </h4>
                                            <Badge className={cn(
                                                "rounded-full px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase w-fit",
                                                cohort.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                            )}>
                                                {cohort.status}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-[#8B9B7E]">
                                            <span className="flex items-center gap-1.5">
                                                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#D4AF37]" />
                                                {cohort.wave_level}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {cohort.duration_months} Months
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'TBD'}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCohort(cohort);
                                        }}
                                        className="rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] font-bold h-9 sm:h-10 px-4 sm:px-6 w-full sm:w-auto"
                                    >
                                        View Details
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {filteredCohorts.length === 0 && (
                <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#E8E4D8]">
                    <CardContent className="p-12 sm:p-16 text-center">
                        <Users className="w-12 h-12 sm:w-16 sm:h-16 text-[#8B9B7E]/30 mx-auto mb-4" />
                        <h3 className="text-lg sm:text-xl font-bold text-[#1B4332] mb-2">No cohorts found</h3>
                        <p className="text-sm sm:text-base text-[#8B9B7E]">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FacilitatorCohortsTab;
