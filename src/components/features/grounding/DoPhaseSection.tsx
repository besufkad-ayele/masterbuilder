"use client";

import React from "react";
import { Briefcase, Sparkles, ChevronRight } from "lucide-react";

interface CaseStudy {
    title: string;
    prompt: string;
}

interface Reflection {
    title: string;
    prompt: string;
}

interface DoPhaseSectionProps {
    caseStudies: CaseStudy[];
    reflections: Reflection[];
    onComplete: () => void;
}

export const DoPhaseSection: React.FC<DoPhaseSectionProps> = ({
    caseStudies,
    reflections,
    onComplete,
}) => {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-bold font-display text-card-foreground mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-emerald-600" /> Case Studies
                    </h2>
                    <div className="space-y-3">
                        {caseStudies.map((caseStudy, idx) => (
                            <div key={idx} className="group p-5 rounded-xl bg-white border border-[#E8E4D8] hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md">
                                <h3 className="font-semibold text-[#1B4332] mb-2 group-hover:text-emerald-600 transition-colors">{caseStudy.title}</h3>
                                <p className="text-sm text-[#1B4332]/70 leading-relaxed">{caseStudy.prompt}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold font-display text-card-foreground mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" /> Reflections
                    </h2>
                    <div className="space-y-3">
                        {reflections.map((reflection, idx) => (
                            <div key={idx} className="group p-5 rounded-xl bg-white border border-[#E8E4D8] hover:border-purple-500/50 transition-all shadow-sm hover:shadow-md">
                                <h3 className="font-semibold text-[#1B4332] mb-2 group-hover:text-purple-600 transition-colors">{reflection.title}</h3>
                                <p className="text-sm text-[#1B4332]/70 leading-relaxed">{reflection.prompt}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-8 flex justify-center">
                <button
                    onClick={onComplete}
                    className="flex items-center gap-3 px-10 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl bg-[#1B4332] text-white hover:bg-[#1B4332]/90"
                >
                    Complete Evaluation <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
