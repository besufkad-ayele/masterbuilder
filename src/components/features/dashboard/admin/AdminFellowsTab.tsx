"use client";

import { useMemo, useState, useEffect, type ChangeEvent } from "react";
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
    FileSpreadsheet,
    Layers,
    FolderKanban,
    GraduationCap,
    Filter,
    Download,
    Upload,
    AlertTriangle,
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
import { CohortService } from "@/services/CohortService";
import { cn } from "@/lib/utils";
import FellowCreationForm from "./FellowCreationForm";
import FellowUpdateForm from "./FellowUpdateForm";
import FellowProgressTracker from "./FellowProgressTracker";
import UserProfileDetail from "./UserProfileDetail";
import { FellowService } from "@/services/FellowService";
import { ExamService } from "@/services/ExamService";
import { FellowProgressService } from "@/services/FellowProgressService";
import { exportFellowsPerformanceWorkbook } from "@/lib/export/fellowPerformanceExport";
import { parseFellowImportFile, buildFellowImportPayload, type ParsedFellowImportRow } from "@/lib/import/fellowImport";
import { Company, FellowProfile, Cohort } from "@/types";

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

function CohortCardSkeleton() {
    return (
        <div className="p-5 rounded-2xl border border-[#E8E4D8] bg-white animate-pulse space-y-4">
            <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-muted/50 rounded-full" />
                <div className="h-5 w-16 bg-muted/30 rounded-full" />
            </div>
            <div className="h-6 bg-muted/50 rounded w-3/4" />
            <div className="h-4 bg-muted/30 rounded w-1/2" />
            <div className="pt-4 border-t border-[#E8E4D8]/60 flex justify-between">
                <div className="h-5 w-20 bg-muted/40 rounded" />
                <div className="h-5 w-20 bg-muted/40 rounded" />
            </div>
        </div>
    );
}

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
                    : "No fellows have been enrolled in this cohort yet."}
            </p>
        </div>
    );
}

// ─── Cohort Card Component ───────────────────────────────────────────────────

function CohortCard({
    cohort,
    companyName,
    fellowCount,
    onSelect,
}: {
    cohort: Cohort;
    companyName: string;
    fellowCount: number;
    onSelect: () => void;
}) {
    const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
        active: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
        upcoming: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
        completed: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
        archived: { bg: "bg-gray-50 border-gray-200", text: "text-gray-600", dot: "bg-gray-400" },
    };

    const status = statusConfig[cohort.status?.toLowerCase()] || {
        bg: "bg-gray-50 border-gray-200",
        text: "text-gray-700",
        dot: "bg-gray-500",
    };

    const waveLevelColors: Record<string, string> = {
        Basic: "bg-blue-100 text-blue-800 border-blue-200",
        Intermediate: "bg-amber-100 text-amber-800 border-amber-200",
        Advanced: "bg-purple-100 text-purple-800 border-purple-200",
        Expert: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };

    return (
        <div
            onClick={onSelect}
            className="group relative bg-white rounded-2xl border border-[#E8E4D8] p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 cursor-pointer active:scale-[0.99] flex flex-col justify-between"
        >
            <div>
                {/* Top Header: Wave Level & Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                            waveLevelColors[cohort.wave_level] || "bg-gray-100 text-gray-700"
                        )}
                    >
                        <Layers className="size-3 mr-1 inline" />
                        {cohort.wave_level || "Standard"} Level
                    </Badge>

                    <div className={cn("flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium", status.bg)}>
                        <Circle className={cn("size-1.5 fill-current", status.text)} />
                        <span className={cn("capitalize", status.text)}>{cohort.status}</span>
                    </div>
                </div>

                {/* Title & Company */}
                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {cohort.name}
                </h3>

                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <Building2 className="size-3.5 text-primary/60 shrink-0" />
                    <span className="truncate font-medium">{companyName}</span>
                </div>

                {cohort.description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-2 font-serif italic">
                        {cohort.description}
                    </p>
                )}
            </div>

            {/* Footer: Fellow Count & Arrow */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E8E4D8]/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="size-3.5 text-primary" />
                    </div>
                    <span>{fellowCount} {fellowCount === 1 ? "Fellow" : "Fellows"}</span>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                    <span>View Fellows</span>
                    <ChevronRight className="size-4" />
                </div>
            </div>
        </div>
    );
}

// ─── Special Summary Cohort Card Component ─────────────────────────────────────

function SummaryCohortCard({
    title,
    subtitle,
    fellowCount,
    icon: Icon,
    variant = "primary",
    onSelect,
}: {
    title: string;
    subtitle: string;
    fellowCount: number;
    icon: any;
    variant?: "primary" | "secondary";
    onSelect: () => void;
}) {
    return (
        <div
            onClick={onSelect}
            className={cn(
                "group relative rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl cursor-pointer active:scale-[0.99] flex flex-col justify-between",
                variant === "primary"
                    ? "bg-gradient-to-br from-primary/5 via-white to-primary/10 border-primary/20 hover:border-primary/50"
                    : "bg-white border-[#E8E4D8] hover:border-primary/40"
            )}
        >
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="size-5" />
                    </div>
                    <Badge variant="secondary" className="font-bold text-xs bg-primary/10 text-primary border-none">
                        Full Directory
                    </Badge>
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-serif italic">
                    {subtitle}
                </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E8E4D8]/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <span className="text-sm font-bold">{fellowCount}</span>
                    <span>{fellowCount === 1 ? "Fellow" : "Fellows"} Total</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                    <span>Open List</span>
                    <ChevronRight className="size-4" />
                </div>
            </div>
        </div>
    );
}

// ─── Fellow Card (Mobile) ─────────────────────────────────────────────────────

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

            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl" />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminFellowsTab() {
    const [fellows, setFellows] = useState<any[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [cohortSearchTerm, setCohortSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"profile" | "progress">("profile");
    const [isExporting, setIsExporting] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importRows, setImportRows] = useState<ParsedFellowImportRow[]>([]);
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedImportCompanyId, setSelectedImportCompanyId] = useState("");
    const [importFileName, setImportFileName] = useState("");

    const handleDownloadTemplate = () => {
        const headers = [
            "full_name",
            "email",
            "company_id",
            "organization",
            "highest_qualification",
            "current_role",
            "leadership_experience_years",
            "learning_goals",
            "gender",
            "age",
            "primary_language",
            "availability",
            "leadership_track",
            "key_skills",
            "personality_style",
            "constraints",
        ];

        const templateRow = [
            "Jane Doe",
            "jane@example.com",
            companies[0]?.id || "COMP_001",
            "Finance",
            "MBA",
            "Senior Finance Manager",
            "7",
            "Leadership Growth, Finance Excellence",
            "Female",
            "34",
            "English",
            "Weekdays (Morning)",
            "Financial Strategy",
            "Budgeting, Strategy",
            "Analytical and collaborative",
            "No travel restrictions",
        ];

        const csvContent = [headers.join(","), templateRow.join(",")].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "fellow-import-template.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportError(null);
        setImportFileName(file.name);

        try {
            const parsed = await parseFellowImportFile(file, companies, cohorts);
            if (!parsed.length) {
                setImportRows([]);
                setImportError("No rows were found in the selected file.");
                return;
            }

            const invalidRows = parsed.filter((row) => row.errors.length > 0);
            setImportRows(parsed);
            if (parsed.length > 0 && invalidRows.length === parsed.length) {
                setImportError("The file was read, but no valid fellow rows were found. Check the headers and required fields.");
            }
        } catch (error: any) {
            setImportError(error?.message || "Failed to parse the selected Excel file.");
        }
    };

    const handleImportSubmit = async () => {
        const validRows = importRows.filter((row) => row.errors.length === 0);

        if (!validRows.length) {
            setImportError("Please upload a file with valid fellow rows before importing.");
            return;
        }

        const companyIdToUse = selectedImportCompanyId || validRows[0]?.company_id;
        if (!companyIdToUse) {
            setImportError("Please select a company or include a company column in the spreadsheet.");
            return;
        }

        setIsImporting(true);
        setImportError(null);

        let createdCount = 0;
        const issues: string[] = [];

        for (const row of validRows) {
            const finalCompanyId = row.company_id || companyIdToUse;
            const selectedCompany = companies.find((company) => company.id === finalCompanyId);

            try {
                const payload = buildFellowImportPayload(row, finalCompanyId, selectedCompany?.name);
                if (!payload.full_name || !payload.email || !payload.company_id) {
                    issues.push(`Row ${row.rowNumber}: missing full name, email, or company.`);
                    continue;
                }

                await FellowService.createFellowWithAuth(row.email, row.full_name, payload);
                createdCount += 1;
            } catch (error: any) {
                const message = error?.message || "unknown error";
                issues.push(`Row ${row.rowNumber}: ${message}`);
            }
        }

        setIsImporting(false);
        setImportRows([]);
        setImportFileName("");

        if (createdCount > 0) {
            await fetchData();
        }

        setImportDialogOpen(false);

        if (issues.length > 0) {
            setImportError(`Imported ${createdCount} fellows. ${issues.length} row(s) failed: ${issues.slice(0, 5).join("; ")}`);
        } else if (createdCount > 0) {
            setImportError(null);
        }
    };

    const handleExportToExcel = async () => {
        const targetFellows = selectedCohortId && selectedCohortId !== "all"
            ? selectedCohortId === "unassigned"
                ? fellows.filter((f) => !f.cohort_id)
                : fellows.filter((f) => f.cohort_id === selectedCohortId)
            : fellows;

        if (!targetFellows.length || isExporting) return;
        setIsExporting(true);

        try {
            const [allCompetencies, behavioralIndicators, allWaves, allWaveCompetencies, fellowReports] =
                await Promise.all([
                    FellowProgressService.getAllCompetencies(),
                    FellowProgressService.getAllBehavioralIndicators(),
                    FellowProgressService.getAllWaves(),
                    FellowProgressService.getAllWaveCompetencies(),
                    Promise.all(
                        targetFellows.map(async (fellow) => {
                            const [progress, portfolios, groundingResults, examAttempts] =
                                await Promise.all([
                                    FellowProgressService.getPhaseProgressByFellow(fellow.user_id),
                                    FellowProgressService.getPortfoliosByFellow(fellow.user_id),
                                    FellowProgressService.getGroundingResultsByFellow(fellow.user_id),
                                    ExamService.getAttemptsByUser(fellow.user_id),
                                ]);

                            return {
                                fellow,
                                progress,
                                portfolios,
                                groundingResults,
                                examAttempts,
                            };
                        })
                    ),
                ]);

            let exportCompetencies = allCompetencies;
            let exportWaves = allWaves;
            let exportWaveCompetencies = allWaveCompetencies;

            if (selectedCohortId && selectedCohortId !== "all" && selectedCohortId !== "unassigned") {
                const cohortWaves = allWaves.filter((w) => w.cohort_id === selectedCohortId);
                const cohortWaveIds = new Set(cohortWaves.map((w) => w.id));
                const cohortWaveCompetencies = allWaveCompetencies.filter((wc) => cohortWaveIds.has(wc.wave_id));
                const cohortCompetencyIds = new Set(cohortWaveCompetencies.map((wc) => wc.competency_id));

                if (cohortCompetencyIds.size > 0) {
                    exportCompetencies = allCompetencies.filter((c) => cohortCompetencyIds.has(c.id));
                }
                exportWaves = cohortWaves;
                exportWaveCompetencies = cohortWaveCompetencies;
            }

            const cohortNameSlug = activeCohort?.name
                ? activeCohort.name.toLowerCase().replace(/[^a-z0-9]/g, "-")
                : "cohort";

            await exportFellowsPerformanceWorkbook({
                fellowReports,
                competencies: exportCompetencies,
                behavioralIndicators,
                waves: exportWaves,
                waveCompetencies: exportWaveCompetencies,
                fileName: `fellows-performance-${cohortNameSlug}-${new Date().toISOString().slice(0, 10)}.xlsx`,
            });
        } catch (error) {
            console.error("Failed to export fellows report:", error);
        } finally {
            setIsExporting(false);
        }
    };


    const fetchData = async () => {
        setLoading(true);
        try {
            const [fellowData, companyData, cohortData] = await Promise.all([
                FellowService.getAllFellows(),
                companyService.getAll(),
                CohortService.getAllCohorts(),
            ]);

            setCompanies(companyData);
            setCohorts(cohortData);
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

    // Active selected cohort object
    const activeCohort = useMemo(() => {
        if (!selectedCohortId || selectedCohortId === "all" || selectedCohortId === "unassigned") {
            return null;
        }
        return cohorts.find((c) => c.id === selectedCohortId) || null;
    }, [selectedCohortId, cohorts]);

    // Cohorts filtered by search
    const filteredCohorts = useMemo(() => {
        return cohorts.filter((c) => {
            const companyName = companies.find((comp) => comp.id === c.company_id)?.name || "";
            return (
                c.name.toLowerCase().includes(cohortSearchTerm.toLowerCase()) ||
                companyName.toLowerCase().includes(cohortSearchTerm.toLowerCase())
            );
        });
    }, [cohorts, companies, cohortSearchTerm]);

    // Unassigned fellows count
    const unassignedFellowsCount = useMemo(() => {
        return fellows.filter((f) => !f.cohort_id).length;
    }, [fellows]);

    // Fellows filtered for selected cohort and search term
    const filteredFellows = useMemo(() => {
        let list = fellows;
        if (selectedCohortId === "unassigned") {
            list = fellows.filter((f) => !f.cohort_id);
        } else if (selectedCohortId && selectedCohortId !== "all") {
            list = fellows.filter((f) => f.cohort_id === selectedCohortId);
        }

        return list.filter(
            (f) =>
                f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [selectedCohortId, fellows, searchTerm]);

    const selectedFellow = useMemo(() => {
        return fellows.find((f) => f.id === selectedId);
    }, [selectedId, fellows]);

    // ─── Bulk Import Dialog ─────────────────────────────────────────────────────

    const importPreviewRows = importRows.slice(0, 8);

    return (
        <>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Import Fellows from Excel</DialogTitle>
                        <DialogDescription>
                            Upload a CSV or XLSX file with one fellow per row. Leave blank cells empty; the app will use the selected company and auto-generate each fellow ID.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                            <div className="flex-1">
                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 block">
                                    Company for this import
                                </label>
                                <select
                                    value={selectedImportCompanyId}
                                    onChange={(e) => setSelectedImportCompanyId(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-[#E8E4D8] bg-white px-3 text-sm"
                                >
                                    <option value="">Select company (or add company_id in file)</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Button variant="outline" className="rounded-full" onClick={handleDownloadTemplate}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Template
                            </Button>
                        </div>

                        <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center transition-colors hover:border-primary/50">
                            <Upload className="h-5 w-5 text-primary" />
                            <span className="font-medium text-primary">Choose Excel or CSV file</span>
                            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />
                        </label>

                        {importFileName && (
                            <div className="rounded-xl border border-[#E8E4D8] bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                                Selected file: <span className="font-semibold text-foreground">{importFileName}</span>
                            </div>
                        )}

                        {importError && (
                            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{importError}</span>
                            </div>
                        )}

                        {importRows.length > 0 && (
                            <div className="rounded-2xl border border-[#E8E4D8] bg-white overflow-hidden">
                                <div className="border-b border-[#E8E4D8] bg-muted/20 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                    Preview ({importRows.length} rows found)
                                </div>
                                <div className="max-h-72 overflow-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="bg-muted/20 text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2 font-medium">Row</th>
                                                <th className="px-3 py-2 font-medium">Name</th>
                                                <th className="px-3 py-2 font-medium">Email</th>
                                                <th className="px-3 py-2 font-medium">Company</th>
                                                <th className="px-3 py-2 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importPreviewRows.map((row) => (
                                                <tr key={`${row.rowNumber}-${row.email}`} className="border-t border-[#E8E4D8]">
                                                    <td className="px-3 py-2">{row.rowNumber}</td>
                                                    <td className="px-3 py-2">{row.full_name || "—"}</td>
                                                    <td className="px-3 py-2">{row.email || "—"}</td>
                                                    <td className="px-3 py-2">{row.company_id || selectedImportCompanyId || "—"}</td>
                                                    <td className="px-3 py-2">
                                                        {row.errors.length > 0 ? (
                                                            <span className="text-amber-600">Needs review</span>
                                                        ) : (
                                                            <span className="text-emerald-600">Valid</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setImportDialogOpen(false)} className="rounded-full">
                            Cancel
                        </Button>
                        <Button onClick={handleImportSubmit} disabled={isImporting || !importRows.length} className="rounded-full">
                            {isImporting ? "Importing..." : "Register Fellows"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {selectedId && selectedFellow ? (
                <div className="w-full max-w-full overflow-hidden space-y-3 sm:space-y-4 md:space-y-5 px-1 sm:px-2 md:px-4 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E8E4D8] shadow-sm">
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedId(null)}
                            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-all px-4 h-11 self-start sm:self-auto"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Back to Fellows List</span>
                        </Button>

                        <div className="flex items-center gap-2 p-1.5 bg-muted/20 rounded-2xl border border-[#E8E4D8] w-full sm:w-auto">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={cn(
                                    "flex-1 sm:flex-none px-6 sm:px-8 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-center",
                                    activeTab === "profile"
                                        ? "bg-primary text-white shadow-md"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                                )}
                            >
                                Profile Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("progress")}
                                className={cn(
                                    "flex-1 sm:flex-none px-6 sm:px-8 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-center flex items-center justify-center gap-2",
                                    activeTab === "progress"
                                        ? "bg-primary text-white shadow-md"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                                )}
                            >
                                <TrendingUp className="size-4" />
                                <span>Performance & Progress</span>
                            </button>
                        </div>
                    </div>

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
                                isEditable={false}
                                onUpdate={fetchData}
                                onNavigateToProgress={() => setActiveTab("progress")}
                            />
                        </div>
                    ) : (
                        <div className="w-full max-w-full overflow-hidden bg-white rounded-2xl sm:rounded-[1.75rem] md:rounded-[2rem] p-3 sm:p-4 md:p-5 shadow-lg border border-primary/10 animate-in fade-in duration-300">
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
            ) : selectedCohortId === null ? (
                <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="space-y-1.5 sm:space-y-2 flex-1">
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                                Fellowship Workspace
                            </p>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight">
                                Select a Cohort
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl font-serif italic leading-relaxed">
                                Choose a learning cohort below to view, manage, and monitor its enrolled fellows.
                            </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                    setImportRows([]);
                                    setImportFileName("");
                                    setImportError(null);
                                    setImportDialogOpen(true);
                                }}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Import Fellows
                            </Button>
                            <FellowCreationForm onFellowCreated={fetchData} />
                        </div>
                    </div>

                    {/* Cohort Search & Filter bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#E8E4D8] shadow-sm">
                        <div className="relative w-full sm:flex-1 sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-4" />
                            <Input
                                placeholder="Search cohorts or companies..."
                                value={cohortSearchTerm}
                                onChange={(e) => setCohortSearchTerm(e.target.value)}
                                className="pl-9 h-10 rounded-lg sm:rounded-xl border-[#E8E4D8] focus:border-primary text-sm"
                            />
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-medium text-muted-foreground">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30">
                                <FolderKanban className="size-4 text-primary" />
                                <span><strong className="text-primary">{cohorts.length}</strong> Cohorts Total</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30">
                                <Users className="size-4 text-primary" />
                                <span><strong className="text-primary">{fellows.length}</strong> Enrolled Fellows</span>
                            </div>
                        </div>
                    </div>

                    {/* Cohort Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {loading ? (
                            Array(6)
                                .fill(0)
                                .map((_, i) => <CohortCardSkeleton key={i} />)
                        ) : (
                            <>
                                <SummaryCohortCard
                                    title="All Fellows Roster"
                                    subtitle="View complete fellow directory across all learning cohorts"
                                    fellowCount={fellows.length}
                                    icon={GraduationCap}
                                    variant="primary"
                                    onSelect={() => setSelectedCohortId("all")}
                                />

                                {unassignedFellowsCount > 0 && (
                                    <SummaryCohortCard
                                        title="Unassigned Fellows"
                                        subtitle="Fellows not currently assigned to any specific cohort"
                                        fellowCount={unassignedFellowsCount}
                                        icon={UserIcon}
                                        variant="secondary"
                                        onSelect={() => setSelectedCohortId("unassigned")}
                                    />
                                )}

                                {filteredCohorts.map((cohort) => {
                                    const companyName =
                                        companies.find((comp) => comp.id === cohort.company_id)?.name ||
                                        "Organization";
                                    const count = fellows.filter((f) => f.cohort_id === cohort.id).length;

                                    return (
                                        <CohortCard
                                            key={cohort.id}
                                            cohort={cohort}
                                            companyName={companyName}
                                            fellowCount={count}
                                            onSelect={() => setSelectedCohortId(cohort.id)}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-in fade-in duration-500 px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5">
                    <div className="flex flex-col gap-4 sm:gap-5">
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedCohortId(null)}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-full transition-all font-medium px-3.5 h-9"
                            >
                                <ArrowLeft className="size-4" />
                                <span>Back to Cohorts</span>
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={() => {
                                        setImportRows([]);
                                        setImportFileName("");
                                        setImportError(null);
                                        setImportDialogOpen(true);
                                    }}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import Fellows
                                </Button>
                                <FellowCreationForm onFellowCreated={fetchData} />
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E4D8] shadow-sm">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                                        {selectedCohortId === "all"
                                            ? "All Cohorts"
                                            : selectedCohortId === "unassigned"
                                            ? "Unassigned Group"
                                            : "Cohort Roster"}
                                    </span>
                                    {activeCohort && (
                                        <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full border-primary/30 bg-primary/5 text-primary">
                                            {activeCohort.wave_level} Level
                                        </Badge>
                                    )}
                                </div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight">
                                    {selectedCohortId === "all"
                                        ? "All Fellows Directory"
                                        : selectedCohortId === "unassigned"
                                        ? "Unassigned Fellows"
                                        : activeCohort?.name || "Cohort Fellows"}
                                </h1>
                                {activeCohort?.description && (
                                    <p className="text-xs sm:text-sm text-muted-foreground font-serif italic max-w-xl">
                                        {activeCohort?.description || ""}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportToExcel}
                                    disabled={loading || isExporting || filteredFellows.length === 0}
                                    className="h-9 rounded-lg border-[#E8E4D8] text-xs sm:text-sm"
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                                            Exporting...
                                        </>
                                    ) : (
                                        <>
                                            <FileSpreadsheet className="size-3.5 mr-1.5" />
                                            Export Excel
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#E8E4D8] shadow-sm">
                            <div className="relative w-full sm:flex-1 sm:max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-4" />
                                <Input
                                    placeholder="Search fellows in this view..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-10 rounded-lg sm:rounded-xl border-[#E8E4D8] focus:border-primary text-sm"
                                />
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2">
                                <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-medium px-2">
                                    <Users className="size-3.5 text-primary/50" />
                                    <span>
                                        <span className="text-primary font-semibold">{filteredFellows.length}</span> fellows listed
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:hidden space-y-2 sm:space-y-2.5">
                        {loading ? (
                            Array(5)
                                .fill(0)
                                .map((_, i) => <FellowCardSkeleton key={i} />)
                        ) : filteredFellows.length === 0 ? (
                            <EmptyState searchTerm={searchTerm} />
                        ) : (
                            filteredFellows.map((fellow) => (
                                <FellowCard
                                    key={fellow.id}
                                    fellow={fellow}
                                    onUpdate={fetchData}
                                    onSelect={() => setSelectedId(fellow.id)}
                                />
                            ))
                        )}
                    </div>

                    <div className="hidden lg:block overflow-hidden rounded-2xl border border-[#E8E4D8] bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-[#E8E4D8]">
                                    <TableHead className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Fellow</TableHead>
                                    <TableHead className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Company</TableHead>
                                    <TableHead className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</TableHead>
                                    <TableHead className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array(5)
                                        .fill(0)
                                        .map((_, i) => <TableRowSkeleton key={i} />)
                                ) : filteredFellows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="p-0">
                                            <EmptyState searchTerm={searchTerm} />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFellows.map((fellow) => (
                                        <TableRow
                                            key={fellow.id}
                                            className="group hover:bg-primary/[0.02] border-b border-[#F3EFE7] last:border-b-0 transition-all duration-200"
                                            onClick={() => setSelectedId(fellow.id)}
                                        >
                                            <TableCell className="px-5 py-4 align-middle">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar className="size-10 rounded-xl border-2 border-primary/10 bg-gradient-to-br from-primary/10 to-primary/5 shrink-0">
                                                        <AvatarFallback className="rounded-xl text-primary font-bold text-sm">
                                                            {(fellow.name || fellow.full_name || "F")
                                                                .split(" ")
                                                                .map((n: string) => n[0])
                                                                .join("")
                                                                .slice(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-sm text-foreground truncate">
                                                            {fellow.name || fellow.full_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                            {fellow.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 align-middle">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                                                    <Building2 className="size-3.5 text-primary/50 shrink-0" />
                                                    <span className="truncate max-w-[220px]">{fellow.companyName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 align-middle text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "rounded-full px-2.5 py-1 text-[10px] font-bold border",
                                                        fellow.status === "Active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                        fellow.status === "Onboarding" && "bg-blue-50 text-blue-700 border-blue-200",
                                                        fellow.status === "Paused" && "bg-amber-50 text-amber-700 border-amber-200",
                                                        fellow.status === "Graduated" && "bg-violet-50 text-violet-700 border-violet-200",
                                                        fellow.status === "Competency Reset" && "bg-rose-50 text-rose-700 border-rose-200",
                                                        !(fellow.status === "Active" || fellow.status === "Onboarding" || fellow.status === "Paused" || fellow.status === "Graduated" || fellow.status === "Competency Reset") && "bg-gray-50 text-gray-700 border-gray-200"
                                                    )}
                                                >
                                                    {fellow.status || "Onboarding"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 align-middle">
                                                <div className="flex items-center justify-end gap-1">
                                                    <FellowActions fellow={fellow} onUpdate={fetchData} onView={() => setSelectedId(fellow.id)} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </>
    );

    if (selectedCohortId === null) {
        return (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5 sm:space-y-2 flex-1">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                            Fellowship Workspace
                        </p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight">
                            Select a Cohort
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl font-serif italic leading-relaxed">
                            Choose a learning cohort below to view, manage, and monitor its enrolled fellows.
                        </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => {
                                setImportRows([]);
                                setImportFileName("");
                                setImportError(null);
                                setImportDialogOpen(true);
                            }}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Import Fellows
                        </Button>
                        <FellowCreationForm onFellowCreated={fetchData} />
                    </div>
                </div>

                {/* Cohort Search & Filter bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#E8E4D8] shadow-sm">
                    <div className="relative w-full sm:flex-1 sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-4" />
                        <Input
                            placeholder="Search cohorts or companies..."
                            value={cohortSearchTerm}
                            onChange={(e) => setCohortSearchTerm(e.target.value)}
                            className="pl-9 h-10 rounded-lg sm:rounded-xl border-[#E8E4D8] focus:border-primary text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30">
                            <FolderKanban className="size-4 text-primary" />
                            <span><strong className="text-primary">{cohorts.length}</strong> Cohorts Total</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30">
                            <Users className="size-4 text-primary" />
                            <span><strong className="text-primary">{fellows.length}</strong> Enrolled Fellows</span>
                        </div>
                    </div>
                </div>

                {/* Cohort Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {loading ? (
                        Array(6)
                            .fill(0)
                            .map((_, i) => <CohortCardSkeleton key={i} />)
                    ) : (
                        <>
                            {/* Summary Card: All Fellows */}
                            <SummaryCohortCard
                                title="All Fellows Roster"
                                subtitle="View complete fellow directory across all learning cohorts"
                                fellowCount={fellows.length}
                                icon={GraduationCap}
                                variant="primary"
                                onSelect={() => setSelectedCohortId("all")}
                            />

                            {/* Unassigned Fellows Card (if any) */}
                            {unassignedFellowsCount > 0 && (
                                <SummaryCohortCard
                                    title="Unassigned Fellows"
                                    subtitle="Fellows not currently assigned to any specific cohort"
                                    fellowCount={unassignedFellowsCount}
                                    icon={UserIcon}
                                    variant="secondary"
                                    onSelect={() => setSelectedCohortId("unassigned")}
                                />
                            )}

                            {/* Cohort Cards */}
                            {filteredCohorts.map((cohort) => {
                                const companyName =
                                    companies.find((comp) => comp.id === cohort.company_id)?.name ||
                                    "Organization";
                                const count = fellows.filter((f) => f.cohort_id === cohort.id).length;

                                return (
                                    <CohortCard
                                        key={cohort.id}
                                        cohort={cohort}
                                        companyName={companyName}
                                        fellowCount={count}
                                        onSelect={() => setSelectedCohortId(cohort.id)}
                                    />
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ─── Step 2: Selected Cohort Fellow Roster List View ─────────────────────

    return (
        <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-in fade-in duration-500 px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:gap-5">
                <div className="flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedCohortId(null)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-full transition-all font-medium px-3.5 h-9"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Back to Cohorts</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => {
                                setImportRows([]);
                                setImportFileName("");
                                setImportError(null);
                                setImportDialogOpen(true);
                            }}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Import Fellows
                        </Button>
                        <FellowCreationForm onFellowCreated={fetchData} />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E4D8] shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                                {selectedCohortId === "all"
                                    ? "All Cohorts"
                                    : selectedCohortId === "unassigned"
                                    ? "Unassigned Group"
                                    : "Cohort Roster"}
                            </span>
                            {activeCohort && (
                                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full border-primary/30 bg-primary/5 text-primary">
                                    {activeCohort?.wave_level || "Standard"} Level
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight">
                            {selectedCohortId === "all"
                                ? "All Fellows Directory"
                                : selectedCohortId === "unassigned"
                                ? "Unassigned Fellows"
                                : activeCohort?.name || "Cohort Fellows"}
                        </h1>
                        {activeCohort?.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground font-serif italic max-w-xl">
                                {activeCohort?.description || ""}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleExportToExcel}
                            disabled={loading || isExporting || filteredFellows.length === 0}
                            className="h-9 rounded-lg border-[#E8E4D8] text-xs sm:text-sm"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FileSpreadsheet className="size-3.5 mr-1.5" />
                                    Export Excel
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#E8E4D8] shadow-sm">
                    <div className="relative w-full sm:flex-1 sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-4" />
                        <Input
                            placeholder="Search fellows in this view..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 rounded-lg sm:rounded-xl border-[#E8E4D8] focus:border-primary text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-medium px-2">
                            <Users className="size-3.5 text-primary/50" />
                            <span>
                                <span className="text-primary font-semibold">{filteredFellows.length}</span> fellows listed
                            </span>
                        </div>
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