"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, User, Loader2, Mail, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: password.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.isNewUser) {
          setStep("register");
        } else {
          const targetUrl = data.redirectTo || callbackUrl || "/";
          router.push(targetUrl);
          router.refresh();
        }
      } else {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Failed to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full Name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(data.error || "Failed to complete registration.");
      }
    } catch (err: any) {
      setError("Failed to complete profile registration.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D47A1]" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-white flex flex-col md:flex-row font-inter selection:bg-brand-accent/30 overflow-hidden">
      {/* Left Side: Image (Hidden on mobile) */}
      <div className="hidden md:block w-1/2 relative bg-brand-light h-full">
        <img 
          src="/images/industrial_login_bg.png" 
          alt="OM Enterprises Industrial Solutions" 
          className="absolute inset-0 w-full h-full object-cover shadow-2xl"
        />
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Decorative branding on image */}
        <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white text-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <p className="text-xl font-medium opacity-90 drop-shadow-lg tracking-[0.2em] uppercase">Premium Industrial & Electrical Solutions</p>
          </motion.div>
        </div>
        
        {/* Artistic overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand/40 to-transparent mix-blend-multiply"></div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center items-center p-8 md:p-16 relative bg-white overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">

          <div className="text-center mb-10">
            <div className="mb-6 flex justify-center">
              <div className="relative w-20 h-20 overflow-hidden rounded-full border-2 border-brand/10 shadow-lg flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Om Enterprises Logo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <h2 className="text-3xl font-playfair font-bold text-brand mb-2">
              {step === "register" ? "Create Account" : "Sign In"}
            </h2>
            <div className="px-4">
              <p className="text-brand/60 text-xs leading-relaxed font-medium">
                {step === "login" && "Enter your email address to access your account."}
                {step === "register" && "Welcome! Enter your details to complete your profile."}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-2xl text-center flex items-center justify-center space-x-3 shadow-sm animate-in zoom-in-95">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
              <span className="uppercase tracking-wider">{error}</span>
            </div>
          )}

          {/* PHASE 1: Email & Password Login */}
          {step === "login" && (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              {/* Email Address */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.25em] ml-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pr-3">
                    <Mail size={18} className="text-[#FF9800]" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="name@example.com" 
                    autoComplete="email"
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/40 focus:bg-white focus:shadow-[0_0_30px_rgba(255,152,0,0.12)] rounded-2xl py-4 pl-14 pr-5 text-brand font-semibold text-sm placeholder:text-brand/20 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-2">
                  <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.25em]">Password</label>
                  <span className="text-[10px] text-gray-400 font-medium">Required for CRM & team</span>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pr-3">
                    <Lock size={18} className="text-[#FF9800]" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="••••••••" 
                    autoComplete="current-password"
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/40 focus:bg-white focus:shadow-[0_0_30px_rgba(255,152,0,0.12)] rounded-2xl py-4 pl-14 pr-12 text-brand font-semibold text-sm placeholder:text-brand/20 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !email.trim()} 
                className="w-full bg-[#0D47A1] text-[#FF9800] font-black uppercase tracking-[0.2em] text-xs py-4.5 rounded-2xl shadow-xl hover:bg-[#FF9800] hover:text-white hover:shadow-[0_20px_40px_rgba(255,152,0,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex justify-center items-center space-x-3 mt-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              <div className="pt-4 text-center">
                <Link
                  href="/crm"
                  className="text-xs text-brand/60 hover:text-[#0D47A1] font-semibold transition-colors inline-flex items-center space-x-1"
                >
                  <span>Business owner? Go to CRM Portal</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </form>
          )}

          {/* PHASE 2: Register Details */}
          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.25em] ml-2">Email Address (Account)</label>
                <div className="relative bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5">
                  <span className="text-brand/70 font-semibold text-sm">{email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.25em] ml-2">Full Name</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2">
                    <User className="text-[#FF9800]" size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="e.g. John Doe" 
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/40 focus:bg-white focus:shadow-[0_0_30px_rgba(255,152,0,0.12)] rounded-2xl py-4 pl-14 pr-5 text-brand font-semibold text-sm transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.25em] ml-2">Mobile Number (Optional)</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2">
                    <Phone className="text-[#FF9800]" size={18} />
                  </div>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhoneNumber(val);
                      if (error) setError("");
                    }}
                    placeholder="10-digit mobile number" 
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/40 focus:bg-white focus:shadow-[0_0_30px_rgba(255,152,0,0.12)] rounded-2xl py-4 pl-14 pr-5 text-brand font-semibold text-sm transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !fullName.trim()} 
                className="w-full bg-[#0D47A1] text-[#FF9800] font-black uppercase tracking-[0.2em] text-xs py-4.5 rounded-2xl shadow-xl hover:bg-[#FF9800] hover:text-white hover:shadow-[0_20px_40px_rgba(255,152,0,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex justify-center items-center space-x-3 mt-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Complete Registration</span>
                )}
              </button>

              <button 
                type="button"
                onClick={() => {
                  setStep("login");
                  setError("");
                }}
                className="w-full flex items-center justify-center space-x-2 text-xs font-bold text-brand/50 hover:text-[#FF9800] py-2 transition-all"
              >
                <ArrowLeft size={14} />
                <span>Use different email</span>
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D47A1]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
