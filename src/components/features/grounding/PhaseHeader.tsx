"use client";

import React from "react";
import { Heart, Brain, Target } from "lucide-react";

interface PhaseHeaderProps {
    activePhase: 'believe' | 'know' | 'do';
}

export const PhaseHeader: React.FC<PhaseHeaderProps> = ({ activePhase }) => {
    const phaseConfig = {
        believe: {
            icon: Heart,
            title: "Believe Phase",
            description: "Build conviction and understanding of why this matters",
            color: "text-[#C5A059]",
            bgColor: "bg-[#C5A059]/10",
        },
        know: {
            icon: Brain,
            title: "Know Phase",
            description: "Acquire knowledge and frameworks for application",
            color: "text-[#1B4332]",
            bgColor: "bg-[#1B4332]/10",
        },
        do: {
            icon: Target,
            title: "Do Phase",
            description: "Apply learning through reflection and practice",
            color: "text-[#C5A059]",
            bgColor: "bg-[#C5A059]/10",
        },
    };

    const config = phaseConfig[activePhase];
    const Icon = config.icon;

    return (
        <div className="border-b border-[#E8E4D8] p-8 bg-[#FDFCF6]">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${config.color}`} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold font-serif italic">{config.title}</h3>
                    <p className="text-[#1B4332]/60 text-sm mt-1">{config.description}</p>
                </div>
            </div>
        </div>
    );
};
