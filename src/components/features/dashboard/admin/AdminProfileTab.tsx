"use client";

import { useEffect, useState } from "react";
import UserProfileDetail from "./UserProfileDetail";
import ChangePasswordForm from "./ChangePasswordForm";
import { StorageService } from "@/services/storageService";
import { User } from "@/types";
import { Loader2 } from "lucide-react";

export default function AdminProfileTab() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const currentUser = StorageService.getCurrentUser();
            if (currentUser) {
                try {
                    // Fetch full profile from Firestore to get the document ID
                    let profile: any = null;
                    if (currentUser.role === 'ADMIN') {
                        const { AdminManagementService } = await import("@/services/AdminManagementService");
                        const admins = await AdminManagementService.getAllAdmins();
                        profile = admins.find(a => a.user_id === currentUser.id);
                    } else if (currentUser.role === 'FACILITATOR') {
                        const { FacilitatorService } = await import("@/services/FacilitatorService");
                        const facilitators = await FacilitatorService.getAllFacilitators();
                        profile = facilitators.find(f => f.user_id === currentUser.id);
                    }

                    if (profile) {
                        setUser({
                            ...currentUser,
                            ...profile,
                            id: profile.id, // This is the Firestore ID
                            user_id: currentUser.id // This is the Auth UID
                        } as any);
                    } else {
                        setUser(currentUser);
                    }
                } catch (error) {
                    console.error("Error fetching full profile:", error);
                    setUser(currentUser);
                }
            }
            setLoading(false);
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="size-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <h3 className="text-2xl font-serif text-muted-foreground">User profile not found.</h3>
            </div>
        );
    }

    // Adapt User type to UserProfileDetail's expected format if necessary
    const displayUser = {
        ...user,
        status: "Active", // Default if not in user object
        joinedDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : "Feb 2026",
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <p className="text-xs uppercase tracking-[0.4em] text-primary font-black mb-2">Account Settings</p>
                <h1 className="text-5xl font-serif font-bold text-foreground">My Profile</h1>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                <div className="xl:col-span-2">
                    <UserProfileDetail user={displayUser as any} isEditable={true} />
                </div>
                <div className="xl:col-span-1">
                    <ChangePasswordForm />
                </div>
            </div>
        </div>
    );
}
