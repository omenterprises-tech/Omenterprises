"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, User, Loader2, Mail, Phone, KeyRound, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "register">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email: cleanEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("otp");
        setResendCountdown(30);
      } else {
        throw new Error(data.error || "Failed to send verification code. Please try again.");
      }
    } catch (err: any) {
      console.error("Send OTP Error:", err);
      setError(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim().replace(/\D/g, "");

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email: cleanEmail, otp: cleanOtp }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.isNewUser) {
          // Advance to Step 3: ask for Name & Mobile Number
          setStep("register");
        } else {
          // Existing customer logged in successfully
          router.push(callbackUrl);
          router.refresh();
        }
      } else {
        throw new Error(data.error || "Invalid or expired verification code.");
      }
    } catch (err: any) {
      console.error("Verify OTP Error:", err);
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Profile for New User
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, "");

    if (!cleanName) {
      setError("Full Name is required.");
      return;
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
          phoneNumber: cleanPhone,
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
      console.error("Complete Profile Error:", err);
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
      {/* Left Side: Industrial Showcase (Hidden on mobile) */}
      <div className="hidden md:block w-1/2 relative bg-brand-light h-full">
        <img 
          src="/images/industrial_login_bg.png" 
          alt="OM Enterprises Industrial Solutions" 
          className="absolute inset-0 w-full h-full object-cover shadow-2xl"
        />
        <div className="absolute inset-0 bg-black/15"></div>
        
        {/* Branding on image */}
        <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white text-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <p className="text-xl font-medium opacity-90 drop-shadow-lg tracking-[0.2em] uppercase">
              Premium Industrial & Electrical Solutions
            </p>
          </motion.div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-tr from-brand/40 to-transparent mix-blend-multiply"></div>
      </div>

      {/* Right Side: Auth Flow */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center items-center p-6 sm:p-10 md:p-14 relative bg-white overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-500">

          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-full border-2 border-brand/10 shadow-md flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Om Enterprises Logo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-brand mb-1.5">
              {step === "email" && "Customer Sign In"}
              {step === "otp" && "Verify Your Email"}
              {step === "register" && "Complete Your Profile"}
            </h2>

            <p className="text-brand/60 text-xs leading-relaxed font-medium">
              {step === "email" && "Enter your email to receive a secure login code via OTP."}
              {step === "otp" && `We've sent a 6-digit verification code to ${email}.`}
              {step === "register" && "Welcome to OM Enterprises! Please provide your name and mobile number."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl text-center flex items-center justify-center space-x-2 shadow-xs animate-in zoom-in-95">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></div>
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: Enter Email ================= */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-brand/50 uppercase tracking-[0.2em] ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pr-3 pointer-events-none">
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
                    autoFocus
                    required
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/50 focus:bg-white focus:shadow-[0_0_25px_rgba(255,152,0,0.12)] rounded-2xl py-3.5 pl-12 pr-4 text-brand font-semibold text-sm placeholder:text-brand/25 transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !email.trim()} 
                className="w-full bg-[#0D47A1] hover:bg-[#FF9800] text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex justify-center items-center space-x-2 mt-3 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="pt-4 text-center border-t border-gray-100 mt-6">
                <Link
                  href="/crm"
                  className="text-xs text-brand/60 hover:text-[#0D47A1] font-semibold transition-colors inline-flex items-center space-x-1"
                >
                  <span>Business owner or team member? Go to CRM Portal</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </form>
          )}

          {/* ================= STEP 2: Enter OTP ================= */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="bg-brand/5 rounded-2xl p-3.5 flex items-center justify-between border border-brand/10 text-xs">
                <div className="flex items-center space-x-2.5 truncate">
                  <Mail size={16} className="text-brand shrink-0" />
                  <span className="font-semibold text-brand truncate">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  className="text-xs font-bold text-[#FF9800] hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Change
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-brand/50 uppercase tracking-[0.2em] ml-1">
                  6-Digit Verification Code
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pr-3 pointer-events-none">
                    <KeyRound size={18} className="text-[#FF9800]" />
                  </div>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ""));
                      if (error) setError("");
                    }}
                    placeholder="123456" 
                    autoFocus
                    required
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/50 focus:bg-white focus:shadow-[0_0_25px_rgba(255,152,0,0.12)] rounded-2xl py-3.5 pl-12 pr-4 text-brand font-black tracking-[0.35em] text-center text-lg placeholder:tracking-normal placeholder:font-normal placeholder:text-brand/25 transition-all outline-none font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || otp.trim().length !== 6} 
                className="w-full bg-[#0D47A1] hover:bg-[#FF9800] text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex justify-center items-center space-x-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              {/* Resend OTP Button */}
              <div className="flex items-center justify-between pt-2 px-1 text-xs text-gray-500 font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  className="hover:text-brand transition-colors inline-flex items-center space-x-1"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>

                <div>
                  {resendCountdown > 0 ? (
                    <span className="text-gray-400">Resend in {resendCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="text-[#FF9800] hover:text-[#F57C00] font-bold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                      <span>Resend Code</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* ================= STEP 3: Complete Profile (New User) ================= */}
          {step === "register" && (
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center space-x-2 truncate">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold truncate">{email}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
                  Verified
                </span>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-brand/50 uppercase tracking-[0.2em] ml-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pr-3 pointer-events-none">
                    <User size={18} className="text-[#FF9800]" />
                  </div>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="e.g. Ramesh Patel" 
                    autoFocus
                    required
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/50 focus:bg-white focus:shadow-[0_0_25px_rgba(255,152,0,0.12)] rounded-2xl py-3.5 pl-12 pr-4 text-brand font-semibold text-sm placeholder:text-brand/25 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-brand/50 uppercase tracking-[0.2em] ml-1">
                  Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pr-3 pointer-events-none">
                    <Phone size={18} className="text-[#FF9800]" />
                  </div>
                  <input 
                    type="tel" 
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/\D/g, ""));
                      if (error) setError("");
                    }}
                    placeholder="9876543210" 
                    required
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/50 focus:bg-white focus:shadow-[0_0_25px_rgba(255,152,0,0.12)] rounded-2xl py-3.5 pl-12 pr-4 text-brand font-semibold text-sm placeholder:text-brand/25 transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !fullName.trim() || phoneNumber.replace(/\D/g, "").length !== 10} 
                className="w-full bg-[#FF9800] hover:bg-[#F57C00] text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex justify-center items-center space-x-2 mt-3 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete & Start Shopping</span>
                    <ArrowRight size={15} />
                  </>
                )}
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
    <Suspense
      fallback={
        <div className="h-screen w-full bg-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D47A1]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
