"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  Edit3,
  Loader2,
  Check,
  CheckSquare,
  Square,
  X,
  User,
  Package,
  FileText,
  DollarSign,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import CustomerModal from "@/components/crm/CustomerModal";
import ProductModal from "@/components/crm/ProductModal";

interface QuotationItem {
  id: string;
  productId?: number;
  name: string;
  quantity: number;
  unitPrice: number;
  description: string;
  taxPercent: number;
  total: number;
}

interface OtherChargeData {
  label: string;
  amount: number;
  isTaxable: boolean;
}

interface TermItem {
  id: string;
  text: string;
}

function MakeQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Top info
  const [quotationNo, setQuotationNo] = useState("-");
  const [quotationDate, setQuotationDate] = useState(
    new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
  );
  const [otherInfo, setOtherInfo] = useState("");

  // Customer State
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Products State
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Add / Edit Quotation Product Sheet (Image 2)
  const [isConfiguringProduct, setIsConfiguringProduct] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [currentProductObj, setCurrentProductObj] = useState<any | null>(null);
  const [cfgName, setCfgName] = useState("");
  const [cfgQuantity, setCfgQuantity] = useState("1");
  const [cfgPrice, setCfgPrice] = useState("");
  const [cfgDescription, setCfgDescription] = useState("");
  const [cfgTaxPercent, setCfgTaxPercent] = useState("18");

  // Other Charge State (Image 3)
  const [isOtherChargeOpen, setIsOtherChargeOpen] = useState(false);
  const [otherCharge, setOtherCharge] = useState<OtherChargeData | null>(null);
  const [ocLabel, setOcLabel] = useState("Other Charges");
  const [ocAmount, setOcAmount] = useState("");
  const [ocIsTaxable, setOcIsTaxable] = useState(false);

  // Terms & Conditions State (Image 4 & 5)
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsList, setTermsList] = useState<TermItem[]>([]);
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);
  const [isEditingTerms, setIsEditingTerms] = useState(false);

  // Submission
  const [isGenerating, setIsGenerating] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  // Load initial data
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

        // Fetch customers, products, terms
        const [custRes, prodRes, termsRes] = await Promise.all([
          fetch("/api/crm/customers").then((r) => r.json()),
          fetch("/api/crm/products").then((r) => r.json()),
          fetch("/api/crm/terms").then((r) => r.json()),
        ]);

        if (custRes.success && custRes.customers) {
          setCustomers(custRes.customers);
        }
        if (prodRes.success && prodRes.products) {
          setAllProducts(prodRes.products);
        }

        // Initialize terms list
        let initialTermsText = "";
        if (termsRes.success && termsRes.terms) {
          initialTermsText = termsRes.terms;
        } else if (data.business?.otherInfo) {
          initialTermsText = data.business.otherInfo;
        }

        const lines = initialTermsText
          ? initialTermsText.split("\n").map((l: string) => l.trim()).filter(Boolean)
          : [
              "Validity: 30 days from quotation date.",
              "Payment: 100% advance against Proforma Invoice.",
              "Delivery: 5 to 7 working days from confirmed Purchase Order.",
              "Warranty: 12 months manufacturer warranty against manufacturing defects.",
            ];

        const mappedTerms: TermItem[] = lines.map((l: string, idx: number) => ({
          id: `term-${idx + 1}-${Date.now()}`,
          text: l.replace(/^(\d+[\.\)]\s*|[•\-\*]\s*)/, "").trim(),
        }));

        setTermsList(mappedTerms);
        // Default select all terms
        setSelectedTermIds(mappedTerms.map((t) => t.id));

        // If editId is provided, load existing quotation details
        if (editId) {
          const qRes = await fetch(`/api/crm/quotations/${editId}`).then((r) => r.json());
          if (qRes.success && qRes.quotation) {
            const q = qRes.quotation;
            setQuotationNo(q.quotationNumber || "-");
            if (q.quotationDate) setQuotationDate(q.quotationDate);
            if (q.notes) setOtherInfo(q.notes);

            // Set customer
            setSelectedCustomer({
              id: q.customerId,
              name: q.customerName,
              email: q.customerEmail,
              phone: q.customerPhone,
              addressLine1: q.customerAddress,
              gstin: q.customerGstin,
            });

            // Parse items
            let parsedItems: any[] = [];
            try {
              parsedItems = typeof q.items === "string" ? JSON.parse(q.items) : q.items;
            } catch (e) {}

            if (Array.isArray(parsedItems) && parsedItems.length > 0) {
              setSelectedItems(
                parsedItems.map((it: any, i: number) => ({
                  id: it.id || `item-${i}-${Date.now()}`,
                  name: it.name || it.description?.split(" - ")[0] || "Item",
                  description: it.description?.includes(" - ")
                    ? it.description.split(" - ").slice(1).join(" - ")
                    : "",
                  quantity: Number(it.quantity) || 1,
                  unitPrice: Number(it.unitPrice) || 0,
                  taxPercent: Number(it.taxPercent) || 18,
                  total: Number(it.total) || (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
                }))
              );
            }

            // Parse other charges
            if (q.otherCharges) {
              try {
                const parsedOc =
                  typeof q.otherCharges === "string" ? JSON.parse(q.otherCharges) : q.otherCharges;
                if (parsedOc && (parsedOc.amount || parsedOc.label)) {
                  setOtherCharge({
                    label: parsedOc.label || "Other Charges",
                    amount: Number(parsedOc.amount) || 0,
                    isTaxable: Boolean(parsedOc.isTaxable),
                  });
                }
              } catch (e) {}
            }

            // Parse terms
            if (q.termsConditions) {
              const qLines = q.termsConditions
                .split("\n")
                .map((l: string) => l.trim())
                .filter(Boolean);
              if (qLines.length > 0) {
                const qMappedTerms: TermItem[] = qLines.map((l: string, idx: number) => ({
                  id: `term-${idx + 1}-${Date.now()}`,
                  text: l.replace(/^(\d+[\.\)]\s*|[•\-\*]\s*)/, "").trim(),
                }));
                setTermsList(qMappedTerms);
                setSelectedTermIds(qMappedTerms.map((t) => t.id));
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load quotation editor data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router, editId]);

  // Calculations
  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  }, [selectedItems]);

  const otherChargeAmount = useMemo(() => {
    return otherCharge ? Number(otherCharge.amount) || 0 : 0;
  }, [otherCharge]);

  const taxTotal = useMemo(() => {
    const itemsTax = selectedItems.reduce((acc, it) => {
      const base = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      const taxRate = Number(it.taxPercent) || 0;
      return acc + (base * taxRate) / 100;
    }, 0);

    const ocTax = otherCharge?.isTaxable ? (otherChargeAmount * 18) / 100 : 0;
    return Math.round((itemsTax + ocTax) * 100) / 100;
  }, [selectedItems, otherCharge, otherChargeAmount]);

  const amountDue = useMemo(() => {
    return Math.round((subtotal + otherChargeAmount + taxTotal) * 100) / 100;
  }, [subtotal, otherChargeAmount, taxTotal]);

  // Filtered customers for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  // Filtered products for search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase().trim();
    return allProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [allProducts, productSearch]);

  // Product Selection Handlers
  const openProductConfigurator = (prod: any, editIndex: number | null = null) => {
    setCurrentProductObj(prod);
    setEditingItemIndex(editIndex);
    setCfgName(prod.name || "");
    setCfgPrice(
      prod.basePrice !== undefined ? String(prod.basePrice) : prod.price !== undefined ? String(prod.price) : "0"
    );
    setCfgQuantity(editIndex !== null && selectedItems[editIndex] ? String(selectedItems[editIndex].quantity) : "1");
    setCfgDescription(prod.description || "");
    setCfgTaxPercent(prod.gst !== undefined && prod.gst !== null ? String(prod.gst) : "18");

    setIsProductSelectOpen(false);
    setIsConfiguringProduct(true);
  };

  const handleSaveProductToQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Math.max(1, Number(cfgQuantity) || 1);
    const unitPrice = Math.max(0, Number(cfgPrice) || 0);
    const taxRate = Number(cfgTaxPercent) || 0;
    const base = qty * unitPrice;
    const total = Math.round((base + (base * taxRate) / 100) * 100) / 100;

    const itemObj: QuotationItem = {
      id: editingItemIndex !== null ? selectedItems[editingItemIndex].id : `item-${Date.now()}`,
      productId: currentProductObj?.id,
      name: cfgName.trim() || currentProductObj?.name || "Item",
      quantity: qty,
      unitPrice,
      description: cfgDescription.trim(),
      taxPercent: taxRate,
      total,
    };

    if (editingItemIndex !== null) {
      setSelectedItems((prev) => {
        const updated = [...prev];
        updated[editingItemIndex] = itemObj;
        return updated;
      });
    } else {
      setSelectedItems((prev) => [...prev, itemObj]);
    }

    setIsConfiguringProduct(false);
    setEditingItemIndex(null);
    setCurrentProductObj(null);
  };

  // Other Charge Save
  const handleSaveOtherCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(ocAmount);
    if (isNaN(amt) || amt < 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setOtherCharge({
      label: ocLabel.trim() || "Other Charges",
      amount: amt,
      isTaxable: ocIsTaxable,
    });
    setIsOtherChargeOpen(false);
  };

  // Terms Handlers
  const handleToggleTerm = (id: string) => {
    setSelectedTermIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllTerms = () => {
    if (selectedTermIds.length === termsList.length) {
      setSelectedTermIds([]);
    } else {
      setSelectedTermIds(termsList.map((t) => t.id));
    }
  };

  const updateTermText = (id: string, text: string) => {
    setTermsList((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const addNewTermItem = () => {
    const newId = `term-${Date.now()}`;
    const newTerm = { id: newId, text: "" };
    setTermsList((prev) => [...prev, newTerm]);
    setSelectedTermIds((prev) => [...prev, newId]);
    setIsEditingTerms(true);
  };

  // Generate Quotation
  const handleGenerateQuotation = async () => {
    setSubmissionError("");

    if (!selectedCustomer) {
      setSubmissionError("Please select a customer (TO CUSTOMER) for this quotation.");
      return;
    }

    if (selectedItems.length === 0) {
      setSubmissionError("Please add at least one product under PRODUCTS.");
      return;
    }

    setIsGenerating(true);

    try {
      // Format selected terms
      const selectedTermsFormatted = termsList
        .filter((t) => selectedTermIds.includes(t.id) && t.text.trim())
        .map((t, idx) => `${idx + 1}. ${t.text.trim()}`)
        .join("\n");

      // Format items payload
      const itemsPayload = selectedItems.map((it) => ({
        description: it.name + (it.description ? ` - ${it.description}` : ""),
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        taxPercent: it.taxPercent,
        total: it.total,
      }));

      const payload = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email || null,
        customerPhone: selectedCustomer.phone || null,
        customerAddress: [
          selectedCustomer.addressLine1,
          selectedCustomer.addressLine2,
          selectedCustomer.address,
          selectedCustomer.city,
          selectedCustomer.state,
          selectedCustomer.pincode,
        ]
          .filter(Boolean)
          .join(", "),
        customerGstin: selectedCustomer.gstin || null,
        quotationDate,
        items: itemsPayload,
        subtotal,
        taxTotal,
        grandTotal: amountDue,
        otherCharges: otherCharge || null,
        notes: otherInfo.trim() || null,
        termsConditions: selectedTermsFormatted || null,
        status: "Draft",
      };

      const url = editId ? `/api/crm/quotations/${editId}` : "/api/crm/quotations";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.quotation) {
        router.push(`/crm/quotations/${data.quotation.id}`);
      } else {
        setSubmissionError(data.error || "Failed to save quotation.");
      }
    } catch (err: any) {
      setSubmissionError(err.message || "Failed to save quotation.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1E1E1E]">
        <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
        <p className="text-white/80 font-medium text-sm">Opening Make Quotation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex flex-col justify-start items-center font-inter">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md min-h-screen bg-[#F8F9FA] flex flex-col shadow-2xl relative pb-28">
        {/* ================= TOP HEADER (Image 1) ================= */}
        <div className="bg-[#1E1E1E] text-white px-4 py-4 flex items-center space-x-3 sticky top-0 z-30 shadow-md">
          <button
            type="button"
            onClick={() => router.push(editId ? `/crm/quotations/${editId}` : "/crm/dashboard")}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={editId ? "Back to Quotation Detail" : "Back to Dashboard"}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-white">
            {editId ? "Edit Quotation" : "Make Quotation"}
          </h1>
        </div>

        {/* ================= TOP INFO SECTION (Image 1) ================= */}
        <div className="bg-white p-4 sm:p-5 border-b border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              <span className="block text-[11px] font-medium text-gray-400">Quotation Date</span>
              <input
                type="text"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="font-bold text-gray-900 text-sm focus:outline-none bg-transparent"
              />
            </div>
            <div className="text-right">
              <span className="block text-[11px] font-medium text-gray-400">Quotation No</span>
              <span className="font-bold text-gray-900 text-sm">{quotationNo}</span>
            </div>
          </div>

          <div className="pt-1">
            <input
              type="text"
              value={otherInfo}
              onChange={(e) => setOtherInfo(e.target.value)}
              placeholder="Other Info:"
              className="w-full text-xs text-gray-600 placeholder:text-gray-400 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Validation error if any */}
        {submissionError && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{submissionError}</span>
          </div>
        )}

        {/* ================= MAIN 4 CARDS (Image 1 & 3) ================= */}
        <div className="p-4 space-y-3.5 flex-1">
          {/* 1. TO (CUSTOMER) CARD */}
          {!selectedCustomer ? (
            <button
              type="button"
              onClick={() => setIsCustomerSelectOpen(true)}
              className="w-full bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:border-brand/40 hover:shadow-sm transition-all flex items-center justify-between cursor-pointer group text-left"
            >
              <span className="font-bold text-sm text-gray-900 tracking-wide">
                TO (CUSTOMER)
              </span>
              <div className="w-8 h-8 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus size={18} />
              </div>
            </button>
          ) : (
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-1 relative">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">
                    Customer
                  </span>
                  <h4 className="text-sm font-bold text-gray-900">{selectedCustomer.name}</h4>
                  {selectedCustomer.companyName && (
                    <p className="text-xs text-gray-500">{selectedCustomer.companyName}</p>
                  )}
                  {selectedCustomer.phone && (
                    <p className="text-xs text-gray-400 mt-0.5">{selectedCustomer.phone}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove Customer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 2. PRODUCTS CARD */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsProductSelectOpen(true)}
              className="w-full bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:border-brand/40 hover:shadow-sm transition-all flex items-center justify-between cursor-pointer group text-left"
            >
              <span className="font-bold text-sm text-gray-900 tracking-wide">
                PRODUCTS
              </span>
              <div className="w-8 h-8 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus size={18} />
              </div>
            </button>

            {/* List of Added Products (Image 3) */}
            {selectedItems.length > 0 && (
              <div className="space-y-2 pt-1">
                {selectedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-gray-300 transition-all"
                  >
                    <div
                      onClick={() => openProductConfigurator(item, idx)}
                      className="flex-1 pr-2"
                    >
                      <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Amount: {item.quantity} * ₹{item.unitPrice} = ₹{item.total}
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-gray-400 truncate max-w-[240px] mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. OTHER CHARGE CARD */}
          {!otherCharge ? (
            <button
              type="button"
              onClick={() => {
                setOcLabel("Other Charges");
                setOcAmount("");
                setOcIsTaxable(false);
                setIsOtherChargeOpen(true);
              }}
              className="w-full bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:border-brand/40 hover:shadow-sm transition-all flex items-center justify-between cursor-pointer group text-left"
            >
              <span className="font-bold text-sm text-gray-900 tracking-wide">
                OTHER CHARGE
              </span>
              <div className="w-8 h-8 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus size={18} />
              </div>
            </button>
          ) : (
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">
                  Other Charge
                </span>
                <h4 className="text-sm font-bold text-gray-900">{otherCharge.label}</h4>
                <p className="text-xs text-gray-500">
                  ₹{otherCharge.amount} {otherCharge.isTaxable ? "(+18% GST)" : "(Non-taxable)"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setOcLabel(otherCharge.label);
                    setOcAmount(String(otherCharge.amount));
                    setOcIsTaxable(otherCharge.isTaxable);
                    setIsOtherChargeOpen(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Edit Other Charge"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setOtherCharge(null)}
                  className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove Other Charge"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 4. TERMS & CONDITIONS CARD */}
          <button
            type="button"
            onClick={() => setIsTermsOpen(true)}
            className="w-full bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:border-brand/40 hover:shadow-sm transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div>
              <span className="font-bold text-sm text-gray-900 tracking-wide block">
                TERMS & CONDITIONS
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">
                {selectedTermIds.length} Points Selected
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus size={18} />
            </div>
          </button>
        </div>

        {/* ================= BOTTOM BAR (Image 1) ================= */}
        <div className="fixed bottom-0 w-full max-w-md bg-[#1E1E1E] text-white p-3.5 sm:p-4 flex items-center justify-between rounded-t-3xl shadow-2xl z-40">
          <div>
            <span className="text-[11px] font-medium text-white/70 block">Amount Due</span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              ₹{amountDue.toLocaleString("en-IN")}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGenerateQuotation}
            disabled={isGenerating}
            className="px-8 py-3.5 bg-white hover:bg-gray-100 text-[#1E1E1E] font-bold text-sm rounded-full shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin text-black" />
                <span>{editId ? "Updating..." : "Generating..."}</span>
              </>
            ) : (
              <span>{editId ? "Update Quotation" : "Generate"}</span>
            )}
          </button>
        </div>

        {/* ================= MODAL 1: SELECT CUSTOMER ================= */}
        {isCustomerSelectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Dark Header */}
              <div className="bg-[#1E1E1E] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCustomerSelectOpen(false)}
                    className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-base font-bold text-white">Select Customer</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Plus size={13} />
                  <span>+ Add</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search name, company, phone..."
                    className="w-full bg-[#F4F5F7] pl-9 pr-3.5 py-2.5 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent"
                  />
                </div>
              </div>

              {/* Customer List */}
              <div className="p-3 overflow-y-auto space-y-2 flex-1">
                {filteredCustomers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                    <p>No customers found.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddCustomerOpen(true)}
                      className="px-4 py-2 bg-[#1E1E1E] text-white rounded-xl font-bold"
                    >
                      + Add New Customer
                    </button>
                  </div>
                ) : (
                  filteredCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setIsCustomerSelectOpen(false);
                      }}
                      className="p-3.5 rounded-2xl bg-[#F8F9FA] hover:bg-white border border-gray-200/80 hover:border-brand/40 shadow-xs cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                          {cust.name}
                        </h4>
                        {cust.companyName && (
                          <p className="text-xs text-gray-500">{cust.companyName}</p>
                        )}
                        {cust.phone && <p className="text-[11px] text-gray-400">{cust.phone}</p>}
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-brand transition-colors">
                        Select →
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer Modal: Add Customer */}
        <CustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          onCustomerCreated={(newCust) => {
            setCustomers((prev) => [newCust, ...prev]);
            setSelectedCustomer(newCust);
            setIsAddCustomerOpen(false);
            setIsCustomerSelectOpen(false);
          }}
        />

        {/* ================= MODAL 2: SELECT PRODUCT ================= */}
        {isProductSelectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Dark Header */}
              <div className="bg-[#1E1E1E] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsProductSelectOpen(false)}
                    className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-base font-bold text-white">Select Product</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Plus size={13} />
                  <span>+ Add</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product..."
                    className="w-full bg-[#F4F5F7] pl-9 pr-3.5 py-2.5 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent"
                  />
                </div>
              </div>

              {/* Product List */}
              <div className="p-3 overflow-y-auto space-y-2 flex-1">
                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                    <p>No products found.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddProductOpen(true)}
                      className="px-4 py-2 bg-[#1E1E1E] text-white rounded-xl font-bold"
                    >
                      + Add New Product
                    </button>
                  </div>
                ) : (
                  filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => openProductConfigurator(prod)}
                      className="p-3.5 rounded-2xl bg-[#F8F9FA] hover:bg-white border border-gray-200/80 hover:border-brand/40 shadow-xs cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                          {prod.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ₹{Number(prod.basePrice || prod.price || 0).toLocaleString("en-IN")}
                        </p>
                        {prod.description && (
                          <p className="text-[11px] text-gray-400 truncate max-w-[240px]">
                            {prod.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-brand" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product Modal: Add New Product */}
        <ProductModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          onProductCreated={(newProd) => {
            setAllProducts((prev) => [newProd, ...prev]);
            setIsAddProductOpen(false);
            openProductConfigurator(newProd);
          }}
        />

        {/* ================= MODAL 3: ADD QUOTATION PRODUCT (Image 2) ================= */}
        {isConfiguringProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {/* Dark Header (Image 2) */}
              <div className="bg-[#1E1E1E] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsConfiguringProduct(false)}
                    className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-base font-bold text-white">Add Quotation Product</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductSelectOpen(true)}
                  className="p-1.5 text-white/80 hover:text-white"
                  title="Switch Product"
                >
                  <Search size={18} />
                </button>
              </div>

              {/* Form Content (Image 2) */}
              <form onSubmit={handleSaveProductToQuotation} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
                {/* 1. Product Field with '>' arrow to change product (Image 2) */}
                <div
                  onClick={() => {
                    setIsConfiguringProduct(false);
                    setIsProductSelectOpen(true);
                  }}
                  className="bg-[#F4F5F7] p-3.5 rounded-2xl cursor-pointer flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <span className="block text-xs text-gray-400 font-medium">Product</span>
                    <span className="text-sm font-bold text-gray-900">{cfgName || "Select Product"}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>

                {/* 2. Quantity (Image 2) */}
                <div className="bg-[#F4F5F7] p-3.5 rounded-2xl">
                  <label className="block text-xs text-gray-400 font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={cfgQuantity}
                    onChange={(e) => setCfgQuantity(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm font-bold text-gray-900 focus:outline-none"
                  />
                </div>

                {/* 3. Price (Image 2) */}
                <div className="bg-[#F4F5F7] p-3.5 rounded-2xl">
                  <label className="block text-xs text-gray-400 font-medium mb-1">Price (per unit)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cfgPrice}
                    onChange={(e) => setCfgPrice(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm font-bold text-gray-900 focus:outline-none"
                  />
                </div>

                {/* 4. Description with live char counter (Image 2) */}
                <div>
                  <div className="bg-[#F4F5F7] p-3.5 rounded-2xl">
                    <label className="block text-xs text-gray-400 font-medium mb-1">Description</label>
                    <textarea
                      rows={4}
                      maxLength={2000}
                      value={cfgDescription}
                      onChange={(e) => setCfgDescription(e.target.value)}
                      placeholder="Description"
                      className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="text-right text-xs text-gray-400 mt-1 pr-1 font-medium">
                    {cfgDescription.length}/2000
                  </div>
                </div>

                {/* Bottom Button (Image 2) */}
                <div className="pt-2 pb-1">
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#1E1E1E] hover:bg-black text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    Add To Quotation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL 4: OTHER CHARGE INFO (Image 3) ================= */}
        {isOtherChargeOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom duration-200">
              {/* Sheet Grabber */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />

              <h3 className="text-base font-bold text-gray-900">
                Other Charge Info
              </h3>

              <form onSubmit={handleSaveOtherCharge} className="space-y-3.5">
                {/* Other Charge Label */}
                <div className="bg-[#F4F5F7] p-3.5 rounded-2xl">
                  <label className="block text-xs text-gray-400 font-medium mb-1">
                    Other Charge Label
                  </label>
                  <input
                    type="text"
                    value={ocLabel}
                    onChange={(e) => setOcLabel(e.target.value)}
                    placeholder="Other Charges"
                    required
                    className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                  />
                </div>

                {/* Other Charge Amount */}
                <div className="bg-[#F4F5F7] p-3.5 rounded-2xl">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ocAmount}
                    onChange={(e) => setOcAmount(e.target.value)}
                    placeholder="Other Charge Amount"
                    required
                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>

                {/* Is Taxable Checkbox */}
                <label className="flex items-center justify-between py-1 cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">Is Taxable?</span>
                  <input
                    type="checkbox"
                    checked={ocIsTaxable}
                    onChange={(e) => setOcIsTaxable(e.target.checked)}
                    className="w-5 h-5 rounded-md accent-black cursor-pointer"
                  />
                </label>

                {/* Buttons */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOtherChargeOpen(false)}
                    className="flex-1 py-3.5 border border-gray-300 text-gray-700 font-bold text-sm rounded-2xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-[#1E1E1E] hover:bg-black text-white font-bold text-sm rounded-2xl shadow-md"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL 5: SELECT TERMS AND CONDITIONS (Images 4 & 5) ================= */}
        {isTermsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {/* Dark Header (Image 4 & 5) */}
              <div className="bg-[#1E1E1E] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsTermsOpen(false)}
                    className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-base font-bold text-white truncate max-w-[200px]">
                    Select Terms and C...
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={addNewTermItem}
                    className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-bold text-base cursor-pointer hover:bg-gray-100"
                    title="Add New Term"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Subheader with Quotation tab and Edit Items button (Image 4 & 5) */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="border-b-2 border-cyan-600 pb-1 px-1 font-bold text-sm text-cyan-800">
                  Quotation
                </div>

                {/* Edit Items / Finish Editing toggle (Image 4 & 5) */}
                <button
                  type="button"
                  onClick={() => setIsEditingTerms((prev) => !prev)}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 hover:text-black cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>{isEditingTerms ? "Finish Editing" : "Edit Items"}</span>
                </button>
              </div>

              {/* Select All Row (Image 4 & 5) */}
              <div className="px-4 py-2.5 flex items-center justify-between bg-gray-50/70 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-800">Select All</span>
                <input
                  type="checkbox"
                  checked={selectedTermIds.length === termsList.length && termsList.length > 0}
                  onChange={handleSelectAllTerms}
                  className="w-4 h-4 rounded-md accent-black cursor-pointer"
                />
              </div>

              {/* Terms List (Image 4: Static view, Image 5: Inline editable view) */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {termsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    No terms found. Click "+" on top to add a new term.
                  </div>
                ) : (
                  termsList.map((term) => (
                    <div
                      key={term.id}
                      className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3"
                    >
                      {isEditingTerms ? (
                        /* Image 5: Editable underline input */
                        <input
                          type="text"
                          value={term.text}
                          onChange={(e) => updateTermText(term.id, e.target.value)}
                          placeholder="Enter terms point..."
                          className="w-full border-b border-gray-400 focus:border-black text-sm text-gray-900 py-1 focus:outline-none"
                        />
                      ) : (
                        /* Image 4: Clean text display */
                        <span className="text-sm font-medium text-gray-900 leading-snug">
                          {term.text}
                        </span>
                      )}

                      <input
                        type="checkbox"
                        checked={selectedTermIds.includes(term.id)}
                        onChange={() => handleToggleTerm(term.id)}
                        className="w-5 h-5 rounded-md accent-black shrink-0 cursor-pointer"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* DONE Button (Image 4 & 5) */}
              <div className="p-4 pt-2 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(false)}
                  className="w-full py-3.5 bg-[#1E1E1E] hover:bg-black text-white font-bold text-sm rounded-full shadow-md transition-all cursor-pointer"
                >
                  DONE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MakeQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#1E1E1E] text-white">
          <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
          <p className="text-white/80 font-medium text-sm">Opening Quotation...</p>
        </div>
      }
    >
      <MakeQuotationContent />
    </Suspense>
  );
}
