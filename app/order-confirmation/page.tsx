"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useOrderStore } from "@/store/orderStore";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { lastOrder, clearLastOrder } = useOrderStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !lastOrder) {
      router.replace("/");
    }
  }, [mounted, lastOrder, router]);

  if (!mounted || !lastOrder) {
    return <div className="min-h-screen bg-[#F8F7FF]" />;
  }

  const handleContinueShopping = () => {
    clearLastOrder();
    router.push("/products");
  };

  const formattedDate = new Date(lastOrder.paidAt).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <div
        className="pt-[62px] pb-5 px-4"
        style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #1a0a2e 100%)" }}
      >
        <div className="max-w-3xl mx-auto pt-4">
          <h1 className="text-white text-xl font-bold">Order Confirmed</h1>
          <p className="text-purple-300 text-sm mt-0.5">{formattedDate}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-24 pt-4 space-y-4">
        {/* Success card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="bg-white rounded-2xl p-6 shadow-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
            className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>

          <h2 className="text-lg font-bold text-gray-800 mb-1">Payment Successful!</h2>
          <p className="text-sm text-gray-400 mb-5">
            Thank you, <span className="text-gray-600 font-semibold">{lastOrder.customerName}</span>.
            Your order has been confirmed.
          </p>

          <div className="inline-block bg-purple-50 rounded-xl px-5 py-3">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-0.5">
              Transaction Reference
            </p>
            <p className="text-sm font-mono font-semibold text-[#7C3AED] break-all">
              {lastOrder.txRef}
            </p>
          </div>
        </motion.div>

        {/* Items ordered */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-base font-bold text-gray-800 mb-3">Items Ordered</h3>
          <div className="space-y-3">
            {lastOrder.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-800">Total Paid</span>
            <span className="text-lg font-bold text-[#7C3AED]">
              ₦{lastOrder.total.toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* Order details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-base font-bold text-gray-800 mb-3">Order Details</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-400 flex-shrink-0">Email</span>
              <span className="text-gray-700 font-medium text-right truncate">
                {lastOrder.customerEmail}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400 flex-shrink-0">Transaction ID</span>
              <span className="text-gray-600 font-mono text-xs text-right break-all">
                {lastOrder.transactionId}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400 flex-shrink-0">Date</span>
              <span className="text-gray-700 font-medium">{formattedDate}</span>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          onClick={handleContinueShopping}
          className="w-full py-4 rounded-2xl text-white text-sm font-bold tracking-wide cursor-pointer"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)" }}
        >
          Continue Shopping
        </motion.button>

        <p className="text-center text-[11px] text-gray-400 pb-2">
          A confirmation has been sent to {lastOrder.customerEmail}
        </p>
      </div>
    </div>
  );
}
