"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Plus,
  Eye,
  Trash2,
  Search,
  Loader2,
  CheckCircle2,
  Filter,
  ChevronDown,
  Calendar,
  X,
} from "lucide-react";
import { ViewQuotationModal } from "@/components/crm/QuotationModal";
import { formatDisplayDate } from "@/lib/crmCurrencyData";

export default function CrmQuotationsListPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // View / Print Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadQuotations = async () => {
    try {
      const res = await fetch("/api/crm/quotations");
      const data = await res.json();
      if (data.success && data.quotations) {
        setQuotations(data.quotations);
      }
    } catch (err) {
      console.error("Failed to load quotations:", err);
    }
  };

  useEffect(() => {
    async function init() {
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
        await loadQuotations();
      } catch (err) {
        console.error("Failed to load CRM session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router]);

  // Normalize any date string to YYYY-MM-DD for reliable comparison
  const toYmd = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    const s = String(dateStr).trim();
    const ymdMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymdMatch) {
      return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, "0")}-${ymdMatch[3].padStart(2, "0")}`;
    }
    const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
    }
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return "";
  };

  // Filtered quotations by status, search term, and date
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchesStatus = statusFilter === "All" || q.status === statusFilter;
      const term = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !term ||
        q.quotationNumber?.toLowerCase().includes(term) ||
        q.customerName?.toLowerCase().includes(term) ||
        q.createdByName?.toLowerCase().includes(term);

      const matchesDate =
        !dateFilter ||
        toYmd(q.quotationDate) === dateFilter ||
        toYmd(q.createdAt) === dateFilter;

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [quotations, searchQuery, statusFilter, dateFilter]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allFilteredSelected =
    filteredQuotations.length > 0 &&
    filteredQuotations.every((q) => selectedIds.includes(q.id));

  const someFilteredSelected =
    filteredQuotations.some((q) => selectedIds.includes(q.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredQuotations.map((q) => q.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const filteredIdSet = new Set(filteredQuotations.map((q) => q.id));
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIdSet])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (
      !confirm(
        `Are you sure you want to delete ${count} selected quotation${
          count > 1 ? "s" : ""
        }? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const res = await fetch("/api/crm/quotations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        setQuotations((prev) => prev.filter((q) => !selectedIds.includes(q.id)));
        setSelectedIds([]);
        showToast(
          `Successfully deleted ${count} quotation${count > 1 ? "s" : ""}.`
        );
      } else {
        alert(data.error || "Failed to delete selected quotations.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete selected quotations.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteQuotation = async (qId: number, qNum: string) => {
    if (!confirm(`Are you sure you want to delete quotation "${qNum}"?`)) return;
    try {
      const res = await fetch(`/api/crm/quotations/${qId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setQuotations((prev) => prev.filter((q) => q.id !== qId));
        setSelectedIds((prev) => prev.filter((id) => id !== qId));
        showToast("Quotation deleted successfully.");
      } else {
        alert(data.error || "Failed to delete quotation.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete quotation.");
    }
  };

  const handleQuotationStatusChange = async (newStatus: string) => {
    if (!selectedQuotation) return;
    try {
      const res = await fetch(`/api/crm/quotations/${selectedQuotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.quotation) {
        setSelectedQuotation(data.quotation);
        setQuotations((prev) =>
          prev.map((q) => (q.id === data.quotation.id ? data.quotation : q))
        );
        showToast(`Quotation status updated to ${newStatus}.`);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const handleDirectStatusChange = async (qId: number, newStatus: string) => {
    const currentQ = quotations.find((q) => q.id === qId);
    if (!currentQ || currentQ.status === newStatus) return;

    setUpdatingStatusId(qId);
    try {
      const res = await fetch(`/api/crm/quotations/${qId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.quotation) {
        setQuotations((prev) =>
          prev.map((q) => (q.id === qId ? { ...q, status: newStatus } : q))
        );
        showToast(`Quotation #${data.quotation.quotationNumber || currentQ.quotationNumber} marked as ${newStatus}.`);
      } else {
        alert(data.error || "Failed to update quotation status.");
      }
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(err.message || "Failed to update status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading Quotation Ledger...</p>
      </div>
    );
  }

  const businessName = business?.businessName || "Your Business";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => router.push("/crm/dashboard")}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer mr-1"
                title="Back to Dashboard"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center shadow-md">
                <FileText size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-gray-900 tracking-tight text-base">
                    Quotation Ledger
                  </span>
                  <span className="text-[10px] bg-blue-50 text-brand font-bold uppercase px-2 py-0.5 rounded-full border border-blue-100">
                    {quotations.length} Quotes
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium truncate max-w-xs">
                  {businessName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => router.push("/crm/dashboard")}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <button
                type="button"
                onClick={() => router.push("/crm/quotations/create")}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>New Quotation</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
          {/* Controls Bar: Search & Status Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-playfair">
                Commercial Quotes & Invoices
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Track status, print PDF quotations, and inspect creator attribution
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
              {/* Status Filter Pills */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-medium">
                {["All", "Sent", "Accepted", "Declined", "Draft"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      statusFilter === st
                        ? "bg-white text-gray-900 font-bold shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Date Filter with Calendar symbol */}
              <div className="relative flex items-center">
                <Calendar
                  size={15}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                    dateFilter ? "text-brand" : "text-gray-400"
                  }`}
                />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className={`w-full sm:w-auto pl-8.5 pr-8 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all cursor-pointer ${
                    dateFilter
                      ? "bg-blue-50/60 border-brand/50 text-brand font-semibold shadow-xs"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  title="Filter by quotation date"
                />
                {dateFilter && (
                  <button
                    type="button"
                    onClick={() => setDateFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
                    title="Clear date filter"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Quote #, client..."
                  className="w-full sm:w-56 pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/90 border border-blue-200/90 px-4 py-3 rounded-2xl shadow-xs">
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-blue-900 font-medium">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white text-[11px] font-bold">
                  {selectedIds.length}
                </span>
                <span>
                  <strong>{selectedIds.length}</strong> quotation
                  {selectedIds.length > 1 ? "s" : ""} selected
                </span>
                <span className="text-blue-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-brand hover:underline font-semibold cursor-pointer"
                >
                  Clear selection
                </button>
                {filteredQuotations.length > selectedIds.length && (
                  <>
                    <span className="text-blue-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const filteredIdSet = new Set(filteredQuotations.map((q) => q.id));
                        setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIdSet])));
                      }}
                      className="text-brand hover:underline font-semibold cursor-pointer"
                    >
                      Select all {filteredQuotations.length} filtered
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isBulkDeleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Delete Selected ({selectedIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quotations Table */}
          {filteredQuotations.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand">
                <FileText size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">
                  {searchQuery || statusFilter !== "All" || dateFilter
                    ? "No Matching Quotations"
                    : "No Quotations Generated Yet"}
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  {searchQuery || statusFilter !== "All" || dateFilter
                    ? "No records matched your filters. Try adjusting or clearing your date, status, or search query."
                    : "Create professional client quotations with branded logo, line items, and digital signatures."}
                </p>
              </div>
              {searchQuery || statusFilter !== "All" || dateFilter ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("All");
                    setDateFilter("");
                    setSelectedIds([]);
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/crm/quotations/create")}
                  className="mt-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow hover:bg-brand-hover transition-all cursor-pointer"
                >
                  + Draft First Quotation
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3 pl-3 pr-2 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate =
                              someFilteredSelected && !allFilteredSelected;
                          }
                        }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/30 cursor-pointer accent-blue-600"
                        title={allFilteredSelected ? "Deselect all" : "Select all"}
                      />
                    </th>
                    <th className="pb-3">Quotation #</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created By</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredQuotations.map((q) => {
                    const isSelected = selectedIds.includes(q.id);
                    return (
                      <tr
                        key={q.id}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-blue-50/50 hover:bg-blue-50/80"
                            : "hover:bg-gray-50/60"
                        }`}
                      >
                        <td
                          className="py-4 pl-3 pr-2 w-10 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(q.id)}
                            className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/30 cursor-pointer accent-blue-600"
                            title="Select quotation"
                          />
                        </td>
                        <td
                          onClick={() => router.push(`/crm/quotations/${q.id}`)}
                          className="py-4 font-bold text-brand hover:underline text-xs sm:text-sm cursor-pointer"
                        >
                          {q.quotationNumber}
                        </td>
                      <td className="py-4 text-xs text-gray-500">
                        {formatDisplayDate(q.quotationDate, business?.dateFormat)}
                      </td>
                      <td className="py-4 font-semibold text-gray-900 text-xs sm:text-sm">
                        <div>{q.customerName}</div>
                        {q.customerPhone && (
                          <div className="text-[11px] text-gray-400 font-normal">{q.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-4 font-bold text-gray-900 text-xs sm:text-sm">
                        ₹{Number(q.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4">
                        {updatingStatusId === q.id ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 animate-pulse">
                            <Loader2 size={12} className="animate-spin text-brand" />
                            <span>Updating...</span>
                          </span>
                        ) : (
                          <div className="relative inline-flex items-center group">
                            <span
                              className={`absolute left-2.5 w-2 h-2 rounded-full pointer-events-none ${
                                q.status === "Accepted"
                                  ? "bg-emerald-500"
                                  : q.status === "Sent"
                                  ? "bg-blue-500"
                                  : q.status === "Declined"
                                  ? "bg-rose-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            <select
                              value={q.status || "Draft"}
                              onChange={(e) => handleDirectStatusChange(q.id, e.target.value)}
                              className={`text-xs font-bold pl-6 pr-7 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all appearance-none ${
                                q.status === "Accepted"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80"
                                  : q.status === "Sent"
                                  ? "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/80"
                                  : q.status === "Declined"
                                  ? "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/80"
                                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80"
                              }`}
                              title="Click to change status directly without opening quotation"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Sent">Sent</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Declined">Declined</option>
                            </select>
                            <ChevronDown
                              size={12}
                              className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity ${
                                q.status === "Accepted"
                                  ? "text-emerald-800"
                                  : q.status === "Sent"
                                  ? "text-blue-800"
                                  : q.status === "Declined"
                                  ? "text-rose-800"
                                  : "text-amber-800"
                              }`}
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-900 border border-purple-100">
                          <span>{q.createdByName}</span>
                          <span className="text-[10px] text-purple-600">({q.createdByRole})</span>
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/crm/quotations/${q.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Eye size={13} />
                            <span>View / Print</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuotation(q.id, q.quotationNumber)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete quotation"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Quotation View / Print Modal */}
      <ViewQuotationModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedQuotation(null);
        }}
        quotation={selectedQuotation}
        business={business}
        onStatusChange={handleQuotationStatusChange}
      />
    </div>
  );
}
