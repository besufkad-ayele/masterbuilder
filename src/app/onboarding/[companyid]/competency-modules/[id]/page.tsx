"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CompetencyDetailView } from "@/components/features/competency/CompetencyDetailView";
import { StorageService } from "@/services/storageService";
import { firebaseService } from "@/services/firebaseService";

export default function CompanyCompetencyDetailPage() {
    const params = useParams();
    const companyId = params.companyid as string;
    const id = params.id as string;
    const [fellowId, setFellowId] = useState<string | null>(null);

    useEffect(() => {
        const currentUser = StorageService.getCurrentUser();
        if (currentUser) {
            setFellowId(currentUser.id);
            // Initialize competency progress entries if they don't exist
            firebaseService.fellow.initializeProgress(currentUser.id, 'competency', id);
        }
    }, [id]);

    if (!fellowId) return null;

    return <CompetencyDetailView competencyId={id} userId={fellowId} onBack={() => window.history.back()} />;
}
