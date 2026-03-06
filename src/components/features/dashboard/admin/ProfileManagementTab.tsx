"use client";

import { useState } from "react";
import AdminFellowsTab from "./AdminFellowsTab";
import AdminAdminsTab from "./AdminAdminsTab";
import AdminFacilitatorsTab from "./AdminFacilitatorsTab";
import { GraduationCap, ShieldCheck, UserCog, ChevronRight, ArrowLeft, LayoutDashboard, Briefcase, Users, Settings2 as LucideSettings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JSX } from "react";

type ManagementType = "fellow" | "facilitator" | "admin" | "hub";

export default function ProfileManagementTab() {
    const [activeView, setActiveView] = useState<ManagementType>("hub");

    if (activeView !== "hub") {
        const views: Record<string, JSX.Element> = {
            fellow: <AdminFellowsTab />,
            facilitator: <AdminFacilitatorsTab />,
            admin: <AdminAdminsTab />
        };

        return (
            <div className="flex gap-8 animate-in fade-in duration-700">
                {/* Side Management Switcher */}
                <div className="hidden xl:flex flex-col gap-3 w-20 py-8 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-[#E8E4D8] sticky top-8 h-fit items-center shadow-xl">
                    <button
                        onClick={() => setActiveView("hub")}
                        className="size-12 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-stone-100 transition-all mb-4"
                        title="Back to Hub"
                    >
                        <LayoutDashboard className="size-6" />
                    </button>

                    <button
                        onClick={() => setActiveView("fellow")}
                        className={cn(
                            "size-12 rounded-2xl flex items-center justify-center transition-all",
                            activeView === "fellow" ? "bg-[#1B4332] text-white shadow-lg" : "text-[#1B4332]/40 hover:bg-emerald-50"
                        )}
                        title="Fellow Management"
                    >
                        <Users className="size-6" />
                    </button>

                    <button
                        onClick={() => setActiveView("facilitator")}
                        className={cn(
                            "size-12 rounded-2xl flex items-center justify-center transition-all",
                            activeView === "facilitator" ? "bg-amber-600 text-white shadow-lg" : "text-amber-600/40 hover:bg-amber-50"
                        )}
                        title="Facilitator Management"
                    >
                        <Briefcase className="size-6" />
                    </button>

                    <button
                        onClick={() => setActiveView("admin")}
                        className={cn(
                            "size-12 rounded-2xl flex items-center justify-center transition-all",
                            activeView === "admin" ? "bg-blue-600 text-white shadow-lg" : "text-blue-600/40 hover:bg-blue-50"
                        )}
                        title="Admin Management"
                    >
                        <ShieldCheck className="size-6" />
                    </button>
                </div>

                <div className="flex-1 space-y-6">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveView("hub")}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all hover:bg-white/50 rounded-full font-serif font-bold italic px-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile Management
                    </Button>
                    {views[activeView]}
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div>
                <p className="text-xs uppercase tracking-[0.4em] text-primary font-black mb-2">System Administration</p>
                <h1 className="text-5xl font-serif font-bold text-foreground tracking-tight">Profile Management</h1>
                <p className="mt-4 text-xl text-muted-foreground max-w-3xl font-serif italic">
                    Select a management domain to oversee users across the leadership development ecosystem.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Fellow Management Card */}
                <ManagementCard
                    title="Fellow Management"
                    description="Oversee early-career leadership participants"
                    icon={<GraduationCap className="w-10 h-10" />}
                    type="fellow"
                    onClick={() => setActiveView("fellow")}
                    tag="Learning Portal"
                    gradient="from-[#1B4332] via-[#2D6A4F] to-[#52B788]"
                />

                {/* Facilitator Management Card */}
                <ManagementCard
                    title="Facilitator Management"
                    description="Manage facilitators and training oversight"
                    icon={<Briefcase className="w-10 h-10" />}
                    type="facilitator"
                    onClick={() => setActiveView("facilitator")}
                    tag="Facilitator Portal"
                    gradient="from-[#78350F] via-[#B45309] to-[#F59E0B]"
                />

                {/* Admin Management Card */}
                <ManagementCard
                    title="Admin Management"
                    description="Configure system administrators and permissions"
                    icon={<ShieldCheck className="w-10 h-10" />}
                    type="admin"
                    onClick={() => setActiveView("admin")}
                    tag="Admin Console"
                    gradient="from-[#1E3A8A] via-[#2563EB] to-[#60A5FA]"
                />
            </div>
        </div>
    );
}


interface ManagementCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    type: ManagementType;
    onClick: () => void;
    tag: string;
    gradient: string;
}

function ManagementCard({ title, description, icon, type, onClick, tag, gradient }: ManagementCardProps) {
    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col text-left rounded-[3rem] border border-[#E8E4D8] bg-white transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_40px_80px_rgba(27,67,50,0.15)] hover:border-primary/30 overflow-hidden outline-none"
        >
            {/* Gradient Header - Matching Login Style */}
            <div className={cn(
                "relative h-56 w-full bg-gradient-to-br transition-all duration-700 overflow-hidden flex items-center justify-center",
                gradient
            )}>
                {/* Decorative blurs */}
                <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-4 -left-4 size-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
                <div className="absolute top-8 left-8 size-2.5 rounded-full bg-white/30" />
                <div className="absolute bottom-10 right-10 size-1.5 rounded-full bg-white/20" />

                {/* Accent lines */}
                <div className="absolute top-1/2 right-0 w-24 h-px bg-white/10 -rotate-12 translate-x-12" />
                <div className="absolute bottom-1/4 left-0 w-32 h-px bg-white/5 rotate-45 -translate-x-16" />

                {/* Icon Cluster */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="size-20 rounded-[2rem] flex items-center justify-center border border-white/20 shadow-2xl bg-white/10 backdrop-blur-md group-hover:bg-white/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                        <div className="text-white">
                            {icon}
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 border border-white/20 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                        {tag}
                    </span>
                </div>
            </div>

            {/* Body Content */}
            <div className="p-10 flex flex-col flex-1 pb-12">
                <div className="flex-1 space-y-4">
                    <h3 className="text-3xl font-serif font-bold text-[#1B4332] leading-tight group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-lg text-[#1B4332]/60 font-serif italic leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-10 pt-8 border-t border-[#E8E4D8]">
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1B4332]/40 group-hover:text-primary transition-colors">
                        Enter Workspace
                    </span>
                    <div className="size-11 rounded-full flex items-center justify-center bg-[#1B4332]/5 group-hover:bg-primary group-hover:shadow-[0_10px_20px_rgba(27,67,50,0.3)] transition-all duration-500 group-hover:translate-x-1">
                        <ChevronRight className="w-5 h-5 text-primary group-hover:text-white" />
                    </div>
                </div>
            </div>

            {/* Subtle background icon for hover */}
            <div className="absolute -bottom-8 -right-8 opacity-0 group-hover:opacity-[0.03] transition-all duration-1000 rotate-12 scale-150 pointer-events-none text-primary">
                {icon}
            </div>
        </button>
    );
}
