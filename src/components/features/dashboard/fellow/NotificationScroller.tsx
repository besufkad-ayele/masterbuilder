"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LDPNotification } from '@/types';
import { Bell, ChevronRight, ChevronLeft, Info, AlertTriangle, CheckCircle, Flame, Megaphone, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NotificationScrollerProps {
    notifications: LDPNotification[];
}

const NotificationScroller: React.FC<NotificationScrollerProps> = ({ notifications }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (notifications.length <= 1) return;
        const interval = setInterval(() => {
            handleNext();
        }, 6000);
        return () => clearInterval(interval);
    }, [notifications.length]);

    const handleNext = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % notifications.length);
            setIsTransitioning(false);
        }, 500);
    };

    const handlePrev = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + notifications.length) % notifications.length);
            setIsTransitioning(false);
        }, 500);
    };

    if (notifications.length === 0) {
        return (
            <Card className="rounded-[3rem] border-[#E8E4D8] overflow-hidden bg-[#1B4332]/5 border-dashed group hover:bg-[#1B4332]/10 transition-colors">
                <CardContent className="p-10 text-center flex flex-col items-center justify-center min-h-[240px]">
                    <div className="size-16 rounded-full bg-white flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                        <Megaphone className="size-8 text-[#1B4332]/20" />
                    </div>
                    <p className="text-sm font-bold text-[#1B4332]/40 uppercase tracking-[0.2em]">Silence is Golden</p>
                    <p className="text-xs text-[#1B4332]/30 mt-2 font-medium">No system-wide broadcasts at this moment.</p>
                </CardContent>
            </Card>
        );
    }

    const current = notifications[currentIndex];

    const getTypeStyles = (type: LDPNotification['type']) => {
        switch (type) {
            case 'urgent': return { icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', badge: 'bg-red-500', gradient: 'from-red-500/20 to-transparent' };
            case 'warning': return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', badge: 'bg-amber-500', gradient: 'from-amber-500/20 to-transparent' };
            case 'success': return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', badge: 'bg-emerald-500', gradient: 'from-emerald-500/20 to-transparent' };
            default: return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', badge: 'bg-blue-500', gradient: 'from-blue-500/20 to-transparent' };
        }
    };

    const styles = getTypeStyles(current.type);
    const Icon = styles.icon;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[#C5A059]" />
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[#1B4332]/40">Intelligence Feed</h3>
                </div>
                {notifications.length > 1 && (
                    <div className="flex gap-1">
                        <button onClick={handlePrev} className="size-8 rounded-full bg-white border border-[#E8E4D8] flex items-center justify-center hover:bg-[#1B4332] hover:text-white transition-all shadow-sm">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={handleNext} className="size-8 rounded-full bg-white border border-[#E8E4D8] flex items-center justify-center hover:bg-[#1B4332] hover:text-white transition-all shadow-sm">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="relative group">
                <Card className={cn(
                    "rounded-[3rem] border-2 transition-all duration-700 overflow-hidden shadow-[0_20px_50px_rgba(27,67,50,0.1)]",
                    styles.border,
                    "bg-white h-full min-h-[400px] flex flex-col",
                    isTransitioning ? "opacity-0 scale-95 translate-y-4" : "opacity-100 scale-100 translate-y-0"
                )}>
                    {current.image_url ? (
                        <div className="h-64 w-full overflow-hidden relative shrink-0">
                            <img
                                src={current.image_url}
                                alt={current.title}
                                className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-110"
                            />
                            <div className={cn("absolute inset-0 bg-gradient-to-t", styles.gradient)} />
                            <Badge className={cn("absolute top-6 left-6 border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 shadow-xl", styles.badge, "text-white")}>
                                {current.type}
                            </Badge>
                        </div>
                    ) : (
                        <div className={cn("h-40 w-full flex items-center justify-center relative shrink-0 overflow-hidden", styles.bg)}>
                            <div className="absolute inset-0 opacity-10 rotate-12 scale-150">
                                <Icon size={200} />
                            </div>
                            <div className="size-20 rounded-3xl bg-white shadow-2xl flex items-center justify-center z-10 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                                <Icon className={cn("size-10", styles.color)} />
                            </div>
                            <Badge className={cn("absolute top-6 left-6 border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 shadow-xl", styles.badge, "text-white")}>
                                {current.type}
                            </Badge>
                        </div>
                    )}

                    <CardContent className="p-10 flex flex-col flex-1">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn("size-2 rounded-full animate-pulse", styles.badge)} />
                                <span className="text-[10px] font-black text-[#1B4332]/40 uppercase tracking-widest">
                                    Broadcast Live
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                                {new Date(current.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>

                        <h3 className="text-3xl font-serif font-bold text-[#1B4332] mb-4 leading-[1.1] tracking-tight group-hover:text-[#C5A059] transition-colors">
                            {current.title}
                        </h3>

                        <p className="text-sm text-[#1B4332]/60 font-medium leading-relaxed line-clamp-4">
                            {current.message}
                        </p>

                        <div className="mt-auto pt-10">
                            {current.link ? (
                                <Button
                                    className="w-full rounded-[1.5rem] h-14 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#1B4332]/10 transition-all active:scale-95"
                                    onClick={() => window.open(current.link, '_blank')}
                                >
                                    Take Action
                                    <ChevronRight className="ml-2 size-4" />
                                </Button>
                            ) : (
                                <div className="h-14 w-full rounded-[1.5rem] border border-[#1B4332]/10 flex items-center justify-center px-6">
                                    <Bell className="size-4 text-[#1B4332]/20 mr-3" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1B4332]/30">Global Intelligence Update</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {notifications.length > 1 && (
                    <div className="absolute -bottom-8 left-0 w-full flex justify-center gap-2">
                        {notifications.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setIsTransitioning(true);
                                    setTimeout(() => {
                                        setCurrentIndex(i);
                                        setIsTransitioning(false);
                                    }, 300);
                                }}
                                className={cn(
                                    "size-1.5 rounded-full transition-all duration-500",
                                    i === currentIndex ? "w-10 bg-[#C5A059]" : "bg-[#1B4332]/10 hover:bg-[#1B4332]/30"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationScroller;
