"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Dialog, DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, BookOpen, Users, Trash2, ArrowRight, Loader2, Clock, Lock, Unlock, Brain, BookOpenCheck, Wrench } from "lucide-react";
import { CohortService } from "@/services/CohortService";
import { FellowService } from "@/services/FellowService";
import { competencyService } from "@/services/competencyService";
import { groundingService } from "@/services/groundingService";
import { Cohort, CompetencyLibrary, FellowProfile } from "@/types";
import { cn } from "@/lib/utils";

type PhaseState = 'active' | 'locked';

interface WaveConfig {
    number: number;
    name: string;
    competencyIds: string[];
    activeCompetencyIds: string[];
    status: 'active' | 'upcoming';
    phaseStates: {
        believe: PhaseState;
        know: PhaseState;
        do: PhaseState;
    };
}

interface CohortEditFormProps {
    cohort: Cohort;
    onClose: () => void;
    onSaved: () => void;
}

const defaultPhaseStates = () => ({ believe: 'locked' as PhaseState, know: 'locked' as PhaseState, do: 'locked' as PhaseState });

export default function CohortEditForm({ cohort, onClose, onSaved }: CohortEditFormProps) {
    const [formData, setFormData] = useState({
        name: cohort.name,
        startDate: cohort.start_date ?? "",
        endDate: cohort.end_date ?? "",
        durationMonths: cohort.duration_months ? String(cohort.duration_months) : "",
        level: cohort.wave_level ?? "Basic",
        status: cohort.status ?? "upcoming",
        enrollmentMode: cohort.enrollment_mode ?? "invite_only",
        fellowIds: [] as string[],
        waves: [] as WaveConfig[],
        groundingModuleId: cohort.grounding_module_id ?? "",
        isGroundingActive: cohort.is_grounding_active ?? false,
    });

    const [availableCompetencies, setAvailableCompetencies] = useState<CompetencyLibrary[]>([]);
    const [allFellows, setAllFellows] = useState<FellowProfile[]>([]);
    const [availableGroundingModules, setAvailableGroundingModules] = useState<any[]>([]);
    const [activeWaveIndex, setActiveWaveIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'curriculum' | 'grounding'>('curriculum');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // ─── Initial data load ────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [waves, fellows, libModules, groundingModules] = await Promise.all([
                    CohortService.getWavesByCohort(cohort.id),
                    FellowService.getAllFellows(cohort.company_id),
                    competencyService.getLibraryByCompany(cohort.company_id),
                    groundingService.getModules()
                ]);

                const waveConfigs: WaveConfig[] = await Promise.all(
                    waves
                        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
                        .map(async (wave) => {
                            const wcs = await CohortService.getWaveCompetencies(wave.id);
                            const savedPhase = (wave as any).phase_states;
                            return {
                                number: wave.number ?? 1,
                                name: wave.name ?? `Wave ${wave.number}`,
                                competencyIds: wcs.map(wc => wc.competency_id),
                                activeCompetencyIds: wcs.filter(wc => (wc as any).is_active).map(wc => wc.competency_id),
                                status: (wave.status === 'active' ? 'active' : 'upcoming') as 'active' | 'upcoming',
                                phaseStates: savedPhase ?? defaultPhaseStates(),
                            };
                        })
                );

                const enrolledFellowIds = fellows
                    .filter(f => f.cohort_id === cohort.id)
                    .map(f => f.id);

                setAvailableCompetencies(libModules);
                setAllFellows(fellows);
                setAvailableGroundingModules(groundingModules);
                setFormData(prev => ({
                    ...prev,
                    waves: waveConfigs.length > 0
                        ? waveConfigs
                        : [{ number: 1, name: "Wave 1: Launch", competencyIds: [], activeCompetencyIds: [], status: 'upcoming', phaseStates: defaultPhaseStates() }],
                    fellowIds: enrolledFellowIds,
                }));
            } catch (err) {
                console.error("CohortEditForm load error:", err);
                setError("Failed to load cohort data.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [cohort.id, cohort.company_id]);

    const displayFellows = useMemo(
        () => allFellows.filter(f => !f.cohort_id || f.cohort_id === cohort.id),
        [allFellows, cohort.id]
    );

    // ─── Wave helpers ────────────────────────────────────────────────────────
    const addWave = () => {
        setFormData(prev => ({
            ...prev,
            waves: [...prev.waves, {
                number: prev.waves.length + 1,
                name: `Wave ${prev.waves.length + 1}`,
                competencyIds: [],
                activeCompetencyIds: [],
                status: 'upcoming',
                phaseStates: defaultPhaseStates(),
            }],
        }));
        setActiveWaveIndex(formData.waves.length);
    };

    const removeWave = (index: number) => {
        if (formData.waves.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            waves: prev.waves.filter((_, i) => i !== index).map((w, i) => ({ ...w, number: i + 1 })),
        }));
        if (activeWaveIndex >= index) setActiveWaveIndex(Math.max(0, activeWaveIndex - 1));
    };

    const updateWave = (index: number, updates: Partial<WaveConfig>) => {
        setFormData(prev => ({
            ...prev,
            waves: prev.waves.map((w, i) => i === index ? { ...w, ...updates } : w),
        }));
    };

    const togglePhase = (waveIndex: number, phase: 'believe' | 'know' | 'do') => {
        const wave = formData.waves[waveIndex];
        const current = wave.phaseStates[phase];
        updateWave(waveIndex, {
            phaseStates: {
                ...wave.phaseStates,
                [phase]: current === 'active' ? 'locked' : 'active',
            }
        });
    };

    const toggleCompetencyInWave = (index: number, compId: string) => {
        const currentWave = formData.waves[index];
        const newIds = currentWave.competencyIds.includes(compId)
            ? currentWave.competencyIds.filter(id => id !== compId)
            : [...currentWave.competencyIds, compId];
        const newActive = currentWave.activeCompetencyIds.filter(id => newIds.includes(id));
        updateWave(index, { competencyIds: newIds, activeCompetencyIds: newActive });
    };

    const toggleCompetencyActive = (index: number, compId: string) => {
        const currentWave = formData.waves[index];
        if (!currentWave.competencyIds.includes(compId)) return;
        const newActive = currentWave.activeCompetencyIds.includes(compId)
            ? currentWave.activeCompetencyIds.filter(id => id !== compId)
            : [...currentWave.activeCompetencyIds, compId];
        updateWave(index, { activeCompetencyIds: newActive });
    };

    const toggleFellow = (id: string) => {
        setFormData(prev => ({
            ...prev,
            fellowIds: prev.fellowIds.includes(id)
                ? prev.fellowIds.filter(fId => fId !== id)
                : [...prev.fellowIds, id],
        }));
    };

    const toggleAllFellows = () => {
        if (formData.fellowIds.length === displayFellows.length) {
            setFormData(prev => ({ ...prev, fellowIds: [] }));
        } else {
            setFormData(prev => ({ ...prev, fellowIds: displayFellows.map(f => f.id) }));
        }
    };

    // ─── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.name.trim()) { setError("Cohort name is required."); return; }
        setIsSubmitting(true);
        setError("");
        try {
            const originalEnrolled = allFellows
                .filter(f => f.cohort_id === cohort.id)
                .map(f => f.id);
            const fellowIdsToAdd = formData.fellowIds.filter(id => !originalEnrolled.includes(id));
            const fellowIdsToRemove = originalEnrolled.filter(id => !formData.fellowIds.includes(id));

            const cohortPayload: Record<string, unknown> = {
                name: formData.name.trim(),
                wave_level: formData.level,
                status: formData.status,
                enrollment_mode: formData.enrollmentMode,
            };
            if (formData.startDate) cohortPayload.start_date = formData.startDate;
            if (formData.endDate) cohortPayload.end_date = formData.endDate;
            if (formData.durationMonths) cohortPayload.duration_months = Number(formData.durationMonths);
            if (formData.fellowIds.length > 0) cohortPayload.capacity = formData.fellowIds.length;

            // Perform update
            await CohortService.updateCohortWithWaves({
                cohortId: cohort.id,
                cohort: cohortPayload as Partial<Cohort>,
                waves: formData.waves,
                fellowIdsToAdd,
                fellowIdsToRemove,
                groundingModuleId: formData.groundingModuleId,
                isGroundingActive: formData.isGroundingActive,
            });
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message ?? "Failed to save changes.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    const activeWave = formData.waves[activeWaveIndex] ?? formData.waves[0];

    const phaseConfig: { key: 'believe' | 'know' | 'do'; label: string; icon: React.ReactNode; color: string }[] = [
        { key: 'believe', label: 'Believe', icon: <Brain className="size-3.5" />, color: 'amber' },
        { key: 'know', label: 'Know', icon: <BookOpenCheck className="size-3.5" />, color: 'blue' },
        { key: 'do', label: 'Do', icon: <Wrench className="size-3.5" />, color: 'emerald' },
    ];

    return (
        <Dialog open onOpenChange={() => !isSubmitting && onClose()}>
            <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-stone-50 border-none shadow-2xl p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[700px]">
                        <div className="flex flex-col items-center gap-4 text-stone-400">
                            <Loader2 className="size-10 animate-spin text-primary" />
                            <p className="font-serif italic text-sm">Loading cohort data…</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full min-h-[700px]">

                        {/* ── Sidebar ── */}
                        <div className="w-1/4 bg-stone-100/50 border-r border-stone-200 p-8 space-y-8 flex flex-col">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-stone-800">Edit Cohort</h2>
                                <p className="text-stone-500 text-sm mt-1 italic font-serif">Modify organizational learning track</p>
                            </div>

                            <div className="space-y-6 flex-1">
                                {/* Company (read-only) */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Partner Organization</Label>
                                    <div className="h-12 rounded-2xl bg-white border border-stone-200 shadow-sm px-4 flex items-center text-sm text-stone-500 font-medium">
                                        {cohort.company_id}
                                    </div>
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Cohort Identity</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. 2026 Strategy Group"
                                        className="h-12 rounded-2xl bg-white border-stone-200 shadow-sm"
                                    />
                                </div>

                                {/* Level + Fellows count */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Level</Label>
                                        <Select value={formData.level} onValueChange={v => setFormData(f => ({ ...f, level: v }))}>
                                            <SelectTrigger className="rounded-xl bg-white border-stone-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Basic">Basic</SelectItem>
                                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                <SelectItem value="Advanced">Advanced</SelectItem>
                                                <SelectItem value="Expert">Expert</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Fellows</Label>
                                        <div className="h-10 flex items-center justify-center font-bold bg-white rounded-xl border border-stone-200 text-primary">
                                            {formData.fellowIds.length}
                                        </div>
                                    </div>
                                </div>

                                {/* Status + Enrollment */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Status</Label>
                                        <Select value={formData.status} onValueChange={v => setFormData(f => ({ ...f, status: v as any }))}>
                                            <SelectTrigger className="rounded-xl bg-white border-stone-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Enrollment</Label>
                                        <Select value={formData.enrollmentMode} onValueChange={v => setFormData(f => ({ ...f, enrollmentMode: v as any }))}>
                                            <SelectTrigger className="rounded-xl bg-white border-stone-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="invite_only">Invite Only</SelectItem>
                                                <SelectItem value="open">Open</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Duration in months */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] flex items-center gap-1.5">
                                        <Clock className="size-3" />
                                        Duration (Months)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={formData.durationMonths}
                                            onChange={e => setFormData(f => ({ ...f, durationMonths: e.target.value }))}
                                            placeholder="e.g. 6"
                                            className="h-12 rounded-2xl bg-white border-stone-200 shadow-sm pr-14"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-semibold">mo.</span>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Start Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))}
                                            className="rounded-xl bg-white border-stone-200 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">End Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))}
                                            className="rounded-xl bg-white border-stone-200 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Waves list */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Learning Waves</Label>
                                    <div className="space-y-2">
                                        {formData.waves.map((wave, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setActiveWaveIndex(idx)}
                                                className={cn(
                                                    "group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border",
                                                    activeWaveIndex === idx
                                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                                        : "bg-white border-stone-200 hover:border-primary/30"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("size-6 rounded-full flex items-center justify-center text-[10px] font-black", activeWaveIndex === idx ? "bg-white text-primary" : "bg-primary/10 text-primary")}>
                                                        {wave.number}
                                                    </div>
                                                    <span className="text-xs font-bold truncate max-w-[110px]">{wave.name}</span>
                                                </div>
                                                {formData.waves.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn("size-6 rounded-md group-hover:opacity-100 opacity-0", activeWaveIndex === idx ? "text-white hover:bg-white/20" : "text-stone-400")}
                                                        onClick={e => { e.stopPropagation(); removeWave(idx); }}
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            className="w-full h-10 rounded-2xl bg-white/50 border-dashed border-stone-300 text-stone-500 hover:text-primary hover:border-primary"
                                            onClick={addWave}
                                        >
                                            <Plus className="size-3 mr-2" /> Add Learning Wave
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Save button */}
                            <div className="pt-2 space-y-2">
                                {error && (
                                    <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>
                                )}
                                <Button
                                    className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg font-serif"
                                    onClick={handleSave}
                                    disabled={!formData.name || isSubmitting}
                                >
                                    {isSubmitting
                                        ? <><Loader2 className="size-5 mr-2 animate-spin" /> Saving…</>
                                        : "Save Changes"
                                    }
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full rounded-2xl text-stone-400 hover:text-stone-600"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>

                        {/* ── Main Content ── */}
                        {activeWave && (
                            <div className="flex-1 p-8 overflow-hidden flex flex-col">
                                {/* Wave header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    value={activeWave.name}
                                                    onChange={e => updateWave(activeWaveIndex, { name: e.target.value })}
                                                    className="text-2xl font-serif font-bold text-[#1B4332] bg-transparent border-0 border-b-2 border-stone-200 focus:border-primary rounded-none px-0 h-auto py-1 shadow-none w-64"
                                                />
                                                <Badge className={cn(
                                                    "text-[10px] uppercase",
                                                    activeWave.status === 'active' ? "bg-emerald-500" : "bg-stone-300"
                                                )}>
                                                    {activeWave.status}
                                                </Badge>
                                            </div>
                                            <p className="text-stone-500 text-sm mt-1">Configure competencies for this learning phase</p>
                                        </div>
                                        <div className="h-12 w-[1px] bg-stone-200" />
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Wave Status</Label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateWave(activeWaveIndex, { status: activeWave.status === 'active' ? 'upcoming' : 'active' })}
                                                    className={cn(
                                                        "h-6 w-11 rounded-full transition-colors relative",
                                                        activeWave.status === 'active' ? "bg-emerald-500" : "bg-stone-300"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-1 left-1 size-4 bg-white rounded-full transition-transform",
                                                        activeWave.status === 'active' ? "translate-x-5" : ""
                                                    )} />
                                                </button>
                                                <span className="text-xs font-bold text-stone-600">Active</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 bg-stone-100 p-1 rounded-2xl border border-stone-200">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setActiveTab('curriculum')}
                                            className={cn(
                                                "rounded-xl px-6 h-10 transition-all font-bold",
                                                activeTab === 'curriculum' ? "bg-white shadow text-primary" : "text-stone-400"
                                            )}
                                        >
                                            Curriculum
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setActiveTab('grounding')}
                                            className={cn(
                                                "rounded-xl px-6 h-10 transition-all font-bold",
                                                activeTab === 'grounding' ? "bg-white shadow text-primary" : "text-stone-400"
                                            )}
                                        >
                                            Grounding Module
                                        </Button>
                                    </div>
                                </div>

                                {activeTab === 'curriculum' ? (
                                    <div className="h-full flex flex-col min-h-0">

                                        {/* ── Phase States Row ── */}
                                        <div className="mb-6 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] mb-3">Learning Phase States</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {phaseConfig.map(({ key, label, icon, color }) => {
                                                    const state = activeWave.phaseStates[key];
                                                    const isActive = state === 'active';
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => togglePhase(activeWaveIndex, key)}
                                                            className={cn(
                                                                "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group",
                                                                isActive
                                                                    ? color === 'amber'
                                                                        ? "bg-amber-50 border-amber-400 shadow-md shadow-amber-100"
                                                                        : color === 'blue'
                                                                            ? "bg-blue-50 border-blue-400 shadow-md shadow-blue-100"
                                                                            : "bg-emerald-50 border-emerald-400 shadow-md shadow-emerald-100"
                                                                    : "bg-stone-50 border-stone-200 hover:border-stone-300"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "size-9 rounded-xl flex items-center justify-center transition-colors",
                                                                isActive
                                                                    ? color === 'amber' ? "bg-amber-400 text-white"
                                                                        : color === 'blue' ? "bg-blue-400 text-white"
                                                                            : "bg-emerald-500 text-white"
                                                                    : "bg-stone-100 text-stone-400"
                                                            )}>
                                                                {icon}
                                                            </div>
                                                            <span className={cn(
                                                                "text-xs font-black uppercase",
                                                                isActive
                                                                    ? color === 'amber' ? "text-amber-700"
                                                                        : color === 'blue' ? "text-blue-700"
                                                                            : "text-emerald-700"
                                                                    : "text-stone-400"
                                                            )}>{label}</span>
                                                            <span className={cn(
                                                                "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                                                isActive
                                                                    ? color === 'amber' ? "bg-amber-100 text-amber-600"
                                                                        : color === 'blue' ? "bg-blue-100 text-blue-600"
                                                                            : "bg-emerald-100 text-emerald-600"
                                                                    : "bg-stone-100 text-stone-400"
                                                            )}>
                                                                {isActive
                                                                    ? <><Unlock className="size-2.5" /> Active</>
                                                                    : <><Lock className="size-2.5" /> Locked</>
                                                                }
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Two-column: Competencies | Fellows */}
                                        <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden">

                                            {/* Company Competency Library */}
                                            <div className="flex flex-col space-y-4 overflow-hidden">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] flex items-center gap-2">
                                                    <BookOpen className="size-4" /> Company Competency Library
                                                </Label>
                                                <div className="flex-1 bg-white rounded-[2rem] border-2 border-stone-200 overflow-hidden flex flex-col shadow-inner">
                                                    <div className="p-4 bg-stone-50 border-b flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-[#1B4332] uppercase tracking-tighter">Library Modules</span>
                                                            <span className="text-[10px] text-stone-400 font-medium">{cohort.company_id}</span>
                                                        </div>
                                                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20">
                                                            {availableCompetencies.length} modules
                                                        </Badge>
                                                    </div>
                                                    <div className="p-4 flex-1 overflow-y-auto space-y-2">
                                                        {availableCompetencies.map(lib => {
                                                            const isSelected = activeWave.competencyIds.includes(lib.id);
                                                            const isActive = activeWave.activeCompetencyIds.includes(lib.id);
                                                            return (
                                                                <div
                                                                    key={lib.id}
                                                                    className={cn(
                                                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                                                        isSelected
                                                                            ? "bg-primary/10 border-primary shadow-sm"
                                                                            : "bg-white border-stone-100 hover:border-primary/30"
                                                                    )}
                                                                    onClick={() => toggleCompetencyInWave(activeWaveIndex, lib.id)}
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-bold text-stone-800">{lib.competency.name}</p>
                                                                            {isSelected && (
                                                                                <button
                                                                                    onClick={e => { e.stopPropagation(); toggleCompetencyActive(activeWaveIndex, lib.id); }}
                                                                                    className={cn(
                                                                                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border transition-colors",
                                                                                        isActive
                                                                                            ? "bg-[#1B4332] text-white border-[#1B4332]"
                                                                                            : "bg-white text-[#1B4332] border-[#1B4332]/30 hover:bg-[#1B4332]/10"
                                                                                    )}
                                                                                >
                                                                                    {isActive ? 'Active' : 'Draft'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[10px] text-stone-400 italic mt-0.5">
                                                                            {lib.competency_domain} · {lib.competency.target_level}
                                                                        </p>
                                                                    </div>
                                                                    <div className={cn(
                                                                        "size-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                                        isSelected
                                                                            ? "bg-primary border-primary text-white"
                                                                            : "border-stone-200 group-hover:border-primary/50"
                                                                    )}>
                                                                        <ArrowRight className={cn("size-3", isSelected ? "rotate-90" : "")} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {availableCompetencies.length === 0 && (
                                                            <div className="py-12 text-center text-stone-400 italic text-sm font-serif">
                                                                No library modules found for this company.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Fellow Roster */}
                                            <div className="flex flex-col space-y-4 overflow-hidden">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] flex items-center gap-2">
                                                    <Users className="size-4" /> Enrollee Roster
                                                </Label>
                                                <div className="flex-1 bg-white rounded-[2rem] border-2 border-stone-200 overflow-hidden flex flex-col shadow-inner">
                                                    <div className="p-4 bg-stone-50 border-b flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-[#1B4332] uppercase tracking-tighter">
                                                                {cohort.company_id}
                                                            </span>
                                                            <span className="text-[10px] text-stone-400 font-medium">
                                                                Available &amp; enrolled fellows
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={toggleAllFellows}
                                                                className="text-[10px] font-black uppercase text-primary hover:underline"
                                                            >
                                                                {formData.fellowIds.length === displayFellows.length && displayFellows.length > 0
                                                                    ? 'Deselect All' : 'Select All'}
                                                            </button>
                                                            <Badge className="bg-[#1B4332] h-6">
                                                                {formData.fellowIds.length} / {displayFellows.length}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 flex-1 overflow-y-auto space-y-2">
                                                        {displayFellows.map(fellow => (
                                                            <div
                                                                key={fellow.id}
                                                                onClick={() => toggleFellow(fellow.id)}
                                                                className={cn(
                                                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                                                    formData.fellowIds.includes(fellow.id)
                                                                        ? "bg-[#1B4332]/5 border-[#1B4332] shadow-sm"
                                                                        : "bg-white border-stone-100 hover:border-[#1B4332]/20 shadow-sm"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "size-5 rounded-md border-2 flex items-center justify-center transition-colors",
                                                                    formData.fellowIds.includes(fellow.id)
                                                                        ? "bg-[#1B4332] border-[#1B4332] text-white"
                                                                        : "border-stone-200 group-hover:border-[#1B4332]/50"
                                                                )}>
                                                                    {formData.fellowIds.includes(fellow.id) && <Plus className="size-3" />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold text-stone-800 leading-none">{fellow.full_name}</p>
                                                                    <p className="text-[10px] text-stone-400 font-medium mt-1">{fellow.email}</p>
                                                                </div>
                                                                <Badge variant="outline" className="text-[9px] h-5 border-stone-200 text-stone-400 uppercase tracking-tighter">
                                                                    {fellow.cohort_id === cohort.id ? 'enrolled' : fellow.status}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                        {displayFellows.length === 0 && (
                                                            <div className="py-12 text-center text-stone-400 italic text-sm font-serif">
                                                                No fellows found for this company.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Assign Grounding Module</Label>
                                                <div className="bg-white rounded-[2rem] border-2 border-stone-200 p-6 shadow-inner space-y-6">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-stone-600">Selected Module</Label>
                                                        <Select
                                                            value={formData.groundingModuleId}
                                                            onValueChange={v => setFormData(f => ({ ...f, groundingModuleId: v }))}
                                                        >
                                                            <SelectTrigger className="h-12 rounded-xl bg-stone-50 border-stone-100">
                                                                <SelectValue placeholder="Choose a Module" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableGroundingModules.map(m => (
                                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-stone-800">Module Status</p>
                                                            <p className="text-[10px] text-stone-400 font-medium italic">Toggle module visibility for fellows</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setFormData(f => ({ ...f, isGroundingActive: !f.isGroundingActive }))}
                                                            className={cn(
                                                                "h-8 w-14 rounded-full transition-all relative",
                                                                formData.isGroundingActive ? "bg-emerald-500 shadow-lg shadow-emerald-200" : "bg-stone-300"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-1 left-1 size-6 bg-white rounded-full transition-transform shadow-sm",
                                                                formData.isGroundingActive ? "translate-x-6" : ""
                                                            )} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Module Preview</Label>
                                                {formData.groundingModuleId ? (
                                                    <div className="bg-white rounded-[2rem] border-2 border-stone-100 p-8 flex flex-col items-center justify-center text-center space-y-4 h-[300px]">
                                                        <div className="size-20 rounded-[2.5rem] bg-emerald-50 flex items-center justify-center">
                                                            <BookOpenCheck className="size-10 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xl font-serif font-bold text-stone-800">
                                                                {availableGroundingModules.find(m => m.id === formData.groundingModuleId)?.name}
                                                            </h4>
                                                            <p className="text-sm text-stone-500 italic mt-2 max-w-xs line-clamp-2">
                                                                {availableGroundingModules.find(m => m.id === formData.groundingModuleId)?.description}
                                                            </p>
                                                        </div>
                                                        <Badge className={cn(
                                                            "px-4 py-1 rounded-full uppercase text-[10px] font-black",
                                                            formData.isGroundingActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400"
                                                        )}>
                                                            {formData.isGroundingActive ? 'Currently Active' : 'Currently Locked'}
                                                        </Badge>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white rounded-[2rem] border-2 border-dashed border-stone-200 p-8 flex flex-col items-center justify-center text-center space-y-4 h-[300px] text-stone-400">
                                                        <Clock className="size-12 opacity-20" />
                                                        <p className="font-serif italic text-sm">Select a module to see preview</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
