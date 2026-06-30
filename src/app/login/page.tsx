"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  User as UserIcon,
  Phone,
  MapPin,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  BarChart3,
  Eye,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showCredentials, setShowCredentials] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState("");

  // ── Instant Demo Entry ────────────────────────────────────────
  const handleDemoLogin = async () => {
    setLoadingDemo(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "demo" }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(data.redirect);
      } else {
        setError(data.error || "Demo login failed.");
        setLoadingDemo(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoadingDemo(false);
    }
  };

  // ── Credentials Login ─────────────────────────────────────────
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    setLoading(true);
    setError("");

    let resolved = false;

    const proceedWithLogin = async (lat: number, lng: number) => {
      if (resolved) return;
      resolved = true;
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "credentials",
            name: name.trim(),
            phone: phone.trim(),
            homeLat: lat,
            homeLng: lng,
          }),
        });
        const data = await res.json();
        if (data.success) {
          router.push(data.redirect);
        } else {
          setError(data.error || "Login failed.");
          setLoading(false);
        }
      } catch {
        setError("Network error. Please try again.");
        setLoading(false);
      }
    };

    if (!navigator.geolocation) {
      await proceedWithLogin(19.1197, 72.8468);
      return;
    }

    const safetyTimeout = setTimeout(() => {
      proceedWithLogin(19.1197, 72.8468);
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(safetyTimeout);
        await proceedWithLogin(position.coords.latitude, position.coords.longitude);
      },
      async () => {
        clearTimeout(safetyTimeout);
        await proceedWithLogin(19.1197, 72.8468);
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 0 }
    );
  };

  const isAnyLoading = loading || loadingDemo;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-brand-100/40 to-brand-200/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-amber-100/30 to-brand-100/20 blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="card w-full max-w-md p-8 animate-fade-in relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-lg shadow-brand-500/20">
            <MapPin className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold font-serif-header text-slate-800">
            CivicPulse
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            AI-powered civic accountability — report, verify, resolve.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 p-3 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl border border-rose-100 animate-fade-in">
            {error}
          </div>
        )}

        {/* ── Primary: Instant Demo Entry ─────────────────────────── */}
        <button
          onClick={handleDemoLogin}
          disabled={isAnyLoading}
          className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 p-[1.5px] shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="relative rounded-[calc(1rem-1.5px)] bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                  {loadingDemo ? (
                    <Loader2 size={20} className="text-white animate-spin" />
                  ) : (
                    <Zap size={20} className="text-white" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">
                    Instant Demo Entry
                  </div>
                  <div className="text-white/70 text-xs mt-0.5">
                    Pre-loaded data · Andheri West Ward 14
                  </div>
                </div>
              </div>
              <ArrowRight
                size={18}
                className="text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </div>
        </button>

        {/* Feature chips under demo button */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-6">
          {[
            { icon: Sparkles, label: "AI Agents" },
            { icon: Shield, label: "Trust System" },
            { icon: BarChart3, label: "Live Analytics" },
            { icon: Eye, label: "Public Ledger" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500"
            >
              <Icon size={10} />
              {label}
            </span>
          ))}
        </div>

        {/* ── Divider ─────────────────────────────────────────────── */}
        <div className="relative flex items-center mb-5">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            or
          </span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        {/* ── Secondary: Login with Credentials ───────────────────── */}
        {!showCredentials ? (
          <button
            onClick={() => setShowCredentials(true)}
            disabled={isAnyLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-[1.5px] border-dashed border-slate-300 text-sm font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/50 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            <UserIcon size={15} />
            Login with Credentials
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        ) : (
          <div className="animate-fade-in">
            <button
              onClick={() => {
                setShowCredentials(false);
                setError("");
              }}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center gap-2 mb-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
            >
              <ChevronUp size={14} />
              Hide credentials form
            </button>

            <form onSubmit={handleCredentialsLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none transition"
                    disabled={isAnyLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none transition"
                    disabled={isAnyLoading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAnyLoading}
                className="btn-primary w-full mt-1"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : (
                  <>
                    <ArrowRight size={16} /> Enter Dashboard
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-slate-400 mt-2 px-4 leading-tight">
                Your location will be used to align the map with your neighborhood.
                New accounts start at Trust Level 10.
              </p>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-slate-400 mt-6 text-center z-10 max-w-xs leading-relaxed">
        Built with AI multi-agent architecture. Switch between Citizen, Authority, and Ledger views from the navigation bar after login.
      </p>
    </div>
  );
}
