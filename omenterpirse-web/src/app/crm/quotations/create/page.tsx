"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Building2,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

interface ItemRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  total: number;
}

export default function CrmCreateQuotationPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [items, setItems] = useState<ItemRow[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, taxPercent: 18, total: 0 },
  ]);
  const [notes, setNotes] = useState("Thank you for your business. Please contact us if you have any questions.");
  const [terms, setTerms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

        // Pre-populate terms from business otherInfo or terms API
        if (data.business?.otherInfo) {
          setTerms(data.business.otherInfo);
        } else {
          setTerms(
            "• Validity: 30 days from quote date.\n• Payment: 100% advance against Proforma Invoice.\n• Delivery: 5 to 7 working days from confirmed PO.\n• Warranty: 12 months manufacturer warranty."
          );
        }

        // Fetch customers & products for quick fill
        const [custRes, prodRes] = await Promise.all([
          fetch("/api/crm/customers"),
          fetch("/api/crm/products"),
        ]);
        const custData = await custRes.json();
        const prodData = await prodRes.json();
        if (custData.success && custData.customers) setCustomers(custData.customers);
        if (prodData.success && prodData.products) setProducts(prodData.products);
      } catch (err) {
        console.error("Failed to load CRM session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router]);

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerAddress("");
      setCustomerGstin("");
      return;
    }
    const found = customers.find((c) => String(c.id) === String(custId));
    if (found) {
      setCustomerName(found.name + (found.companyName ? " (" + found.companyName + ")" : ""));
      setCustomerEmail(found.email || "");
      setCustomerPhone(found.phone || "");
      setCustomerAddress(
        [found.addressLine1, found.addressLine2, found.address, found.city, found.state, found.pincode].filter(Boolean).join(", ")
      );
      setCustomerGstin(found.gstin || "");
    }
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const tax = Number(item.taxPercent) || 0;
      const base = qty * price;
      item.total = Math.round((base + (base * tax) / 100) * 100) / 100;
      updated[index] = item;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", quantity: 1, unitPrice: 0, taxPercent: 18, total: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => String(p.id) === String(prodId));
    if (prod) {
      handleItemChange(index, "description", prod.name + (prod.description ? ` - ${prod.description}` : ""));
      handleItemChange(index, "unitPrice", prod.basePrice);
    }
  };

  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const taxTotal = items.reduce(
    (acc, it) =>
      acc +
      ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) * (Number(it.taxPercent) || 0)) /
        100,
    0
  );
  const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMessage("Customer name is required.");
      return;
    }
    if (items.some((it) => !it.description.trim() || Number(it.unitPrice) <= 0)) {
      setErrorMessage("All line items must have a description and a positive unit price.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/crm/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId ? parseInt(selectedCustomerId, 10) : undefined,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          customerAddress: customerAddress.trim() || undefined,
          customerGstin: customerGstin.trim() || undefined,
          quotationDate,
          validUntil,
          items,
          subtotal,
          taxTotal,
          grandTotal,
          notes: notes.trim(),
          terms: terms.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create quotation.");
      }

      // Navigate to Quotation List to view and print
      router.push("/crm/quotations");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create quotation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Opening Quotation Creator...</p>
      </div>
    );
  }

  const businessName = business?.businessName || "Your Business";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h1 className="font-extrabold text-gray-900 tracking-tight text-base">
                  Create Commercial Quotation
                </h1>
                <p className="text-xs text-gray-500 font-medium truncate max-w-xs">
                  Issued under {businessName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => router.push("/crm/quotations")}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                Quotation List →
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Customer Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 font-playfair">1. Client & Dates</h2>
                <p className="text-xs text-gray-500">Select an existing customer or type direct details</p>
              </div>

              {customers.length > 0 && (
                <div className="w-full sm:w-72">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50 font-medium"
                  >
                    <option value="">-- Autofill from Customer Directory --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Apex Industrial Corp"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="billing@apex.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Street, City, State, PIN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Customer GSTIN
                </label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  placeholder="e.g. 36AAACG1234F1Z9"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Quotation Date *
                </label>
                <input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Valid Until *
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items & Calculation */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 font-playfair">2. Quotation Items & Rates</h2>
                <p className="text-xs text-gray-500">Add materials, specifications, unit rates, and GST percentage</p>
              </div>

              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus size={15} />
                <span>Add Item Line</span>
              </button>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-gray-500">
                        Item {idx + 1} Description *
                      </label>
                      {products.length > 0 && (
                        <select
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="text-[10px] text-brand bg-white border border-gray-200 rounded-lg px-2 py-0.5"
                        >
                          <option value="">-- Fill from Catalog --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (₹{p.basePrice})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      placeholder="e.g. 33kV Vacuum Circuit Breaker with metering unit"
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 shrink-0">
                    <div className="sm:w-20">
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-center"
                      />
                    </div>

                    <div className="sm:w-28">
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">
                        Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                      />
                    </div>

                    <div className="sm:w-20">
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">
                        GST %
                      </label>
                      <select
                        value={item.taxPercent}
                        onChange={(e) => handleItemChange(idx, "taxPercent", e.target.value)}
                        className="w-full px-2 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>

                    <div className="sm:w-28 text-right self-center pt-3 sm:pt-0">
                      <div className="text-[10px] uppercase font-bold text-gray-400">Total</div>
                      <div className="font-bold text-sm text-gray-900">
                        ₹{item.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="self-center pt-3 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="p-2 text-gray-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Summary */}
            <div className="flex justify-end pt-3">
              <div className="w-full sm:w-80 bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Tax (GST):</span>
                  <span className="font-semibold text-gray-900">
                    ₹{taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-px bg-gray-200 my-1" />
                <div className="flex justify-between text-sm font-extrabold text-brand">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Terms & Notes */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-900 font-playfair border-b border-gray-100 pb-3">
              3. Terms & Client Notes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Terms & Conditions (Points Printed on Quote)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTerms((prev) => {
                        const lines = prev.split("\n").filter((l) => l.trim());
                        const nextNum = lines.length + 1;
                        const newLine = `${nextNum}. `;
                        return prev ? `${prev.trim()}\n${newLine}` : newLine;
                      });
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    + Add Point
                  </button>
                </div>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={5}
                  placeholder="1. Validity: 30 days...&#10;2. Payment: 100% advance..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-medium leading-relaxed"
                />
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTerms((prev) => {
                        const lines = prev.split("\n").filter((l) => l.trim());
                        const nextNum = lines.length + 1;
                        const newLine = `${nextNum}. Validity: 30 days from quotation date.`;
                        return prev ? `${prev.trim()}\n${newLine}` : newLine;
                      });
                    }}
                    className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-medium cursor-pointer"
                  >
                    + 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTerms((prev) => {
                        const lines = prev.split("\n").filter((l) => l.trim());
                        const nextNum = lines.length + 1;
                        const newLine = `${nextNum}. Payment: 100% advance against Proforma Invoice.`;
                        return prev ? `${prev.trim()}\n${newLine}` : newLine;
                      });
                    }}
                    className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-medium cursor-pointer"
                  >
                    + 100% Advance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTerms((prev) => {
                        const lines = prev.split("\n").filter((l) => l.trim());
                        const nextNum = lines.length + 1;
                        const newLine = `${nextNum}. Delivery: 5 to 7 working days from confirmed PO.`;
                        return prev ? `${prev.trim()}\n${newLine}` : newLine;
                      });
                    }}
                    className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-medium cursor-pointer"
                  >
                    + 5-7 Days Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTerms((prev) => {
                        const lines = prev.split("\n").filter((l) => l.trim());
                        const nextNum = lines.length + 1;
                        const newLine = `${nextNum}. Warranty: 12 months manufacturer warranty.`;
                        return prev ? `${prev.trim()}\n${newLine}` : newLine;
                      });
                    }}
                    className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-medium cursor-pointer"
                  >
                    + 12M Warranty
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Submission Bar */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/crm/dashboard")}
              className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Generating Quote...</span>
                </>
              ) : (
                <span>Save & Issue Quotation</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
