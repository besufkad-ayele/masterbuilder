"use client";

import React from 'react';
import { useFacilitatorDashboard } from '@/hooks/use-dashboard';
import { Sparkles, Users, Calendar, ArrowRight, LayoutGrid, List, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ProfileModal from './ProfileModal';

interface FacilitatorDashboardLayoutProps {
    companyId: string;
}

const FacilitatorDashboardLayout: React.FC<FacilitatorDashboardLayoutProps> = ({ companyId }) => {
    const { company, cohorts, loading, error } = useFacilitatorDashboard(companyId);

    const handleLogout = () => {
        // Clear any stored authentication data
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        
        // Redirect to login page
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FDFCF6]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FDFCF6]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Error Loading Dashboard</h2>
                    <p className="text-muted-foreground">{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF6] flex flex-col">
            {/* Premium Header */}
            <header className="h-24 flex items-center justify-between px-10 bg-white/40 backdrop-blur-md border-b border-[#E8E4D8]/50 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    {company?.logoUrl ? (
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border border-[#E8E4D8] bg-white">
                            <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="w-full h-full object-contain p-2"
                            />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="text-white w-7 h-7" />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold font-serif italic text-[#1B4332] tracking-tight">
                            {company?.name || 'Partner'} Dashboard
                        </h1>
                        <p className="text-xs font-semibold text-[#8B9B7E] uppercase tracking-[0.2em]">
                            Learning & Excellence Management
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <ProfileModal onLogout={handleLogout}>
                        <Button
                            variant="ghost"
                            className="rounded-2xl border-[#E8E4D8] text-[#1B4332] hover:bg-white font-bold h-12 px-6"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            My Profile
                        </Button>
                    </ProfileModal>
                    <Button
                        className="rounded-2xl bg-red-600 text-white hover:bg-red-700 font-bold h-12 px-6 shadow-xl shadow-red-600/20"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-[#1B4332] font-serif italic">Active Cohorts</h2>
                        <p className="text-[#8B9B7E] mt-1 font-medium">Monitoring {cohorts.length} organizational learning groups</p>
                    </div>
                    <div className="flex items-center bg-white/60 p-1 rounded-2xl border border-[#E8E4D8]">
                        <Button size="icon" variant="ghost" className="rounded-xl bg-white shadow-sm text-primary">
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="rounded-xl text-[#8B9B7E]">
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Fancy Cohort Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cohorts.map((cohort) => (
                        <div
                            key={cohort.id}
                            className="group relative bg-white rounded-[2.5rem] border border-[#E8E4D8] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(27,67,50,0.12)]"
                        >
                            {/* Card Header Gradient */}
                            <div className={cn(
                                "h-32 w-full p-8 flex justify-between items-start",
                                cohort.status === 'active'
                                    ? "bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]"
                                    : "bg-gradient-to-br from-[#E8E4D8] to-[#D4CDBE]"
                            )}>
                                <Badge className={cn(
                                    "rounded-full px-4 py-1.5 uppercase text-[10px] font-bold tracking-widest border-none",
                                    cohort.status === 'active' ? "bg-white/20 text-white backdrop-blur-md" : "bg-white/60 text-[#1B4332]"
                                )}>
                                    {cohort.status}
                                </Badge>
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <Users className={cn("w-6 h-6", cohort.status === 'active' ? "text-white" : "text-[#1B4332]")} />
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-8 pb-10">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-[#1B4332] mb-2">{cohort.name}</h3>
                                    <div className="flex items-center gap-2 text-[#8B9B7E] text-sm font-medium">
                                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                        {cohort.wave_level} Level
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[#8B9B7E]">Duration</span>
                                        <span className="font-bold text-[#1B4332]">{cohort.duration_months} Months</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[#8B9B7E]">Enrollment</span>
                                        <span className="font-bold text-[#1B4332] capitalize">{cohort.enrollment_mode.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[#8B9B7E]">Start Date</span>
                                        <div className="flex items-center gap-2 font-bold text-[#1B4332]">
                                            <Calendar className="w-4 h-4 text-[#1B4332]/40" />
                                            {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'TBD'}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full rounded-2xl h-14 bg-[#1B4332]/5 text-[#1B4332] hover:bg-[#1B4332] hover:text-white border-none font-bold transition-all duration-300 group-hover:scale-[1.02]"
                                    onClick={() => {/* Navigate to cohort details */ }}
                                >
                                    View Cohort Progress
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>

                            {/* Decorative accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    ))}

                    {/* Empty State / Add New Placeholder */}
                    <button className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-[#E8E4D8] p-12 transition-all hover:bg-white hover:border-primary/40 group">
                        <div className="w-16 h-16 rounded-3xl bg-[#FDFCF6] border border-[#E8E4D8] flex items-center justify-center mb-4 group-hover:bg-primary group-hover:border-primary transition-all">
                            <Users className="w-8 h-8 text-[#1B4332]/40 group-hover:text-white" />
                        </div>
                        <span className="text-lg font-bold text-[#1B4332]/40 group-hover:text-[#1B4332]">Start New Batch</span>
                        <p className="text-[#8B9B7E] text-sm text-center mt-2 max-w-[200px]">Launch a new learning journey for your team</p>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default FacilitatorDashboardLayout;
