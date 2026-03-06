"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { firebaseService } from "@/services/firebaseService";

export default function ChangePasswordForm() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters long." });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords do not match." });
            return;
        }

        setIsLoading(true);
        try {
            await firebaseService.auth.changePassword(newPassword);
            setMessage({ type: 'success', text: "Password updated successfully!" });
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Password change error:", error);
            setMessage({
                type: 'error',
                text: error.code === 'auth/requires-recent-login'
                    ? "For security reasons, please sign out and sign back in before changing your password."
                    : error.message || "Failed to update password."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                        <Lock className="size-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-serif">Security Settings</CardTitle>
                        <CardDescription>Update your account password</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-primary/60">New Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="rounded-xl pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-primary/60">Confirm New Password</label>
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={cn(
                            "p-4 rounded-2xl flex items-center gap-3 text-sm font-medium",
                            message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                        )}>
                            {message.type === 'success' ? <ShieldCheck className="size-4 shrink-0" /> : <Lock className="size-4 shrink-0" />}
                            {message.text}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading || !newPassword || !confirmPassword}
                        className="w-full h-12 rounded-2xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold transition-all"
                    >
                        {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <ShieldCheck className="size-4 mr-2" />}
                        Update Password
                    </Button>

                    <p className="text-[10px] text-center text-muted-foreground px-4">
                        Changing your password will enhance your account security. Make sure to use a strong, unique password.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}

// Helper function locally if needed or import from utils
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
