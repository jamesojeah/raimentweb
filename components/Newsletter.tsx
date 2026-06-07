"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section
      className="py-24 px-4"
      style={{ background: "rgba(6, 3, 16, 0.9)" }}
    >
      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-2xl mx-auto text-center rounded-3xl py-14 px-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(124,58,237,0.15)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Top glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)" }}
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs uppercase tracking-widest mb-2 font-semibold"
          style={{ color: "#A78BFA" }}
        >
          Newsletter
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-serif text-3xl sm:text-4xl font-bold mb-3"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          Stay in the Edit
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-sm leading-relaxed mb-8"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          New arrivals, exclusive drops, and editorial stories — delivered to your inbox.
        </motion.p>

        {submitted ? (
          <motion.p
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-semibold text-sm"
            style={{ color: "#A78BFA" }}
          >
            You&apos;re on the list — welcome to Raiment.
          </motion.p>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-5 py-3.5 text-sm focus:outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "1rem",
                color: "rgba(255,255,255,0.85)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid rgba(124,58,237,0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.09)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              className="px-7 py-3.5 text-white text-sm font-bold rounded-2xl transition-all hover:scale-105 cursor-pointer whitespace-nowrap"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                boxShadow: "0 6px 20px rgba(124,58,237,0.38)",
              }}
            >
              Subscribe
            </button>
          </motion.form>
        )}
      </motion.div>
    </section>
  );
}
