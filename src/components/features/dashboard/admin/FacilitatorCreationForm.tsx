"use client";

import { useState } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldPlus, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { companyService } from "@/services/companyService";
import { FacilitatorService } from "@/services/FacilitatorService";
import { Company } from "@/types";

interface FacilitatorCreationFormProps {
    onFacilitatorCreated: (facilitator: any) => void;
}

export default function FacilitatorCreationForm({ onFacilitatorCreated }: FacilitatorCreationFormProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        companyId: "",
        department: "",
        specialization: "",
    });

    const [companies, setCompanies] = useState<Company[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const data = await companyService.getAll();
                setCompanies(data);
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();
    }, []);

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) {
            setError("Please fill in the name and email fields.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const facilitatorData = {
                full_name: formData.name,
                email: formData.email,
                company_ids: formData.companyId ? [formData.companyId] : [],
                department: formData.department,
                specialization: formData.specialization ? [formData.specialization] : [],
                is_active: true,
            };

            await FacilitatorService.createFacilitatorWithAuth(formData.email, formData.name, facilitatorData);
            onFacilitatorCreated(facilitatorData);
            setOpen(false);
            setFormData({
                name: "",
                email: "",
                companyId: "",
                department: "",
                specialization: "",
            });
        } catch (error: any) {
            console.error("Error creating facilitator:", error);
            if (error.message === 'user-already-exists') {
                setError("User already registered. Please use a different email.");
            } else {
                setError(error.message || "Failed to register facilitator. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full" variant="outline">
                    <ShieldPlus className="h-4 w-4 mr-2" />
                    Add Facilitator
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif">Add Facilitator</DialogTitle>
                    <DialogDescription>
                        Register a new training facilitator to oversee leadership sessions.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Full Name</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Abebe Bikila"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Email Address</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="facilitator@medroc.com"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Primary Portfolio (Company)</Label>
                        <Select value={formData.companyId} onValueChange={v => setFormData({ ...formData, companyId: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Company" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Department</Label>
                        <Input
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                            placeholder="e.g. HR Development"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Specialization</Label>
                        <Input
                            value={formData.specialization}
                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                            placeholder="e.g. Emotional Intelligence, Operations"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                            <p className="text-xs text-destructive font-medium">{error}</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
                    <Button onClick={handleSubmit} className="rounded-full" disabled={isSubmitting || !formData.name || !formData.email}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registering...
                            </>
                        ) : (
                            "Register Facilitator"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
