"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useFellowDashboard } from "@/hooks/use-dashboard";
import { ArrowRight, BookOpen, Clock, PlayCircle, FileText, CheckCircle2, Settings, Globe, Building2 } from "lucide-react";
import { GroundingModuleView } from "@/components/features/grounding/GroundingModuleView";

interface FellowGroundingModulesProps {
  fellowId: string;
}

export default function FellowGroundingModules({ fellowId }: FellowGroundingModulesProps) {
  const router = useRouter();
  const { data, loading, error } = useFellowDashboard(fellowId);
  const [isStarted, setIsStarted] = React.useState(false);

  const module = data?.groundingModule;

  // Find the grounding result for the current module to display score
  const groundingResult = React.useMemo(() => {
    if (!data?.groundingResults || !module) return null;
    return data.groundingResults.find(r => r.grounding_id === module.id) || null;
  }, [data?.groundingResults, module]);

  const hasAssessmentScore = groundingResult?.score !== undefined && groundingResult?.score !== null;
  const assessmentScore = groundingResult?.score ?? 0;
  const isPassed = groundingResult?.is_passed ?? false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive text-sm font-bold bg-destructive/5 rounded-3xl border-2 border-dashed border-destructive/20">
        Error: {error.message}
      </div>
    );
  }

  if (isStarted && module) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <GroundingModuleView
          moduleData={module}
          companyId={data?.company?.id || ''}
          userId={fellowId}
          groundingResults={data?.groundingResults}
          onBack={() => setIsStarted(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1B4332] p-12 text-white shadow-2xl border-4 border-[#C5A059]/20">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-12 bg-[#C5A059]"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Grounding Module Delivery</span>
          </div>
          <h1 className="text-5xl font-serif font-bold mb-4 leading-tight">
            Strategic Context & <br />
            <span className="italic text-[#C5A059]">Internal Domain</span>
          </h1>
          <p className="text-white/60 max-w-2xl text-lg leading-relaxed mb-8 font-serif">
            Master the external strategic drivers and internal organizational protocols that define your company's leadership landscape.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-[10px] font-black tracking-widest uppercase">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" /> 10% Overall Weight
            </div>
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-black tracking-widest uppercase">
              <Clock className="w-4 h-4" /> Est. 4 Hours
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <BookOpen size={400} />
        </div>
      </div>

      <div className="space-y-6">
        {!module ? (
          <div className="py-24 text-center bg-white rounded-[3rem] border-4 border-dashed border-[#E8E4D8]">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 bg-[#FDFCF6] rounded-full flex items-center justify-center mx-auto border-2 border-[#E8E4D8]">
                <Settings className="w-10 h-10 text-[#C5A059] animate-spin-slow" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#1B4332]">No Module Assigned</h3>
              <p className="text-muted-foreground text-sm italic">
                Your company-specific grounding module is being prepared by the administrators. Please check back soon.
              </p>
            </div>
          </div>
        ) : (
          <div className="group relative bg-white border-2 border-[#E8E4D8] rounded-[3rem] overflow-hidden shadow-sm hover:border-[#C5A059] hover:shadow-2xl transition-all duration-500">
            <div className="grid lg:grid-cols-[1fr_380px] gap-0">
              <div className="p-12 space-y-10">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className="bg-[#C5A059] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-0">
                      Active
                    </Badge>
                    <span className="text-[10px] text-[#1B4332]/40 font-black uppercase tracking-[0.2em]">
                      Learning Journey
                    </span>
                  </div>
                  <h2 className="text-4xl font-bold font-serif text-[#1B4332] mb-4 group-hover:text-[#C5A059] transition-colors leading-tight">
                    {module.name}
                  </h2>
                  <p className="text-[#1B4332]/70 text-lg leading-relaxed max-w-2xl font-serif italic">
                    {module.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-[#C5A059]" />
                      </div>
                      <span className="text-[11px] uppercase font-black tracking-widest text-[#1B4332]">External Context</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-[#1B4332]/60 font-medium bg-[#FDFCF6] p-3 rounded-xl">
                        <span>Sub-factors</span>
                        <span className="font-black">{module.structure.part_one.sub_factors.length} Units</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#1B4332]/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#1B4332]" />
                      </div>
                      <span className="text-[11px] uppercase font-black tracking-widest text-[#1B4332]">Internal Domain</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-[#1B4332]/60 font-medium bg-[#FDFCF6] p-3 rounded-xl">
                        <span>Core Protocol</span>
                        <span className="font-black">Internal Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#FDFCF6] border-l-2 border-[#E8E4D8] p-12 flex flex-col justify-center items-center text-center space-y-8 bg-[url('/bg-pattern.png')] bg-opacity-5">
                <div className="relative">
                  <div className={`absolute inset-0 ${hasAssessmentScore ? (isPassed ? 'bg-green-500/20' : 'bg-red-500/20') : 'bg-[#C5A059]/20'} blur-2xl rounded-full scale-150`}></div>
                  <div className={`relative w-32 h-32 rounded-full bg-white border-2 ${hasAssessmentScore ? (isPassed ? 'border-green-500/30' : 'border-red-500/30') : 'border-[#C5A059]/30'} flex flex-col items-center justify-center text-[#1B4332] shadow-xl group-hover:scale-105 transition-transform duration-700`}>
                    {hasAssessmentScore ? (
                      <>
                        <span className={`font-black text-3xl font-serif ${isPassed ? 'text-green-600' : 'text-red-500'}`}>{assessmentScore}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#1B4332]/40">out of 10%</span>
                      </>
                    ) : (
                      <>
                        <span className="font-black text-3xl font-serif">{module.structure.part_one.weight}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#C5A059]">Weight</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {hasAssessmentScore ? (
                    <>
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${isPassed ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600'} text-[10px] font-black uppercase tracking-widest`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {isPassed ? 'Assessment Passed' : 'Assessment Not Passed'}
                      </div>
                      <p className="text-sm text-[#1B4332]/60 italic font-serif">
                        Your final assessment score: <span className="font-bold not-italic">{assessmentScore}/10</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[9px] text-[#1B4332]/40 font-black uppercase tracking-[0.3em] mb-2">Module Status</p>
                      <p className="text-sm text-[#1B4332]/60 italic font-serif">Complete Part I and Part II to qualify for final certification.</p>
                    </>
                  )}
                </div>

                <Button
                  onClick={() => setIsStarted(true)}
                  className="w-full h-16 bg-[#1B4332] text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all duration-500 rounded-2xl shadow-xl flex items-center justify-center gap-3 group/btn"
                >
                  {hasAssessmentScore ? 'Review Module' : 'Start Module'} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
