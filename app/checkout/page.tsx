"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { useOrderStore } from "@/store/orderStore";
import FlutterwavePayment, {
  type FlutterwaveCallbackResponse,
} from "@/components/FlutterwavePayment";
import { FlutterWaveTypes } from "flutterwave-react-v3";
import type { PaymentInitiateResponse, PaymentVerifyResponse } from "@/types/payment";
import { NIGERIAN_STATES, getShippingFee } from "@/lib/shipping";

type FlutterwaveConfig = FlutterWaveTypes.FlutterwaveConfig;

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  state: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { setLastOrder } = useOrderStore();

  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({ name: "", email: "", phone: "", state: "" });
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [flwConfig, setFlwConfig] = useState<FlutterwaveConfig | null>(null);
  const [initData, setInitData] = useState<PaymentInitiateResponse | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const cartTotal = total();
  const shippingFee = getShippingFee(form.state, items);
  const orderTotal = cartTotal + shippingFee;

  const validate = (): boolean => {
    const errs: Partial<CheckoutForm> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Valid email address required";
    if (form.phone.replace(/\D/g, "").length < 10)
      errs.phone = "Valid phone number required";
    if (!form.state) errs.state = "Please select your delivery state";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setPaymentError("");

    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: orderTotal,
          customerName: form.name.trim(),
          customerEmail: form.email.trim(),
          customerPhone: form.phone.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Failed to initiate payment");
      }

      const data: PaymentInitiateResponse = await res.json();
      setInitData(data);

      const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
      if (!publicKey) throw new Error("Payment not configured");

      setFlwConfig({
        public_key: publicKey,
        tx_ref: data.tx_ref,
        amount: data.amount,
        currency: "NGN",
        payment_options: "card,banktransfer,ussd,mobilemoney",
        customer: {
          email: form.email.trim(),
          phone_number: form.phone.trim(),
          name: form.name.trim(),
        },
        customizations: {
          title: "Raiment",
          description: "Fashion Order Payment",
          logo: "",
        },
      });
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : "Could not start payment. Please try again."
      );
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: FlutterwaveCallbackResponse) => {
    if (!initData) return;

    try {
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: String(response.transaction_id),
          tx_ref: response.tx_ref,
          expectedAmount: initData.amount,
          signature: initData.signature,
        }),
      });

      const verifyData: PaymentVerifyResponse = await verifyRes.json();

      if (verifyData.success) {
        setLastOrder({
          txRef: response.tx_ref,
          transactionId: String(response.transaction_id),
          items: [...items],
          total: orderTotal,
          customerName: form.name.trim(),
          customerEmail: form.email.trim(),
          deliveryState: form.state,
          shippingFee,
          paidAt: new Date().toISOString(),
        });
        clearCart();
        router.push("/order-confirmation");
      } else {
        setPaymentError(
          verifyData.message ?? "Payment verification failed. Please contact support."
        );
        setFlwConfig(null);
        setLoading(false);
      }
    } catch {
      setPaymentError("Verification failed. Please contact support with your transaction ID.");
      setFlwConfig(null);
      setLoading(false);
    }
  };

  const handlePaymentClose = () => {
    setFlwConfig(null);
    setLoading(false);
  };

  if (!mounted) return <div className="min-h-screen bg-[#F8F7FF]" />;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm mb-5">Your cart is empty.</p>
          <Link href="/products" className="px-6 py-3 bg-[#7C3AED] text-white rounded-full text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Flutterwave popup mounts only when config is ready */}
      {flwConfig && (
        <FlutterwavePayment
          config={flwConfig}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentClose}
        />
      )}

      {/* Header */}
      <div
        className="pt-[62px] pb-5 px-4"
        style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #1a0a2e 100%)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3 pt-4">
          <Link
            href="/cart"
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white text-xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-24 pt-4 space-y-4">
        {/* Contact form */}
        <motion.form
          id="checkout-form"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <h2 className="text-base font-bold text-gray-800 mb-4">Contact Details</h2>
          <div className="space-y-4">
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

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+234 800 000 0000"
                autoComplete="tel"
                className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-sm text-gray-800 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-purple-100 ${
                  errors.phone ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              />
              <AnimatePresence>
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-red-400 mt-1"
                  >
                    {errors.phone}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Delivery State */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Delivery State
              </label>
              <select
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-sm text-gray-800 outline-none transition-all appearance-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-purple-100 ${
                  errors.state ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                }}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <AnimatePresence>
                {errors.state && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-red-400 mt-1"
                  >
                    {errors.state}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.form>

        {/* Order summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <h2 className="text-base font-bold text-gray-800 mb-3">Order Summary</h2>
          <div className="space-y-2.5 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-700">₦{cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery Fee</span>
              <span className="font-medium text-gray-700">
                {shippingFee === 0 ? "Free" : `₦${shippingFee.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-gray-800">Total</span>
              <span className="text-lg font-bold text-[#7C3AED]">₦{orderTotal.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Error banner */}
        <AnimatePresence>
          {paymentError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-red-600">{paymentError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pay button */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          type="submit"
          form="checkout-form"
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
              Processing…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Pay ₦{orderTotal.toLocaleString()}
            </>
          )}
        </motion.button>

        <p className="text-center text-[11px] text-gray-400 pb-2">
          Secured by Flutterwave · Card details are never stored by Raiment
        </p>
      </div>
    </div>
  );
}
