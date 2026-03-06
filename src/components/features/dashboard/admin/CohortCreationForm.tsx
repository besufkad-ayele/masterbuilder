"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, BookOpen, Users, Trash2, ArrowRight, Loader2, Clock, Lock, Unlock, Brain, BookOpenCheck, Wrench } from "lucide-react";
import { CohortService } from "@/services/CohortService";
import { companyService } from "@/services/companyService";
import { FellowService } from "@/services/FellowService";
import { groundingService } from "@/services/groundingService";
import { competencyService } from "@/services/competencyService";
import { Company, CompetencyLibrary, FellowProfile } from "@/types";
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

interface CohortCreationFormProps {
    onCohortCreated: (cohort: any) => void;
}

const defaultPhaseStates = () => ({ believe: 'locked' as PhaseState, know: 'locked' as PhaseState, do: 'locked' as PhaseState });

export default function CohortCreationForm({ onCohortCreated }: CohortCreationFormProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        companyId: "",
        fellowIds: [] as string[],
        startDate: "",
        endDate: "",
        durationMonths: "" as string,
        level: "Basic",
        status: "upcoming",
        enrollmentMode: "invite_only",
        groundingModuleId: "" as string,
        isGroundingActive: false,
        waves: [
            { number: 1, name: "Wave 1: Launch", competencyIds: [], activeCompetencyIds: [], status: 'upcoming', phaseStates: defaultPhaseStates() }
        ] as WaveConfig[],
    });

    const [companies, setCompanies] = useState<Company[]>([]);
    const [availableCompetencies, setAvailableCompetencies] = useState<CompetencyLibrary[]>([]);
    const [availableGroundingModules, setAvailableGroundingModules] = useState<any[]>([]);
    const [allCompanyFellows, setAllCompanyFellows] = useState<FellowProfile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [activeWaveIndex, setActiveWaveIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'curriculum' | 'grounding'>('curriculum');

    // Load companies on mount
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const comps = await companyService.getAll();
                setCompanies(comps);
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();
    }, []);

    // Load company-specific data when company changes
    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!formData.companyId) {
                setAllCompanyFellows([]);
                setAvailableCompetencies([]);
                return;
            }
            setIsLoadingData(true);
            try {
                const [fellows, libraryModules, companyModules, globalModules] = await Promise.all([
                    FellowService.getAllFellows(formData.companyId),
                    competencyService.getLibraryByCompany(formData.companyId),
                    groundingService.getModulesByCompany(formData.companyId),
                    groundingService.getModulesByCompany("")
                ]);
                setAllCompanyFellows(fellows);
                setAvailableCompetencies(libraryModules);
                setAvailableGroundingModules([...companyModules, ...globalModules]);
            } catch (error) {
                console.error("Error fetching company data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchCompanyData();
    }, [formData.companyId]);

    const selectedCompany = useMemo(() =>
        companies.find(c => c.id === formData.companyId),
        [formData.companyId, companies]
    );

    const displayFellows = allCompanyFellows;

    const handleSubmit = async () => {
        if (!formData.companyId || !formData.name) return;
        setIsSubmitting(true);
        try {
            const cohortFields: Record<string, unknown> = {
                name: formData.name,
                company_id: formData.companyId,
                wave_level: formData.level,
                status: formData.status,
                enrollment_mode: formData.enrollmentMode,
                capacity: formData.fellowIds.length || undefined,
            };
            if (formData.startDate) cohortFields.start_date = formData.startDate;
            if (formData.endDate) cohortFields.end_date = formData.endDate;
            if (formData.durationMonths) cohortFields.duration_months = Number(formData.durationMonths);

            const cohortPayload = {
                cohort: cohortFields as any,
                waves: formData.waves.map(w => ({
                    number: w.number,
                    name: w.name,
                    competencyIds: w.competencyIds,
                    activeCompetencyIds: w.activeCompetencyIds,
                    status: w.status,
                    phaseStates: w.phaseStates,
                })),
                fellowIds: formData.fellowIds,
                groundingModuleId: formData.groundingModuleId,
                isGroundingActive: formData.isGroundingActive,
            };

            await CohortService.createCohortWithWaves(cohortPayload);
            onCohortCreated(cohortPayload);
            setOpen(false);
            // Reset form
            setFormData({
                name: "",
                companyId: "",
                fellowIds: [],
                startDate: "",
                endDate: "",
                durationMonths: "",
                level: "Basic",
                status: "upcoming",
                enrollmentMode: "invite_only",
                groundingModuleId: "",
                isGroundingActive: false,
                waves: [{ number: 1, name: "Wave 1: Launch", competencyIds: [], activeCompetencyIds: [], status: 'upcoming', phaseStates: defaultPhaseStates() }]
            });
        } catch (error) {
            console.error("Error creating cohort:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

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
            }]
        }));
        setActiveWaveIndex(formData.waves.length);
    };

    const removeWave = (index: number) => {
        if (formData.waves.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            waves: prev.waves.filter((_, i) => i !== index).map((w, i) => ({ ...w, number: i + 1 }))
        }));
        if (activeWaveIndex >= index) setActiveWaveIndex(Math.max(0, activeWaveIndex - 1));
    };

    const updateWave = (index: number, updates: Partial<WaveConfig>) => {
        setFormData(prev => ({
            ...prev,
            waves: prev.waves.map((w, i) => i === index ? { ...w, ...updates } : w)
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
                : [...prev.fellowIds, id]
        }));
    };

    const toggleAllFellows = () => {
        if (formData.fellowIds.length === displayFellows.length) {
            setFormData(prev => ({ ...prev, fellowIds: [] }));
        } else {
            setFormData(prev => ({ ...prev, fellowIds: displayFellows.map(f => f.id) }));
        }
    };

    const activeWave = formData.waves[activeWaveIndex] ?? formData.waves[0];

    const phaseConfig: { key: 'believe' | 'know' | 'do'; label: string; icon: React.ReactNode; color: string }[] = [
        { key: 'believe', label: 'Believe', icon: <Brain className="size-3.5" />, color: 'amber' },
        { key: 'know', label: 'Know', icon: <BookOpenCheck className="size-3.5" />, color: 'blue' },
        { key: 'do', label: 'Do', icon: <Wrench className="size-3.5" />, color: 'emerald' },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Cohort
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-stone-50 border-none shadow-2xl p-0">
                <div className="flex h-full min-h-[700px]">

                    {/* Sidebar: Navigation & Config */}
                    <div className="w-1/4 bg-stone-100/50 border-r border-stone-200 p-8 space-y-8 flex flex-col">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-stone-800">New Cohort</h2>
                            <p className="text-stone-500 text-sm mt-1 italic font-serif">Configure organizational learning track</p>
                        </div>

                        <div className="space-y-6 flex-1">
                            {/* Partner Organization */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Partner Organization</Label>
                                <Select value={formData.companyId} onValueChange={v => setFormData(f => ({ ...f, companyId: v, fellowIds: [] }))}>
                                    <SelectTrigger className="h-12 rounded-2xl bg-white border-stone-200 shadow-sm">
                                        <SelectValue placeholder="Select Company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Cohort Identity */}
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
                                    <Select value={formData.status} onValueChange={v => setFormData(f => ({ ...f, status: v }))}>
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
                                    <Select value={formData.enrollmentMode} onValueChange={v => setFormData(f => ({ ...f, enrollmentMode: v }))}>
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

                            {/* Start / End dates */}
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

                            {/* Waves List */}
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
                                                <span className="text-xs font-bold truncate max-w-[120px]">{wave.name}</span>
                                            </div>
                                            {formData.waves.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn("size-6 rounded-md group-hover:opacity-100 opacity-0", activeWaveIndex === idx ? "text-white hover:bg-white/20" : "text-stone-400")}
                                                    onClick={(e) => { e.stopPropagation(); removeWave(idx); }}
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

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button
                                className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg font-serif"
                                onClick={handleSubmit}
                                disabled={!formData.companyId || !formData.name || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="size-5 mr-2 animate-spin" /> Finalizing...</>
                                ) : (
                                    "Deploy Cohort"
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Main Content: Wave Detail & Fellow Selection */}
                    <div className="flex-1 p-8 overflow-hidden flex flex-col">
                        {isLoadingData ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
                                <Loader2 className="size-10 animate-spin text-primary mb-4" />
                                <p className="font-serif italic text-sm">Synchronizing organizational data...</p>
                            </div>
                        ) : !formData.companyId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 space-y-4">
                                <div className="size-20 rounded-[2.5rem] bg-stone-100 flex items-center justify-center">
                                    <Building2 className="size-10 opacity-20" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-serif text-lg font-bold text-stone-600">Awaiting Organization</h3>
                                    <p className="text-sm italic font-serif">Select a partner organization to begin configuring the ecosystem</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
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
                                            <p className="text-stone-500 text-sm mt-1 italic font-serif">Configure learning phase: {activeWave.number}</p>
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
                                            className={cn("rounded-xl px-6 h-10 transition-all", activeTab === 'curriculum' ? "bg-white shadow text-primary font-bold" : "text-stone-400")}
                                            onClick={() => setActiveTab('curriculum')}
                                        >
                                            Competency
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className={cn("rounded-xl px-6 h-10 transition-all", activeTab === 'grounding' ? "bg-white shadow text-primary font-bold" : "text-stone-400")}
                                            onClick={() => setActiveTab('grounding')}
                                        >
                                            Grounding Module
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    {activeTab === 'curriculum' ? (
                                        <div className="h-full flex flex-col">
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

                                                {/* Competency Library */}
                                                <div className="flex flex-col space-y-4 overflow-hidden">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] flex items-center gap-2">
                                                        <BookOpen className="size-4" /> Company Competency Library
                                                    </Label>
                                                    <div className="flex-1 bg-white rounded-[2rem] border-2 border-stone-200 overflow-hidden flex flex-col shadow-inner">
                                                        <div className="p-4 bg-stone-50 border-b flex items-center justify-between">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-[#1B4332] uppercase tracking-tighter">Library Modules</span>
                                                                <span className="text-[10px] text-stone-400 font-medium">{selectedCompany?.name}</span>
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
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleCompetencyActive(activeWaveIndex, lib.id);
                                                                                        }}
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
                                                                            <p className="text-[10px] text-stone-400 italic mt-0.5 font-serif">
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

                                                {/* Fellow Selection */}
                                                <div className="flex flex-col space-y-4 overflow-hidden">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] flex items-center gap-2">
                                                        <Users className="size-4" /> Enrollee Roster
                                                    </Label>
                                                    <div className="flex-1 bg-white rounded-[2rem] border-2 border-stone-200 overflow-hidden flex flex-col shadow-inner">
                                                        <div className="p-4 bg-stone-50 border-b flex items-center justify-between">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-[#1B4332] uppercase tracking-tighter">
                                                                    {selectedCompany?.name}
                                                                </span>
                                                                <span className="text-[10px] text-stone-400 font-medium italic font-serif">Enroll available fellows</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={toggleAllFellows}
                                                                    className="text-[10px] font-black uppercase text-primary hover:underline"
                                                                >
                                                                    {formData.fellowIds.length === displayFellows.length && displayFellows.length > 0 ? 'Deselect All' : 'Select All'}
                                                                </button>
                                                                <Badge className="bg-[#1B4332] h-6">{formData.fellowIds.length} / {displayFellows.length}</Badge>
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
                                                                        <p className="text-[10px] text-stone-400 font-medium mt-1 font-mono">{fellow.email}</p>
                                                                    </div>
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[9px] h-5 uppercase tracking-tighter",
                                                                        fellow.cohort_id ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-stone-50 text-stone-400 border-stone-200"
                                                                    )}>
                                                                        {fellow.cohort_id ? 'Already Enrolled' : fellow.status}
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
                                                                <p className="text-[10px] text-stone-400 font-medium">Toggle module visibility for fellows</p>
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
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
