"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  Upload,
  Image as ImageIcon,
  PenTool,
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
} from "lucide-react";
import SignaturePad from "@/components/crm/SignaturePad";
import DateFormatModal from "@/components/crm/DateFormatModal";
import CurrencyModal from "@/components/crm/CurrencyModal";
import { formatDateWithPattern, CurrencyOption, CURRENCIES } from "@/lib/crmCurrencyData";

export default function CrmOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Step 1: Tell us about your business
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");

  // Step 1 inline validation errors
  const [errors, setErrors] = useState<{
    businessName?: string;
    contactName?: string;
    mobileNumber?: string;
    email?: string;
  }>({});

  // Step 2: Business identity
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);

  const [signatureMode, setSignatureMode] = useState<"draw" | "upload">("draw");
  const [drawnSignatureData, setDrawnSignatureData] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(null);

  // Step 3: Date & Currency
  const [selectedDateFormat, setSelectedDateFormat] = useState("dd/MM/yyyy");
  const [isDateFormatModalOpen, setIsDateFormatModalOpen] = useState(false);

  const defaultCurrency = CURRENCIES.find((c) => c.code === "INR") || CURRENCIES[0];
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(defaultCurrency);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Fetch initial user details from session
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/crm/auth/session");
        const data = await res.json();
        if (!data.authenticated) {
          router.replace("/crm");
          return;
        }

        if (data.isOnboardingCompleted) {
          router.replace("/crm/dashboard");
          return;
        }

        // Pre-fill fields from registration
        if (data.user) {
          setContactName(data.user.fullName || "");
          setEmail(data.user.email || "");
          setMobileNumber(data.user.phoneNumber || "");
        }

        if (data.business) {
          setBusinessName(data.business.businessName || "");
          setContactName(data.business.contactName || data.user.fullName || "");
          setMobileNumber(data.business.mobileNumber || data.user.phoneNumber || "");
          setEmail(data.business.email || data.user.email || "");
          setAddressLine1(data.business.addressLine1 || "");
          setAddressLine2(data.business.addressLine2 || "");
          if (data.business.logoUrl) {
            setUploadedLogoUrl(data.business.logoUrl);
            setLogoPreview(data.business.logoUrl);
          }
          if (data.business.signatureUrl) {
            setUploadedSignatureUrl(data.business.signatureUrl);
            setSignaturePreview(data.business.signatureUrl);
          }
          if (data.business.dateFormat) {
            setSelectedDateFormat(data.business.dateFormat);
          }
          if (data.business.currencyCode) {
            const found = CURRENCIES.find((c) => c.code === data.business.currencyCode);
            if (found) setSelectedCurrency(found);
          }
        }
      } catch (err) {
        console.error("Failed to load user for onboarding:", err);
      } finally {
        setIsLoadingUser(false);
      }
    }
    loadUser();
  }, [router]);

  // Step 1 Validation & Next
  const handleStep1Next = () => {
    const newErrors: typeof errors = {};

    if (!businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    if (!contactName.trim()) {
      newErrors.contactName = "Contact name is required";
    }
    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 2 Logo file change
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));

    // Upload to Cloudinary immediately
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/crm/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setUploadedLogoUrl(data.url);
      }
    } catch (err) {
      console.error("Logo upload error:", err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Step 2 Signature file change
  const handleSignatureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));

    setIsUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/crm/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setUploadedSignatureUrl(data.url);
      }
    } catch (err) {
      console.error("Signature upload error:", err);
    } finally {
      setIsUploadingSignature(false);
    }
  };

  // Step 2 Next
  const handleStep2Next = async () => {
    // If user drew signature on canvas and hasn't uploaded it yet, upload base64 now
    if (signatureMode === "draw" && drawnSignatureData && !uploadedSignatureUrl) {
      setIsUploadingSignature(true);
      try {
        const res = await fetch("/api/crm/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: drawnSignatureData }),
        });
        const data = await res.json();
        if (data.url) {
          setUploadedSignatureUrl(data.url);
        }
      } catch (err) {
        console.error("Canvas signature upload error:", err);
      } finally {
        setIsUploadingSignature(false);
      }
    }

    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 3 Finish
  const handleFinish = async () => {
    setSubmitError("");
    setIsSubmitting(true);

    try {
      let finalSignatureUrl = uploadedSignatureUrl;

      // In case canvas signature upload is pending
      if (signatureMode === "draw" && drawnSignatureData && !finalSignatureUrl) {
        const upRes = await fetch("/api/crm/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: drawnSignatureData }),
        });
        const upData = await upRes.json();
        if (upData.url) {
          finalSignatureUrl = upData.url;
        }
      }

      const payload = {
        businessName,
        contactName,
        mobileNumber,
        email,
        addressLine1,
        addressLine2,
        logoUrl: uploadedLogoUrl,
        signatureUrl: finalSignatureUrl,
        signatureType: signatureMode,
        dateFormat: selectedDateFormat,
        currencyCode: selectedCurrency.code,
        currencyCountry: selectedCurrency.country,
        currencyPriceFormatted: selectedCurrency.priceFormatted,
      };

      const res = await fetch("/api/crm/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error || "Failed to complete onboarding.");
        setIsSubmitting(false);
        return;
      }

      // Navigate to CRM dashboard
      router.push("/crm/dashboard");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to complete setup.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading business setup...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      {/* Top Container */}
      <div className="w-full max-w-2xl">
        {/* Step Indicator Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-brand bg-brand/10 px-3.5 py-1 rounded-full">
            Business Setup
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 font-playfair">
            {currentStep === 1 && "Tell us about your business"}
            {currentStep === 2 && "Add your business identity"}
            {currentStep === 3 && "Date & Currency"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentStep === 1 && "Fill in your core business and primary contact details."}
            {currentStep === 2 && "Personalize invoices and documents with your logo and signature."}
            {currentStep === 3 && "Set your preferred date format and currency for your business documents."}
          </p>
        </div>

        {/* 3-Step Timeline Header */}
        <div className="mb-10 px-4">
          <div className="flex items-center justify-between relative">
            {/* Connecting lines */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand transition-all duration-500 z-0"
              style={{
                width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
              }}
            />

            {/* Step 1 Circle */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md ${
                  currentStep > 1
                    ? "bg-brand text-white ring-4 ring-brand/20"
                    : currentStep === 1
                    ? "bg-brand text-white ring-4 ring-brand/30 scale-110"
                    : "bg-white border-2 border-gray-300 text-gray-400"
                }`}
              >
                {currentStep > 1 ? <Check size={18} strokeWidth={2.5} /> : "1"}
              </div>
              <span className="mt-2 text-xs font-semibold text-gray-700 hidden sm:block">
                Business Info
              </span>
            </div>

            {/* Step 2 Circle */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md ${
                  currentStep > 2
                    ? "bg-brand text-white ring-4 ring-brand/20"
                    : currentStep === 2
                    ? "bg-brand text-white ring-4 ring-brand/30 scale-110"
                    : "bg-white border-2 border-gray-300 text-gray-400"
                }`}
              >
                {currentStep > 2 ? <Check size={18} strokeWidth={2.5} /> : "2"}
              </div>
              <span className="mt-2 text-xs font-semibold text-gray-700 hidden sm:block">
                Identity
              </span>
            </div>

            {/* Step 3 Circle */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md ${
                  currentStep === 3
                    ? "bg-brand text-white ring-4 ring-brand/30 scale-110"
                    : "bg-white border-2 border-gray-300 text-gray-400"
                }`}
              >
                3
              </div>
              <span className="mt-2 text-xs font-semibold text-gray-700 hidden sm:block">
                Date & Currency
              </span>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10 transition-all duration-300">
          {submitError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-3 text-rose-600 text-sm font-semibold animate-in fade-in">
              <AlertCircle size={18} className="shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* ================= STEP 1: Tell us about your business ================= */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Business Name (Mandatory) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (errors.businessName) setErrors({ ...errors, businessName: undefined });
                  }}
                  placeholder="e.g. Apex Electrical Supplies Pvt Ltd"
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.businessName
                      ? "border-rose-300 bg-rose-50/20 focus:ring-rose-200"
                      : "border-gray-200 focus:border-brand focus:ring-brand/20"
                  }`}
                />
                {errors.businessName && (
                  <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{errors.businessName}</span>
                  </p>
                )}
              </div>

              {/* Contact Name (Mandatory) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Contact Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => {
                    setContactName(e.target.value);
                    if (errors.contactName) setErrors({ ...errors, contactName: undefined });
                  }}
                  placeholder="Primary contact person"
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.contactName
                      ? "border-rose-300 bg-rose-50/20 focus:ring-rose-200"
                      : "border-gray-200 focus:border-brand focus:ring-brand/20"
                  }`}
                />
                {errors.contactName && (
                  <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{errors.contactName}</span>
                  </p>
                )}
              </div>

              {/* Mobile Number & Email (Both Mandatory) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value.replace(/\D/g, ""));
                      if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: undefined });
                    }}
                    placeholder="10-digit number"
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.mobileNumber
                        ? "border-rose-300 bg-rose-50/20 focus:ring-rose-200"
                        : "border-gray-200 focus:border-brand focus:ring-brand/20"
                    }`}
                  />
                  {errors.mobileNumber && (
                    <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                      <AlertCircle size={13} />
                      <span>{errors.mobileNumber}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="name@company.com"
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-rose-300 bg-rose-50/20 focus:ring-rose-200"
                        : "border-gray-200 focus:border-brand focus:ring-brand/20"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                      <AlertCircle size={13} />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Address Line 1 (Not mandatory) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Address Line 1 <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street address, shop/suite number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-brand focus:ring-brand/20"
                />
              </div>

              {/* Address Line 2 (Not mandatory) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Address Line 2 <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="City, State, Pincode"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-brand focus:ring-brand/20"
                />
              </div>

              {/* Next Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="w-full py-4 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: Add your business identity ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Business Logo Upload */}
              <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Business Logo
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Upload your company logo to appear on business invoices and quotations.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase">Optional</span>
                </div>

                {logoPreview ? (
                  <div className="mt-3 flex items-center space-x-4 p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {logoFile?.name || "Uploaded Logo"}
                      </p>
                      <p className="text-[11px] text-green-600 font-medium flex items-center gap-1 mt-0.5">
                        {isUploadingLogo ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-brand" />
                            <span>Uploading to cloud...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Logo uploaded</span>
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                        setUploadedLogoUrl(null);
                      }}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="mt-3 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-brand rounded-2xl py-6 px-4 cursor-pointer bg-white transition-all group">
                    <div className="w-12 h-12 rounded-full bg-brand/5 group-hover:bg-brand/10 flex items-center justify-center text-brand mb-2 transition-colors">
                      <Upload size={20} />
                    </div>
                    <span className="text-xs font-bold text-brand uppercase tracking-wider">
                      Upload Logo from Device
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, SVG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Signature Section */}
              <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Authorized Signature
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sign on the interactive pad or upload an image of your signature.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase">Optional</span>
                </div>

                {/* Signature Mode Switcher */}
                <div className="flex bg-gray-200/70 p-1 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setSignatureMode("draw")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                      signatureMode === "draw"
                        ? "bg-white text-brand shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <PenTool size={13} />
                    <span>Draw on Signature Pad</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode("upload")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                      signatureMode === "upload"
                        ? "bg-white text-brand shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Upload size={13} />
                    <span>Upload from Local</span>
                  </button>
                </div>

                {/* Draw Signature Pad */}
                {signatureMode === "draw" && (
                  <SignaturePad
                    onSave={(dataUrl) => {
                      setDrawnSignatureData(dataUrl);
                      if (!dataUrl) setUploadedSignatureUrl(null);
                    }}
                    initialValue={drawnSignatureData}
                  />
                )}

                {/* Upload Signature File */}
                {signatureMode === "upload" && (
                  <div>
                    {signaturePreview ? (
                      <div className="flex items-center space-x-4 p-3 bg-white border border-gray-200 rounded-xl">
                        <div className="w-20 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                          <img
                            src={signaturePreview}
                            alt="Signature preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {signatureFile?.name || "Uploaded Signature"}
                          </p>
                          <p className="text-[11px] text-green-600 font-medium flex items-center gap-1 mt-0.5">
                            {isUploadingSignature ? (
                              <>
                                <Loader2 size={12} className="animate-spin text-brand" />
                                <span>Uploading signature...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} />
                                <span>Signature captured</span>
                              </>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSignatureFile(null);
                            setSignaturePreview(null);
                            setUploadedSignatureUrl(null);
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-brand rounded-2xl py-6 px-4 cursor-pointer bg-white transition-all group">
                        <div className="w-12 h-12 rounded-full bg-brand/5 group-hover:bg-brand/10 flex items-center justify-center text-brand mb-2 transition-colors">
                          <ImageIcon size={20} />
                        </div>
                        <span className="text-xs font-bold text-brand uppercase tracking-wider">
                          Choose Signature File
                        </span>
                        <span className="text-[11px] text-gray-400 mt-0.5">PNG or JPG</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Buttons: Back & Next */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex-1 py-4 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleStep2Next}
                  className="flex-[2] py-4 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: Date & Currency ================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Date Format Option */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Preferred Date Format
                </label>
                <button
                  type="button"
                  onClick={() => setIsDateFormatModalOpen(true)}
                  className="w-full px-4 py-3.5 bg-gray-50/70 hover:bg-gray-100/80 border border-gray-200 rounded-2xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {selectedDateFormat}
                      </div>
                      <div className="text-xs text-gray-500">
                        Example: {formatDateWithPattern(selectedDateFormat)}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Currency Option */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Preferred Currency
                </label>
                <button
                  type="button"
                  onClick={() => setIsCurrencyModalOpen(true)}
                  className="w-full px-4 py-3.5 bg-gray-50/70 hover:bg-gray-100/80 border border-gray-200 rounded-2xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
                      {selectedCurrency.symbol}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {selectedCurrency.country} ({selectedCurrency.code})
                      </div>
                      <div className="text-xs text-gray-500">
                        Formatted: {selectedCurrency.priceFormatted}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Summary note */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start space-x-3 text-xs text-blue-800">
                <CheckCircle2 size={18} className="shrink-0 text-brand mt-0.5" />
                <span>
                  You can update your business information, date formats, and currencies at any time from your CRM dashboard.
                </span>
              </div>

              {/* Navigation Buttons: Back & Finish */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setCurrentStep(2);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex-1 py-4 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinish}
                  className="flex-[2] py-4 bg-[#FF9800] hover:bg-[#F57C00] text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Completing Setup...</span>
                    </>
                  ) : (
                    <>
                      <span>Finish</span>
                      <Check size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Format Modal */}
      <DateFormatModal
        isOpen={isDateFormatModalOpen}
        onClose={() => setIsDateFormatModalOpen(false)}
        selectedFormat={selectedDateFormat}
        onSelect={(fmt) => setSelectedDateFormat(fmt)}
      />

      {/* Currency Modal */}
      <CurrencyModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        selectedCode={selectedCurrency.code}
        onSelect={(cur) => setSelectedCurrency(cur)}
      />
    </div>
  );
}
