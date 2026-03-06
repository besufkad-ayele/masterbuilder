"use client";

import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Lock } from "lucide-react";
import { FellowService } from "@/services/FellowService";
import { CohortService } from "@/services/CohortService";
import { companyService } from "@/services/companyService";
import { Company, FellowProfile } from "@/types";
import {
    GENDER_OPTIONS,
    QUALIFICATION_OPTIONS,
    PRIMARY_LANGUAGE_OPTIONS,
    AVAILABILITY_OPTIONS,
    LEADERSHIP_TRACK_OPTIONS,
    FELLOW_STATUS_OPTIONS,
} from "@/constants/fellowForm";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const fellowUpdateSchema = z.object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    // email is read-only in update form – kept for display only, not validated
    companyId: z.string().min(1, "Company is required"),
    organization: z.string().optional(),
    cohortId: z.string().optional(),
    highestQualification: z.string().min(1, "Qualification is required"),
    currentRole: z.string().min(2, "Current role must be at least 2 characters"),
    leadershipExperience: z
        .number()
        .min(0, "Cannot be negative")
        .max(60, "Seems too high"),
    gender: z.string().min(1, "Gender is required"),
    age: z
        .string()
        .refine((v) => !v || (!isNaN(Number(v)) && Number(v) > 0 && Number(v) < 120), {
            message: "Please enter a valid age",
        })
        .optional(),
    primaryLanguage: z.string().min(1, "Primary language is required"),
    availability: z.string().min(1, "Availability is required"),
    leadershipTrack: z.string().min(1, "Leadership track is required"),
    keySkills: z.string().optional(),
    personalityStyle: z.string().optional(),
    learningGoals: z.string().optional(),
    constraints: z.string().optional(),
    status: z.enum(["Onboarding", "Active", "Paused", "Graduated", "Competency Reset"]),
});

type FellowUpdateFormData = z.infer<typeof fellowUpdateSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface FellowUpdateFormProps {
    fellow: FellowProfile & { name?: string; companyName?: string };
    onFellowUpdated: () => void;
    trigger?: React.ReactNode;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-xs text-destructive mt-1 font-medium">{message}</p>;
}

export default function FellowUpdateForm({ fellow, onFellowUpdated, trigger }: FellowUpdateFormProps) {
    const [open, setOpen] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [allCohorts, setAllCohorts] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FellowUpdateFormData, string>>>({});

    const [formData, setFormData] = useState({
        name: fellow.full_name || fellow.name || "",
        email: fellow.email || "",
        companyId: fellow.company_id || "",
        organization: fellow.organization || "",
        cohortId: fellow.cohort_id || "",
        highestQualification: fellow.highest_qualification || "",
        currentRole: fellow.current_role || "",
        leadershipExperience: fellow.leadership_experience_years || 0,
        gender: fellow.gender || "",
        age: fellow.age ? String(fellow.age) : "",
        primaryLanguage: fellow.primary_language || "",
        availability: fellow.availability || "",
        leadershipTrack: fellow.leadership_track || "",
        keySkills: Array.isArray(fellow.key_skills) ? fellow.key_skills.join(", ") : "",
        personalityStyle: fellow.personality_style || "",
        learningGoals: Array.isArray(fellow.learning_goals) ? fellow.learning_goals.join(", ") : "",
        constraints: fellow.constraints || "",
        status: (fellow.status as any) || "Active",
    });

    // ─── Fetch meta ───────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [cohorts, comps] = await Promise.all([
                    CohortService.getAllCohorts(),
                    companyService.getAll(),
                ]);
                setAllCohorts(cohorts);
                setCompanies(comps);
            } catch (e) {
                console.error("Error fetching meta for update form:", e);
            }
        };
        if (open) fetchMeta();
    }, [open]);

    const availableCohorts = useMemo(() => {
        return allCohorts.filter((c) => c.company_id === formData.companyId);
    }, [allCohorts, formData.companyId]);

    // ─── Validation ───────────────────────────────────────────────────────────
    const validate = (): boolean => {
        const result = fellowUpdateSchema.safeParse(formData);
        if (!result.success) {
            const errors: Partial<Record<keyof FellowUpdateFormData, string>> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result.error.issues.forEach((err: any) => {
                const key = err.path[0] as keyof FellowUpdateFormData;
                errors[key] = err.message;
            });
            setFieldErrors(errors);
            return false;
        }
        setFieldErrors({});
        return true;
    };

    // ─── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) return;

        setIsSubmitting(true);
        setApiError(null);

        try {
            const updates: Partial<FellowProfile> = {
                full_name: formData.name,
                company_id: formData.companyId,
                organization: formData.organization,
                cohort_id: formData.cohortId || undefined,
                highest_qualification: formData.highestQualification,
                current_role: formData.currentRole,
                leadership_experience_years: Number(formData.leadershipExperience),
                gender: formData.gender,
                age: formData.age ? parseInt(formData.age) : undefined,
                primary_language: formData.primaryLanguage,
                availability: formData.availability,
                leadership_track: formData.leadershipTrack,
                key_skills: formData.keySkills
                    ? formData.keySkills.split(",").map((s) => s.trim()).filter(Boolean)
                    : [],
                personality_style: formData.personalityStyle,
                learning_goals: formData.learningGoals
                    ? formData.learningGoals.split(",").map((s) => s.trim()).filter(Boolean)
                    : [],
                constraints: formData.constraints,
                status: formData.status as any,
            };

            await FellowService.updateFellowProfile(fellow.id, fellow.user_id, updates);
            setOpen(false);
            onFellowUpdated();
        } catch (e: any) {
            console.error("Error updating fellow:", e);
            setApiError(e.message || "Failed to update fellow. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const set = (key: string, value: any) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start h-10 px-3 w-full rounded-xl font-serif font-bold italic"
                    >
                        <Edit className="h-4 w-4 mr-2 text-primary" />
                        Update Profile
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif">Update Fellow Profile</DialogTitle>
                    <DialogDescription>
                        Modify the details for <span className="font-bold">{fellow.full_name || fellow.name}</span>.
                        Email address cannot be changed here.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                    {/* ── Section 1: Core Identity ─────────────────────────── */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Core Identity</h4>

                        <div className="grid gap-2">
                            <Label>Full Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => set("name", e.target.value)}
                                placeholder="e.g. Marcus Thorne"
                            />
                            <FieldError message={fieldErrors.name} />
                        </div>

                        {/* Email – disabled / read-only */}
                        <div className="grid gap-2">
                            <Label className="flex items-center gap-2">
                                Email Address
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">
                                    <Lock className="w-3 h-3" /> Read-only
                                </span>
                            </Label>
                            <Input
                                type="email"
                                value={formData.email}
                                disabled
                                className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                Email cannot be changed after account creation.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label>Parent Organization (Company)</Label>
                            <Select
                                value={formData.companyId}
                                onValueChange={(v) => set("companyId", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Parent Organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={fieldErrors.companyId} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Specific Business Unit / Department</Label>
                            <Input
                                value={formData.organization}
                                onChange={(e) => set("organization", e.target.value)}
                                placeholder="e.g. Finance, Marketing, Operations"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Assign Cohort (Optional)</Label>
                            <Select
                                value={formData.cohortId}
                                onValueChange={(v) => set("cohortId", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            formData.companyId ? "Select Initial Cohort" : "Select Company First"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Cohort (Assign Later)</SelectItem>
                                    {availableCohorts.map((cohort) => (
                                        <SelectItem key={cohort.id} value={cohort.id}>
                                            {cohort.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground italic">
                                You can always assign or change cohorts later in management.
                            </p>
                        </div>

                        {/* Status */}
                        <div className="grid gap-2">
                            <Label>Member Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(v) => set("status", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FELLOW_STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={fieldErrors.status} />
                        </div>
                    </div>

                    {/* ── Section 2: Professional Background ───────────────── */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Professional Background</h4>

                        <div className="grid gap-2">
                            <Label>Highest Educational Qualification</Label>
                            <Select
                                value={formData.highestQualification}
                                onValueChange={(v) => set("highestQualification", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Qualification" />
                                </SelectTrigger>
                                <SelectContent>
                                    {QUALIFICATION_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={fieldErrors.highestQualification} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Current Role</Label>
                            <Input
                                value={formData.currentRole}
                                onChange={(e) => set("currentRole", e.target.value)}
                                placeholder="e.g. Senior Operations Manager"
                            />
                            <FieldError message={fieldErrors.currentRole} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Years of Experience in Leadership</Label>
                            <Input
                                type="number"
                                value={formData.leadershipExperience}
                                onChange={(e) =>
                                    set("leadershipExperience", parseInt(e.target.value) || 0)
                                }
                            />
                            <FieldError message={fieldErrors.leadershipExperience} />
                        </div>
                    </div>

                    {/* ── Section 3: Demographics & Logistics ──────────────── */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">
                            Demographics &amp; Logistics
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Gender</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(v) => set("gender", v)}
                                >
                                    <SelectTrigger><SelectValue placeholder="Identify" /></SelectTrigger>
                                    <SelectContent>
                                        {GENDER_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError message={fieldErrors.gender} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Age</Label>
                                <Input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => set("age", e.target.value)}
                                />
                                <FieldError message={fieldErrors.age} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Primary Language</Label>
                            <Select
                                value={formData.primaryLanguage}
                                onValueChange={(v) => set("primaryLanguage", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIMARY_LANGUAGE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={fieldErrors.primaryLanguage} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Availability (Days / Times)</Label>
                            <Select
                                value={formData.availability}
                                onValueChange={(v) => set("availability", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Availability" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AVAILABILITY_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={fieldErrors.availability} />
                        </div>
                    </div>

                    {/* ── Section 4: Leadership Tracking ────────────────────── */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Leadership Tracking</h4>

                        <div className="grid gap-2">
                            <Label>Leadership Track / Interest Area</Label>
                            <Select
                                value={formData.leadershipTrack}
                                onValueChange={(v) => set("leadershipTrack", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Track" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEADERSHIP_TRACK_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={fieldErrors.leadershipTrack} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Key Skills (Comma separated)</Label>
                            <Input
                                value={formData.keySkills}
                                onChange={(e) => set("keySkills", e.target.value)}
                                placeholder="Strategic Thinking, Team Coaching..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Personality / Working Style</Label>
                            <Textarea
                                value={formData.personalityStyle}
                                onChange={(e) => set("personalityStyle", e.target.value)}
                                className="h-20"
                                placeholder="Describe self-reported working style..."
                            />
                        </div>
                    </div>

                    {/* ── Full-width sections ──────────────────────────────── */}
                    <div className="md:col-span-2 space-y-6 pt-4 border-t border-dashed">
                        <div className="grid gap-2">
                            <Label>Learning Goals</Label>
                            <Textarea
                                value={formData.learningGoals}
                                onChange={(e) => set("learningGoals", e.target.value)}
                                placeholder="What does the fellow hope to achieve? (Comma separated)"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Constraints (e.g., conflicts, travel)</Label>
                            <Input
                                value={formData.constraints}
                                onChange={(e) => set("constraints", e.target.value)}
                                placeholder="None..."
                            />
                        </div>

                        {/* API Error */}
                        {apiError && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                                <p className="text-sm text-destructive font-medium">{apiError}</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="rounded-full"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </div>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
