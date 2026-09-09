"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Lock, Mail, User, Phone, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle, Building2 } from "lucide-react";

export default function CrmEntryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/crm/auth/session");
        const data = await res.json();
        if (data.authenticated) {
          if (data.isOnboardingCompleted) {
            router.replace("/crm/dashboard");
          } else {
            router.replace("/crm/onboarding");
          }
          return;
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setIsCheckingSession(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/crm/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || "Invalid credentials.");
        setLoginLoading(false);
        return;
      }

      if (data.isOnboardingCompleted) {
        router.push("/crm/dashboard");
      } else {
        router.push("/crm/onboarding");
      }
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in.");
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");

    if (!registerName.trim()) {
      setRegisterError("Full name is required.");
      return;
    }
    if (!registerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.trim())) {
      setRegisterError("Please enter a valid email address.");
      return;
    }
    const cleanPhone = registerPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setRegisterError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setRegisterError("Password must be at least 6 characters long.");
      return;
    }

    setRegisterLoading(true);
    try {
      const res = await fetch("/api/crm/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: registerName,
          email: registerEmail,
          phoneNumber: cleanPhone,
          password: registerPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setRegisterError(data.error || "Failed to register.");
        setRegisterLoading(false);
        return;
      }

      // Automatically move to onboarding step 1
      router.push("/crm/onboarding");
    } catch (err: any) {
      setRegisterError(err.message || "Something went wrong.");
      setRegisterLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Opening OM Enterprises CRM...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center space-x-2 mb-3 bg-brand text-white px-4 py-2 rounded-2xl shadow-lg">
          <Zap size={22} className="text-[#FF9800] fill-[#FF9800]" />
          <span className="text-lg font-black tracking-wider">
            OM <span className="text-[#FF9800]">ENTERPRISES</span>
          </span>
          <span className="text-[10px] bg-white/20 font-mono font-bold uppercase px-2 py-0.5 rounded-full ml-1 text-white/90">
            CRM
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 font-playfair">
          Business Management Portal
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Manage your business profile, identity, documents, and team in one place.
        </p>
      </div>

      {/* Main Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-gray-100/80">
          {/* Tab Switcher */}
          <div className="flex bg-gray-100/80 p-1.5 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setLoginError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-white text-brand shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setRegisterError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === "register"
                  ? "bg-white text-brand shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Register New
            </button>
          </div>

          {/* LOGIN FORM */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              {loginError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2.5 text-rose-600 text-xs font-semibold animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Business Email Address
                </label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to CRM</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-500">Don&apos;t have a business account yet? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="text-xs font-bold text-brand hover:underline cursor-pointer"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              {registerError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2.5 text-rose-600 text-xs font-semibold animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Full Name / Contact Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Business Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile number"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Set Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl text-[11px] text-blue-700 leading-relaxed flex items-start space-x-2">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-brand" />
                <span>
                  After signing up, you will be guided through a 3-step setup to complete your business profile.
                </span>
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full py-3.5 bg-[#FF9800] hover:bg-[#F57C00] text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {registerLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Business Setup</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-gray-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-xs font-bold text-brand hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
