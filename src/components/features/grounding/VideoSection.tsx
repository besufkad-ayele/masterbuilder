"use client";

import React from "react";
import { PlayCircle, ExternalLink, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Video {
    title: string;
    url: string;
    duration?: number;
}

interface VideoSectionProps {
    videos: Video[];
    getYouTubeEmbedUrl: (url: string) => string;
    onComplete: () => void;
    isCompleted: boolean;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
    videos,
    getYouTubeEmbedUrl,
    onComplete,
    isCompleted,
}) => {
    if (videos.length === 0) {
        return (
            <div className="py-20 text-center bg-[#FDFCF6] rounded-3xl border-2 border-dashed border-[#E8E4D8]">
                <PlayCircle className="w-12 h-12 text-[#E8E4D8] mx-auto mb-4" />
                <p className="text-[#1B4332]/40 font-medium">No videos available for this phase.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 gap-12">
                {videos.map((video, idx) => (
                    <div key={idx} className="space-y-4">
                        <div className="aspect-video w-full rounded-3xl overflow-hidden bg-black shadow-2xl border-4 border-white">
                            <iframe
                                src={getYouTubeEmbedUrl(video.url)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-xl font-bold font-serif">{video.title}</h4>
                            <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-bold text-[#C5A059] hover:underline flex items-center"
                            >
                                Watch on YouTube <ExternalLink className="ml-1 w-3 h-3" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-8 flex justify-center">
                <button
                    onClick={onComplete}
                    disabled={isCompleted}
                    className={cn(
                        "flex items-center gap-3 px-10 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl",
                        isCompleted
                            ? "bg-[#1B4332] text-white cursor-default shadow-none"
                            : "bg-[#C5A059] text-white cursor-pointer hover:bg-[#B69248] shadow-[0_10px_25px_-5px_rgba(197,160,89,0.3)]"
                    )}
                >
                    {isCompleted ? (
                        <>
                            Completed <CheckCircle2 className="w-5 h-5" />
                        </>
                    ) : (
                        <>
                            Mark as Complete <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
