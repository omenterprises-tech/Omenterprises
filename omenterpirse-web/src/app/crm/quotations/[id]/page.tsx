"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Copy,
  Edit3,
  MoreHorizontal,
  Trash2,
  Tag,
  Loader2,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Download,
  Send,
  Check,
} from "lucide-react";

interface QuotationItem {
  id?: string;
  name?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  taxPercent?: number;
  total?: number;
  hsn?: string;
  unit?: string;
}

interface OtherCharge {
  label: string;
  amount: number;
  isTaxable: boolean;
}

export default function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const quotationId = resolvedParams.id;

  const [quotation, setQuotation] = useState<any | null>(null);
  const [business, setBusiness] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // More menu pop-up state
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Duplicate Loading
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Share Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load quotation data
  const loadQuotation = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/crm/quotations/${quotationId}`);
      if (res.status === 401) {
        router.replace("/crm");
        return;
      }
      const data = await res.json();
      if (data.success && data.quotation) {
        setQuotation(data.quotation);
        setBusiness(data.business);
      } else {
        setError(data.error || "Failed to load quotation.");
      }
    } catch (err: any) {
      console.error("Load quotation error:", err);
      setError(err.message || "Failed to load quotation.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuotation();
  }, [quotationId]);

  // Parse items safely
  let items: QuotationItem[] = [];
  if (quotation?.items) {
    try {
      items = typeof quotation.items === "string" ? JSON.parse(quotation.items) : quotation.items;
    } catch (e) {
      items = [];
    }
  }

  // Parse other charges safely
  let otherCharge: OtherCharge | null = null;
  if (quotation?.otherCharges) {
    try {
      otherCharge =
        typeof quotation.otherCharges === "string"
          ? JSON.parse(quotation.otherCharges)
          : quotation.otherCharges;
    } catch (e) {
      otherCharge = null;
    }
  }

  // Parse terms into points
  const termsList: string[] = [];
  if (quotation?.termsConditions) {
    const rawLines = quotation.termsConditions.split("\n");
    for (const line of rawLines) {
      const trimmed = line.trim();
      if (trimmed) {
        const clean = trimmed.replace(/^(\d+[\.\)]\s*|[•\-\*]\s*)/, "").trim();
        if (clean) termsList.push(clean);
      }
    }
  }

  // Handle Status Update
  const handleUpdateStatus = async (newStatus: string) => {
    if (!quotation) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/crm/quotations/${quotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.quotation) {
        setQuotation(data.quotation);
        setIsStatusModalOpen(false);
        setIsMoreOpen(false);
        showToast(`Status updated to "${newStatus}"`);
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Delete Quotation
  const handleDelete = async () => {
    if (!quotation) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete quotation "${quotation.quotationNumber}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/crm/quotations/${quotation.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert("Quotation deleted successfully.");
        router.push("/crm/quotations");
      } else {
        alert(data.error || "Failed to delete quotation.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete quotation.");
    }
  };

  // Handle Duplicate Quotation
  const handleDuplicate = async () => {
    if (!quotation) return;
    setIsDuplicating(true);
    try {
      const payload = {
        customerId: quotation.customerId,
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone,
        customerAddress: quotation.customerAddress,
        customerGstin: quotation.customerGstin,
        quotationDate: new Date().toISOString().split("T")[0],
        validUntil: quotation.validUntil,
        items,
        subtotal: quotation.subtotal,
        taxTotal: quotation.taxTotal,
        grandTotal: quotation.grandTotal,
        otherCharges: otherCharge,
        notes: quotation.notes,
        termsConditions: quotation.termsConditions,
        status: "Draft",
      };

      const res = await fetch("/api/crm/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.quotation) {
        showToast("Quotation duplicated successfully!");
        setTimeout(() => {
          router.push(`/crm/quotations/${data.quotation.id}`);
        }, 400);
      } else {
        alert(data.error || "Failed to duplicate quotation.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to duplicate quotation.");
    } finally {
      setIsDuplicating(false);
    }
  };

  // Handle Edit
  const handleEdit = () => {
    if (!quotation) return;
    router.push(`/crm/quotations/create?edit=${quotation.id}`);
  };

  // Handle Native Share or Share Modal
  const handleShare = async () => {
    if (!quotation) return;
    const shareTitle = `Quotation ${quotation.quotationNumber} from ${business?.businessName || "OM Enterprises"}`;
    const shareText = `Please find attached quotation ${quotation.quotationNumber} for amount ₹${Number(quotation.grandTotal).toLocaleString("en-IN")}.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to modal
      }
    }
    setIsShareModalOpen(true);
  };

  // Trigger Print / PDF
  const handlePrint = () => {
    const prevTitle = document.title;
    if (quotation?.quotationNumber) {
      document.title = `Quotation_${quotation.quotationNumber}`;
    }
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-3" />
        <p className="text-gray-600 font-semibold text-sm">Opening Quotation Document...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">Quotation Not Found</h3>
        <p className="text-xs text-gray-500 max-w-sm mb-5">{error || "Unable to locate this quotation record."}</p>
        <button
          type="button"
          onClick={() => router.push("/crm/quotations")}
          className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow"
        >
          Back to Quotation Ledger
        </button>
      </div>
    );
  }

  // Format currency helper
  const formatRs = (num: any) =>
    `₹${Number(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Default bank details if not present on business
  const bankDetails = {
    name: business?.bankAccountName || business?.businessName || "OM ENTERPRISES",
    bank: business?.bankName || "KOTAK MAHINDRA BANK",
    accountNo: business?.bankAccountNo || business?.mobileNumber || "9849845555",
    ifsc: business?.bankIfsc || "KKBK0007529",
    accountType: business?.bankAccountType || "CURRENT ACCOUNT",
  };

  // Status color styles
  const statusColors: Record<string, string> = {
    Draft: "bg-amber-50 text-amber-800 border-amber-200",
    Sent: "bg-blue-50 text-brand border-blue-200",
    Accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Declined: "bg-rose-50 text-rose-800 border-rose-200",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-gray-900 font-inter pb-16 print:bg-white print:p-0 print:pb-0 print:min-h-0 print:h-auto print:block">
      {/* Global print styles to eliminate browser header/footer and excess blank pages */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0mm !important;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
          }
          header, nav, button, .print\\:hidden {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            min-height: 0 !important;
            display: block !important;
          }
          #quotation-sheet {
            margin: 0 auto !important;
            padding: 8mm 12mm 6mm 12mm !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 210mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          #quotation-sheet > * + * {
            margin-top: 8px !important;
          }
          table, tr, td, th {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3 bg-gray-900 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center space-x-2 animate-in slide-in-from-top duration-200 print:hidden">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= FULL-SCREEN TOP APP BAR (Website Brand Styling) ================= */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Back & Title */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => router.push("/crm/quotations")}
                className="p-2 rounded-xl text-gray-500 hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer mr-1"
                title="Back to Quotation Ledger"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                    {quotation.quotationNumber}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      statusColors[quotation.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {quotation.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {quotation.customerName} • {quotation.quotationDate}
                </p>
              </div>
            </div>

            {/* Right: Desktop Action Toolbar (Website Brand Styling) */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer size={15} />
                <span>Print / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="hidden sm:inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                title="Share Quotation"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="hidden sm:inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                title="Create Duplicate"
              >
                {isDuplicating ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                <span>Duplicate</span>
              </button>

              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                title="Edit Quotation"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>

              {/* Status & Delete More Menu Toggle */}
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isMoreOpen ? "bg-brand text-white border-brand" : "border-gray-200 hover:bg-gray-100 text-gray-700"
                }`}
                title="More Options"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MORE OPTIONS POP-UP (Status & Delete) ================= */}
      {isMoreOpen && (
        <div className="fixed top-20 right-6 sm:right-12 z-50 w-48 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 print:hidden">
          <button
            type="button"
            onClick={() => {
              setIsMoreOpen(false);
              setIsStatusModalOpen(true);
            }}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-blue-50 text-left text-xs font-bold text-gray-800 hover:text-brand flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Tag size={15} />
            <span>Change Status</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMoreOpen(false);
              handleDelete();
            }}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-rose-50 text-left text-xs font-bold text-rose-600 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
            <span>Delete Quotation</span>
          </button>
        </div>
      )}

      {/* ================= FULL-SCREEN MAIN WORKSPACE ================= */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:p-0 print:m-0 print:max-w-none print:w-full print:block">
        {/* ================= A4 WHITE QUOTATION SHEET (Website Theme & Exact Design) ================= */}
        <div
          id="quotation-sheet"
          className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-12 space-y-6 print:shadow-none print:rounded-none print:border-none print:p-0 print:w-full print:space-y-2"
        >
          {/* ================= 1. TOP HEADER (Logo, Business Info, Quotation Heading) ================= */}
          <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-200 pb-6 print:pb-2.5 print:gap-2">
            {/* Left: Business Logo */}
            <div className="col-span-3 sm:col-span-2 flex justify-start">
              {business?.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt="Logo"
                  className="w-20 h-20 sm:w-24 sm:h-24 print:w-16 print:h-16 object-contain rounded-xl border border-gray-100 shadow-xs"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 print:w-16 print:h-16 bg-blue-50 rounded-xl flex items-center justify-center text-brand font-black text-sm border border-blue-100 text-center p-2">
                  {business?.businessName?.slice(0, 4)?.toUpperCase() || "OM"}
                </div>
              )}
            </div>

            {/* Middle: Business Details (Website Brand Deep Blue & Layout) */}
            <div className="col-span-6 sm:col-span-8 text-center space-y-1 print:space-y-0.5">
              <h2 className="text-lg sm:text-2xl print:text-xl font-black text-brand tracking-tight uppercase font-playfair">
                {business?.businessName || "OM ENTERPRISES"}
              </h2>

              {/* Address */}
              <p className="text-xs sm:text-sm print:text-[11px] text-gray-600 leading-snug font-medium max-w-lg mx-auto">
                {[business?.addressLine1, business?.addressLine2, business?.addressLine3, business?.state]
                  .filter(Boolean)
                  .join(", ") ||
                  "# 5-1-26, Mahalaxmi Complex, R.P. Road, Near Citylight Hotel, Secunderabad - 500003, Telangana state."}
              </p>

              {/* Phone & Email */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs sm:text-sm print:text-[11px] text-gray-700 font-medium pt-0.5">
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={13} className="text-brand shrink-0" />
                  <span>{business?.mobileNumber || "+91 9246999660 / 9849845555"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={13} className="text-brand shrink-0" />
                  <span>{business?.email || "om5555enterprises@gmail.com"}</span>
                </span>
              </div>

              {/* GSTIN */}
              {(business?.taxNumber || "36ASLPS7570G1Z5") && (
                <p className="text-xs sm:text-sm print:text-[11px] font-bold text-gray-900 tracking-wide pt-0.5">
                  {business?.taxLabel || "GSTIN"}: <span className="text-brand">{business?.taxNumber || "36ASLPS7570G1Z5"}</span>
                </p>
              )}
            </div>

            {/* Right: Quotation Heading */}
            <div className="col-span-3 sm:col-span-2 text-right">
              <span className="inline-block px-3.5 py-1 print:px-2.5 print:py-0.5 bg-brand text-white text-xs sm:text-sm print:text-xs font-extrabold uppercase tracking-wider rounded-lg">
                QUOTATION
              </span>
            </div>
          </div>

          {/* ================= 2. METADATA: CUSTOMER (LEFT) & QUOTE# / DATE (RIGHT) ================= */}
          <div className="flex justify-between items-start pt-1 print:pt-0 text-xs sm:text-sm print:text-xs gap-4">
            {/* Customer Details */}
            <div className="space-y-1 max-w-[65%]">
              <span className="font-bold text-gray-700 block text-xs uppercase tracking-wider">To,</span>
              <h4 className="font-black text-gray-900 text-sm sm:text-base">{quotation.customerName}</h4>
              {quotation.customerAddress && (
                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">{quotation.customerAddress}</p>
              )}
              {quotation.customerPhone && (
                <p className="text-gray-500 text-xs">Phone: {quotation.customerPhone}</p>
              )}
              {quotation.customerGstin && (
                <p className="text-brand text-xs font-bold">
                  GSTIN: {quotation.customerGstin}
                </p>
              )}
            </div>

            {/* Quotation Number & Date */}
            <div className="text-right space-y-1.5 shrink-0">
              <div>
                <span className="font-bold text-gray-500 uppercase text-[11px] tracking-wider block">Quotation No</span>
                <span className="font-black text-brand text-sm sm:text-base">{quotation.quotationNumber}</span>
              </div>
              <div>
                <span className="font-bold text-gray-500 uppercase text-[11px] tracking-wider block">Date</span>
                <span className="font-semibold text-gray-800 text-xs sm:text-sm">{quotation.quotationDate}</span>
              </div>
              {quotation.validUntil && (
                <div>
                  <span className="font-bold text-gray-500 uppercase text-[11px] tracking-wider block">Valid Until</span>
                  <span className="text-gray-700 text-xs">{quotation.validUntil}</span>
                </div>
              )}
            </div>
          </div>

          {/* ================= 3. INTRODUCTORY GREETING ================= */}
          <div className="pt-2 space-y-1 text-xs sm:text-sm text-gray-800">
            <p className="font-bold">Dear Sir/Mam,</p>
            <p className="text-gray-600 leading-relaxed">
              Thank you for your valuable inquiry. We are pleased to quote our best commercial terms as below:
            </p>
          </div>

          {/* ================= 4. PRODUCTS TABLE ================= */}
          <div className="overflow-x-auto border border-gray-300 rounded-xl py-0.5 print:overflow-visible print:border-gray-400 print:rounded-lg">
            <table className="w-full text-left text-xs sm:text-sm print:text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-gray-800 font-extrabold uppercase tracking-wider text-[11px] print:text-[10px]">
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center w-10">#</th>
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2">DESCRIPTION</th>
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center w-24">HSN</th>
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center w-20">QTY</th>
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-right w-28">PRICE</th>
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-right w-28">GST</th>
                  <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-right w-32">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No products recorded in this quotation.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const qty = Number(it.quantity) || 1;
                    const price = Number(it.unitPrice) || 0;
                    const taxRate = it.taxPercent !== undefined && it.taxPercent !== null ? Number(it.taxPercent) : 0;
                    const baseTotal = qty * price;
                    const gstAmount = (baseTotal * taxRate) / 100;
                    const rowTotal = baseTotal + gstAmount;

                    return (
                      <tr key={idx} className="align-top hover:bg-blue-50/20 transition-colors">
                        <td className="py-3 px-3 print:py-1.5 print:px-2 text-center font-medium text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 print:py-1.5 print:px-2">
                          <span className="font-bold text-gray-900 block leading-snug">
                            {it.name || it.description?.split(" - ")[0] || "Item"}
                          </span>
                          {it.description && (
                            <span className="text-xs print:text-[10px] text-gray-500 block leading-relaxed mt-0.5 font-normal">
                              {it.description}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 print:py-1.5 print:px-2 text-center text-gray-600 font-medium text-xs">
                          {it.hsn || "-"}
                        </td>
                        <td className="py-3 px-3 print:py-1.5 print:px-2 text-center font-bold text-gray-900">
                          <div>{qty}</div>
                          <div className="text-[10px] text-gray-500 font-normal uppercase">
                            {it.unit || "COILS"}
                          </div>
                        </td>
                        <td className="py-3 px-3 print:py-1.5 print:px-2 text-right font-semibold text-gray-900">
                          {formatRs(price)}
                        </td>
                        <td className="py-3 px-3 print:py-1.5 print:px-2 text-right font-medium text-gray-700">
                          <div>{formatRs(gstAmount)}</div>
                          <div className="text-[10px] text-gray-500 font-normal">
                            {taxRate.toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-3 px-3 print:py-1.5 print:px-2 text-right font-black text-gray-900">
                          {formatRs(it.total || rowTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ================= 5. FINANCIAL TOTALS BREAKDOWN ================= */}
          <div className="flex justify-end pt-2 print:pt-1">
            <div className="w-full sm:w-80 print:w-72 space-y-2 print:space-y-1 text-xs sm:text-sm text-gray-800">
              <div className="flex justify-between py-0.5">
                <span className="font-semibold text-gray-600 uppercase text-xs print:text-[11px]">SUB TOTAL</span>
                <span className="font-bold text-gray-900">{formatRs(quotation.subtotal)}</span>
              </div>

              {otherCharge && Number(otherCharge.amount) > 0 && (
                <div className="flex justify-between py-0.5">
                  <span className="font-semibold text-gray-600 uppercase text-xs print:text-[11px]">
                    {otherCharge.label || "OTHER CHARGES"}
                  </span>
                  <span className="font-bold text-gray-900">{formatRs(otherCharge.amount)}</span>
                </div>
              )}

              <div className="flex justify-between py-0.5">
                <span className="font-semibold text-gray-600 uppercase text-xs print:text-[11px]">GST AMOUNT</span>
                <span className="font-bold text-gray-900">{formatRs(quotation.taxTotal)}</span>
              </div>

              {/* Highlighted Grand Total Banner (Brand Colors) */}
              <div className="bg-blue-50/80 border-2 border-brand/20 p-3 print:p-2 rounded-xl flex justify-between items-center font-black text-base print:text-sm text-brand mt-1 shadow-xs">
                <span className="tracking-wide">GRAND TOTAL</span>
                <span className="text-lg print:text-base">{formatRs(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* ================= 6. CLOSING STATEMENT ================= */}
          <div className="pt-2 print:pt-1 text-xs sm:text-sm print:text-xs text-gray-700 font-medium">
            We hope you find our offer to be in line with your requirement.
          </div>

          {/* ================= 7. BOTTOM SECTION: TERMS (LEFT) & PAYMENT + SIGNATURE (RIGHT) ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 items-start border-t border-gray-100 print:grid-cols-2 print:gap-4 print:pt-2">
            {/* Left Column: TERMS & CONDITIONS */}
            <div className="space-y-2 text-xs sm:text-sm print:space-y-1 print:text-xs">
              <h5 className="font-black text-gray-900 uppercase tracking-wider text-xs border-b border-gray-200 pb-1 inline-block">
                TERMS & CONDITIONS:
              </h5>
              {termsList.length === 0 ? (
                <ul className="space-y-1.5 text-gray-600 text-xs print:space-y-0.5 print:text-[11px]">
                  <li>• DELIVERY CHARGES : EXTRA AT ACTUAL</li>
                  <li>• PAYMENT : 100% AGAINST DELIVERY</li>
                  <li>• VALIDITY : 30 DAYS</li>
                  <li>• DELIVERY : READY STOCK</li>
                </ul>
              ) : (
                <ul className="space-y-1.5 text-gray-700 text-xs print:space-y-0.5 print:text-[11px]">
                  {termsList.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-brand shrink-0">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Right Column: PAYMENT INSTRUCTIONS + SIGNATORY */}
            <div className="space-y-4 print:space-y-2 text-xs sm:text-sm sm:text-right print:text-right">
              {/* Payment Instructions Box */}
              <div className="space-y-1 text-xs text-gray-800 sm:text-left sm:ml-auto sm:max-w-xs bg-gray-50/70 p-3.5 print:p-2.5 rounded-xl border border-gray-200 print:text-[11px] print:rounded-lg">
                <h5 className="font-black text-brand uppercase tracking-wider text-xs print:text-[11px] mb-1">
                  PAYMENT INSTRUCTIONS
                </h5>
                <p>
                  <strong className="text-gray-500 uppercase text-[10px] tracking-wider">NAME : </strong>
                  <span className="font-bold text-gray-900">{bankDetails.name}</span>
                </p>
                <p>
                  <strong className="text-gray-500 uppercase text-[10px] tracking-wider">BANK : </strong>
                  <span className="font-bold text-gray-900">{bankDetails.bank}</span>
                </p>
                <p>
                  <strong className="text-gray-500 uppercase text-[10px] tracking-wider">A/C NO : </strong>
                  <span className="font-bold text-gray-900">{bankDetails.accountNo}</span>
                </p>
                <p>
                  <strong className="text-gray-500 uppercase text-[10px] tracking-wider">IFSC CODE : </strong>
                  <span className="font-bold text-gray-900">{bankDetails.ifsc}</span>
                </p>
                <p>
                  <strong className="text-gray-500 uppercase text-[10px] tracking-wider">ACCOUNT TYPE : </strong>
                  <span className="font-bold text-gray-900">{bankDetails.accountType}</span>
                </p>
              </div>

              {/* Authorized Signatory Block */}
              <div className="pt-2 print:pt-0.5 sm:ml-auto sm:max-w-xs space-y-0.5 text-center">
                <p className="font-bold text-xs text-gray-900 print:text-[11px]">
                  For, {business?.businessName?.toUpperCase() || "OM ENTERPRISES"}
                </p>

                {/* Signature Image or Text */}
                <div className="h-14 print:h-10 flex items-center justify-center">
                  {business?.signatureUrl ? (
                    <img
                      src={business.signatureUrl}
                      alt="Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-base font-playfair italic text-gray-700 font-bold">
                      {business?.contactName || "Authorized Signature"}
                    </span>
                  )}
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 border-t border-gray-200 pt-1">
                  AUTHORIZED SIGNATURE
                </p>
              </div>
            </div>
          </div>

          {/* ================= 8. PAGE FOOTER ================= */}
          <div className="pt-4 print:pt-2 border-t border-gray-100 flex justify-end items-center text-xs text-gray-400 print:text-[10px]">
            <span>Page 1 of 1</span>
          </div>
        </div>
      </main>

      {/* ================= MOBILE FLOATING BOTTOM TOOLBAR (Only shown on small screens) ================= */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl py-2 px-3 flex items-center justify-around print:hidden">
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={isDuplicating}
          className="flex flex-col items-center justify-center py-1 px-2 text-gray-700 hover:text-brand transition-colors cursor-pointer"
        >
          {isDuplicating ? <Loader2 size={20} className="animate-spin text-brand" /> : <Copy size={20} />}
          <span className="text-[10px] font-bold mt-0.5">Duplicate</span>
        </button>

        <button
          type="button"
          onClick={handleEdit}
          className="flex flex-col items-center justify-center py-1 px-2 text-gray-700 hover:text-brand transition-colors cursor-pointer"
        >
          <Edit3 size={20} />
          <span className="text-[10px] font-bold mt-0.5">Edit</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="flex flex-col items-center justify-center py-1 px-2 text-brand hover:text-brand-hover transition-colors cursor-pointer font-bold"
        >
          <Printer size={20} />
          <span className="text-[10px] font-bold mt-0.5">Print/PDF</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center justify-center py-1 px-2 text-gray-700 hover:text-brand transition-colors cursor-pointer"
        >
          <Share2 size={20} />
          <span className="text-[10px] font-bold mt-0.5">Share</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className="flex flex-col items-center justify-center py-1 px-2 text-gray-700 hover:text-brand transition-colors cursor-pointer"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-bold mt-0.5">More</span>
        </button>
      </nav>

      {/* ================= STATUS CHANGE MODAL ================= */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="text-sm font-bold text-gray-900">Change Quotation Status</h4>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {["Draft", "Sent", "Accepted", "Declined"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleUpdateStatus(st)}
                  disabled={isUpdatingStatus}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                    quotation.status === st
                      ? "bg-brand text-white border-brand"
                      : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span>{st}</span>
                  {quotation.status === st && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* ================= SHARE OPTIONS MODAL ================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Share2 size={18} className="text-brand" />
                <h4 className="text-base font-bold text-gray-900">Share Quotation</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* WhatsApp Share */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Hello ${quotation.customerName}, please find the quotation ${quotation.quotationNumber} from ${business?.businessName || "OM Enterprises"} for ₹${quotation.grandTotal}: ${typeof window !== "undefined" ? window.location.href : ""}`
                )}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsShareModalOpen(false)}
                className="w-full py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Send size={15} />
                <span>Share via WhatsApp</span>
              </a>

              {/* Print / Save PDF */}
              <button
                type="button"
                onClick={() => {
                  setIsShareModalOpen(false);
                  window.print();
                }}
                className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>Print / Save as PDF</span>
              </button>

              {/* Copy Link */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast("Quotation link copied to clipboard!");
                  setIsShareModalOpen(false);
                }}
                className="w-full py-3 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Copy size={15} />
                <span>Copy Quotation Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
