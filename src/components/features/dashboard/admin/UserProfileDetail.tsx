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

import { useState } from "react";
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
    };
    isEditable?: boolean;
    onUpdate?: () => void;
}

// ─── Info Row Component ───────────────────────────────────────────────────────

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3 sm:gap-4">
            <div className="size-8 sm:size-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1 py-0.5">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-0.5">
                    {label}
                </p>
                <p className="font-medium text-foreground text-sm sm:text-base break-words leading-snug">
                    {value}
                </p>
            </div>
        </div>
    );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickActionButton({
    icon: Icon,
    title,
    subtitle,
    colorClass,
    hoverClass,
    iconAnimation = "group-hover:scale-110",
}: {
    icon: any;
    title: string;
    subtitle: string;
    colorClass: string;
    hoverClass: string;
    iconAnimation?: string;
}) {
    return (
        <Button
            variant="ghost"
            className={cn(
                "rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-auto transition-all group w-full sm:w-auto justify-start",
                colorClass,
                hoverClass
            )}
        >
            <div className="flex flex-col items-start gap-0.5 sm:gap-1 w-full min-w-0">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                    <Icon
                        className={cn(
                            "size-3.5 sm:size-4 shrink-0 transition-transform",
                            iconAnimation
                        )}
                    />
                    <span className="truncate">{title}</span>
                </div>
                <span
                    className={cn(
                        "text-[9px] sm:text-[10px] font-medium truncate w-full",
                        colorClass.includes("emerald")
                            ? "text-emerald-600/60"
                            : colorClass.includes("blue")
                                ? "text-blue-600/60"
                                : colorClass.includes("purple")
                                    ? "text-purple-600/60"
                                    : "text-amber-600/60"
                    )}
                >
                    {subtitle}
                </span>
            </div>
        </Button>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserProfileDetail({
    user,
    isEditable = false,
    onUpdate,
}: UserProfileDetailProps) {
    const isFellow = user.role.toUpperCase() === "FELLOW" || !!user.fellow_id;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const normalizedRole = user.role.toUpperCase();

    const [editData, setEditData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
        title: user.current_role || user.role,
    });

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
            {/* ─── Premium Header Section ─────────────────────────────────────────── */}
            <div className="relative group/header">
                {/* Background Gradient with Pattern */}
                <div className="h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 w-full rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#52B788] border-b-2 sm:border-b-4 border-white/20 overflow-hidden relative shadow-lg sm:shadow-xl md:shadow-2xl">
                    <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                        <Globe
                            className="absolute -right-8 sm:-right-12 md:-right-16 lg:-right-20 -bottom-8 sm:-bottom-12 md:-bottom-16 lg:-bottom-20 rotate-12 size-40 sm:size-56 md:size-72 lg:size-80 xl:size-96"
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
                    </div>

                    {/* Decorative floating elements */}
                    <div className="absolute top-4 sm:top-6 md:top-8 lg:top-10 left-4 sm:left-6 md:left-8 lg:left-10 size-1.5 sm:size-2 md:size-2.5 lg:size-3 rounded-full bg-white/30 animate-pulse" />
                    <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 lg:bottom-12 right-1/4 size-1 sm:size-1.5 md:size-2 rounded-full bg-white/20" />
                </div>

                {/* Avatar & Key Info - Overlapping */}
                <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-14 -mt-12 sm:-mt-14 md:-mt-18 lg:-mt-20 xl:-mt-24 flex flex-col items-center xl:items-end xl:flex-row gap-3 sm:gap-4 md:gap-6 lg:gap-8 relative z-10 w-full">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <Avatar className="size-24 sm:size-28 md:size-32 lg:size-36 xl:size-44 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] xl:rounded-[3rem] border-[6px] sm:border-[8px] md:border-[10px] lg:border-[12px] border-white shadow-[0_8px_24px_rgba(0,0,0,0.1)] sm:shadow-[0_12px_32px_rgba(0,0,0,0.12)] md:shadow-[0_16px_48px_rgba(0,0,0,0.14)] lg:shadow-[0_24px_64px_rgba(0,0,0,0.15)] group-hover/header:rotate-1 transition-transform duration-700">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-serif font-black bg-[#FDFCF6] text-primary rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] xl:rounded-[3rem]">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        {/* Role Badge on Avatar */}
                        <div className="absolute bottom-0 sm:bottom-1 right-0 sm:right-1 size-7 sm:size-8 md:size-9 lg:size-10 rounded-lg sm:rounded-xl md:rounded-2xl bg-white shadow-lg border border-[#E8E4D8] flex items-center justify-center text-primary">
                            {isFellow ? (
                                <GraduationCap className="size-3.5 sm:size-4 md:size-5" />
                            ) : (
                                <ShieldCheck className="size-3.5 sm:size-4 md:size-5" />
                            )}
                        </div>
                    </div>

                    {/* Name & Info */}
                    <div className="flex-1 flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4 md:gap-6 w-full pb-1 sm:pb-2 text-center xl:text-left">
                        <div className="space-y-1.5 sm:space-y-2 md:space-y-3 min-w-0">
                            {/* Name & Status Row */}
                            <div className="flex flex-wrap items-center justify-center xl:justify-start gap-1.5 sm:gap-2 md:gap-3">
                                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-serif font-bold text-[#1B4332] tracking-tight break-words">
                                    {user.name}
                                </h2>
                                <Badge
                                    className={cn(
                                        "rounded-full px-2.5 sm:px-3 md:px-4 py-0.5 sm:py-1 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-md shrink-0",
                                        user.status === "Active"
                                            ? "bg-emerald-500 text-white"
                                            : "bg-amber-500 text-white"
                                    )}
                                >
                                    {user.status}
                                </Badge>
                            </div>

                            {/* Fellow ID if exists */}
                            {user.fellow_id && (
                                <div className="flex justify-center xl:justify-start">
                                    <div className="inline-flex px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-[#E8E4D8] text-[8px] sm:text-[9px] md:text-[10px] font-black text-[#8B9B7E] tracking-wider shadow-sm">
                                        ID: {user.fellow_id}
                                    </div>
                                </div>
                            )}

                            {/* Role & Organization */}
                            <div className="flex flex-wrap items-center justify-center xl:justify-start gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-[#1B4332]/60 font-serif italic">
                                <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">
                                    {user.current_role || user.role}
                                </span>
                                <span className="size-1 sm:size-1.5 rounded-full bg-primary/30 shrink-0" />
                                <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">
                                    {user.organization ||
                                        user.company ||
                                        "Lead Life System"}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-center xl:justify-end gap-2 sm:gap-3 shrink-0">
                            {isEditable &&
                                (isFellow ? (
                                    <FellowUpdateForm
                                        fellow={user as any}
                                        onFellowUpdated={
                                            onUpdate || (() => window.location.reload())
                                        }
                                        trigger={
                                            <Button className="h-10 sm:h-11 md:h-12 lg:h-14 px-4 sm:px-6 md:px-8 lg:px-10 rounded-xl sm:rounded-2xl bg-[#1B4332] text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/20 hover:bg-[#2D6A4F] transition-all group/btn">
                                                <Edit className="size-3.5 sm:size-4 mr-2 transition-transform group-hover/btn:-rotate-12" />
                                                <span className="hidden sm:inline">
                                                    Update Profile
                                                </span>
                                                <span className="sm:hidden">Update</span>
                                            </Button>
                                        }
                                    />
                                ) : (
                                    <Button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="h-10 sm:h-11 md:h-12 lg:h-14 px-4 sm:px-6 md:px-8 lg:px-10 rounded-xl sm:rounded-2xl bg-[#1B4332] text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/20 hover:bg-[#2D6A4F] transition-all group/btn"
                                    >
                                        <Edit className="size-3.5 sm:size-4 mr-2 transition-transform group-hover/btn:-rotate-12" />
                                        <span className="hidden sm:inline">Update Profile</span>
                                        <span className="sm:hidden">Update</span>
                                    </Button>
                                ))}
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-10 sm:size-11 md:size-12 lg:size-14 rounded-xl sm:rounded-2xl border-[#E8E4D8] bg-white text-[#8B9B7E] hover:text-primary transition-all shadow-sm"
                            >
                                <MoreVertical className="size-4 sm:size-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Quick Actions Bar (Fellow only) ─────────────────────────────────── */}
            {isFellow && (
                <div className="flex flex-col gap-3 sm:gap-4 py-3 sm:py-4 md:py-5 lg:py-6 px-3 sm:px-4 bg-white/40 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-[2rem] lg:rounded-[2.5rem] border-2 border-[#E8E4D8] shadow-sm animate-in fade-in slide-in-from-top-4 duration-1000">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-1 sm:px-2">
                        <ChevronRight className="size-3 sm:size-4 text-[#8B9B7E]" />
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] text-[#8B9B7E]">
                            Quick Access
                        </p>
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        <QuickActionButton
                            icon={Briefcase}
                            title="Portfolio Hub"
                            subtitle="Verify submissions & artifacts"
                            colorClass="text-emerald-700"
                            hoverClass="hover:bg-emerald-50 hover:text-emerald-800"
                        />
                        <QuickActionButton
                            icon={Target}
                            title="Performance Analytics"
                            subtitle="Review metrics & KPIs"
                            colorClass="text-blue-700"
                            hoverClass="hover:bg-blue-50 hover:text-blue-800"
                        />
                        <QuickActionButton
                            icon={Calendar}
                            title="Learning Sessions"
                            subtitle="Calendar & attendance"
                            colorClass="text-purple-700"
                            hoverClass="hover:bg-purple-50 hover:text-purple-800"
                        />
                        <QuickActionButton
                            icon={GraduationCap}
                            title="Reset Progress"
                            subtitle="Danger Zone"
                            colorClass="text-amber-700"
                            hoverClass="hover:bg-amber-50 hover:text-amber-800"
                            iconAnimation="group-hover:rotate-12"
                        />
                    </div>
                </div>
            )}

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
                    <Card className="rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 px-4 sm:px-5 md:px-6 py-3 sm:py-4">
                            <CardTitle className="text-sm sm:text-base md:text-lg font-serif flex items-center gap-2">
                                <Mail className="size-4 sm:size-5 text-primary/60" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 space-y-3 sm:space-y-4 md:space-y-5">
                            <InfoRow
                                icon={<Mail className="size-3.5 sm:size-4" />}
                                label="Email"
                                value={user.email}
                            />
                            <InfoRow
                                icon={<Phone className="size-3.5 sm:size-4" />}
                                label="Phone"
                                value={user.phone || "Not provided"}
                            />
                            <InfoRow
                                icon={<MapPin className="size-3.5 sm:size-4" />}
                                label="Location"
                                value={user.location || "Addis Ababa, Ethiopia"}
                            />
                            <InfoRow
                                icon={<Globe className="size-3.5 sm:size-4" />}
                                label="Primary Language"
                                value={user.primary_language || "Not specified"}
                            />
                            {isFellow && (
                                <>
                                    <InfoRow
                                        icon={<Calendar className="size-3.5 sm:size-4" />}
                                        label="Availability"
                                        value={user.availability || "Not specified"}
                                    />
                                    <InfoRow
                                        icon={<Target className="size-3.5 sm:size-4" />}
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
                        <Card className="rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden shadow-sm">
                            <CardHeader className="bg-muted/30 px-4 sm:px-5 md:px-6 py-3 sm:py-4">
                                <CardTitle className="text-sm sm:text-base md:text-lg font-serif flex items-center gap-2">
                                    <Award className="size-4 sm:size-5 text-primary/60" />
                                    Leadership & Professional Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-5 md:px-6 py-4 sm:py-6 md:py-8 space-y-5 sm:space-y-6 md:space-y-8">
                                {/* Qualifications & Experience Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                                    <div className="space-y-2 sm:space-y-3">
                                        <h4 className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                                            <GraduationCap className="size-3.5 sm:size-4" />
                                            Qualifications
                                        </h4>
                                        <p className="font-serif italic text-foreground text-sm sm:text-base leading-relaxed">
                                            {user.highest_qualification ||
                                                "Advanced Degree in leadership and management"}
                                        </p>
                                    </div>
                                    <div className="space-y-2 sm:space-y-3">
                                        <h4 className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                                            <Briefcase className="size-3.5 sm:size-4" />
                                            Leadership Experience
                                        </h4>
                                        <p className="font-serif italic text-foreground text-sm sm:text-base leading-relaxed">
                                            {user.leadership_experience_years || "0"} Years in
                                            Leadership Positions
                                        </p>
                                    </div>
                                </div>

                                {/* Key Skills */}
                                <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-dashed border-[#E8E4D8]">
                                    <h4 className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                                        <PieChart className="size-3.5 sm:size-4" />
                                        Key Skills
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {user.key_skills?.length ? (
                                            user.key_skills.map((skill, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="secondary"
                                                    className="bg-primary/5 text-primary border-primary/20 rounded-lg py-1 sm:py-1.5 px-2 sm:px-3 text-[11px] sm:text-xs font-medium"
                                                >
                                                    {skill}
                                                </Badge>
                                            ))
                                        ) : (
                                            <>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-primary/5 text-primary border-primary/20 rounded-lg py-1 sm:py-1.5 px-2 sm:px-3 text-[11px] sm:text-xs font-medium"
                                                >
                                                    Strategic Thinking
                                                </Badge>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-primary/5 text-primary border-primary/20 rounded-lg py-1 sm:py-1.5 px-2 sm:px-3 text-[11px] sm:text-xs font-medium"
                                                >
                                                    Team Coaching
                                                </Badge>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-primary/5 text-primary border-primary/20 rounded-lg py-1 sm:py-1.5 px-2 sm:px-3 text-[11px] sm:text-xs font-medium"
                                                >
                                                    Financial Planning
                                                </Badge>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Learning Goals */}
                                <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-dashed border-[#E8E4D8]">
                                    <h4 className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                                        <Target className="size-3.5 sm:size-4" />
                                        Learning Goals
                                    </h4>
                                    <div className="space-y-2 sm:space-y-2.5">
                                        {user.learning_goals?.length ? (
                                            user.learning_goals.map((goal, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-2 sm:gap-3 text-muted-foreground font-serif italic text-sm sm:text-base"
                                                >
                                                    <CheckCircle2 className="size-4 sm:size-5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span className="break-words leading-relaxed">
                                                        {goal}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground font-serif italic text-sm sm:text-base leading-relaxed">
                                                Enhance executive communication and master
                                                operational excellence frameworks.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Bio Section (for non-fellows or if bio exists) */}
                    {!isFellow && user.bio && (
                        <Card className="rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden shadow-sm">
                            <CardHeader className="bg-muted/30 px-4 sm:px-5 md:px-6 py-3 sm:py-4">
                                <CardTitle className="text-sm sm:text-base md:text-lg font-serif flex items-center gap-2">
                                    <User className="size-4 sm:size-5 text-primary/60" />
                                    About
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6">
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