"use client";

import React, { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StorageService } from '@/services/storageService';
import FacilitatorDashboardLayout from '@/components/features/dashboard/facilitator/FacilitatorDashboardLayout';

export default function FacilitatorPage() {
    const params = useParams();
    const router = useRouter();
    const companyId = params.companyId as string;

    React.useEffect(() => {
        const currentUser = StorageService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'FACILITATOR') {
            router.push('/login');
            return;
        }
    }, [router]);

    if (!companyId) return null;

    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#FDFCF6]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>}>
            <FacilitatorDashboardLayout companyId={companyId} />
        </Suspense>
    );
}
