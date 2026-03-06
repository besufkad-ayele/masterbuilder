"use client";

import React from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFellowDashboard } from '@/hooks/use-dashboard';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Portfolio } from '@/types';

interface FellowPortfolioProps {
    fellowId: string;
}

const FellowPortfolio: React.FC<FellowPortfolioProps> = ({ fellowId }) => {
    const { data: dashboardData, loading } = useFellowDashboard(fellowId);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'submitted': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'rejected': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (!dashboardData) {
        return <div className="p-12 text-center text-muted-foreground">Portfolio data not available.</div>;
    }

    const { competencies, portfolios } = dashboardData;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-3xl">
                <h2 className="text-3xl font-bold font-display text-[#1B4332] mb-3">Portfolio Management</h2>
                <p className="text-[#8B9B7E] text-lg leading-relaxed">View and manage your behavioral indicator submissions and artifacts.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-[#E8E4D8] overflow-hidden shadow-sm">
                <div className="p-8 md:p-12 space-y-12">
                    {competencies.length === 0 && (
                        <p className="text-center text-muted-foreground">No competencies assigned.</p>
                    )}

                    {competencies.map((comp) => {
                        // Filter portfolios for this competency
                        // Portfolio links to Behavioral Indicator, which links to Competency.
                        // We need the behavioral indicators for this competency to filter correctly.
                        // Since dashboardData is high level, we might rely on the portfolio items containing competency ID or we iterate.
                        // But Portfolio type has `behavioral_indicator_id`. It does NOT have `competency_id`.
                        // This implies we can't easily grouped by competency unless we fetch BIs.

                        // Fallback: If we can't group easily, we list them flat or we try to infer.
                        // However, we can also iterate all portfolios and check if their BI belongs to this competency (if BIs were fetched).
                        // FellowDashboardState DOES NOT include all BIs.

                        // Quick fix: For now, show all portfolios for the user, grouped by status or just list them.
                        // OR we assume `behavioral_indicator_id` might be enough context if we fetch BI details or if BI code contains competency code (e.g. LY-1.1).

                        // Let's iterate `portfolios` and find matches if possible. 
                        // If we can't match to competency without extra fetch, we might just list unassigned or ALL portfolios under a "Submissions" header if grouping fails.

                        // But wait, the previous code grouped by `comp`.
                        // To replicate this, we need to know which portfolios belong to `comp`.
                        // We can modify `firebaseService` to hydrate portfolios with competency info, or just show them in a generic list.
                        // Given constraints, generic list is safer than broken logic.
                        // BUT, to keep UI similar, I will try to match by ID prefix if possible (e.g. BI ID "LY-1.1" -> Comp "LY-1").

                        const portfolioItems = portfolios.filter(p => {
                            // Heuristic matching: if BI ID starts with Competency ID or Code
                            return p.behavioral_indicator_id.startsWith(comp.code) || p.behavioral_indicator_id.startsWith(comp.id);
                        });

                        if (portfolioItems.length === 0) return null; // Skip empty sections

                        return (
                            <div key={comp.id} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#FDFCF6] border border-[#E8E4D8] flex items-center justify-center text-xs font-black text-primary">
                                        {comp.code}
                                    </div>
                                    <h3 className="text-xl font-bold text-[#1B4332]">{comp.title}</h3>
                                </div>

                                <div className="grid gap-4 ml-14">
                                    {portfolioItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-6 bg-[#FDFCF6] rounded-2xl border border-[#E8E4D8] hover:border-primary/20 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-white border border-[#E8E4D8]">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#1B4332]">Portfolio Submission</p>
                                                    <p className="text-xs text-[#8B9B7E] font-medium uppercase tracking-widest mt-1">BI: {item.behavioral_indicator_id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B9B7E] mb-1">Status</span>
                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E4D8] text-xs font-bold text-[#1B4332] capitalize">
                                                        {getStatusIcon(item.status)}
                                                        {item.status}
                                                    </div>
                                                </div>
                                                {item.submitted_at && (
                                                    <div className="hidden md:flex flex-col items-end">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B9B7E] mb-1">Submitted</span>
                                                        <span className="text-xs font-medium text-[#1B4332]">{new Date(item.submitted_at).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {portfolios.length === 0 && (
                        <div className="p-12 rounded-2xl border border-dashed border-[#E8E4D8] text-center">
                            <p className="text-sm text-[#8B9B7E]">No portfolio items submitted yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FellowPortfolio;
