"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCrmSessionStore } from "@/store/useCrmSessionStore";
import {
  ArrowLeft,
  Lightbulb,
  Edit3,
  Check,
  Loader2,
  X,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Building2,
  FileText,
  Calendar,
  Upload,
  PenTool,
  Phone,
  Trash2,
  Plus,
} from "lucide-react";
import CategoryModal from "@/components/crm/CategoryModal";
import SignaturePad from "@/components/crm/SignaturePad";
import DateFormatModal from "@/components/crm/DateFormatModal";
import CurrencyModal from "@/components/crm/CurrencyModal";
import { INDIAN_STATES } from "@/lib/crmCategoriesData";
import { CURRENCIES, CurrencyOption, formatDateWithPattern } from "@/lib/crmCurrencyData";

export default function CrmManageProfilePage() {
  const router = useRouter();
  const storeUser = useCrmSessionStore((s) => s.user);
  const storeBusiness = useCrmSessionStore((s) => s.business);
  const setSession = useCrmSessionStore((s) => s.setSession);

  const [isLoading, setIsLoading] = useState(!storeBusiness && !storeUser);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showTips, setShowTips] = useState(false);

  const [canManageBusiness, setCanManageBusiness] = useState(
    Boolean(storeUser?.isOwner ?? (storeUser?.role === "Owner"))
  );
  const [callerRole, setCallerRole] = useState(storeUser?.role || "Owner");

  // Form Fields pre-populated from store if available
  const [businessName, setBusinessName] = useState(storeBusiness?.businessName || "");
  const [contactName, setContactName] = useState(
    storeBusiness?.contactName || storeUser?.fullName || ""
  );
  const [email, setEmail] = useState(storeBusiness?.email || storeUser?.email || "");
  const [mobileNumber, setMobileNumber] = useState(
    storeBusiness?.mobileNumber || storeUser?.phoneNumber || ""
  );
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(() => {
    if (storeBusiness?.phoneNumbers) {
      if (Array.isArray(storeBusiness.phoneNumbers)) return storeBusiness.phoneNumbers;
      try {
        const parsed = JSON.parse(storeBusiness.phoneNumbers);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const initial = storeBusiness?.mobileNumber || storeUser?.phoneNumber || "";
    return initial ? [initial] : [];
  });
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [editingPhoneIndex, setEditingPhoneIndex] = useState<number | null>(null);
  const [editingPhoneValue, setEditingPhoneValue] = useState("");
  const [phoneModalError, setPhoneModalError] = useState("");

  const handleAddPhoneNumber = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPhoneNumber.trim();
    if (!trimmed) {
      setPhoneModalError("Please enter a phone number.");
      return;
    }
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      setPhoneModalError("Phone number must have at least 10 digits.");
      return;
    }
    if (phoneNumbers.includes(trimmed)) {
      setPhoneModalError("This phone number is already added.");
      return;
    }
    const updated = [...phoneNumbers, trimmed];
    setPhoneNumbers(updated);
    setMobileNumber(updated[0] || "");
    setNewPhoneNumber("");
    setPhoneModalError("");
  };

  const handleDeletePhoneNumber = (indexToDelete: number) => {
    if (phoneNumbers.length <= 1) {
      setPhoneModalError("At least one contact phone number is required.");
      return;
    }
    const updated = phoneNumbers.filter((_, i) => i !== indexToDelete);
    setPhoneNumbers(updated);
    setMobileNumber(updated[0] || "");
    if (editingPhoneIndex === indexToDelete) {
      setEditingPhoneIndex(null);
    }
    setPhoneModalError("");
  };

  const handleStartEditPhone = (index: number) => {
    setEditingPhoneIndex(index);
    setEditingPhoneValue(phoneNumbers[index] || "");
    setPhoneModalError("");
  };

  const handleSaveEditPhone = (index: number) => {
    const trimmed = editingPhoneValue.trim();
    if (!trimmed) {
      setPhoneModalError("Phone number cannot be empty.");
      return;
    }
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      setPhoneModalError("Phone number must have at least 10 digits.");
      return;
    }
    const existsAtOther = phoneNumbers.findIndex((p, i) => i !== index && p === trimmed);
    if (existsAtOther !== -1) {
      setPhoneModalError("This phone number already exists.");
      return;
    }
    const updated = [...phoneNumbers];
    updated[index] = trimmed;
    setPhoneNumbers(updated);
    setMobileNumber(updated[0] || "");
    setEditingPhoneIndex(null);
    setEditingPhoneValue("");
    setPhoneModalError("");
  };

  const handleSetPrimaryPhone = (index: number) => {
    if (index === 0) return;
    const target = phoneNumbers[index];
    const remaining = phoneNumbers.filter((_, i) => i !== index);
    const updated = [target, ...remaining];
    setPhoneNumbers(updated);
    setMobileNumber(updated[0] || "");
  };
  const [addressLine1, setAddressLine1] = useState(storeBusiness?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(storeBusiness?.addressLine2 || "");
  const [addressLine3, setAddressLine3] = useState(storeBusiness?.addressLine3 || "");
  const [otherInfo, setOtherInfo] = useState(storeBusiness?.otherInfo || "");
  const [businessCategory, setBusinessCategory] = useState(
    storeBusiness?.businessCategory || ""
  );

  // Tax Details
  const [taxLabel, setTaxLabel] = useState(storeBusiness?.taxLabel || "GSTIN");
  const [taxNumber, setTaxNumber] = useState(storeBusiness?.taxNumber || "");
  const [selectedState, setSelectedState] = useState(storeBusiness?.state || "");

  // Bank & Payment Details
  const [bankAccountName, setBankAccountName] = useState(
    storeBusiness?.bankAccountName || storeBusiness?.businessName || ""
  );
  const [bankName, setBankName] = useState(storeBusiness?.bankName || "");
  const [bankAccountNo, setBankAccountNo] = useState(storeBusiness?.bankAccountNo || "");
  const [bankIfsc, setBankIfsc] = useState(storeBusiness?.bankIfsc || "");
  const [bankAccountType, setBankAccountType] = useState(
    storeBusiness?.bankAccountType || "CURRENT ACCOUNT"
  );

  // Logo & Signature
  const [logoUrl, setLogoUrl] = useState<string | null>(storeBusiness?.logoUrl || null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [signatureUrl, setSignatureUrl] = useState<string | null>(
    storeBusiness?.signatureUrl || null
  );
  const [signatureType, setSignatureType] = useState<string | null>(
    storeBusiness?.signatureType || "draw"
  );
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureModalTab, setSignatureModalTab] = useState<"draw" | "upload">("draw");
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);

  // UPI & QR Code
  const [upiId, setUpiId] = useState(storeBusiness?.upiId || "");
  const [upiQrCodeUrl, setUpiQrCodeUrl] = useState<string | null>(
    storeBusiness?.upiQrCodeUrl || null
  );
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Date & Currency
  const defaultCurrency = CURRENCIES.find((c) => c.code === "INR") || CURRENCIES[0];
  const [selectedDateFormat, setSelectedDateFormat] = useState(
    storeBusiness?.dateFormat || "dd/MM/yyyy"
  );
  const [isDateFormatModalOpen, setIsDateFormatModalOpen] = useState(false);

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(() => {
    if (storeBusiness?.currencyCode) {
      const found = CURRENCIES.find((c) => c.code === storeBusiness.currencyCode);
      if (found) return found;
    }
    return defaultCurrency;
  });
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Load existing profile
  useEffect(() => {
    router.prefetch("/crm/dashboard");

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
          if (!data.business) {
            router.replace("/crm/onboarding");
            return;
          }
          const b = data.business || {};
          const u = data.user || {};

          setCanManageBusiness(Boolean(data.canManageBusiness));
          setCallerRole(data.role || "Owner");

          setBusinessName(b.businessName || "");
          setContactName(b.contactName || u.fullName || "");
          setEmail(b.email || u.email || "");
          let loadedPhones: string[] = [];
          if (Array.isArray(b.phoneNumbers) && b.phoneNumbers.length > 0) {
            loadedPhones = b.phoneNumbers;
          } else if (typeof b.phoneNumbers === "string") {
            try {
              const parsed = JSON.parse(b.phoneNumbers);
              if (Array.isArray(parsed)) loadedPhones = parsed;
            } catch (e) {}
          }
          if (loadedPhones.length === 0 && (b.mobileNumber || u.phoneNumber)) {
            loadedPhones = [b.mobileNumber || u.phoneNumber];
          }
          setPhoneNumbers(loadedPhones);
          setMobileNumber(loadedPhones[0] || b.mobileNumber || u.phoneNumber || "");
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
          setUpiId(b.upiId || "");
          setUpiQrCodeUrl(b.upiQrCodeUrl || null);
          setLogoUrl(b.logoUrl || null);
          setSignatureUrl(b.signatureUrl || null);
          setSignatureType(b.signatureType || "draw");
          if (b.dateFormat) {
            setSelectedDateFormat(b.dateFormat);
          }
          if (b.currencyCode) {
            const found = CURRENCIES.find((c) => c.code === b.currencyCode);
            if (found) setSelectedCurrency(found);
          }

          // Keep store synchronized
          if (data.user && data.business) {
            setSession(data.user, data.business);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setErrorMessage("Failed to load business details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router, setSession]);

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
      if (!res.ok || (!data.success && !data.url)) {
        throw new Error(data.error || "Failed to upload logo.");
      }
      setLogoUrl(data.url);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload logo.");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle Signature Image Upload
  const handleSignatureImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSignature(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "signature");

      const res = await fetch("/api/crm/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || (!data.success && !data.url)) {
        throw new Error(data.error || "Failed to upload signature image.");
      }
      setSignatureUrl(data.url);
      setSignatureType("upload");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload signature image.");
    } finally {
      setIsUploadingSignature(false);
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = "";
      }
    }
  };

  // Handle UPI QR Code Upload
  const handleQrCodeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQr(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "qr_code");

      const res = await fetch("/api/crm/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || (!data.success && !data.url)) {
        throw new Error(data.error || "Failed to upload UPI QR code.");
      }
      setUpiQrCodeUrl(data.url);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload UPI QR code.");
    } finally {
      setIsUploadingQr(false);
      if (qrFileInputRef.current) {
        qrFileInputRef.current.value = "";
      }
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
    const cleanPhoneNumbers = phoneNumbers.map((p) => p.trim()).filter(Boolean);
    const cleanPhone = cleanPhoneNumbers[0]
      ? cleanPhoneNumbers[0].replace(/\D/g, "")
      : mobileNumber.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsUpdating(true);

    try {
      let finalSignatureUrl = signatureUrl;
      // If user drew on canvas, upload base64 to Cloudinary so we store a clean CDN URL
      if (signatureUrl && signatureUrl.startsWith("data:image/")) {
        try {
          const upRes = await fetch("/api/crm/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64: signatureUrl }),
          });
          const upData = await upRes.json();
          if (upData.url) {
            finalSignatureUrl = upData.url;
            setSignatureUrl(upData.url);
          }
        } catch (uploadErr) {
          console.error("Failed to upload canvas signature to cloud:", uploadErr);
        }
      }

      const res = await fetch("/api/crm/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          contactName: contactName.trim(),
          mobileNumber: cleanPhone,
          phoneNumbers: cleanPhoneNumbers.length > 0 ? cleanPhoneNumbers : [cleanPhone],
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
          signatureUrl: finalSignatureUrl,
          signatureType,
          bankAccountName: bankAccountName.trim(),
          bankName: bankName.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankIfsc: bankIfsc.trim().toUpperCase(),
          bankAccountType: bankAccountType.trim(),
          upiId: upiId.trim(),
          upiQrCodeUrl,
          dateFormat: selectedDateFormat,
          currencyCode: selectedCurrency.code,
          currencyCountry: selectedCurrency.country,
          currencyPriceFormatted: selectedCurrency.priceFormatted,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile.");
      }

      if (data.business) {
        setSession(data.user || storeUser, data.business);
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

  if (isLoading && !businessName && !contactName) {
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
          <Link
            href="/crm/dashboard"
            prefetch={true}
            className="p-2 -ml-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Back to CRM Dashboard"
          >
            <ArrowLeft size={20} />
          </Link>

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

              {/* Remove Logo Badge */}
              {canManageBusiness && logoUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLogoUrl(null);
                  }}
                  className="absolute -top-2 -left-2 w-7 h-7 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-transform active:scale-90 cursor-pointer"
                  title="Remove Logo"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* ADD SIGNATURE CARD */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (canManageBusiness) {
                    setSignatureModalTab(signatureType === "upload" ? "upload" : "draw");
                    setIsSignatureModalOpen(true);
                  }
                }}
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
                  onClick={() => {
                    setSignatureModalTab(signatureType === "upload" ? "upload" : "draw");
                    setIsSignatureModalOpen(true);
                  }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center text-black hover:bg-gray-100 transition-transform active:scale-90 cursor-pointer"
                  title="Change Signature"
                >
                  <Edit3 size={13} />
                </button>
              )}

              {/* Remove Signature Badge */}
              {canManageBusiness && signatureUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSignatureUrl(null);
                    setSignatureType(null);
                  }}
                  className="absolute -top-2 -left-2 w-7 h-7 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-transform active:scale-90 cursor-pointer"
                  title="Remove Signature"
                >
                  <X size={13} />
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

          {/* Phone Numbers */}
          <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] text-gray-500 font-medium">
                Phone Number{phoneNumbers.length > 1 ? "s" : ""}
              </label>
              {canManageBusiness && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoneModalError("");
                    setNewPhoneNumber("");
                    setEditingPhoneIndex(null);
                    setIsPhoneModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:text-brand-hover bg-white px-2.5 py-1 rounded-xl border border-gray-200 shadow-2xs hover:border-brand/40 transition-all cursor-pointer"
                >
                  <Plus size={12} />
                  <span>+ Add</span>
                </button>
              )}
            </div>
            <div
              onClick={() => {
                if (canManageBusiness) {
                  setPhoneModalError("");
                  setNewPhoneNumber("");
                  setEditingPhoneIndex(null);
                  setIsPhoneModalOpen(true);
                }
              }}
              className={`w-full pt-0.5 flex flex-wrap gap-1.5 items-center min-h-[30px] ${
                canManageBusiness ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            >
              {phoneNumbers.length > 0 ? (
                phoneNumbers.map((num, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-2xs"
                  >
                    <Phone size={11} className="text-brand shrink-0" />
                    <span>{num}</span>
                    {idx === 0 && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand bg-blue-50 px-1.5 py-0.5 rounded-md">
                        Primary
                      </span>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-xs font-medium">Click &apos;+ Add&apos; to add phone numbers</span>
              )}
            </div>
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

          {/* ================= DATE & CURRENCY FORMATS ================= */}
          <div className="pt-2 space-y-4">
            {/* Gray Header Pill */}
            <div className="bg-[#E5E7EB] text-gray-800 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider">
              Date & Currency Formats
            </div>

            {/* Preferred Date Format */}
            <div className="bg-[#F3F4F6] rounded-2xl p-3 border border-transparent transition-all">
              <label className="block text-[11px] text-gray-500 font-medium mb-1.5">
                Preferred Date Format
              </label>
              <button
                type="button"
                onClick={() => canManageBusiness && setIsDateFormatModalOpen(true)}
                disabled={!canManageBusiness}
                className="w-full px-3.5 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-sm disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
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
                {canManageBusiness && (
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </div>

            {/* Preferred Currency */}
            <div className="bg-[#F3F4F6] rounded-2xl p-3 border border-transparent transition-all">
              <label className="block text-[11px] text-gray-500 font-medium mb-1.5">
                Preferred Currency
              </label>
              <button
                type="button"
                onClick={() => canManageBusiness && setIsCurrencyModalOpen(true)}
                disabled={!canManageBusiness}
                className="w-full px-3.5 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-sm disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
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
                {canManageBusiness && (
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
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

            {/* UPI ID (VPA) */}
            <div className="bg-[#F3F4F6] rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all">
              <label className="block text-[11px] text-gray-500 font-medium">
                UPI ID (VPA)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={!canManageBusiness}
                placeholder="e.g. omenterprises@okaxis / 9849845555@paytm"
                className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none pt-0.5 disabled:text-gray-700 disabled:cursor-not-allowed"
              />
            </div>

            {/* UPI QR Code Image Upload */}
            <div className="bg-[#F3F4F6] rounded-2xl p-3.5 border border-transparent transition-all">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] text-gray-500 font-medium">
                  UPI Payment QR Code
                </label>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Optional</span>
              </div>

              <input
                ref={qrFileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                onChange={handleQrCodeSelect}
                className="hidden"
              />

              {upiQrCodeUrl ? (
                <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-24 h-24 rounded-xl bg-gray-50 border border-gray-200 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                      <img
                        src={upiQrCodeUrl}
                        alt="UPI QR Code"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                        <Check size={13} className="text-emerald-600 shrink-0" />
                        <span>QR Code active</span>
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                        Displayed in Quotation Payment Instructions
                      </p>
                    </div>
                  </div>

                  {canManageBusiness && (
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => qrFileInputRef.current?.click()}
                        disabled={isUploadingQr}
                        className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Change QR Code"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiQrCodeUrl(null)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove QR Code"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => canManageBusiness && !isUploadingQr && qrFileInputRef.current?.click()}
                  className={`bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                    canManageBusiness
                      ? "hover:border-gray-500 hover:bg-gray-50/50 cursor-pointer group"
                      : "cursor-default opacity-80"
                  }`}
                >
                  {isUploadingQr ? (
                    <div className="flex items-center space-x-2 text-gray-600 py-1">
                      <Loader2 size={18} className="animate-spin text-[#18181B]" />
                      <span className="text-xs font-semibold">Uploading QR Code...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-gray-200 text-gray-700 flex items-center justify-center mb-1.5 transition-colors">
                        <Upload size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        Upload UPI QR Code Image
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        PNG, JPG, WebP or SVG up to 5MB
                      </span>
                    </>
                  )}
                </div>
              )}
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
        onSelect={(curr) => setSelectedCurrency(curr)}
      />

      {/* Signature Modal */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Authorized Signature</h3>
                <p className="text-[11px] text-gray-500">Sign directly or upload your signature image</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="flex bg-[#F3F4F6] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSignatureModalTab("draw")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  signatureModalTab === "draw"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <PenTool size={13} />
                <span>Draw Signature</span>
              </button>
              <button
                type="button"
                onClick={() => setSignatureModalTab("upload")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  signatureModalTab === "upload"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Upload size={13} />
                <span>Upload Image</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="space-y-4">
              {signatureModalTab === "draw" ? (
                <SignaturePad
                  onSave={(dataUrl: string | null) => {
                    setSignatureUrl(dataUrl);
                    if (dataUrl) {
                      setSignatureType("draw");
                    }
                  }}
                  initialValue={signatureType === "draw" ? signatureUrl : null}
                />
              ) : (
                <div className="flex flex-col space-y-2">
                  <input
                    ref={signatureFileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                    onChange={handleSignatureImageSelect}
                    className="hidden"
                  />

                  {signatureType === "upload" && signatureUrl ? (
                    <div className="relative w-full h-44 bg-gray-50 border-2 border-solid border-gray-200 rounded-2xl overflow-hidden p-3 flex flex-col items-center justify-center shadow-inner">
                      <div className="w-full h-28 flex items-center justify-center bg-white rounded-xl border border-gray-100 p-2">
                        <img
                          src={signatureUrl}
                          alt="Signature Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="w-full flex items-center justify-between mt-2.5 px-1">
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check size={13} />
                          <span>Signature image uploaded</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => signatureFileInputRef.current?.click()}
                            disabled={isUploadingSignature}
                            className="text-xs font-semibold text-gray-700 hover:text-black hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSignatureUrl(null);
                              setSignatureType(null);
                            }}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isUploadingSignature && signatureFileInputRef.current?.click()}
                      className="relative w-full h-44 bg-white border-2 border-dashed border-gray-300 hover:border-gray-500 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer transition-all shadow-inner group"
                    >
                      {isUploadingSignature ? (
                        <div className="flex flex-col items-center space-y-2 text-gray-600">
                          <Loader2 size={26} className="animate-spin text-[#18181B]" />
                          <span className="text-xs font-semibold">Uploading signature to cloud...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-1.5">
                          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors">
                            <Upload size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">
                              Click to browse or drag signature image
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              PNG, JPG, SVG, WebP (Transparent PNG recommended)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSignatureUrl(null);
                    setSignatureType(null);
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

      {/* ================= MODAL: MANAGE PHONE NUMBERS ================= */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-gray-900">Manage Contact Numbers</h4>
                <p className="text-xs text-gray-500">Available contact numbers for your business & quotations</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhoneModalError("");
                  setEditingPhoneIndex(null);
                  setIsPhoneModalOpen(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {phoneModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{phoneModalError}</span>
              </div>
            )}

            {/* Stack of Available Phone Numbers */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Current Phone Numbers ({phoneNumbers.length})
              </label>

              {phoneNumbers.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                  No contact numbers added yet.
                </div>
              ) : (
                phoneNumbers.map((num, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-2 transition-all hover:bg-gray-100/70"
                  >
                    {editingPhoneIndex === idx ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="tel"
                          value={editingPhoneValue}
                          onChange={(e) => setEditingPhoneValue(e.target.value)}
                          placeholder="10-digit number"
                          className="flex-1 bg-white px-3 py-1.5 rounded-xl border border-brand text-xs font-bold text-gray-900 focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEditPhone(idx);
                            if (e.key === "Escape") setEditingPhoneIndex(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditPhone(idx)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPhoneIndex(null)}
                          className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs cursor-pointer"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-brand shrink-0">
                            <Phone size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-gray-900 font-mono tracking-tight">
                                {num}
                              </span>
                              {idx === 0 && (
                                <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block truncate">
                              {idx === 0 ? "Default header contact" : "Alternate contact"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryPhone(idx)}
                              className="text-[10px] font-bold text-brand hover:text-brand-hover px-2 py-1 rounded-lg hover:bg-blue-50 cursor-pointer"
                              title="Set as Primary"
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEditPhone(idx)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Edit Number"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoneNumber(idx)}
                            disabled={phoneNumbers.length <= 1}
                            className={`p-1.5 rounded-lg transition-colors ${
                              phoneNumbers.length <= 1
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                            }`}
                            title={phoneNumbers.length <= 1 ? "Cannot delete the only phone number" : "Delete Number"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add New Phone Number Section */}
            <form onSubmit={handleAddPhoneNumber} className="pt-2 border-t border-gray-100 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
                Add Another Contact Number
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={newPhoneNumber}
                  onChange={(e) => {
                    setNewPhoneNumber(e.target.value);
                    if (phoneModalError) setPhoneModalError("");
                  }}
                  placeholder="Enter 10-digit phone number"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-sm cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>+ Add</span>
                </button>
              </div>
            </form>

            {/* Done Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setPhoneModalError("");
                  setEditingPhoneIndex(null);
                  setIsPhoneModalOpen(false);
                }}
                className="w-full py-3 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
