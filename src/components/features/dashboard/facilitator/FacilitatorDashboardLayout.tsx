"use client";

import React, { useState } from 'react';
import { useFacilitatorDashboard } from '@/hooks/use-dashboard';
import { 
    Sparkles, 
    Users, 
    Calendar, 
    ArrowRight, 
    LayoutGrid, 
    List, 
    LogOut,
    Home,
    GraduationCap,
    BarChart3,
    Settings,
    Bell,
    Search,
    Filter,
    TrendingUp,
    Award,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ProfileModal from './ProfileModal';
import dynamic from 'next/dynamic';

const FacilitatorOverviewTab = dynamic(() => import('./FacilitatorOverviewTab'), { ssr: false });
const FacilitatorCohortsTab = dynamic(() => import('./FacilitatorCohortsTab'), { ssr: false });
const FacilitatorFellowsTab = dynamic(() => import('./FacilitatorFellowsTab'), { ssr: false });
const FacilitatorAnalyticsTab = dynamic(() => import('./FacilitatorAnalyticsTab'), { ssr: false });
const FacilitatorProfileTab = dynamic(() => import('./FacilitatorProfileTab'), { ssr: false });

interface FacilitatorDashboardLayoutProps {
    companyId: string;
}

type TabType = 'overview' | 'cohorts' | 'fellows' | 'analytics' | 'profile';

const FacilitatorDashboardLayout: React.FC<FacilitatorDashboardLayoutProps> = ({ companyId }) => {
    const { company, cohorts, loading, error, refresh } = useFacilitatorDashboard(companyId);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        window.location.href = '/login';
    };

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: Home },
        { id: 'cohorts' as TabType, label: 'Cohorts', icon: Users },
        { id: 'fellows' as TabType, label: 'Fellows', icon: GraduationCap },
        { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
        { id: 'profile' as TabType, label: 'Profile', icon: Settings },
    ];

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FDFCF6]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground font-serif italic">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FDFCF6] p-4">
                <Card className="max-w-md w-full rounded-[2rem] border-2 border-red-200">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-500 mb-2 font-serif">Error Loading Dashboard</h2>
                        <p className="text-muted-foreground mb-6">{error.message}</p>
                        <Button onClick={refresh} className="rounded-full">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF6] flex flex-col">
            {/* Premium Header */}
            <header className="h-auto sm:h-24 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-4 sm:py-0 bg-white/40 backdrop-blur-md border-b border-[#E8E4D8]/50 sticky top-0 z-[50]">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {company?.logoUrl ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-[#E8E4D8] bg-white shrink-0">
                            <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="w-full h-full object-contain p-1.5 sm:p-2"
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                            <Sparkles className="text-white w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                    )}
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold font-serif italic text-[#1B4332] tracking-tight truncate">
                            {company?.name || 'Partner'} Dashboard
                        </h1>
                        <p className="text-[9px] sm:text-xs font-semibold text-[#8B9B7E] uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                            Learning & Excellence Management
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl sm:rounded-2xl border border-[#E8E4D8] text-[#1B4332] hover:bg-white h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                    >
                        <Bell className="w-4 h-4" />
                    </Button>
                    
                    <ProfileModal onLogout={handleLogout}>
                        <Button
                            variant="ghost"
                            className="hidden sm:flex rounded-2xl border-[#E8E4D8] text-[#1B4332] hover:bg-white font-bold h-10 sm:h-12 px-4 sm:px-6"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            My Profile
                        </Button>
                    </ProfileModal>
                    
                    <Button
                        className="rounded-xl sm:rounded-2xl bg-red-600 text-white hover:bg-red-700 font-bold h-9 sm:h-12 px-3 sm:px-6 shadow-lg sm:shadow-xl shadow-red-600/20 text-xs sm:text-sm"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-[#E8E4D8]/50 px-4 sm:px-6 lg:px-10 overflow-x-auto">
                <div className="flex gap-1 sm:gap-2 min-w-max sm:min-w-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-bold text-xs sm:text-sm transition-all relative whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "text-primary"
                                        : "text-[#8B9B7E] hover:text-[#1B4332]"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-12 max-w-[1600px] mx-auto w-full">
                {activeTab === 'overview' && (
                    <FacilitatorOverviewTab 
                        company={company} 
                        cohorts={cohorts}
                        companyId={companyId}
                    />
                )}
                {activeTab === 'cohorts' && (
                    <FacilitatorCohortsTab 
                        cohorts={cohorts}
                        companyId={companyId}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />
                )}
                {activeTab === 'fellows' && (
                    <FacilitatorFellowsTab 
                        companyId={companyId}
                        cohorts={cohorts}
                    />
                )}
                {activeTab === 'analytics' && (
                    <FacilitatorAnalyticsTab 
                        companyId={companyId}
                        cohorts={cohorts}
                    />
                )}
                {activeTab === 'profile' && (
                    <FacilitatorProfileTab />
                )}
            </main>
        </div>
    );
};

export default FacilitatorDashboardLayout;
