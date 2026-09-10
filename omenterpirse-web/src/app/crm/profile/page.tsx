"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Lightbulb,
  Edit3,
  Check,
  Loader2,
  X,
  AlertCircle,
  ChevronDown,
  Building2,
  FileText,
} from "lucide-react";
import CategoryModal from "@/components/crm/CategoryModal";
import SignaturePad from "@/components/crm/SignaturePad";
import { INDIAN_STATES } from "@/lib/crmCategoriesData";

export default function CrmManageProfilePage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showTips, setShowTips] = useState(false);

  const [canManageBusiness, setCanManageBusiness] = useState(true);
  const [callerRole, setCallerRole] = useState("Owner");

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressLine3, setAddressLine3] = useState("");
  const [otherInfo, setOtherInfo] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");

  // Tax Details
  const [taxLabel, setTaxLabel] = useState("GSTIN");
  const [taxNumber, setTaxNumber] = useState("");
  const [selectedState, setSelectedState] = useState("");

  // Bank & Payment Details
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankAccountType, setBankAccountType] = useState("CURRENT ACCOUNT");

  // Logo & Signature
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<string | null>("draw");
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Load existing profile
  useEffect(() => {
    fetch("/api/crm/profile")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/crm");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.success) {
          const b = data.business || {};
          const u = data.user || {};

          setCanManageBusiness(Boolean(data.canManageBusiness));
          setCallerRole(data.role || "Owner");

          setBusinessName(b.businessName || "");
          setContactName(b.contactName || u.fullName || "");
          setEmail(b.email || u.email || "");
          setMobileNumber(b.mobileNumber || u.phoneNumber || "");
          setAddressLine1(b.addressLine1 || "");
          setAddressLine2(b.addressLine2 || "");
          setAddressLine3(b.addressLine3 || "");
          setOtherInfo(b.otherInfo || "");
          setBusinessCategory(b.businessCategory || "");
          setTaxLabel(b.taxLabel || "GSTIN");
          setTaxNumber(b.taxNumber || "");
          setSelectedState(b.state || "");
          setBankAccountName(b.bankAccountName || b.businessName || "");
          setBankName(b.bankName || "");
          setBankAccountNo(b.bankAccountNo || "");
          setBankIfsc(b.bankIfsc || "");
          setBankAccountType(b.bankAccountType || "CURRENT ACCOUNT");
          setLogoUrl(b.logoUrl || null);
          setSignatureUrl(b.signatureUrl || null);
          setSignatureType(b.signatureType || "draw");
        }
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setErrorMessage("Failed to load business details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  // Handle Logo Upload
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const res = await fetch("/api/crm/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload logo.");
      }
      setLogoUrl(data.url);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle Form Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!businessName.trim()) {
      setErrorMessage("Business Name is required.");
      return;
    }
    if (!contactName.trim()) {
      setErrorMessage("Contact Name is required.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    const cleanPhone = mobileNumber.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsUpdating(true);

    try {
      const res = await fetch("/api/crm/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          contactName: contactName.trim(),
          mobileNumber: cleanPhone,
          email: email.trim().toLowerCase(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          addressLine3: addressLine3.trim(),
          otherInfo: otherInfo.trim(),
          businessCategory: businessCategory.trim(),
          taxLabel: taxLabel.trim(),
          taxNumber: taxNumber.trim(),
          state: selectedState.trim(),
          logoUrl,
          signatureUrl,
          signatureType,
          bankAccountName: bankAccountName.trim(),
          bankName: bankName.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankIfsc: bankIfsc.trim().toUpperCase(),
          bankAccountType: bankAccountType.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setSuccessMessage("Business information updated successfully! Returning to home...");
      
      // Return back to CRM home / dashboard
      setTimeout(() => {
        router.push("/crm/dashboard");
        router.refresh();
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-[#18181B] animate-spin mb-3" />
        <p className="text-gray-500 font-medium text-sm">Loading business info...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-900 pb-16 flex flex-col items-center">
      {/* Container sizing: looks just like the mobile screenshot while looking clean on desktop */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-xl">
        {/* ================= HEADER BAR (Images 3 & 4) ================= */}
        <header className="bg-[#18181B] text-white px-4 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <button
            type="button"
            onClick={() => router.push("/crm/dashboard")}
            className="p-2 -ml-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Back to CRM Dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-lg font-semibold tracking-wide text-white">
            Update Business Info
          </h1>

          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className={`p-2 -mr-1 rounded-full transition-colors cursor-pointer ${
              showTips ? "text-yellow-400 bg-white/10" : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            title="Business Info Tips"
          >
            <Lightbulb size={20} />
          </button>
        </header>

        {/* Tips Dropdown */}
        {showTips && (
          <div className="bg-[#27272A] text-white px-5 py-3.5 text-xs leading-relaxed border-b border-gray-700 animate-in fade-in duration-150">
            <p className="font-bold text-yellow-400 mb-1 flex items-center gap-1.5">
              <Lightbulb size={14} />
              <span>Business Profile Tips</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Upload your company logo and signature for branded invoices.</li>
              <li>Select your business category or add a custom one if not listed.</li>
              <li>GSTIN and State details are automatically included in tax invoices.</li>
            </ul>
          </div>
        )}

        {/* ================= FORM BODY ================= */}
        <form onSubmit={handleUpdate} className="flex-1 p-5 space-y-5">
          {/* Status Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-2 text-xs text-emerald-800 animate-in fade-in">
              <Check size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {!canManageBusiness && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-900 animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong className="block text-sm font-bold text-amber-950 mb-0.5">Read-Only Business Profile</strong>
                <span>
                  You are viewing the business profile registered by the business owner. As a <strong>{callerRole}</strong>, you cannot edit company information, tax credentials, or branding.
                </span>
              </div>
            </div>
          )}

          {/* ================= TOP CARDS: ADD LOGO & ADD SIGNATURE ================= */}
          <div className="flex items-center justify-center gap-6 pt-2 pb-1">
            {/* ADD LOGO CARD */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => canManageBusiness && fileInputRef.current?.click()}
                disabled={isUploadingLogo || !canManageBusiness}
                className={`w-28 h-28 bg-[#18181B] text-white rounded-2xl flex flex-col items-center justify-center p-2.5 transition-all shadow-md relative overflow-hidden group border border-gray-800 ${
                  canManageBusiness ? "hover:bg-[#27272A] active:scale-95 cursor-pointer" : "cursor-default opacity-90"
                }`}
              >
                {isUploadingLogo ? (
                  <Loader2 size={24} className="animate-spin text-white" />
                ) : logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="text-center leading-tight font-black tracking-wider text-xs">
                    <div>ADD</div>
                    <div>LOGO</div>
                  </div>
                )}
              </button>

              {/* White Edit Pencil Badge */}
              {canManageBusiness && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center text-black hover:bg-gray-100 transition-transform active:scale-90 cursor-pointer"
                  title="Change Logo"
                >
                  <Edit3 size={13} />
                </button>
              )}
            </div>

            {/* ADD SIGNATURE CARD */}
            <div className="relative">
              <button
                type="button"
                onClick={() => canManageBusiness && setIsSignatureModalOpen(true)}
                disabled={!canManageBusiness}
                className={`w-28 h-28 bg-[#18181B] text-white rounded-2xl flex flex-col items-center justify-center p-2.5 transition-all shadow-md relative overflow-hidden group border border-gray-800 ${
                  canManageBusiness ? "hover:bg-[#27272A] active:scale-95 cursor-pointer" : "cursor-default opacity-90"
                }`}
              >
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Signature"
                    className="w-full h-full object-contain rounded-xl bg-white/5"
                  />
                ) : (
                  <div className="text-center leading-tight font-black tracking-wider text-xs">
                    <div>ADD</div>
                    <div>SIGNATURE</div>
                  </div>
                )}
              </button>

              {/* White Edit Pencil Badge */}
              {canManageBusiness && (
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center text-black hover:bg-gray-100 transition-transform active:scale-90 cursor-pointer"
                  title="Change Signature"
                >
                  <Edit3 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* ================= FIELDS (Image 3) ================= */}
          {/* Business Name */}
          <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
            <label className="block text-[11px] text-gray-500 font-medium">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={!canManageBusiness}
              placeholder="e.g. Acme Corp"
              className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          {/* Contact Name */}
          <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
            <label className="block text-[11px] text-gray-500 font-medium">
              Contact Name
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              disabled={!canManageBusiness}
              placeholder="e.g. John Doe"
              className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          {/* Email */}
          <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
            <label className="block text-[11px] text-gray-500 font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!canManageBusiness}
              placeholder="e.g. contact@business.com"
              className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          {/* Phone Number */}
          <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
            <label className="block text-[11px] text-gray-500 font-medium">
              Phone Number
            </label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              disabled={!canManageBusiness}
              placeholder="10-digit mobile number"
              className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          {/* Address Line 1 */}
          <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
            <label className="block text-[11px] text-gray-500 font-medium">
              Address Line 1
            </label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              disabled={!canManageBusiness}
              placeholder="Building, Street, Area"
              className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          {/* Address Line 2 */}
          <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
            <label className="block text-[11px] text-gray-500 font-medium">
              Address Line 2
            </label>
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              disabled={!canManageBusiness}
              placeholder="Landmark, City"
              className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          {/* Address Line 3 */}
          <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
            <label className="block text-[11px] text-gray-500 font-medium">
              Address Line 3
            </label>
            <input
              type="text"
              value={addressLine3}
              onChange={(e) => setAddressLine3(e.target.value)}
              disabled={!canManageBusiness}
              placeholder="Pincode, District"
              className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          {/* Other Info */}
          <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
            <label className="block text-[11px] text-gray-500 font-medium">
              Other Info
            </label>
            <input
              type="text"
              value={otherInfo}
              onChange={(e) => setOtherInfo(e.target.value)}
              disabled={!canManageBusiness}
              placeholder="Website, registration notes, etc."
              className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          {/* Business Category (Clickable to open CategoryModal) */}
          <div
            onClick={() => canManageBusiness && setIsCategoryModalOpen(true)}
            className={`bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent transition-all flex items-center justify-between group ${
              canManageBusiness ? "hover:bg-gray-200/70 cursor-pointer" : "cursor-not-allowed opacity-90"
            }`}
          >
            <div className="flex-1 min-w-0">
              <label className={`block text-[11px] text-gray-500 font-medium ${canManageBusiness ? "cursor-pointer" : "cursor-not-allowed"}`}>
                Business Category
              </label>
              <div className="text-sm font-semibold text-gray-900 pt-0.5 truncate">
                {businessCategory || (
                  <span className="text-gray-400 font-normal">Select Category</span>
                )}
              </div>
            </div>
            {canManageBusiness && (
              <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
            )}
          </div>

          {/* ================= TAX DETAILS SECTION (Image 4) ================= */}
          <div className="pt-2 space-y-4">
            {/* Gray Header Pill */}
            <div className="bg-[#E5E7EB] text-gray-800 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider">
              Tax Details
            </div>

            {/* GSTIN/PAN/VAT/Business Label */}
            <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
              <label className="block text-[11px] text-gray-500 font-medium">
                GSTIN/PAN/VAT/Business Label
              </label>
              <input
                type="text"
                value={taxLabel}
                onChange={(e) => setTaxLabel(e.target.value)}
                disabled={!canManageBusiness}
                placeholder="GSTIN"
                className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
              />
            </div>

            {/* GSTIN/PAN/VAT/Business Number */}
            <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
              <label className="block text-[11px] text-gray-500 font-medium">
                GSTIN/PAN/VAT/Business Number
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                disabled={!canManageBusiness}
                placeholder="e.g. 27AAACG9999A1Z5"
                className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 uppercase disabled:text-gray-700 disabled:cursor-not-allowed"
              />
            </div>

            {/* State */}
            <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
              <label className="block text-[11px] text-gray-500 font-medium">
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                disabled={!canManageBusiness}
                className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 cursor-pointer disabled:text-gray-700 disabled:cursor-not-allowed"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ================= BANK & PAYMENT DETAILS (For Quotations) ================= */}
          <div className="pt-2 space-y-4">
            {/* Gray Header Pill */}
            <div className="bg-[#E5E7EB] text-gray-800 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider">
              Bank & Payment Instructions
            </div>

            {/* Account Name */}
            <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
              <label className="block text-[11px] text-gray-500 font-medium">
                Beneficiary / Account Name
              </label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                disabled={!canManageBusiness}
                placeholder="e.g. OM ENTERPRISES"
                className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
              />
            </div>

            {/* Bank Name */}
            <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
              <label className="block text-[11px] text-gray-500 font-medium">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={!canManageBusiness}
                placeholder="e.g. KOTAK MAHINDRA BANK"
                className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed uppercase"
              />
            </div>

            {/* Account Number */}
            <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
              <label className="block text-[11px] text-gray-500 font-medium">
                Bank Account Number
              </label>
              <input
                type="text"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                disabled={!canManageBusiness}
                placeholder="e.g. 9849845555"
                className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
              />
            </div>

            {/* IFSC Code */}
            <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
              <label className="block text-[11px] text-gray-500 font-medium">
                IFSC Code
              </label>
              <input
                type="text"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value)}
                disabled={!canManageBusiness}
                placeholder="e.g. KKBK0007529"
                className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed uppercase"
              />
            </div>

            {/* Account Type */}
            <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
              <label className="block text-[11px] text-gray-500 font-medium">
                Account Type
              </label>
              <select
                value={bankAccountType}
                onChange={(e) => setBankAccountType(e.target.value)}
                disabled={!canManageBusiness}
                className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 cursor-pointer disabled:text-gray-700 disabled:cursor-not-allowed"
              >
                <option value="CURRENT ACCOUNT">CURRENT ACCOUNT</option>
                <option value="SAVINGS ACCOUNT">SAVINGS ACCOUNT</option>
                <option value="OVERDRAFT ACCOUNT">OVERDRAFT ACCOUNT</option>
              </select>
            </div>
          </div>

          {/* ================= BOTTOM BUTTON: UPDATE ================= */}
          <div className="pt-4 pb-2">
            {canManageBusiness ? (
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-4 bg-[#18181B] hover:bg-black text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Profile</span>
                )}
              </button>
            ) : (
              <div className="text-center p-4 bg-gray-100 rounded-2xl border border-gray-200 text-xs text-gray-600 font-semibold">
                This business profile is managed by the business owner. Team members have view-only access.
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Category Selection Modal (Image 5) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        selectedCategory={businessCategory}
        onSelect={(cat) => setBusinessCategory(cat)}
      />

      {/* Signature Modal */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Authorized Signature</h3>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <SignaturePad
                onSave={(dataUrl: string | null) => {
                  setSignatureUrl(dataUrl);
                  setSignatureType("draw");
                }}
                initialValue={signatureUrl}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSignatureUrl(null);
                    setIsSignatureModalOpen(false);
                  }}
                  className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Remove Signature
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(false)}
                  className="flex-1 py-3 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
