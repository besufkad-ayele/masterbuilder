"use client";

import React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhaseTabsProps {
    activePhase: 'believe' | 'know' | 'do';
    onPhaseSelect: (phase: 'believe' | 'know' | 'do') => void;
    isPhaseUnlocked: (phase: 'believe' | 'know' | 'do') => boolean;
}

export const PhaseTabs: React.FC<PhaseTabsProps> = ({
    activePhase,
    onPhaseSelect,
    isPhaseUnlocked,
}) => {
    const phases: Array<{ id: 'believe' | 'know' | 'do'; label: string }> = [
        { id: 'believe', label: 'Believe' },
        { id: 'know', label: 'Know' },
        { id: 'do', label: 'Do' },
    ];

    return (
        <div className="flex gap-4">
            {phases.map((phase) => {
                const isUnlocked = isPhaseUnlocked(phase.id);
                const isActive = activePhase === phase.id;

                return (
                    <button
                        key={phase.id}
                        onClick={() => isUnlocked && onPhaseSelect(phase.id)}
                        disabled={!isUnlocked}
                        className={cn(
                            "flex-1 py-4 px-6 rounded-2xl font-bold uppercase tracking-widest transition-all text-sm",
                            isActive
                                ? "bg-[#1B4332] text-white shadow-xl"
                                : isUnlocked
                                    ? "bg-white border-2 border-[#E8E4D8] text-[#1B4332] hover:border-[#C5A059] hover:text-[#C5A059]"
                                    : "bg-[#FDFCF6] border-2 border-[#E8E4D8] text-[#1B4332]/30 cursor-not-allowed"
                        )}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {!isUnlocked && <Lock className="w-4 h-4" />}
                            {phase.label}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
