"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Shield, User as UserIcon, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"CITIZEN" | "AUTHORITY">("CITIZEN");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCitizenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: "CITIZEN",
              name: name.trim(),
              phone: phone.trim(),
              homeLat: latitude,
              homeLng: longitude,
            }),
          });
          const data = await res.json();
          if (data.success) {
            router.push(data.redirect);
          } else {
            setError(data.error || "Login failed.");
            setLoading(false);
          }
        } catch (err) {
          setError("Network error. Please try again.");
          setLoading(false);
        }
      },
      (geoError) => {
        setError("Location access is required for citizens.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleQuickCitizenLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "CITIZEN",
          name: "Rahul Sharma",
          phone: "9876543210",
          homeLat: 19.1197,
          homeLng: 72.8468,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(data.redirect);
      } else {
        setError(data.error || "Login failed.");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleAuthorityLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "AUTHORITY" }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(data.redirect);
      } else {
        setError(data.error || "Login failed.");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const [resetting, setResetting] = useState(false);

  const handleResetSystem = async () => {
    if (confirm("Are you sure you want to clear all custom reports and reset the system database?")) {
      setResetting(true);
      try {
        await fetch("/api/reset", { method: "POST" });
        alert("System successfully reset to default seed state!");
      } catch (err) {
        alert("Failed to reset system. Please try again.");
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold font-serif-header text-slate-800">
            CivicPulse
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Report. Verify. Route. Resolve. Re-verify.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
          <button
            onClick={() => setRole("CITIZEN")}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition ${
              role === "CITIZEN"
                ? "bg-white shadow-sm text-slate-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Citizen
          </button>
          <button
            onClick={() => setRole("AUTHORITY")}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition ${
              role === "AUTHORITY"
                ? "bg-white shadow-sm text-slate-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Authority
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg border border-rose-100">
            {error}
          </div>
        )}

        {role === "CITIZEN" ? (
          <form onSubmit={handleCitizenLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-brand-500 focus:ring-brand-500 transition"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-brand-500 focus:ring-brand-500 transition"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : (
                <>
                  <MapPin size={16} /> Enter Dashboard
                </>
              )}
            </button>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            <button
              type="button"
              onClick={handleQuickCitizenLogin}
              disabled={loading}
              className="btn-ghost !border-dashed !border-slate-300 w-full flex items-center justify-center gap-2 hover:!bg-slate-50 transition"
            >
              ⚡ Instant Entry (Andheri West Ward 14)
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-3 px-4 leading-tight">
              By entering, the map will align with your registered physical neighborhood.
            </p>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="py-6 px-4 bg-brand-50 rounded-xl border border-dashed border-brand-200">
              <Shield className="mx-auto text-brand-600 mb-2" size={32} />
              <h3 className="text-sm font-bold text-brand-800">
                Official Access
              </h3>
              <p className="text-xs text-brand-600/80 mt-1">
                Enter the internal portal for assigning resources, escalating tickets, and confirming resolutions.
              </p>
            </div>
            <button
              onClick={handleAuthorityLogin}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : (
                "Enter Authority Portal"
              )}
            </button>
          </div>
        )}
      </div>

      {/* System Reset Trigger */}
      <div className="mt-4 text-center z-10">
        <button
          onClick={handleResetSystem}
          disabled={resetting}
          className="text-[10px] text-slate-400 hover:text-slate-600 font-bold transition flex items-center justify-center gap-1 mx-auto"
        >
          {resetting ? (
            <>
              <Loader2 size={10} className="animate-spin" /> Resetting database...
            </>
          ) : (
            <>
              🔄 Clear Database &amp; Reload Seed State
            </>
          )}
        </button>
      </div>
    </div>
  );
}
