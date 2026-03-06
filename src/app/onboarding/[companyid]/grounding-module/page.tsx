"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { firebaseService } from "@/services/firebaseService";
import { groundingService } from "@/services/groundingService";
import { StorageService } from "@/services/storageService";
import { GroundingModule } from "@/types";
import { GroundingModuleView } from "@/components/features/grounding/GroundingModuleView";
import { Loader2 } from "lucide-react";

export default function CompanyGroundingModulePage() {
    const params = useParams();
    const companyId = params.companyid as string;

    const [loading, setLoading] = useState(true);
    const [groundingModules, setGroundingModules] = useState<GroundingModule[]>([]);
    const [fellowId, setFellowId] = useState<string | null>(null);

    useEffect(() => {
        const currentUser = StorageService.getCurrentUser();
        if (currentUser) {
            setFellowId(currentUser.id);
        }

        const fetchData = async () => {
            try {
                const gmds = await groundingService.getModulesByCompany(companyId);
                setGroundingModules(gmds);

                // Initialize progress if we have a fellow and a module
                if (currentUser && gmds.length > 0) {
                    await firebaseService.fellow.initializeProgress(currentUser.id, 'grounding', gmds[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch grounding module", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [companyId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCF6] flex items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-[#C5A059] animate-spin" />
                <p className="ml-4 text-[#1B4332]/60 font-serif italic">Loading grounding curriculum...</p>
            </div>
        );
    }

    if (groundingModules.length === 0) {
        return (
            <div className="min-h-screen bg-[#FDFCF6] flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-semibold text-[#1B4332]">Grounding Module</h1>
                    <p className="text-[#1B4332]/60">No grounding module data found for this company.</p>
                </div>
            </div>
        );
    }

    return <GroundingModuleView moduleData={groundingModules[0]} companyId={companyId} userId={fellowId || undefined} />;
}
