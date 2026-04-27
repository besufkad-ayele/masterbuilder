"use client";

import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2, Copy, Check, Send, Sparkles } from "lucide-react";
import { companyService } from "@/services/companyService";
import { CoachService } from "@/services/CoachService";
import { Company, CoachProfile } from "@/types";
import { cn } from "@/lib/utils";

interface CoachCreationFormProps {
    onCoachCreated: (coach: any) => void;
}

export default function CoachCreationForm({ onCoachCreated }: CoachCreationFormProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        companyId: "",
        specialization: "",
        bio: "",
    });

    const [generatedPassword, setGeneratedPassword] = useState("");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

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

    // Generate password when name changes
    useEffect(() => {
        if (formData.name) {
            const firstName = formData.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            setGeneratedPassword(`${firstName}${today}`);
        } else {
            setGeneratedPassword("");
        }
    }, [formData.name]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) {
            setError("Please fill in the name and email fields.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const coachData: Partial<CoachProfile> = {
                full_name: formData.name,
                email: formData.email,
                company_ids: formData.companyId ? [formData.companyId] : [],
                specialization: formData.specialization ? [formData.specialization] : [],
                bio: formData.bio,
                is_active: true,
            };

            await CoachService.createCoachWithAuth(
                formData.email, 
                formData.name, 
                generatedPassword, 
                coachData
            );
            
            onCoachCreated(coachData);
            setStep('success');
        } catch (error: any) {
            console.error("Error creating coach:", error);
            setError(error.message || "Failed to register coach. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = () => {
        const text = `Coach Portal Credentials:\nEmail: ${formData.email}\nPassword: ${generatedPassword}\nLogin: ${window.location.origin}/login`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetForm = () => {
        setOpen(false);
        setStep('form');
        setFormData({
            name: "",
            email: "",
            companyId: "",
            specialization: "",
            bio: "",
        });
        setGeneratedPassword("");
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
            <DialogTrigger asChild>
                <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Coach
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                {step === 'form' ? (
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                                <Sparkles className="size-6 text-blue-600" />
                            </div>
                            <DialogTitle className="text-2xl font-bold text-slate-900">Add New Coach</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Create a coach profile and generate secure credentials.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-5">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Sarah Jenkins"
                                    className="rounded-xl border-slate-200 focus:ring-blue-500/10 h-12"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Email Address</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="coach@company.com"
                                    className="rounded-xl border-slate-200 focus:ring-blue-500/10 h-12"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Primary Company</Label>
                                <Select value={formData.companyId} onValueChange={v => setFormData({ ...formData, companyId: v })}>
                                    <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                        <SelectValue placeholder="Select Company" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Auto-Generated Password</Label>
                                <div className="relative">
                                    <Input
                                        value={generatedPassword}
                                        readOnly
                                        className="rounded-xl bg-slate-50 border-slate-200 font-mono text-blue-600 font-bold h-12 pr-10"
                                    />
                                    <Sparkles className="absolute right-3 top-3.5 size-5 text-blue-300" />
                                </div>
                                <p className="text-[10px] text-slate-400 ml-1 italic">Generated based on name + creation date</p>
                            </div>

                            {error && (
                                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                    <p className="text-xs text-rose-500 font-medium">{error}</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="mt-8 flex-col sm:flex-row gap-3">
                            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full flex-1 h-12">Cancel</Button>
                            <Button 
                                onClick={handleSubmit} 
                                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 flex-1 h-12" 
                                disabled={isSubmitting || !formData.name || !formData.email}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    "Create Coach Account"
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="p-10 text-center">
                        <div className="size-20 rounded-[2rem] bg-green-50 flex items-center justify-center mx-auto mb-6">
                            <Check className="size-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Coach Created!</h2>
                        <p className="text-slate-500 mb-8">The account is ready. Please share these credentials with the coach.</p>
                        
                        <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-4 border border-slate-100">
                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</Label>
                                <p className="text-slate-900 font-semibold">{formData.email}</p>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Temporary Password</Label>
                                <p className="text-blue-600 font-mono font-bold text-lg">{generatedPassword}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button onClick={handleCopy} className="rounded-full h-12 bg-slate-900 hover:bg-slate-800 text-white w-full">
                                {copied ? (
                                    <><Check className="mr-2 h-4 w-4" /> Copied!</>
                                ) : (
                                    <><Copy className="mr-2 h-4 w-4" /> Copy Credentials</>
                                )}
                            </Button>
                            <Button variant="outline" onClick={resetForm} className="rounded-full h-12 w-full border-slate-200">
                                Done
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
