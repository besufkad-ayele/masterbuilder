"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Plus,
    Users,
    Search,
    Check,
    X,
    Building2,
    Calendar,
    User as UserIcon,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CoachService } from "@/services/CoachService";
import { companyService } from "@/services/companyService";
import { CohortService } from "@/services/CohortService";
import { FellowService } from "@/services/FellowService";
import { Company, Cohort, CoachProfile, FellowProfile } from "@/types";
import { cn } from "@/lib/utils";

interface PeerCircleCreationFormProps {
    onCircleCreated: () => void;
}

export default function PeerCircleCreationForm({ onCircleCreated }: PeerCircleCreationFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [selectedCohortId, setSelectedCohortId] = useState<string>("");
    const [selectedCoachId, setSelectedCoachId] = useState<string>("");
    const [selectedFellowIds, setSelectedFellowIds] = useState<string[]>([]);

    // Data State
    const [companies, setCompanies] = useState<Company[]>([]);
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [coaches, setCoaches] = useState<CoachProfile[]>([]);
    const [fellows, setFellows] = useState<FellowProfile[]>([]);
    const [fellowSearch, setFellowSearch] = useState("");

    // Fetch initial data
    useEffect(() => {
        if (isOpen) {
            const fetchInitialData = async () => {
                setLoading(true);
                try {
                    const [companyData, coachData] = await Promise.all([
                        companyService.getAll(),
                        CoachService.getAllCoaches()
                    ]);
                    setCompanies(companyData);
                    setCoaches(coachData.filter(c => c.is_active));
                } catch (error) {
                    console.error("Error fetching initial data:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchInitialData();
        }
    }, [isOpen]);

    // Fetch cohorts when company changes
    useEffect(() => {
        if (selectedCompanyId) {
            const fetchCohorts = async () => {
                try {
                    const cohortData = await CohortService.getCohortsByCompany(selectedCompanyId);
                    setCohorts(cohortData);
                    setSelectedCohortId(""); // Reset cohort
                } catch (error) {
                    console.error("Error fetching cohorts:", error);
                }
            };
            fetchCohorts();
        } else {
            setCohorts([]);
            setSelectedCohortId("");
        }
    }, [selectedCompanyId]);

    // Fetch fellows when cohort changes
    useEffect(() => {
        if (selectedCohortId) {
            const fetchFellows = async () => {
                try {
                    const fellowData = await FellowService.getAllFellows(selectedCompanyId, selectedCohortId);
                    // Filter fellows who aren't already in a peer circle
                    setFellows(fellowData.filter(f => !f.peer_circle_id));
                    setSelectedFellowIds([]); // Reset selected fellows
                } catch (error) {
                    console.error("Error fetching fellows:", error);
                }
            };
            fetchFellows();
        } else {
            setFellows([]);
            setSelectedFellowIds([]);
        }
    }, [selectedCohortId, selectedCompanyId]);

    const filteredFellows = useMemo(() => {
        return fellows.filter(f => 
            f.full_name.toLowerCase().includes(fellowSearch.toLowerCase()) ||
            f.email.toLowerCase().includes(fellowSearch.toLowerCase())
        );
    }, [fellows, fellowSearch]);

    const toggleFellow = (userId: string) => {
        setSelectedFellowIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!name || !selectedCoachId || !selectedCohortId || !selectedCompanyId || selectedFellowIds.length === 0) return;

        setIsSaving(true);
        try {
            await CoachService.createPeerCircle({
                name,
                coach_id: selectedCoachId,
                cohort_id: selectedCohortId,
                company_id: selectedCompanyId,
                fellow_ids: selectedFellowIds
            });
            setIsOpen(false);
            onCircleCreated();
            // Reset form
            setName("");
            setSelectedCompanyId("");
            setSelectedCohortId("");
            setSelectedCoachId("");
            setSelectedFellowIds([]);
        } catch (error) {
            console.error("Error creating peer circle:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const isFormValid = name && selectedCompanyId && selectedCohortId && selectedCoachId && selectedFellowIds.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full bg-primary text-white px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                    <Plus className="mr-2 h-5 w-5" />
                    New Peer Circle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border-4 border-primary/10 max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-serif font-bold">Assemble Peer Circle</DialogTitle>
                    <DialogDescription className="font-serif italic text-lg">
                        Define a new coaching group and assign a mentor to guide fellows.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 overflow-y-auto pr-2">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-primary px-1">Circle Name</label>
                                <Input
                                    placeholder="e.g. Rising Stars A"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="rounded-xl border-2 border-[#E8E4D8] focus:border-primary transition-all h-12 font-serif italic"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-primary px-1">Company</label>
                                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                                    <SelectTrigger className="rounded-xl border-2 border-[#E8E4D8] focus:ring-0 focus:border-primary h-12 font-serif italic">
                                        <SelectValue placeholder="Select Company" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-2 border-primary/10">
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="focus:bg-primary/5 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-primary/40" />
                                                    {c.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-primary px-1">Cohort</label>
                                <Select 
                                    value={selectedCohortId} 
                                    onValueChange={setSelectedCohortId}
                                    disabled={!selectedCompanyId}
                                >
                                    <SelectTrigger className="rounded-xl border-2 border-[#E8E4D8] focus:ring-0 focus:border-primary h-12 font-serif italic">
                                        <SelectValue placeholder={selectedCompanyId ? "Select Cohort" : "Select Company First"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-2 border-primary/10">
                                        {cohorts.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="focus:bg-primary/5 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-primary/40" />
                                                    {c.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-primary px-1">Assigned Coach</label>
                                <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                                    <SelectTrigger className="rounded-xl border-2 border-[#E8E4D8] focus:ring-0 focus:border-primary h-12 font-serif italic">
                                        <SelectValue placeholder="Select Coach" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-2 border-primary/10">
                                        {coaches.map(c => (
                                            <SelectItem key={c.user_id} value={c.user_id} className="focus:bg-primary/5 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4 text-primary/40" />
                                                    {c.full_name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Right Column: Fellow Selection */}
                        <div className="flex flex-col h-full space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase tracking-[0.2em] text-primary px-1">Assign Fellows</label>
                                    <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black px-3">
                                        {selectedFellowIds.length} Selected
                                    </Badge>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search fellows..."
                                        value={fellowSearch}
                                        onChange={e => setFellowSearch(e.target.value)}
                                        className="pl-10 rounded-xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif italic"
                                        disabled={!selectedCohortId}
                                    />
                                </div>
                            </div>

                            <ScrollArea className="flex-1 rounded-2xl border-2 border-[#E8E4D8] bg-stone-50/50 p-4 min-h-[250px]">
                                {!selectedCohortId ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                                        <Users className="h-10 w-10 text-muted-foreground/20 mb-2" />
                                        <p className="text-sm text-muted-foreground font-serif italic">Select a cohort to view eligible fellows.</p>
                                    </div>
                                ) : filteredFellows.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-sm text-muted-foreground font-serif italic">No unassigned fellows found in this cohort.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredFellows.map(fellow => (
                                            <div 
                                                key={fellow.user_id}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer group",
                                                    selectedFellowIds.includes(fellow.user_id)
                                                        ? "bg-primary/10 border-primary shadow-sm"
                                                        : "bg-white border-transparent hover:border-primary/30"
                                                )}
                                                onClick={() => toggleFellow(fellow.user_id)}
                                            >
                                                <div className={cn(
                                                    "size-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                    selectedFellowIds.includes(fellow.user_id)
                                                        ? "bg-primary border-primary"
                                                        : "bg-stone-50 border-stone-200 group-hover:border-primary/50"
                                                )}>
                                                    {selectedFellowIds.includes(fellow.user_id) && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{fellow.full_name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{fellow.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                )}

                <DialogFooter className="pt-6 border-t-2 border-[#E8E4D8]/50 mt-auto">
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsOpen(false)} 
                        className="rounded-full font-serif font-bold italic"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleCreate} 
                        disabled={!isFormValid || isSaving}
                        className="rounded-full px-10 bg-primary text-white shadow-xl shadow-primary/20"
                    >
                        {isSaving ? "Assembling..." : "Create Peer Circle"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
