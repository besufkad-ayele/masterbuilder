"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Target,
    Calendar,
    MapPin,
    ArrowRight,
    Sparkles,
    BookOpen,
    CheckCircle2
} from 'lucide-react';
import { Company, Cohort } from '@/types';

interface FacilitatorOnboardingViewProps {
    company: Company;
    cohort: Cohort;
    onStartGMDReview: () => void;
}

export const FacilitatorOnboardingView: React.FC<FacilitatorOnboardingViewProps> = ({ company, cohort, onStartGMDReview }) => {
    return (
        <div className="min-h-screen bg-[#FDFCF6] text-[#1B4332] selection:bg-[#C5A059]/30">
            <div className="max-w-5xl mx-auto px-6 py-20">
                {/* Header Section */}
                <div className="space-y-6 mb-16 text-center">
                    <Badge variant="outline" className="px-4 py-1 text-[#C5A059] border-[#C5A059] uppercase tracking-[0.3em] text-[10px] font-bold">
                        Facilitator Orientation
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-display font-medium leading-tight">
                        Welcome to <span className="italic font-serif text-[#C5A059]">{company.name}</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                        You have been assigned to lead the <span className="text-[#1B4332] font-bold">{cohort.name}</span>.
                        This onboarding will prepare you for the upcoming leadership development journey.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {/* Cohort Details */}
                    <Card className="col-span-1 md:col-span-2 border-[#1B4332]/10 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-500 rounded-3xl overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <Users size={20} />
                                <span className="text-xs uppercase tracking-widest font-bold">Cohort Overview</span>
                            </div>
                            <CardTitle className="text-2xl font-display">Assignment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Wave Level</p>
                                    <p className="font-medium text-lg">{cohort.wave_level}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Capacity</p>
                                    <p className="font-medium text-lg">{cohort.capacity} Fellows</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Start Date</p>
                                    <p className="font-medium text-lg">{cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">End Date</p>
                                    <p className="font-medium text-lg">{cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-dashed border-[#1B4332]/10">
                                <p className="text-sm leading-relaxed italic text-muted-foreground">
                                    "{cohort.description}"
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Company Brief */}
                    <Card className="border-[#C5A059]/20 bg-gradient-to-br from-[#1B4332] to-[#0D2A1F] text-white shadow-xl rounded-3xl overflow-hidden">
                        <CardHeader className="p-8">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                                <Sparkles className="text-[#C5A059] w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl font-display">Company Domain</CardTitle>
                            <CardDescription className="text-white/60">
                                {company.industry} • {company.location}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <p className="text-sm leading-relaxed text-white/80">
                                {company.name}  here we will update to have some content
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-xs text-white/40">
                                    <CheckCircle2 size={14} className="text-[#C5A059]" />
                                    <span>Strategic Goals Alignment</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-white/40">
                                    <CheckCircle2 size={14} className="text-[#C5A059]" />
                                    <span>Operational Standard Review</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Steps */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-display font-medium">Orientation Steps</h2>
                        <div className="h-px flex-1 bg-[#1B4332]/10 mx-8 hidden md:block" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="group relative p-8 rounded-3xl bg-white border border-[#1B4332]/5 hover:border-[#C5A059]/40 transition-all duration-500 shadow-sm hover:shadow-xl">
                            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <BookOpen size={20} className="text-primary" />
                            </div>
                            <h3 className="font-bold mb-2">Review GMD-1</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                                Understand the grounding module delivery framework for this cohort.
                            </p>
                            <Button
                                onClick={onStartGMDReview}
                                variant="ghost"
                                className="p-0 text-primary hover:bg-transparent h-auto text-xs font-bold group-hover:translate-x-1 transition-transform"
                            >
                                Start Review <ArrowRight size={14} className="ml-2" />
                            </Button>
                        </div>

                        <div className="group relative p-8 rounded-3xl bg-white border border-[#1B4332]/5 hover:border-[#C5A059]/40 transition-all duration-500 shadow-sm hover:shadow-xl opacity-60">
                            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                                <Users size={20} className="text-primary" />
                            </div>
                            <h3 className="font-bold mb-2">Fellow Roster</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                                Review the profiles and current progress of your assigned fellows.
                            </p>
                            <Badge variant="secondary" className="text-[9px] uppercase tracking-widest font-bold">Locked</Badge>
                        </div>

                        <div className="group relative p-8 rounded-3xl bg-white border border-[#1B4332]/5 hover:border-[#C5A059]/40 transition-all duration-500 shadow-sm hover:shadow-xl opacity-60">
                            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                                <Target size={20} className="text-primary" />
                            </div>
                            <h3 className="font-bold mb-2">Evaluation Protocol</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                                Familiarize yourself with the scoring mechanism and feedback loop.
                            </p>
                            <Badge variant="secondary" className="text-[9px] uppercase tracking-widest font-bold">Locked</Badge>
                        </div>
                    </div>

                    <div className="pt-8 text-center border-t border-[#1B4332]/5">
                        <Button className="bg-[#1B4332] hover:bg-[#2D5A40] text-white px-12 py-6 rounded-2xl text-lg font-medium shadow-lg hover:shadow-primary/20 transition-all duration-300">
                            Complete Orientation <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
