"use client";

import { useMemo, useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    ArrowLeft,
    Building2,
    ChevronRight,
    User as UserIcon,
    Mail,
    ShieldAlert,
    UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { FacilitatorService } from "@/services/FacilitatorService";
import { companyService } from "@/services/companyService";
import { cn } from "@/lib/utils";
import UserProfileDetail from "./UserProfileDetail";
import FacilitatorCreationForm from "./FacilitatorCreationForm";
import { FacilitatorProfile, Company } from "@/types";

function FacilitatorActions({ facilitator, onUpdate, onView }: { facilitator: any, onUpdate?: () => void, onView: () => void }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [updatedData, setUpdatedData] = useState({
        full_name: facilitator.full_name,
        email: facilitator.email,
        is_active: facilitator.is_active,
    });

    const handleDelete = async () => {
        if (deleteConfirmName === facilitator.full_name) {
            setIsDeleting(true);
            try {
                await FacilitatorService.deleteFacilitator(facilitator.id, facilitator.user_id);
                setIsDeleteDialogOpen(false);
                if (onUpdate) onUpdate();
            } catch (error) {
                console.error("Error deleting facilitator:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleUpdate = async () => {
        setIsSaving(true);
        try {
            await FacilitatorService.updateFacilitator(facilitator.id, facilitator.user_id, {
                full_name: updatedData.full_name,
                email: updatedData.email,
                is_active: updatedData.is_active,
            });
            setIsUpdateDialogOpen(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error updating facilitator:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
                variant="ghost"
                size="sm"
                onClick={onView}
                className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                title="View Profile"
            >
                <ChevronRight className="h-5 w-5" />
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                onClick={() => setIsUpdateDialogOpen(true)}
                title="Update Profile"
            >
                <Edit className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
                onClick={() => setIsDeleteDialogOpen(true)}
                title="Remove Member"
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            {/* Update Dialog */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-4 border-primary/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif font-bold">Update Facilitator</DialogTitle>
                        <DialogDescription className="font-serif italic">
                            Modify information for {facilitator.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-primary px-1">Full Name</label>
                            <Input
                                value={updatedData.full_name}
                                onChange={e => setUpdatedData({ ...updatedData, full_name: e.target.value })}
                                className="rounded-xl border-2 border-[#E8E4D8] focus:border-primary transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-primary px-1">Email Address</label>
                            <Input
                                value={updatedData.email}
                                onChange={e => setUpdatedData({ ...updatedData, email: e.target.value })}
                                className="rounded-xl border-2 border-[#E8E4D8] focus:border-primary transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-primary px-1">Member Status</label>
                            <select
                                className="w-full h-12 px-4 rounded-xl border-2 border-[#E8E4D8] bg-white focus:border-primary outline-none transition-all font-serif font-bold italic"
                                value={updatedData.is_active ? "active" : "inactive"}
                                onChange={e => setUpdatedData({ ...updatedData, is_active: e.target.value === "active" })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)} className="rounded-full px-8">
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={isSaving} className="rounded-full px-8 shadow-lg shadow-primary/20">
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="rounded-[2.5rem] border-4 border-destructive/20">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif font-bold text-destructive">Confirm Deletion</DialogTitle>
                        <DialogDescription className="font-serif italic font-medium">
                            This will permanently remove the facilitator record and their authentication account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="p-4 bg-destructive/5 rounded-2xl border-2 border-destructive/10">
                            <p className="text-sm text-destructive font-bold flex items-center gap-2">
                                <ShieldAlert className="size-4" />
                                Action Required
                            </p>
                            <p className="text-xs text-destructive/80 mt-1">
                                Type <span className="font-black">&quot;{facilitator.full_name}&quot;</span> below to confirm this permanent removal.
                            </p>
                        </div>
                        <Input
                            type="text"
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder="Type name here..."
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
                                disabled={deleteConfirmName !== facilitator.full_name || isDeleting}
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


export default function AdminFacilitatorsTab() {
    const [facilitators, setFacilitators] = useState<any[]>([]);
    const [, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [facilitatorData, companyData] = await Promise.all([
                FacilitatorService.getAllFacilitators(),
                companyService.getAll()
            ]);

            setCompanies(companyData);
            setFacilitators(facilitatorData.map((f: FacilitatorProfile) => ({
                ...f,
                name: f.full_name || "Facilitator",
                status: f.is_active ? "Active" : "Inactive",
                companyName: (f.company_ids && f.company_ids.length > 0)
                    ? (companyData.find(c => c.id === f.company_ids[0])?.name || "Multiple Companies")
                    : "No Company Assigned",
                department: f.department || "Lead Training"
            })));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredFacilitators = useMemo(() => {
        return facilitators.filter(fac =>
            fac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fac.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fac.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, facilitators]);

    const selectedFacilitator = useMemo(() => {
        return facilitators.find(f => f.id === selectedId);
    }, [selectedId, facilitators]);

    if (selectedId && selectedFacilitator) {
        return (
            <div className="space-y-6 px-4 py-6">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedId(null)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-full transition-all font-serif font-bold italic"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Facilitator Hub
                </Button>
                <div className="bg-white rounded-[3.5rem] p-8 shadow-2xl border-4 border-primary/10">
                    <UserProfileDetail user={{
                        ...selectedFacilitator,
                        role: "Facilitator",
                        company: selectedFacilitator.companyName,
                        location: "Addis Ababa, Ethiopia",
                        joinedDate: "Feb 12, 2026",
                    }} isEditable={true} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-primary font-black mb-2">Training Operations</p>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Facilitator Hub</h1>
                    <p className="mt-3 text-muted-foreground max-w-2xl font-serif italic text-lg leading-relaxed">
                        Oversee program facilitators, assign them to company cohorts, and manage their system access.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <FacilitatorCreationForm onFacilitatorCreated={fetchData} />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border-2 border-[#E8E4D8]/50 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary/40 h-5 w-5" />
                    <Input
                        placeholder="Search facilitators by name, email or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 rounded-2xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif italic"
                    />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-serif italic font-medium px-4">
                    Showing <span className="text-primary font-black not-italic mx-1">{filteredFacilitators.length}</span> experts in total
                </div>
            </div>

            <Card className="rounded-[3rem] border-2 border-[#E8E4D8] overflow-hidden shadow-2xl bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-b-2 border-[#E8E4D8]/50">
                                <TableHead className="font-serif font-black px-10 h-20 text-lg">Expert Lead</TableHead>
                                <TableHead className="font-serif font-black h-20 text-lg">Primary Portfolio</TableHead>
                                <TableHead className="font-serif font-black h-20 text-center text-lg">Status</TableHead>
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
                            ) : filteredFacilitators.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-60 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <UserCog className="size-12 opacity-20" />
                                            <p className="font-serif italic text-xl">No facilitators found matching your search.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredFacilitators.map((fac) => (
                                <TableRow
                                    key={fac.id}
                                    className="group hover:bg-primary/5 cursor-pointer transition-all border-b border-[#E8E4D8]/30"
                                    onClick={() => setSelectedId(fac.id)}
                                >
                                    <TableCell className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <Avatar className="size-16 rounded-[1.5rem] border-2 border-primary/20 group-hover:border-primary group-hover:rotate-3 transition-all">
                                                <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">
                                                    {(fac.name as string).split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-serif font-bold text-2xl text-foreground group-hover:text-primary transition-colors leading-tight">{fac.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Mail className="size-3 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground font-serif italic">{fac.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                                                <Building2 className="size-4 text-primary/60" />
                                                {fac.companyName}
                                            </span>
                                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{fac.department}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={cn(
                                            "rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-widest",
                                            fac.is_active ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                        )}>
                                            {fac.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right px-10" onClick={(e) => e.stopPropagation()}>
                                        <FacilitatorActions
                                            facilitator={fac}
                                            onUpdate={fetchData}
                                            onView={() => setSelectedId(fac.id)}
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
