"use client";

import React from 'react';
import FellowSidebar from './FellowSidebar';
import FellowTabContent from './FellowTabContent';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, BookOpen, Sparkles } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import BrandLogo from '@/components/features/shared/BrandLogo';

interface FellowDashboardLayoutProps {
  fellowId: string;
}

const FellowDashboardLayout: React.FC<FellowDashboardLayoutProps> = ({ fellowId }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';
  const { data: dashboardData } = useFellowDashboard(fellowId);
  const [forcedCode, setForcedCode] = React.useState("");
  const [forcedCodeError, setForcedCodeError] = React.useState("");
  const [forcedGatePassedForExamId, setForcedGatePassedForExamId] = React.useState<string | null>(null);
  const [submittedTick, setSubmittedTick] = React.useState(0);

  // The exam tab dispatches this when a submission completes, so the gate re-evaluates
  // even though this layout uses its own (otherwise stale) dashboard data instance.
  React.useEffect(() => {
    const handler = () => setSubmittedTick((t) => t + 1);
    window.addEventListener("exam-submitted", handler);
    return () => window.removeEventListener("exam-submitted", handler);
  }, []);

  const pendingForcedExam = React.useMemo(() => {
    if (!dashboardData?.examinations?.length) return null;
    return dashboardData.examinations.find((exam: any) => {
      if (!exam?.is_enabled || !exam?.is_portal_open) return false;
      // Skip exams already submitted in this session (avoids re-forcing right after submit).
      if (typeof window !== "undefined" && window.sessionStorage.getItem(`submitted_exam_${exam.id}`) === "1") {
        return false;
      }
      const attempt = (dashboardData.examinationAttempts || []).find(
        (a: any) => a.examination_id === exam.id
      );
      // No attempt yet, or an in-progress draft => must be taken now.
      if (!attempt) return true;
      if (attempt.status === "draft") return true;
      // Submitted/graded: only force again when a retake is explicitly allowed.
      return !!exam.allow_retake && attempt.status === "graded" && !attempt.passed;
    }) || null;
  }, [dashboardData, submittedTick]);

  React.useEffect(() => {
    if (pendingForcedExam && currentTab !== "exams") {
      router.replace(`${pathname}?tab=exams`);
    }
  }, [pendingForcedExam, currentTab, pathname, router]);

  React.useEffect(() => {
    if (!pendingForcedExam) {
      setForcedGatePassedForExamId(null);
    }
  }, [pendingForcedExam]);

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
    <div className="flex min-h-screen bg-[#FDFCF6] relative">
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
      {pendingForcedExam && forcedGatePassedForExamId !== pendingForcedExam.id && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-white rounded-[2rem] border-2 border-[#E8E4D8] shadow-2xl p-8 lg:p-10 space-y-6 text-center">
            <div className="mx-auto size-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="size-8" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600">Action Required</p>
              <h2 className="text-3xl font-serif font-bold text-[#1B4332]">Final Examination Available</h2>
              <p className="text-muted-foreground">
                You must start your enabled examination before using other sections of the fellow dashboard.
              </p>
              {/* <p className="text-sm font-semibold text-[#1B4332]">
                {pendingForcedExam.title}
              </p> */}
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Exam Access Code
              </label>
              <Input
                value={forcedCode}
                onChange={(e) => {
                  setForcedCodeError("");
                  setForcedCode(e.target.value.toUpperCase());
                }}
                placeholder="Enter secure exam code"
                className="rounded-xl h-12 font-mono text-center text-base"
              />
              {forcedCodeError && (
                <p className="text-xs text-red-600 font-medium">{forcedCodeError}</p>
              )}
            </div>
            <Button
              onClick={() => {
                const expected = String(pendingForcedExam.access_code || "").trim().toUpperCase();
                const provided = forcedCode.trim().toUpperCase();
                if (!expected || provided !== expected) {
                  setForcedCodeError("Invalid exam access code.");
                  return;
                }
                if (typeof window !== "undefined") {
                  window.sessionStorage.setItem(`verified_exam_${pendingForcedExam.id}`, "1");
                }
                setForcedGatePassedForExamId(pendingForcedExam.id);
                router.replace(`${pathname}?tab=exams&startExam=${pendingForcedExam.id}`);
              }}
              className="h-12 px-8 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold"
            >
              Start Examination Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FellowDashboardLayout;
