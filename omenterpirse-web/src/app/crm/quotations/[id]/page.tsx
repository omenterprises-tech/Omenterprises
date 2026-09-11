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
import { formatDisplayDate } from "@/lib/crmCurrencyData";

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

  // Share Modal & PDF Generation
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [customWhatsAppPhone, setCustomWhatsAppPhone] = useState("");

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
        if (data.quotation.customerPhone) {
          setCustomWhatsAppPhone(data.quotation.customerPhone);
        }
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
        quotationDate: formatDisplayDate(new Date(), business?.dateFormat),
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

  // Helper to generate high-resolution PDF Blob
  const generateQuotationPdfBlob = async (): Promise<Blob | null> => {
    const element = document.getElementById("quotation-sheet");
    if (!element) return null;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const sheet = clonedDoc.getElementById("quotation-sheet");
          if (sheet) {
            sheet.style.width = "794px";
            sheet.style.maxWidth = "794px";
            sheet.style.minWidth = "794px";
            sheet.style.padding = "20px 28px 16px 28px";
            sheet.style.margin = "0";
            sheet.style.boxSizing = "border-box";
            sheet.style.borderRadius = "0";
            sheet.style.border = "none";
            sheet.style.boxShadow = "none";
            sheet.style.backgroundColor = "#ffffff";
            sheet.style.color = "#111827";

            // Inject explicit fallback stylesheet ensuring all classes have solid hex colors (preventing oklch transparent text bug)
            const fallbackStyle = clonedDoc.createElement("style");
            fallbackStyle.textContent = `
              #quotation-sheet, #quotation-sheet * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #quotation-sheet {
                color: #111827 !important;
                background-color: #ffffff !important;
              }
              #quotation-sheet [class*="text-gray-900"],
              #quotation-sheet [class*="text-slate-900"] { color: #111827 !important; }
              #quotation-sheet [class*="text-gray-800"],
              #quotation-sheet [class*="text-slate-800"] { color: #1F2937 !important; }
              #quotation-sheet [class*="text-gray-700"],
              #quotation-sheet [class*="text-slate-700"] { color: #374151 !important; }
              #quotation-sheet [class*="text-gray-600"],
              #quotation-sheet [class*="text-slate-600"] { color: #4B5563 !important; }
              #quotation-sheet [class*="text-gray-500"],
              #quotation-sheet [class*="text-slate-500"] { color: #6B7280 !important; }
              #quotation-sheet [class*="text-gray-400"],
              #quotation-sheet [class*="text-slate-400"] { color: #9CA3AF !important; }
              #quotation-sheet [class*="text-brand"] { color: #0D47A1 !important; }
              #quotation-sheet [class*="bg-brand"] { background-color: #0D47A1 !important; color: #ffffff !important; }
              #quotation-sheet [class*="bg-gray-100"] { background-color: #F3F4F6 !important; }
              #quotation-sheet [class*="bg-gray-50"] { background-color: #F9FAFB !important; }
              #quotation-sheet [class*="bg-blue-50"] { background-color: #EFF6FF !important; }
              #quotation-sheet [class*="border-gray-100"] { border-color: #F3F4F6 !important; }
              #quotation-sheet [class*="border-gray-200"] { border-color: #E5E7EB !important; }
              #quotation-sheet [class*="border-gray-300"] { border-color: #D1D5DB !important; }
              #quotation-sheet [class*="border-gray-400"] { border-color: #9CA3AF !important; }
              #quotation-sheet [class*="border-gray-900"] { border-color: #111827 !important; }
              #quotation-sheet [class*="divide-gray-200"] > * + * { border-color: #E5E7EB !important; }
              #quotation-sheet table { border-collapse: collapse !important; width: 100% !important; }
              #quotation-sheet th, #quotation-sheet td { visibility: visible !important; opacity: 1 !important; }
            `;
            clonedDoc.head.appendChild(fallbackStyle);

            // Directly sanitize any computed styles containing oklch
            try {
              const allEls = sheet.querySelectorAll("*");
              const canvasHelper = clonedDoc.createElement("canvas");
              const ctxHelper = canvasHelper.getContext("2d");

              allEls.forEach((node) => {
                const el = node as HTMLElement;
                const win = clonedDoc.defaultView || window;
                const comp = win.getComputedStyle(el);

                const resolveColor = (c: string, fallback: string): string => {
                  if (!c) return fallback;
                  if (c.includes("oklch") || c.includes("color(")) {
                    if (ctxHelper) {
                      try {
                        ctxHelper.fillStyle = c;
                        const res = ctxHelper.fillStyle;
                        if (res && res !== "#000000" && !res.includes("oklch")) return res;
                      } catch (e) {}
                    }
                    return fallback;
                  }
                  return c;
                };

                if (comp.color && (comp.color.includes("oklch") || comp.color.includes("color("))) {
                  el.style.color = resolveColor(comp.color, "#111827");
                }
                if (comp.backgroundColor && (comp.backgroundColor.includes("oklch") || comp.backgroundColor.includes("color("))) {
                  el.style.backgroundColor = resolveColor(comp.backgroundColor, "transparent");
                }
                if (comp.borderColor && (comp.borderColor.includes("oklch") || comp.borderColor.includes("color("))) {
                  el.style.borderColor = resolveColor(comp.borderColor, "#E5E7EB");
                }
              });
            } catch (err) {
              console.warn("Color sanitization warning:", err);
            }
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // 1. Single-page document: fits within or near standard A4 height
      if (imgHeight <= pdfHeight * 1.15) {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const drawHeight = Math.min(imgHeight, pdfHeight);
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, drawHeight);
        return pdf.output("blob");
      }

      // 2. Multi-page document: for quotations with many line items
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 25) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      return pdf.output("blob");
    } catch (err) {
      console.error("Failed to generate PDF blob:", err);
      return null;
    }
  };

  // Helper to trigger direct download of a Blob
  const downloadPdfFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  // Handle Share as PDF File
  const handleShare = async () => {
    if (!quotation) return;
    if (quotation.customerPhone && !customWhatsAppPhone) {
      setCustomWhatsAppPhone(quotation.customerPhone);
    }
    setIsGeneratingPdf(true);

    try {
      const blob = await generateQuotationPdfBlob();
      if (blob) {
        const fileName = `Quotation_${quotation.quotationNumber || "Doc"}.pdf`;
        const file = new File([blob], fileName, { type: "application/pdf" });

        // If device supports sharing files directly (e.g. mobile devices, Safari, Edge)
        // Only share the complete PDF file without any accompanying text message
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Quotation ${quotation.quotationNumber}`,
            });
            setIsGeneratingPdf(false);
            setIsShareModalOpen(false);
            showToast("Quotation PDF shared successfully!");
            return;
          } catch (shareErr: any) {
            setIsGeneratingPdf(false);
            setIsShareModalOpen(false);
            if (shareErr?.name === "AbortError") {
              return;
            }
          }
        }
      }
    } catch (err) {
      console.error("PDF generation/sharing error:", err);
    }

    setIsGeneratingPdf(false);
    setIsShareModalOpen(true);
  };

  // Handle direct download from modal
  const handleDownloadPdf = async () => {
    if (!quotation) return;
    setIsGeneratingPdf(true);
    try {
      const blob = await generateQuotationPdfBlob();
      if (blob) {
        const fileName = `Quotation_${quotation.quotationNumber || "Doc"}.pdf`;
        downloadPdfFile(blob, fileName);
        showToast("Quotation PDF downloaded successfully!");
      } else {
        showToast("Falling back to print dialog...");
        handlePrint();
      }
    } catch (err) {
      console.error("Download error:", err);
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
      setIsShareModalOpen(false);
    }
  };

  // Handle WhatsApp PDF sharing to any number or any chat
  const handleWhatsAppPdfShare = async (phoneArg?: string) => {
    if (!quotation) return;
    setIsGeneratingPdf(true);
    try {
      const blob = await generateQuotationPdfBlob();
      const fileName = `Quotation_${quotation.quotationNumber || "Doc"}.pdf`;
      if (blob) {
        downloadPdfFile(blob, fileName);
        showToast("PDF downloaded! Attach the file to your WhatsApp chat.");
      } else {
        showToast("Opening WhatsApp...");
      }

      const targetRaw = phoneArg !== undefined ? phoneArg : customWhatsAppPhone;
      const cleanDigits = targetRaw?.replace(/[^0-9]/g, "") || "";
      const finalPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

      // Open WhatsApp directly without any prefilled text message per user requirement
      const waUrl = finalPhone
        ? `https://api.whatsapp.com/send?phone=${finalPhone}`
        : `https://api.whatsapp.com/send`;

      window.open(waUrl, "_blank");
    } catch (err) {
      console.error("WhatsApp share error:", err);
    } finally {
      setIsGeneratingPdf(false);
      setIsShareModalOpen(false);
    }
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
                  {quotation.customerName} • {formatDisplayDate(quotation.quotationDate, business?.dateFormat)}
                </p>
              </div>
            </div>

            {/* Right: Only Share Option Above */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleShare}
                disabled={isGeneratingPdf}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Share Quotation as PDF"
              >
                {isGeneratingPdf ? (
                  <Loader2 size={15} className="animate-spin text-white" />
                ) : (
                  <Share2 size={15} />
                )}
                <span>{isGeneratingPdf ? "Generating..." : "Share PDF"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= FULL-SCREEN MAIN WORKSPACE ================= */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-28 print:p-0 print:m-0 print:max-w-none print:w-full print:block">
        {/* ================= A4 WHITE QUOTATION SHEET (Website Theme & Exact Design) ================= */}
        <div
          id="quotation-sheet"
          className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-3 sm:space-y-4 print:shadow-none print:rounded-none print:border-none print:p-0 print:w-full print:space-y-2"
        >
          {/* ================= 1. TOP HEADER (Logo, Business Info, Quotation Heading) ================= */}
          <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-200 pb-6 print:pb-2.5 print:gap-2">
            {/* Left: Business Logo */}
            <div className="col-span-3 sm:col-span-2 flex justify-start">
              {business?.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt="Logo"
                  crossOrigin="anonymous"
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
                <span className="font-semibold text-gray-800 text-xs sm:text-sm">
                  {formatDisplayDate(quotation.quotationDate, business?.dateFormat)}
                </span>
              </div>
              {quotation.validUntil && (
                <div>
                  <span className="font-bold text-gray-500 uppercase text-[11px] tracking-wider block">Valid Until</span>
                  <span className="text-gray-700 text-xs">
                    {formatDisplayDate(quotation.validUntil, business?.dateFormat)}
                  </span>
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
          {(() => {
            const hasAnyHsn = items.some(
              (it) => it.hsn && it.hsn.trim() !== "" && it.hsn.trim() !== "-"
            );

            return (
              <div className="overflow-x-auto border border-gray-300 rounded-xl py-0.5 print:overflow-visible print:border-gray-400 print:rounded-lg">
                <table className="w-full text-left text-xs sm:text-sm print:text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300 text-gray-800 font-extrabold uppercase tracking-wider text-[11px] print:text-[10px]">
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center w-10">#</th>
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2">DESCRIPTION</th>
                      {hasAnyHsn && (
                        <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center w-24">HSN</th>
                      )}
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-center w-20">QTY</th>
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-right w-28">PRICE</th>
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-right w-28">GST</th>
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-right w-32">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={hasAnyHsn ? 7 : 6} className="py-8 text-center text-gray-400">
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

                        const displayName =
                          it.name?.trim() ||
                          (it.description?.includes(" - ")
                            ? it.description.split(" - ")[0].trim()
                            : it.description?.trim()) ||
                          "Item";

                        let rawDesc = (it.description || "").trim();
                        let cleanedDesc = "";

                        if (rawDesc) {
                          if (rawDesc.toLowerCase() === displayName.toLowerCase()) {
                            cleanedDesc = "";
                          } else if (
                            rawDesc.toLowerCase().startsWith((displayName + " - ").toLowerCase())
                          ) {
                            cleanedDesc = rawDesc.slice(displayName.length + 3).trim();
                          } else if (rawDesc.toLowerCase().startsWith(displayName.toLowerCase())) {
                            cleanedDesc = rawDesc
                              .slice(displayName.length)
                              .replace(/^[-–—:\s]+/, "")
                              .trim();
                          } else {
                            cleanedDesc = rawDesc;
                          }
                        }

                        return (
                          <tr key={idx} className="align-top hover:bg-blue-50/20 transition-colors">
                            <td className="py-3 px-3 print:py-1.5 print:px-2 text-center font-medium text-gray-500">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2">
                              <span className="font-bold text-gray-900 block leading-snug">
                                {displayName}
                              </span>
                              {cleanedDesc ? (
                                <span className="text-xs print:text-[10px] text-gray-500 block leading-relaxed mt-0.5 font-normal">
                                  {cleanedDesc}
                                </span>
                              ) : null}
                            </td>
                            {hasAnyHsn && (
                              <td className="py-3 px-3 print:py-1.5 print:px-2 text-center text-gray-600 font-medium text-xs">
                                {it.hsn && it.hsn.trim() !== "-" ? it.hsn.trim() : ""}
                              </td>
                            )}
                            <td className="py-3 px-3 print:py-1.5 print:px-2 text-center font-bold text-gray-900">
                              <div>{qty}</div>
                              <div className="text-[10px] text-gray-500 font-normal uppercase">
                                {it.unit || "COILS"}
                              </div>
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 text-right font-semibold text-gray-900">
                              {formatRs(baseTotal)}
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 text-right font-medium text-gray-700">
                              <div>{formatRs(gstAmount)}</div>
                              <div className="text-[10px] text-gray-500 font-normal">
                                {taxRate.toFixed(2)}%
                              </div>
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 text-right font-black text-gray-900">
                              {formatRs(baseTotal + gstAmount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* ================= 5. FINANCIAL TOTALS BREAKDOWN ================= */}
          <div className="flex justify-end pt-1 print:pt-0.5">
            <div className="w-full sm:w-72 print:w-64 space-y-1 print:space-y-0.5 text-xs text-gray-800">
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

              {/* Clean Standard Accounting Grand Total Line */}
              <div className="flex justify-between items-center font-black text-sm print:text-xs text-gray-900 border-t-2 border-b-2 border-gray-900 py-1 mt-1 print:py-0.5">
                <span className="tracking-wide uppercase">GRAND TOTAL</span>
                <span className="text-base font-black print:text-sm">{formatRs(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* ================= 6. CLOSING STATEMENT ================= */}
          <div className="pt-1 print:pt-0.5 text-xs sm:text-sm print:text-xs text-gray-700 font-medium">
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
                      crossOrigin="anonymous"
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

      {/* ================= FIXED BOTTOM TOOLBAR (5 Options: Duplicate, Edit, Print/PDF, Share PDF, More) ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl py-2 px-4 print:hidden">
        <nav className="max-w-md mx-auto flex items-center justify-between sm:justify-around">
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 text-gray-700 hover:text-brand transition-colors cursor-pointer rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            {isDuplicating ? <Loader2 size={18} className="animate-spin text-brand" /> : <Copy size={18} />}
            <span className="text-[10px] sm:text-[11px] font-bold mt-1">Duplicate</span>
          </button>

          <button
            type="button"
            onClick={handleEdit}
            className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 text-gray-700 hover:text-brand transition-colors cursor-pointer rounded-xl hover:bg-gray-50"
          >
            <Edit3 size={18} />
            <span className="text-[10px] sm:text-[11px] font-bold mt-1">Edit</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 text-brand hover:text-brand-hover transition-colors cursor-pointer font-bold rounded-xl hover:bg-blue-50"
          >
            <Printer size={18} />
            <span className="text-[10px] sm:text-[11px] font-bold mt-1">Print/PDF</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={isGeneratingPdf}
            className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 text-gray-700 hover:text-brand transition-colors cursor-pointer disabled:opacity-50 rounded-xl hover:bg-gray-50"
          >
            {isGeneratingPdf ? <Loader2 size={18} className="animate-spin text-brand" /> : <Share2 size={18} />}
            <span className="text-[10px] sm:text-[11px] font-bold mt-1">Share PDF</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 text-gray-700 hover:text-brand transition-colors cursor-pointer rounded-xl hover:bg-gray-50"
            >
              <MoreHorizontal size={18} />
              <span className="text-[10px] sm:text-[11px] font-bold mt-1">More</span>
            </button>

            {/* More Options Pop-up */}
            {isMoreOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 print:hidden cursor-default"
                  onClick={() => setIsMoreOpen(false)}
                />
                <div className="absolute bottom-full mb-3 right-0 z-50 w-48 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 print:hidden">
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
              </>
            )}
          </div>
        </nav>
      </div>

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



      {/* ================= SHARE OPTIONS MODAL (PDF & WHATSAPP) ================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Share2 size={18} className="text-brand" />
                <h4 className="text-base font-bold text-gray-900">Share Quotation PDF</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Export and share your formal quotation document via PDF or directly over WhatsApp:
            </p>

            <div className="space-y-3 pt-1">
              {/* 1. Direct PDF Download */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">Download PDF File</span>
                  <span className="text-[10px] text-brand font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                    A4 Clean Format
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  <span>Download PDF Document</span>
                </button>
              </div>

              {/* 2. WhatsApp Sharing to Any Number */}
              <div className="bg-[#25D366]/10 p-4 rounded-2xl border border-[#25D366]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Send size={14} className="text-[#25D366]" />
                    <span>Send via WhatsApp</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-[#25D366]/20 px-2 py-0.5 rounded-full">
                    Any Number
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Recipient Mobile Number (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customWhatsAppPhone}
                      onChange={(e) => setCustomWhatsAppPhone(e.target.value)}
                      placeholder="Enter 10-digit number (e.g. 9876543210)"
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-300 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] font-medium"
                    />
                    {customWhatsAppPhone && (
                      <button
                        type="button"
                        onClick={() => setCustomWhatsAppPhone("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
                        title="Clear Number"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Send to this specific number, or click below to choose any chat/contact in WhatsApp.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleWhatsAppPdfShare(customWhatsAppPhone)}
                    disabled={isGeneratingPdf || !customWhatsAppPhone.trim()}
                    className="py-2.5 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    title="Send to the specified number"
                  >
                    {isGeneratingPdf ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Send to Number</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppPdfShare("")}
                    disabled={isGeneratingPdf}
                    className="py-2.5 px-3 bg-white border border-[#25D366] text-emerald-800 hover:bg-[#25D366]/10 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    title="Choose any chat, contact or group in WhatsApp"
                  >
                    <span>Choose Any Chat</span>
                  </button>
                </div>
              </div>

              {/* 3. Browser Print / Save Dialog */}
              <button
                type="button"
                onClick={() => {
                  setIsShareModalOpen(false);
                  handlePrint();
                }}
                className="w-full py-2.5 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Printer size={15} />
                <span>Print or Save via Browser Dialog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
