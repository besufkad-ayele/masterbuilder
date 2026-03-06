"use client";

import React, { useState } from "react";
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Video,
    FileText,
    Loader2,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    Check,
    Info,
    HelpCircle,
    X as XIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
    CompetencyLibrary,
    CompetencyDictionary,
    LibraryBehavioralIndicator,
    ReflectionQuestion,
    LearningResource,
    Company
} from "@/types";
import { competencyService } from "@/services/competencyService";
import { cn } from "@/lib/utils";
import { COMPETENCY_DOMAINS } from "@/constants/competency";

interface AdminCompetencyLibraryTabProps {
    data: CompetencyLibrary[];
    dictionary: CompetencyDictionary[];
    companies: Company[];
    onRefresh: () => void;
}

export default function AdminCompetencyLibraryTab({ data, dictionary, companies, onRefresh }: AdminCompetencyLibraryTabProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CompetencyLibrary | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedBIs, setExpandedBIs] = useState<Record<string, boolean>>({});

    const [formState, setFormState] = useState<Omit<CompetencyLibrary, "id" | "created_at" | "updated_at">>({
        company_id: "",
        competency_domain: COMPETENCY_DOMAINS[0],
        competency: {
            name: "",
            definition: "",
            current_level: "Basic",
            target_level: "Intermediate",
            level_descriptor: "",
            behavioral_indicators: []
        },
        dictionary_id: ""
    });

    const isDictionaryLinked = dictionary.some(d => d.name === formState.competency.name);

    const filteredData = data.filter(item =>
        item.competency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.competency_domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        companies.find(c => c.id === item.company_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleBI = (id: string) => {
        setExpandedBIs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreate = async () => {
        if (!formState.competency.name) return;
        setIsSaving(true);
        try {
            await competencyService.createLibraryItem(formState);
            onRefresh();
            setIsCreateOpen(false);
            resetForm();
        } catch (error) {
            console.error("Failed to create library item", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingItem) return;
        setIsSaving(true);
        try {
            await competencyService.updateLibraryItem(editingItem.id, formState);
            onRefresh();
            setIsEditOpen(false);
            resetForm();
        } catch (error) {
            console.error("Failed to update library item", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingItem) return;
        setIsSaving(true);
        try {
            await competencyService.deleteLibraryItem(editingItem.id);
            onRefresh();
            setIsDeleteOpen(false);
        } catch (error) {
            console.error("Failed to delete library item", error);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setFormState({
            company_id: "",
            competency_domain: COMPETENCY_DOMAINS[0],
            competency: {
                name: "",
                definition: "",
                current_level: "Basic",
                target_level: "Intermediate",
                level_descriptor: "",
                behavioral_indicators: []
            },
            dictionary_id: ""
        });
        setEditingItem(null);
    };

    const openEdit = (item: CompetencyLibrary) => {
        setEditingItem(item);
        setFormState({
            company_id: item.company_id || "",
            competency_domain: item.competency_domain,
            competency: item.competency,
            dictionary_id: item.dictionary_id
        });
        setIsEditOpen(true);
    };

    const addBI = () => {
        const newBI: LibraryBehavioralIndicator = {
            code: `BI${formState.competency.behavioral_indicators.length + 1}`,
            description: "",
            resources: {
                believe: { videos: [], articles: [], quiz: [] },
                know: { videos: [], articles: [], quiz: [] },
                do: { instruction: "", description: "", reflection_questions: [] }
            }
        };
        setFormState({
            ...formState,
            competency: {
                ...formState.competency,
                behavioral_indicators: [...formState.competency.behavioral_indicators, newBI]
            }
        });
    };

    const addResource = (biIdx: number, phase: 'believe' | 'know', type: 'videos' | 'articles') => {
        const newResource: LearningResource = {
            source: "",
            title: "",
            cover_pic_link: ""
        };
        const newBIs = [...formState.competency.behavioral_indicators];
        newBIs[biIdx].resources[phase][type].push(newResource);
        setFormState({
            ...formState,
            competency: { ...formState.competency, behavioral_indicators: newBIs }
        });
    };

    const addPhaseQuestion = (biIdx: number, phase: 'believe' | 'know') => {
        const newQuestion: ReflectionQuestion = {
            question: "",
            options: { A: "", B: "", C: "", D: "" },
            correct_answer: "A"
        };
        const newBIs = [...formState.competency.behavioral_indicators];
        if (!newBIs[biIdx].resources[phase].quiz) {
            newBIs[biIdx].resources[phase].quiz = [];
        }
        newBIs[biIdx].resources[phase].quiz.push(newQuestion);
        setFormState({
            ...formState,
            competency: { ...formState.competency, behavioral_indicators: newBIs }
        });
    };



    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search library..."
                        className="pl-10 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    onClick={() => { resetForm(); setIsCreateOpen(true); }}
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Library Module
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredData.map((item) => (
                    <Card key={item.id} className="border-border rounded-2xl overflow-hidden hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row h-full">
                            <div className="bg-[#C5A059]/10 p-6 flex flex-col items-center justify-center border-r border-border md:w-40 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] mb-2">Domain</span>
                                <span className="text-sm font-serif font-bold text-[#1B4332] mb-3">{item.competency_domain}</span>
                                <div className="mt-auto pt-4 border-t border-[#C5A059]/30 w-full">
                                    <span className="text-[9px] font-black uppercase text-[#C5A059] block mb-1">Company</span>
                                    <span className="text-[10px] font-bold text-[#1B4332] line-clamp-2">
                                        {companies.find(c => c.id === item.company_id)?.name || "All Companies"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold font-serif text-[#1B4332]">{item.competency.name}</h3>
                                            <div className="flex gap-4 mt-1">
                                                <span className="text-xs text-muted-foreground flex items-center">
                                                    <span className="h-2 w-2 rounded-full bg-blue-400 mr-2"></span>
                                                    Cur: {item.competency.current_level}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center">
                                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                                    Tar: {item.competency.target_level}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8" onClick={() => openEdit(item)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 hover:text-destructive" onClick={() => { setEditingItem(item); setIsDeleteOpen(true); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs italic text-muted-foreground mb-4 line-clamp-2">{item.competency.level_descriptor}</p>
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-border">
                                    <div className="flex items-center text-[10px] text-primary font-bold uppercase tracking-wider">
                                        <FileText className="w-3 h-3 mr-1" />
                                        {(item.competency.behavioral_indicators || (item.competency as any).behaviors || []).length} BIs
                                    </div>
                                    <div className="flex items-center text-[10px] text-primary font-bold uppercase tracking-wider">
                                        <Video className="w-3 h-3 mr-1" />
                                        {(item.competency.behavioral_indicators || (item.competency as any).behaviors || []).reduce((acc: number, bi: any) => acc + (bi.resources?.believe?.videos?.length || 0) + (bi.resources?.know?.videos?.length || 0), 0)} Videos
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setIsEditOpen(false); } }}>
                <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] overflow-y-auto rounded-3xl p-8 bg-white border-0 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-serif text-[#1B4332]">{isCreateOpen ? "Create Learning Module" : "Edit Learning Module"}</DialogTitle>
                        <DialogDescription className="text-muted-foreground">Attach rich learning resources and phase-level quizzes to behavioral indicators.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8 py-6">
                        <section className="bg-muted/10 p-8 rounded-[2.5rem] border border-border/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#C5A059] uppercase tracking-widest pl-1">Assign to Company</label>
                                <select
                                    className="w-full h-12 rounded-2xl bg-white border-2 border-border/50 focus:border-primary px-4 font-bold text-sm outline-none transition-all"
                                    value={formState.company_id}
                                    onChange={(e) => setFormState({ ...formState, company_id: e.target.value })}
                                >
                                    <option value="">Select a company (Internal Module)</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-muted-foreground italic pl-1">Linking this module to a specific company ensures it only appears for their fellows.</p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#C5A059] uppercase tracking-widest pl-1">Competency Domain</label>
                                <select
                                    className="w-full h-12 rounded-2xl bg-white border-2 border-border/50 focus:border-primary px-4 font-bold text-sm outline-none transition-all"
                                    value={formState.competency_domain}
                                    onChange={(e) => setFormState({ ...formState, competency_domain: e.target.value })}
                                >
                                    {COMPETENCY_DOMAINS.map(domain => (
                                        <option key={domain} value={domain}>{domain}</option>
                                    ))}
                                </select>
                            </div>
                        </section>

                        <section className={cn(
                            "bg-muted/30 p-6 rounded-2xl border border-border/50",
                            editingItem && isDictionaryLinked && "opacity-60 grayscale-[0.5] pointer-events-none"
                        )}>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs font-bold text-[#C5A059] uppercase tracking-widest">
                                    1. Connect to Dictionary
                                </label>
                                {editingItem && isDictionaryLinked && (
                                    <span className="text-[10px] font-black text-primary flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
                                        <Info className="w-3 h-3" /> Linkage Locked During Update
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {dictionary.map(dictItem => (
                                    <div
                                        key={dictItem.id}
                                        className={cn(
                                            "p-3 rounded-xl border-2 transition-all flex flex-col gap-3 group relative",
                                            formState.competency.name === dictItem.name
                                                ? "border-primary bg-primary/[0.02]"
                                                : "border-border bg-white hover:border-primary/30"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-[#1B4332] uppercase truncate">{dictItem.name}</span>
                                            <span className="text-[9px] text-muted-foreground line-clamp-1 italic">{dictItem.definition}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1.5">
                                            {(dictItem.proficiency_levels || []).map(pLevel => {
                                                if (!pLevel) return null;
                                                const isSelectedLevel = formState.competency.name === dictItem.name && formState.competency.target_level === pLevel.level;
                                                return (
                                                    <button
                                                        key={pLevel.level}
                                                        type="button"
                                                        onClick={() => {
                                                            const levelBIs = (pLevel.behavioral_indicators || (pLevel as any).behaviors || []).map((bi: any) => ({
                                                                code: bi.code,
                                                                description: bi.description,
                                                                resources: {
                                                                    believe: { videos: [], articles: [], quiz: [] },
                                                                    know: { videos: [], articles: [], quiz: [] },
                                                                    do: { instruction: "", description: "", reflection_questions: [] }
                                                                }
                                                            }));

                                                            setFormState({
                                                                ...formState,
                                                                dictionary_id: dictItem.id,
                                                                competency: {
                                                                    ...formState.competency,
                                                                    name: dictItem.name,
                                                                    definition: dictItem.definition,
                                                                    target_level: pLevel.level,
                                                                    level_descriptor: pLevel.name,
                                                                    behavioral_indicators: levelBIs
                                                                }
                                                            });
                                                        }}
                                                        className={cn(
                                                            "px-2 py-1.5 rounded-lg text-[9px] font-black transition-all border flex items-center justify-center gap-1",
                                                            isSelectedLevel
                                                                ? "bg-primary text-white border-primary shadow-lg scale-105"
                                                                : "bg-white text-muted-foreground border-border group-hover:bg-primary/5 hover:border-primary/50"
                                                        )}
                                                    >
                                                        {isSelectedLevel && <Check className="w-2.5 h-2.5" />}
                                                        {pLevel.level}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2 lg:col-span-2">
                                <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center justify-between">
                                    <span>Main Title / Competency Name</span>
                                    {isDictionaryLinked && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black flex items-center gap-1"><Check className="w-3 h-3" /> Mapped to Dictionary</span>}
                                </label>
                                <Input
                                    placeholder="Select from dictionary above"
                                    value={formState.competency.name}
                                    readOnly={isDictionaryLinked}
                                    onChange={(e) => setFormState({ ...formState, competency: { ...formState.competency, name: e.target.value } })}
                                    className={cn("h-11 rounded-xl font-black text-lg", isDictionaryLinked && "bg-muted/50 focus-visible:ring-0")}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary uppercase tracking-wider">Current / Target Proficiency</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        value={formState.competency.current_level}
                                        placeholder="Current"
                                        onChange={(e) => setFormState({ ...formState, competency: { ...formState.competency, current_level: e.target.value } })}
                                        className="rounded-xl h-11"
                                    />
                                    <Input
                                        value={formState.competency.target_level}
                                        placeholder="Target"
                                        readOnly={isDictionaryLinked}
                                        onChange={(e) => setFormState({ ...formState, competency: { ...formState.competency, target_level: e.target.value } })}
                                        className={cn("rounded-xl h-11", isDictionaryLinked && "bg-muted cursor-not-allowed")}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <label className="text-xs font-bold text-primary uppercase tracking-wider">Mastery Descriptor (Short Bio)</label>
                                <Input
                                    placeholder="Briefly describe what mastery looks like at this level..."
                                    value={formState.competency.level_descriptor}
                                    onChange={(e) => setFormState({ ...formState, competency: { ...formState.competency, level_descriptor: e.target.value } })}
                                    className="rounded-xl h-11"
                                />
                            </div>
                        </section>

                        <section className="space-y-6 pt-10 border-t">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-serif font-black text-[#1B4332]">Execution & Indicators</h3>
                                {!isDictionaryLinked && (
                                    <Button onClick={addBI} variant="outline" size="sm" className="rounded-xl border-primary text-primary hover:bg-primary/10">
                                        <Plus className="w-4 h-4 mr-2" /> New Indicator
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-6">
                                {(formState.competency.behavioral_indicators || (formState.competency as any).behaviors || []).map((bi: any, biIdx: number) => (
                                    <div key={biIdx} className="border-2 border-border/60 rounded-[2rem] overflow-hidden bg-white shadow-xl hover:border-primary/30 transition-all">
                                        <div
                                            className={cn(
                                                "p-5 flex items-center justify-between cursor-pointer transition-colors",
                                                expandedBIs[`bi-${biIdx}`] ? "bg-primary/[0.03] border-b" : "bg-white"
                                            )}
                                            onClick={() => toggleBI(`bi-${biIdx}`)}
                                        >
                                            <div className="flex items-center gap-5 flex-1 pr-4">
                                                <div className="min-w-[60px] h-10 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center text-xs font-black shadow-lg">
                                                    {bi.code}
                                                </div>
                                                <div className="flex-1">
                                                    <Input
                                                        value={bi.description}
                                                        onClick={(e) => e.stopPropagation()}
                                                        readOnly={isDictionaryLinked}
                                                        onChange={(e) => {
                                                            const newBIs = [...formState.competency.behavioral_indicators];
                                                            newBIs[biIdx].description = e.target.value;
                                                            setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                        }}
                                                        placeholder="Add behavioral description..."
                                                        className={cn("bg-transparent border-none focus-visible:ring-0 font-bold text-lg p-0 h-auto", isDictionaryLinked && "cursor-not-allowed")}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {!isDictionaryLinked && (
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newBIs = [...formState.competency.behavioral_indicators];
                                                        newBIs.splice(biIdx, 1);
                                                        setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                    }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <div className="h-9 w-9 rounded-xl border border-border flex items-center justify-center bg-white shadow-sm">
                                                    {expandedBIs[`bi-${biIdx}`] ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                                                </div>
                                            </div>
                                        </div>

                                        {expandedBIs[`bi-${biIdx}`] && (
                                            <div className="p-8 space-y-12 bg-white animate-in fade-in slide-in-from-top-4 duration-500">
                                                {(['believe', 'know'] as const).map((phase) => (
                                                    <div key={phase} className="space-y-6 p-8 rounded-[2.5rem] bg-[#FDFCF6] border-2 border-dashed border-[#C5A059]/30 relative">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("w-3 h-3 rounded-full animate-pulse", phase === 'believe' ? 'bg-blue-400' : 'bg-purple-400')}></div>
                                                                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#C5A059]">Phase: {phase}</h4>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between pb-2 border-b">
                                                                    <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                                                        <Video className="w-4 h-4 text-primary" /> Multi-Media Resources (Videos)
                                                                    </label>
                                                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black text-primary hover:bg-primary/5 rounded-lg" onClick={() => addResource(biIdx, phase, 'videos')}>+ Add Video</Button>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {bi.resources[phase].videos.map((res: any, resIdx: number) => (
                                                                        <div key={resIdx} className="bg-white p-4 rounded-2xl border border-border shadow-sm flex items-center gap-3 group/item">
                                                                            <Input
                                                                                placeholder="Paste YouTube/Vimeo URL here..."
                                                                                value={res.source || ""}
                                                                                onChange={(e) => {
                                                                                    const newBIs = [...formState.competency.behavioral_indicators];
                                                                                    newBIs[biIdx].resources[phase].videos[resIdx].source = e.target.value;
                                                                                    setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                                }}
                                                                                className="h-10 text-xs rounded-xl focus:ring-1 focus:ring-primary/20"
                                                                            />
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover/item:opacity-100 transition-opacity" onClick={() => {
                                                                                const newBIs = [...formState.competency.behavioral_indicators];
                                                                                newBIs[biIdx].resources[phase].videos.splice(resIdx, 1);
                                                                                setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                            }}>
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between pb-2 border-b">
                                                                    <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                                                        <FileText className="w-4 h-4 text-primary" /> Curated Reading (Articles)
                                                                    </label>
                                                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black text-primary hover:bg-primary/5 rounded-lg" onClick={() => addResource(biIdx, phase, 'articles')}>+ Add Article</Button>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {bi.resources[phase].articles.map((res: any, resIdx: number) => (
                                                                        <div key={resIdx} className="bg-white p-5 rounded-2xl border border-border shadow-sm space-y-3 group/art">
                                                                            <div className="flex gap-3">
                                                                                <Input
                                                                                    placeholder="Article Title..."
                                                                                    value={res.title || ""}
                                                                                    onChange={(e) => {
                                                                                        const newBIs = [...formState.competency.behavioral_indicators];
                                                                                        newBIs[biIdx].resources[phase].articles[resIdx].title = e.target.value;
                                                                                        setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                                    }}
                                                                                    className="h-9 text-xs font-bold rounded-xl"
                                                                                />
                                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover/art:opacity-100 transition-opacity" onClick={() => {
                                                                                    const newBIs = [...formState.competency.behavioral_indicators];
                                                                                    newBIs[biIdx].resources[phase].articles.splice(resIdx, 1);
                                                                                    setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                                }}>
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                            <Input
                                                                                placeholder="Article URL/Link..."
                                                                                value={res.source || ""}
                                                                                onChange={(e) => {
                                                                                    const newBIs = [...formState.competency.behavioral_indicators];
                                                                                    newBIs[biIdx].resources[phase].articles[resIdx].source = e.target.value;
                                                                                    setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                                }}
                                                                                className="h-8 text-[10px] rounded-lg"
                                                                            />
                                                                            <div className="flex items-center gap-2">
                                                                                <ImageIcon className="w-3 h-3 text-muted-foreground" />
                                                                                <Input
                                                                                    placeholder="Cover Image URL (Optional)"
                                                                                    value={res.cover_pic_link || ""}
                                                                                    onChange={(e) => {
                                                                                        const newBIs = [...formState.competency.behavioral_indicators];
                                                                                        newBIs[biIdx].resources[phase].articles[resIdx].cover_pic_link = e.target.value;
                                                                                        setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                                    }}
                                                                                    className="h-7 text-[10px] border-dashed rounded-lg"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-8 pt-6 border-t border-[#C5A059]/20 space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                                                        <HelpCircle className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="text-sm font-black text-[#1B4332] uppercase tracking-wider">Phase Verification Quiz</h5>
                                                                        <p className="text-[10px] text-muted-foreground font-bold italic">Verify understanding before unlocking the next stage.</p>
                                                                    </div>
                                                                </div>
                                                                <Button size="sm" variant="outline" className="h-8 text-[10px] font-black bg-white rounded-xl border-primary text-primary hover:bg-primary/5 shadow-sm" onClick={() => addPhaseQuestion(biIdx, phase)}>
                                                                    + Add Quiz Question
                                                                </Button>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {bi.resources[phase].quiz?.map((q: any, qIdx: number) => (
                                                                    <div key={qIdx} className="bg-white p-6 rounded-[2rem] border-2 border-border shadow-md space-y-4 relative group/q">
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 absolute -right-2 -top-2 bg-white shadow-lg border-2 border-destructive/20 text-destructive rounded-full" onClick={() => {
                                                                            const newBIs = [...formState.competency.behavioral_indicators];
                                                                            newBIs[biIdx].resources[phase].quiz.splice(qIdx, 1);
                                                                            setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                        }}>
                                                                            <XIcon className="h-3 w-3" />
                                                                        </Button>

                                                                        <div className="space-y-3">
                                                                            <h6 className="text-[10px] font-black text-primary uppercase flex items-center gap-2">
                                                                                <span className="w-5 h-5 rounded-lg bg-primary text-white flex items-center justify-center">Q</span>
                                                                                Question {qIdx + 1}
                                                                            </h6>
                                                                            <Input
                                                                                placeholder="Enter your question here..."
                                                                                value={q.question}
                                                                                onChange={(e) => {
                                                                                    const newBIs = [...formState.competency.behavioral_indicators];
                                                                                    newBIs[biIdx].resources[phase].quiz[qIdx].question = e.target.value;
                                                                                    setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                                }}
                                                                                className="h-10 text-xs font-bold rounded-xl border-2"
                                                                            />
                                                                        </div>

                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                                                                <div key={opt} className="space-y-1">
                                                                                    <label className="text-[9px] font-black text-muted-foreground ml-1 uppercase">Option {opt}</label>
                                                                                    <Input
                                                                                        value={q.options[opt]}
                                                                                        onChange={(e) => {
                                                                                            const newBIs = [...formState.competency.behavioral_indicators];
                                                                                            newBIs[biIdx].resources[phase].quiz[qIdx].options[opt] = e.target.value;
                                                                                            setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                                        }}
                                                                                        className="h-8 text-[10px] rounded-lg border focus:ring-1 focus:ring-primary/10"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        <div className="flex items-center justify-between pt-2">
                                                                            <span className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                                                                                <Check className="w-3 h-3 text-green-600" /> Correct Answer Target
                                                                            </span>
                                                                            <select
                                                                                value={q.correct_answer}
                                                                                onChange={(e) => {
                                                                                    const newBIs = [...formState.competency.behavioral_indicators];
                                                                                    newBIs[biIdx].resources[phase].quiz[qIdx].correct_answer = e.target.value;
                                                                                    setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                                }}
                                                                                className="text-xs border-2 rounded-xl h-8 px-3 font-bold bg-muted/30 focus:border-primary outline-none"
                                                                            >
                                                                                <option value="A">Choice A</option>
                                                                                <option value="B">Choice B</option>
                                                                                <option value="C">Choice C</option>
                                                                                <option value="D">Choice D</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className="space-y-6 p-10 rounded-[3rem] border-2 border-dashed border-green-200 bg-green-50/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-full bg-green-600 shadow-[0_0_15px_rgba(22,163,74,0.4)]"></div>
                                                        <h4 className="text-lg font-serif font-black uppercase tracking-[0.2em] text-green-700">Phase: Do (Practical Mastery)</h4>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-3">
                                                            <label className="text-xs font-black text-green-800 uppercase tracking-widest flex items-center gap-2">
                                                                <FileText className="w-4 h-4" /> Activity Instructions
                                                            </label>
                                                            <Textarea
                                                                placeholder="Step-by-step guidance on how to perform this behavior..."
                                                                value={bi.resources.do.instruction}
                                                                onChange={(e) => {
                                                                    const newBIs = [...formState.competency.behavioral_indicators];
                                                                    newBIs[biIdx].resources.do.instruction = e.target.value;
                                                                    setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                }}
                                                                className="min-h-[140px] text-sm rounded-2xl border-2 focus:ring-green-100 focus:border-green-600 outline-none p-5"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <label className="text-xs font-black text-green-800 uppercase tracking-widest flex items-center gap-2">
                                                                <Edit className="w-4 h-4" /> Final Achievement Outcome
                                                            </label>
                                                            <Textarea
                                                                placeholder="Exactly what evidence or result is required to pass..."
                                                                value={bi.resources.do.description}
                                                                onChange={(e) => {
                                                                    const newBIs = [...formState.competency.behavioral_indicators];
                                                                    newBIs[biIdx].resources.do.description = e.target.value;
                                                                    setFormState({ ...formState, competency: { ...formState.competency, behavioral_indicators: newBIs } });
                                                                }}
                                                                className="min-h-[140px] text-sm rounded-2xl border-2 focus:ring-green-100 focus:border-green-600 outline-none p-5"
                                                            />
                                                        </div>
                                                    </div>


                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <DialogFooter className="sticky bottom-0 bg-white pt-6 border-t gap-3 p-2 -mx-2 bg-gradient-to-t from-white to-white/95">
                        <Button variant="ghost" className="rounded-2xl px-8 font-black text-muted-foreground h-12" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
                            Discard Changes
                        </Button>
                        <Button
                            className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white rounded-2xl h-12 px-12 font-black shadow-xl shadow-primary/20 min-w-[240px] transition-all hover:scale-[1.02]"
                            onClick={isCreateOpen ? handleCreate : handleUpdate}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            {isCreateOpen ? "Live: Deploy New Module" : "Sync: Update Learning System"}
                        </Button>
                    </DialogFooter>
                </DialogContent >
            </Dialog >

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="rounded-3xl p-10 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-serif text-destructive">Termination Protocol</DialogTitle>
                        <DialogDescription className="text-lg">
                            This will PERMANENTLY delete the training module for <span className="font-black text-foreground underline decoration-destructive/30 decoration-wavy">"{editingItem?.competency.name}"</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-sm text-muted-foreground italic bg-destructive/5 p-4 rounded-xl border border-destructive/10">
                        This action cannot be undone. All resources, video links, and quizzes will be lost.
                    </div>
                    <DialogFooter className="mt-8 flex gap-3">
                        <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsDeleteOpen(false)}>Abort Delete</Button>
                        <Button variant="destructive" className="rounded-2xl font-black h-12 px-8 shadow-lg shadow-destructive/20" onClick={handleDelete} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Deletion"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
