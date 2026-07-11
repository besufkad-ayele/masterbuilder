"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { appService } from "@/services/appService";
import { RequiredMark } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    try {
      await appService.auth.changePassword(newPassword, currentPassword);
      setMessage({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Password change error:", error);
      const err = error as { code?: string; message?: string };
      setMessage({
        type: "error",
        text:
          err.code === "auth/requires-recent-login"
            ? "For security, sign out and sign back in before changing your password."
            : err.message || "Failed to update password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full overflow-hidden rounded-2xl border-border shadow-none">
      <CardHeader className="space-y-1 border-b border-border/70 bg-muted/20 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
            <Lock className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Security</CardTitle>
            <CardDescription className="text-sm">
              Change your account password
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Current password
              <RequiredMark className="ml-0.5" />
            </label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-10"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              New password
              <RequiredMark className="ml-0.5" />
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 pr-10"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Confirm new password
              <RequiredMark className="ml-0.5" />
            </label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10"
              required
              autoComplete="new-password"
            />
          </div>

          {message && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm",
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800",
              )}
            >
              {message.type === "success" ? (
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            className="h-10 w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 size-4" />
            )}
            Update password
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Use a strong password you do not reuse elsewhere.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
