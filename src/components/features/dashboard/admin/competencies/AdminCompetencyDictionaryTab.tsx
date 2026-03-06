"use client";

import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Edit,
    Trash2,
    Search,
    ChevronRight,
    GraduationCap,
    Info,
    Loader2
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetencyDictionary, DictionaryProficiencyLevel } from "@/types";
import { competencyService } from "@/services/competencyService";
import { cn } from "@/lib/utils";

interface AdminCompetencyDictionaryTabProps {
    data: CompetencyDictionary[];
    onRefresh: () => void;
}

export default function AdminCompetencyDictionaryTab({ data, onRefresh }: AdminCompetencyDictionaryTabProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CompetencyDictionary | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formState, setFormState] = useState<{
        code: string;
        name: string;
        definition: string;
        importance: string;
        proficiency_levels: DictionaryProficiencyLevel[];
    }>({
        code: "",
        name: "",
        definition: "",
        importance: "",
        proficiency_levels: [
            { level: 'Basic', name: "", behavioral_indicators: [] },
            { level: 'Intermediate', name: "", behavioral_indicators: [] },
            { level: 'Advanced', name: "", behavioral_indicators: [] },
            { level: 'Expert', name: "", behavioral_indicators: [] },
        ]
    });

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = async () => {
        if (!formState.name) return;
        setIsSaving(true);
        try {
            await competencyService.createDictionaryItem(formState);
            onRefresh();
            setIsCreateOpen(false);
            resetForm();
        } catch (error) {
            console.error("Failed to create competency", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingItem) return;
        setIsSaving(true);
        try {
            await competencyService.updateDictionaryItem(editingItem.id, formState);
            onRefresh();
            setIsEditOpen(false);
            resetForm();
        } catch (error) {
            console.error("Failed to update competency", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingItem) return;
        setIsSaving(true);
        try {
            await competencyService.deleteDictionaryItem(editingItem.id);
            onRefresh();
            setIsDeleteOpen(false);
        } catch (error) {
            console.error("Failed to delete competency", error);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setFormState({
            code: "",
            name: "",
            definition: "",
            importance: "",
            proficiency_levels: [
                { level: 'Basic', name: "", behavioral_indicators: [] },
                { level: 'Intermediate', name: "", behavioral_indicators: [] },
                { level: 'Advanced', name: "", behavioral_indicators: [] },
                { level: 'Expert', name: "", behavioral_indicators: [] },
            ]
        });
        setEditingItem(null);
    };

    const openEdit = (item: CompetencyDictionary) => {
        setEditingItem(item);
        setFormState({
            code: item.code || "",
            name: item.name,
            definition: item.definition,
            importance: item.importance,
            proficiency_levels: item.proficiency_levels
        });
        setIsEditOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search competencies..."
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
                    Add Competency
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.map((item) => (
                    <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 border-border overflow-hidden rounded-2xl">
                        <CardHeader className="bg-[#1B4332]/5 p-6 border-b border-[#1B4332]/10">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                                    <GraduationCap className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(item)}>
                                        <Edit className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive" onClick={() => { setEditingItem(item); setIsDeleteOpen(true); }}>
                                        <Trash2 className="h-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardTitle className="text-xl font-bold font-serif text-[#1B4332] uppercase tracking-wide">
                                {item.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <p className="text-sm text-balance line-clamp-3 text-muted-foreground italic">
                                {item.definition}
                            </p>

                            <div className="space-y-2">
                                <div className="flex items-center text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">
                                    <Info className="w-3 h-3 mr-1" />
                                    Importance
                                </div>
                                <p className="text-xs line-clamp-2">{item.importance}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dashed">
                                {(item.proficiency_levels || []).map((level) => level && (
                                    <div key={level.level} className="px-2 py-1 rounded bg-secondary/50 text-[10px] font-medium border border-border">
                                        {level.level}: {(level.behavioral_indicators || (level as any).behaviors || []).length} BIs
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setIsEditOpen(false); } }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">{isCreateOpen ? "Create New Competency" : "Edit Competency"}</DialogTitle>
                        <DialogDescription>Define the core details and proficiency levels for this competency.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">Competency Name</label>
                                <Input
                                    placeholder="e.g. C1 - EMOTIONAL INTELLIGENCE"
                                    value={formState.name}
                                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                    className="rounded-xl border-[#E8E4D8]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">Definition</label>
                                <Textarea
                                    placeholder="The ability to recognize and manage emotions..."
                                    value={formState.definition}
                                    onChange={(e) => setFormState({ ...formState, definition: e.target.value })}
                                    className="rounded-xl border-[#E8E4D8] min-h-[100px]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">Importance</label>
                            <Textarea
                                placeholder="Why is this competency important for leadership?"
                                value={formState.importance}
                                onChange={(e) => setFormState({ ...formState, importance: e.target.value })}
                                className="rounded-xl border-[#E8E4D8]"
                            />
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-serif font-bold text-primary border-b pb-2">Proficiency Levels & Behavioral Indicators</h3>

                            <div className="space-y-8">
                                {formState.proficiency_levels.map((level, levelIdx) => (
                                    <div key={level.level} className="bg-muted/30 p-6 rounded-2xl border border-border space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                                                {level.level} Level
                                            </span>
                                            <Input
                                                placeholder="Level Title (e.g. Emotional Awareness)"
                                                className="max-w-[300px] h-8 rounded-lg bg-white"
                                                value={level.name}
                                                onChange={(e) => {
                                                    const newLevels = [...formState.proficiency_levels];
                                                    newLevels[levelIdx].name = e.target.value;
                                                    setFormState({ ...formState, proficiency_levels: newLevels });
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
                                                <span>Behavioral Indicators</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-primary hover:text-primary/80"
                                                    onClick={() => {
                                                        const newLevels = [...formState.proficiency_levels];
                                                        const currentLevel = newLevels[levelIdx];
                                                        const bis = currentLevel.behavioral_indicators || (currentLevel as any).behaviors || [];
                                                        currentLevel.behavioral_indicators = [...bis, { id: crypto.randomUUID(), code: `BI${bis.length + 1}`, description: "" }];
                                                        setFormState({ ...formState, proficiency_levels: newLevels });
                                                    }}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Add BI
                                                </Button>
                                            </div>

                                            {(level.behavioral_indicators || (level as any).behaviors || []).map((bi: any, biIdx: number) => (
                                                <div key={biIdx} className="flex gap-2 items-start group">
                                                    <div className="flex-none w-16">
                                                        <Input
                                                            value={bi.code}
                                                            onChange={(e) => {
                                                                const newLevels = [...formState.proficiency_levels];
                                                                const bis = newLevels[levelIdx].behavioral_indicators || (newLevels[levelIdx] as any).behaviors || [];
                                                                newLevels[levelIdx].behavioral_indicators = bis;
                                                                newLevels[levelIdx].behavioral_indicators[biIdx].code = e.target.value;
                                                                setFormState({ ...formState, proficiency_levels: newLevels });
                                                            }}
                                                            className="h-8 text-[10px] font-bold text-center uppercase p-1 rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Textarea
                                                            value={bi.description}
                                                            onChange={(e) => {
                                                                const newLevels = [...formState.proficiency_levels];
                                                                const bis = newLevels[levelIdx].behavioral_indicators || (newLevels[levelIdx] as any).behaviors || [];
                                                                newLevels[levelIdx].behavioral_indicators = bis;
                                                                newLevels[levelIdx].behavioral_indicators[biIdx].description = e.target.value;
                                                                setFormState({ ...formState, proficiency_levels: newLevels });
                                                            }}
                                                            placeholder="Describe the behavior..."
                                                            className="min-h-[60px] text-xs rounded-xl p-3 resize-none"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground/30 hover:text-destructive group-hover:opacity-100 opacity-0 transition-opacity"
                                                        onClick={() => {
                                                            const newLevels = [...formState.proficiency_levels];
                                                            const bis = newLevels[levelIdx].behavioral_indicators || (newLevels[levelIdx] as any).behaviors || [];
                                                            newLevels[levelIdx].behavioral_indicators = [...bis];
                                                            newLevels[levelIdx].behavioral_indicators.splice(biIdx, 1);
                                                            setFormState({ ...formState, proficiency_levels: newLevels });
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-white rounded-xl min-w-[120px]"
                            onClick={isCreateOpen ? handleCreate : handleUpdate}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isCreateOpen ? "Create" : "Save Changes")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Delete Competency</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-bold text-foreground">"{editingItem?.name}"</span>?
                            This action cannot be undone and will remove all associated behavioral indicators.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            className="rounded-xl min-w-[120px]"
                            onClick={handleDelete}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Forever"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
