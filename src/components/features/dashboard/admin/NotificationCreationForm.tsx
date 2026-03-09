"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LDPNotification } from '@/types';
import { useAdminDashboardContext } from '@/context/AdminDashboardContext';
import { firebaseService } from '@/services/firebaseService';
import { Loader2 } from 'lucide-react';

interface NotificationCreationFormProps {
    onCreated: () => void;
    onCancel: () => void;
    initialData?: LDPNotification;
}

const NotificationCreationForm: React.FC<NotificationCreationFormProps> = ({ onCreated, onCancel, initialData }) => {
    const { data } = useAdminDashboardContext();
    const cohorts = data?.cohorts || [];

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<LDPNotification>>(initialData || {
        title: '',
        message: '',
        image_url: '',
        type: 'info',
        link: '',
        is_active: true,
        target_audience: 'all'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData?.id) {
                await firebaseService.notifications.updateNotification(initialData.id, formData);
            } else {
                await firebaseService.notifications.createNotification(formData as any);
            }
            onCreated();
        } catch (error) {
            console.error("Failed to save notification", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-[#1B4332]/60">Headline</Label>
                    <Input
                        id="title"
                        placeholder="e.g. Wave 1 Graduation Approaching!"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="rounded-xl border-stone-200 focus:ring-[#1B4332]"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type" className="text-xs font-black uppercase tracking-widest text-[#1B4332]/60">Broadcast Type</Label>
                    <Select
                        value={formData.type}
                        onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                    >
                        <SelectTrigger className="rounded-xl border-stone-200">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="info">Information</SelectItem>
                            <SelectItem value="success">Achievement</SelectItem>
                            <SelectItem value="warning">Alert</SelectItem>
                            <SelectItem value="urgent">Urgent Action</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="message" className="text-xs font-black uppercase tracking-widest text-[#1B4332]/60">Detailed Message</Label>
                <Textarea
                    id="message"
                    placeholder="Detailed narrative for the broadcast..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={4}
                    className="rounded-xl border-stone-200 focus:ring-[#1B4332]"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="audience" className="text-xs font-black uppercase tracking-widest text-[#1B4332]/60">Target Audience</Label>
                    <Select
                        value={formData.target_audience}
                        onValueChange={(val) => setFormData({ ...formData, target_audience: val })}
                    >
                        <SelectTrigger className="rounded-xl border-stone-200">
                            <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">Global (All Users)</SelectItem>
                            <SelectItem value="fellows">All Fellows</SelectItem>
                            <SelectItem value="admins">All Admins</SelectItem>
                            {cohorts.map((c) => (
                                <SelectItem key={c.id} value={c.id}>Cohort: {c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="link" className="text-xs font-black uppercase tracking-widest text-[#1B4332]/60">Action Link (Optional)</Label>
                    <Input
                        id="link"
                        placeholder="https://..."
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        className="rounded-xl border-stone-200 focus:ring-[#1B4332]"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="image" className="text-xs font-black uppercase tracking-widest text-[#1B4332]/60">Visual Assets (Image URL)</Label>
                <Input
                    id="image"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="rounded-xl border-stone-200 focus:ring-[#1B4332]"
                />
            </div>

            <div className="flex items-center gap-4 pt-4">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-widest text-xs"
                    disabled={loading}
                >
                    Discard
                </Button>
                <Button
                    type="submit"
                    className="flex-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl h-12 px-8 font-bold uppercase tracking-widest text-xs shadow-xl"
                    disabled={loading}
                >
                    {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                    {initialData ? "Apply Changes" : "Launch Broadcast"}
                </Button>
            </div>
        </form>
    );
};

export default NotificationCreationForm;
