"use client";

import React from "react";
import { FileText, ExternalLink, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentItem } from "@/types";

interface ArticleSectionProps {
    articles: ContentItem[];
    onComplete: () => void;
    isCompleted: boolean;
}

export const ArticleSection: React.FC<ArticleSectionProps> = ({
    articles,
    onComplete,
    isCompleted,
}) => {
    if (articles.length === 0) {
        return (
            <div className="py-20 text-center bg-[#FDFCF6] rounded-3xl border-2 border-dashed border-[#E8E4D8]">
                <FileText className="w-12 h-12 text-[#E8E4D8] mx-auto mb-4" />
                <p className="text-[#1B4332]/40 font-medium">No articles available for this phase.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {articles.map((article, idx) => (
                    <a
                        key={idx}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex flex-col bg-white rounded-3xl border border-[#E8E4D8] overflow-hidden hover:border-[#1B4332] hover:shadow-2xl transition-all duration-500 h-[400px]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332] via-[#1B4332]/20 to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity" />
                        {article.image ? (
                            <img
                                src={article.image}
                                alt={article.title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-[#FDFCF6] flex items-center justify-center">
                                <FileText size={64} className="text-[#E8E4D8]" />
                            </div>
                        )}
                        <div className="mt-auto p-8 relative z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                    Read Article
                                </span>
                            </div>
                            <h4 className="text-2xl font-bold text-white font-serif leading-tight">
                                {article.title}
                            </h4>
                        </div>
                    </a>
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
