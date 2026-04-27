"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Sparkles, Users, Briefcase, ChevronRight, GraduationCap, Eye, EyeOff } from "lucide-react";
import { Manrope } from "next/font/google";

import { cn } from "@/lib/utils";
import BrandLogo from "@/components/features/shared/BrandLogo";
import CoachLoginForm from "@/components/features/auth/CoachLoginForm";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { StorageService } from "@/services/storageService";
import { User, FellowProfile, FacilitatorProfile } from "@/types";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

type LoginStep = 'role-selection' | 'login-form';
type RoleChoice = 'FELLOW' | 'FACILITATOR' | 'COACH' | 'ADMIN';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<RoleChoice | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      let loginPassword = password.trim();
      
      // Fellows use the default password in the background
      if (selectedRole === 'FELLOW') {
        loginPassword = "Password123!";
      }

      if (!email.trim() || (selectedRole !== 'FELLOW' && !loginPassword)) {
        setError("Please provide all required credentials.");
        setLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), loginPassword);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        setError("Account not found in our directory.");
        setLoading(false);
        return;
      }

      const profile = userDoc.data() as User;

      if (selectedRole && profile.role !== selectedRole && profile.role !== 'ADMIN') {
        setError(`This account is not authorized for the ${selectedRole.toLowerCase()} portal.`);
        setLoading(false);
        return;
      }

      StorageService.setCurrentUser(profile);

      if (profile.role === "ADMIN") {
        const q = query(collection(db, 'admin_profiles'), where('user_id', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const adminProfile = snapshot.docs[0].data();
          profile.title = adminProfile.title;
          StorageService.setCurrentUser(profile);
        }
        router.push("/admin");
        return;
      }

      if (profile.role === "FACILITATOR") {
        const q = query(collection(db, 'facilitator_profiles'), where('user_id', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const facilitatorProfile = snapshot.docs[0].data() as FacilitatorProfile;
          if (facilitatorProfile.company_ids && facilitatorProfile.company_ids.length > 0) {
            router.push(`/facilitator/${facilitatorProfile.company_ids[0]}`);
          } else {
            router.push('/admin');
          }
        } else {
          setError("Facilitator profile not found.");
        }
        return;
      }

      if (profile.role === "FELLOW") {
        const q = query(collection(db, 'fellow_profiles'), where('user_id', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const fellowProfile = snapshot.docs[0].data() as FellowProfile;
          if (fellowProfile.company_id) {
            router.push(`/fellow/${fellowProfile.company_id}`);
          } else {
            setError("Fellow profile is missing company assignment.");
          }
        } else {
          setError("Fellow profile not found.");
        }
        return;
      }

      setError("Invalid user role assigned.");
    } catch (err: any) {
      console.error("Login error:", err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email address. Please try your official email.");
      } else {
        setError("An error occurred during sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: RoleChoice) => {
    setSelectedRole(role);
    setStep('login-form');
    setError("");
  };

  return (
    <section
      className={cn(
        "flex min-h-screen w-full items-center justify-center px-6 py-12 bg-[#FDFCF6]",
        manrope.className
      )}
    >
      <div
        className={cn(
          "w-full transition-all duration-500",
          step === 'role-selection' ? "max-w-3xl" : "max-w-[500px]"
        )}
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-10 text-center">
          <BrandLogo
            stacked
            showTagline
            label="full"
            className="items-center text-center"
            iconClassName="w-14 h-14"
          />
        </div>

        {/* ═══════════════════════════════════════════
            STEP 1 — Role Selection
        ═══════════════════════════════════════════ */}
        {step === 'role-selection' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-[#1B4332] font-serif italic">Welcome Back</h1>
              <p className="text-[#1B4332]/60 mt-2 text-sm">Select your role to continue to your workspace</p>
            </div>

            {/* ── Two fancy cards side by side ── */}
            <div className="grid grid-cols-2 gap-5">

              {/* ── Fellow Card ── */}
              <button
                onClick={() => handleRoleSelect('FELLOW')}
                className="group relative overflow-hidden flex flex-col text-left rounded-[2rem] border border-[#E8E4D8] bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_32px_64px_rgba(27,67,50,0.14)] hover:border-[#1B4332]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {/* Gradient header */}
                <div className="relative h-48 w-full bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#52B788] overflow-hidden flex items-center justify-center">
                  {/* Decorative elements */}
                  <div className="absolute -top-10 -right-10 size-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-4 -left-4 size-28 rounded-full bg-[#95D5B2]/25 blur-xl pointer-events-none" />
                  <div className="absolute top-5 left-5 size-2.5 rounded-full bg-white/40" />
                  <div className="absolute bottom-7 right-7 size-1.5 rounded-full bg-white/25" />
                  <div className="absolute top-1/2 right-8 h-12 w-px bg-white/10 rotate-12" />

                  {/* Icon + badge */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div
                      className="size-16 rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl
                                  bg-white/15 backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300
                                  group-hover:scale-110 group-hover:rotate-2"
                    >
                      <GraduationCap className="size-8 text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/65 border border-white/20 px-3 py-1 rounded-full bg-white/8">
                      Learning Portal
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-7 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#1B4332] leading-tight">I&apos;m a Fellow</h3>
                    <p className="text-sm text-[#1B4332]/55 mt-2 leading-relaxed font-medium">
                      Access your personalized learning journey, waves, and competency modules
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#E8E4D8]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/35">
                      Continue
                    </span>
                    <div
                      className="size-9 rounded-full flex items-center justify-center transition-all duration-300
                                    bg-[#1B4332]/6 group-hover:bg-[#1B4332] group-hover:shadow-lg group-hover:shadow-[#1B4332]/30"
                    >
                      <ChevronRight
                        className="size-4 text-[#1B4332] transition-colors duration-300 group-hover:text-white group-hover:translate-x-px"
                      />
                    </div>
                  </div>
                </div>
              </button>

              {/* ── Facilitator Card ── */}
              <button
                onClick={() => handleRoleSelect('FACILITATOR')}
                className="group relative overflow-hidden flex flex-col text-left rounded-[2rem] border border-[#E8E4D8] bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_32px_64px_rgba(180,100,0,0.14)] hover:border-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {/* Gradient header */}
                <div className="relative h-48 w-full bg-gradient-to-br from-[#78350F] via-[#B45309] to-[#F59E0B] overflow-hidden flex items-center justify-center">
                  {/* Decorative elements */}
                  <div className="absolute -top-10 -right-10 size-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-4 -left-4 size-28 rounded-full bg-yellow-200/25 blur-xl pointer-events-none" />
                  <div className="absolute top-5 left-5 size-2.5 rounded-full bg-white/40" />
                  <div className="absolute bottom-7 right-7 size-1.5 rounded-full bg-white/25" />
                  <div className="absolute top-1/2 right-8 h-12 w-px bg-white/10 rotate-12" />

                  {/* Icon + badge */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div
                      className="size-16 rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl
                                  bg-white/15 backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300
                                  group-hover:scale-110 group-hover:rotate-2"
                    >
                      <Briefcase className="size-8 text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/65 border border-white/20 px-3 py-1 rounded-full bg-white/8">
                      Facilitator Portal
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-7 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-amber-900 leading-tight">I&apos;m a Facilitator</h3>
                    <p className="text-sm text-amber-900/55 mt-2 leading-relaxed font-medium">
                      Manage cohorts, guide fellows, and track learning progress across your organization
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#E8E4D8]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-900/35">
                      Continue
                    </span>
                    <div
                      className="size-9 rounded-full flex items-center justify-center transition-all duration-300
                                    bg-amber-50 group-hover:bg-amber-500 group-hover:shadow-lg group-hover:shadow-amber-400/30"
                    >
                      <ChevronRight
                        className="size-4 text-amber-500 transition-colors duration-300 group-hover:text-white group-hover:translate-x-px"
                      />
                    </div>
                  </div>
                </div>
              </button>

              {/* ── Coach Card ── */}
              <button
                onClick={() => handleRoleSelect('COACH')}
                className="group relative overflow-hidden flex flex-col text-left rounded-[2rem] border border-[#E8E4D8] bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_32px_64px_rgba(29,78,216,0.14)] hover:border-blue-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:col-span-2 lg:col-span-1"
              >
                {/* Gradient header */}
                <div className="relative h-48 w-full bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#3B82F6] overflow-hidden flex items-center justify-center">
                  {/* Decorative elements */}
                  <div className="absolute -top-10 -right-10 size-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-4 -left-4 size-28 rounded-full bg-blue-200/25 blur-xl pointer-events-none" />
                  <div className="absolute top-5 left-5 size-2.5 rounded-full bg-white/40" />
                  <div className="absolute bottom-7 right-7 size-1.5 rounded-full bg-white/25" />
                  <div className="absolute top-1/2 right-8 h-12 w-px bg-white/10 rotate-12" />

                  {/* Icon + badge */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div
                      className="size-16 rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl
                                  bg-white/15 backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300
                                  group-hover:scale-110 group-hover:rotate-2"
                    >
                      <Users className="size-8 text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/65 border border-white/20 px-3 py-1 rounded-full bg-white/8">
                      Coach Portal
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-7 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-900 leading-tight">I&apos;m a Coach</h3>
                    <p className="text-sm text-blue-900/55 mt-2 leading-relaxed font-medium">
                      Guide your peer circle, review progress, and provide feedback to assigned fellows
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#E8E4D8]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-900/35">
                      Continue
                    </span>
                    <div
                      className="size-9 rounded-full flex items-center justify-center transition-all duration-300
                                    bg-blue-50 group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-400/30"
                    >
                      <ChevronRight
                        className="size-4 text-blue-600 transition-colors duration-300 group-hover:text-white group-hover:translate-x-px"
                      />
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Admin link */}
            {/* <div className="text-center pt-8">
              <button
                onClick={() => handleRoleSelect('ADMIN')}
                className="text-sm text-[#1B4332]/40 hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary pb-0.5"
              >
                Administrative access? Log in here
              </button>
            </div> */}
          </div>

        ) : (
          /* ═══════════════════════════════════════════
              STEP 2 — Login Form
          ═══════════════════════════════════════════ */
          selectedRole === 'COACH' ? (
            <CoachLoginForm onBack={() => setStep('role-selection')} />
          ) : (
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_40px_80px_rgba(0,0,0,0.06)] border border-[#E8E4D8] animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
              {/* Decorative blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

              {/* Back button */}
              <button
                onClick={() => setStep('role-selection')}
                className="absolute top-8 left-8 p-2 rounded-full hover:bg-slate-50 text-[#1B4332]/40 hover:text-[#1B4332] transition-all"
              >
                <ArrowLeft className="size-5" />
              </button>

              <div className="mb-10 text-center pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
                  {selectedRole === 'ADMIN' ? <Sparkles className="size-3" /> : <Users className="size-3" />}
                  Sign in as {selectedRole?.toLowerCase()}
                </div>
                <h1 className="text-2xl font-bold text-[#1B4332] font-serif italic">Secure Access</h1>
                <p className="text-[#1B4332]/60 text-sm mt-2">
                  Enter your official email to access the workspace.
                </p>
              </div>

              <form className="space-y-8" noValidate onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <label className="text-[#1B4332] text-xs font-bold uppercase tracking-widest pl-1" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    className="flex w-full rounded-2xl bg-[#FDFCF6] border border-[#E8E4D8] focus:border-primary focus:ring-4 focus:ring-primary/5 h-16 placeholder:text-slate-300 px-6 text-base transition-all outline-none"
                    id="email"
                    name="email"
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                  />
                </div>

                {selectedRole !== 'FELLOW' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-[#1B4332] text-xs font-bold uppercase tracking-widest" htmlFor="password">
                        Password
                      </label>
                    </div>
                    <div className="relative group/pass">
                      <input
                        className="flex w-full rounded-2xl bg-[#FDFCF6] border border-[#E8E4D8] focus:border-primary focus:ring-4 focus:ring-primary/5 h-16 placeholder:text-slate-300 px-6 text-base transition-all outline-none"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-[#1B4332]/30 hover:text-[#1B4332] hover:bg-[#1B4332]/5 transition-all"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                    <p className="text-xs text-rose-500 font-medium text-center">{error}</p>
                  </div>
                )}

                <button
                  className="w-full flex items-center justify-center rounded-2xl h-16 bg-[#1B4332] text-white text-base font-bold transition-all hover:bg-[#2D5A40] shadow-xl shadow-[#1B4332]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : "Enter Workspace"}
                </button>
              </form>

              <div className="mt-12 text-center text-[10px] text-[#1B4332]/30 font-medium tracking-widest">
                BY PROCEEDING, YOU AGREE TO OUR TERMS OF SERVICE AND PRIVACY POLICY.
              </div>

              <div className="mt-10 pt-8 border-t border-[#E8E4D8] flex justify-center">
                <Link
                  href="/"
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2 uppercase tracking-widest"
                >
                  <ArrowLeft className="size-3" />
                  Return to home
                </Link>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
