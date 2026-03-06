"use client";

import React, { useState } from "react";
import {
    Plus,
    Edit,
    Trash2,
    Video,
    FileText,
    Check,
    Globe,
    Briefcase,
    ChevronDown,
    ChevronUp,
    X as XIcon,
    Building2,
    Layout,
    CheckSquare,
    Image as ImageIcon,
    Eye,
    PenLine,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import {
    GroundingModuleStructure,
    ExternalSubFactor,
    InternalVideoSubFactor,
    InternalDocumentSubFactor,
    ReflectionQuestion,
    Company,
    QuizQuestion,
    GroundingModule
} from "@/types";
import { groundingModuleSchema } from "@/lib/validations/grounding";
import { z } from "zod";

interface GroundingModuleFormProps {
    initialData?: GroundingModule;
    companies?: Company[];
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSaving?: boolean;
}

const DEFAULT_STRUCTURE: GroundingModuleStructure = {
    part_one: {
        name: "External Strategic Context",
        weight: "10%",
        completion_assessment: {
            type: "Multiple Choice Quiz",
            description: "Verify comprehension of the strategic landscape.",
            quiz_questions: []
        },
        sub_factors: []
    },
    part_two: {
        name: "Internal  Domain",
        description: "Organization specific internal context.",
        video_section: {
            title: "Leadership Strategy Addresses",
            sub_factors: []
        },
        document_section: {
            title: "Foundational Internal Factors",
            factors: []
        }
    }
};

interface FormFieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
    optional?: boolean;
    className?: string;
}

const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
        <div className="flex items-center gap-1.5 mt-1.5 text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold leading-none">{error}</span>
        </div>
    );
};

const FormField: React.FC<FormFieldProps> = ({ label, error, children, optional, className }) => (
    <div className={cn("space-y-2", className)}>
        <label className="text-xs font-black text-[#C5A059] uppercase tracking-widest pl-1">
            {label}
            {optional && <span className="ml-1 text-[8px] opacity-70">(Optional)</span>}
        </label>
        {children}
        <ErrorMessage error={error} />
    </div>
);

// --- Sub-components for Readability ---

interface StrategicContextCardProps {
    factor: ExternalSubFactor;
    fIdx: number;
    errors: Record<string, string>;
    isExpanded: boolean;
    onToggle: () => void;
    onUpdate: (updates: Partial<ExternalSubFactor>) => void;
    onRemove: () => void;
    onAddVideo: () => void;
    onAddArticle: () => void;
    onAddQuiz: () => void;
}

const StrategicContextCard: React.FC<StrategicContextCardProps> = ({
    factor,
    fIdx,
    errors,
    isExpanded,
    onToggle,
    onUpdate,
    onRemove,
    onAddVideo,
    onAddArticle,
    onAddQuiz
}) => {
    return (
        <div className="border-2 border-border/40 rounded-[2.5rem] bg-[#FDFCF6]/50 overflow-hidden hover:border-primary/20 transition-all shadow-sm">
            <div
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black shadow-md">
                        1.{fIdx + 1}
                    </div>
                    <div className="flex-1">
                        <Input
                            id={`structure.part_one.sub_factors.${fIdx}.name`}
                            className={cn(
                                "bg-transparent border-none focus-visible:ring-0 font-black text-xl p-0 h-auto",
                                errors[`structure.part_one.sub_factors.${fIdx}.name`] && "text-destructive"
                            )}
                            value={factor.name}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onUpdate({ name: e.target.value })}
                        />
                        <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.name`]} />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost" size="icon" className="text-destructive rounded-full h-8 w-8 hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-8 pt-0 space-y-8 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Video Section */}
                        <div className="p-6 bg-white rounded-[2rem] border border-border/50 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-3">
                                    <Video className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-black uppercase text-muted-foreground">Video Sessions</span>
                                </div>
                                <Button onClick={onAddVideo} variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase text-primary">+ Add Video</Button>
                            </div>
                            <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.video_urls`]} />
                            <div className="space-y-3">
                                {factor.video_urls.map((url: string, vIdx: number) => (
                                    <div key={vIdx} className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="YouTube URL"
                                                className={cn(
                                                    "h-9 rounded-xl text-[11px] bg-muted/30 border-none w-full",
                                                    errors[`structure.part_one.sub_factors.${fIdx}.video_urls.${vIdx}`] && "ring-1 ring-destructive bg-destructive/5"
                                                )}
                                                value={url}
                                                onChange={(e) => {
                                                    const newUrls = [...factor.video_urls];
                                                    newUrls[vIdx] = e.target.value;
                                                    onUpdate({ video_urls: newUrls });
                                                }}
                                            />
                                            <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.video_urls.${vIdx}`]} />
                                        </div>
                                        {factor.video_urls.length > 1 && (
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => {
                                                const newUrls = [...factor.video_urls];
                                                newUrls.splice(vIdx, 1);
                                                onUpdate({ video_urls: newUrls });
                                            }}><Trash2 className="w-4 h-4" /></Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Article Section */}
                        <div className="p-6 bg-white rounded-[2rem] border border-border/50 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-black uppercase text-muted-foreground">Article References</span>
                                </div>
                                <Button onClick={onAddArticle} variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase text-primary">+ Add Article</Button>
                            </div>
                            <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.articles`]} />
                            <div className="space-y-6">
                                {factor.articles.map((art: any, aIdx: number) => (
                                    <div key={aIdx} className="p-4 bg-primary/[0.02] rounded-2xl border border-primary/5 relative group/art">
                                        <Button
                                            variant="ghost" size="icon" className="absolute -right-2 -top-2 h-7 w-7 bg-white shadow-md rounded-full text-destructive"
                                            onClick={() => {
                                                const newArt = [...factor.articles];
                                                newArt.splice(aIdx, 1);
                                                onUpdate({ articles: newArt });
                                            }}
                                        ><XIcon className="h-3 w-3" /></Button>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="space-y-1">
                                                <Input
                                                    placeholder="Article Title"
                                                    className={cn(
                                                        "h-9 rounded-xl text-[11px] bg-white border-none font-bold",
                                                        errors[`structure.part_one.sub_factors.${fIdx}.articles.${aIdx}.title`] && "ring-1 ring-destructive"
                                                    )}
                                                    value={art.title}
                                                    onChange={(e) => {
                                                        const newArt = [...factor.articles];
                                                        newArt[aIdx].title = e.target.value;
                                                        onUpdate({ articles: newArt });
                                                    }}
                                                />
                                                <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.articles.${aIdx}.title`]} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Input
                                                        placeholder="Article Link"
                                                        className={cn(
                                                            "h-8 rounded-lg text-[10px] bg-white border-none w-full",
                                                            errors[`structure.part_one.sub_factors.${fIdx}.articles.${aIdx}.link`] && "ring-1 ring-destructive"
                                                        )}
                                                        value={art.link}
                                                        onChange={(e) => {
                                                            const newArt = [...factor.articles];
                                                            newArt[aIdx].link = e.target.value;
                                                            onUpdate({ articles: newArt });
                                                        }}
                                                    />
                                                    <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.articles.${aIdx}.link`]} />
                                                </div>
                                                <div>
                                                    <Input
                                                        placeholder="Image URL"
                                                        className={cn(
                                                            "h-8 rounded-lg text-[10px] bg-white border-none w-full",
                                                            errors[`structure.part_one.sub_factors.${fIdx}.articles.${aIdx}.image_url`] && "ring-1 ring-destructive"
                                                        )}
                                                        value={art.image_url}
                                                        onChange={(e) => {
                                                            const newArt = [...factor.articles];
                                                            newArt[aIdx].image_url = e.target.value;
                                                            onUpdate({ articles: newArt });
                                                        }}
                                                    />
                                                    <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.articles.${aIdx}.image_url`]} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quiz Section */}
                    <div className="p-8 bg-[#1B4332]/[0.03] rounded-[2.5rem] border border-[#1B4332]/10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckSquare className="w-5 h-5 text-primary" />
                                <h5 className="text-sm font-black uppercase text-primary tracking-widest">Sub-Factor Quiz</h5>
                            </div>
                            <Button onClick={onAddQuiz} size="sm" variant="ghost" className="h-8 rounded-xl text-[10px] font-black uppercase text-primary hover:bg-primary/10">+ Add Question</Button>
                        </div>
                        <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.quiz`]} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {factor.quiz.map((q: any, qIdx: number) => (
                                <div key={qIdx} className="bg-white p-6 rounded-[2rem] border border-[#1B4332]/10 shadow-sm relative group/sq">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive absolute -top-2 -right-2 bg-white shadow-md rounded-full border border-destructive/20 hover:bg-destructive/10"
                                        onClick={() => {
                                            const newQuiz = [...factor.quiz];
                                            newQuiz.splice(qIdx, 1);
                                            onUpdate({ quiz: newQuiz });
                                        }}
                                    >
                                        <XIcon className="h-3 w-3" />
                                    </Button>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-[10px] font-black shrink-0">Q{qIdx + 1}</span>
                                            <div className="flex-1">
                                                <Input
                                                    className={cn(
                                                        "border-none focus-visible:ring-0 font-bold p-0 text-sm h-auto bg-transparent text-[#1B4332]",
                                                        errors[`structure.part_one.sub_factors.${fIdx}.quiz.${qIdx}.question`] && "text-destructive"
                                                    )}
                                                    placeholder="Enter question text..."
                                                    value={q.question}
                                                    onChange={(e) => {
                                                        const newQuiz = [...factor.quiz];
                                                        newQuiz[qIdx].question = e.target.value;
                                                        onUpdate({ quiz: newQuiz });
                                                    }}
                                                />
                                                <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.quiz.${qIdx}.question`]} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            {q.options.map((opt: string, optIdx: number) => {
                                                const label = String.fromCharCode(65 + optIdx);
                                                // Check against label now to distinguish duplicates
                                                const isCorrect = q.answer === label;
                                                return (
                                                    <div key={optIdx} className="space-y-1">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1.5 pl-1">
                                                            OPTION {label}
                                                            {isCorrect && <Check className="w-2.5 h-2.5 text-green-600" />}
                                                        </label>
                                                        <Input
                                                            placeholder={`Choice ${label}`}
                                                            className={cn(
                                                                "h-9 text-[11px] rounded-xl bg-muted/20 border-border/40 focus:bg-white transition-colors",
                                                                errors[`structure.part_one.sub_factors.${fIdx}.quiz.${qIdx}.options.${optIdx}`] && "ring-1 ring-destructive"
                                                            )}
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newQuiz = [...factor.quiz];
                                                                newQuiz[qIdx].options[optIdx] = e.target.value;
                                                                onUpdate({ quiz: newQuiz });
                                                            }}
                                                        />
                                                        <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.quiz.${qIdx}.options.${optIdx}`]} />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="pt-4 border-t border-dashed">
                                            <div className="w-full">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase mb-1.5 block pl-1">Correct Answer</label>
                                                <div className="relative">
                                                    <select
                                                        className={cn(
                                                            "w-full h-9 rounded-xl border border-border/40 px-3 text-[11px] font-bold outline-none bg-muted/20 focus:bg-white focus:border-primary/50 appearance-none transition-all",
                                                            errors[`structure.part_one.sub_factors.${fIdx}.quiz.${qIdx}.answer`] && "ring-1 ring-destructive"
                                                        )}
                                                        value={q.answer}
                                                        onChange={(e) => {
                                                            const newQuiz = [...factor.quiz];
                                                            newQuiz[qIdx].answer = e.target.value;
                                                            onUpdate({ quiz: newQuiz });
                                                        }}
                                                    >
                                                        <option value="" disabled>Select the correct answer</option>
                                                        {q.options.map((opt: string, idx: number) => (
                                                            <option key={idx} value={String.fromCharCode(65 + idx)}>
                                                                Option {String.fromCharCode(65 + idx)}{opt ? `: ${opt.substring(0, 30)}${opt.length > 30 ? '...' : ''}` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                </div>
                                                <ErrorMessage error={errors[`structure.part_one.sub_factors.${fIdx}.quiz.${qIdx}.answer`]} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface InternalVideoCardProps {
    factor: InternalVideoSubFactor;
    vIdx: number;
    errors: Record<string, string>;
    onUpdate: (updates: Partial<InternalVideoSubFactor>) => void;
    onRemove: () => void;
    onAddVideo: () => void;
}

const InternalVideoCard: React.FC<InternalVideoCardProps> = ({ factor, vIdx, errors, onUpdate, onRemove, onAddVideo }) => {
    return (
        <div className="bg-white p-10 rounded-[3rem] border border-[#1B4332]/10 shadow-xl space-y-8 group/v">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <Input
                        className={cn(
                            "border-none focus-visible:ring-0 font-black text-2xl p-0 h-auto text-primary",
                            errors[`structure.part_two.video_section.sub_factors.${vIdx}.name`] && "text-destructive"
                        )}
                        value={factor.name}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        placeholder="Sub-Factor Name"
                    />
                    <ErrorMessage error={errors[`structure.part_two.video_section.sub_factors.${vIdx}.name`]} />
                </div>
                <Button
                    variant="ghost" size="icon" className="h-10 w-10 text-destructive opacity-0 group-hover/v:opacity-100 transition-opacity rounded-full hover:bg-destructive/10"
                    onClick={onRemove}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                        <Video className="w-3 h-3" />
                        Video Links
                    </label>
                    <Button onClick={onAddVideo} variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase">+ Add Video</Button>
                </div>
                <div className="space-y-2">
                    {factor.video_urls.map((url: string, urlIdx: number) => (
                        <div key={urlIdx} className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    className={cn(
                                        "h-10 rounded-xl text-xs bg-muted/30 border-none w-full",
                                        errors[`structure.part_two.video_section.sub_factors.${vIdx}.video_urls.${urlIdx}`] && "ring-1 ring-destructive bg-destructive/5"
                                    )}
                                    value={url}
                                    onChange={(e) => {
                                        const newUrls = [...factor.video_urls];
                                        newUrls[urlIdx] = e.target.value;
                                        onUpdate({ video_urls: newUrls });
                                    }}
                                    placeholder="Enter recording URL..."
                                />
                                <ErrorMessage error={errors[`structure.part_two.video_section.sub_factors.${vIdx}.video_urls.${urlIdx}`]} />
                            </div>
                            {factor.video_urls.length > 1 && (
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => {
                                    const newUrls = [...factor.video_urls];
                                    newUrls.splice(urlIdx, 1);
                                    onUpdate({ video_urls: newUrls });
                                }}><Trash2 className="w-4 h-4" /></Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface InternalDocumentCardProps {
    factor: InternalDocumentSubFactor;
    fIdx: number;
    errors: Record<string, string>;
    onUpdate: (updates: Partial<InternalDocumentSubFactor>) => void;
    onRemove: () => void;
}

const InternalDocumentCard: React.FC<InternalDocumentCardProps> = ({ factor, fIdx, errors, onUpdate, onRemove }) => {
    return (
        <div className="bg-white p-10 rounded-[3rem] border border-[#C5A059]/20 shadow-xl space-y-8 group/f">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <Input
                        className={cn(
                            "border-none focus-visible:ring-0 font-black text-2xl p-0 h-auto text-[#1B4332]",
                            errors[`structure.part_two.document_section.factors.${fIdx}.name`] && "text-destructive"
                        )}
                        value={factor.name}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        placeholder="Factor Name"
                    />
                    <ErrorMessage error={errors[`structure.part_two.document_section.factors.${fIdx}.name`]} />
                </div>
                <Button
                    variant="ghost" size="icon" className="h-10 w-10 text-destructive opacity-0 group-hover/f:opacity-100 transition-opacity rounded-full hover:bg-destructive/10"
                    onClick={onRemove}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex justify-center">
                <div className="bg-muted/30 p-1 rounded-xl flex gap-1">
                    <Button
                        type="button"
                        variant={factor.content_mode !== "link" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onUpdate({ content_mode: "markdown" })}
                        className={cn("rounded-lg text-xs font-bold w-32", factor.content_mode !== "link" && "bg-[#C5A059] text-white hover:bg-[#C5A059]/90")}
                    >
                        <PenLine className="w-3 h-3 mr-2" />
                        Markdown
                    </Button>
                    <Button
                        type="button"
                        variant={factor.content_mode === "link" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onUpdate({ content_mode: "link", article_link: factor.article_link || "https://" })}
                        className={cn("rounded-lg text-xs font-bold w-32", factor.content_mode === "link" && "bg-[#C5A059] text-white hover:bg-[#C5A059]/90")}
                    >
                        <Globe className="w-3 h-3 mr-2" />
                        External Link
                    </Button>
                </div>
            </div>

            {factor.content_mode !== "link" ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                            <PenLine className="w-3 h-3" />
                            Markdown Content
                        </label>
                        <Textarea
                            className={cn(
                                "min-h-[300px] font-mono text-xs p-6 rounded-3xl bg-muted/20 border-none shadow-inner resize-none",
                                errors[`structure.part_two.document_section.factors.${fIdx}.markdown`] && "ring-2 ring-destructive bg-destructive/5"
                            )}
                            placeholder="Write internal domain analysis..."
                            value={factor.markdown}
                            onChange={(e) => onUpdate({ markdown: e.target.value })}
                        />
                        <ErrorMessage error={errors[`structure.part_two.document_section.factors.${fIdx}.markdown`]} />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-[#C5A059] flex items-center gap-2">
                            <Eye className="w-3 h-3" />
                            Live Preview
                        </label>
                        <div className="min-h-[400px] p-10 rounded-3xl bg-white border-2 border-dashed border-border/50 overflow-y-auto prose prose-sm max-w-none text-[#1B4332]/80 font-serif">
                            {factor.markdown ? (
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }: any) => <h1 className="text-2xl font-black uppercase mb-4 text-[#1B4332]" {...props} />,
                                        h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold mb-3 text-[#1B4332]" {...props} />,
                                        p: ({ node, ...props }: any) => <p className="mb-4 leading-relaxed" {...props} />,
                                        ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                                        li: ({ node, ...props }: any) => <li {...props} />,
                                        strong: ({ node, ...props }: any) => <strong className="font-black text-primary" {...props} />,
                                    }}
                                >
                                    {factor.markdown}
                                </ReactMarkdown>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic text-xs">
                                    <PenLine className="w-8 h-8 mb-4 opacity-20" />
                                    Markdown preview will appear here...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-10 bg-muted/10 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-4 w-full max-w-lg">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                <FileText className="w-3 h-3" />
                                Article Title
                            </label>
                            <Input
                                className={cn(
                                    "h-12 rounded-2xl text-xs bg-white border shadow-sm font-medium",
                                    errors[`structure.part_two.document_section.factors.${fIdx}.article_title`] && "ring-2 ring-destructive"
                                )}
                                value={factor.article_title}
                                onChange={(e) => onUpdate({ article_title: e.target.value })}
                                placeholder="Enter article title..."
                            />
                            <ErrorMessage error={errors[`structure.part_two.document_section.factors.${fIdx}.article_title`]} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                <Globe className="w-3 h-3" />
                                Resource URL (https://)
                            </label>
                            <Input
                                className={cn(
                                    "h-12 rounded-2xl text-xs bg-white border shadow-sm font-medium",
                                    errors[`structure.part_two.document_section.factors.${fIdx}.article_link`] && "ring-2 ring-destructive"
                                )}
                                value={factor.article_link}
                                onChange={(e) => onUpdate({ article_link: e.target.value })}
                                placeholder="https://resource-link.com"
                            />
                            <ErrorMessage error={errors[`structure.part_two.document_section.factors.${fIdx}.article_link`]} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" />
                                Image URL
                            </label>
                            <Input
                                className={cn(
                                    "h-12 rounded-2xl text-xs bg-white border shadow-sm font-medium",
                                    errors[`structure.part_two.document_section.factors.${fIdx}.article_image_url`] && "ring-2 ring-destructive"
                                )}
                                value={factor.article_image_url}
                                onChange={(e) => onUpdate({ article_image_url: e.target.value })}
                                placeholder="https://image-url.com/pic.jpg"
                            />
                            <ErrorMessage error={errors[`structure.part_two.document_section.factors.${fIdx}.article_image_url`]} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface AssessmentQuestionCardProps {
    q: ReflectionQuestion;
    qIdx: number;
    errors: Record<string, string>;
    onUpdate: (updates: Partial<ReflectionQuestion>) => void;
    onRemove: () => void;
}

const AssessmentQuestionCard: React.FC<AssessmentQuestionCardProps> = ({ q, qIdx, errors, onUpdate, onRemove }) => {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-border/40 shadow-xl space-y-8 relative group/q">
            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-2 bg-white shadow-lg border-2 border-destructive/20 text-destructive rounded-full h-8 w-8 hover:bg-destructive/10 transition-colors"
                onClick={onRemove}
            >
                <XIcon className="h-4 w-4" />
            </Button>

            <div className="flex-1">
                <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs font-black shrink-0">Q{qIdx + 1}</span>
                    <Input
                        placeholder="Enter question text..."
                        className={cn(
                            "border-none focus-visible:ring-0 font-bold p-0 text-foreground text-lg h-auto",
                            errors[`structure.part_one.completion_assessment.quiz_questions.${qIdx}.question`] && "text-destructive"
                        )}
                        value={q.question}
                        onChange={(e) => onUpdate({ question: e.target.value })}
                    />
                </div>
                <ErrorMessage error={errors[`structure.part_one.completion_assessment.quiz_questions.${qIdx}.question`]} />
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 pl-14">
                {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <div key={opt} className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 pl-1">
                            OPTION {opt}
                            {q.correct_answer === opt && <Check className="w-3 h-3 text-green-600 font-black" />}
                        </label>
                        <Input
                            placeholder={`Choice ${opt}`}
                            className={cn(
                                "h-10 text-xs rounded-xl border border-border/40 bg-muted/10 focus:bg-white focus:ring-2 focus:ring-primary/5 transition-all",
                                errors[`structure.part_one.completion_assessment.quiz_questions.${qIdx}.options.${opt}`] && "border-destructive ring-1 ring-destructive/20"
                            )}
                            value={q.options[opt]}
                            onChange={(e) => {
                                const newOptions = { ...q.options };
                                newOptions[opt] = e.target.value;
                                onUpdate({ options: newOptions });
                            }}
                        />
                        <ErrorMessage error={errors[`structure.part_one.completion_assessment.quiz_questions.${qIdx}.options.${opt}`]} />
                    </div>
                ))}
            </div>

            <div className="pt-6 pl-14 border-t border-dashed">
                <div className="max-w-xs">
                    <label className="text-[10px] font-black text-muted-foreground uppercase mb-2 block pl-1">Correct Answer</label>
                    <div className="relative">
                        <select
                            className={cn(
                                "w-full h-10 rounded-xl border border-border/40 px-4 text-xs font-black outline-none bg-muted/10 focus:bg-white focus:border-[#1B4332] appearance-none transition-all",
                                errors[`structure.part_one.completion_assessment.quiz_questions.${qIdx}.correct_answer`] && "border-destructive"
                            )}
                            value={q.correct_answer}
                            onChange={(e) => onUpdate({ correct_answer: e.target.value })}
                        >
                            <option value="" disabled>Select the correct option</option>
                            <option value="A">Choice A</option>
                            <option value="B">Choice B</option>
                            <option value="C">Choice C</option>
                            <option value="D">Choice D</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <ErrorMessage error={errors[`structure.part_one.completion_assessment.quiz_questions.${qIdx}.correct_answer`]} />
                </div>
            </div>
        </div>
    );
};

export const GroundingModuleForm: React.FC<GroundingModuleFormProps> = ({
    initialData,
    companies = [],
    onSubmit,
    onCancel,
    isSaving = false
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formState, setFormState] = useState({
        name: initialData?.name || "",
        level: initialData?.level || "Basic",
        description: initialData?.description || "",
        company_id: initialData?.company_id || "",
        structure: initialData?.structure || DEFAULT_STRUCTURE
    });

    const loadGMD1Template = () => {
        const partOneFactors: ExternalSubFactor[] = [
            "Leading in a VUCA World",
            "Key Global Developments & Industry Challenges (ESG, Geopolitics, Workforce)",
            "Leadership Implications of Technologies (AI, Robotics, Digital Transformation)",
            "National Context: Direction, Industry Opportunities & Challenges",
            "Common Leadership Challenges in Today’s Organizations"
        ].map(name => ({
            id: crypto.randomUUID(),
            name,
            video_urls: ["https://youtube.com/watch?v=sample"],
            articles: [{
                title: "Strategic Overview",
                link: "https://example.com/strategic-overview",
                image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
            }],
            quiz: [{
                question: `Key concept in ${name}?`,
                options: ["Option A", "Option B", "Option C", "Option D"],
                answer: "A",
                explanation: "Correct because it aligns with strategic principles."
            }]
        }));

        const partTwoVideos: InternalVideoSubFactor[] = [
            {
                id: crypto.randomUUID(),
                name: "Corporate Purpose & Direction",
                video_urls: [""]
            },
            {
                id: crypto.randomUUID(),
                name: "Culture & Leadership Norms",
                video_urls: [""]
            }
        ];

        const partTwoDocs: InternalDocumentSubFactor[] = [
            {
                id: crypto.randomUUID(),
                name: "Governance & Organizational Structure",
                markdown: "",
                article_link: "",
                content_mode: 'markdown'
            }
        ];

        setFormState(prev => ({
            ...prev,
            name: "GMD-1: Grounding Module",
            description: "Foundation module for MIDROC Cluster Fellows.",
            structure: {
                ...prev.structure,
                part_one: {
                    ...prev.structure.part_one,
                    weight: "10%",
                    sub_factors: partOneFactors
                },
                part_two: {
                    ...prev.structure.part_two,
                    video_section: {
                        title: "Leadership Video Recordings",
                        sub_factors: partTwoVideos
                    },
                    document_section: {
                        title: "Internal Domain Factors",
                        factors: partTwoDocs
                    }
                }
            }
        }));
    };

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const addExternalFactor = () => {
        const newFactor: ExternalSubFactor = {
            id: crypto.randomUUID(),
            name: "New External Factor",
            video_urls: [""],
            articles: [{ title: "", link: "", image_url: "" }],
            quiz: []
        };
        setFormState({
            ...formState,
            structure: {
                ...formState.structure,
                part_one: {
                    ...formState.structure.part_one,
                    sub_factors: [...formState.structure.part_one.sub_factors, newFactor]
                }
            }
        });
    };

    const addInternalVideo = () => {
        const newFactor: InternalVideoSubFactor = {
            id: crypto.randomUUID(),
            name: "New Leadership Video",
            video_urls: [""]
        };
        setFormState({
            ...formState,
            structure: {
                ...formState.structure,
                part_two: {
                    ...formState.structure.part_two,
                    video_section: {
                        ...formState.structure.part_two.video_section,
                        sub_factors: [...formState.structure.part_two.video_section.sub_factors, newFactor]
                    }
                }
            }
        });
    };

    const addInternalDocument = () => {
        const newFactor: InternalDocumentSubFactor = {
            id: crypto.randomUUID(),
            name: "New Internal Factor",
            markdown: "",
            article_link: "",
            article_title: "",
            article_image_url: "",
            content_mode: 'markdown'
        };
        setFormState({
            ...formState,
            structure: {
                ...formState.structure,
                part_two: {
                    ...formState.structure.part_two,
                    document_section: {
                        ...formState.structure.part_two.document_section,
                        factors: [...formState.structure.part_two.document_section.factors, newFactor]
                    }
                }
            }
        });
    };

    const addQuizQuestion = () => {
        const newQuestion: ReflectionQuestion = {
            question: "",
            options: { A: "", B: "", C: "", D: "" },
            correct_answer: "A",
            explanation: ""
        };
        setFormState({
            ...formState,
            structure: {
                ...formState.structure,
                part_one: {
                    ...formState.structure.part_one,
                    completion_assessment: {
                        ...formState.structure.part_one.completion_assessment,
                        quiz_questions: [...formState.structure.part_one.completion_assessment.quiz_questions, newQuestion]
                    }
                }
            }
        });
    };

    const addSubFactorQuizQuestion = (fIdx: number) => {
        const newQuestion: QuizQuestion = {
            question: "",
            options: ["", "", "", ""],
            answer: "",
            explanation: ""
        };
        const newFactors = [...formState.structure.part_one.sub_factors];
        newFactors[fIdx].quiz.push(newQuestion);
        setFormState({
            ...formState,
            structure: {
                ...formState.structure,
                part_one: {
                    ...formState.structure.part_one,
                    sub_factors: newFactors
                }
            }
        });
    };

    const handleFormSubmit = () => {
        try {
            const validatedData = groundingModuleSchema.parse(formState);
            setErrors({});
            onSubmit(validatedData);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.issues.forEach((issue) => {
                    const path = issue.path.join(".");
                    newErrors[path] = issue.message;
                });
                setErrors(newErrors);

                // Scroll to first error
                const firstErrorField = Object.keys(newErrors)[0];
                const element = document.querySelector(`[name="${firstErrorField}"]`) ||
                    document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                console.error("Validation failed:", newErrors);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {isSaving && (
                <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-stone-100 flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="size-24 rounded-[2.5rem] bg-emerald-50 animate-pulse" />
                            <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 text-[#1B4332] animate-spin" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-serif font-black text-[#1B4332]">
                                {initialData ? "Updating Module..." : "Creating Module..."}
                            </h3>
                            <p className="text-stone-400 font-medium text-sm italic">Forging strategic foundations...</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b p-8 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-serif font-black text-[#1B4332]">
                        Grounding Module
                    </h2>
                    <p className="text-muted-foreground font-medium">Configure strategic alignment and organizational context.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="rounded-2xl px-6 font-black text-muted-foreground" onClick={onCancel} disabled={isSaving}>
                        Discard
                    </Button>
                    <Button
                        className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white rounded-2xl px-10 h-12 font-black shadow-xl shadow-[#1B4332]/20 min-w-[180px]"
                        onClick={handleFormSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                {initialData ? "Syncing..." : "Creating..."}
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5 mr-2" />
                                {initialData ? "Sync Changes" : "Create Module"}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="p-8 space-y-12">
                {/* Header Info */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 p-8 rounded-[2.5rem] bg-muted/20 border border-border/50">
                    <FormField label="Module Name" error={errors.name}>
                        <Input
                            id="name"
                            className={cn(
                                "h-12 rounded-2xl bg-white border-none shadow-sm font-bold text-lg",
                                errors.name && "ring-2 ring-destructive"
                            )}
                            placeholder="Leadership Context Grounding..."
                            value={formState.name}
                            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        />
                    </FormField>

                    <FormField label="Target Organization" error={errors.company_id}>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                className={cn(
                                    "w-full h-12 rounded-2xl bg-white border-2 border-border/50 focus:border-primary px-4 font-bold text-sm pl-12 pr-4 outline-none appearance-none transition-all",
                                    errors.company_id && "border-destructive ring-2 ring-destructive/20"
                                )}
                                value={formState.company_id}
                                onChange={(e) => setFormState({ ...formState, company_id: e.target.value })}
                            >
                                <option value="">Global (No Company)</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </FormField>

                    <FormField label="Proficiency Level" error={errors.level}>
                        <div className="relative">
                            <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                className="w-full h-12 rounded-2xl bg-white border-2 border-border/50 focus:border-primary px-4 font-bold text-sm pl-12 pr-4 outline-none appearance-none transition-all capitalize"
                                value={formState.level}
                                onChange={(e) => setFormState({ ...formState, level: e.target.value })}
                            >
                                {["Basic", "Intermediate", "Advanced", "Expert"].map(lvl => (
                                    <option key={lvl} value={lvl}>{lvl}</option>
                                ))}
                            </select>
                        </div>
                    </FormField>

                    <FormField label="Brief Description" error={errors.description}>
                        <Input
                            className={cn(
                                "h-12 rounded-2xl bg-white border-none shadow-sm font-medium",
                                errors.description && "ring-2 ring-destructive"
                            )}
                            placeholder="Explain the purpose..."
                            value={formState.description}
                            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                        />
                    </FormField>
                </section>

                {/* PART 1 */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif font-black text-[#1B4332]">PART I: External Strategic Context</h3>
                                <p className="text-xs text-muted-foreground font-bold italic">Global factors shaping modern leadership strategy.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {formState.structure.part_one.sub_factors.length === 0 && (
                                <Button onClick={loadGMD1Template} variant="ghost" className="rounded-xl text-[#C5A059] font-black text-xs hover:bg-[#C5A059]/10">
                                    Load GMD-1 Content
                                </Button>
                            )}
                            <Button onClick={addExternalFactor} variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/5 font-black text-xs">
                                + Add Sub-Factor
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <ErrorMessage error={errors["structure.part_one.sub_factors"]} />
                        {formState.structure.part_one.sub_factors.map((factor, fIdx) => (
                            <StrategicContextCard
                                key={factor.id}
                                factor={factor}
                                fIdx={fIdx}
                                errors={errors}
                                isExpanded={expandedSections[`ext-${fIdx}`]}
                                onToggle={() => toggleSection(`ext-${fIdx}`)}
                                onUpdate={(updates: Partial<ExternalSubFactor>) => {
                                    const newFactors = [...formState.structure.part_one.sub_factors];
                                    newFactors[fIdx] = { ...newFactors[fIdx], ...updates };
                                    setFormState({ ...formState, structure: { ...formState.structure, part_one: { ...formState.structure.part_one, sub_factors: newFactors } } });
                                }}
                                onRemove={() => {
                                    const newFactors = [...formState.structure.part_one.sub_factors];
                                    newFactors.splice(fIdx, 1);
                                    setFormState({ ...formState, structure: { ...formState.structure, part_one: { ...formState.structure.part_one, sub_factors: newFactors } } });
                                }}
                                onAddVideo={() => {
                                    const newFactors = [...formState.structure.part_one.sub_factors];
                                    newFactors[fIdx].video_urls.push("");
                                    setFormState({ ...formState, structure: { ...formState.structure, part_one: { ...formState.structure.part_one, sub_factors: newFactors } } });
                                }}
                                onAddArticle={() => {
                                    const newFactors = [...formState.structure.part_one.sub_factors];
                                    newFactors[fIdx].articles.push({ title: "", link: "", image_url: "" });
                                    setFormState({ ...formState, structure: { ...formState.structure, part_one: { ...formState.structure.part_one, sub_factors: newFactors } } });
                                }}
                                onAddQuiz={() => addSubFactorQuizQuestion(fIdx)}
                            />
                        ))}
                    </div>

                    {/* Assessment */}
                    <div className="p-10 rounded-[3rem] bg-[#1B4332]/[0.02] border-2 border-dashed border-[#1B4332]/20 space-y-8">
                        <ErrorMessage error={errors["structure.part_one.completion_assessment.quiz_questions"]} />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center shadow-lg">
                                    <CheckSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-serif font-black text-[#1B4332] uppercase tracking-wider">Part I Verification Assessment</h4>
                                    <p className="text-xs text-muted-foreground font-medium italic">Verify knowledge with reflective questions.</p>
                                </div>
                            </div>
                            <Button onClick={addQuizQuestion} variant="outline" className="rounded-xl border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332]/5 font-black text-xs">
                                + Add Quiz Question
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {formState.structure.part_one.completion_assessment.quiz_questions.map((q, qIdx) => (
                                <AssessmentQuestionCard
                                    key={qIdx}
                                    q={q}
                                    qIdx={qIdx}
                                    errors={errors}
                                    onUpdate={(updates: Partial<ReflectionQuestion>) => {
                                        const newQuestions = [...formState.structure.part_one.completion_assessment.quiz_questions];
                                        newQuestions[qIdx] = { ...newQuestions[qIdx], ...updates };
                                        setFormState({ ...formState, structure: { ...formState.structure, part_one: { ...formState.structure.part_one, completion_assessment: { ...formState.structure.part_one.completion_assessment, quiz_questions: newQuestions } } } });
                                    }}
                                    onRemove={() => {
                                        const newQuestions = [...formState.structure.part_one.completion_assessment.quiz_questions];
                                        newQuestions.splice(qIdx, 1);
                                        setFormState({ ...formState, structure: { ...formState.structure, part_one: { ...formState.structure.part_one, completion_assessment: { ...formState.structure.part_one.completion_assessment, quiz_questions: newQuestions } } } });
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* PART 2 */}
                <section className="space-y-12">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center shadow-inner">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif font-black text-[#1B4332]">PART II: Internal Organization Domain</h3>
                                <Input
                                    className="h-5 border-none focus-visible:ring-0 text-xs p-0 text-muted-foreground font-bold italic bg-transparent mt-1"
                                    value={formState.structure.part_two.description}
                                    onChange={(e) => setFormState({ ...formState, structure: { ...formState.structure, part_two: { ...formState.structure.part_two, description: e.target.value } } })}
                                    placeholder="Organization specific internal context description..."
                                />
                                <ErrorMessage error={errors["structure.part_two.description"]} />
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Videos/Sub-Factors */}
                    <div className="space-y-8 p-10 rounded-[3rem] bg-muted/10 border border-border/50">
                        <ErrorMessage error={errors["structure.part_two.video_section.sub_factors"]} />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Video className="w-5 h-5 text-primary" />
                                <Input
                                    className="h-7 border-none focus-visible:ring-0 font-black text-lg p-0 text-[#1B4332] uppercase tracking-[0.1em] w-[300px] bg-transparent"
                                    value={formState.structure.part_two.video_section.title}
                                    onChange={(e) => setFormState({ ...formState, structure: { ...formState.structure, part_two: { ...formState.structure.part_two, video_section: { ...formState.structure.part_two.video_section, title: e.target.value } } } })}
                                    placeholder="Section Title (e.g., Strategic Leadership Addresses)"
                                />
                                <ErrorMessage error={errors["structure.part_two.video_section.title"]} />
                            </div>
                            <Button onClick={addInternalVideo} size="sm" variant="ghost" className="rounded-xl font-black text-xs text-primary hover:bg-primary/5">
                                + Define Recording Sub-Factor
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {formState.structure.part_two.video_section.sub_factors.map((v, vIdx) => (
                                <InternalVideoCard
                                    key={v.id}
                                    factor={v}
                                    vIdx={vIdx}
                                    errors={errors}
                                    onUpdate={(updates: Partial<InternalVideoSubFactor>) => {
                                        const newSubFactors = [...formState.structure.part_two.video_section.sub_factors];
                                        newSubFactors[vIdx] = { ...newSubFactors[vIdx], ...updates };
                                        setFormState({ ...formState, structure: { ...formState.structure, part_two: { ...formState.structure.part_two, video_section: { ...formState.structure.part_two.video_section, sub_factors: newSubFactors } } } });
                                    }}
                                    onRemove={() => {
                                        const newSubFactors = [...formState.structure.part_two.video_section.sub_factors];
                                        newSubFactors.splice(vIdx, 1);
                                        setFormState({ ...formState, structure: { ...formState.structure, part_two: { ...formState.structure.part_two, video_section: { ...formState.structure.part_two.video_section, sub_factors: newSubFactors } } } });
                                    }}
                                    onAddVideo={() => {
                                        const newSubFactors = [...formState.structure.part_two.video_section.sub_factors];
                                        newSubFactors[vIdx].video_urls.push("");
                                        setFormState({ ...formState, structure: { ...formState.structure, part_two: { ...formState.structure.part_two, video_section: { ...formState.structure.part_two.video_section, sub_factors: newSubFactors } } } });
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Documents/Factors */}
                    <div className="space-y-8 p-10 rounded-[3rem] bg-[#C5A059]/[0.05] border border-[#C5A059]/30">
                        <ErrorMessage error={errors["structure.part_two.document_section.factors"]} />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-[#C5A059]" />
                                <Input
                                    className="h-7 border-none focus-visible:ring-0 font-black text-lg p-0 text-[#1B4332] uppercase tracking-[0.1em] w-[300px] bg-transparent"
                                    value={formState.structure.part_two.document_section.title}
                                    onChange={(e) => setFormState({ ...formState, structure: { ...formState.structure, part_two: { ...formState.structure.part_two, document_section: { ...formState.structure.part_two.document_section, title: e.target.value } } } })}
                                    placeholder="Section Title (e.g., Foundational Internal Factors)"
                                />
                                <ErrorMessage error={errors["structure.part_two.document_section.title"]} />
                            </div>
                            <Button onClick={addInternalDocument} size="sm" variant="ghost" className="rounded-xl font-black text-xs text-[#C5A059] hover:bg-[#C5A059]/10">
                                + Add Internal Domain Factor
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {formState.structure.part_two.document_section.factors.map((f, fIdx) => (
                                <InternalDocumentCard
                                    key={f.id}
                                    factor={f}
                                    fIdx={fIdx}
                                    errors={errors}
                                    onUpdate={(updates: Partial<InternalDocumentSubFactor>) => {
                                        const newFactors = [...formState.structure.part_two.document_section.factors];
                                        newFactors[fIdx] = { ...newFactors[fIdx], ...updates };
                                        setFormState({ ...formState, structure: { ...formState.structure, part_two: { ...formState.structure.part_two, document_section: { ...formState.structure.part_two.document_section, factors: newFactors } } } });
                                    }}
                                    onRemove={() => {
                                        const newFactors = [...formState.structure.part_two.document_section.factors];
                                        newFactors.splice(fIdx, 1);
                                        setFormState({ ...formState, structure: { ...formState.structure, part_two: { ...formState.structure.part_two, document_section: { ...formState.structure.part_two.document_section, factors: newFactors } } } });
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div >
    );
};
