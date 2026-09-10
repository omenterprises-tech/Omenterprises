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
  Building2,
  Percent,
  PlusCircle,
  HelpCircle,
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
  hsn?: string;
  unit?: string;
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

  // Product Configurator Modal
  const [isConfiguringProduct, setIsConfiguringProduct] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [currentProductObj, setCurrentProductObj] = useState<any | null>(null);
  const [cfgName, setCfgName] = useState("");
  const [cfgQuantity, setCfgQuantity] = useState("1");
  const [cfgPrice, setCfgPrice] = useState("");
  const [cfgDescription, setCfgDescription] = useState("");
  const [cfgTaxPercent, setCfgTaxPercent] = useState("18");
  const [cfgHsn, setCfgHsn] = useState("");
  const [cfgUnit, setCfgUnit] = useState("PCS");

  // Other Charge State
  const [isOtherChargeOpen, setIsOtherChargeOpen] = useState(false);
  const [otherCharge, setOtherCharge] = useState<OtherChargeData | null>(null);
  const [ocLabel, setOcLabel] = useState("Transportation / Delivery Charges");
  const [ocAmount, setOcAmount] = useState("");
  const [ocIsTaxable, setOcIsTaxable] = useState(false);

  // Terms & Conditions State
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
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
        setSelectedTermIds(mappedTerms.map((t) => t.id));

        // Load existing quotation if in edit mode
        if (editId) {
          const qRes = await fetch(`/api/crm/quotations/${editId}`).then((r) => r.json());
          if (qRes.success && qRes.quotation) {
            const q = qRes.quotation;
            setQuotationNo(q.quotationNumber || "-");
            if (q.quotationDate) setQuotationDate(q.quotationDate);
            if (q.notes) setOtherInfo(q.notes);

            setSelectedCustomer({
              id: q.customerId,
              name: q.customerName,
              email: q.customerEmail,
              phone: q.customerPhone,
              addressLine1: q.customerAddress,
              gstin: q.customerGstin,
            });

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
                  hsn: it.hsn || "85446020",
                  unit: it.unit || "PCS",
                }))
              );
            }

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

  // Filtered customers
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

  // Filtered products
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
    setCfgHsn(prod.hsn || "85446020");
    setCfgUnit(prod.unit || "COILS");

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
      hsn: cfgHsn.trim() || "85446020",
      unit: cfgUnit.trim() || "COILS",
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
      alert("Please enter a valid positive amount.");
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

  // Generate / Save Quotation
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
      const selectedTermsFormatted = termsList
        .filter((t) => selectedTermIds.includes(t.id) && t.text.trim())
        .map((t, idx) => `${idx + 1}. ${t.text.trim()}`)
        .join("\n");

      const itemsPayload = selectedItems.map((it) => ({
        name: it.name,
        description: it.name + (it.description ? ` - ${it.description}` : ""),
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        taxPercent: it.taxPercent,
        total: it.total,
        hsn: it.hsn,
        unit: it.unit,
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-600 font-semibold text-sm">Opening Quotation Editor...</p>
      </div>
    );
  }

  const businessName = business?.businessName || "OM ENTERPRISES";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-inter flex flex-col pb-16">
      {/* ================= FULL-SCREEN TOP HEADER (Website Brand Styling) ================= */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => router.push(editId ? `/crm/quotations/${editId}` : "/crm/dashboard")}
                className="p-2 rounded-xl text-gray-500 hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer mr-1"
                title={editId ? "Back to Quotation Detail" : "Back to Dashboard"}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                    {editId ? "Edit Quotation" : "Create New Quotation"}
                  </h1>
                  <span className="text-[10px] bg-brand/10 text-brand font-bold uppercase px-2.5 py-0.5 rounded-full">
                    {editId ? quotationNo : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {businessName} • Formal Client Quotation
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => router.push("/crm/quotations")}
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                View Quotation Ledger
              </button>
              <button
                type="button"
                onClick={handleGenerateQuotation}
                disabled={isGenerating}
                className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{editId ? "Saving..." : "Generating..."}</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>{editId ? "Update Quotation" : "Generate Quotation"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= FULL-SCREEN MAIN WORKSPACE ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Error Notification */}
        {submissionError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-medium animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
            <span>{submissionError}</span>
          </div>
        )}

        {/* Top Info Card: Date, Quote No, Other Info */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Quotation Date
              </label>
              <input
                type="text"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Quotation Number
              </label>
              <div className="px-3.5 py-2.5 bg-gray-100/70 rounded-xl border border-gray-200 text-sm font-bold text-gray-700">
                {quotationNo === "-" ? "Auto-generated on save" : quotationNo}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Other Info / Reference
              </label>
              <input
                type="text"
                value={otherInfo}
                onChange={(e) => setOtherInfo(e.target.value)}
                placeholder="e.g. Inquiry ref, project site, delivery note..."
                className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
            </div>
          </div>
        </div>

        {/* Workspace 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Customer & Products (7 Columns on large screens) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. TO (CUSTOMER) SECTION */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                    <User size={16} />
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                    TO (CUSTOMER)
                  </h3>
                </div>

                {!selectedCustomer ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomerSelectOpen(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Select Customer</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCustomerSelectOpen(true)}
                    className="text-xs font-bold text-brand hover:underline cursor-pointer"
                  >
                    Change Customer
                  </button>
                )}
              </div>

              {!selectedCustomer ? (
                <div
                  onClick={() => setIsCustomerSelectOpen(true)}
                  className="p-8 border-2 border-dashed border-gray-200 hover:border-brand rounded-2xl text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-blue-50/20 group"
                >
                  <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Plus size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">Add Customer to Quotation</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click to select from registered customers or register a new one
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{selectedCustomer.name}</h4>
                      {selectedCustomer.companyName && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-brand rounded-md">
                          {selectedCustomer.companyName}
                        </span>
                      )}
                    </div>
                    {selectedCustomer.addressLine1 && (
                      <p className="text-xs text-gray-600">{selectedCustomer.addressLine1}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-0.5">
                      {selectedCustomer.phone && <span>Phone: {selectedCustomer.phone}</span>}
                      {selectedCustomer.email && <span>Email: {selectedCustomer.email}</span>}
                      {selectedCustomer.gstin && (
                        <span className="font-semibold text-brand">GSTIN: {selectedCustomer.gstin}</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white rounded-xl transition-colors cursor-pointer self-end sm:self-center"
                    title="Remove Customer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* 2. PRODUCTS SECTION */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                    <Package size={16} />
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                    PRODUCTS ({selectedItems.length})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProductSelectOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Add Product</span>
                </button>
              </div>

              {selectedItems.length === 0 ? (
                <div
                  onClick={() => setIsProductSelectOpen(true)}
                  className="p-8 border-2 border-dashed border-gray-200 hover:border-brand rounded-2xl text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-blue-50/20 group"
                >
                  <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Plus size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">Add Products / Services</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select from catalog with custom quantities, rates, and notes
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 font-extrabold text-gray-700 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3 text-center w-10">#</th>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-center w-16">HSN</th>
                        <th className="p-3 text-center w-20">Qty</th>
                        <th className="p-3 text-right w-24">Rate (₹)</th>
                        <th className="p-3 text-center w-16">GST %</th>
                        <th className="p-3 text-right w-28">Amount (₹)</th>
                        <th className="p-3 text-center w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-3 text-center font-medium text-gray-400">{idx + 1}</td>
                          <td className="p-3">
                            <span className="font-bold text-gray-900 block">{item.name}</span>
                            {item.description && (
                              <span className="text-[11px] text-gray-500 font-normal block mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center text-gray-500">{item.hsn || "85446020"}</td>
                          <td className="p-3 text-center font-bold text-gray-800">
                            {item.quantity} <span className="text-[10px] text-gray-500 uppercase">{item.unit || "COILS"}</span>
                          </td>
                          <td className="p-3 text-right font-medium text-gray-800">
                            ₹{item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center font-medium text-gray-600">{item.taxPercent}%</td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            ₹{item.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => openProductConfigurator(item, idx)}
                                className="p-1 text-gray-400 hover:text-brand transition-colors cursor-pointer"
                                title="Edit Item"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedItems((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove Item"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3. TERMS & CONDITIONS SECTION */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                      TERMS & CONDITIONS
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedTermIds.length} of {termsList.length} clauses selected for quote
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingTerms((prev) => !prev)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>{isEditingTerms ? "Finish Editing" : "Edit Points"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={addNewTermItem}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>+ Add Clause</span>
                  </button>
                </div>
              </div>

              {/* Select All Checkbox */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-700">
                <span>Select All Clauses</span>
                <input
                  type="checkbox"
                  checked={selectedTermIds.length === termsList.length && termsList.length > 0}
                  onChange={handleSelectAllTerms}
                  className="w-4 h-4 rounded-md accent-brand cursor-pointer"
                />
              </div>

              {/* Terms Points Checklist */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {termsList.map((term) => (
                  <div
                    key={term.id}
                    className="p-3 bg-white rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between gap-3 hover:border-gray-300 transition-all"
                  >
                    {isEditingTerms ? (
                      <input
                        type="text"
                        value={term.text}
                        onChange={(e) => updateTermText(term.id, e.target.value)}
                        placeholder="Type terms condition clause..."
                        className="w-full border-b border-gray-300 focus:border-brand text-xs text-gray-900 py-1 focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-800 leading-snug">
                        {term.text}
                      </span>
                    )}

                    <input
                      type="checkbox"
                      checked={selectedTermIds.includes(term.id)}
                      onChange={() => handleToggleTerm(term.id)}
                      className="w-4 h-4 rounded-md accent-brand shrink-0 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Financial Summary & Other Charges (4 Columns on large screens) */}
          <div className="lg:col-span-4 space-y-6">
            {/* OTHER CHARGE CARD */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold">
                    <DollarSign size={14} />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Other Charges
                  </h4>
                </div>

                {!otherCharge && (
                  <button
                    type="button"
                    onClick={() => {
                      setOcLabel("Transportation / Delivery Charges");
                      setOcAmount("");
                      setOcIsTaxable(false);
                      setIsOtherChargeOpen(true);
                    }}
                    className="text-xs font-bold text-brand hover:underline cursor-pointer"
                  >
                    + Add Charge
                  </button>
                )}
              </div>

              {!otherCharge ? (
                <p className="text-xs text-gray-500">
                  Add optional freight, insurance, packaging, or installation charges.
                </p>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{otherCharge.label}</span>
                    <span className="text-[11px] text-gray-500">
                      ₹{otherCharge.amount.toLocaleString("en-IN")}{" "}
                      {otherCharge.isTaxable ? "(+18% GST applicable)" : "(Non-taxable)"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOcLabel(otherCharge.label);
                        setOcAmount(String(otherCharge.amount));
                        setOcIsTaxable(otherCharge.isTaxable);
                        setIsOtherChargeOpen(true);
                      }}
                      className="p-1 text-gray-400 hover:text-brand"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtherCharge(null)}
                      className="p-1 text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* FINANCIAL TOTALS SUMMARY CARD */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-md space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2.5">
                Quotation Financial Breakdown
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal ({selectedItems.length}):</span>
                  <span className="font-semibold text-gray-900">
                    ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {otherCharge && Number(otherCharge.amount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{otherCharge.label}:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{otherCharge.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Tax Amount (GST):</span>
                  <span className="font-semibold text-gray-900">
                    ₹{taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm font-black text-brand">
                  <span>Total Amount Due:</span>
                  <span className="text-lg text-brand">
                    ₹{amountDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleGenerateQuotation}
                  disabled={isGenerating}
                  className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{editId ? "Updating Quotation..." : "Generating Quotation..."}</span>
                    </>
                  ) : (
                    <span>{editId ? "Update Quotation" : "Generate Official Quotation"}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push(editId ? `/crm/quotations/${editId}` : "/crm/dashboard")}
                  className="w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= MODAL 1: SELECT CUSTOMER ================= */}
      {isCustomerSelectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="bg-brand text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Select Client / Customer</h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ New Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomerSelectOpen(false)}
                  className="p-1 rounded-full text-white/80 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer by name, company, phone, email..."
                  className="w-full bg-gray-50 pl-10 pr-4 py-2.5 rounded-xl text-xs text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:border-brand"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {filteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                  <p>No customers found matching your search.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerOpen(true)}
                    className="px-4 py-2 bg-brand text-white rounded-xl font-bold cursor-pointer"
                  >
                    + Register New Customer
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
                    className="p-3.5 rounded-2xl bg-gray-50 hover:bg-blue-50/50 border border-gray-200 hover:border-brand/40 shadow-xs cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand">
                          {cust.name}
                        </h4>
                        {cust.companyName && (
                          <span className="text-[11px] px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md font-medium">
                            {cust.companyName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                        {cust.phone && <span>{cust.phone}</span>}
                        {cust.email && <span>{cust.email}</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-brand" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Registration Modal Component */}
      <CustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onCustomerCreated={(newCust: any) => {
          setCustomers((prev) => [newCust, ...prev]);
          setSelectedCustomer(newCust);
          setIsAddCustomerOpen(false);
          setIsCustomerSelectOpen(false);
        }}
      />

      {/* ================= MODAL 2: SELECT PRODUCT ================= */}
      {isProductSelectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="bg-brand text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Select Product from Catalog</h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ New Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductSelectOpen(false)}
                  className="p-1 rounded-full text-white/80 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by title, category, description..."
                  className="w-full bg-gray-50 pl-10 pr-4 py-2.5 rounded-xl text-xs text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:border-brand"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                  <p>No products found matching your catalog search.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    className="px-4 py-2 bg-brand text-white rounded-xl font-bold cursor-pointer"
                  >
                    + Add New Product
                  </button>
                </div>
              ) : (
                filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => openProductConfigurator(prod)}
                    className="p-3.5 rounded-2xl bg-gray-50 hover:bg-blue-50/50 border border-gray-200 hover:border-brand/40 shadow-xs cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand">
                        {prod.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Base Rate: ₹{prod.basePrice || prod.price || 0} | GST: {prod.gst || 18}% | {prod.unit || "COILS"}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-brand" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Registration Modal Component */}
      <ProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onProductCreated={(newProd: any) => {
          setAllProducts((prev) => [newProd, ...prev]);
          setIsAddProductOpen(false);
          openProductConfigurator(newProd);
        }}
      />

      {/* ================= MODAL 3: PRODUCT CONFIGURATOR ================= */}
      {isConfiguringProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Configure Quotation Item</h3>
              <button
                type="button"
                onClick={() => setIsConfiguringProduct(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProductToQuotation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  value={cfgName}
                  onChange={(e) => setCfgName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={cfgQuantity}
                    onChange={(e) => setCfgQuantity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price per Unit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cfgPrice}
                    onChange={(e) => setCfgPrice(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={cfgHsn}
                    onChange={(e) => setCfgHsn(e.target.value)}
                    placeholder="85446020"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unit / Measure</label>
                  <input
                    type="text"
                    value={cfgUnit}
                    onChange={(e) => setCfgUnit(e.target.value)}
                    placeholder="COILS / PCS"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-brand uppercase"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700">Specifications / Description</label>
                  <span className="text-[10px] text-gray-400">{cfgDescription.length}/2000</span>
                </div>
                <textarea
                  value={cfgDescription}
                  onChange={(e) => setCfgDescription(e.target.value.slice(0, 2000))}
                  rows={3}
                  placeholder="Enter specifications, technical details, or notes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfiguringProduct(false)}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Add To Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: OTHER CHARGE INFO ================= */}
      {isOtherChargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Other Charge Details</h3>
              <button
                type="button"
                onClick={() => setIsOtherChargeOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOtherCharge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Charge Label</label>
                <input
                  type="text"
                  value={ocLabel}
                  onChange={(e) => setOcLabel(e.target.value)}
                  placeholder="e.g. Delivery Charge, Packaging, Freight"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ocAmount}
                  onChange={(e) => setOcAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="oc-taxable"
                  checked={ocIsTaxable}
                  onChange={(e) => setOcIsTaxable(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-brand cursor-pointer"
                />
                <label htmlFor="oc-taxable" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Is Taxable (Apply 18% GST)
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOtherChargeOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Save Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MakeQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
          <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
          <p className="text-gray-600 font-semibold text-sm">Opening Quotation Editor...</p>
        </div>
      }
    >
      <MakeQuotationContent />
    </Suspense>
  );
}
