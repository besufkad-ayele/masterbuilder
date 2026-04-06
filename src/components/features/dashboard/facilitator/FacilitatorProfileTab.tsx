"use client";

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/services/storageService';
import { FacilitatorService } from '@/services/FacilitatorService';
import UserProfileDetail from '@/components/features/dashboard/admin/UserProfileDetail';
import { Loader2 } from 'lucide-react';

const FacilitatorProfileTab: React.FC = () => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const currentUser = StorageService.getCurrentUser();
            if (currentUser) {
                try {
                    const facilitators = await FacilitatorService.getAllFacilitators();
                    const profile = facilitators.find(f => f.user_id === currentUser.id);
                    
                    if (profile) {
                        setUser({
                            ...currentUser,
                            ...profile,
                            id: profile.id,
                            user_id: currentUser.id,
                            name: profile.full_name || currentUser.name,
                            status: profile.is_active ? 'Active' : 'Inactive',
                            joinedDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'
                        });
                    } else {
                        setUser(currentUser);
                    }
                } catch (error) {
                    console.error("Error fetching facilitator profile:", error);
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

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div>
                <p className="text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-primary font-black mb-2">Account Settings</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground">My Profile</h1>
            </div>

            <UserProfileDetail 
                user={user} 
                isEditable={true}
                onUpdate={() => window.location.reload()}
            />
        </div>
    );
};

export default FacilitatorProfileTab;
