"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  LogOut,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  PenTool,
  Plus,
  Loader2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Zap,
  Briefcase,
  X,
} from "lucide-react";
import { formatDateWithPattern } from "@/lib/crmCurrencyData";

export default function CrmDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"business" | "team">("business");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Manager");
  const [teamMembers, setTeamMembers] = useState<
    { name: string; email: string; role: string; status: string }[]
  >([]);

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

        // Initial team member (owner)
        setTeamMembers([
          {
            name: data.business?.contactName || data.user.fullName,
            email: data.business?.email || data.user.email,
            role: "Owner (Primary)",
            status: "Active",
          },
        ]);
      } catch (err) {
        console.error("Failed to load CRM session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/crm/auth/logout", { method: "POST" });
      router.push("/crm");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setTeamMembers((prev) => [
      ...prev,
      {
        name: inviteEmail.split("@")[0],
        email: inviteEmail.trim(),
        role: inviteRole,
        status: "Invited",
      },
    ]);
    setInviteEmail("");
    setIsInviteModalOpen(false);
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
  const dateFormat = business?.dateFormat || "dd/MM/yyyy";
  const currencyCode = business?.currencyCode || "INR";
  const currencyPrice = business?.currencyPriceFormatted || "₹999,999.12";

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

            {/* User & Logout */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-gray-900">
                  {user?.fullName || "Business User"}
                </span>
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
                Your business CRM profile is fully configured. Manage your identity, documents, configurations, and team below.
              </p>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs flex items-center space-x-2">
                <Calendar size={15} className="text-[#FF9800]" />
                <div>
                  <div className="text-[10px] uppercase text-white/60 font-bold">Date Format</div>
                  <div className="font-semibold">{dateFormat}</div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs flex items-center space-x-2">
                <CreditCard size={15} className="text-[#FF9800]" />
                <div>
                  <div className="text-[10px] uppercase text-white/60 font-bold">Currency</div>
                  <div className="font-semibold">{currencyCode} ({currencyPrice})</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MANAGE HEADING SECTION */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-playfair tracking-tight">
                Manage
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Select an area below to inspect and manage your business settings and team members.
              </p>
            </div>

            {/* Two Options Toggle Buttons: Business & Team */}
            <div className="flex bg-gray-200/80 p-1.5 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("business")}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "business"
                    ? "bg-white text-brand shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Building2 size={16} />
                <span>Business</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("team")}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "team"
                    ? "bg-white text-brand shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Users size={16} />
                <span>Team</span>
                {teamMembers.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center">
                    {teamMembers.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ================= OPTION 1: BUSINESS ================= */}
          {activeTab === "business" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {/* Card 1: Core Business Information */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand flex items-center justify-center">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Business Profile</h3>
                      <p className="text-xs text-gray-500">Official company and contact information</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/crm/onboarding")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-brand text-xs font-semibold text-gray-700 hover:text-brand transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Business Name
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{businessName}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Contact Person
                    </span>
                    <p className="text-sm font-semibold text-gray-900">
                      {business?.contactName || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Phone Number
                    </span>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Phone size={14} className="text-gray-400" />
                      <span>{business?.mobileNumber || "—"}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Business Email
                    </span>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 truncate">
                      <Mail size={14} className="text-gray-400 shrink-0" />
                      <span className="truncate">{business?.email || "—"}</span>
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Registered Address
                    </span>
                    <p className="text-sm text-gray-700 flex items-start gap-1.5">
                      <MapPin size={15} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>
                        {[business?.addressLine1, business?.addressLine2].filter(Boolean).join(", ") ||
                          "No physical address provided"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Identity & Branding */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900">Brand Identity</h3>
                  <p className="text-xs text-gray-500">Logo and authorized signature</p>
                </div>

                {/* Logo Preview */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Company Logo
                  </span>
                  {business?.logoUrl ? (
                    <div className="w-full h-28 rounded-2xl bg-gray-50 border border-gray-200 p-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={business.logoUrl}
                        alt="Business Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-xs">
                      <span>No logo uploaded</span>
                    </div>
                  )}
                </div>

                {/* Signature Preview */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Authorized Signature
                  </span>
                  {business?.signatureUrl ? (
                    <div className="w-full h-24 rounded-2xl bg-white border border-gray-200 p-2 flex items-center justify-center overflow-hidden shadow-inner">
                      <img
                        src={business.signatureUrl}
                        alt="Authorized Signature"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-xs">
                      <span>No signature added</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= OPTION 2: TEAM ================= */}
          {activeTab === "team" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF9800] flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
                    <p className="text-xs text-gray-500">
                      Manage team access and permissions for {businessName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>Invite Member</span>
                </button>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <th className="pb-3">Member</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teamMembers.map((member, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-4 font-semibold text-gray-900">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-bold text-xs flex items-center justify-center uppercase">
                              {member.name.charAt(0)}
                            </div>
                            <span>{member.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-gray-600 text-xs sm:text-sm">{member.email}</td>
                        <td className="py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            {member.role}
                          </span>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              member.status === "Active"
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                member.status === "Active" ? "bg-green-500" : "bg-amber-500"
                              }`}
                            />
                            <span>{member.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
              <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Colleague Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                >
                  <option value="Manager">Manager (Quotes & Billing)</option>
                  <option value="Staff">Staff (View Only)</option>
                  <option value="Admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
