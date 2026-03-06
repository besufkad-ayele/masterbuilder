"use client";

import React from "react";
import { Sparkles, BookOpen, PlayCircle } from "lucide-react";

interface PhaseHeaderProps {
    activePhase: "believe" | "know" | "do";
}

export const PhaseHeader: React.FC<PhaseHeaderProps> = ({ activePhase }) => {
    const titles = {
        believe: "The Foundation",
        know: "The Knowledge",
        do: "The Application",
    };

    const descriptions = {
        believe:
            "Believe in the importance of this trait and how it impacts your leadership journey.",
        know: "Master the concepts and theoretical frameworks behind this behavioral indicator.",
        do: "Apply what you have learned through practical exercises and structured reflection.",
    };

    const Icons = {
        believe: Sparkles,
        know: BookOpen,
        do: PlayCircle,
    };

    const Icon = Icons[activePhase];

    return (
        <div className="bg-[#1B4332] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-xs uppercase tracking-[0.3em] text-[#C5A059] font-bold mb-4">
                    {titles[activePhase]}
                </h3>
                <h2 className="text-4xl font-serif italic mb-2 capitalize">
                    {activePhase} Phase
                </h2>
                <p className="text-white/70 max-w-2xl">{descriptions[activePhase]}</p>
            </div>
            {/* Decorative background element */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute right-10 top-10 opacity-10">
                <Icon size={120} />
            </div>
        </div>
    );
};
