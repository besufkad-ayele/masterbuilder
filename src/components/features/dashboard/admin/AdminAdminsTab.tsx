"use client";

import { useMemo, useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    ShieldCheck,
    Mail,
    ArrowLeft,
    UserCog,
    ChevronRight,
    ShieldAlert,
    UserCheck,
    Lock
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
import { AdminManagementService } from "@/services/AdminManagementService";
import { cn } from "@/lib/utils";
import UserProfileDetail from "./UserProfileDetail";
import AdminCreationForm from "./AdminCreationForm";

function AdminActions({ admin, onUpdate, onView }: { admin: any, onUpdate?: () => void, onView: () => void }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [updatedData, setUpdatedData] = useState({
        name: admin.name,
        email: admin.email,
        title: admin.title || admin.role,
    });

    const handleDelete = async () => {
        if (deleteConfirmName === admin.name) {
            setIsDeleting(true);
            try {
                await AdminManagementService.deleteAdmin(admin.id, admin.user_id);
                setIsDeleteDialogOpen(false);
                if (onUpdate) onUpdate();
            } catch (error) {
                console.error("Error deleting admin:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleUpdate = async () => {
        setIsSaving(true);
        try {
            await AdminManagementService.updateAdminProfile(admin.id, admin.user_id, {
                name: updatedData.name,
                email: updatedData.email,
                title: updatedData.title,
            });
            setIsUpdateDialogOpen(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error updating admin:", error);
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
                title="Update Credentials"
            >
                <Edit className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
                onClick={() => setIsDeleteDialogOpen(true)}
                title="Revoke Access"
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            {/* Update Dialog */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-4 border-primary/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif font-bold">Update Level Access</DialogTitle>
                        <DialogDescription className="font-serif italic text-base mt-2">
                            Modify governance credentials for {admin.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-1">Full Name</label>
                            <Input
                                value={updatedData.name}
                                onChange={e => setUpdatedData({ ...updatedData, name: e.target.value })}
                                className="h-12 rounded-xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-1">Institutional Email</label>
                            <Input
                                value={updatedData.email}
                                onChange={e => setUpdatedData({ ...updatedData, email: e.target.value })}
                                className="h-12 rounded-xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-1">Governance Title</label>
                            <Input
                                value={updatedData.title}
                                onChange={e => setUpdatedData({ ...updatedData, title: e.target.value })}
                                className="h-12 rounded-xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif italic font-bold"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsUpdateDialogOpen(false)} className="rounded-full px-8 font-serif font-bold italic">
                            Discard
                        </Button>
                        <Button onClick={handleUpdate} disabled={isSaving} className="rounded-full px-8 shadow-lg shadow-primary/20 bg-primary font-serif font-black">
                            {isSaving ? "Synchronizing..." : "Update Credentials"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="rounded-[2.5rem] border-4 border-destructive/20">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif font-bold text-destructive">Revoke Governance Access</DialogTitle>
                        <DialogDescription className="font-serif italic font-medium mt-2">
                            This will permanently remove administrative privileges and the authentication account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="p-4 bg-destructive/5 rounded-2xl border-2 border-destructive/10">
                            <p className="text-sm text-destructive font-bold flex items-center gap-2">
                                <ShieldAlert className="size-4" />
                                Action Required
                            </p>
                            <p className="text-xs text-destructive/80 mt-1">
                                Type <span className="font-black">&quot;{admin.name}&quot;</span> below to confirm this terminal action.
                            </p>
                        </div>
                        <Input
                            type="text"
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder="Confirm name..."
                            className="h-14 rounded-xl border-2 border-destructive/20 focus:border-destructive transition-all font-serif text-lg text-center"
                        />
                        <div className="flex gap-3 mt-4">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-full font-serif font-bold italic h-12"
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    setDeleteConfirmName("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 rounded-full shadow-lg shadow-destructive/20 font-serif font-black h-12"
                                onClick={handleDelete}
                                disabled={deleteConfirmName !== admin.name || isDeleting}
                            >
                                {isDeleting ? "Revoking..." : "Confirm Revocation"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}


export default function AdminAdminsTab() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const data = await AdminManagementService.getAllAdmins();

            // For each admin, we also need their user data (email/name) from the users collection
            // In a real app, you might want to fetch this in bulk
            const { db } = await import("@/lib/firebase");
            const { getDoc, doc } = await import("firebase/firestore");

            const adminsWithInfo = await Promise.all(data.map(async (a) => {
                const userSnap = await getDoc(doc(db, "users", a.user_id));
                const userData = userSnap.exists() ? userSnap.data() : { name: "System Admin", email: "admin@lead-life.com" };
                return {
                    ...a,
                    name: userData.name || a.title || "Administrator",
                    email: userData.email,
                    status: a.is_active ? "Active" : "Inactive",
                    role: a.title || "System Administrator"
                };
            }));

            setAdmins(adminsWithInfo);
        } catch (error) {
            console.error("Error fetching admins:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const filteredAdmins = useMemo(() => {
        return admins.filter(admin =>
            (admin.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (admin.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (admin.role?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, admins]);

    const selectedAdmin = useMemo(() => {
        return admins.find(a => a.id === selectedId);
    }, [selectedId, admins]);

    if (selectedId && selectedAdmin) {
        return (
            <div className="space-y-6 px-4 py-6">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedId(null)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-full transition-all font-serif font-bold italic"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Governance Hub
                </Button>
                <div className="bg-white rounded-[3.5rem] p-8 shadow-2xl border-4 border-primary/10">
                    <UserProfileDetail user={{
                        ...selectedAdmin,
                        role: "Administrator",
                        location: "HQ - Addis Ababa",
                        joinedDate: new Date(selectedAdmin.created_at).toLocaleDateString(),
                    }} isEditable={true} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-primary font-black mb-2">Internal Governance</p>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Governance Hub</h1>
                    <p className="mt-3 text-muted-foreground max-w-2xl font-serif italic text-lg leading-relaxed">
                        Manage system-level access, oversight and permissions for the Lead Life orchestrators.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <AdminCreationForm onAdminCreated={fetchAdmins} />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border-2 border-[#E8E4D8]/50 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary/40 h-5 w-5" />
                    <Input
                        placeholder="Search orchestrators..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 rounded-2xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif italic"
                    />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-serif italic font-medium px-4">
                    Showing <span className="text-primary font-black not-italic mx-1">{filteredAdmins.length}</span> administrators in total
                </div>
            </div>

            <Card className="rounded-[3rem] border-2 border-[#E8E4D8] overflow-hidden shadow-2xl bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-b-2 border-[#E8E4D8]/50">
                                <TableHead className="font-serif font-black px-10 h-20 text-lg">Orchestrator</TableHead>
                                <TableHead className="font-serif font-black h-20 text-center text-lg">Security Level</TableHead>
                                <TableHead className="font-serif font-black h-20 text-lg">Governance Role</TableHead>
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
                            ) : filteredAdmins.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-60 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <ShieldAlert className="size-12 opacity-20" />
                                            <p className="font-serif italic text-xl">No administrators found matching your search.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAdmins.map((admin) => (
                                <TableRow
                                    key={admin.id}
                                    className="group hover:bg-primary/5 cursor-pointer transition-all border-b border-[#E8E4D8]/30"
                                    onClick={() => setSelectedId(admin.id)}
                                >
                                    <TableCell className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <Avatar className="size-16 rounded-[1.5rem] border-2 border-primary/20 group-hover:border-primary group-hover:-rotate-3 transition-all ring-offset-2 group-hover:ring-2 ring-primary/10">
                                                <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">
                                                    {(admin.name as string).split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-serif font-bold text-2xl text-foreground group-hover:text-primary transition-colors leading-tight">{admin.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Mail className="size-3 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground font-serif italic">{admin.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center gap-2 px-5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                            <Lock className="size-3" />
                                            Superuser
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                                                <UserCheck className="size-4 text-primary/60" />
                                                {admin.role}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Lead Life Internal</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-10" onClick={(e) => e.stopPropagation()}>
                                        <AdminActions
                                            admin={admin}
                                            onUpdate={fetchAdmins}
                                            onView={() => setSelectedId(admin.id)}
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
