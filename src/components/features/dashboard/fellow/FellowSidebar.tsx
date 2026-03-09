"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFellowDashboard } from '@/hooks/use-dashboard';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FileText,
  Award,
  Settings,
  LogOut,
  Target,
  Sparkles,
  GraduationCap,
  Lock as LockIcon
} from 'lucide-react';
import BrandLogo from '@/components/features/shared/BrandLogo';

interface FellowSidebarProps {
  fellowId: string;
}

const FellowSidebar: React.FC<FellowSidebarProps> = ({ fellowId }) => {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';
  const { data: dashboardData } = useFellowDashboard(fellowId);
  const [isWaveOpen, setIsWaveOpen] = useState(true);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return parts.length === 1 ? parts[0].charAt(0).toUpperCase() : 'U';
  };

  const NavItem = ({ icon: Icon, title, tab, href, isActive, isLocked }: any) => (
    <Link
      href={isLocked ? '#' : (href || `/fellow/${dashboardData?.company?.id || ''}?tab=${tab}`)}
      onClick={(e) => isLocked && e.preventDefault()}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
          : "text-muted-foreground hover:bg-accent/10 hover:text-primary",
        isLocked && "opacity-50 cursor-not-allowed grayscale-[0.5]"
      )}
    >
      <Icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary-foreground" : "text-primary/70")} />
      <span className="font-medium text-sm flex-1">{title}</span>
      {isLocked && <LockIcon className="h-3 w-3 text-muted-foreground/50" />}
    </Link>
  );

  const displayName = dashboardData?.user?.name || dashboardData?.profile?.full_name || 'Fellow';
  const isGroundingLocked = dashboardData?.cohort?.is_grounding_active === false;

  return (
    <aside className="w-72 h-screen flex flex-col bg-[#FDFCF6]/80 backdrop-blur-xl border-r border-[#E8E4D8] overflow-hidden sticky top-0 z-[100] transition-all duration-500">
      {/* Brand Header */}
      <div className="p-8 pb-4">
        <BrandLogo className="mb-8" />

        {/* Profile Card */}
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-[#1B4332] truncate">
                {displayName}
              </p>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-[#E8E4D8] text-[#8B9B7E] uppercase font-bold tracking-tighter">
                {dashboardData?.profile?.position || 'Fellow'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-2 space-y-2 overflow-y-auto no-scrollbar scroll-smooth">
        {/* Main Sections */}
        <div className="space-y-1">
          <NavItem
            icon={LayoutDashboard}
            title="Overview"
            tab="dashboard"
            isActive={currentTab === 'dashboard'}
          />

          <NavItem
            icon={BookOpen}
            title="Grounding"
            tab="learning"
            isActive={currentTab === 'learning'}
            isLocked={isGroundingLocked}
          />
        </div>

        {/* Competency Accordion */}
        <div className="pt-2">
          <button
            onClick={() => setIsWaveOpen(!isWaveOpen)}
            className="flex items-center justify-between w-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B9B7E] hover:text-primary transition-colors focus:outline-none"
          >
            Learning Waves
            {isWaveOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {isWaveOpen && (
            <div className="mt-2 space-y-1 ml-4 border-l-2 border-[#E8E4D8]">
              {dashboardData?.waves?.length ? (
                dashboardData.waves.sort((a, b) => a.number - b.number).map((wave) => {
                  const tabKey = `wave-${wave.id}`;
                  const isWaveLocked = (isGroundingLocked && wave.number !== 1) || wave.status === 'locked' || wave.status === 'upcoming';

                  return (
                    <Link
                      key={wave.id}
                      href={`/fellow/${dashboardData?.company?.id || ''}?tab=${tabKey}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-r-xl transition-all duration-300 relative group",
                        currentTab === tabKey ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-accent/5 hover:text-primary",
                        isWaveLocked && "opacity-60 grayscale-[0.5]"
                      )}
                    >
                      <Target className={cn("h-4 w-4 transition-transform", currentTab === tabKey ? "text-primary scale-110" : "text-[#D4AF37]/50 group-hover:text-primary group-hover:scale-110")} />
                      <span className="text-sm font-medium flex-1">Wave {wave.number}: {wave.name}</span>
                      {isWaveLocked && <LockIcon className="h-3 w-3 text-muted-foreground/50" />}
                      {currentTab === tabKey && <div className="absolute left-[-2px] w-[2px] h-6 bg-primary rounded-full transition-all duration-300" />}
                    </Link>
                  );
                })
              ) : (
                <p className="px-4 py-3 text-[10px] text-muted-foreground italic">No waves assigned</p>
              )}
            </div>
          )}
        </div>

        {/* Portfolio & Performance */}
        {/* <div className="pt-4 border-t border-[#E8E4D8]/50 space-y-1">
          <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B9B7E]">Leadership Portfolio</p>
          <NavItem
            icon={FileText}
            title="Evidence & Output"
            tab="portfolio"
            isActive={currentTab === 'portfolio'}
          />
          <NavItem
            icon={GraduationCap}
            title="Examinations"
            tab="exams"
            isActive={currentTab === 'exams'}
          />
        </div> */}
      </div>

      {/* Footer Settings */}
      <div className="p-4 border-t border-[#E8E4D8] bg-white/20">
        <div className="space-y-1">
          {/* <NavItem
            icon={Settings}
            title="Workspace Settings"
            tab="settings"
            isActive={currentTab === 'settings'}
          /> */}
          <button
            onClick={() => window.location.href = '/login'}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[#BC4B51] hover:bg-[#BC4B51]/5 transition-all duration-300 group"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default FellowSidebar;

