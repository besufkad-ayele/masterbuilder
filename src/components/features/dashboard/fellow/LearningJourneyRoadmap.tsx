"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, Layers, CheckCircle, Zap, ShieldCheck, Target, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const LearningJourneyRoadmap = () => {
    const steps = [
        {
            title: "1. Grounding",
            subtitle: "Foundational Identity",
            description: "Internal discovery to build your core leadership identity through structured reflection.",
            icon: Sparkles,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
            borderColor: "border-amber-500/20",
            stats: "1 Module"
        },
        {
            title: "2. Waves",
            subtitle: "Competency Cycles",
            description: "Iterative learning cycles across different domains of leadership excellence.",
            icon: Layers,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20",
            stats: "Multiple Phases"
        },
        {
            title: "3. Validation",
            subtitle: "Phase Mastery",
            description: "Three-stage validation for every skill: mindset, knowledge, and field evidence.",
            icon: ShieldCheck,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20",
            stats: "Believe-Know-Do"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="space-y-1">
                    <h3 className="text-3xl font-serif italic text-[#1B4332]">Learning Architecture</h3>
                    <p className="text-xs text-[#1B4332]/40 font-medium">How your transformation is structured</p>
                </div>
                <Badge variant="outline" className="w-fit text-[10px] font-black border-[#C5A059]/30 text-[#C5A059] uppercase tracking-widest px-4 py-1.5 bg-[#C5A059]/5 rounded-full">
                    Methodology Overview
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Connector Line (Desktop) */}
                <div className="hidden md:block absolute top-[45%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#E8E4D8] to-transparent z-0" />

                {steps.map((step, idx) => (
                    <Card key={idx} className={cn(
                        "relative z-10 rounded-[2.5rem] border-[#E8E4D8] bg-white/40 backdrop-blur-xl overflow-hidden transition-all duration-500 group hover:shadow-2xl hover:bg-white hover:-translate-y-2",
                        step.borderColor
                    )}>
                        <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150", step.bgColor)} />

                        <CardContent className="p-8">
                            <div className={cn(
                                "size-16 rounded-3xl flex items-center justify-center mb-8 shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110",
                                step.bgColor,
                                step.color
                            )}>
                                <step.icon className="size-8" />
                            </div>

                            <div className="space-y-3">
                                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-60", step.color)}>
                                    {step.subtitle}
                                </span>
                                <h4 className="text-2xl font-bold text-[#1B4332] tracking-tight">{step.title}</h4>
                                <p className="text-sm text-[#1B4332]/60 leading-relaxed font-medium">
                                    {step.description}
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-[#E8E4D8]/50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-[#1B4332]/40 uppercase tracking-widest">{step.stats}</span>
                                <div className={cn("size-6 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1", step.color)}>
                                    <ArrowRight className="size-4" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Detailed Phase Breakdown Box */}
            <div className="bg-[#1B4332] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group border border-white/5">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000">
                    <Target size={280} />
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                    <div className="lg:w-1/3 space-y-4 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 mb-2">
                            <Zap className="size-3 text-[#C5A059]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#C5A059]">The Micro-Cycle</span>
                        </div>
                        <h5 className="text-4xl font-serif italic text-white leading-tight">Phase Mastery<br /><span className="text-[#C5A059]">Framework</span></h5>
                        <p className="text-sm text-white/50 leading-relaxed font-medium">Every competency is mastered through three validation dimensions.</p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                        <PhaseCard
                            phase="01"
                            title="Believe"
                            desc="Mindset & Intent. Understanding WHY the behavior matters for your leadership."
                            color="emerald"
                        />
                        <PhaseCard
                            phase="02"
                            title="Know"
                            desc="Theoretical Knowledge. Mastering the principles and HOW-TO foundations."
                            color="blue"
                        />
                        <PhaseCard
                            phase="03"
                            title="Do"
                            desc="Field Evidence. Demonstrating the behavior in real-world professional contexts."
                            color="amber"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const PhaseCard = ({ phase, title, desc, color }: any) => {
    const colorMap: any = {
        emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10",
        blue: "bg-blue-500/20 text-blue-400 border-blue-500/20 shadow-blue-500/10",
        amber: "bg-amber-500/20 text-amber-400 border-amber-500/20 shadow-amber-500/10"
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 hover:bg-white/10 transition-all duration-500 group/phase hover:shadow-2xl hover:scale-105 hover:-translate-y-2 hover:border-[#C5A059]/30">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("size-10 rounded-xl flex items-center justify-center font-bold text-xs border shadow-inner transition-transform group-hover/phase:scale-110", colorMap[color])}>
                    {phase}
                </div>
                <div className="size-2 rounded-full bg-white/20 group-hover/phase:bg-[#C5A059] transition-colors" />
            </div>
            <h6 className="text-xl font-bold text-white mb-3 group-hover/phase:text-[#C5A059] transition-colors tracking-tight">{title}</h6>
            <p className="text-xs text-white/40 leading-relaxed font-medium group-hover/phase:text-white/60 transition-colors">{desc}</p>
        </div>
    );
};

export default LearningJourneyRoadmap;
