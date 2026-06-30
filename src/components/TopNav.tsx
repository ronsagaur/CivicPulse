"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Activity, RotateCcw } from "lucide-react";
import { api } from "@/lib/client";

const TABS = [
  { href: "/", label: "Citizen", surface: "citizen" },
  { href: "/authority", label: "Authority", surface: "authority" },
  { href: "/ledger", label: "Public Ledger", surface: "ledger" },
  { href: "/agents", label: "Agent Control Center", surface: "agents" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  async function reset() {
    setResetting(true);
    try {
      await api("/api/reset", { method: "POST" });
      router.refresh();
      // force any polling pages to re-pull immediately
      window.location.reload();
    } finally {
      setResetting(false);
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/report");
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-[1000] border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap sm:gap-4 sm:px-4 sm:py-0">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/assets/icons/app_icon.png"
            alt="CivicPulse Logo"
            width={32}
            height={32}
            className="rounded-xl object-contain shadow-sm border border-slate-200/40"
          />
          <span className="text-base font-extrabold tracking-tight">
            Civic<span className="text-brand-600">Pulse</span>
          </span>
        </Link>

        <nav className="order-3 flex w-full min-w-0 items-center justify-center gap-1 rounded-xl bg-slate-100 p-1 text-xs sm:order-none sm:ml-2 sm:w-auto sm:text-sm">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`min-w-0 rounded-lg px-2.5 py-1.5 text-center font-semibold transition sm:px-3 ${
                isActive(t.href)
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={reset}
            disabled={resetting}
            className="btn-ghost !px-2.5 !py-1.5 text-xs max-sm:w-9 max-sm:gap-0 max-sm:text-[0] sm:!px-3"
            title="Reset database to the seeded state"
          >
            <RotateCcw size={14} />
            {resetting ? "Resetting…" : "Reset database"}
          </button>
        </div>
      </div>
    </header>
  );
}
