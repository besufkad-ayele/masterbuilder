"use client";

import React from 'react';
import FellowSidebar from './FellowSidebar';
import FellowTabContent from './FellowTabContent';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Menu, Sparkles } from 'lucide-react';
import { useFellowDashboard } from '@/hooks/use-dashboard';
import { Wave } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/features/shared/BrandLogo';

interface FellowDashboardLayoutProps {
  fellowId: string;
}

const FellowDashboardLayout: React.FC<FellowDashboardLayoutProps> = ({ fellowId }) => {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';
  const { data: dashboardData } = useFellowDashboard(fellowId);

  // Derive the display title for the header
  const headerTitle = React.useMemo(() => {
    if (currentTab.startsWith('wave-')) {
      const waveId = currentTab.replace('wave-', '');
      const wave = (dashboardData?.waves as Wave[])?.find((w: Wave) => w.id === waveId);
      if (wave) {
        return `Wave ${wave.number}: ${wave.name}`;
      }
    }

    // Fallback titles for standard tabs
    const titles: Record<string, string> = {
      dashboard: 'Overview',
      learning: 'Grounding Modules',
      portfolio: 'Leadership Portfolio',
      exams: 'Final Examinations',
      settings: 'Workspace Settings'
    };

    return titles[currentTab] || currentTab.replace('-', ' ');
  }, [currentTab, dashboardData]);

  return (
    <div className="flex min-h-screen bg-[#FDFCF6]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <FellowSidebar fellowId={fellowId} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header / Nav */}
        <header className="lg:hidden h-20 flex items-center justify-between px-6 bg-[#FDFCF6]/80 backdrop-blur-md border-b border-[#E8E4D8] sticky top-0 z-[50]">
          <BrandLogo />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white border border-[#E8E4D8] shadow-sm hover:bg-[#FDFCF6]">
                <BookOpen className="w-6 h-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-transparent border-none">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>Access dashboard modules and settings</SheetDescription>
              </SheetHeader>
              <FellowSidebar fellowId={fellowId} />
            </SheetContent>
          </Sheet>
        </header>

        {/* Global Stats / Title Bar (Desktop only or shared) */}
        <header className="hidden lg:flex h-20 items-center justify-between px-10 bg-[#FDFCF6]/40 backdrop-blur-sm border-b border-[#E8E4D8]/50">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold font-serif italic text-[#1B4332] tracking-tight">
              {headerTitle}
            </h1>
            <p className="text-xs font-semibold text-[#8B9B7E] uppercase tracking-[0.2em]">
              Leadership Excellence Portal
            </p>
          </div>

          <div className="flex items-center gap-6">
            {dashboardData?.company && (
              <div className="flex items-center gap-3 px-4 py-2 bg-white/50 rounded-2xl border border-[#E8E4D8]/50 shadow-sm">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-[#8B9B7E] uppercase tracking-wider">Organization</span>
                  <span className="text-xs font-bold text-[#1B4332]">{dashboardData.company.name}</span>
                </div>
                {dashboardData.company.logoUrl ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#E8E4D8] bg-white">
                    <img
                      src={dashboardData.company.logoUrl}
                      alt={dashboardData.company.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                    <Sparkles className="text-primary w-5 h-5" />
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-10">
            <FellowTabContent tab={currentTab} fellowId={fellowId} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default FellowDashboardLayout;
