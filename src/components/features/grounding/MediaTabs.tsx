"use client";

import React from "react";
import { PlayCircle, FileText, CheckSquare, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SubTabType = 'video' | 'article' | 'quiz';

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
    const tabs: Array<{ id: SubTabType; label: string; icon: any }> = [
        { id: 'video', label: 'Videos', icon: PlayCircle },
        { id: 'article', label: 'Articles', icon: FileText },
        { id: 'quiz', label: 'Quiz', icon: CheckSquare },
    ];

    return (
        <div className="flex gap-3 border-b border-[#E8E4D8] pb-4">
            {tabs.map((tab) => {
                const isActive = activeSubTab === tab.id;
                const isCompleted = completedSubTabs.includes(tab.id);
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onSubTabSelect(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all text-sm",
                            isActive
                                ? "bg-[#1B4332] text-white shadow-lg"
                                : "bg-white border border-[#E8E4D8] text-[#1B4332] hover:border-[#C5A059]"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                        {isCompleted && !isActive && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
