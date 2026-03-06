"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, LayoutGrid, CheckCircle2, Target, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Reusable Animation Component ---
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

export default function CompanyCompetencyModulesPage() {
    const params = useParams();
    const companyId = params.companyid as string;

    const waves = [
        {
            title: "Wave 1: Foundation",
            period: "Months 1–3",
            focus: "Leading Yourself (LY)",
            description: "Building the internal architecture of a Master Builder leader.",
            icon: User,
            color: "text-accent",
            bgColor: "bg-accent/10",
            competencies: [
                {
                    code: "C1",
                    name: "Emotional Regulation & Resilience",
                    description: "Mastering internal states to lead effectively under pressure.",
                    domain: "Leading Yourself"
                },
                {
                    code: "C2",
                    name: "Time & Task Management",
                    description: "Optimizing personal productivity and prioritization.",
                    domain: "Leading Yourself"
                },
                {
                    code: "C3",
                    name: "Assertiveness & Confidence",
                    description: "Expressing ideas and needs with clarity and conviction.",
                    domain: "Leading Yourself"
                },
                {
                    code: "C4",
                    name: "Adaptability & Flexibility",
                    description: "Navigating change with agility and an open mindset.",
                    domain: "Leading Yourself"
                }
            ]
        },
        {
            title: "Wave 2: Expansion",
            period: "Months 4–6",
            focus: "Leading Others (LO)",
            description: "Translating personal mastery into organizational influence and team effectiveness.",
            icon: Users,
            color: "text-primary",
            bgColor: "bg-primary/10",
            competencies: [
                {
                    code: "C5",
                    name: "Critical, Analytical & Numerical Reasoning",
                    description: "Making data-informed decisions and solving complex problems.",
                    domain: "Leading Yourself / Others"
                },
                {
                    code: "C6",
                    name: "Communication & Influence",
                    description: "Articulating vision and mobilizing others.",
                    domain: "Leading Others"
                },
                {
                    code: "C7",
                    name: "Teamwork, Delegation & Collaboration",
                    description: "Building high-performing teams and empowering others.",
                    domain: "Leading Others"
                },
                {
                    code: "C8",
                    name: "Empathy & Interpersonal Sensitivity",
                    description: "Understanding and connecting with others on a deeper level.",
                    domain: "Leading Others"
                }
            ]
        }
    ];

    return (
        <main className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/30">

            {/* Header / Nav */}
            <div className="pt-8 px-6 max-w-7xl mx-auto">
                <Link
                    href={`/${companyId}`}
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                    Back to Overview
                </Link>
            </div>

            {/* Hero Section */}
            <section className="relative px-6 py-16 md:py-24 overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
                    <FadeIn direction="down">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold tracking-widest uppercase mb-4">
                            <LayoutGrid className="w-3 h-3" />
                            Curriculum Deep Dive
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight text-foreground">
                            Competency Modules
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            The Master Builder program is structured into two distinct waves,
                            designed to build foundational self-leadership before expanding into leading others.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Waves Content */}
            <div className="max-w-6xl mx-auto px-6 pb-24 space-y-24">
                {waves.map((wave, index) => (
                    <section key={index} className="relative">
                        <FadeIn direction="up" className="space-y-8">
                            {/* Section Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${wave.bgColor} ${wave.color}`}>
                                            <wave.icon className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-bold font-display text-foreground">{wave.title}</h2>
                                    </div>
                                    <p className="text-muted-foreground text-lg pl-[60px]">{wave.description}</p>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-1 pl-[60px] md:pl-0">
                                    <span className="inline-block px-4 py-1.5 bg-background border border-border rounded-full text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {wave.period}
                                    </span>
                                    <span className="text-sm font-medium text-primary">Focus: {wave.focus}</span>
                                </div>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {wave.competencies.map((comp, i) => (
                                    <Link key={comp.code} href={`/${companyId}/competency-modules/${comp.code}`} className="group relative bg-card hover:bg-accent/5 border border-border rounded-2xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/30">
                                        <div className="flex items-start justify-between mb-4">
                                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold ${wave.bgColor === 'bg-accent/10' ? 'bg-accent text-white' : 'bg-primary text-white'}`}>
                                                {comp.code}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider border border-border px-2 py-1 rounded">
                                                {comp.domain}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
                                            {comp.name}
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {comp.description}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </FadeIn>
                    </section>
                ))}
            </div>

            {/* Proficiency Target CTA */}
            <section className="px-6 pb-24">
                <FadeIn>
                    <div className="max-w-5xl mx-auto bg-primary rounded-3xl p-8 md:p-12 text-primary-foreground relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div className="space-y-4 max-w-2xl">
                                <div className="inline-flex items-center gap-2 text-accent font-semibold">
                                    <Target className="w-5 h-5" />
                                    <span>Proficiency Target</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold font-display">Graduation Standard</h3>
                                <p className="text-primary-foreground/80 text-lg leading-relaxed">
                                    by graduation, fellows are expected to demonstrate <strong>Basic-level proficiency</strong> across all 8 competencies, translating theoretical knowledge into observable leadership behaviors.
                                </p>
                            </div>
                            <div className="hidden md:block">
                                <CheckCircle2 className="w-24 h-24 text-accent/20" />
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </section>

        </main>
    );
}
