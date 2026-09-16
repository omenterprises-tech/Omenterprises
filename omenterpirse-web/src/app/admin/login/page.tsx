"use client";

import { useState } from "react";
import { Lock, Mail, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(), 
          password 
        }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/admin/navigation");
        router.refresh();
      } else {
        setError(data.error || "Invalid admin credentials");
      }
    } catch (err: any) {
      console.error("Admin Login Error:", err);
      setError("An error occurred. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center items-center p-4 font-inter">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl border border-brand/5 border-t-[12px] border-t-brand-accent relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-accent/5 rounded-full blur-3xl"></div>

        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-brand flex items-center justify-center shadow-lg relative">
            <Lock className="text-brand-accent" size={32} />
            <div className="absolute -bottom-2 -right-2 bg-brand-accent p-1.5 rounded-lg shadow-lg">
              <ShieldCheck size={16} className="text-brand" />
            </div>
          </div>
          <h2 className="text-3xl font-playfair font-bold text-brand mb-3">
            Admin Portal
          </h2>
          <p className="text-brand-dark/60 text-sm font-medium uppercase tracking-widest">
            Authorization Required
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-brand-dark/40 uppercase tracking-[0.2em] ml-1">Admin Email</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent flex-shrink-0">
                <Mail size={16} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com" 
                className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/30 focus:bg-white focus:shadow-sm rounded-xl py-3.5 pl-12 pr-4 text-brand font-bold text-sm outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-brand-dark/40 uppercase tracking-[0.2em] ml-1">Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent flex-shrink-0">
                <Lock size={16} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/30 focus:bg-white focus:shadow-sm rounded-xl py-3.5 pl-12 pr-4 text-brand font-bold text-sm outline-none transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#0D47A1] text-[#FF9800] font-black uppercase tracking-[0.2em] text-xs py-4.5 rounded-xl shadow-lg hover:bg-[#FF9800] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
