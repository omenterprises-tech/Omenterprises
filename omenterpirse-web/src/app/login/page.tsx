"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { User, Loader2, Phone, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"phone" | "name">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Step 1: Submit Mobile Number -> Check if existing or new
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/phone-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: cleanPhone }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.isNewUser) {
          // New user: ask for their name
          setStep("name");
        } else {
          // Existing user: direct login without any OTPs!
          router.push(callbackUrl);
          router.refresh();
        }
      } else {
        throw new Error(data.error || "Unable to proceed with login.");
      }
    } catch (err: any) {
      console.error("Phone Login Error:", err);
      setError(err.message || "Failed to proceed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: New User -> Submit Name to complete registration and login directly
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, "");
    const cleanName = fullName.trim();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/phone-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          fullName: cleanName,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Registered and logged in directly without any OTPs!
        router.push(callbackUrl);
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to complete registration.");
      }
    } catch (err: any) {
      console.error("Name Registration Error:", err);
      setError(err.message || "Failed to complete sign in. Please try again.");
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
              {step === "phone" ? "Customer Sign In" : "Welcome to OM Enterprises!"}
            </h2>

            <p className="text-brand/60 text-xs leading-relaxed font-medium">
              {step === "phone"
                ? "Enter your 10-digit mobile number to continue."
                : "Please enter your name to complete your profile."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl text-center flex items-center justify-center space-x-2 shadow-xs animate-in zoom-in-95">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></div>
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: Enter Mobile Number ================= */}
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-brand/50 uppercase tracking-[0.2em] ml-1">
                  Mobile Number
                </label>
                <div className="relative group flex items-center">
                  {/* +91 Country Indicator */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 text-brand/70 font-bold text-sm pointer-events-none pr-2 border-r border-brand/15">
                    <Phone size={16} className="text-[#FF9800]" />
                    <span>+91</span>
                  </div>
                  <input 
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/\D/g, ""));
                      if (error) setError("");
                    }}
                    placeholder="9876543210" 
                    autoComplete="tel"
                    autoFocus
                    required
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/50 focus:bg-white focus:shadow-[0_0_25px_rgba(255,152,0,0.12)] rounded-2xl py-3.5 pl-20 pr-4 text-brand font-semibold text-sm placeholder:text-brand/25 transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || phoneNumber.trim().length !== 10} 
                className="w-full bg-[#0D47A1] hover:bg-[#FF9800] text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex justify-center items-center space-x-2 mt-3 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 2: Enter Name (New User Only) ================= */}
          {step === "name" && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              {/* Display Phone Number with Change option */}
              <div className="bg-brand/5 border border-brand/10 rounded-2xl p-3.5 flex items-center justify-between text-xs text-brand">
                <div className="flex items-center space-x-2">
                  <Phone size={15} className="text-[#FF9800]" />
                  <span className="font-semibold">+91 {phoneNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError("");
                  }}
                  className="text-xs font-bold text-[#FF9800] hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <ArrowLeft size={12} />
                  <span>Change Number</span>
                </button>
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

              <button 
                type="submit" 
                disabled={loading || !fullName.trim()} 
                className="w-full bg-[#0D47A1] hover:bg-[#FF9800] text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex justify-center items-center space-x-2 mt-3 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
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
