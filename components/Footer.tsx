"use client";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="px-4 pt-16 pb-8"
      style={{
        background: "rgba(4, 2, 12, 0.95)",
        borderTop: "1px solid rgba(124,58,237,0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <p
            className="font-serif text-2xl tracking-[0.3em] uppercase mb-4 font-bold"
            style={{ color: "#A78BFA" }}
          >
            Raiment
          </p>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.32)" }}>
            Fashion crafted for those who move through the world with intention. Elevated essentials, timeless design.
          </p>
        </div>

        {/* Navigate */}
        <div>
          <p
            className="text-xs uppercase tracking-[0.2em] mb-4 font-semibold"
            style={{ color: "rgba(167,139,250,0.7)" }}
          >
            Navigate
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Collection", href: "/products" },
              { label: "Cart", href: "/cart" },
              { label: "About", href: "/#story" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-sm transition-colors duration-200 hover:text-white"
                  style={{ color: "rgba(255,255,255,0.32)" }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p
            className="text-xs uppercase tracking-[0.2em] mb-4 font-semibold"
            style={{ color: "rgba(167,139,250,0.7)" }}
          >
            Contact
          </p>
          <ul className="space-y-2.5">
            <li className="text-sm" style={{ color: "rgba(255,255,255,0.32)" }}>
              hello@raiment.co
            </li>
            <li className="text-sm" style={{ color: "rgba(255,255,255,0.32)" }}>
              @raiment.official
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="max-w-7xl mx-auto mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          &copy; {year} Raiment. All rights reserved.
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          Crafted with precision.
        </p>
      </div>
    </footer>
  );
}
