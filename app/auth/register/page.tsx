"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { registerUser } from "@/lib/auth";
import { getAuthErrorMessage } from "@/lib/authErrors";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [referralNotice, setReferralNotice] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirect);
    }
  }, [authLoading, user, redirect, router]);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setForm((f) => ({ ...f, referralCode: ref.toUpperCase() }));
    }
  }, [searchParams]);

  const validate = (): boolean => {
    const errs: Partial<RegisterForm> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Valid email address required";
    if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (form.confirmPassword !== form.password) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");
    setReferralNotice("");

    try {
      const { referralCodeApplied } = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        referralCodeInput: form.referralCode,
      });

      if (form.referralCode.trim() && !referralCodeApplied) {
        setReferralNotice("Referral code not found — continuing without it.");
        setTimeout(() => router.push("/dashboard"), 1800);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setFormError(getAuthErrorMessage(code));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <div
        className="pt-[62px] pb-5 px-4"
        style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #1a0a2e 100%)" }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3 pt-4">
          <Link
            href="/"
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white text-xl font-bold">Create Account</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-24 pt-6">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="John Doe"
              autoComplete="name"
              className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-sm text-gray-800 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-purple-100 ${
                errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            <AnimatePresence>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-400 mt-1"
                >
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="john@example.com"
              autoComplete="email"
              className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-sm text-gray-800 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-purple-100 ${
                errors.email ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-400 mt-1"
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="new-password"
              className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-sm text-gray-800 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-purple-100 ${
                errors.password ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-400 mt-1"
                >
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              autoComplete="new-password"
              className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-sm text-gray-800 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-purple-100 ${
                errors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            <AnimatePresence>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-400 mt-1"
                >
                  {errors.confirmPassword}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Referral Code <span className="text-gray-300 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.referralCode}
              onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
              placeholder="e.g. AB12CD34"
              maxLength={8}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 uppercase tracking-widest outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* Referral notice */}
          <AnimatePresence>
            {referralNotice && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3"
              >
                <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm text-amber-700">{referralNotice}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form error */}
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3"
              >
                <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm text-red-600">{formError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white text-sm font-bold tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href={redirect !== "/dashboard" ? `/auth/login?redirect=${encodeURIComponent(redirect)}` : "/auth/login"}
              className="text-[#7C3AED] font-semibold"
            >
              Sign In
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F7FF]" />}>
      <RegisterPageInner />
    </Suspense>
  );
}
