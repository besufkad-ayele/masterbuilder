"use client";

import React from 'react';
import { CompetencyDetailView } from '@/components/features/competency/CompetencyDetailView';
import CompetencyCard from '@/components/features/competency/CompetencyCard';
import { Target, Lock as LockIcon } from 'lucide-react';
import { useFellowDashboard } from '@/hooks/use-dashboard';
import { useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Competency, Wave } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FellowWavesViewProps {
    fellowId: string;
    waveId: string; // "wave-1", "wave-2" etc.
}

const FellowWavesView: React.FC<FellowWavesViewProps> = ({ fellowId, waveId }) => {
    const { data: dashboardData, loading } = useFellowDashboard(fellowId);
    const searchParams = useSearchParams();
    const compIdParam = searchParams.get('comp');
    const [selectedCompetencyId, setSelectedCompetencyId] = React.useState<string | null>(null);

    // Deep link to competency if provided in URL
    React.useEffect(() => {
        if (compIdParam) {
            setSelectedCompetencyId(compIdParam);
        }
    }, [compIdParam]);

    // Derived state
    const wave = React.useMemo(() => {
        if (!dashboardData?.waves) return null;
        return dashboardData.waves.find((w: Wave) => w.id === waveId);
    }, [dashboardData, waveId]);

    const isWaveLocked = React.useMemo(() => {
        if (!wave || !dashboardData) return true;
        const isGroundingLocked = dashboardData.cohort?.is_grounding_active === false;
        return (isGroundingLocked && wave.number !== 1) || wave.status === 'locked' || wave.status === 'upcoming';
    }, [wave, dashboardData]);

    const waveCompetencies = React.useMemo(() => {
        if (!dashboardData || !wave) return [];

        const links = dashboardData.waveCompetencies.filter((wc: any) => wc.wave_id === wave.id);
        const linkIds = new Set(links.map((l: any) => l.competency_id));
        const comps = dashboardData.competencies.filter((c: Competency) => linkIds.has(c.id));
        return comps.sort((a: Competency, b: Competency) => a.title.localeCompare(b.title));
    }, [dashboardData, wave]);

    // If loading or waiting for data
    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (!wave) {
        return <div className="p-12 text-center text-muted-foreground">Wave not found or not assigned.</div>;
    }

    if (selectedCompetencyId) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <CompetencyDetailView
                    competencyId={selectedCompetencyId}
                    userId={fellowId}
                    wave={wave}
                    onBack={() => setSelectedCompetencyId(null)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-3xl">
                <div className="flex items-center gap-4 mb-3">
                    <h2 className="text-3xl font-bold font-serif italic text-[#1B4332]">Wave {wave.number}: {wave.name}</h2>
                    {isWaveLocked && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                            <LockIcon className="size-3" /> Locked
                        </Badge>
                    )}
                </div>
                <p className="text-[#8B9B7E] text-lg leading-relaxed">{wave.description}</p>
            </div>

            {waveCompetencies.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-[#E8E4D8] rounded-3xl">
                    <p className="text-muted-foreground">No competencies assigned to this wave yet.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    {waveCompetencies.map((comp) => (
                        <CompetencyCard
                            key={comp.id}
                            competency={comp}
                            isLocked={isWaveLocked}
                            onClick={() => setSelectedCompetencyId(comp.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FellowWavesView;
