"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CompetencyCard from '@/components/features/competency/CompetencyCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useFellowDashboard } from '@/hooks/use-dashboard';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { FellowProgressService } from '@/services/FellowProgressService';
import { Wave, Competency, PhaseProgress, Portfolio, WaveCompetency } from '@/types';
import {
  TrendingUp,
  Clock,
  Target,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Zap,
  Star,
  ShieldCheck,
  Sparkles,
  Lock as LockIcon
} from 'lucide-react';
import { cn } from "@/lib/utils";
import ContactModal from './ContactModal';

interface FellowDashboardProps {
  fellowId: string;
}

const FellowDashboard: React.FC<FellowDashboardProps> = ({ fellowId }) => {
  const router = useRouter();
  const { data: fellowState, loading, error } = useFellowDashboard(fellowId);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'performance'>('overview');

  // --- Derived Calculations ---

  const {
    activeWave,
    currentWaveCompetencies,
    overallProgress,
    unlockedCompetencyCount,
    isWaveLocked,
    wavesWithCompetencies,
    groundingScore
  } = useMemo(() => {
    if (!fellowState) return {
      activeWave: null,
      currentWaveCompetencies: [],
      overallProgress: 0,
      unlockedCompetencyCount: 0,
      isWaveLocked: true,
      wavesWithCompetencies: [],
      groundingScore: 0
    };

    // 1. Find the current active wave
    const wave = (fellowState.waves as Wave[]).find(w => w.id === fellowState.profile.current_wave_id) ||
      (fellowState.waves as Wave[]).find(w => w.status === 'active');

    const isGroundingLocked = fellowState.cohort?.is_grounding_active === false;
    const currentWaveIsLocked = wave ? ((isGroundingLocked && wave.number !== 1) || wave.status === 'locked' || wave.status === 'upcoming') : true;

    // 2. Grounding Score
    const gScore = (fellowState.groundingResults || [])[0]?.score || 0;

    // 3. Process all waves and their competencies
    const wavesData = (fellowState.waves as Wave[]).sort((a, b) => a.number - b.number).map(w => {
      const isLocked = (isGroundingLocked && w.number !== 1) || w.status === 'locked' || w.status === 'upcoming';

      const compLinks = (fellowState.waveCompetencies as WaveCompetency[]).filter(wc => wc.wave_id === w.id);
      const compIds = new Set(compLinks.map(l => l.competency_id));

      const comps = (fellowState.competencies as Competency[])
        .filter(c => compIds.has(c.id))
        .map(comp => {
          // Find BIs for this competency using composite ID format: ${compId}_${biCode}
          // Progress records are now stored with behavioral_indicator_id = "${competencyId}_${biCode}"
          const compositePrefix = `${comp.id}_`;
          const biIds = (fellowState.progress as PhaseProgress[])
            .filter(p => p.behavioral_indicator_id.startsWith(compositePrefix))
            .map(p => p.behavioral_indicator_id)
            .filter((v, i, a) => a.indexOf(v) === i);

          // Fallback: also check legacy format from behavioral_indicators collection
          if (biIds.length === 0) {
            const competencyBIs = (fellowState.behavioralIndicators || []).filter((bi: any) => bi.competency_id === comp.id);
            if (competencyBIs.length > 0) {
              biIds.push(...competencyBIs.map((bi: any) => bi.id));
            }
          }

          const compExam = (fellowState.exams || []).find((e: any) => e.competency_id === comp.id);
          const compExamAttempt = compExam ? (fellowState.examAttempts || []).find((a: any) => a.exam_id === compExam.id) : null;
          const examScore = compExamAttempt?.score || 0;

          const compositeScore = FellowProgressService.calculateCompetencyTotalScore(
            biIds,
            fellowState.progress as PhaseProgress[],
            fellowState.portfolios as Portfolio[],
            gScore * 10, // Pass as out of 100
            examScore
          );

          const biBreakdown = biIds.map((biId: string) => {
            const biInfo = (fellowState.behavioralIndicators || []).find((bi: any) => bi.id === biId);
            // Extract the short BI code from composite format (e.g. "compId_BI1" -> "BI1")
            const shortCode = biId.includes('_') ? biId.split('_').slice(1).join('_') : biId;
            const biProgress = (fellowState.progress as PhaseProgress[]).filter(p => p.behavioral_indicator_id === biId);
            const biPortfolios = (fellowState.portfolios as Portfolio[]).filter(p => p.behavioral_indicator_id === biId);

            const believePhase = biProgress.find(p => p.phase_type === 'believe');
            const knowPhase = biProgress.find(p => p.phase_type === 'know');
            const approvedPortfolio = biPortfolios.find(p => p.status === 'approved');

            return {
              id: biId,
              title: biInfo?.title || shortCode || 'Indicator',
              description: biInfo?.description || '',
              score: FellowProgressService.calculateBIScore(biProgress, biPortfolios),
              believePassed: believePhase?.believe_passed || false,
              knowScore: knowPhase?.know_score || 0,
              doScore: approvedPortfolio?.score || 0,
              status: believePhase?.believe_passed ? (approvedPortfolio ? 'Mastered' : 'Developing') : 'Initial'
            };
          });

          const phases = ['believe', 'know', 'do'] as const;
          const completedPhases = phases.filter(phase =>
            (fellowState.progress as PhaseProgress[]).some(p => biIds.includes(p.behavioral_indicator_id) && p.phase_type === phase && p.completed_at)
          );

          return {
            ...comp,
            completedPhases,
            totalPhases: 3,
            progressPercent: compositeScore,
            biBreakdown,
            groundingContribution: gScore, // gScore is inherently out of 10
            examContribution: Math.round((examScore / 100) * 20),
            examScore
          };
        }).sort((a, b) => a.title.localeCompare(b.title));

      return {
        wave: w,
        isLocked,
        competencies: comps
      };
    });

    const currentWaveComps = wavesData.find(wd => wd.wave.id === wave?.id)?.competencies || [];

    // Overall Progress Calculation
    const allWeightedScores = wavesData.flatMap(wd => wd.competencies.map(c => c.progressPercent));
    const progress = allWeightedScores.length > 0 ? Math.round(allWeightedScores.reduce((a, b) => a + b, 0) / allWeightedScores.length) : 0;

    return {
      activeWave: wave,
      currentWaveCompetencies: currentWaveComps,
      overallProgress: progress,
      unlockedCompetencyCount: currentWaveIsLocked ? 0 : currentWaveComps.length,
      isWaveLocked: currentWaveIsLocked,
      wavesWithCompetencies: wavesData,
      groundingScore: gScore
    };
  }, [fellowState]);

  const upcomingDeadlines = useMemo(() => {
    // Mock for now, in future fetch from a 'deadlines' or 'assignments' collection
    return [
      { title: 'Grounding Reflection', date: 'Next Friday', type: 'learning', urgency: 'high' },
      { title: 'Wave 1 Skills Assessment', date: 'In 2 weeks', type: 'quiz', urgency: 'normal' }
    ];
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 text-primary animate-pulse" />
        </div>
        <p className="text-[#1B4332]/60 font-medium animate-pulse">Initializing your workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 p-8 text-center max-w-lg mx-auto mt-20">
        <ShieldCheck className="mx-auto size-12 text-destructive mb-4" />
        <h3 className="text-xl font-bold text-destructive mb-2">Access Connectivity Issue</h3>
        <p className="text-destructive/70 text-sm mb-6">{error.message}</p>
        <Button onClick={() => window.location.reload()} variant="destructive">Retry Connection</Button>
      </Card>
    );
  }

  if (!fellowState) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">

      {/* ─── Hero Header Area ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 h-full">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1B4332] p-10 text-white shadow-2xl h-full flex flex-col justify-between group">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#2D6A4F] to-transparent rounded-full -mr-32 -mt-32 blur-3xl opacity-50 transition-transform duration-1000 group-hover:scale-110 pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#B8860B]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge className="bg-[#C5A059] hover:bg-[#B69248] text-[#1B4332] border-none font-black uppercase tracking-[0.15em] text-[10px] px-4 py-1.5 shadow-lg">
                  Active Fellow
                </Badge>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    {fellowState.company?.name} • {fellowState.cohort?.name}
                  </span>
                </div>
              </div>

              <h1 className="text-5xl font-display font-medium mb-4 leading-tight">
                Welcome back,<br />
                <span className="italic font-serif text-[#C5A059] drop-shadow-sm">
                  {fellowState.user?.name?.split(' ')[0] || fellowState.profile?.full_name?.split(' ')[0] || 'Fellow'}
                </span>
              </h1>

              <p className="text-white/70 max-w-lg text-base leading-relaxed font-medium">
                Your leadership journey is {overallProgress}% complete.
                {overallProgress < 30 ? " You're off to a great start!" : " Keep pushing forward!"}
              </p>
            </div>

            <div className="relative z-10 mt-10 flex items-center gap-6">
              <Button
                size="lg"
                onClick={() => router.push('/fellow?tab=learning')}
                className="bg-white text-[#1B4332] hover:bg-stone-50 rounded-2xl h-14 px-8 font-bold text-sm shadow-xl shadow-black/10 group/btn"
              >
                Continue Learning
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
              </Button>
              <div className="hidden sm:flex items-center gap-3 text-white/60">
                <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Zap className="size-5 text-[#C5A059]" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white uppercase tracking-wider">Current Focus</p>
                  <p className="font-medium">{activeWave?.name || 'Onboarding'}</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000 rotate-12 translate-y-8 translate-x-4">
              <Target size={300} strokeWidth={1} />
            </div>
          </div>
        </div>

        <Card className="bg-white border-[#E8E4D8] overflow-hidden rounded-[2.5rem] p-8 flex flex-col justify-between shadow-lg relative h-full">
          <div className="absolute top-0 right-0 p-4">
            <Star className="size-6 text-[#C5A059] fill-[#C5A059]/10" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#1B4332]/40 uppercase tracking-[0.2em]">Overall Progress</span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-6xl font-serif font-bold text-[#1B4332]">{overallProgress}</span>
              <span className="text-2xl font-serif text-[#1B4332]/40">%</span>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <Progress value={overallProgress} className="h-2.5 bg-[#1B4332]/5 rounded-full" />
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-[#1B4332]/50 italic">
              <span>Initiation</span>
              <span>Excellence</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Tab Switcher ─── */}
      <div className="flex gap-4 p-1 bg-[#1B4332]/5 w-fit rounded-2xl border border-[#E8E4D8]">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('overview')}
          className={cn(
            "rounded-xl px-8 h-12 font-bold text-xs uppercase tracking-widest transition-all",
            activeTab === 'overview' ? "bg-white text-[#1B4332] shadow-sm" : "text-[#1B4332]/40 hover:text-[#1B4332]"
          )}
        >
          Overview
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('performance')}
          className={cn(
            "rounded-xl px-8 h-12 font-bold text-xs uppercase tracking-widest transition-all",
            activeTab === 'performance' ? "bg-white text-[#1B4332] shadow-sm" : "text-[#1B4332]/40 hover:text-[#1B4332]"
          )}
        >
          Performance
        </Button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {fellowState.groundingModule && (
              <div className="space-y-5">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-2xl font-serif italic text-[#1B4332]">Foundational Identity</h3>
                </div>
                <Card
                  className={cn(
                    "rounded-[2.5rem] border-[#E8E4D8] overflow-hidden transition-all duration-500",
                    isWaveLocked
                      ? "opacity-50 grayscale cursor-not-allowed"
                      : "cursor-pointer hover:shadow-xl hover:border-[#C5A059]/40"
                  )}
                  onClick={() => !isWaveLocked && router.push('/fellow?tab=learning')}
                >
                  <CardContent className="p-10 flex gap-8 items-center">
                    <div className={cn(
                      "size-16 rounded-2xl flex items-center justify-center transition-colors",
                      isWaveLocked ? "bg-stone-100 text-stone-400" : "bg-[#1B4332]/5 text-[#1B4332]"
                    )}>
                      {isWaveLocked ? <LockIcon className="size-8" /> : <BookOpen className="size-8" />}
                    </div>
                    <div>
                      <h4 className={cn("text-2xl font-bold", isWaveLocked ? "text-stone-400" : "text-[#1B4332]")}>
                        {fellowState.groundingModule.name}
                      </h4>
                      <p className={cn("text-sm mt-1", isWaveLocked ? "text-stone-400/60" : "text-[#1B4332]/60")}>
                        {isWaveLocked ? "Complete your current prerequisites to unlock this module." : fellowState.groundingModule.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="space-y-8">
              <h3 className="text-2xl font-serif italic text-[#1B4332] px-2">Current Growth Path</h3>
              <div className="grid grid-cols-1 gap-6">
                {currentWaveCompetencies.map((comp) => (
                  <CompetencyCard
                    key={comp.id}
                    competency={{
                      id: comp.id,
                      code: comp.code || '',
                      title: comp.title,
                      description: comp.description,
                      level: comp.level
                    }}
                    isLocked={isWaveLocked} // Use the derived isWaveLocked
                    progress={{
                      completedPhases: comp.completedPhases,
                      totalPhases: comp.totalPhases,
                      percent: comp.progressPercent
                    }}
                    onClick={() => {
                      const waveId = fellowState.profile.current_wave_id || activeWave?.id;
                      router.push(`/fellow/${fellowState.company?.id}?tab=wave-${waveId}&comp=${comp.id}`);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 rounded-3xl border-[#E8E4D8]">
                <Award className="size-5 text-[#C5A059] mb-4" />
                <div className="text-2xl font-bold">{fellowState.portfolios?.length || 0}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/40">Portfolios</div>
              </Card>
              <Card className="p-6 rounded-3xl border-[#E8E4D8]">
                <Clock className="size-5 text-[#C5A059] mb-4" />
                <div className="text-2xl font-bold">{activeWave?.number || 0}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/40">Current Wave</div>
              </Card>
            </div>

            <Card className="rounded-[2.5rem] border-[#E8E4D8] overflow-hidden">
              <CardHeader className="bg-[#1B4332]/5 border-b border-[#E8E4D8]">
                <CardTitle className="text-lg font-serif italic">Upcoming Milestones</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                {upcomingDeadlines.map((d, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-[#E8E4D8] bg-white">
                    <div className={cn("size-2 rounded-full", d.urgency === 'high' ? 'bg-red-500' : 'bg-[#1B4332]')} />
                    <div>
                      <p className="text-sm font-bold">{d.title}</p>
                      <p className="text-[10px] uppercase text-[#1B4332]/40">{d.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <PerformanceView
          waves={wavesWithCompetencies}
          groundingScore={groundingScore}
        />
      )}
    </div>
  );
};

const PerformanceView: React.FC<{ waves: any[], groundingScore: number }> = ({ waves, groundingScore }) => {
  const [selectedCompId, setSelectedCompId] = React.useState<string | null>(null);

  const selectedComp = React.useMemo(() => {
    for (const wave of waves) {
      const comp = wave.competencies.find((c: any) => c.id === selectedCompId);
      if (comp) return { ...comp, waveName: wave.wave.name || `Wave ${wave.wave.number}` };
    }
    return null;
  }, [waves, selectedCompId]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-6 duration-700">
      {/* ─── Metric Overview Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 border-[#E8E4D8] bg-white rounded-[2.5rem] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-4">Grounding Module</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-serif font-bold text-[#1B4332]">{groundingScore}%</span>
            <span className="text-sm font-medium text-[#1B4332]/40">Score</span>
          </div>
          <p className="text-xs text-[#1B4332]/40 mt-4 leading-relaxed italic">
            Contributes <span className="text-[#C5A059] font-bold">10%</span> weighting to your overall composite performance.
          </p>
        </Card>

        <Card className="p-8 border-[#E8E4D8] bg-white rounded-[2.5rem] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-4">Performance Weights</p>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-2">
            <div>
              <p className="text-[8px] font-black text-[#1B4332]/40 uppercase mb-1">Know (Quiz)</p>
              <p className="text-xl font-serif font-bold text-[#1B4332]">20%</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-[#1B4332]/40 uppercase mb-1">Do (Portfolio)</p>
              <p className="text-xl font-serif font-bold text-[#1B4332]">50%</p>
            </div>
            <div className="col-span-2 border-t border-dashed border-[#E8E4D8] pt-2">
              <p className="text-[8px] font-black text-[#1B4332]/40 uppercase mb-1">Exam Contribution</p>
              <p className="text-xl font-serif font-bold text-[#1B4332]">20%</p>
            </div>
          </div>
        </Card>

        <Card className="p-8 border-[#1B4332] bg-[#1B4332] text-white rounded-[2.5rem] shadow-xl flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <Award size={180} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059] mb-3">Excellence Status</p>
          <h4 className="text-2xl font-serif font-bold italic mb-2 leading-tight">Mastery Target</h4>
          <div className="flex items-center gap-3">
            <div className="h-0.5 flex-1 bg-white/10" />
            <span className="text-xs font-black text-[#C5A059]">75%+ COMPOSITE</span>
            <div className="h-0.5 flex-1 bg-white/10" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* ─── Sidebar: Wave & Competency Selector ─── */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-xl font-serif italic text-[#1B4332] px-2 flex items-center gap-2">
            <Calendar className="size-5 text-[#C5A059]" />
            Learning Journey Path
          </h3>

          <div className="space-y-4">
            {waves.map((wd) => (
              <div key={wd.wave.id} className="space-y-2">
                <div className="flex items-center gap-3 px-2">
                  <span className="text-[10px] font-black text-[#1B4332]/30 uppercase tracking-[0.3em]">
                    Wave {wd.wave.number}
                  </span>
                  <div className="h-px flex-1 bg-[#1B4332]/5" />
                </div>

                <div className="space-y-1">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {wd.competencies.map((comp: any) => (
                    <button
                      key={comp.id}
                      onClick={() => !wd.isLocked && setSelectedCompId(comp.id)}
                      disabled={wd.isLocked}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center justify-between group/comp",
                        selectedCompId === comp.id
                          ? "bg-[#1B4332] text-white shadow-lg translate-x-1"
                          : wd.isLocked
                            ? "opacity-40 cursor-not-allowed bg-stone-50"
                            : "hover:bg-[#1B4332]/5 text-[#1B4332]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "size-8 rounded-lg flex items-center justify-center font-bold text-[10px] transition-colors",
                          selectedCompId === comp.id ? "bg-[#C5A059] text-[#1B4332]" : "bg-[#1B4332]/5 text-[#1B4332]/60"
                        )}>
                          {comp.code}
                        </div>
                        <span className="text-xs font-bold truncate max-w-[180px]">{comp.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-black",
                          selectedCompId === comp.id ? "text-[#C5A059]" : "text-[#1B4332]/40"
                        )}>
                          {comp.progressPercent}%
                        </span>
                        {wd.isLocked ? (
                          <LockIcon className="size-3 text-[#1B4332]/20" />
                        ) : (
                          <ArrowRight className={cn(
                            "size-3 transition-transform",
                            selectedCompId === comp.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover/comp:translate-x-0 group-hover/comp:opacity-100"
                          )} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Main Content: Detailed Performance Table ─── */}
        <div className="lg:col-span-8">
          {selectedComp ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Competency Hero Header */}
              <div className="bg-[#1B4332] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -mr-16 -mt-16">
                  <Star size={240} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-[#C5A059] text-[#1B4332] hover:bg-[#C5A059] border-none font-black text-[10px] tracking-widest px-3 py-1">
                        {selectedComp.code}
                      </Badge>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]/60">
                        {selectedComp.waveName}
                      </span>
                    </div>
                    <h2 className="text-4xl font-serif font-medium mb-3">{selectedComp.title}</h2>
                    <p className="text-white/60 text-sm max-w-xl italic leading-relaxed">
                      {selectedComp.description}
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center min-w-[140px]">
                    <p className="text-[10px] font-black tracking-widest text-[#C5A059] uppercase mb-1">Composite Result</p>
                    <div className="text-6xl font-serif font-bold text-white mb-2">{selectedComp.progressPercent}%</div>
                    {selectedComp.progressPercent >= 75 ? (
                      <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase">
                        <CheckCircle className="size-3" />
                        Excellence Met
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-amber-500 font-bold text-[10px] uppercase">
                        <TrendingUp className="size-3" />
                        In Development
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Performance Breakdowns */}
              <div className="space-y-8">
                {/* 1. Global Module Results (Grounding & Exam) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="rounded-[2rem] border-[#E8E4D8] overflow-hidden bg-white shadow-md group">
                    <div className="p-6 flex items-center gap-5">
                      <div className="size-14 rounded-2xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center font-bold text-xl font-serif italic shadow-inner">G</div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/40 mb-1">Foundational Identity</p>
                        <div className="flex items-baseline gap-2">
                          <h4 className={cn(
                            "text-3xl font-serif font-bold",
                            (selectedComp.groundingContribution || 0) > 0 ? "text-[#1B4332]" : "text-[#1B4332]/20"
                          )}>
                            {(selectedComp.groundingContribution || 0) > 0 ? `${selectedComp.groundingContribution}/10` : "Not taken yet"}
                          </h4>
                        </div>
                      </div>
                      {(selectedComp.groundingContribution || 0) > 0 && (
                        <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <CheckCircle className="size-5" />
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="rounded-[2rem] border-[#E8E4D8] overflow-hidden bg-white shadow-md group">
                    <div className="p-6 flex items-center gap-5">
                      <div className="size-14 rounded-2xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center font-bold text-xl font-serif italic shadow-inner">E</div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/40 mb-1">Final Exam Result</p>
                        <div className="flex items-baseline gap-2">
                          <h4 className={cn(
                            "text-3xl font-serif font-bold",
                            (selectedComp.examContribution || 0) > 0 ? "text-[#1B4332]" : "text-[#1B4332]/20"
                          )}>
                            {(selectedComp.examContribution || 0) > 0 ? `${selectedComp.examContribution}/20` : "Not taken yet"}
                          </h4>
                        </div>
                      </div>
                      {(selectedComp.examContribution || 0) > 0 && (
                        <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <CheckCircle className="size-5" />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Behavioral Indicator Performance Table */}
                <Card className="rounded-[2.5rem] border-[#E8E4D8] overflow-hidden bg-white shadow-xl">
                  <div className="p-8 border-b border-[#E8E4D8] bg-[#FDFCF6] flex items-center justify-between">
                    <h4 className="text-xl font-serif italic text-[#1B4332]">Behavioral Indicator Performance</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-blue-500/40" />
                        <span className="text-[9px] font-black uppercase text-[#1B4332]/40 tracking-wider">Know</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-emerald-500/40" />
                        <span className="text-[9px] font-black uppercase text-[#1B4332]/40 tracking-wider">Do</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    type BreakdownItem = { id: string; title: string; description: string; score: number; believePassed: boolean; knowScore: number; doScore: number; status: string; };
                    const totalBIs = selectedComp.biBreakdown?.length || 0;
                    const believePassedCount = selectedComp.biBreakdown?.filter((bi: BreakdownItem) => bi.believePassed).length || 0;
                    const sumKnow = selectedComp.biBreakdown?.reduce((acc: number, bi: BreakdownItem) => acc + (bi.knowScore > 0 ? Math.round((bi.knowScore / 100) * 20) : 0), 0) || 0;
                    const sumDo = selectedComp.biBreakdown?.reduce((acc: number, bi: BreakdownItem) => acc + (bi.doScore > 0 ? Math.round((bi.doScore / 100) * 50) : 0), 0) || 0;
                    const sumScore = selectedComp.biBreakdown?.reduce((acc: number, bi: BreakdownItem) => acc + (bi.score || 0), 0) || 0;

                    const avgKnow = totalBIs > 0 ? Math.round(sumKnow / totalBIs) : 0;
                    const avgDo = totalBIs > 0 ? Math.round(sumDo / totalBIs) : 0;
                    const avgScore = totalBIs > 0 ? Math.round(sumScore / totalBIs) : 0;
                    const groundingAdvantage = selectedComp.groundingContribution || 0;
                    const preExamTotal = avgScore + groundingAdvantage;

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#E8E4D8]">
                              <th className="p-6 text-[10px] font-black uppercase text-[#1B4332]/40 tracking-widest">ID</th>
                              <th className="p-6 text-[10px] font-black uppercase text-[#1B4332]/40 tracking-widest">Indicator Details</th>
                              <th className="p-6 text-[10px] font-black uppercase text-[#1B4332]/40 tracking-widest text-center">Believe</th>
                              <th className="p-6 text-[10px] font-black uppercase text-[#1B4332]/40 tracking-widest text-center">Know (20)</th>
                              <th className="p-6 text-[10px] font-black uppercase text-[#1B4332]/40 tracking-widest text-center">Do (50)</th>
                              <th className="p-6 text-[10px] font-black uppercase text-[#1B4332]/40 tracking-widest text-center">Score (70)</th>
                              <th className="p-6 text-[10px] font-black uppercase text-[#1B4332]/40 tracking-widest">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8E4D8]/50">
                            {selectedComp.biBreakdown?.map((bi: BreakdownItem, idx: number) => (
                              <tr key={bi.id} className="hover:bg-stone-50/50 transition-colors group/row">
                                <td className="p-6">
                                  <span className="text-xs font-black text-[#C5A059]">BI{idx + 1}</span>
                                </td>
                                <td className="p-6">
                                  <div className="space-y-1">
                                    <p className="text-xs font-black text-[#1B4332] uppercase group-hover/row:text-[#C5A059] transition-colors">
                                      {bi.title}
                                    </p>
                                    <p className="text-[10px] text-[#1B4332]/50 line-clamp-1">{bi.description}</p>
                                  </div>
                                </td>
                                <td className="p-6 text-center">
                                  {bi.believePassed ? (
                                    <div className="inline-flex size-6 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center">
                                      <ShieldCheck className="size-3.5" />
                                    </div>
                                  ) : (
                                    <div className="inline-flex size-6 rounded-full bg-stone-100 text-stone-400 items-center justify-center">
                                      <Clock className="size-3.5" />
                                    </div>
                                  )}
                                </td>
                                <td className="p-6 text-center">
                                  <span className={cn(
                                    "text-lg font-serif font-bold",
                                    bi.knowScore > 0 ? "text-[#1B4332]" : "text-[#1B4332]/20"
                                  )}>
                                    {bi.knowScore > 0 ? Math.round((bi.knowScore / 100) * 20) : "—"}
                                  </span>
                                </td>
                                <td className="p-6 text-center">
                                  <span className={cn(
                                    "text-lg font-serif font-bold",
                                    bi.doScore > 0 ? "text-[#1B4332]" : "text-[#1B4332]/20"
                                  )}>
                                    {bi.doScore > 0 ? Math.round((bi.doScore / 100) * 50) : "—"}
                                  </span>
                                </td>
                                <td className="p-6 text-center">
                                  <div className="inline-flex flex-col items-center">
                                    <span className={cn(
                                      "text-2xl font-serif font-bold",
                                      bi.score > 0 ? "text-[#1B4332]" : "text-[#1B4332]/20"
                                    )}>
                                      {bi.score > 0 ? bi.score : "—"}
                                    </span>
                                    {bi.score > 0 && <div className="h-0.5 w-4 bg-[#C5A059]/40 rounded-full" />}
                                  </div>
                                </td>
                                <td className="p-6">
                                  <Badge className={cn(
                                    "border-none text-[9px] font-black uppercase tracking-wider px-3 py-1",
                                    bi.status === 'Mastered' ? "bg-emerald-500/10 text-emerald-600" :
                                      bi.status === 'Developing' ? "bg-blue-500/10 text-blue-600" :
                                        "bg-[#1B4332]/5 text-[#1B4332]/40"
                                  )}>
                                    {bi.score > 0 ? bi.status : "Not taken yet"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-[#1B4332]/5 border-t-2 border-[#E8E4D8]">
                            <tr>
                              <td colSpan={2} className="p-6 text-right">
                                <span className="text-xs font-black text-[#1B4332] uppercase tracking-wider">Overall Average</span>
                              </td>
                              <td className="p-6 text-center">
                                <span className="text-sm font-bold text-[#1B4332]">{believePassedCount} / {totalBIs} Passed</span>
                              </td>
                              <td className="p-6 text-center">
                                <span className="text-lg font-serif font-bold text-[#1B4332]">{avgKnow}</span>
                              </td>
                              <td className="p-6 text-center">
                                <span className="text-lg font-serif font-bold text-[#1B4332]">{avgDo}</span>
                              </td>
                              <td className="p-6 text-center">
                                <span className="text-2xl font-serif font-bold text-[#1B4332]">{avgScore}</span>
                              </td>
                              <td className="p-6"></td>
                            </tr>
                            <tr className="border-t border-[#E8E4D8]/50">
                              <td colSpan={5} className="p-4 px-6 text-right">
                                <span className="text-xs font-semibold text-[#1B4332]/60 uppercase tracking-widest">Grounding Module Contribution (10%)</span>
                              </td>
                              <td className="p-4 px-6 text-center">
                                <span className="text-xl font-bold text-[#C5A059] flex items-center justify-center gap-1">
                                  <span>+</span> {groundingAdvantage}
                                </span>
                              </td>
                              <td className="p-4"></td>
                            </tr>
                            <tr className="border-t border-[#C5A059]/30 bg-[#C5A059]/10">
                              <td colSpan={5} className="p-6 text-right">
                                <span className="text-sm font-black text-[#1B4332] uppercase tracking-wider">Total Value (Pre-Exam)</span>
                              </td>
                              <td className="p-6 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-3xl font-serif font-bold text-[#1B4332]">{preExamTotal} <span className="text-lg text-[#1B4332]/50">/ 80</span></span>
                                  <div className="h-1 w-12 bg-[#C5A059] rounded-full mt-1" />
                                </div>
                              </td>
                              <td className="p-6"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })()}

                  <div className="p-8 bg-[#1B4332]/5 flex items-center gap-6">
                    <div className="size-12 rounded-2xl bg-[#1B4332]/5 flex items-center justify-center text-[#1B4332]">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#1B4332]/40">AI Performance Insight</p>
                      <p className="text-xs text-[#1B4332] font-medium italic leading-snug">
                        {selectedComp.progressPercent >= 75
                          ? "You've demonstrated exceptional mastery across these indicators. Your leadership impact is becoming highly visible."
                          : selectedComp.progressPercent > 0
                            ? "Focus on closing the gap in 'Action' scores to hit the excellence threshold and unlock full mastery."
                            : "Start your journey by completing the 'Believe' phase and 'Knowledge' quizzes for the first indicator."}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] border-4 border-dashed border-[#E8E4D8] rounded-[3rem] flex flex-col items-center justify-center text-center p-20 animate-in fade-in duration-1000">
              <div className="relative mb-8">
                <div className="size-24 rounded-[2rem] bg-[#1B4332]/5 flex items-center justify-center">
                  <BookOpen className="size-10 text-[#1B4332]/20" />
                </div>
                <div className="absolute -top-2 -right-2 size-8 rounded-full bg-[#C5A059] flex items-center justify-center border-4 border-white shadow-lg">
                  <PlayCircle className="size-4 text-[#1B4332]" />
                </div>
              </div>
              <h4 className="text-2xl font-serif italic text-[#1B4332] mb-3">Select a Competency</h4>
              <p className="text-sm text-[#1B4332]/40 max-w-xs leading-relaxed font-medium">
                Deep dive into your behavioral breakdown and performance metrics by selecting a competency from your learning path.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FellowDashboard;
