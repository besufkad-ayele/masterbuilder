"use client";

import React, { useState } from "react";
import { GroundingModuleForm } from "./GroundingModuleForm";
import { groundingService } from "@/services/groundingService";
import { GroundingModule, Company } from "@/types";

interface CreateGroundingModuleProps {
    initialData?: GroundingModule;
    companies: Company[];
    onSuccess: () => void;
    onCancel: () => void;
}

export const CreateGroundingModule: React.FC<CreateGroundingModuleProps> = ({
    initialData,
    companies,
    onSuccess,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            if (initialData?.id) {
                await groundingService.updateModule(initialData.id, data);
            } else {
                await groundingService.createModule({
                    name: data.name,
                    level: data.level,
                    description: data.description,
                    company_id: data.company_id,
                    structure: data.structure
                });
            }
            onSuccess();
        } catch (error) {
            console.error("Failed to save grounding module", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <GroundingModuleForm
            initialData={initialData}
            companies={companies}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isSaving={isSaving}
        />
    );
};
