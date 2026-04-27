"use client";

import { useState, useEffect } from "react";
import { 
    User, 
    Mail, 
    Briefcase, 
    Shield, 
    Clock,
    Camera,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StorageService } from "@/services/storageService";
import { CoachService } from "@/services/CoachService";
import { CoachProfile } from "@/types";

export default function CoachProfileTab() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<CoachProfile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const user = StorageService.getCurrentUser();
            if (!user) return;

            try {
                const data = await CoachService.getCoachByUserId(user.id);
                setProfile(data);
            } catch (error) {
                console.error("Error fetching coach profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold">My Profile</h1>
                <p className="text-muted-foreground font-serif italic">View and manage your coach account details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <Card className="md:col-span-1 rounded-[2.5rem] border-2 border-primary/5 bg-white overflow-hidden shadow-sm">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="size-32 rounded-[2rem] bg-primary/5 border-2 border-primary/10 flex items-center justify-center text-primary text-4xl font-black mb-6">
                                {profile?.full_name[0]}
                            </div>
                            <button className="absolute bottom-4 right-0 p-2 rounded-xl bg-white border border-primary/10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="size-4 text-primary" />
                            </button>
                        </div>
                        
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-1">{profile?.full_name}</h2>
                        <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full font-black text-[10px] uppercase tracking-widest px-4 py-1 mb-6">
                            Master Coach
                        </Badge>

                        <div className="w-full pt-6 border-t border-primary/5 space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-serif italic">Account Status</span>
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <div className="size-1.5 rounded-full bg-emerald-500" />
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-serif italic">Role</span>
                                <span className="font-bold">Lead Facilitator</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Details */}
                <Card className="md:col-span-2 rounded-[2.5rem] border-2 border-primary/5 bg-white shadow-sm overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
                            <Shield className="size-5 text-primary" />
                            Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 px-1">Full Name</label>
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 border border-primary/5">
                                    <User className="size-4 text-primary/40" />
                                    <span className="font-bold">{profile?.full_name}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 px-1">Email Address</label>
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 border border-primary/5">
                                    <Mail className="size-4 text-primary/40" />
                                    <span className="font-bold">{profile?.email}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 px-1">Professional Title</label>
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 border border-primary/5">
                                    <Briefcase className="size-4 text-primary/40" />
                                    <span className="font-bold">{profile?.title || "Executive Coach"}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 px-1">Member Since</label>
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 border border-primary/5">
                                    <Clock className="size-4 text-primary/40" />
                                    <span className="font-bold">
                                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-primary/5">
                            <Button 
                                variant="outline" 
                                className="rounded-full border-2 border-primary/10 font-serif font-bold italic"
                                disabled
                            >
                                Request Profile Update
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
