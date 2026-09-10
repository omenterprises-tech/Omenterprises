"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Copy,
  Edit3,
  FileSpreadsheet,
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
  ExternalLink,
  Send,
  Clock,
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

  // More menu pop-up state (Image 5)
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Duplicate Loading
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

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
        // Strip duplicate numbering if present
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
        }, 500);
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
        // Fallback to modal if cancelled or unsupported
      }
    }
    setIsShareModalOpen(true);
  };

  // Trigger Print / PDF
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#18181B] text-white">
        <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
        <p className="text-white/80 font-medium text-sm">Opening Quotation Detail...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F5F7] p-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">Quotation Not Found</h3>
        <p className="text-xs text-gray-500 max-w-sm mb-5">{error || "Unable to locate this quotation record."}</p>
        <button
          type="button"
          onClick={() => router.push("/crm/quotations")}
          className="px-6 py-2.5 bg-[#18181B] text-white rounded-xl text-xs font-bold shadow hover:bg-black"
        >
          Back to Quotations
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
    Draft: "bg-gray-100 text-gray-800 border-gray-300",
    Sent: "bg-blue-50 text-blue-800 border-blue-200",
    Accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Declined: "bg-rose-50 text-rose-800 border-rose-200",
  };

  return (
    <div className="min-h-screen bg-[#DDE1E6] flex flex-col items-center text-gray-900 font-inter pb-24 print:bg-white print:p-0 print:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 z-50 px-5 py-3 bg-[#18181B] text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center space-x-2 animate-in slide-in-from-top duration-200 print:hidden">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= TOP SCREEN HEADER BAR (Images 1 & 5) ================= */}
      <header className="w-full bg-[#18181B] text-white px-4 py-3.5 sticky top-0 z-30 shadow-md flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.push("/crm/quotations")}
            className="p-2 -ml-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Back to Quotation List"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight">Quotation Detail</h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
              statusColors[quotation.status] || "bg-white/10 text-white"
            }`}
          >
            {quotation.status}
          </span>

          {/* Share icon on top right (Image 1) */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Share Quotation"
          >
            <Share2 size={19} />
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTAINER / DOCUMENT SHEET ================= */}
      <main className="w-full max-w-2xl px-2 sm:px-4 py-4 sm:py-6 print:p-0 print:max-w-none">
        {/* ================= A4 WHITE QUOTATION SHEET (Images 1, 2, 3, 4) ================= */}
        <div
          id="quotation-print-area"
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 space-y-5 print:shadow-none print:rounded-none print:p-8 print:w-full print:border-none"
        >
          {/* ================= TOP HEADER (Image 1 & 2) ================= */}
          <div className="grid grid-cols-12 gap-2 items-start border-b border-gray-100 pb-4">
            {/* Left: Business Logo */}
            <div className="col-span-3 sm:col-span-2 flex justify-start">
              {business?.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt="Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl border border-gray-100 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-200 text-center p-1">
                  {business?.businessName?.slice(0, 2)?.toUpperCase() || "OM"}
                </div>
              )}
            </div>

            {/* Middle: Business Details (Image 2) */}
            <div className="col-span-6 sm:col-span-8 text-center space-y-1">
              <h2 className="text-base sm:text-lg font-black text-[#0B2545] tracking-tight uppercase">
                {business?.businessName || "OM ENTERPRISES"}
              </h2>

              {/* Address */}
              <p className="text-[10px] sm:text-[11px] text-gray-600 leading-snug font-medium max-w-md mx-auto">
                {[business?.addressLine1, business?.addressLine2, business?.addressLine3, business?.state]
                  .filter(Boolean)
                  .join(", ") ||
                  "# 5-1-26, Mahalaxmi Complex, R.P. Road, Near Citylight Hotel, Secunderabad - 500003, Telangana state."}
              </p>

              {/* Phone & Email (Image 2) */}
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[10px] sm:text-[11px] text-gray-700 font-medium">
                <span className="inline-flex items-center gap-1">
                  <Phone size={11} className="text-gray-500" />
                  <span>{business?.mobileNumber || "+91 9246999660 / 9849845555"}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Mail size={11} className="text-gray-500" />
                  <span>{business?.email || "om5555enterprises@gmail.com"}</span>
                </span>
              </div>

              {/* GSTIN (Image 2) */}
              {(business?.taxNumber || "36ASLPS7570G1Z5") && (
                <p className="text-[10px] sm:text-[11px] font-bold text-gray-900 tracking-wide">
                  {business?.taxLabel || "GSTIN"}: {business?.taxNumber || "36ASLPS7570G1Z5"}
                </p>
              )}
            </div>

            {/* Right: Quotation Title (Image 1) */}
            <div className="col-span-3 sm:col-span-2 text-right">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0B2545] tracking-tight">
                Quotation
              </h3>
            </div>
          </div>

          {/* ================= METADATA ROW: CUSTOMER (LEFT) & QUOTATION# / DATE (RIGHT) (Image 1) ================= */}
          <div className="flex justify-between items-start pt-1 text-xs sm:text-sm">
            {/* Customer Details (Left) */}
            <div className="space-y-0.5 max-w-[60%]">
              <span className="font-bold text-gray-900 block text-xs">To,</span>
              <h4 className="font-black text-gray-900 text-sm">{quotation.customerName}</h4>
              {quotation.customerAddress && (
                <p className="text-gray-600 text-xs leading-relaxed">{quotation.customerAddress}</p>
              )}
              {quotation.customerPhone && (
                <p className="text-gray-500 text-[11px]">{quotation.customerPhone}</p>
              )}
              {quotation.customerGstin && (
                <p className="text-gray-700 text-[11px] font-semibold">
                  GSTIN: {quotation.customerGstin}
                </p>
              )}
            </div>

            {/* Quotation No & Date (Right) */}
            <div className="text-right space-y-1">
              <div className="text-xs">
                <span className="font-bold text-gray-700">Quotation# </span>
                <span className="font-bold text-gray-900 ml-1">{quotation.quotationNumber}</span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-gray-700">Date: </span>
                <span className="text-gray-900 ml-1 font-medium">{quotation.quotationDate}</span>
              </div>
              {quotation.validUntil && (
                <div className="text-[11px] text-gray-500">
                  <span>Valid Until: </span>
                  <span className="font-medium">{quotation.validUntil}</span>
                </div>
              )}
            </div>
          </div>

          {/* ================= INTRODUCTORY GREETING (Image 1 & 3) ================= */}
          <div className="pt-2 space-y-1 text-xs text-gray-800">
            <p className="font-semibold">Dear Sir/Mam,</p>
            <p className="text-gray-600">
              Thank you for your valuable inquiry. We are pleased to quote as below:
            </p>
          </div>

          {/* ================= PRODUCTS TABLE (Image 3) ================= */}
          <div className="overflow-x-auto border-t border-b border-gray-300 py-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-gray-800 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-2 px-2 text-center w-8">#</th>
                  <th className="py-2 px-2">DESCRIPTION</th>
                  <th className="py-2 px-2 text-center w-20">HSN</th>
                  <th className="py-2 px-2 text-center w-16">QTY</th>
                  <th className="py-2 px-2 text-right w-24">PRICE</th>
                  <th className="py-2 px-2 text-right w-24">GST</th>
                  <th className="py-2 px-2 text-right w-24">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-400">
                      No items recorded in this quotation.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const qty = Number(it.quantity) || 1;
                    const price = Number(it.unitPrice) || 0;
                    const taxRate = Number(it.taxPercent) || 18;
                    const baseTotal = qty * price;
                    const gstAmount = (baseTotal * taxRate) / 100;
                    const rowTotal = baseTotal + gstAmount;

                    return (
                      <tr key={idx} className="align-top">
                        <td className="py-2.5 px-2 text-center font-medium text-gray-700">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="font-bold text-gray-900 block leading-snug">
                            {it.name || it.description?.split(" - ")[0] || "Item"}
                          </span>
                          {it.description && (
                            <span className="text-[10px] text-gray-500 block leading-tight mt-0.5 font-normal">
                              {it.description}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-600 font-medium text-[11px]">
                          {it.hsn || "85446020"}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-gray-900">
                          <div>{qty}</div>
                          <div className="text-[9px] text-gray-500 font-normal uppercase">
                            {it.unit || "COILS"}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold text-gray-900">
                          {formatRs(price)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium text-gray-700">
                          <div>{formatRs(gstAmount)}</div>
                          <div className="text-[9px] text-gray-500 font-normal">
                            {taxRate.toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-black text-gray-900">
                          {formatRs(it.total || rowTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ================= FINANCIAL TOTALS (Image 3) ================= */}
          <div className="flex justify-end pt-1">
            <div className="w-full sm:w-72 space-y-1.5 text-xs text-gray-800">
              <div className="flex justify-between py-0.5">
                <span className="font-semibold text-gray-600 uppercase text-[11px]">SUB TOTAL</span>
                <span className="font-bold text-gray-900">{formatRs(quotation.subtotal)}</span>
              </div>

              {/* Other Charges if present */}
              {otherCharge && Number(otherCharge.amount) > 0 && (
                <div className="flex justify-between py-0.5">
                  <span className="font-semibold text-gray-600 uppercase text-[11px]">
                    {otherCharge.label || "OTHER CHARGES"}
                  </span>
                  <span className="font-bold text-gray-900">{formatRs(otherCharge.amount)}</span>
                </div>
              )}

              <div className="flex justify-between py-0.5">
                <span className="font-semibold text-gray-600 uppercase text-[11px]">GST</span>
                <span className="font-bold text-gray-900">{formatRs(quotation.taxTotal)}</span>
              </div>

              {/* Grand Total Bar (Image 3) */}
              <div className="bg-[#E2E8F0] p-2.5 rounded-lg flex justify-between items-center font-black text-sm text-[#0B2545] mt-1 border border-gray-300">
                <span className="tracking-wide">GRAND TOTAL</span>
                <span className="text-base">{formatRs(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* ================= CLOSING SENTENCE (Image 4) ================= */}
          <div className="pt-2 text-xs text-gray-700 font-medium">
            We hope you find our offer to be in line with your requirement.
          </div>

          {/* ================= BOTTOM SECTION: TERMS (LEFT) & PAYMENT INSTRUCTIONS + SIGNATURE (RIGHT) (Image 4) ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 items-start">
            {/* Left: TERMS & CONDITIONS */}
            <div className="space-y-1.5 text-xs">
              <h5 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px]">
                TERMS & CONDITIONS:
              </h5>
              {termsList.length === 0 ? (
                <ul className="space-y-1 text-gray-600 text-xs">
                  <li>• DELIVERY CHARGES : EXTRA AT ACTUAL</li>
                  <li>• PAYMENT : 100% AGAINST DELIVERY</li>
                  <li>• VALIDITY : 30 DAYS</li>
                  <li>• DELIVERY : READY STOCK</li>
                </ul>
              ) : (
                <ul className="space-y-1 text-gray-700 text-xs">
                  {termsList.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold shrink-0">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Right: PAYMENT INSTRUCTIONS + SIGNATURE */}
            <div className="space-y-4 text-xs sm:text-right">
              {/* Payment Instructions box (Image 4) */}
              <div className="space-y-0.5 text-xs text-gray-800 sm:text-left sm:ml-auto sm:max-w-xs">
                <h5 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] mb-1">
                  PAYMENT INSTRUCTIONS
                </h5>
                <p>
                  <strong className="text-gray-600 uppercase text-[10px] tracking-wider">NAME : </strong>
                  <span className="font-semibold text-gray-900">{bankDetails.name}</span>
                </p>
                <p>
                  <strong className="text-gray-600 uppercase text-[10px] tracking-wider">BANK : </strong>
                  <span className="font-semibold text-gray-900">{bankDetails.bank}</span>
                </p>
                <p>
                  <strong className="text-gray-600 uppercase text-[10px] tracking-wider">A/C NO : </strong>
                  <span className="font-semibold text-gray-900">{bankDetails.accountNo}</span>
                </p>
                <p>
                  <strong className="text-gray-600 uppercase text-[10px] tracking-wider">IFSC CODE : </strong>
                  <span className="font-semibold text-gray-900">{bankDetails.ifsc}</span>
                </p>
                <p>
                  <strong className="text-gray-600 uppercase text-[10px] tracking-wider">ACCOUNT TYPE : </strong>
                  <span className="font-semibold text-gray-900">{bankDetails.accountType}</span>
                </p>
              </div>

              {/* Authorized Signatory (Image 4) */}
              <div className="pt-2 sm:ml-auto sm:max-w-xs space-y-1 sm:text-center">
                <p className="font-bold text-xs text-gray-900">
                  For, {business?.businessName?.toUpperCase() || "OM ENTERPRISES"}
                </p>

                {/* Signature Image */}
                <div className="h-14 flex items-center justify-center">
                  {business?.signatureUrl ? (
                    <img
                      src={business.signatureUrl}
                      alt="Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-sm font-playfair italic text-gray-700 font-bold">
                      {business?.contactName || "Authorized Signature"}
                    </span>
                  )}
                </div>

                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                  AUTHORIZED SIGNATURE
                </p>
              </div>
            </div>
          </div>

          {/* ================= PAGE FOOTER (Image 1) ================= */}
          <div className="pt-6 border-t border-gray-100 flex justify-end items-center text-[10px] text-gray-400">
            <span>Page 1 of 1</span>
          </div>
        </div>
      </main>

      {/* ================= FLOATING ACTION MENU ("MORE" BUTTON POP-UP) (Image 5) ================= */}
      {isMoreOpen && (
        <div className="fixed bottom-20 right-6 sm:right-10 z-50 flex flex-col items-end space-y-3 animate-in fade-in zoom-in-95 duration-150 print:hidden">
          {/* 1. Delete Option Pill (Image 5) */}
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-lg shadow-md">
              Delete
            </span>
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
              <Trash2 size={20} />
            </div>
          </button>

          {/* 2. Status Option Pill (Image 5) */}
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-lg shadow-md">
              Status
            </span>
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
              <Tag size={20} />
            </div>
          </button>
        </div>
      )}

      {/* ================= BOTTOM ACTION BAR (Images 1 & 5) ================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/90 shadow-2xl py-2 px-3 sm:px-6 flex items-center justify-around print:hidden max-w-2xl mx-auto rounded-t-3xl">
        {/* 1. Duplicate */}
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={isDuplicating}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-gray-700 hover:text-black transition-colors cursor-pointer group disabled:opacity-50"
        >
          {isDuplicating ? (
            <Loader2 size={22} className="animate-spin text-black mb-1" />
          ) : (
            <Copy size={22} className="group-hover:scale-110 transition-transform text-gray-900 mb-1" />
          )}
          <span className="text-[11px] font-bold tracking-tight">Duplicate</span>
        </button>

        {/* 2. Edit */}
        <button
          type="button"
          onClick={handleEdit}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-gray-700 hover:text-black transition-colors cursor-pointer group"
        >
          <Edit3 size={22} className="group-hover:scale-110 transition-transform text-gray-900 mb-1" />
          <span className="text-[11px] font-bold tracking-tight">Edit</span>
        </button>

        {/* 3. Invoice */}
        <button
          type="button"
          onClick={() => setIsInvoiceModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-gray-700 hover:text-black transition-colors cursor-pointer group"
        >
          <FileSpreadsheet size={22} className="group-hover:scale-110 transition-transform text-gray-900 mb-1" />
          <span className="text-[11px] font-bold tracking-tight">Invoice</span>
        </button>

        {/* 4. Share */}
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-gray-700 hover:text-black transition-colors cursor-pointer group"
        >
          <Share2 size={22} className="group-hover:scale-110 transition-transform text-gray-900 mb-1" />
          <span className="text-[11px] font-bold tracking-tight">Share</span>
        </button>

        {/* 5. More (Toggles Delete & Status) */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors cursor-pointer group ${
            isMoreOpen ? "text-black" : "text-gray-700 hover:text-black"
          }`}
        >
          <MoreHorizontal
            size={22}
            className={`transition-transform text-gray-900 mb-1 ${isMoreOpen ? "rotate-90" : "group-hover:scale-110"}`}
          />
          <span className="text-[11px] font-bold tracking-tight">More</span>
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
                      ? "bg-black text-white border-black"
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

      {/* ================= INVOICE OPTIONS MODAL ================= */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet size={18} className="text-gray-900" />
                <h4 className="text-base font-bold text-gray-900">Commercial Invoice</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Convert this accepted quotation into an official Tax Invoice or download a Proforma Invoice with your banking credentials.
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsInvoiceModalOpen(false);
                  window.print();
                }}
                className="w-full py-3 bg-[#18181B] text-white font-bold text-xs rounded-xl hover:bg-black shadow transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Printer size={15} />
                <span>Print Proforma Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsInvoiceModalOpen(false);
                  handleUpdateStatus("Accepted");
                }}
                className="w-full py-3 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
              >
                Mark Quotation as Accepted
              </button>
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
                <Share2 size={18} className="text-gray-900" />
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
                className="w-full py-3 bg-[#18181B] hover:bg-black text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
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
