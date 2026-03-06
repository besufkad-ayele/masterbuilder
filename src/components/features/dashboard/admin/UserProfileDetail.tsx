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
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
        id: string; // This is the PROFILE ID
        user_id: string; // This is the AUTH UID
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
        // ... (other fields kept same)
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

export default function UserProfileDetail({ user, isEditable = false, onUpdate }: UserProfileDetailProps) {
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
        title: user.current_role || user.role
    });

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            if (normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRATOR') {
                await AdminManagementService.updateAdminProfile(user.id, user.user_id, {
                    name: editData.name,
                    email: editData.email,
                    title: editData.title,
                    phone: editData.phone,
                    location: editData.location,
                    bio: editData.bio
                });
            } else if (normalizedRole === 'FACILITATOR') {
                await FacilitatorService.updateFacilitator(user.id, user.user_id, {
                    full_name: editData.name,
                    email: editData.email,
                    phone: editData.phone,
                    location: editData.location,
                    bio: editData.bio
                });
            } else if (user.role === 'FELLOW') {
                await FellowService.updateFellowProfile(user.id, user.user_id, {
                    full_name: editData.name,
                    email: editData.email,
                    phone: editData.phone,
                    location: editData.location,
                    bio: editData.bio
                });
            }

            setIsEditModalOpen(false);
            if (onUpdate) onUpdate();
            else window.location.reload(); // Fallback for simple refresh
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Premium Header Section */}
            <div className="relative group/header">
                {/* Background Gradient with Pattern */}
                <div className="h-64 w-full rounded-[3.5rem] bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#52B788] border-b-4 border-white/20 overflow-hidden relative shadow-2xl">
                    <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                        <Globe size={400} className="absolute -right-20 -bottom-20 rotate-12" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
                    </div>

                    {/* Decorative floating elements */}
                    <div className="absolute top-10 left-10 size-3 rounded-full bg-white/30 animate-pulse" />
                    <div className="absolute bottom-12 right-1/4 size-2 rounded-full bg-white/20" />
                </div>

                {/* Avatar & Key Info - Overlapping with better spacing */}
                <div className="px-8 md:px-14 -mt-24 flex flex-col xl:flex-row items-end xl:items-center gap-8 relative z-10 w-full">
                    <div className="relative shrink-0">
                        <Avatar className="size-44 rounded-[3.5rem] border-[12px] border-white shadow-[0_32px_64px_rgba(0,0,0,0.15)] group-hover/header:rotate-1 transition-transform duration-700">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-5xl font-serif font-black bg-[#FDFCF6] text-primary">
                                {user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-2 right-2 size-10 rounded-2xl bg-white shadow-lg border border-[#E8E4D8] flex items-center justify-center text-primary">
                            {isFellow ? <GraduationCap size={20} /> : <ShieldCheck size={20} />}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row lg:items-end justify-between gap-8 w-full pb-2">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-4">
                                <h2 className="text-4xl xl:text-5xl font-serif font-bold text-[#1B4332] tracking-tight">{user.name}</h2>
                                <Badge className={cn(
                                    "rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-md",
                                    user.status === "Active" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                                )}>
                                    {user.status}
                                </Badge>
                                {user.fellow_id && (
                                    <div className="px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-[#E8E4D8] text-[10px] font-black text-[#8B9B7E] tracking-widest shadow-sm">
                                        ID: {user.fellow_id}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xl xl:text-2xl text-[#1B4332]/60 font-serif italic">
                                <span>{user.current_role || user.role}</span>
                                <span className="size-1.5 rounded-full bg-primary/30" />
                                <span>{user.organization || user.company || "Lead Life System"}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {isEditable && (
                                isFellow ? (
                                    <FellowUpdateForm
                                        fellow={user as any}
                                        onFellowUpdated={onUpdate || (() => window.location.reload())}
                                        trigger={
                                            <Button className="h-14 px-10 rounded-2xl bg-[#1B4332] text-white font-bold text-sm shadow-xl shadow-primary/20 hover:bg-[#2D6A4F] transition-all group/btn">
                                                <Edit className="w-4 h-4 mr-3 transition-transform group-hover/btn:-rotate-12" />
                                                Update Profile
                                            </Button>
                                        }
                                    />
                                ) : (
                                    <Button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="h-14 px-10 rounded-2xl bg-[#1B4332] text-white font-bold text-sm shadow-xl shadow-primary/20 hover:bg-[#2D6A4F] transition-all group/btn"
                                    >
                                        <Edit className="w-4 h-4 mr-3 transition-transform group-hover/btn:-rotate-12" />
                                        Update Profile
                                    </Button>
                                )
                            )}
                            <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-[#E8E4D8] bg-white text-[#8B9B7E] hover:text-primary transition-all shadow-sm">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role-Specific Quick Actions Bar */}
            {isFellow && (
                <div className="flex flex-wrap items-center gap-4 py-6 px-4 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-[#E8E4D8] shadow-sm animate-in fade-in slide-in-from-top-4 duration-1000">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B9B7E] px-4 border-r border-[#E8E4D8]">Quick Access</p>
                    <div className="flex flex-wrap gap-2 flex-1">
                        <Button variant="ghost" className="rounded-xl px-6 py-6 h-auto text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all group">
                            <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <Briefcase className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Portfolio Hub
                                </div>
                                <span className="text-[10px] text-emerald-600/60 font-medium">Verify submissions & artifacts</span>
                            </div>
                        </Button>
                        <Button variant="ghost" className="rounded-xl px-6 py-6 h-auto text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-all group">
                            <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <Target className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Performance Analytics
                                </div>
                                <span className="text-[10px] text-blue-600/60 font-medium">Review metrics & KPIs</span>
                            </div>
                        </Button>
                        <Button variant="ghost" className="rounded-xl px-6 py-6 h-auto text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-all group">
                            <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Learning Sessions
                                </div>
                                <span className="text-[10px] text-purple-600/60 font-medium">Calendar & attendance</span>
                            </div>
                        </Button>
                        <Button variant="ghost" className="ml-auto rounded-xl px-6 py-6 h-auto text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-all group">
                            <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <GraduationCap className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                    Reset Progress
                                </div>
                                <span className="text-[10px] text-amber-600/60 font-medium underline underline-offset-4 decoration-dotted">Danger Zone</span>
                            </div>
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif font-bold">Edit Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-primary/60">Full Name</label>
                            <Input
                                value={editData.name}
                                onChange={e => setEditData({ ...editData, name: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-primary/60">Email Address</label>
                            <Input
                                type="email"
                                value={editData.email}
                                onChange={e => setEditData({ ...editData, email: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">Phone</label>
                                <Input
                                    value={editData.phone}
                                    onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">Location</label>
                                <Input
                                    value={editData.location}
                                    onChange={e => setEditData({ ...editData, location: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>
                        {!isFellow && (
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">System Identity Badge</label>
                                <div className="p-3 bg-stone-100 rounded-xl font-mono text-[10px] text-stone-500 flex items-center justify-between">
                                    <span>UID: {user.user_id}</span>
                                    <Lock className="size-3 opacity-30" />
                                </div>
                            </div>
                        )}
                        {(normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRATOR' || normalizedRole === 'FACILITATOR') && (
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">Title / Role</label>
                                <Input
                                    value={editData.title}
                                    onChange={e => setEditData({ ...editData, title: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-primary/60">Bio</label>
                            <Textarea
                                value={editData.bio}
                                onChange={e => setEditData({ ...editData, bio: e.target.value })}
                                className="rounded-xl min-h-[100px]"
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isUpdating} className="rounded-full px-8">
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
                {/* Left Column: Info Cards */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg font-serif">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
                            <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={user.phone || "Not provided"} />
                            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={user.location || "Addis Ababa, Ethiopia"} />
                            <InfoRow icon={<Globe className="w-4 h-4" />} label="Primary Language" value={user.primary_language || "Not specified"} />
                            {isFellow && (
                                <>
                                    <InfoRow icon={<Calendar className="w-4 h-4" />} label="Availability" value={user.availability || "Not specified"} />
                                    <InfoRow icon={<Target className="w-4 h-4" />} label="Leadership Track" value={user.leadership_track || "General"} />
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Narrative & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {isFellow && (
                        /* Professional Context */
                        <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg font-serif">Leadership & Professional Profile</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4" />
                                            Qualifications
                                        </h4>
                                        <p className="font-serif italic text-foreground">
                                            {user.highest_qualification || "Advanced Degree in leadership and management"}
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            Leadership Experience
                                        </h4>
                                        <p className="font-serif italic text-foreground">
                                            {user.leadership_experience_years || "0"} Years in Leadership Positions
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-dashed">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <PieChart className="w-4 h-4" />
                                        Key Skills
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.key_skills?.length ? user.key_skills.map((skill, i) => (
                                            <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/20 rounded-lg py-1 px-3">
                                                {skill}
                                            </Badge>
                                        )) : (
                                            <>
                                                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 rounded-lg py-1 px-3">Strategic Thinking</Badge>
                                                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 rounded-lg py-1 px-3">Team Coaching</Badge>
                                                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 rounded-lg py-1 px-3">Financial Planning</Badge>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-dashed">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Learning Goals
                                    </h4>
                                    <div className="space-y-2">
                                        {user.learning_goals?.length ? user.learning_goals.map((goal, i) => (
                                            <div key={i} className="flex items-center gap-3 text-muted-foreground font-serif italic italic">
                                                <CheckCircle2 className="size-4 text-emerald-500" />
                                                {goal}
                                            </div>
                                        )) : (
                                            <p className="text-muted-foreground font-serif italic">Enhance executive communication and master operational excellence frameworks.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}

function ActivityItem({ title, time, icon }: { title: string; time: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-4">
            <div className="size-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
                {icon}
            </div>
            <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{title}</span>
                <span className="text-xs text-muted-foreground">{time}</span>
            </div>
        </div>
    );
}
