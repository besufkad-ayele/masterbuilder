"use client";

import { useState } from "react";
import { Plus, X, UserCheck, ShieldAlert, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AdminManagementService } from "@/services/AdminManagementService";

interface AdminCreationFormProps {
    onAdminCreated: () => void;
}

export default function AdminCreationForm({ onAdminCreated }: AdminCreationFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        title: "System Administrator",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!formData.name || !formData.email) {
                throw new Error("Name and email are required");
            }

            await AdminManagementService.createAdminWithAuth(
                formData.email,
                formData.name,
                formData.title
            );

            setIsOpen(false);
            setFormData({ name: "", email: "", title: "System Administrator" });
            onAdminCreated();
        } catch (err: any) {
            console.error("Error creating admin:", err);
            setError(err.message || "Failed to create administrator");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl shadow-lg shadow-primary/20 bg-primary text-white hover:bg-primary/90 transition-all font-serif font-bold italic group">
                    <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    Invite Admin
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-[3rem] border-4 border-primary/10 bg-white p-0 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="bg-primary/5 p-8 border-b border-primary/10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <UserCheck className="size-6" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-serif font-black text-foreground">New Administrator</DialogTitle>
                                <DialogDescription className="font-serif italic text-base">
                                    Grant system-level access to a new team member.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {error && (
                            <div className="p-4 bg-destructive/5 border-2 border-destructive/10 rounded-2xl flex items-center gap-3 text-destructive animate-in shake-in duration-300">
                                <ShieldAlert className="size-5 shrink-0" />
                                <p className="text-sm font-serif font-bold italic">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 px-1">Full Name</label>
                            <Input
                                placeholder="e.g. Abebe Bikila"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-14 rounded-2xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif text-lg bg-[#FDFCF9]/50"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 px-1">Email Address</label>
                            <Input
                                type="email"
                                placeholder="abebe@lead-life.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="h-14 rounded-2xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif text-lg bg-[#FDFCF9]/50"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 px-1">Role / Title</label>
                            <select
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full h-14 px-5 rounded-2xl border-2 border-[#E8E4D8] bg-[#FDFCF9]/50 focus:border-primary outline-none transition-all font-serif font-bold italic text-lg cursor-pointer"
                            >
                                <option value="System Administrator">System Administrator</option>
                                <option value="Content Manager">Content Manager</option>
                                <option value="Program Coordinator">Program Coordinator</option>
                                <option value="Executive Director">Executive Director</option>
                            </select>
                        </div>

                        <div className="bg-amber-50 border-2 border-amber-100 p-4 rounded-2xl">
                            <div className="flex items-start gap-3">
                                <BadgeCheck className="size-5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 font-serif italic leading-relaxed">
                                    The new administrator will be created with a temporary password: <span className="font-black not-italic px-1.5 py-0.5 bg-amber-100 rounded text-amber-900 border border-amber-200">Password123!</span>.
                                    They are encouraged to change this upon their first login.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 flex gap-3 sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            className="rounded-full px-8 font-serif font-bold italic"
                        >
                            Discard
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-full px-10 shadow-xl shadow-primary/20 bg-primary text-white font-serif font-black"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </div>
                            ) : "Create Access"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
