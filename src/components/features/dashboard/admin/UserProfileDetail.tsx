"use client";

import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    GraduationCap,
    Briefcase,
    CheckCircle2,
    Clock,
    Award,
    Globe,
    Edit,
    MoreVertical,
    Target,
    PieChart,
    Lock,
    ShieldCheck,
    Loader2,
    ChevronRight,
    TrendingUp,
    ArrowRight,
    Camera,
    Sparkles,
    Copy,
    Check,
    PhoneCall,
    Send,
    FileText,
    Download,
    ExternalLink,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminManagementService } from "@/services/AdminManagementService";
import { FacilitatorService } from "@/services/FacilitatorService";
import { FellowService } from "@/services/FellowService";
import FellowUpdateForm from "./FellowUpdateForm";
import { FellowProfile } from "@/types";
import { RequiredMark } from "@/components/ui/label";
import { filesApi } from "@/lib/api";

interface UserProfileDetailProps {
    user: {
        id: string;
        user_id: string;
        fellow_id?: string;
        name: string;
        email: string;
        role: string;
        avatar?: string;
        company?: string;
        cohort?: string;
        status: string;
        phone?: string;
        location?: string;
        joinedDate?: string;
        lastLogin?: string;
        bio?: string;
        highest_qualification?: string;
        current_role?: string;
        organization?: string;
        leadership_experience_years?: number;
        key_skills?: string[];
        learning_goals?: string[];
        gender?: string;
        age?: number | string;
        primary_language?: string;
        availability?: string;
        leadership_track?: string;
        personality_style?: string;
        constraints?: string;
        certificateUrl?: string;
    };
    isEditable?: boolean;
    onUpdate?: () => void;
    onNavigateToProgress?: () => void;
}

// ─── Info Row Component ───────────────────────────────────────────────────────

function InfoRow({
    icon,
    label,
    value,
    action,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="group p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-stone-50/80 border border-[#E8E4D8] flex items-center justify-between gap-3 hover:bg-emerald-50/30 hover:border-[#1B4332]/25 transition-all duration-300 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="size-9 sm:size-10 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center shrink-0 group-hover:bg-[#1B4332] group-hover:text-white transition-colors duration-300">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 mb-0.5">
                        {label}
                    </p>
                    <p className="font-semibold text-foreground text-xs sm:text-sm truncate">
                        {value}
                    </p>
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserProfileDetail({
    user,
    isEditable = false,
    onUpdate,
    onNavigateToProgress,
}: UserProfileDetailProps) {
    const isFellow = user.role.toUpperCase() === "FELLOW" || !!user.fellow_id;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const normalizedRole = user.role.toUpperCase();

    // Image Upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentAvatar, setCurrentAvatar] = useState(user.avatar);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Certificate Upload state
    const certInputRef = useRef<HTMLInputElement>(null);
    const [certificateUrl, setCertificateUrl] = useState<string | undefined>(
        user.certificateUrl || (user as any).certificate_url
    );
    const [isUploadingCert, setIsUploadingCert] = useState(false);

    const handleCertificateUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploadingCert(true);
            const res = await filesApi.upload(file);
            const uploadedUrl = res.url;
            setCertificateUrl(uploadedUrl);

            if (normalizedRole === "FELLOW") {
                await FellowService.updateFellowProfile(user.id, user.user_id, {
                    certificateUrl: uploadedUrl,
                } as any);
            }
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Failed to upload certificate", err);
        } finally {
            setIsUploadingCert(false);
        }
    };

    const [editData, setEditData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
        title: user.current_role || user.role,
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploadingAvatar(true);
            const localPreview = URL.createObjectURL(file);
            setCurrentAvatar(localPreview);

            const res = await filesApi.upload(file);
            const uploadedUrl = res.url || localPreview;
            setCurrentAvatar(uploadedUrl);

            if (normalizedRole === "FELLOW") {
                await FellowService.updateFellowProfile(user.id, user.user_id, {
                    avatar: uploadedUrl,
                } as any);
            }
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Failed to upload avatar image", err);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // Copy to Clipboard state
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, field: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            if (
                normalizedRole === "ADMIN" ||
                normalizedRole === "ADMINISTRATOR"
            ) {
                await AdminManagementService.updateAdminProfile(
                    user.id,
                    user.user_id,
                    {
                        name: editData.name,
                        email: editData.email,
                        title: editData.title,
                        phone: editData.phone,
                        location: editData.location,
                        bio: editData.bio,
                    }
                );
            } else if (normalizedRole === "FACILITATOR") {
                await FacilitatorService.updateFacilitator(
                    user.id,
                    user.user_id,
                    {
                        full_name: editData.name,
                        email: editData.email,
                        phone: editData.phone,
                        location: editData.location,
                        bio: editData.bio,
                    }
                );
            } else if (user.role === "FELLOW") {
                await FellowService.updateFellowProfile(user.id, user.user_id, {
                    full_name: editData.name,
                    email: editData.email,
                    phone: editData.phone,
                    location: editData.location,
                    bio: editData.bio,
                });
            }

            setIsEditModalOpen(false);
            if (onUpdate) onUpdate();
            else window.location.reload();
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const userInitials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
        : "U";

    return (
        <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Hidden File Input for Avatar Upload */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />

            {/* ─── Integrated Green Hero Banner Card ─────────────────────────────────── */}
            <div className="relative rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#143D2D] p-5 sm:p-7 md:p-8 text-white shadow-xl border border-white/10 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
                    <Globe className="absolute -right-12 -bottom-12 rotate-12 size-72 sm:size-96" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-5 sm:gap-6">
                    {/* Left: Avatar & Fellow Primary Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left min-w-0 flex-1">
                        {/* Avatar with Camera Overlay & Click to Upload Image */}
                        <div
                            className="relative shrink-0 group/avatar cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            title="Click to insert or change photo"
                        >
                            <Avatar className="size-20 sm:size-24 md:size-28 rounded-2xl border-4 border-white/20 shadow-2xl transition-transform group-hover/avatar:scale-105">
                                <AvatarImage src={currentAvatar} />
                                <AvatarFallback className="text-2xl sm:text-3xl font-serif font-black bg-white text-[#1B4332] rounded-2xl">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 backdrop-blur-[2px]">
                                {isUploadingAvatar ? (
                                    <Loader2 className="size-6 animate-spin" />
                                ) : (
                                    <>
                                        <Camera className="size-6" />
                                        <span className="text-[9px] font-bold uppercase tracking-wider mt-1">
                                            Upload Photo
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Badge Trigger */}
                            <div className="absolute -bottom-1 -right-1 size-8 rounded-xl bg-white text-[#1B4332] shadow-md border border-[#E8E4D8] flex items-center justify-center group-hover/avatar:scale-110 transition-transform">
                                {isUploadingAvatar ? (
                                    <Loader2 className="size-4 animate-spin text-primary" />
                                ) : (
                                    <Camera className="size-4 text-[#1B4332]" />
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white tracking-tight break-words">
                                    {user.name}
                                </h2>
                                <Badge
                                    className={cn(
                                        "rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm shrink-0",
                                        user.status === "Active"
                                            ? "bg-emerald-400 text-emerald-950 font-bold"
                                            : "bg-amber-400 text-amber-950 font-bold"
                                    )}
                                >
                                    {user.status}
                                </Badge>
                            </div>

                            <p className="text-white/80 font-serif italic text-sm sm:text-base leading-snug truncate">
                                {user.current_role || user.role} • {user.organization || user.company || "Lead Life System"}
                            </p>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                {user.fellow_id && (
                                    <span className="inline-flex px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 text-[10px] font-bold text-emerald-200 tracking-wider">
                                        ID: {user.fellow_id}
                                    </span>
                                )}
                                {user.leadership_track && (
                                    <span className="inline-flex px-3 py-1 bg-amber-400/20 backdrop-blur-md rounded-full border border-amber-400/30 text-[10px] font-bold text-amber-200 tracking-wider">
                                        Track: {user.leadership_track}
                                    </span>
                                )}
                                {user.cohort && (
                                    <span className="inline-flex px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 text-[10px] font-bold text-white/90 tracking-wider">
                                        Cohort: {user.cohort}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Performance Link & Upload Certificate Button */}
                    <div className="shrink-0 w-full sm:w-auto flex flex-wrap items-center justify-center md:justify-end gap-2.5 pt-2 md:pt-0">
                        {/* Hidden Certificate File Input */}
                        <input
                            type="file"
                            ref={certInputRef}
                            onChange={handleCertificateUpload}
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            className="hidden"
                        />

                        <Button
                            onClick={() => certInputRef.current?.click()}
                            disabled={isUploadingCert}
                            variant="outline"
                            className="h-11 sm:h-12 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs sm:text-sm backdrop-blur-md shadow-lg transition-all"
                        >
                            {isUploadingCert ? (
                                <Loader2 className="size-4 animate-spin mr-2 text-white" />
                            ) : (
                                <FileText className="size-4 mr-2 text-emerald-300" />
                            )}
                            <span>{certificateUrl ? "Update Certificate" : "Upload Certificate"}</span>
                        </Button>

                        {onNavigateToProgress && (
                            <Button
                                onClick={onNavigateToProgress}
                                className="h-11 sm:h-12 px-6 rounded-2xl bg-white text-[#1B4332] font-bold text-xs sm:text-sm shadow-xl hover:bg-[#FDFCF6] hover:scale-[1.02] transition-all group/btn w-full sm:w-auto"
                            >
                                <TrendingUp className="size-4 mr-2 text-[#1B4332] transition-transform group-hover/btn:scale-110" />
                                <span>View Student Performance</span>
                                <ChevronRight className="size-4 ml-1.5 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Integrated Performance Summary Metrics Bar inside the green card */}
                <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/70">Qualification</p>
                        <p className="font-semibold text-white truncate mt-0.5">{user.highest_qualification || "Advanced Degree"}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/70">Leadership Exp.</p>
                        <p className="font-semibold text-white truncate mt-0.5">{user.leadership_experience_years || 0} Years Exp.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/70">Availability</p>
                        <p className="font-semibold text-white truncate mt-0.5">{user.availability || "Full Availability"}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/70">Location</p>
                        <p className="font-semibold text-white truncate mt-0.5">{user.location || "Addis Ababa, ET"}</p>
                    </div>
                </div>
            </div>

            {/* ─── Edit Modal ──────────────────────────────────────────────────────── */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-[500px] rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-1 sm:space-y-2">
                        <DialogTitle className="text-lg sm:text-xl md:text-2xl font-serif font-bold">
                            Edit Profile
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                        {/* Full Name */}
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">
                                Full Name
                                <RequiredMark className="ml-0.5" />
                            </label>
                            <Input
                                value={editData.name}
                                onChange={(e) =>
                                    setEditData({ ...editData, name: e.target.value })
                                }
                                className="h-10 sm:h-11 rounded-xl border-2 border-[#E8E4D8] focus:border-primary text-sm sm:text-base"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">
                                Email Address
                                <RequiredMark className="ml-0.5" />
                            </label>
                            <Input
                                type="email"
                                value={editData.email}
                                onChange={(e) =>
                                    setEditData({ ...editData, email: e.target.value })
                                }
                                className="h-10 sm:h-11 rounded-xl border-2 border-[#E8E4D8] focus:border-primary text-sm sm:text-base"
                            />
                        </div>

                        {/* Phone & Location Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">
                                    Phone
                                </label>
                                <Input
                                    value={editData.phone}
                                    onChange={(e) =>
                                        setEditData({ ...editData, phone: e.target.value })
                                    }
                                    className="h-10 sm:h-11 rounded-xl border-2 border-[#E8E4D8] focus:border-primary text-sm sm:text-base"
                                />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">
                                    Location
                                </label>
                                <Input
                                    value={editData.location}
                                    onChange={(e) =>
                                        setEditData({ ...editData, location: e.target.value })
                                    }
                                    className="h-10 sm:h-11 rounded-xl border-2 border-[#E8E4D8] focus:border-primary text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* System Identity (non-Fellow) */}
                        {!isFellow && (
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">
                                    System Identity Badge
                                </label>
                                <div className="p-2.5 sm:p-3 bg-stone-100 rounded-xl font-mono text-[9px] sm:text-[10px] text-stone-500 flex items-center justify-between gap-2">
                                    <span className="truncate">UID: {user.user_id}</span>
                                    <Lock className="size-3 opacity-30 shrink-0" />
                                </div>
                            </div>
                        )}

                        {/* Title/Role (Admin/Facilitator only) */}
                        {(normalizedRole === "ADMIN" ||
                            normalizedRole === "ADMINISTRATOR" ||
                            normalizedRole === "FACILITATOR") && (
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">
                                        Title / Role
                                    </label>
                                    <Input
                                        value={editData.title}
                                        onChange={(e) =>
                                            setEditData({ ...editData, title: e.target.value })
                                        }
                                        className="h-10 sm:h-11 rounded-xl border-2 border-[#E8E4D8] focus:border-primary text-sm sm:text-base"
                                    />
                                </div>
                            )}

                        {/* Bio */}
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">
                                Bio
                            </label>
                            <Textarea
                                value={editData.bio}
                                onChange={(e) =>
                                    setEditData({ ...editData, bio: e.target.value })
                                }
                                className="rounded-xl min-h-[80px] sm:min-h-[100px] border-2 border-[#E8E4D8] focus:border-primary text-sm sm:text-base resize-none"
                            />
                        </div>

                        {/* Footer Actions */}
                        <DialogFooter className="pt-3 sm:pt-4 flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-full sm:w-auto h-10 sm:h-11 rounded-full font-serif font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full sm:w-auto h-10 sm:h-11 rounded-full px-6 sm:px-8 shadow-lg shadow-primary/20"
                            >
                                {isUpdating && (
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── Main Content Grid ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                {/* Left Column: Contact Info */}
                <div className="lg:col-span-1 space-y-4 sm:space-y-5 md:space-y-6">
                    <Card className="rounded-2xl sm:rounded-[2rem] border-2 border-[#E8E4D8] bg-white overflow-hidden shadow-md">
                        <CardHeader className="bg-gradient-to-r from-[#1B4332]/5 via-emerald-50/40 to-transparent px-5 py-4 border-b border-[#E8E4D8]">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base sm:text-lg font-serif font-bold text-[#1B4332] flex items-center gap-2.5">
                                    <div className="size-8 rounded-lg bg-[#1B4332] text-white flex items-center justify-center shadow-xs">
                                        <Mail className="size-4" />
                                    </div>
                                    Contact Information
                                </CardTitle>
                                <Badge variant="outline" className="border-[#1B4332]/20 text-[#1B4332] font-semibold text-[10px] uppercase tracking-wider bg-white">
                                    Verified
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 space-y-3">
                            <InfoRow
                                icon={<Mail className="size-4" />}
                                label="Email Address"
                                value={user.email}
                                action={
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(user.email, "email")}
                                            className="size-8 rounded-lg bg-white border border-[#E8E4D8] flex items-center justify-center text-stone-600 hover:text-[#1B4332] hover:border-[#1B4332] transition-colors shadow-2xs"
                                            title="Copy Email"
                                        >
                                            {copiedField === "email" ? (
                                                <Check className="size-3.5 text-emerald-600 animate-in zoom-in" />
                                            ) : (
                                                <Copy className="size-3.5" />
                                            )}
                                        </button>
                                        <a
                                            href={`mailto:${user.email}`}
                                            className="size-8 rounded-lg bg-[#1B4332]/10 text-[#1B4332] hover:bg-[#1B4332] hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                                            title="Send Direct Email"
                                        >
                                            <Send className="size-3.5" />
                                        </a>
                                    </div>
                                }
                            />
                            <InfoRow
                                icon={<Phone className="size-4" />}
                                label="Phone Number"
                                value={user.phone || "Not provided"}
                                action={
                                    user.phone ? (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(user.phone!, "phone")}
                                                className="size-8 rounded-lg bg-white border border-[#E8E4D8] flex items-center justify-center text-stone-600 hover:text-[#1B4332] hover:border-[#1B4332] transition-colors shadow-2xs"
                                                title="Copy Phone Number"
                                            >
                                                {copiedField === "phone" ? (
                                                    <Check className="size-3.5 text-emerald-600 animate-in zoom-in" />
                                                ) : (
                                                    <Copy className="size-3.5" />
                                                )}
                                            </button>
                                            <a
                                                href={`tel:${user.phone}`}
                                                className="size-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center transition-colors shadow-2xs"
                                                title="Direct Call"
                                            >
                                                <PhoneCall className="size-3.5" />
                                            </a>
                                        </div>
                                    ) : undefined
                                }
                            />
                            <InfoRow
                                icon={<MapPin className="size-4" />}
                                label="Location"
                                value={user.location || "Addis Ababa, Ethiopia"}
                            />
                            <InfoRow
                                icon={<Globe className="size-4" />}
                                label="Primary Language"
                                value={user.primary_language || "English / Amharic"}
                            />
                            {isFellow && (
                                <>
                                    <InfoRow
                                        icon={<Calendar className="size-4" />}
                                        label="Availability"
                                        value={user.availability || "Full Availability"}
                                    />
                                    <InfoRow
                                        icon={<Target className="size-4" />}
                                        label="Leadership Track"
                                        value={user.leadership_track || "General"}
                                    />
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Leadership Profile (Fellow only) */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
                    {isFellow && (
                        <Card className="rounded-2xl sm:rounded-[2rem] border-2 border-[#E8E4D8] bg-white overflow-hidden shadow-md">
                            <CardHeader className="bg-gradient-to-r from-[#1B4332]/5 via-emerald-50/40 to-transparent px-5 sm:px-6 py-4 border-b border-[#E8E4D8]">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base sm:text-lg font-serif font-bold text-[#1B4332] flex items-center gap-2.5">
                                        <div className="size-8 rounded-lg bg-[#1B4332] text-white flex items-center justify-center shadow-xs">
                                            <Award className="size-4" />
                                        </div>
                                        Leadership & Professional Profile
                                    </CardTitle>
                                    <Badge variant="outline" className="border-[#1B4332]/20 text-[#1B4332] font-semibold text-[10px] uppercase tracking-wider bg-white">
                                        Verified Profile
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                                {/* Qualifications & Experience Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Qualifications Card */}
                                    <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 border border-[#E8E4D8] space-y-3 relative overflow-hidden group hover:border-[#1B4332]/30 hover:bg-emerald-50/30 transition-all duration-300">
                                        <div className="flex items-center gap-2 text-[#1B4332]">
                                            <div className="size-8 rounded-xl bg-emerald-100/80 text-[#1B4332] flex items-center justify-center">
                                                <GraduationCap className="size-4" />
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1B4332]">
                                                Academic Qualifications
                                            </h4>
                                        </div>
                                        <p className="font-serif italic text-foreground text-base sm:text-lg font-semibold leading-relaxed pl-1">
                                            {user.highest_qualification || "Medical Doctor"}
                                        </p>
                                    </div>

                                    {/* Leadership Experience Card */}
                                    <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 border border-[#E8E4D8] space-y-3 relative overflow-hidden group hover:border-amber-500/30 hover:bg-amber-50/30 transition-all duration-300">
                                        <div className="flex items-center gap-2 text-amber-700">
                                            <div className="size-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                                                <Briefcase className="size-4" />
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                                                Leadership Experience
                                            </h4>
                                        </div>
                                        <p className="font-serif italic text-foreground text-base sm:text-lg font-semibold leading-relaxed pl-1">
                                            {user.leadership_experience_years || "1"} Years in Leadership Positions
                                        </p>
                                    </div>
                                </div>

                                {/* Key Skills */}
                                <div className="space-y-3 pt-4 border-t border-dashed border-[#E8E4D8]">
                                    <div className="flex items-center gap-2">
                                        <PieChart className="size-4 text-[#1B4332]" />
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1B4332]">
                                            Key Skills & Competencies
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {user.key_skills?.length ? (
                                            user.key_skills.map((skill, i) => (
                                                <div
                                                    key={i}
                                                    className="px-3.5 py-1.5 bg-[#1B4332]/5 border border-[#1B4332]/20 text-[#1B4332] font-semibold text-xs rounded-xl shadow-2xs hover:bg-[#1B4332] hover:text-white transition-all cursor-default flex items-center gap-1.5"
                                                >
                                                    <Sparkles className="size-3 text-emerald-600 group-hover:text-amber-300" />
                                                    <span>{skill}</span>
                                                </div>
                                            ))
                                        ) : (
                                            ["Strategic Thinking", "Team Coaching", "Financial Planning"].map((skill, i) => (
                                                <div
                                                    key={i}
                                                    className="px-3.5 py-1.5 bg-[#1B4332]/5 border border-[#1B4332]/20 text-[#1B4332] font-semibold text-xs rounded-xl shadow-2xs hover:bg-[#1B4332] hover:text-white transition-all cursor-default flex items-center gap-1.5"
                                                >
                                                    <Sparkles className="size-3 text-amber-500" />
                                                    <span>{skill}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Official Certificate Section */}
                                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#1B4332]/10 via-emerald-50/50 to-transparent border-2 border-[#1B4332]/20 space-y-3 relative overflow-hidden">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center shadow-md shrink-0">
                                                <Award className="size-5 text-amber-300" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[#1B4332] flex items-center gap-1.5">
                                                    Official Leadership Certificate
                                                </h4>
                                                <p className="text-xs text-muted-foreground font-serif italic">
                                                    {certificateUrl
                                                        ? "Issued & Verified by MasterBuilder Leadership Institute"
                                                        : "No official certificate uploaded yet"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            {certificateUrl ? (
                                                <>
                                                    <a
                                                        href={certificateUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4332] text-white font-bold text-xs shadow-md hover:bg-[#2D6A4F] transition-all"
                                                    >
                                                        <ExternalLink className="size-3.5" />
                                                        View Certificate
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => certInputRef.current?.click()}
                                                        disabled={isUploadingCert}
                                                        className="text-xs text-[#1B4332] hover:bg-white/60 font-semibold"
                                                    >
                                                        Replace
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    onClick={() => certInputRef.current?.click()}
                                                    disabled={isUploadingCert}
                                                    className="h-9 px-4 rounded-xl bg-[#1B4332] text-white font-bold text-xs shadow-md hover:bg-[#2D6A4F] transition-all"
                                                >
                                                    {isUploadingCert ? (
                                                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                                    ) : (
                                                        <FileText className="size-3.5 mr-1.5" />
                                                    )}
                                                    Upload Certificate
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Learning Goals */}
                                <div className="space-y-3 pt-4 border-t border-dashed border-[#E8E4D8]">
                                    <div className="flex items-center gap-2">
                                        <Target className="size-4 text-[#1B4332]" />
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1B4332]">
                                            Leadership Development Goals
                                        </h4>
                                    </div>
                                    <div className="space-y-2.5">
                                        {user.learning_goals?.length ? (
                                            user.learning_goals.map((goal, i) => (
                                                <div
                                                    key={i}
                                                    className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 flex items-start gap-3 text-foreground font-serif italic text-sm sm:text-base"
                                                >
                                                    <div className="size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                                        <CheckCircle2 className="size-3.5" />
                                                    </div>
                                                    <span className="break-words leading-relaxed text-[#1B4332]">
                                                        {goal}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 flex items-start gap-3 text-foreground font-serif italic text-sm sm:text-base">
                                                <div className="size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                                    <CheckCircle2 className="size-3.5" />
                                                </div>
                                                <span className="break-words leading-relaxed text-[#1B4332]">
                                                    Enhance executive communication and master operational excellence frameworks.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Bio Section (for non-fellows or if bio exists) */}
                    {!isFellow && user.bio && (
                        <Card className="rounded-2xl sm:rounded-[2rem] border-2 border-[#E8E4D8] bg-white overflow-hidden shadow-md">
                            <CardHeader className="bg-gradient-to-r from-[#1B4332]/5 via-emerald-50/40 to-transparent px-5 py-4 border-b border-[#E8E4D8]">
                                <CardTitle className="text-sm sm:text-base md:text-lg font-serif flex items-center gap-2">
                                    <User className="size-4 sm:size-5 text-[#1B4332]" />
                                    About
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6">
                                <p className="font-serif italic text-muted-foreground text-sm sm:text-base leading-relaxed">
                                    {user.bio}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}