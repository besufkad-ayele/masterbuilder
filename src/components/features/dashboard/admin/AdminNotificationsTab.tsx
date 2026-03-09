"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, Edit, Trash2, Loader2, Plus, ExternalLink, Megaphone } from 'lucide-react';
import { useAdminDashboardContext } from '@/context/AdminDashboardContext';
import { LDPNotification } from '@/types';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { firebaseService } from '@/services/firebaseService';
import NotificationCreationForm from './NotificationCreationForm';
import { cn } from "@/lib/utils";

const AdminNotificationsTab = () => {
    const { data, loading, refresh } = useAdminDashboardContext();
    const notifications = data?.notifications || [];
    const cohorts = data?.cohorts || [];

    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editingNotification, setEditingNotification] = useState<LDPNotification | null>(null);

    if (loading) return <LoadingSpinner />;

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            await firebaseService.notifications.deleteNotification(id);
            refresh();
        } catch (error) {
            console.error("Failed to delete notification", error);
        } finally {
            setIsDeleting(null);
        }
    };

    const toggleActive = async (notification: LDPNotification) => {
        try {
            await firebaseService.notifications.updateNotification(notification.id, {
                is_active: !notification.is_active
            });
            refresh();
        } catch (error) {
            console.error("Failed to update notification", error);
        }
    };

    const getAudienceLabel = (audience: string) => {
        if (audience === 'all') return 'All Users';
        if (audience === 'fellows') return 'All Fellows';
        if (audience === 'admins') return 'All Admins';
        const cohort = cohorts.find(c => c.id === audience);
        return cohort ? `Cohort: ${cohort.name}` : audience;
    };

    const getTypeColor = (type: LDPNotification['type']) => {
        switch (type) {
            case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
            case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'success': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-black">Engagement</p>
                    <h1 className="text-4xl font-serif text-foreground mt-1">Notification Center</h1>
                    <p className="mt-2 text-base text-muted-foreground max-w-2xl font-medium">
                        Broadcast updates, alerts, and milestones to fellows and admins across the platform.
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl h-12 px-6 shadow-lg shadow-[#1B4332]/10"
                >
                    <Plus className="size-4 mr-2" />
                    Create Broadcast
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {notifications.length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/30 rounded-[2.5rem] p-20 text-center">
                        <Megaphone className="size-12 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="text-xl font-serif text-muted-foreground">No active broadcasts</h3>
                        <p className="text-muted-foreground/60 text-sm mt-2">Your notification history will appear here.</p>
                    </Card>
                ) : (
                    notifications.map((n) => (
                        <Card key={n.id} className={cn(
                            "rounded-[2.5rem] border-border overflow-hidden transition-all hover:shadow-xl",
                            !n.is_active && "opacity-60 grayscale"
                        )}>
                            <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                                {n.image_url ? (
                                    <div className="w-full md:w-48 h-32 rounded-[2rem] overflow-hidden shrink-0">
                                        <img src={n.image_url} alt={n.title} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-full md:w-24 h-24 rounded-[2rem] bg-muted flex items-center justify-center shrink-0">
                                        <Bell className="size-8 text-muted-foreground/40" />
                                    </div>
                                )}

                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge variant="outline" className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest", getTypeColor(n.type))}>
                                            {n.type}
                                        </Badge>
                                        <Badge variant="secondary" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                            {getAudienceLabel(n.target_audience)}
                                        </Badge>
                                        {!n.is_active && (
                                            <Badge variant="destructive" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-stone-500 hover:bg-stone-600">
                                                Inactive
                                            </Badge>
                                        )}
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-auto">
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">{n.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                            {n.message}
                                        </p>
                                    </div>

                                    {n.link && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                            <ExternalLink className="size-3" />
                                            <a href={n.link} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-xs">{n.link}</a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-border">
                                    <Button
                                        variant={n.is_active ? "outline" : "default"}
                                        size="sm"
                                        className="flex-1 md:w-32 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                        onClick={() => toggleActive(n)}
                                    >
                                        {n.is_active ? "Deactivate" : "Activate"}
                                    </Button>
                                    <div className="flex gap-2 flex-1 md:w-32">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="flex-1 rounded-xl"
                                            onClick={() => setEditingNotification(n)}
                                        >
                                            <Edit className="size-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="flex-1 rounded-xl text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(n.id)}
                                            disabled={isDeleting === n.id}
                                        >
                                            {isDeleting === n.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {(isCreating || editingNotification) && (
                <Dialog open onOpenChange={() => { setIsCreating(false); setEditingNotification(null); }}>
                    <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                        <div className="bg-[#1B4332] p-10 text-white relative">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <Megaphone size={120} />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-serif italic">
                                    {editingNotification ? "Edit Broadcast" : "New Broadcast"}
                                </DialogTitle>
                                <DialogDescription className="text-white/60 font-medium">
                                    Define the message architecture and target audience.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="p-10 bg-white">
                            <NotificationCreationForm
                                onCreated={() => { setIsCreating(false); setEditingNotification(null); refresh(); }}
                                onCancel={() => { setIsCreating(false); setEditingNotification(null); }}
                                initialData={editingNotification || undefined}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default AdminNotificationsTab;
