"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { firebaseService } from "@/services/firebaseService";
import {
    Company,
    Cohort,
    GroundingLibrary,
    Wave
} from "@/types";
import {
    BookOpen,
    Calendar,
    Users,
    Award,
    Briefcase,
    ArrowRight,
    LayoutGrid,
    CheckCircle2,
    Target,
    Sparkles,
    ChevronDown,
    Building2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Hooks & Components for Animation ---

function useInView(options = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }) {
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        }, options);

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [options]);

    return { ref, isInView };
}

const FadeIn = ({
    children,
    className,
    delay = 0,
    direction = "up"
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
}) => {
    const { ref, isInView } = useInView();

    const directionClasses = {
        up: "translate-y-8",
        down: "-translate-y-8",
        left: "translate-x-8",
        right: "-translate-x-8",
        none: ""
    };

    return (
        <div
            ref={ref}
            className={cn(
                "transition-all duration-1000 ease-out will-change-transform opacity-0",
                isInView ? "opacity-100 transform-none" : directionClasses[direction],
                className
            )}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// --- Page Content ---

export default function CompanyOnboardingPage() {
    const params = useParams();
    const companyId = params.companyid as string;

    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState<Company | null>(null);
    const [cohort, setCohort] = useState<Cohort | null>(null);
    const [groundingModule, setGroundingModule] = useState<GroundingLibrary | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [companyData, cohortsData, groundingItems] = await Promise.all([
                    firebaseService.getCompany(companyId),
                    firebaseService.getCompanyCohorts(companyId),
                    firebaseService.admin.getGroundingLibraries()
                ]);

                const gm = groundingItems.find(m => m.company_id === companyId);

                setCompany(companyData);
                setCohort(cohortsData[0] || null);
                setGroundingModule(gm || null);
            } catch (error) {
                console.error("Failed to fetch onboarding data", error);
            } finally {
                setLoading(false);
            }
        };

        if (companyId) fetchData();
    }, [companyId]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FDFCF6] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-[#C5A059] animate-spin mx-auto" />
                    <p className="text-[#1B4332]/60 font-serif italic">Preparing your leadership journey...</p>
                </div>
            </main>
        );
    }

    if (!company) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <Building2 className="w-16 h-16 text-muted-foreground mx-auto" />
                    <h1 className="text-2xl font-semibold text-foreground">Company Not Found</h1>
                    <p className="text-muted-foreground">The company ID "{companyId}" does not exist.</p>
                </div>
            </main>
        );
    }

    // Using brand colors for the items
    const snapshotItems = [
        { icon: Calendar, label: "Duration", value: "Six Months", color: "text-primary", bg: "bg-primary/10" },
        { icon: Users, label: "Cohort Size", value: cohort ? `${cohort.capacity || 35} Fellows` : "35 Fellows", color: "text-accent", bg: "bg-accent/10" },
        { icon: Award, label: "Competencies", value: "8 Modules", color: "text-primary", bg: "bg-primary/10" },
        { icon: Target, label: "Target", value: "Basic Level", color: "text-accent", bg: "bg-accent/10" },
    ];

    return (
        <main className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/30">

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden pt-20 hero-gradient">
                {/* Background Decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl mix-blend-multiply opacity-30 animate-blob"></div>
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl mix-blend-multiply opacity-30 animate-blob animation-delay-2000"></div>
                </div>

                <div className="absolute top-8 right-8 z-50">
                    <Link href="/admin?tab=profile">
                        <Button variant="outline" className="rounded-full bg-white/50 backdrop-blur-md border-[#E8E4D8] text-primary hover:bg-primary hover:text-white transition-all">
                            <Users className="w-4 h-4 mr-2" />
                            Manage Profile
                        </Button>
                    </Link>
                </div>

                <FadeIn direction="down" className="relative z-10 text-center space-y-6 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/50 backdrop-blur-sm border border-border shadow-sm mb-4">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-muted-foreground">MIDROC Leadership Design Lab</span>
                    </div>

                    {/* Company Logo/Name */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        {company.logoUrl && (
                            <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="w-16 h-16 rounded-full border-2 border-border shadow-lg"
                            />
                        )}
                        <h2 className="text-3xl md:text-4xl font-bold text-primary">{company.name}</h2>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight text-foreground leading-[1.1]">
                        Master Builder <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                            Leadership Development
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light">
                        {cohort ? cohort.name : "Cohort ONE"} • A transformative journey to bridge the gap between academic theory and executive mastery.
                    </p>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="#snapshot"
                            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:w-56 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background shadow-lg"
                        >
                            <span className="mr-2">Explore Program</span>
                            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
                        </Link>
                    </div>
                </FadeIn>
            </section>

            {/* Snapshot Grid Section */}
            <section id="snapshot" className="relative py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {snapshotItems.map((item, index) => (
                        <FadeIn key={item.label} delay={index * 100} className="h-full">
                            <div className="group relative h-full bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
                                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${item.color}`}>
                                    <item.icon className="w-24 h-24 -mr-4 -mt-4 transform rotate-12" />
                                </div>
                                <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                                <p className="text-2xl font-bold text-card-foreground">{item.value}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-8 mt-8">
                    <FadeIn delay={400} className="bg-card p-8 rounded-2xl border border-border flex items-start gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-card-foreground mb-2">Implementation Partner</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                i-Capital Africa Institute <br />
                                <span className="text-sm opacity-80">(Life Design Lab / Master Builder©)</span>
                            </p>
                        </div>
                    </FadeIn>
                    <FadeIn delay={500} className="bg-card p-8 rounded-2xl border border-border flex items-start gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-accent/10 rounded-lg text-accent shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-card-foreground mb-2">Delivery Model</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Two-wave delivery model encompassing 8 distinct competencies over two 3-month periods.
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Sticky Scroll Section */}
            <section className="relative px-6 py-12 max-w-6xl mx-auto space-y-24">

                {/* Intro to Cards */}
                <FadeIn className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-accent font-semibold tracking-wider uppercase text-sm">Curriculum Structure</span>
                    <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mt-3">
                        Designed for Impact
                    </h2>
                    <p className="text-muted-foreground mt-4 text-lg">
                        Our curriculum is structured to build upon itself, starting with foundational self-leadership and expanding to organizational influence.
                    </p>
                </FadeIn>

                {/* Stacking Cards Container */}
                <div className="relative pb-32"> {/* Extra padding bottom for scroll space */}

                    {/* Card 1: Competency Modules */}
                    <div className="sticky top-24 z-10">
                        <FadeIn>
                            <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-[1.02] duration-500 min-h-[500px] flex flex-col md:flex-row">
                                {/* Decorative Gradient */}
                                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

                                <div className="p-8 md:p-12 flex-1 flex flex-col justify-between relative z-10">
                                    <div>
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                                            <LayoutGrid className="w-6 h-6 text-accent" />
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-bold mb-4 font-display">Competency Modules</h3>
                                        <p className="text-primary-foreground/80 text-lg leading-relaxed max-w-md">
                                            Explore the 8 core competencies divided into two strategic waves:
                                            <strong className="text-white"> Leading Yourself</strong> and <strong className="text-white">Leading Others</strong>.
                                        </p>

                                        <ul className="mt-8 space-y-3">
                                            <li className="flex items-center gap-3 text-sm text-primary-foreground/70">
                                                <CheckCircle2 className="w-5 h-5 text-accent" />
                                                <span>Emotional Regulation & Resilience</span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-primary-foreground/70">
                                                <CheckCircle2 className="w-5 h-5 text-accent" />
                                                <span>Communication & Influence</span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-primary-foreground/70">
                                                <CheckCircle2 className="w-5 h-5 text-accent" />
                                                <span>Critical & Analytical Reasoning</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <Link
                                            href={`/onboarding/${companyId}/competency-modules`}
                                            className="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all group"
                                        >
                                            View Full Curriculum
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Right Side Image/Graphic Placeholder */}
                                <div className="relative md:w-2/5 min-h-[250px] bg-gradient-to-br from-primary to-black flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                                    <div className="relative z-10 text-center p-6 backdrop-blur-sm bg-black/20 rounded-xl border border-white/10 mx-4">
                                        <p className="text-4xl font-bold text-white mb-1">8</p>
                                        <p className="text-xs uppercase tracking-widest text-accent">Modules</p>
                                        <div className="w-12 h-0.5 bg-accent mx-auto my-3"></div>
                                        <p className="text-4xl font-bold text-white mb-1">2</p>
                                        <p className="text-xs uppercase tracking-widest text-accent">Waves</p>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Card 2: Grounding Module */}
                    <div className="sticky top-32 z-20 mt-[20vh]"> {/* mt-[20vh] ensures it starts scrolling later so we see the stacking effect */}
                        <FadeIn>
                            <div className="relative overflow-hidden rounded-3xl bg-secondary text-secondary-foreground shadow-2xl border border-border transition-transform hover:scale-[1.02] duration-500 min-h-[500px] flex flex-col md:flex-row">
                                {/* Decorative Gradient */}
                                <div className="absolute top-0 left-0 -mt-20 -ml-20 w-80 h-80 bg-accent rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

                                <div className="p-8 md:p-12 flex-1 flex flex-col justify-between relative z-10">
                                    <div>
                                        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                                            <BookOpen className="w-6 h-6 text-accent" />
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-bold mb-4 font-display">Grounding Module</h3>
                                        <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                                            The foundational module designed to set the stage. Before leading others, you must first understand your own foundation.
                                        </p>

                                        {groundingModule && (
                                            <div className="mt-8 bg-background p-6 rounded-xl border border-border transition-colors hover:border-accent/40">
                                                <div className="flex items-start gap-4">
                                                    <Sparkles className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                                                    <div>
                                                        <h4 className="font-semibold text-lg mb-1">{groundingModule.name}</h4>
                                                        <p className="text-sm text-muted-foreground italic">"Believe. Know. Do."</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-border">
                                        <Link
                                            href={`/onboarding/${companyId}/grounding-module`}
                                            className="inline-flex items-center gap-2 text-accent font-semibold hover:gap-3 transition-all group"
                                        >
                                            Start Grounding
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Right Side Image/Graphic Placeholder */}
                                <div className="relative md:w-2/5 min-h-[250px] bg-background flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-80 mix-blend-overlay grayscale"></div>
                                    <div className="relative z-10 text-center p-8 bg-background/80 backdrop-blur-md rounded-full shadow-lg">
                                        <Target className="w-12 h-12 text-accent mx-auto" />
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                </div>

            </section>

            {/* Final CTA Section */}
            <section className="relative py-24 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-primary"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-accent/20 to-transparent blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                    <FadeIn direction="up">
                        <h2 className="text-4xl md:text-6xl font-bold font-display text-primary-foreground mb-6">
                            Ready to Begin Your Journey?
                        </h2>
                        <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Access your personalized dashboard, track your progress, and connect with your cohort.
                        </p>
                        <Link
                            href="/onboarding/login"
                            className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-background text-foreground font-bold text-lg hover:bg-accent hover:text-white hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-accent/20"
                        >
                            Log In to Dashboard
                        </Link>
                    </FadeIn>
                </div>
            </section>
        </main>
    );
}
