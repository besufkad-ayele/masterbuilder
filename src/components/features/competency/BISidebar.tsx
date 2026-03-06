"use client";

import React from "react";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { BehavioralIndicatorUI } from "@/types";

interface BISidebarProps {
    behavioralIndicators: BehavioralIndicatorUI[];
    activeBIIndex: number;
    onBISelect: (index: number) => void;
    competencyName: string;
}

export const BISidebar: React.FC<BISidebarProps> = ({
    behavioralIndicators,
    activeBIIndex,
    onBISelect,
    competencyName,
}) => {
    return (
        <aside className="w-80 shrink-0">
            <div className="sticky top-32">
                <div className="bg-white rounded-2xl border border-[#E8E4D8] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-[#E8E4D8]">
                        <h3 className="font-bold text-lg flex items-center">
                            <Target className="w-5 h-5 mr-3 text-[#C5A059]" />
                            {competencyName}
                        </h3>
                    </div>
                    <div className="p-2">
                        {behavioralIndicators.map((bi, idx) => (
                            <button
                                key={bi.id}
                                onClick={() => onBISelect(idx)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 group",
                                    activeBIIndex === idx
                                        ? "bg-[#1B4332] text-white shadow-lg"
                                        : "hover:bg-[#FDFCF6] text-[#1B4332]/70 hover:text-[#1B4332]"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full border flex items-center justify-center shrink-0",
                                        activeBIIndex === idx
                                            ? "border-white/20 bg-white/10"
                                            : "border-[#E8E4D8] bg-white group-hover:border-[#C5A059]"
                                    )}
                                >
                                    {idx + 1}
                                </div>
                                <span className="text-sm font-medium leading-tight">
                                    {bi.description.length > 50
                                        ? bi.description.substring(0, 50) + "..."
                                        : bi.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
};
