"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, Lock, Mail, ChevronRight } from "lucide-react";
import { Manrope } from "next/font/google";

import { cn } from "@/lib/utils";
import BrandLogo from "@/components/features/shared/BrandLogo";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { StorageService } from "@/services/storageService";
import { User } from "@/types";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Fetch User Profile from Firestore to verify ADMIN role
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        setError("Administrative profile not found.");
        setLoading(false);
        return;
      }

      const profile = userDoc.data() as User;

      if (profile.role !== "ADMIN") {
        setError("Access denied. This portal is restricted to administrators.");
        setLoading(false);
        await auth.signOut();
        return;
      }

      // 3. Sync to StorageService
      StorageService.setCurrentUser(profile);

      // 4. Redirect to Admin Dashboard
      router.push("/admin");
    } catch (err: any) {
      console.error("Admin login error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid administrative credentials.");
      } else {
        setError("An error occurred during authentication. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={cn("flex min-h-screen w-full items-center justify-center px-6 py-12 font-display bg-[#FDFCF6]", manrope.className)}>
      <div className="w-full max-w-[480px]">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-12 text-center scale-110">
          <BrandLogo
            stacked
            showTagline
            label="full"
            className="items-center text-center"
            iconClassName="w-16 h-16"
          />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_40px_80px_rgba(0,0,0,0.06)] border border-[#E8E4D8] relative overflow-hidden">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1B4332]/5 rounded-full -mr-16 -mt-16 blur-3xl" />

          <div className="mb-10 text-center pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1B4332]/10 text-[#1B4332] rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              <ShieldCheck className="size-3.5" />
              Secure Admin Gateway
            </div>
            <h1 className="text-3xl font-bold text-[#1B4332] font-serif italic mb-2 tracking-tight">System Control</h1>
            <p className="text-[#1B4332]/60 text-sm font-medium">
              Enter your privileged credentials to manage the workspace.
            </p>
          </div>

          <form className="space-y-6" noValidate onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[#1B4332] text-[10px] font-bold uppercase tracking-[0.2em] pl-1 flex items-center gap-2" htmlFor="email">
                <Mail className="size-3 text-[#1B4332]/40" />
                Admin Email
              </label>
              <input
                className="flex w-full rounded-2xl bg-[#FDFCF6] border border-[#E8E4D8] focus:border-[#1B4332] focus:ring-4 focus:ring-[#1B4332]/5 h-16 placeholder:text-slate-300 p-6 text-base transition-all outline-none font-medium"
                id="email"
                name="email"
                placeholder="administrator@leadlife.com"
                required
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[#1B4332] text-[10px] font-bold uppercase tracking-[0.2em] pl-1 flex items-center gap-2" htmlFor="password">
                <Lock className="size-3 text-[#1B4332]/40" />
                Secret Key
              </label>
              <input
                className="flex w-full rounded-2xl bg-[#FDFCF6] border border-[#E8E4D8] focus:border-[#1B4332] focus:ring-4 focus:ring-[#1B4332]/5 h-16 placeholder:text-slate-400 p-6 text-base transition-all outline-none"
                id="password"
                name="password"
                placeholder="••••••••••••"
                required
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
              />
            </div>

            {/* Error Message */}
            {error ? (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in shake duration-300 flex items-center gap-3">
                <div className="size-2 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-[11px] text-rose-600 font-bold uppercase tracking-wider">{error}</p>
              </div>
            ) : null}

            {/* Submit Button */}
            <button
              className="w-full flex items-center justify-center rounded-2xl h-16 bg-[#1B4332] text-white text-base font-bold transition-all hover:bg-[#2D5A40] shadow-2xl shadow-[#1B4332]/30 disabled:opacity-50 disabled:cursor-not-allowed group"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="uppercase tracking-[0.1em] text-sm">Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-[0.1em] text-sm">Unlock Dashboard</span>
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>

          {/* Footer Branding */}
          <div className="mt-12 text-center">
            <p className="text-[9px] text-[#1B4332]/30 font-bold uppercase tracking-[0.3em]">
              Lead Life Operational Intelligence
            </p>
          </div>
        </div>

        {/* Navigation Link */}
        <div className="mt-10 text-center">
          <Link
            className="text-xs font-bold text-[#1B4332]/50 hover:text-[#1B4332] transition-colors inline-flex items-center gap-2 uppercase tracking-[0.2em]"
            href="/login"
          >
            <ArrowLeft className="size-3" />
            Switch to Public Portal
          </Link>
        </div>
      </div>
    </section>
  );
}
