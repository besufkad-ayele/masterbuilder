"use client";

import { useState } from "react";
import AdminFellowsTab from "./AdminFellowsTab";
import AdminAdminsTab from "./AdminAdminsTab";
import AdminFacilitatorsTab from "./AdminFacilitatorsTab";
import AdminCoachesTab from "./AdminCoachesTab";
import {
    GraduationCap,
    ShieldCheck,
    UserCog,
    ChevronRight,
    ArrowLeft,
    LayoutDashboard,
    Briefcase,
    Users,
    Users2,
    Settings2 as LucideSettings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JSX } from "react";

type ManagementType = "fellow" | "facilitator" | "coach" | "admin" | "hub";

// ─── Navigation Item Component ────────────────────────────────────────────────

interface NavItemProps {
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    activeClass: string;
    inactiveClass: string;
    size?: "sm" | "md";
}

function NavItem({
    isActive,
    onClick,
    icon,
    label,
    activeClass,
    inactiveClass,
    size = "md",
}: NavItemProps) {
    const sizeClasses = {
        sm: "size-10 rounded-xl",
        md: "size-11 sm:size-12 rounded-xl sm:rounded-2xl",
    };

    const iconSizeClasses = {
        sm: "size-5",
        md: "size-5 sm:size-6",
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center justify-center transition-all duration-300 shrink-0",
                sizeClasses[size],
                isActive ? activeClass : inactiveClass
            )}
            title={label}
            aria-label={label}
        >
            <span className={iconSizeClasses[size]}>{icon}</span>
        </button>
    );
}

// ─── Management Card Component (Medium Size) ─────────────────────────────────

interface ManagementCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    type: ManagementType;
    onClick: () => void;
    tag: string;
    gradient: string;
}

function ManagementCard({
    title,
    description,
    icon,
    type,
    onClick,
    tag,
    gradient,
}: ManagementCardProps) {
    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col text-left rounded-xl sm:rounded-2xl md:rounded-[1.75rem] lg:rounded-[2rem] border-2 border-[#E8E4D8] bg-white transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-1.5 hover:shadow-[0_8px_20px_rgba(27,67,50,0.1)] sm:hover:shadow-[0_12px_28px_rgba(27,67,50,0.12)] hover:border-primary/30 overflow-hidden outline-none w-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
        >
            {/* Gradient Header - Medium Size */}
            <div
                className={cn(
                    "relative h-24 sm:h-28 md:h-32 lg:h-36 w-full bg-gradient-to-br transition-all duration-700 overflow-hidden flex items-center justify-center",
                    gradient
                )}
            >
                {/* Decorative blurs */}
                <div className="absolute -top-6 -right-6 size-20 sm:size-24 md:size-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-3 -left-3 size-16 sm:size-20 md:size-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 md:left-5 size-1.5 sm:size-2 rounded-full bg-white/30" />
                <div className="absolute bottom-4 sm:bottom-5 md:bottom-6 right-4 sm:right-5 md:right-6 size-1 sm:size-1.5 rounded-full bg-white/20" />

                {/* Accent lines */}
                <div className="absolute top-1/2 right-0 w-12 sm:w-16 md:w-20 h-px bg-white/10 -rotate-12 translate-x-6 sm:translate-x-8" />

                {/* Icon Cluster - Medium Size */}
                <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-2.5">
                    <div className="size-11 sm:size-12 md:size-14 lg:size-16 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center border border-white/20 shadow-xl bg-white/10 backdrop-blur-md group-hover:bg-white/20 transition-all duration-500 group-hover:scale-105 group-hover:rotate-2">
                        <div className="text-white [&>svg]:size-5 sm:[&>svg]:size-6 md:[&>svg]:size-7 lg:[&>svg]:size-8">
                            {icon}
                        </div>
                    </div>
                    <span className="text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.12em] text-white/70 border border-white/20 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full bg-white/10 backdrop-blur-sm">
                        {tag}
                    </span>
                </div>
            </div>

            {/* Body Content - Medium Size */}
            <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col flex-1 pb-4 sm:pb-5 md:pb-6 lg:pb-7">
                <div className="flex-1 space-y-1.5 sm:space-y-2">
                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-serif font-bold text-[#1B4332] leading-tight group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-[11px] sm:text-xs md:text-sm text-[#1B4332]/60 font-serif italic leading-relaxed line-clamp-2">
                        {description}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 border-t border-[#E8E4D8]">
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] text-[#1B4332]/40 group-hover:text-primary transition-colors">
                        Enter Workspace
                    </span>
                    <div className="size-7 sm:size-8 md:size-9 rounded-full flex items-center justify-center bg-[#1B4332]/5 group-hover:bg-primary group-hover:shadow-[0_6px_12px_rgba(27,67,50,0.2)] transition-all duration-500 group-hover:translate-x-0.5">
                        <ChevronRight className="size-3.5 sm:size-4 text-primary group-hover:text-white" />
                    </div>
                </div>
            </div>
        </button>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileManagementTab() {
    const [activeView, setActiveView] = useState<ManagementType>("hub");

    // ─── Active View (Not Hub) ────────────────────────────────────────────────

    if (activeView !== "hub") {
        const views: Record<string, JSX.Element> = {
            fellow: <AdminFellowsTab />,
            facilitator: <AdminFacilitatorsTab />,
            coach: <AdminCoachesTab />,
            admin: <AdminAdminsTab />,
        };

        const navItems = [
            {
                type: "fellow" as const,
                icon: <Users className="size-full" />,
                label: "Fellow Management",
                activeClass: "bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/20",
                inactiveClass: "text-[#1B4332]/40 hover:bg-emerald-50 hover:text-[#1B4332]/60",
            },
            {
                type: "facilitator" as const,
                icon: <Briefcase className="size-full" />,
                label: "Facilitator Management",
                activeClass: "bg-amber-600 text-white shadow-lg shadow-amber-600/20",
                inactiveClass: "text-amber-600/40 hover:bg-amber-50 hover:text-amber-600/60",
            },
            {
                type: "coach" as const,
                icon: <Users2 className="size-full" />,
                label: "Coach Management",
                activeClass: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20",
                inactiveClass: "text-indigo-600/40 hover:bg-indigo-50 hover:text-indigo-600/60",
            },
            {
                type: "admin" as const,
                icon: <ShieldCheck className="size-full" />,
                label: "Admin Management",
                activeClass: "bg-blue-600 text-white shadow-lg shadow-blue-600/20",
                inactiveClass: "text-blue-600/40 hover:bg-blue-50 hover:text-blue-600/60",
            },
        ];

        return (
            <div className="flex flex-col xl:flex-row gap-3 sm:gap-4 md:gap-6 lg:gap-8 animate-in fade-in duration-500">
                {/* ─── Desktop Side Navigation (xl+) ─────────────────────────────── */}
                <div className="hidden xl:flex flex-col gap-3 w-[72px] py-6 bg-white/60 backdrop-blur-md rounded-[2rem] border-2 border-[#E8E4D8] sticky top-6 h-fit items-center shadow-xl">
                    {/* Hub Button */}
                    <NavItem
                        isActive={false}
                        onClick={() => setActiveView("hub")}
                        icon={<LayoutDashboard className="size-full" />}
                        label="Back to Hub"
                        activeClass=""
                        inactiveClass="text-muted-foreground hover:bg-stone-100 hover:text-foreground"
                        size="md"
                    />

                    {/* Divider */}
                    <div className="w-8 h-px bg-[#E8E4D8] my-1" />

                    {/* Nav Items */}
                    {navItems.map((item) => (
                        <NavItem
                            key={item.type}
                            isActive={activeView === item.type}
                            onClick={() => setActiveView(item.type)}
                            icon={item.icon}
                            label={item.label}
                            activeClass={item.activeClass}
                            inactiveClass={item.inactiveClass}
                            size="md"
                        />
                    ))}
                </div>

                {/* ─── Mobile/Tablet Navigation Bar (<xl) ────────────────────────── */}
                <div className="xl:hidden flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white/60 backdrop-blur-md rounded-xl sm:rounded-2xl border-2 border-[#E8E4D8] shadow-lg sticky top-2 sm:top-4 z-40">
                    {/* Hub Button */}
                    <NavItem
                        isActive={false}
                        onClick={() => setActiveView("hub")}
                        icon={<LayoutDashboard className="size-full" />}
                        label="Back to Hub"
                        activeClass=""
                        inactiveClass="text-muted-foreground hover:bg-stone-100 hover:text-foreground"
                        size="sm"
                    />

                    {/* Divider */}
                    <div className="w-px h-7 sm:h-8 bg-[#E8E4D8]" />

                    {/* Nav Items */}
                    {navItems.map((item) => (
                        <NavItem
                            key={item.type}
                            isActive={activeView === item.type}
                            onClick={() => setActiveView(item.type)}
                            icon={item.icon}
                            label={item.label}
                            activeClass={item.activeClass}
                            inactiveClass={item.inactiveClass}
                            size="sm"
                        />
                    ))}

                    {/* Active Label (visible on sm+) */}
                    <div className="hidden sm:flex items-center gap-2 ml-auto pr-2">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground">
                            {activeView === "fellow"
                                ? "Fellows"
                                : activeView === "facilitator"
                                    ? "Facilitators"
                                    : activeView === "coach"
                                        ? "Coaches"
                                        : "Admins"}
                        </span>
                    </div>
                </div>

                {/* ─── Main Content Area ─────────────────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-3 sm:space-y-4 md:space-y-6">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => setActiveView("hub")}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all hover:bg-white/50 rounded-full font-serif font-bold italic px-3 sm:px-4 md:px-6 h-9 sm:h-10"
                    >
                        <ArrowLeft className="size-3.5 sm:size-4" />
                        <span className="hidden sm:inline">Back to Profile Management</span>
                        <span className="sm:hidden">Back</span>
                    </Button>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {views[activeView]}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Hub View ─────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-1 sm:px-2 md:px-4 lg:px-0">
            {/* Header Section */}
            <div className="space-y-2 sm:space-y-3">
                <p className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary font-black">
                    System Administration
                </p>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground tracking-tight leading-tight">
                    Profile Management
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl font-serif italic leading-relaxed">
                    Select a management domain to oversee users across the leadership
                    development ecosystem.
                </p>
            </div>

            {/* Management Cards Grid - Medium Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {/* Fellow Management Card */}
                <ManagementCard
                    title="Fellow Management"
                    description="Oversee early-career leadership participants"
                    icon={<GraduationCap />}
                    type="fellow"
                    onClick={() => setActiveView("fellow")}
                    tag="Learning Portal"
                    gradient="from-[#1B4332] via-[#2D6A4F] to-[#52B788]"
                />

                {/* Facilitator Management Card */}
                <ManagementCard
                    title="Facilitator Management"
                    description="Manage facilitators and training oversight"
                    icon={<Briefcase />}
                    type="facilitator"
                    onClick={() => setActiveView("facilitator")}
                    tag="Facilitator Portal"
                    gradient="from-[#78350F] via-[#B45309] to-[#F59E0B]"
                />

                {/* Coach Management Card */}
                <ManagementCard
                    title="Coach Management"
                    description="Oversee leadership mentors and coaching groups"
                    icon={<Users2 />}
                    type="coach"
                    onClick={() => setActiveView("coach")}
                    tag="Coach Portal"
                    gradient="from-[#312E81] via-[#4338CA] to-[#6366F1]"
                />

                {/* Admin Management Card */}
                <ManagementCard
                    title="Admin Management"
                    description="Configure system administrators and permissions"
                    icon={<ShieldCheck />}
                    type="admin"
                    onClick={() => setActiveView("admin")}
                    tag="Admin Console"
                    gradient="from-[#1E3A8A] via-[#2563EB] to-[#60A5FA]"
                />
            </div>
        </div>
    );
}