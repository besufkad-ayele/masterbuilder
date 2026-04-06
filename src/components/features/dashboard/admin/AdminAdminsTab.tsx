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
    Lock,
    Users,
    Loader2,
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

// ─── Admin Actions Component ──────────────────────────────────────────────────

function AdminActions({
    admin,
    onUpdate,
    onView,
}: {
    admin: any;
    onUpdate?: () => void;
    onView: () => void;
}) {
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
            await AdminManagementService.updateAdminProfile(
                admin.id,
                admin.user_id,
                {
                    name: updatedData.name,
                    email: updatedData.email,
                    title: updatedData.title,
                }
            );
            setIsUpdateDialogOpen(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error updating admin:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="flex items-center justify-end gap-1 sm:gap-1.5 lg:gap-2"
            onClick={(e) => e.stopPropagation()}
        >
            {/* View Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onView}
                className="size-9 sm:size-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                title="View Profile"
            >
                <ChevronRight className="size-4 sm:size-5" />
            </Button>

            {/* Edit Button */}
            <Button
                variant="ghost"
                size="sm"
                className="size-9 sm:size-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                onClick={() => setIsUpdateDialogOpen(true)}
                title="Update Credentials"
            >
                <Edit className="size-3.5 sm:size-4" />
            </Button>

            {/* Delete Button */}
            <Button
                variant="ghost"
                size="sm"
                className="size-9 sm:size-10 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
                onClick={() => setIsDeleteDialogOpen(true)}
                title="Revoke Access"
            >
                <Trash2 className="size-3.5 sm:size-4" />
            </Button>

            {/* Update Dialog */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-[425px] rounded-2xl sm:rounded-[2rem] border-2 sm:border-4 border-primary/10 p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-2 sm:space-y-3">
                        <DialogTitle className="text-lg sm:text-xl md:text-2xl font-serif font-bold">
                            Update Level Access
                        </DialogTitle>
                        <DialogDescription className="font-serif italic text-sm sm:text-base">
                            Modify governance credentials for {admin.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:gap-5 py-4 sm:py-6">
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-primary/60 px-1">
                                Full Name
                            </label>
                            <Input
                                value={updatedData.name}
                                onChange={(e) =>
                                    setUpdatedData({ ...updatedData, name: e.target.value })
                                }
                                className="h-11 sm:h-12 rounded-xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif text-sm sm:text-base"
                            />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-primary/60 px-1">
                                Institutional Email
                            </label>
                            <Input
                                value={updatedData.email}
                                onChange={(e) =>
                                    setUpdatedData({ ...updatedData, email: e.target.value })
                                }
                                className="h-11 sm:h-12 rounded-xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif text-sm sm:text-base"
                            />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-primary/60 px-1">
                                Governance Title
                            </label>
                            <Input
                                value={updatedData.title}
                                onChange={(e) =>
                                    setUpdatedData({ ...updatedData, title: e.target.value })
                                }
                                className="h-11 sm:h-12 rounded-xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif italic font-bold text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsUpdateDialogOpen(false)}
                            className="rounded-full px-6 font-serif font-bold italic h-11 w-full sm:w-auto"
                        >
                            Discard
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isSaving}
                            className="rounded-full px-6 sm:px-8 shadow-lg shadow-primary/20 bg-primary font-serif font-black h-11 w-full sm:w-auto"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                    Synchronizing...
                                </>
                            ) : (
                                "Update Credentials"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-[425px] rounded-2xl sm:rounded-[2rem] border-2 sm:border-4 border-destructive/20 p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-2 sm:space-y-3">
                        <DialogTitle className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-destructive">
                            Revoke Governance Access
                        </DialogTitle>
                        <DialogDescription className="font-serif italic font-medium text-sm sm:text-base">
                            This will permanently remove administrative privileges and the
                            authentication account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 sm:space-y-5 py-2">
                        <div className="p-3 sm:p-4 bg-destructive/5 rounded-xl sm:rounded-2xl border-2 border-destructive/10">
                            <p className="text-xs sm:text-sm text-destructive font-bold flex items-center gap-2">
                                <ShieldAlert className="size-3.5 sm:size-4 shrink-0" />
                                Action Required
                            </p>
                            <p className="text-[10px] sm:text-xs text-destructive/80 mt-1 leading-relaxed">
                                Type{" "}
                                <span className="font-black break-all">
                                    &quot;{admin.name}&quot;
                                </span>{" "}
                                below to confirm this terminal action.
                            </p>
                        </div>

                        <Input
                            type="text"
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder="Confirm name..."
                            className="h-12 sm:h-14 rounded-xl border-2 border-destructive/20 focus:border-destructive transition-all font-serif text-base sm:text-lg text-center"
                        />

                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-full font-serif font-bold italic h-11 sm:h-12"
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    setDeleteConfirmName("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 rounded-full shadow-lg shadow-destructive/20 font-serif font-black h-11 sm:h-12"
                                onClick={handleDelete}
                                disabled={deleteConfirmName !== admin.name || isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin mr-2" />
                                        Revoking...
                                    </>
                                ) : (
                                    "Confirm Revocation"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function AdminCardSkeleton() {
    return (
        <Card className="rounded-2xl sm:rounded-[2rem] border-2 border-[#E8E4D8] overflow-hidden shadow-lg bg-white animate-pulse">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <div className="size-12 sm:size-14 rounded-xl sm:rounded-2xl bg-muted/50 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-5 sm:h-6 bg-muted/50 rounded-lg w-3/4" />
                        <div className="h-3 sm:h-4 bg-muted/30 rounded w-full" />
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-10 bg-muted/30 rounded-xl w-full" />
                    <div className="h-10 bg-muted/30 rounded-xl w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

function TableRowSkeleton() {
    return (
        <TableRow className="animate-pulse">
            <TableCell className="px-6 lg:px-8 py-5 lg:py-6">
                <div className="flex items-center gap-3 lg:gap-4">
                    <div className="size-12 lg:size-14 rounded-xl lg:rounded-2xl bg-muted/50 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-5 lg:h-6 bg-muted/50 rounded-lg w-48" />
                        <div className="h-3 lg:h-4 bg-muted/30 rounded w-36" />
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-center">
                <div className="h-6 bg-muted/30 rounded-full w-24 mx-auto" />
            </TableCell>
            <TableCell>
                <div className="space-y-1.5">
                    <div className="h-5 bg-muted/40 rounded w-32" />
                    <div className="h-3 bg-muted/20 rounded w-24" />
                </div>
            </TableCell>
            <TableCell className="px-6 lg:px-8">
                <div className="flex justify-end gap-2">
                    <div className="size-9 sm:size-10 bg-muted/30 rounded-xl" />
                    <div className="size-9 sm:size-10 bg-muted/30 rounded-xl" />
                    <div className="size-9 sm:size-10 bg-muted/30 rounded-xl" />
                </div>
            </TableCell>
        </TableRow>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ searchTerm }: { searchTerm: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4">
            <div className="size-16 sm:size-20 rounded-2xl sm:rounded-3xl bg-muted/30 flex items-center justify-center mb-4 sm:mb-6">
                <ShieldAlert className="size-8 sm:size-10 text-muted-foreground/40" />
            </div>
            <p className="font-serif italic text-base sm:text-lg md:text-xl text-muted-foreground text-center max-w-sm">
                {searchTerm
                    ? "No administrators found matching your search."
                    : "No administrators have been added yet."}
            </p>
            {searchTerm && (
                <p className="text-xs sm:text-sm text-muted-foreground/60 mt-2 font-serif">
                    Try adjusting your search terms
                </p>
            )}
        </div>
    );
}

// ─── Admin Card (Mobile) ──────────────────────────────────────────────────────

function AdminCard({
    admin,
    onUpdate,
    onSelect,
}: {
    admin: any;
    onUpdate: () => void;
    onSelect: () => void;
}) {
    return (
        <Card
            className="rounded-2xl sm:rounded-[2rem] border-2 border-[#E8E4D8] overflow-hidden shadow-lg bg-white hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer active:scale-[0.99]"
            onClick={onSelect}
        >
            <CardContent className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <Avatar className="size-12 sm:size-14 rounded-xl sm:rounded-2xl border-2 border-primary/20 shrink-0">
                        <AvatarFallback className="bg-primary/5 text-primary font-black text-base sm:text-lg rounded-xl sm:rounded-2xl">
                            {(admin.name as string)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="font-serif font-bold text-base sm:text-lg text-foreground leading-tight truncate">
                            {admin.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Mail className="size-3 text-muted-foreground shrink-0" />
                            <span className="text-xs sm:text-sm text-muted-foreground font-serif italic truncate">
                                {admin.email}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info Rows */}
                <div className="space-y-2.5 mb-4">
                    <div className="flex items-center justify-between py-2.5 px-3 bg-muted/20 rounded-xl">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Security Level
                        </span>
                        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                            <Lock className="size-2.5" />
                            Superuser
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2.5 px-3 bg-muted/20 rounded-xl">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Role
                        </span>
                        <div className="flex items-center gap-1.5">
                            <UserCheck className="size-3 text-primary/60 shrink-0" />
                            <span className="text-xs sm:text-sm font-serif font-bold text-foreground truncate max-w-[120px] sm:max-w-[160px]">
                                {admin.role}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div
                    className="pt-3 border-t border-[#E8E4D8]/50"
                    onClick={(e) => e.stopPropagation()}
                >
                    <AdminActions admin={admin} onUpdate={onUpdate} onView={onSelect} />
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminAdminsTab() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const data = await AdminManagementService.getAllAdmins();

            const { db } = await import("@/lib/firebase");
            const { getDoc, doc } = await import("firebase/firestore");

            const adminsWithInfo = await Promise.all(
                data.map(async (a) => {
                    const userSnap = await getDoc(doc(db, "users", a.user_id));
                    const userData = userSnap.exists()
                        ? userSnap.data()
                        : { name: "System Admin", email: "admin@lead-life.com" };
                    return {
                        ...a,
                        name: userData.name || a.title || "Administrator",
                        email: userData.email,
                        status: a.is_active ? "Active" : "Inactive",
                        role: a.title || "System Administrator",
                    };
                })
            );

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
        return admins.filter(
            (admin) =>
                (admin.name?.toLowerCase() || "").includes(
                    searchTerm.toLowerCase()
                ) ||
                (admin.email?.toLowerCase() || "").includes(
                    searchTerm.toLowerCase()
                ) ||
                (admin.role?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, admins]);

    const selectedAdmin = useMemo(() => {
        return admins.find((a) => a.id === selectedId);
    }, [selectedId, admins]);

    // ─── Detail View ──────────────────────────────────────────────────────────

    if (selectedId && selectedAdmin) {
        return (
            <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedId(null)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-full transition-all font-serif font-bold italic px-3 sm:px-4 h-10"
                >
                    <ArrowLeft className="size-4" />
                    <span className="hidden sm:inline">Back to Governance Hub</span>
                    <span className="sm:hidden">Back</span>
                </Button>

                <div className="bg-white rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] p-4 sm:p-6 md:p-8 shadow-xl sm:shadow-2xl border-2 sm:border-4 border-primary/10">
                    <UserProfileDetail
                        user={{
                            ...selectedAdmin,
                            role: "Administrator",
                            location: "HQ - Addis Ababa",
                            joinedDate: new Date(
                                selectedAdmin.created_at
                            ).toLocaleDateString(),
                        }}
                        isEditable={true}
                    />
                </div>
            </div>
        );
    }

    // ─── Main List View ───────────────────────────────────────────────────────

    return (
        <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-500 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
                    <div className="space-y-2 sm:space-y-3 flex-1">
                        <p className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary font-black">
                            Internal Governance
                        </p>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight">
                            Governance Hub
                        </h1>
                        <p className="text-muted-foreground max-w-2xl font-serif italic text-sm sm:text-base md:text-lg leading-relaxed">
                            Manage system-level access, oversight and permissions for the
                            Lead Life orchestrators.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
                        <AdminCreationForm onAdminCreated={fetchAdmins} />
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8]/50 shadow-sm">
                    <div className="relative w-full sm:flex-1 sm:max-w-md">
                        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-primary/40 size-4 sm:size-5" />
                        <Input
                            placeholder="Search orchestrators..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 sm:pl-12 h-11 sm:h-12 rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif italic text-sm sm:text-base"
                        />
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground text-xs sm:text-sm font-serif italic font-medium px-2 py-1">
                        <Users className="size-4 text-primary/40 hidden sm:block" />
                        <span>
                            Showing{" "}
                            <span className="text-primary font-black not-italic">
                                {filteredAdmins.length}
                            </span>{" "}
                            <span className="hidden xs:inline">administrators</span>
                            <span className="xs:hidden">admin(s)</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobile Card View (< lg) */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
                {loading ? (
                    Array(3)
                        .fill(0)
                        .map((_, i) => <AdminCardSkeleton key={i} />)
                ) : filteredAdmins.length === 0 ? (
                    <Card className="rounded-2xl sm:rounded-[2rem] border-2 border-[#E8E4D8] overflow-hidden shadow-lg bg-white">
                        <EmptyState searchTerm={searchTerm} />
                    </Card>
                ) : (
                    filteredAdmins.map((admin) => (
                        <AdminCard
                            key={admin.id}
                            admin={admin}
                            onUpdate={fetchAdmins}
                            onSelect={() => setSelectedId(admin.id)}
                        />
                    ))
                )}
            </div>

            {/* Desktop Table View (≥ lg) */}
            <div className="hidden lg:block">
                <Card className="rounded-2xl xl:rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden shadow-xl bg-white">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-b-2 border-[#E8E4D8]/50">
                                        <TableHead className="font-serif font-black px-6 lg:px-8 h-14 lg:h-16 text-sm lg:text-base whitespace-nowrap">
                                            Orchestrator
                                        </TableHead>
                                        <TableHead className="font-serif font-black h-14 lg:h-16 text-center text-sm lg:text-base whitespace-nowrap">
                                            Security Level
                                        </TableHead>
                                        <TableHead className="font-serif font-black h-14 lg:h-16 text-sm lg:text-base whitespace-nowrap">
                                            Governance Role
                                        </TableHead>
                                        <TableHead className="font-serif font-black h-14 lg:h-16 text-right px-6 lg:px-8 text-sm lg:text-base whitespace-nowrap">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array(3)
                                            .fill(0)
                                            .map((_, i) => <TableRowSkeleton key={i} />)
                                    ) : filteredAdmins.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4}>
                                                <EmptyState searchTerm={searchTerm} />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredAdmins.map((admin) => (
                                            <TableRow
                                                key={admin.id}
                                                className="group hover:bg-primary/5 cursor-pointer transition-all border-b border-[#E8E4D8]/30"
                                                onClick={() => setSelectedId(admin.id)}
                                            >
                                                <TableCell className="px-6 lg:px-8 py-5 lg:py-6">
                                                    <div className="flex items-center gap-3 lg:gap-4">
                                                        <Avatar className="size-12 lg:size-14 rounded-xl lg:rounded-2xl border-2 border-primary/20 group-hover:border-primary group-hover:-rotate-2 transition-all ring-offset-2 group-hover:ring-2 ring-primary/10 shrink-0">
                                                            <AvatarFallback className="bg-primary/5 text-primary font-black text-base lg:text-lg rounded-xl lg:rounded-2xl">
                                                                {(admin.name as string)
                                                                    .split(" ")
                                                                    .map((n) => n[0])
                                                                    .join("")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="font-serif font-bold text-base lg:text-lg xl:text-xl text-foreground group-hover:text-primary transition-colors leading-tight truncate max-w-[200px] xl:max-w-[280px]">
                                                                {admin.name}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <Mail className="size-3 text-muted-foreground shrink-0" />
                                                                <span className="text-xs lg:text-sm text-muted-foreground font-serif italic truncate max-w-[180px] xl:max-w-[240px]">
                                                                    {admin.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1 lg:py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] lg:text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                                        <Lock className="size-2.5 lg:size-3" />
                                                        Superuser
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-serif font-bold text-sm lg:text-base text-foreground flex items-center gap-2">
                                                            <UserCheck className="size-3 lg:size-4 text-primary/60 shrink-0" />
                                                            <span className="truncate max-w-[140px] xl:max-w-[200px]">
                                                                {admin.role}
                                                            </span>
                                                        </span>
                                                        <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-0.5">
                                                            Lead Life Internal
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                <TableCell
                                                    className="text-right px-6 lg:px-8"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <AdminActions
                                                        admin={admin}
                                                        onUpdate={fetchAdmins}
                                                        onView={() => setSelectedId(admin.id)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}