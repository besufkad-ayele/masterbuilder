"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { firebaseService } from '@/services/firebaseService';
import { FacilitatorOnboardingView } from '@/components/features/onboarding/facilitator/FacilitatorOnboardingView';
import { GroundingModuleView } from '@/components/features/grounding/GroundingModuleView';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Company, Cohort, GroundingModule } from '@/types';

export default function FacilitatorOnboardingPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = React.useState<{ company: Company; cohort: Cohort } | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isGMDReviewActive, setIsGMDReviewActive] = React.useState(false);
    const [groundingModule, setGroundingModule] = React.useState<GroundingModule | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const companyId = params.companyid as string;
                const cohortId = params.cohortid as string;

                const [company, cohort, modules] = await Promise.all([
                    firebaseService.admin.getCompany(companyId),
                    firebaseService.admin.getCohort(cohortId),
                    firebaseService.admin.getGroundingModules()
                ]);

                // Assuming we want the first module if multiple exist, or specific logic
                const gmd = modules.length > 0 ? modules[0] : null;

                if (company && cohort) {
                    setData({ company, cohort });
                    setGroundingModule(gmd);
                    setLoading(false);
                } else {
                    console.error("Company or Cohort not found");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [params, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFCF6]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF6] gap-4">
                <h2 className="text-2xl font-display text-[#BC4B51]">Assignment Not Found</h2>
                <p className="text-muted-foreground">We couldn't find the company or cohort assignment for this path.</p>
                <button onClick={() => router.push('/login')} className="text-primary font-bold underline">Return to Login</button>
            </div>
        );
    }

    if (isGMDReviewActive && groundingModule) {
        return (
            <div className="animate-in fade-in duration-500">
                <GroundingModuleView
                    moduleData={groundingModule}
                    companyId={data.company.id}
                    onBack={() => setIsGMDReviewActive(false)}
                />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <FacilitatorOnboardingView
                company={data.company}
                cohort={data.cohort}
                onStartGMDReview={() => setIsGMDReviewActive(true)}
            />
        </div>
    );
}
