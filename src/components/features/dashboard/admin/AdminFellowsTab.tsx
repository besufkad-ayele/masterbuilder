"use client";

import { useMemo, useState, useEffect } from "react";
import {
    Search,
    MoreHorizontal,
    Trash2,
    ArrowLeft,
    Building2,
    ChevronRight,
    User as UserIcon,
    Mail,
    ShieldAlert,
    TrendingUp,
    Loader2,
    Users,
    Briefcase,
    Circle,
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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { companyService } from "@/services/companyService";
import { cn } from "@/lib/utils";
import FellowCreationForm from "./FellowCreationForm";
import FellowUpdateForm from "./FellowUpdateForm";
import FellowProgressTracker from "./FellowProgressTracker";
import UserProfileDetail from "./UserProfileDetail";
import { FellowService } from "@/services/FellowService";
import { Company, FellowProfile } from "@/types";

// ─── Fellow Actions Component ─────────────────────────────────────────────────

function FellowActions({
    fellow,
    onUpdate,
    onView,
}: {
    fellow: any;
    onUpdate?: () => void;
    onView: () => void;
}) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        const name = fellow.full_name || fellow.name;
        if (deleteConfirmName === name) {
            setIsDeleting(true);
            try {
                await FellowService.deleteFellow(fellow.id, fellow.user_id);
                setIsDeleteDialogOpen(false);
                setDeleteConfirmName("");
                if (onUpdate) onUpdate();
            } catch (error) {
                console.error("Error deleting fellow:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            <Button
                variant="ghost"
                size="sm"
                onClick={onView}
                className="size-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                title="View Fellow Details"
            >
                <ChevronRight className="size-4" />
            </Button>

            <FellowUpdateForm
                fellow={fellow}
                onFellowUpdated={() => {
                    if (onUpdate) onUpdate();
                }}
                trigger={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                        title="Update Profile"
                    >
                        <UserIcon className="size-3.5" />
                    </Button>
                }
            />

            <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
                onClick={() => setIsDeleteDialogOpen(true)}
                title="Remove Fellow"
            >
                <Trash2 className="size-3.5" />
            </Button>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[400px] rounded-2xl sm:rounded-[1.5rem] border-2 border-destructive/20 p-4 sm:p-5 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-1.5">
                        <DialogTitle className="text-base sm:text-lg font-serif font-bold text-destructive">
                            Confirm Deletion
                        </DialogTitle>
                        <DialogDescription className="font-serif italic text-sm">
                            This will permanently remove the fellow and their account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 sm:space-y-4 py-2">
                        <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/10">
                            <p className="text-xs text-destructive font-bold flex items-center gap-1.5">
                                <ShieldAlert className="size-3.5 shrink-0" />
                                Action Required
                            </p>
                            <p className="text-[10px] sm:text-xs text-destructive/80 mt-1">
                                Type{" "}
                                <span className="font-black">
                                    &quot;{fellow.full_name || fellow.name}&quot;
                                </span>{" "}
                                to confirm.
                            </p>
                        </div>

                        <Input
                            type="text"
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder="Type name here..."
                            className="h-10 rounded-lg border-2 border-destructive/20 focus:border-destructive text-sm"
                        />

                        <div className="flex gap-2 pt-1">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-full h-9 text-sm font-medium"
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    setDeleteConfirmName("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 rounded-full h-9 text-sm font-medium shadow-sm"
                                onClick={handleDelete}
                                disabled={
                                    deleteConfirmName !== (fellow.full_name || fellow.name) ||
                                    isDeleting
                                }
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Loading Skeletons ────────────────────────────────────────────────────────

function FellowCardSkeleton() {
    return (
        <div className="p-3 rounded-xl border border-[#E8E4D8] bg-white animate-pulse">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-muted/50 shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-muted/50 rounded w-2/3" />
                    <div className="h-3 bg-muted/30 rounded w-1/2" />
                </div>
                <div className="h-5 w-14 bg-muted/30 rounded-full" />
            </div>
        </div>
    );
}

function TableRowSkeleton() {
    return (
        <TableRow className="animate-pulse">
            <TableCell className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-muted/50 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-4 bg-muted/50 rounded w-36" />
                        <div className="h-3 bg-muted/30 rounded w-28" />
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="h-4 bg-muted/40 rounded w-28" />
            </TableCell>
            <TableCell className="text-center">
                <div className="h-5 bg-muted/30 rounded-full w-16 mx-auto" />
            </TableCell>
            <TableCell className="px-5">
                <div className="flex justify-end gap-1">
                    <div className="size-8 bg-muted/30 rounded-lg" />
                    <div className="size-8 bg-muted/30 rounded-lg" />
                    <div className="size-8 bg-muted/30 rounded-lg" />
                </div>
            </TableCell>
        </TableRow>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ searchTerm }: { searchTerm: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 sm:py-12 px-4">
            <div className="size-12 sm:size-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
                <UserIcon className="size-6 sm:size-7 text-muted-foreground/40" />
            </div>
            <p className="font-serif italic text-sm sm:text-base text-muted-foreground text-center max-w-xs">
                {searchTerm
                    ? "No fellows found matching your search."
                    : "No fellows have been enrolled yet."}
            </p>
        </div>
    );
}

// ─── Fellow Card (Mobile) - Medium & Beautiful ────────────────────────────────

function FellowCard({
    fellow,
    onUpdate,
    onSelect,
}: {
    fellow: any;
    onUpdate: () => void;
    onSelect: () => void;
}) {
    const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
        Active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
        Onboarding: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
        Paused: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    };

    const status = statusConfig[fellow.status] || {
        bg: "bg-gray-50",
        text: "text-gray-700",
        dot: "bg-gray-500",
    };

    return (
        <div
            onClick={onSelect}
            className="group relative bg-white rounded-xl sm:rounded-2xl border border-[#E8E4D8] p-3 sm:p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 cursor-pointer active:scale-[0.99]"
        >
            {/* Top Row: Avatar, Name, Status */}
            <div className="flex items-center gap-3 mb-3">
                <Avatar className="size-10 sm:size-11 rounded-xl border-2 border-primary/10 group-hover:border-primary/30 transition-colors shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold text-sm rounded-xl">
                        {(fellow.name as string)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                        {fellow.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail className="size-3 text-muted-foreground/60 shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                            {fellow.email}
                        </span>
                    </div>
                </div>

                {/* Status Badge */}
                <div
                    className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full shrink-0",
                        status.bg
                    )}
                >
                    <Circle className={cn("size-1.5 fill-current", status.text)} />
                    <span className={cn("text-[10px] font-semibold", status.text)}>
                        {fellow.status}
                    </span>
                </div>
            </div>

            {/* Bottom Row: Company & Actions */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#E8E4D8]/60">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="size-3.5 text-primary/50 shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground truncate max-w-[140px] sm:max-w-[180px]">
                        {fellow.companyName}
                    </span>
                    {fellow.department && (
                        <>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[10px] text-muted-foreground/60 truncate max-w-[60px]">
                                {fellow.department}
                            </span>
                        </>
                    )}
                </div>

                <FellowActions fellow={fellow} onUpdate={onUpdate} onView={onSelect} />
            </div>

            {/* Hover Accent */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl" />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminFellowsTab() {
    const [fellows, setFellows] = useState<any[]>([]);
    const [, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"profile" | "progress">("profile");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fellowData, companyData] = await Promise.all([
                FellowService.getAllFellows(),
                companyService.getAll(),
            ]);

            setCompanies(companyData);
            setFellows(
                fellowData.map((f: FellowProfile) => ({
                    ...f,
                    name: f.full_name,
                    companyName:
                        f.organization ||
                        companyData.find((c) => c.id === f.company_id)?.name ||
                        "Unknown",
                }))
            );
        } catch (error) {
            console.error("Error fetching fellow data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredFellows = useMemo(() => {
        return fellows.filter(
            (f) =>
                f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, fellows]);

    const selectedFellow = useMemo(() => {
        return fellows.find((f) => f.id === selectedId);
    }, [selectedId, fellows]);

    // ─── Detail View ──────────────────────────────────────────────────────────

    if (selectedId && selectedFellow) {
        return (
            <div className="w-full max-w-full overflow-hidden space-y-3 sm:space-y-4 md:space-y-5 px-1 sm:px-2 md:px-4 py-3 sm:py-4">
                {/* Header with Back Button and Tab Switcher */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedId(null)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-full transition-all font-medium px-3 h-9"
                    >
                        <ArrowLeft className="size-4" />
                        <span className="hidden sm:inline">Back to Fellows</span>
                        <span className="sm:hidden">Back</span>
                    </Button>

                    {/* Tab Switcher */}
                    <div className="flex items-center gap-1 p-1 bg-white rounded-full border border-[#E8E4D8] shadow-sm w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={cn(
                                "flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-full font-medium text-xs sm:text-sm transition-all",
                                activeTab === "profile"
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            )}
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab("progress")}
                            className={cn(
                                "flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-full font-medium text-xs sm:text-sm transition-all",
                                activeTab === "progress"
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            )}
                        >
                            Progress
                        </button>
                    </div>
                </div>

                {/* Content based on active tab */}
                {activeTab === "profile" ? (
                    <div className="bg-white rounded-2xl sm:rounded-[1.75rem] md:rounded-[2rem] p-3 sm:p-4 md:p-6 shadow-lg border border-primary/10 overflow-hidden animate-in fade-in duration-300">
                        <UserProfileDetail
                            user={{
                                ...selectedFellow,
                                role: "Fellow",
                                company: selectedFellow.companyName,
                                location: "Addis Ababa, Ethiopia",
                                joinedDate: new Date(
                                    selectedFellow.created_at
                                ).toLocaleDateString(),
                            }}
                            isEditable={true}
                            onUpdate={fetchData}
                        />
                    </div>
                ) : (
                    <div className="w-full max-w-full overflow-hidden bg-white rounded-2xl sm:rounded-[1.75rem] md:rounded-[2rem] p-3 sm:p-4 md:p-5 shadow-lg border border-primary/10 animate-in fade-in duration-300">
                        {/* Progress Header */}
                        <div className="flex items-center gap-2.5 sm:gap-3 mb-4 pb-4 border-b border-dashed border-[#E8E4D8]">
                            <div className="size-9 sm:size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <TrendingUp className="size-4 sm:size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary/70">
                                    Progress Dashboard
                                </p>
                                <p className="text-sm sm:text-base font-semibold text-foreground leading-tight truncate">
                                    {selectedFellow.full_name || selectedFellow.name}
                                </p>
                            </div>
                        </div>

                        <FellowProgressTracker
                            fellowId={selectedFellow.id}
                            fellowName={selectedFellow.full_name || selectedFellow.name}
                            userId={selectedFellow.user_id}
                        />
                    </div>
                )}
            </div>
        );
    }

    // ─── Main List View ───────────────────────────────────────────────────────

    return (
        <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-in fade-in duration-500 px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:gap-5">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="space-y-1.5 sm:space-y-2 flex-1">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                            Member Directory
                        </p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight">
                            Fellowship Workspace
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl font-serif italic leading-relaxed">
                            Manage all fellows enrolled across companies and oversee their progress.
                        </p>
                    </div>

                    <div className="shrink-0">
                        <FellowCreationForm onFellowCreated={fetchData} />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#E8E4D8] shadow-sm">
                    <div className="relative w-full sm:flex-1 sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-4" />
                        <Input
                            placeholder="Search fellows..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 rounded-lg sm:rounded-xl border-[#E8E4D8] focus:border-primary text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-medium px-2">
                        <Users className="size-3.5 text-primary/50" />
                        <span>
                            <span className="text-primary font-semibold">{filteredFellows.length}</span> fellows
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobile Card View (< lg) */}
            <div className="lg:hidden space-y-2 sm:space-y-2.5">
                {loading ? (
                    Array(5)
                        .fill(0)
                        .map((_, i) => <FellowCardSkeleton key={i} />)
                ) : filteredFellows.length === 0 ? (
                    <div className="rounded-xl border border-[#E8E4D8] bg-white">
                        <EmptyState searchTerm={searchTerm} />
                    </div>
                ) : (
                    filteredFellows.map((fellow) => (
                        <FellowCard
                            key={fellow.id}
                            fellow={fellow}
                            onUpdate={fetchData}
                            onSelect={() => {
                                setSelectedId(fellow.id);
                                setActiveTab("profile");
                            }}
                        />
                    ))
                )}
            </div>

            {/* Desktop Table View (≥ lg) */}
            <div className="hidden lg:block">
                <Card className="rounded-2xl border border-[#E8E4D8] overflow-hidden shadow-md bg-white">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow className="hover:bg-transparent border-b border-[#E8E4D8]">
                                        <TableHead className="font-semibold px-5 h-12 text-sm">
                                            Fellow
                                        </TableHead>
                                        <TableHead className="font-semibold h-12 text-sm">
                                            Company
                                        </TableHead>
                                        <TableHead className="font-semibold h-12 text-center text-sm">
                                            Status
                                        </TableHead>
                                        <TableHead className="font-semibold h-12 text-right px-5 text-sm">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array(5)
                                            .fill(0)
                                            .map((_, i) => <TableRowSkeleton key={i} />)
                                    ) : filteredFellows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4}>
                                                <EmptyState searchTerm={searchTerm} />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredFellows.map((fellow) => (
                                            <TableRow
                                                key={fellow.id}
                                                className="group hover:bg-primary/[0.02] cursor-pointer transition-colors border-b border-[#E8E4D8]/50"
                                                onClick={() => {
                                                    setSelectedId(fellow.id);
                                                    setActiveTab("profile");
                                                }}
                                            >
                                                <TableCell className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-10 rounded-xl border-2 border-primary/10 group-hover:border-primary/30 transition-colors shrink-0">
                                                            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold text-sm rounded-xl">
                                                                {(fellow.name as string)
                                                                    .split(" ")
                                                                    .map((n) => n[0])
                                                                    .join("")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
                                                                {fellow.name}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <Mail className="size-3 text-muted-foreground/50 shrink-0" />
                                                                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                                    {fellow.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <Building2 className="size-3.5 text-primary/50 shrink-0" />
                                                        <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                                                            {fellow.companyName}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    {(() => {
                                                        const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
                                                            Active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
                                                            Onboarding: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
                                                            Paused: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
                                                        };
                                                        const status = statusConfig[fellow.status] || {
                                                            bg: "bg-gray-50",
                                                            text: "text-gray-700",
                                                            dot: "bg-gray-500",
                                                        };
                                                        return (
                                                            <div
                                                                className={cn(
                                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                                                                    status.bg
                                                                )}
                                                            >
                                                                <Circle className={cn("size-1.5 fill-current", status.text)} />
                                                                <span className={cn("text-xs font-medium", status.text)}>
                                                                    {fellow.status}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </TableCell>

                                                <TableCell
                                                    className="text-right px-5"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <FellowActions
                                                        fellow={fellow}
                                                        onUpdate={fetchData}
                                                        onView={() => {
                                                            setSelectedId(fellow.id);
                                                            setActiveTab("profile");
                                                        }}
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