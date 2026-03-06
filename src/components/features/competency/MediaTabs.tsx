"use client";

import React from "react";
import { PlayCircle, FileText, CheckSquare, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SubTabType = "video" | "article" | "quiz";

interface MediaTabsProps {
    activeSubTab: SubTabType;
    onSubTabSelect: (tab: SubTabType) => void;
    completedSubTabs: SubTabType[];
}

export const MediaTabs: React.FC<MediaTabsProps> = ({
    activeSubTab,
    onSubTabSelect,
    completedSubTabs,
}) => {
    const tabs: { id: SubTabType; label: string; icon: any }[] = [
        { id: "video", label: "Videos", icon: PlayCircle },
        { id: "article", label: "Articles", icon: FileText },
        { id: "quiz", label: "Quiz", icon: CheckSquare },
    ];

    return (
        <div className="flex border-b border-[#E8E4D8] mb-8">
            {tabs.map((tab) => {
                const isCompleted = completedSubTabs.includes(tab.id);
                const isActive = activeSubTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onSubTabSelect(tab.id)}
                        className={cn(
                            "px-8 py-4 font-bold uppercase tracking-widest text-xs transition-all relative",
                            isActive ? "text-[#1B4332]" : "text-[#1B4332]/40 hover:text-[#1B4332]/70"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {isCompleted && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        </span>
                        {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C5A059] rounded-t-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
