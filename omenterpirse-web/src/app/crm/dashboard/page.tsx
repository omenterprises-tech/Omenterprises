"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  LogOut,
  Loader2,
  ShieldCheck,
  Zap,
  FileText,
  UserCheck,
  Package,
  FileCheck2,
  PlusCircle,
} from "lucide-react";

export default function CrmDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Counts for dashboard badges
  const [quotationsCount, setQuotationsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);

  const canManageBusiness = Boolean(user?.isOwner ?? (user?.role === "Owner"));

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/crm/auth/session");
        const data = await res.json();
        if (!data.authenticated) {
          router.replace("/crm");
          return;
        }
        if (!data.isOnboardingCompleted) {
          router.replace("/crm/onboarding");
          return;
        }

        setUser(data.user);
        setBusiness(data.business);

        // Fetch counts for summary badges
        const [teamRes, quotesRes, custRes, prodRes] = await Promise.allSettled([
          fetch("/api/crm/team").then((r) => r.json()),
          fetch("/api/crm/quotations").then((r) => r.json()),
          fetch("/api/crm/customers").then((r) => r.json()),
          fetch("/api/crm/products").then((r) => r.json()),
        ]);

        if (teamRes.status === "fulfilled" && teamRes.value?.success && teamRes.value.members) {
          setTeamCount(teamRes.value.members.length);
        }
        if (quotesRes.status === "fulfilled" && quotesRes.value?.success && quotesRes.value.quotations) {
          setQuotationsCount(quotesRes.value.quotations.length);
        }
        if (custRes.status === "fulfilled" && custRes.value?.success && custRes.value.customers) {
          setCustomersCount(custRes.value.customers.length);
        }
        if (prodRes.status === "fulfilled" && prodRes.value?.success && prodRes.value.products) {
          setProductsCount(prodRes.value.products.length);
        }
      } catch (err) {
        console.error("Failed to load CRM dashboard session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/crm/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    router.replace("/crm");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Opening CRM Dashboard...</p>
      </div>
    );
  }

  const businessName = business?.businessName || "Your Business";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter">
      {/* Top CRM Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-md">
                <Zap size={20} className="text-[#FF9800] fill-[#FF9800]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-gray-900 tracking-tight text-base">
                    OM <span className="text-[#FF9800]">CRM</span>
                  </span>
                  <span className="text-[10px] bg-brand/10 text-brand font-bold uppercase px-2 py-0.5 rounded-full">
                    Business Portal
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                  {businessName}
                </p>
              </div>
            </div>

            {/* User & Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                type="button"
                onClick={() => router.push("/crm/business")}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
                title={canManageBusiness ? "Manage Business Profile" : "View Official Business Profile"}
              >
                <Building2 size={14} className="text-brand" />
                <span>{canManageBusiness ? "Manage Profile" : "View Profile"}</span>
              </button>

              <div className="hidden sm:flex flex-col text-right">
                <div className="flex items-center justify-end space-x-1.5">
                  <span className="text-xs font-bold text-gray-900">
                    {user?.fullName || "Business User"}
                  </span>
                  {user?.role && (
                    <span className="text-[10px] bg-brand/10 text-brand font-bold uppercase px-1.5 py-0.5 rounded-md">
                      {user.role}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-500">{user?.email}</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                title="Log out of CRM"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-brand via-[#1565C0] to-[#0D47A1] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-white/90">
                <ShieldCheck size={14} className="text-[#FF9800]" />
                <span>Verified Business Account</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-playfair tracking-tight">
                Welcome, {businessName}!
              </h1>
              <p className="text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed">
                Create official customer quotations, manage clients, inspect your company settings, and collaborate with your team.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs flex items-center space-x-2">
                <FileText size={15} className="text-[#FF9800]" />
                <div>
                  <div className="text-white/70 text-[10px] uppercase font-bold">Quotations</div>
                  <div className="font-semibold text-sm">{quotationsCount} Quotes</div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs flex items-center space-x-2">
                <Users size={15} className="text-[#FF9800]" />
                <div>
                  <div className="text-white/70 text-[10px] uppercase font-bold">Customers</div>
                  <div className="font-semibold text-sm">{customersCount} Clients</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= MANAGE SECTION ================= */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
              Manage
            </h3>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-3.5">
            {/* 1. Business */}
            <button
              type="button"
              onClick={() => router.push("/crm/business")}
              className="group text-left p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-brand/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand group-hover:bg-brand group-hover:text-white flex items-center justify-center transition-colors">
                  <Building2 size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand">
                  Open →
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                  Business
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Profile & Branding
                </p>
              </div>
            </button>

            {/* 2. Teams */}
            <button
              type="button"
              onClick={() => router.push("/crm/teams")}
              className="group text-left p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-purple-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <Users size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  {teamCount}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  Teams
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Access & Roles
                </p>
              </div>
            </button>

            {/* 3. Customers */}
            <button
              type="button"
              onClick={() => router.push("/crm/customers")}
              className="group text-left p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-emerald-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <UserCheck size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {customersCount}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  Customers
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Client Directory
                </p>
              </div>
            </button>

            {/* 4. Products */}
            <button
              type="button"
              onClick={() => router.push("/crm/products")}
              className="group text-left p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-amber-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <Package size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  {productsCount}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                  Products
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Items & Catalog
                </p>
              </div>
            </button>

            {/* 5. Terms */}
            <button
              type="button"
              onClick={() => router.push("/crm/terms")}
              className="group text-left p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-indigo-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <FileCheck2 size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  Open →
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  Terms
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Rules & Policies
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ================= DISCOVER SECTION ================= */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
              Discover
            </h3>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl">
            {/* 1. Quotation */}
            <button
              type="button"
              onClick={() => router.push("/crm/quotations/create")}
              className="group text-left p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-brand/50 transition-all duration-200 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-brand group-hover:bg-brand group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <PlusCircle size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                    Quotation
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Create new commercial quote
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-brand/10 text-brand font-bold text-xs group-hover:bg-brand group-hover:text-white transition-all shrink-0">
                + Create
              </span>
            </button>

            {/* 2. Quotation list */}
            <button
              type="button"
              onClick={() => router.push("/crm/quotations")}
              className="group text-left p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-brand/50 transition-all duration-200 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-brand group-hover:bg-brand group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <FileText size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                    Quotation list
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View & track all quotations ({quotationsCount})
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-gray-100 text-gray-700 group-hover:bg-brand group-hover:text-white font-bold text-xs transition-all shrink-0">
                View List
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
