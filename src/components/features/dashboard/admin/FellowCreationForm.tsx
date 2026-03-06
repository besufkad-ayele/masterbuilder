"use client";

import { useState, useMemo } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, UserPlus } from "lucide-react";
import { FellowService } from "@/services/FellowService";
import { CohortService } from "@/services/CohortService";
import { companyService } from "@/services/companyService";
import { Company } from "@/types";
import { useEffect } from "react";

interface FellowCreationFormProps {
    onFellowCreated: (fellow: any) => void;
    initialCompanyId?: string;
    trigger?: React.ReactNode;
}

export default function FellowCreationForm({ onFellowCreated, initialCompanyId, trigger }: FellowCreationFormProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        companyId: initialCompanyId || "",
        highestQualification: "",
        currentRole: "",
        organization: "",
        leadershipExperience: 0,
        keySkills: "",
        learningGoals: "",
        gender: "",
        age: "",
        primaryLanguage: "",
        availability: "",
        leadershipTrack: "",
        personalityStyle: "",
        constraints: "",
        cohortId: "",
    });

    // Reset companyId if initialCompanyId changes
    useEffect(() => {
        if (initialCompanyId) {
            setFormData(prev => ({ ...prev, companyId: initialCompanyId }));
        }
    }, [initialCompanyId]);

    const [companies, setCompanies] = useState<Company[]>([]);
    const [allCohorts, setAllCohorts] = useState<any[]>([]);
    const [generatedId, setGeneratedId] = useState("");
    const [isGeneratingId, setIsGeneratingId] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                // Fetch companies and cohorts
                // For now assuming we can get companies from existing data or service
                const [cohorts, comps] = await Promise.all([
                    CohortService.getAllCohorts(),
                    companyService.getAll()
                ]);
                setAllCohorts(cohorts);
                setCompanies(comps);
            } catch (error) {
                console.error("Error fetching meta for form:", error);
            }
        };
        fetchMeta();
    }, []);

    useEffect(() => {
        const updateId = async () => {
            if (!formData.companyId) {
                setGeneratedId("");
                return;
            }
            setIsGeneratingId(true);
            try {
                const company = companies.find(c => c.id === formData.companyId);
                const prefix = company ? company.name.slice(0, 3).toUpperCase() : "LL";
                const id = await FellowService.generateFellowId(formData.companyId, prefix);
                setGeneratedId(id);
            } catch (error) {
                console.error("Error generating ID:", error);
            } finally {
                setIsGeneratingId(false);
            }
        };
        updateId();
    }, [formData.companyId, companies]);

    const availableCohorts = useMemo(() => {
        return allCohorts.filter(c => c.company_id === formData.companyId);
    }, [allCohorts, formData.companyId]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.companyId) {
            setError("Please fill in all core identity fields.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const selectedCompany = companies.find(c => c.id === formData.companyId);
            const fellowData = {
                fellow_id: generatedId,
                full_name: formData.name,
                organization: formData.organization || selectedCompany?.name || "Lead Life System",
                status: "Onboarding" as const,
                key_skills: formData.keySkills.split(",").map(s => s.trim()).filter(s => s),
                learning_goals: formData.learningGoals.split(",").map(s => s.trim()).filter(s => s),
                age: parseInt(formData.age) || 0,
                cohort_id: formData.cohortId,
                company_id: formData.companyId,
                gender: formData.gender,
                highest_qualification: formData.highestQualification,
                current_role: formData.currentRole,
                leadership_experience_years: formData.leadershipExperience,
                primary_language: formData.primaryLanguage,
                availability: formData.availability,
                leadership_track: formData.leadershipTrack,
                personality_style: formData.personalityStyle,
                constraints: formData.constraints,
                is_active: true
            };

            await FellowService.createFellowWithAuth(formData.email, formData.name, fellowData);

            onFellowCreated(fellowData);
            setOpen(false);
            setFormData({
                name: "",
                email: "",
                companyId: "",
                highestQualification: "",
                currentRole: "",
                organization: "",
                leadershipExperience: 0,
                keySkills: "",
                learningGoals: "",
                gender: "",
                age: "",
                primaryLanguage: "",
                availability: "",
                leadershipTrack: "",
                personalityStyle: "",
                constraints: "",
                cohortId: "",
            });
        } catch (error: any) {
            console.error("Error creating fellow:", error);
            if (error.message === 'user-already-exists') {
                setError("User already registered. Please use a different email.");
            } else {
                setError(error.message || "Failed to create fellow. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="rounded-full">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Fellow
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif">Create New Fellow Profile</DialogTitle>
                    <DialogDescription>
                        Enter comprehensive details to enroll a new fellow into the leadership system.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                    {/* Section 1: Core Identity */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Core Identity</h4>

                        <div className="grid gap-2">
                            <Label>Full Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Marcus Thorne"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="fellow@company.com"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Parent Organization (Company)</Label>
                            <Select value={formData.companyId} onValueChange={v => setFormData({ ...formData, companyId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Parent Organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Specific Business Unit / Department</Label>
                            <Input
                                value={formData.organization}
                                onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                placeholder="e.g. Finance, Marketing, Operations"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Assign Cohort (Optional)</Label>
                            <Select value={formData.cohortId} onValueChange={v => setFormData({ ...formData, cohortId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={formData.companyId ? "Select Initial Cohort" : "Select Company First"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Cohort (Assign Later)</SelectItem>
                                    {availableCohorts.map(cohort => (
                                        <SelectItem key={cohort.id} value={cohort.id}>
                                            {cohort.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground italic">You can always assign or change cohorts later in management.</p>
                        </div>

                        {generatedId && (
                            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                                <p className="text-[10px] font-black uppercase text-primary">Generated Fellow ID</p>
                                <p className="text-lg font-mono font-bold">{generatedId}</p>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Professional Background */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Professional Background</h4>

                        <div className="grid gap-2">
                            <Label>Highest Educational Qualification</Label>
                            <Input
                                value={formData.highestQualification}
                                onChange={e => setFormData({ ...formData, highestQualification: e.target.value })}
                                placeholder="e.g. MBA in Strategic Management"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Current Role</Label>
                            <Input
                                value={formData.currentRole}
                                onChange={e => setFormData({ ...formData, currentRole: e.target.value })}
                                placeholder="e.g. Senior Operations Manager"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Years of Experience in Leadership</Label>
                            <Input
                                type="number"
                                value={formData.leadershipExperience}
                                onChange={e => setFormData({ ...formData, leadershipExperience: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {/* Section 3: Demographic & Preferences */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Demographics & Logistics</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Gender</Label>
                                <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                                    <SelectTrigger><SelectValue placeholder="Identify" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Non-binary">Non-binary</SelectItem>
                                        <SelectItem value="Prefer not to say">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Age</Label>
                                <Input
                                    type="number"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Primary Language</Label>
                            <Input
                                value={formData.primaryLanguage}
                                onChange={e => setFormData({ ...formData, primaryLanguage: e.target.value })}
                                placeholder="e.g. English, Amharic"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Availability (Days/Times)</Label>
                            <Input
                                value={formData.availability}
                                onChange={e => setFormData({ ...formData, availability: e.target.value })}
                                placeholder="e.g. Mondays & Wednesdays after 4 PM"
                            />
                        </div>
                    </div>

                    {/* Section 4: Behavioral & Goals */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Leadership Tracking</h4>

                        <div className="grid gap-2">
                            <Label>Leadership Track / Interest Area</Label>
                            <Input
                                value={formData.leadershipTrack}
                                onChange={e => setFormData({ ...formData, leadershipTrack: e.target.value })}
                                placeholder="e.g. Executive Presence, Financial Strategy"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Key Skills (Comma separated)</Label>
                            <Input
                                value={formData.keySkills}
                                onChange={e => setFormData({ ...formData, keySkills: e.target.value })}
                                placeholder="Strategic Thinking, Team Coaching..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Personality / Working Style</Label>
                            <Textarea
                                value={formData.personalityStyle}
                                onChange={e => setFormData({ ...formData, personalityStyle: e.target.value })}
                                className="h-20"
                                placeholder="Describe self-reported working style..."
                            />
                        </div>
                    </div>

                    {/* Full Width Sections */}
                    <div className="md:col-span-2 space-y-6 pt-4 border-t border-dashed">
                        <div className="grid gap-2">
                            <Label>Learning Goals</Label>
                            <Textarea
                                value={formData.learningGoals}
                                onChange={e => setFormData({ ...formData, learningGoals: e.target.value })}
                                placeholder="What does the fellow hope to achieve? (Comma separated)"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Constraints (e.g., conflicts, travel)</Label>
                            <Input
                                value={formData.constraints}
                                onChange={e => setFormData({ ...formData, constraints: e.target.value })}
                                placeholder="None..."
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                                <p className="text-sm text-destructive font-medium">{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
                    <Button onClick={handleSubmit} className="rounded-full">Enroll Fellow</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
