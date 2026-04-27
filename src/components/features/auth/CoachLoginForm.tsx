"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { StorageService } from "@/services/storageService";
import { User } from "@/types";

interface CoachLoginFormProps {
  onBack: () => void;
}

export default function CoachLoginForm({ onBack }: CoachLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        setError("Account not found in our directory.");
        setLoading(false);
        return;
      }

      const profile = userDoc.data() as User;

      // Validate role - Coaches and Admins are allowed
      if (profile.role !== 'COACH' && profile.role !== 'ADMIN') {
        setError("This account is not authorized for the Coach portal.");
        setLoading(false);
        return;
      }

      StorageService.setCurrentUser(profile);

      // Verify coach profile exists
      if (profile.role === "COACH") {
        const q = query(collection(db, 'coach_profiles'), where('user_id', '==', user.uid));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setError("Coach profile not found. Please contact support.");
          setLoading(false);
          return;
        }
        router.push("/coach");
      } else if (profile.role === "ADMIN") {
        router.push("/admin");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        setError("An error occurred during sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_40px_80px_rgba(0,0,0,0.06)] border border-[#E8E4D8] animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
      {/* Decorative blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-8 left-8 p-2 rounded-full hover:bg-slate-50 text-[#1B4332]/40 hover:text-[#1B4332] transition-all"
      >
        <ArrowLeft className="size-5" />
      </button>

      <div className="mb-10 text-center pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
          <Users className="size-3" />
          Coach Portal Sign In
        </div>
        <h1 className="text-2xl font-bold text-[#1B4332] font-serif italic">Secure Access</h1>
        <p className="text-[#1B4332]/60 text-sm mt-2">
          Enter your coach credentials to access your workspace.
        </p>
      </div>

      <form className="space-y-8" noValidate onSubmit={handleSubmit}>
        <div className="space-y-4">
          <label className="text-[#1B4332] text-xs font-bold uppercase tracking-widest pl-1" htmlFor="email">
            Email Address
          </label>
          <input
            className="flex w-full rounded-2xl bg-[#FDFCF6] border border-[#E8E4D8] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 h-16 placeholder:text-slate-300 px-6 text-base transition-all outline-none"
            id="email"
            name="email"
            placeholder="coach@example.com"
            required
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
        </div>

        <div className="space-y-4">
          <label className="text-[#1B4332] text-xs font-bold uppercase tracking-widest pl-1" htmlFor="password">
            Password
          </label>
          <div className="relative group/pass">
            <input
              className="flex w-full rounded-2xl bg-[#FDFCF6] border border-[#E8E4D8] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 h-16 placeholder:text-slate-300 px-6 text-base transition-all outline-none"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-blue-600/30 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
            <p className="text-xs text-rose-500 font-medium text-center">{error}</p>
          </div>
        )}

        <button
          className="w-full flex items-center justify-center rounded-2xl h-16 bg-blue-600 text-white text-base font-bold transition-all hover:bg-blue-700 shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying...</span>
            </div>
          ) : "Access Portal"}
        </button>
      </form>

      <div className="mt-12 text-center text-[10px] text-[#1B4332]/30 font-medium tracking-widest">
        BY PROCEEDING, YOU AGREE TO OUR TERMS OF SERVICE AND PRIVACY POLICY.
      </div>
    </div>
  );
}
