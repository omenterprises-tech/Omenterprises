"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { ArrowLeft, User, Loader2, Phone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"phone" | "register">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/phone-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.isNewUser) {
          setStep("register");
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } else {
        throw new Error(data.error || "Login failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Phone Login Error:", err);
      setError(err.message || "Failed to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) {
      setError("Both Name and Mobile Number are required.");
      return;
    }
    if (phoneNumber.length !== 10) {
      setError("Mobile Number must be exactly 10 digits.");
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
          phoneNumber: phoneNumber.trim()
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(data.error || "Failed to complete registration.");
      }
    } catch (err) {
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

          <div className="text-center mb-12">
            <div className="mb-8 flex justify-center">
              <div className="relative w-24 h-24 overflow-hidden rounded-full border-2 border-brand/10 shadow-lg flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Om Enterprises Logo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <h2 className="text-4xl font-playfair font-bold text-brand mb-4">
              {step === "register" ? "Register" : "Sign In"}
            </h2>
            <div className="px-6">
              <p className="text-brand/50 text-sm leading-relaxed font-medium">
                {step === "phone" && "Enter your mobile number to access your account."}
                {step === "register" && "New user! Please enter your name to register."}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-5 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-2xl text-center flex items-center justify-center space-x-3 shadow-sm animate-in zoom-in-95">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <span className="uppercase tracking-widest">{error}</span>
            </div>
          )}

          {/* PHASE 1: Mobile Number Login */}
          {step === "phone" && (
            <form onSubmit={handlePhoneLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-brand/30 uppercase tracking-[0.3em] ml-2">Mobile Number</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center space-x-3 border-r border-brand/10 pr-4">
                    <Phone size={16} className="text-[#FF9800]" />
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
                    placeholder="10-digit number" 
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/30 focus:bg-white focus:shadow-[0_0_40px_rgba(197,160,89,0.1)] rounded-2xl py-5 pl-16 pr-6 text-brand font-bold text-lg placeholder:text-brand/10 transition-all outline-none"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading || phoneNumber.length !== 10} 
                className="w-full bg-[#0D47A1] text-[#FF9800] font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl shadow-xl hover:bg-[#FF9800] hover:text-white hover:shadow-[0_20px_40px_rgba(255,152,0,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex justify-center items-center space-x-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>
          )}

          {/* PHASE 2: Register Name */}
          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-brand/30 uppercase tracking-[0.3em] ml-2">Full Name</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2">
                    <User className="text-[#FF9800]" size={20} />
                  </div>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="e.g. John Doe" 
                    className="w-full bg-brand/5 border-2 border-transparent focus:border-[#FF9800]/30 focus:bg-white focus:shadow-[0_0_40px_rgba(197,160,89,0.1)] rounded-2xl py-5 pl-14 pr-6 text-brand font-bold text-lg transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-brand/30 uppercase tracking-[0.3em] ml-2">Mobile Number (Read-only)</label>
                <div className="relative bg-gray-50 border border-gray-100 rounded-2xl py-5 px-6">
                  <span className="text-brand/60 font-bold text-lg">{phoneNumber}</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !fullName.trim()} 
                className="w-full bg-[#0D47A1] text-[#FF9800] font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl shadow-xl hover:bg-[#FF9800] hover:text-white hover:shadow-[0_20px_40px_rgba(255,152,0,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex justify-center items-center space-x-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Register & Login</span>
                )}
              </button>

              <button 
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError("");
                }}
                className="w-full flex items-center justify-center space-x-2 text-xs font-bold text-brand/50 hover:text-[#FF9800] py-2 transition-all"
              >
                <ArrowLeft size={14} />
                <span>Change phone number</span>
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
