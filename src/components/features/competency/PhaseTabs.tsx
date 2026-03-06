"use client";

import React from "react";
import { Sparkles, BookOpen, PlayCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhaseTabsProps {
    activePhase: "believe" | "know" | "do";
    onPhaseSelect: (phase: "believe" | "know" | "do") => void;
    isPhaseUnlocked: (phase: "believe" | "know" | "do") => boolean;
}

export const PhaseTabs: React.FC<PhaseTabsProps> = ({
    activePhase,
    onPhaseSelect,
    isPhaseUnlocked,
}) => {
    return (
        <div className="flex bg-white rounded-2xl border border-[#E8E4D8] p-1.5 shadow-sm">
            {(["believe", "know", "do"] as const).map((phase) => {
                const unlocked = isPhaseUnlocked(phase);
                const active = activePhase === phase;

                return (
                    <button
                        key={phase}
                        disabled={!unlocked}
                        onClick={() => onPhaseSelect(phase)}
                        className={cn(
                            "flex-1 flex items-center justify-center py-4 px-6 rounded-xl transition-all duration-300 relative overflow-hidden",
                            active
                                ? "bg-[#FDFCF6] text-[#1B4332] shadow-sm ring-1 ring-[#C5A059]/30"
                                : unlocked
                                    ? "text-[#1B4332]/60 hover:text-[#1B4332] hover:bg-[#FDFCF6]/50"
                                    : "text-[#1B4332]/20 cursor-not-allowed"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {phase === "believe" && (
                                <Sparkles
                                    className={cn("w-5 h-5", active ? "text-[#C5A059]" : "text-current")}
                                />
                            )}
                            {phase === "know" && (
                                <BookOpen
                                    className={cn("w-5 h-5", active ? "text-[#C5A059]" : "text-current")}
                                />
                            )}
                            {phase === "do" && (
                                <PlayCircle
                                    className={cn("w-5 h-5", active ? "text-[#C5A059]" : "text-current")}
                                />
                            )}
                            <span className="font-bold uppercase tracking-wider text-xs">
                                {phase}
                            </span>
                        </div>
                        {unlocked && !active && (
                            <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-3 h-3 text-[#1B4332]/20" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
