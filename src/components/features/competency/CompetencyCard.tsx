"use client";

import React from 'react';
import Image from 'next/image';
import { Target, ArrowRight, Lock as LockIcon, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CompetencyCardProps {
    competency: {
        id: string;
        code: string;
        title: string;
        description: string;
        level?: string;
    };
    isLocked: boolean;
    onClick: () => void;
    progress?: {
        completedPhases: string[];
        totalPhases: number;
        percent: number;
    };
    variant?: 'vertical' | 'horizontal';
}

const CompetencyCard: React.FC<CompetencyCardProps> = ({
    competency,
    isLocked,
    onClick,
    progress,
    variant = 'vertical'
}) => {
    const isHorizontal = variant === 'horizontal';

    return (
        <div
            onClick={() => !isLocked && onClick()}
            className={cn(
                "group relative transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isLocked ? "cursor-not-allowed scale-[0.98]" : "cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
                isHorizontal ? "w-full" : "h-full"
            )}
        >
            {/* Ambient Glow */}
            {!isLocked && (
                <div className={cn(
                    "absolute -inset-4 rounded-[3rem] opacity-0 transition-opacity duration-700 blur-2xl pointer-events-none",
                    "group-hover:opacity-30 bg-gradient-to-br from-[#C5A059]/20 via-transparent to-[#1B4332]/10"
                )} />
            )}

            {/* Main Container */}
            <div className={cn(
                "relative h-full flex transition-all duration-700 p-8 overflow-hidden rounded-[2.5rem] border",
                isHorizontal ? "flex-row items-center gap-8" : "flex-col",
                isLocked
                    ? "bg-[#FDFCF6]/50 border-stone-200/60 grayscale-[0.5]"
                    : "bg-white border-[#E8E4D8] group-hover:border-[#C5A059]/40 group-hover:shadow-[0_40px_80px_-16px_rgba(27,67,50,0.1)]"
            )}>

                {/* Visual Accent - Top Gradient Strip */}
                <div className={cn(
                    "absolute top-0 left-0 right-0 h-1.5 transition-all duration-700 opacity-0 group-hover:opacity-100",
                    "bg-gradient-to-r from-transparent via-[#C5A059]/30 to-transparent"
                )} />

                {/* Header Section / Icon */}
                <div className={cn(
                    "relative shrink-0",
                    isHorizontal ? "mb-0" : "mb-10 flex items-start justify-between"
                )}>
                    <div className="relative">
                        <div className={cn(
                            "w-16 h-16 rounded-[1.25rem] flex items-center justify-center font-bold text-xl transition-all duration-700 relative z-10 overflow-hidden bg-[#FDFCF6] border border-[#E8E4D8]",
                            isLocked
                                ? "grayscale opacity-50"
                                : "group-hover:bg-white group-hover:border-[#C5A059]/40 group-hover:shadow-[0_10px_25px_rgba(212,175,55,0.15)] group-hover:-rotate-3"
                        )}>
                            {isLocked ? (
                                <LockIcon className="size-6 text-stone-400" />
                            ) : (
                                <div className="relative w-12 h-12">
                                    <Image
                                        src="/i-Capital Africa Institute.webp"
                                        alt="i-Capital Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            )}
                        </div>
                        {!isLocked && (
                            <div className="absolute -inset-2 bg-[#C5A059]/10 rounded-[1.5rem] blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        )}
                    </div>

                    {!isHorizontal && (
                        isLocked ? (
                            <div className="px-4 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                                Locked
                            </div>
                        ) : (
                            <div className="px-4 py-1.5 rounded-full bg-[#1B4332]/5 text-[#1B4332] text-[10px] font-black uppercase tracking-[0.2em] transform transition-all duration-500 group-hover:bg-[#C5A059] group-hover:text-white flex items-center gap-2">
                                <Sparkles className="size-3" />
                                {competency.level || 'Active'}
                            </div>
                        )
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className={cn(
                            "text-2xl font-bold font-serif italic leading-tight transition-colors duration-500",
                            isLocked ? "text-stone-400" : "text-[#1B4332] group-hover:text-[#1B4332]"
                        )}>
                            {competency.title}
                        </h3>
                        {isHorizontal && !isLocked && (
                            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest text-[#1B4332]/40 border-[#E8E4D8]">
                                {competency.level || 'MODULE'}
                            </Badge>
                        )}
                    </div>

                    <p className={cn(
                        "text-[0.95rem] leading-relaxed transition-colors duration-500 line-clamp-2",
                        isLocked ? "text-stone-400/60" : "text-[#8B9B7E] group-hover:text-[#1B4332]/70",
                        isHorizontal ? "mb-0" : "mb-6"
                    )}>
                        {isLocked
                            ? "This specialized competency is currently restricted. Continue your journey to unlock this module."
                            : competency.description}
                    </p>

                    {/* Progress Visualization */}
                    {progress && !isLocked && (
                        <div className="pt-2">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 flex gap-1.5 h-1.5">
                                    {Array.from({ length: progress.totalPhases }).map((_, idx) => {
                                        const isDone = progress.completedPhases.length > idx;
                                        return (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "flex-1 rounded-full transition-all duration-700",
                                                    isDone
                                                        ? "bg-[#1B4332] shadow-[0_0_8px_rgba(27,67,50,0.2)]"
                                                        : "bg-[#1B4332]/5"
                                                )}
                                            />
                                        );
                                    })}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#1B4332]/40 whitespace-nowrap">
                                    {progress.completedPhases.length} / {progress.totalPhases} Phases
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className={cn(
                    "flex items-center justify-between",
                    isHorizontal ? "shrink-0 ml-4 pl-8 border-l border-[#E8E4D8]/50 h-16" : "mt-8 pt-8 border-t border-[#E8E4D8]/50",
                    isLocked ? "opacity-30" : "opacity-100"
                )}>
                    {!isHorizontal && (
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500",
                                isLocked ? "text-stone-500" : "text-[#1B4332] group-hover:text-[#C5A059] group-hover:translate-x-1"
                            )}>
                                {isLocked ? "Restricted Access" : "Explore Module"}
                            </span>
                            {!isLocked && (
                                <ChevronRight className="w-4 h-4 text-[#C5A059] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                            )}
                        </div>
                    )}

                    <div className={cn(
                        "relative flex items-center justify-center",
                        !isLocked && "group-hover:scale-110 transition-transform duration-500",
                        isHorizontal ? "size-12 rounded-full border border-[#E8E4D8] group-hover:border-[#C5A059]/40" : ""
                    )}>
                        <ArrowRight className={cn(
                            "w-5 h-5 transition-all duration-500",
                            isLocked ? "text-stone-300" : "text-[#1B4332]/20 group-hover:text-[#C5A059] group-hover:translate-x-1"
                        )} />
                        {!isLocked && (
                            <div className="absolute inset-0 bg-[#C5A059]/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </div>
                </div>

                {/* Abstract Aesthetic Elements */}
                {!isHorizontal && (
                    <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000 pointer-events-none">
                        <Target className="w-40 h-40 text-[#1B4332]" />
                    </div>
                )}

                {/* Subtle Grain Overlay */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
            </div>
        </div>
    );
};

export default CompetencyCard;
