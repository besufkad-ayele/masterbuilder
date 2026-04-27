"use client";

import { useMemo, useState, useEffect } from "react";
import {
    Plus,
    Search,
    ChevronRight,
    Users,
    Edit,
    Trash2,
    Building2,
    Calendar,
    ArrowLeft,
    ShieldAlert,
    LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CoachService } from "@/services/CoachService";
import { companyService } from "@/services/companyService";
import { cn } from "@/lib/utils";
import PeerCircleCreationForm from "./PeerCircleCreationForm";
import { PeerCircle, CoachProfile, Company } from "@/types";

function GroupActions({ group, onUpdate }: { group: any, onUpdate?: () => void }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (deleteConfirmName === group.name) {
            setIsDeleting(true);
            try {
                await CoachService.deletePeerCircle(group.id);
                setIsDeleteDialogOpen(false);
                if (onUpdate) onUpdate();
            } catch (error) {
                console.error("Error deleting group:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                title="Edit Group"
            >
                <Edit className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
                onClick={() => setIsDeleteDialogOpen(true)}
                title="Delete Group"
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="rounded-[2.5rem] border-4 border-destructive/20">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif font-bold text-destructive">Delete Peer Circle</DialogTitle>
                        <DialogDescription className="font-serif italic font-medium">
                            This will permanently remove the group. Fellows will be unassigned from this circle.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="p-4 bg-destructive/5 rounded-2xl border-2 border-destructive/10">
                            <p className="text-sm text-destructive font-bold flex items-center gap-2">
                                <ShieldAlert className="size-4" />
                                Action Required
                            </p>
                            <p className="text-xs text-destructive/80 mt-1">
                                Type <span className="font-black">&quot;{group.name}&quot;</span> below to confirm.
                            </p>
                        </div>
                        <Input
                            type="text"
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder="Type group name here..."
                            className="rounded-xl border-2 border-destructive/20 focus:border-destructive transition-all"
                        />
                        <div className="flex gap-3 mt-4">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-full"
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    setDeleteConfirmName("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 rounded-full shadow-lg shadow-destructive/20"
                                onClick={handleDelete}
                                disabled={deleteConfirmName !== group.name || isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Confirm Delete"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AdminGroupsTab() {
    const [groups, setGroups] = useState<any[]>([]);
    const [coaches, setCoaches] = useState<CoachProfile[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [groupData, coachData, companyData] = await Promise.all([
                CoachService.getAllPeerCircles(),
                CoachService.getAllCoaches(),
                companyService.getAll()
            ]);

            setCoaches(coachData);
            setCompanies(companyData);
            
            setGroups(groupData.map((g: PeerCircle) => {
                const coach = coachData.find(c => c.user_id === g.coach_id);
                const company = companyData.find(c => c.id === g.company_id);
                return {
                    ...g,
                    coachName: coach?.full_name || "Unknown Coach",
                    companyName: company?.name || "Multiple Companies",
                    fellowCount: g.fellow_ids.length
                };
            }));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredGroups = useMemo(() => {
        return groups.filter(group =>
            group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.coachName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, groups]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-600 font-black mb-2">Social Learning</p>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Peer Circles</h1>
                    <p className="mt-3 text-muted-foreground max-w-2xl font-serif italic text-lg leading-relaxed">
                        Manage cohort-based peer circles, assign leadership coaches, and track group engagement.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <PeerCircleCreationForm onCircleCreated={fetchData} />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border-2 border-[#E8E4D8]/50 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 h-5 w-5" />
                    <Input
                        placeholder="Search by group, coach or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 rounded-2xl border-2 border-[#E8E4D8] focus:border-indigo-600 transition-all font-serif italic"
                    />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-serif italic font-medium px-4">
                    Showing <span className="text-indigo-600 font-black not-italic mx-1">{filteredGroups.length}</span> active circles
                </div>
            </div>

            <Card className="rounded-[3rem] border-2 border-[#E8E4D8] overflow-hidden shadow-2xl bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-b-2 border-[#E8E4D8]/50">
                                <TableHead className="font-serif font-black px-10 h-20 text-lg">Circle Details</TableHead>
                                <TableHead className="font-serif font-black h-20 text-lg">Assigned Coach</TableHead>
                                <TableHead className="font-serif font-black h-20 text-center text-lg">Fellows</TableHead>
                                <TableHead className="font-serif font-black h-20 text-right px-10 text-lg">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse">
                                        <TableCell colSpan={4} className="h-24 px-10">
                                            <div className="h-12 bg-muted/50 rounded-2xl w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredGroups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-60 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <LayoutGrid className="size-12 opacity-20" />
                                            <p className="font-serif italic text-xl">No peer circles found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredGroups.map((group) => (
                                <TableRow
                                    key={group.id}
                                    className="group hover:bg-indigo-50/50 cursor-pointer transition-all border-b border-[#E8E4D8]/30"
                                >
                                    <TableCell className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <div className="size-14 rounded-2xl bg-indigo-50 flex items-center justify-center border-2 border-indigo-100 group-hover:scale-110 group-hover:rotate-3 transition-all">
                                                <Users className="size-7 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="font-serif font-bold text-2xl text-foreground group-hover:text-indigo-600 transition-colors leading-tight">{group.name}</p>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Building2 className="size-3 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground font-serif italic">{group.companyName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 border-l border-[#E8E4D8] pl-4">
                                                        <Calendar className="size-3 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground font-serif italic">Created {new Date(group.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-10 border border-indigo-100">
                                                <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-bold">
                                                    {group.coachName.split(" ").map((n: string) => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-serif font-bold text-lg text-foreground">{group.coachName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl font-black text-indigo-600 leading-none">{group.fellowCount}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Members</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-10" onClick={(e) => e.stopPropagation()}>
                                        <GroupActions
                                            group={group}
                                            onUpdate={fetchData}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
