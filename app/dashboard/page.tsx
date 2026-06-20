"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, isLoggingOut, logout } = useAuth();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    if (!loading && !user && !isLoggingOut()) {
      router.replace("/auth/login?redirect=/dashboard");
    }
  }, [loading, user, isLoggingOut, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleCopy = (text: string, which: "code" | "link") => {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-[#7C3AED]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const shareLink =
    typeof window !== "undefined" && profile
      ? `${window.location.origin}/auth/register?ref=${profile.referralCode}`
      : "";

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <div
        className="pt-[62px] pb-5 px-4"
        style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #1a0a2e 100%)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3 pt-4">
          <h1 className="text-white text-xl font-bold">Dashboard</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-24 pt-4 space-y-4">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-800">
            Welcome back, {profile?.name || user.displayName || "there"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{user.email}</p>
          {memberSince && (
            <p className="text-xs text-gray-400 mt-1">Member since {memberSince}</p>
          )}
        </motion.div>

        {/* Wallet balance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-5 shadow-sm text-white"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)" }}
        >
          <p className="text-xs uppercase tracking-widest text-white/70 mb-1">Wallet Balance</p>
          <p className="text-3xl font-bold">
            ₦{(profile?.walletBalance ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-white/80 mt-2">
            {(profile?.walletPoints ?? 0).toLocaleString()} cashback points
          </p>
        </motion.div>

        {/* Referral code */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <h2 className="text-base font-bold text-gray-800 mb-1">Your Referral Code</h2>
          <p className="text-sm text-gray-400 mb-4">
            Share your code — when a friend makes their first purchase, you earn ₦200.
          </p>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
              <span className="text-lg font-bold tracking-[0.3em] text-[#7C3AED]">
                {profile?.referralCode || "········"}
              </span>
            </div>
            <button
              onClick={() => profile && handleCopy(profile.referralCode, "code")}
              disabled={!profile}
              className="px-4 py-3 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer disabled:opacity-50"
            >
              {copied === "code" ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden">
              <span className="text-xs text-gray-500 truncate block">{shareLink}</span>
            </div>
            <button
              onClick={() => handleCopy(shareLink, "link")}
              disabled={!profile}
              className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              {copied === "link" ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl text-gray-600 bg-white shadow-sm text-sm font-bold tracking-wide hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Log Out
        </motion.button>
      </div>
    </div>
  );
}
