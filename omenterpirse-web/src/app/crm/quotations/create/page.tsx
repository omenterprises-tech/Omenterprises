"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Edit3,
  Loader2,
  Check,
  X,
  User,
  Package,
  FileText,
  DollarSign,
  AlertCircle,
  Calculator,
  Building2,
  ChevronRight,
  FolderTree,
  Layers,
} from "lucide-react";
import CustomerModal from "@/components/crm/CustomerModal";
import ProductModal from "@/components/crm/ProductModal";
import { formatDateWithPattern, formatDisplayDate } from "@/lib/crmCurrencyData";
import { alphabeticalCompare } from "@/lib/utils";

// Helper to safely extract full category hierarchy path from product
function getProductHierarchy(prod: any): string[] {
  try {
    let specs = prod.specifications;
    if (typeof specs === "string") {
      specs = JSON.parse(specs);
    }
    if (specs && Array.isArray(specs.hierarchy) && specs.hierarchy.length > 0) {
      const clean = specs.hierarchy.map((h: any) => String(h).trim()).filter(Boolean);
      if (clean.length > 0) return clean;
    }
  } catch (e) {}

  const cat = (prod.category || "General").trim() || "General";
  return [cat];
}

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

  // 1. Customer State & Selection Page View
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // 2. Products State & Selection Page View
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryPath, setProductCategoryPath] = useState<string[]>([]);

  // Product Configurator Modal
  const [isConfiguringProduct, setIsConfiguringProduct] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [currentProductObj, setCurrentProductObj] = useState<any | null>(null);
  const [cfgName, setCfgName] = useState("");
  const [cfgQuantity, setCfgQuantity] = useState("1");
  const [cfgPrice, setCfgPrice] = useState("");
  const [cfgDescription, setCfgDescription] = useState("");
  const [cfgTaxPercent, setCfgTaxPercent] = useState("");
  const [cfgHsn, setCfgHsn] = useState("");
  const [cfgUnit, setCfgUnit] = useState("COILS");

  // 3. Other Charge State
  const [isOtherChargeOpen, setIsOtherChargeOpen] = useState(false);
  const [otherCharge, setOtherCharge] = useState<OtherChargeData | null>(null);
  const [ocLabel, setOcLabel] = useState("Transportation / Delivery Charges");
  const [ocAmount, setOcAmount] = useState("");
  const [ocIsTaxable, setOcIsTaxable] = useState(false);

  // 4. Terms & Conditions State & Selection Page View
  const [isTermsPageOpen, setIsTermsPageOpen] = useState(false);
  const [termsList, setTermsList] = useState<TermItem[]>([]);
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);
  const [isEditingTerms, setIsEditingTerms] = useState(false);

  // 5. Round Off State
  const [isRoundOff, setIsRoundOff] = useState(true);

  // Submission State
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
        if (!editId && data.business?.dateFormat) {
          setQuotationDate(formatDateWithPattern(data.business.dateFormat, new Date()));
        }

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
        // Do not select any terms and conditions by default per user requirement
        setSelectedTermIds([]);

        // Load existing quotation if in edit mode
        if (editId) {
          const qRes = await fetch(`/api/crm/quotations/${editId}`).then((r) => r.json());
          if (qRes.success && qRes.quotation) {
            const q = qRes.quotation;
            setQuotationNo(q.quotationNumber || "-");
            if (q.quotationDate) setQuotationDate(formatDisplayDate(q.quotationDate, data.business?.dateFormat));
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
                parsedItems.map((it: any, i: number) => {
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

                  return {
                    id: it.id || `item-${i}-${Date.now()}`,
                    name: displayName,
                    description: cleanedDesc,
                    quantity: Number(it.quantity) || 1,
                    unitPrice: Number(it.unitPrice) || 0,
                    taxPercent:
                      it.taxPercent !== undefined && it.taxPercent !== null
                        ? Number(it.taxPercent)
                        : 0,
                    total:
                      Number(it.total) ||
                      (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
                    hsn: it.hsn && it.hsn.trim() !== "-" ? it.hsn.trim() : "",
                    unit: it.unit || "PCS",
                  };
                })
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

  // Financial Calculations
  const subtotal = useMemo(() => {
    return selectedItems.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
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

  const rawAmountDue = useMemo(() => {
    return subtotal + otherChargeAmount + taxTotal;
  }, [subtotal, otherChargeAmount, taxTotal]);

  const roundOffDifference = useMemo(() => {
    if (!isRoundOff) return 0;
    const rounded = Math.round(rawAmountDue);
    return Math.round((rounded - rawAmountDue) * 100) / 100;
  }, [rawAmountDue, isRoundOff]);

  const amountDue = useMemo(() => {
    if (isRoundOff) {
      return Math.round(rawAmountDue);
    }
    return Math.round(rawAmountDue * 100) / 100;
  }, [rawAmountDue, isRoundOff]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.gstin?.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  // 1. All products matching the current category drill-down path
  const currentLevelProducts = useMemo(() => {
    if (productCategoryPath.length === 0) return allProducts;
    return allProducts.filter((prod) => {
      const hier = getProductHierarchy(prod);
      if (hier.length < productCategoryPath.length) return false;
      for (let i = 0; i < productCategoryPath.length; i++) {
        if (hier[i].toLowerCase() !== productCategoryPath[i].toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [allProducts, productCategoryPath]);

  // 2. Next-level sub-category groups and leaf products for drill-down navigation
  const { subCategoryGroups, leafProducts } = useMemo(() => {
    const depth = productCategoryPath.length;
    const subCatMap: Record<string, any[]> = {};
    const directLeaves: any[] = [];

    for (const prod of currentLevelProducts) {
      const hier = getProductHierarchy(prod);
      if (hier.length <= depth) {
        directLeaves.push(prod);
      } else {
        const nextSegment = hier[depth];
        if (!subCatMap[nextSegment]) {
          subCatMap[nextSegment] = [];
        }
        subCatMap[nextSegment].push(prod);
      }
    }

    const groups: Array<{
      name: string;
      count: number;
      products: any[];
    }> = [];

    const finalLeaves = [...directLeaves];

    for (const [name, prods] of Object.entries(subCatMap)) {
      if (depth === 0) {
        // Main categories level: always display as category cards
        groups.push({
          name,
          count: prods.length,
          products: prods,
        });
      } else {
        // Check if any product in this group has deeper hierarchy levels beyond depth + 1
        const hasDeeper = prods.some((p) => getProductHierarchy(p).length > depth + 1);
        if (hasDeeper) {
          groups.push({
            name,
            count: prods.length,
            products: prods,
          });
        } else {
          // Hierarchy has ended for this branch! Each product is a selectable final leaf
          for (const p of prods) {
            if (!finalLeaves.some((fl) => fl.id === p.id)) {
              finalLeaves.push(p);
            }
          }
        }
      }
    }

    groups.sort((a, b) => alphabeticalCompare(a.name, b.name));
    finalLeaves.sort((a, b) => alphabeticalCompare(a.name || "", b.name || ""));

    return { subCategoryGroups: groups, leafProducts: finalLeaves };
  }, [currentLevelProducts, productCategoryPath]);

  // 3. Search results across all products when productSearch is active
  const searchResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase().trim();
    return allProducts
      .filter((p) => {
        const hier = getProductHierarchy(p);
        const hierMatch = hier.some((h) => h.toLowerCase().includes(q));
        const nameMatch = p.name?.toLowerCase().includes(q);
        const catMatch = p.category?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        return hierMatch || nameMatch || catMatch || descMatch;
      })
      .sort((a, b) => alphabeticalCompare(a.name || "", b.name || ""));
  }, [allProducts, productSearch]);

  // Product Selection Handlers
  const openProductSelection = () => {
    setProductCategoryPath([]);
    setProductSearch("");
    setIsProductSelectOpen(true);
  };

  const openProductConfigurator = (prod: any, editIndex: number | null = null) => {
    setCurrentProductObj(prod);
    setEditingItemIndex(editIndex);
    setCfgName(prod.name || "");
    setCfgPrice(
      prod.unitPrice !== undefined
        ? String(prod.unitPrice)
        : prod.basePrice !== undefined
        ? String(prod.basePrice)
        : prod.price !== undefined
        ? String(prod.price)
        : "0"
    );
    setCfgQuantity(
      editIndex !== null && selectedItems[editIndex]
        ? String(selectedItems[editIndex].quantity)
        : prod.quantity !== undefined
        ? String(prod.quantity)
        : "1"
    );
    setCfgDescription(prod.description || "");
    setCfgTaxPercent(
      prod.taxPercent !== undefined && prod.taxPercent !== null
        ? String(prod.taxPercent)
        : prod.gst !== undefined && prod.gst !== null
        ? String(prod.gst)
        : ""
    );
    setCfgHsn(prod.hsn && prod.hsn !== "-" ? prod.hsn : "");
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
      productId: currentProductObj?.id || (editingItemIndex !== null ? selectedItems[editingItemIndex]?.productId : undefined),
      name: cfgName.trim() || currentProductObj?.name || "Item",
      quantity: qty,
      unitPrice,
      description: cfgDescription.trim(),
      taxPercent: taxRate,
      total,
      hsn: cfgHsn.trim() && cfgHsn.trim() !== "-" ? cfgHsn.trim() : "",
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

  const removeTermItem = (id: string) => {
    setTermsList((prev) => prev.filter((t) => t.id !== id));
    setSelectedTermIds((prev) => prev.filter((item) => item !== id));
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
      setSubmissionError("Please select a customer under 'TO (CUSTOMER)' for this quotation.");
      return;
    }

    if (selectedItems.length === 0) {
      setSubmissionError("Please add at least one product under 'PRODUCTS'.");
      return;
    }

    setIsGenerating(true);

    try {
      const selectedTermsFormatted = termsList
        .filter((t) => selectedTermIds.includes(t.id) && t.text.trim())
        .map((t, idx) => `${idx + 1}. ${t.text.trim()}`)
        .join("\n");

      const itemsPayload = selectedItems.map((it) => {
        const displayName = it.name?.trim() || "Item";
        let rawDesc = (it.description || "").trim();
        let cleanedDesc = rawDesc;
        if (rawDesc.toLowerCase() === displayName.toLowerCase()) {
          cleanedDesc = "";
        } else if (rawDesc.toLowerCase().startsWith((displayName + " - ").toLowerCase())) {
          cleanedDesc = rawDesc.slice(displayName.length + 3).trim();
        } else if (rawDesc.toLowerCase().startsWith(displayName.toLowerCase())) {
          cleanedDesc = rawDesc.slice(displayName.length).replace(/^[-–—:\s]+/, "").trim();
        }

        return {
          name: displayName,
          description: cleanedDesc || null,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxPercent: it.taxPercent,
          total: it.total,
          hsn: it.hsn && it.hsn.trim() !== "" && it.hsn.trim() !== "-" ? it.hsn.trim() : null,
          unit: it.unit,
        };
      });

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
        quotationDate: formatDisplayDate(quotationDate, business?.dateFormat),
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

  // =========================================================================
  // VIEW 1: DEDICATED NEW PAGE FOR CUSTOMER SELECTION
  // =========================================================================
  if (isCustomerSelectOpen) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-inter flex flex-col pb-16">
        {/* Full-Screen Sticky Header */}
        <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCustomerSelectOpen(false)}
                  className="p-2 rounded-xl text-gray-500 hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer mr-1"
                  title="Back to Quotation"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                    Select Customer
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    {customers.length} registered customers • Choose customer for quotation
                  </p>
                </div>
              </div>

              {/* Add Customer Button in page header */}
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(true)}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus size={15} />
                <span>Add Customer</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Page Workspace */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-gray-200/80 shadow-xs">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customers by name, company, phone, email, GSTIN..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:border-brand transition-all"
                autoFocus
              />
              {customerSearch && (
                <button
                  type="button"
                  onClick={() => setCustomerSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Customer Directory List / Grid */}
          {filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
                <User size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {customerSearch ? "No matching customers found" : "No customers registered yet"}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  {customerSearch
                    ? `No customer found for "${customerSearch}". You can clear your search or add a new customer.`
                    : "Add your first client to start creating professional quotations."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(true)}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <Plus size={15} />
                <span>Add Customer</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCustomers.map((cust) => {
                const isCurrentlySelected = selectedCustomer?.id === cust.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setIsCustomerSelectOpen(false);
                    }}
                    className={`p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md ${
                      isCurrentlySelected
                        ? "bg-blue-50/70 border-brand ring-2 ring-brand/20"
                        : "bg-white border-gray-200/80 hover:border-brand/60 hover:bg-blue-50/20"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                            {cust.name}
                          </h4>
                          {cust.companyName && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-brand rounded-md">
                              <Building2 size={12} />
                              <span>{cust.companyName}</span>
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                            isCurrentlySelected
                              ? "bg-brand text-white"
                              : "bg-gray-100 text-gray-700 group-hover:bg-brand group-hover:text-white"
                          }`}
                        >
                          {isCurrentlySelected ? "Selected" : "Select"}
                        </span>
                      </div>

                      {cust.addressLine1 && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {cust.addressLine1}
                          {cust.city ? `, ${cust.city}` : ""}
                          {cust.state ? `, ${cust.state}` : ""}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-2 border-t border-gray-100">
                        {cust.phone && <span>📞 {cust.phone}</span>}
                        {cust.email && <span>✉ {cust.email}</span>}
                        {cust.gstin && (
                          <span className="font-semibold text-brand">GSTIN: {cust.gstin}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Customer Modal Component for creating new customers on this page */}
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
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DEDICATED NEW PAGE FOR PRODUCT SELECTION FROM CATALOG
  // =========================================================================
  if (isProductSelectOpen) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-inter flex flex-col pb-16">
        {/* Full-Screen Sticky Header */}
        <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsProductSelectOpen(false)}
                  className="p-2 rounded-xl text-gray-500 hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer mr-1"
                  title="Back to Quotation"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                    Select Product from Catalog
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    {allProducts.length} catalog products • Choose product to add
                  </p>
                </div>
              </div>

              {/* Add New Product Button in page header */}
              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus size={15} />
                <span>New Product</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Page Workspace */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-gray-200/80 shadow-xs">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by title, category, description, specifications..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:border-brand transition-all"
                autoFocus
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Catalog Empty State */}
          {allProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
                <Package size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  No products registered in catalog
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Add your first commercial product to build quotations effortlessly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <Plus size={15} />
                <span>Add Product</span>
              </button>
            </div>
          ) : productSearch.trim() ? (
            /* Search Results View */
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 font-inter">
                    Search Results
                  </h3>
                  <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {searchResults.length} {searchResults.length === 1 ? "Product" : "Products"} found
                  </span>
                </div>
              </div>

              {searchResults.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                    <Search size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">
                    No products match &ldquo;{productSearch}&rdquo;
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Try searching with another keyword or clear the search bar.
                  </p>
                  <button
                    type="button"
                    onClick={() => setProductSearch("")}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((prod) => {
                    const hier = getProductHierarchy(prod);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => openProductConfigurator(prod)}
                        className="p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-200/90 hover:border-brand hover:bg-blue-50/10 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          {hier.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-500 font-medium">
                              {hier.map((step, sIdx) => (
                                <React.Fragment key={sIdx}>
                                  {sIdx > 0 && <span className="text-gray-300">›</span>}
                                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md text-[10px]">
                                    {step}
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                                {prod.name}
                              </h4>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-base font-black text-brand">
                                ₹{Number(prod.basePrice || prod.price || 0).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-gray-500 block uppercase font-bold">
                                per {prod.unit || "COILS"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                            <div className="flex items-center space-x-3">
                              {prod.hsn && prod.hsn.trim() !== "-" && <span>HSN: {prod.hsn}</span>}
                              {prod.gst !== undefined && prod.gst !== null && prod.gst > 0 && (
                                <span>GST: {prod.gst}%</span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-brand group-hover:underline inline-flex items-center space-x-1">
                              <span>Select & Configure</span>
                              <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Hierarchical Card Drill-Down View */
            <div className="space-y-6">
              {/* Breadcrumb Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {productCategoryPath.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setProductCategoryPath((prev) => prev.slice(0, -1))}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer mr-1"
                      title="Go back one level"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setProductCategoryPath([])}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      productCategoryPath.length === 0
                        ? "bg-brand text-white shadow-xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All Categories
                  </button>

                  {productCategoryPath.map((cat, idx) => {
                    const isCurrent = idx === productCategoryPath.length - 1;
                    return (
                      <React.Fragment key={idx}>
                        <ChevronRight size={14} className="text-gray-400 shrink-0" />
                        <button
                          type="button"
                          onClick={() => setProductCategoryPath(productCategoryPath.slice(0, idx + 1))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-brand text-white shadow-xs"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {cat}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  {currentLevelProducts.length} {currentLevelProducts.length === 1 ? "Product" : "Products"} available
                </div>
              </div>

              {/* 1. Next-Level Category / Sub-Category Cards */}
              {subCategoryGroups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 px-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 font-inter">
                      {productCategoryPath.length === 0
                        ? "Main Categories"
                        : `Sub-Categories in ${productCategoryPath[productCategoryPath.length - 1]}`}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {subCategoryGroups.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {subCategoryGroups.map((group) => (
                      <div
                        key={group.name}
                        onClick={() => setProductCategoryPath([...productCategoryPath, group.name])}
                        className="p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-200/90 hover:border-brand hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-brand group-hover:text-white transition-all shadow-xs">
                            {productCategoryPath.length === 0 ? <Layers size={20} /> : <FolderTree size={20} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors truncate">
                              {group.name}
                            </h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {group.count} {group.count === 1 ? "product" : "products"}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-brand/10 text-gray-400 group-hover:text-brand flex items-center justify-center transition-colors shrink-0">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Leaf Products / Final Level Cards */}
              {leafProducts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 px-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 font-inter">
                      {subCategoryGroups.length > 0 ? "Products / Variants" : "Select Product"}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {leafProducts.length} {leafProducts.length === 1 ? "Product" : "Products"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {leafProducts.map((prod) => {
                      const hier = getProductHierarchy(prod);
                      const leafLabel = hier.length > 0 ? hier[hier.length - 1] : prod.name;

                      return (
                        <div
                          key={prod.id}
                          onClick={() => openProductConfigurator(prod)}
                          className="p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-200/90 hover:border-brand hover:bg-blue-50/10 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                                  {leafLabel}
                                </h4>
                                {prod.name && prod.name !== leafLabel && (
                                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 font-medium">
                                    {prod.name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-base font-black text-brand">
                                  ₹{Number(prod.basePrice || prod.price || 0).toLocaleString("en-IN")}
                                </span>
                                <span className="text-[10px] text-gray-500 block uppercase font-bold">
                                  per {prod.unit || "COILS"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                              <div className="flex items-center space-x-3">
                                {prod.hsn && prod.hsn.trim() !== "-" && <span>HSN: {prod.hsn}</span>}
                                {prod.gst !== undefined && prod.gst !== null && prod.gst > 0 && (
                                  <span>GST: {prod.gst}%</span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-brand group-hover:underline inline-flex items-center space-x-1">
                                <span>Select & Configure</span>
                                <ChevronRight size={14} />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty Category State */}
              {subCategoryGroups.length === 0 && leafProducts.length === 0 && (
                <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
                    <Package size={28} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      No products found in this category
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                      There are no products configured under &ldquo;{productCategoryPath.join(" > ")}&rdquo;.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductCategoryPath([])}
                    className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                  >
                    <span>Back to All Categories</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Product Modal Component for creating new products on this page */}
        <ProductModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          onProductCreated={(newProd: any) => {
            setAllProducts((prev) => [newProd, ...prev]);
            setIsAddProductOpen(false);
            openProductConfigurator(newProd);
          }}
          onProductsCreated={(newProds: any[]) => {
            setAllProducts((prev) => [...newProds, ...prev]);
            setIsAddProductOpen(false);
            setProductCategoryPath([]);
            setProductSearch("");
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: DEDICATED NEW PAGE FOR TERMS & CONDITIONS SELECTION
  // =========================================================================
  if (isTermsPageOpen) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-inter flex flex-col pb-28">
        {/* Full-Screen Sticky Header */}
        <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTermsPageOpen(false)}
                  className="p-2 rounded-xl text-gray-500 hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer mr-1"
                  title="Back to Quotation"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                    Select Terms & Conditions
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    {selectedTermIds.length} of {termsList.length} clauses selected for quotation
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingTerms((prev) => !prev)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>{isEditingTerms ? "Finish Editing" : "Edit Points"}</span>
                </button>
                <button
                  type="button"
                  onClick={addNewTermItem}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-brand hover:text-white text-gray-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  title="Add Clause"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsTermsPageOpen(false)}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center space-x-1 cursor-pointer ml-1"
                >
                  <Check size={14} />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Terms Content */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4">
          {/* Select All Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Select All Clauses</h3>
              <p className="text-xs text-gray-500">Include all standard terms in quotation</p>
            </div>
            <input
              type="checkbox"
              checked={selectedTermIds.length === termsList.length && termsList.length > 0}
              onChange={handleSelectAllTerms}
              className="w-5 h-5 rounded-md accent-brand cursor-pointer"
            />
          </div>

          {/* List of Clauses */}
          <div className="space-y-3">
            {termsList.map((term, idx) => (
              <div
                key={term.id}
                className={`p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border shadow-xs flex items-center justify-between gap-4 transition-all ${
                  selectedTermIds.includes(term.id)
                    ? "border-brand/40 bg-blue-50/10"
                    : "border-gray-200/80 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{idx + 1}.</span>
                  {isEditingTerms ? (
                    <input
                      type="text"
                      value={term.text}
                      onChange={(e) => updateTermText(term.id, e.target.value)}
                      placeholder="Type terms condition clause..."
                      className="w-full border-b border-gray-300 focus:border-brand text-xs sm:text-sm text-gray-900 py-1.5 focus:outline-none"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">
                      {term.text}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2.5 shrink-0">
                  {isEditingTerms && (
                    <button
                      type="button"
                      onClick={() => removeTermItem(term.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Clause"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <input
                    type="checkbox"
                    checked={selectedTermIds.includes(term.id)}
                    onChange={() => handleToggleTerm(term.id)}
                    className="w-5 h-5 rounded-md accent-brand cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Add Clause Quick Button */}
          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={addNewTermItem}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200/90 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Add New Clause</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTermsPageOpen(false)}
              className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Done ({selectedTermIds.length} Selected)
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: MAIN MAKE QUOTATION PAGE (EXACT ORDER + CLEAN CARDS)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-inter flex flex-col pb-36 sm:pb-32">
      {/* ================= FULL-SCREEN TOP HEADER (Website Brand Styling) ================= */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    {editId ? "Edit Quotation" : "Make Quotation"}
                  </h1>
                  <span className="text-[10px] bg-brand/10 text-brand font-bold uppercase px-2.5 py-0.5 rounded-full">
                    {editId ? quotationNo : "New"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {businessName} • Formal Quotation Generator
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => router.push("/crm/quotations")}
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Quotation Ledger
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN VERTICAL STACK ================= */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
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
                Quotation No
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

        {/* ---------------- 1. TO (CUSTOMER) CARD ---------------- */}
        {!selectedCustomer ? (
          <div
            onClick={() => setIsCustomerSelectOpen(true)}
            className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs hover:border-brand/50 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight group-hover:text-brand transition-colors">
                  TO (CUSTOMER)
                </h2>
                <p className="text-xs text-gray-500">Tap to select existing customer or add new</p>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-brand group-hover:text-white text-gray-700 flex items-center justify-center transition-all shadow-xs shrink-0">
              <Plus size={18} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <User size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    TO (CUSTOMER)
                  </h2>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerSelectOpen(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Remove Customer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">{selectedCustomer.name}</h3>
                {selectedCustomer.companyName && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-100 text-brand rounded-md">
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
          </div>
        )}

        {/* ---------------- 2. PRODUCTS CARD ---------------- */}
        {selectedItems.length === 0 ? (
          <div
            onClick={openProductSelection}
            className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs hover:border-brand/50 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight group-hover:text-brand transition-colors">
                  PRODUCTS
                </h2>
                <p className="text-xs text-gray-500">Tap to select products from catalog</p>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-brand group-hover:text-white text-gray-700 flex items-center justify-center transition-all shadow-xs shrink-0">
              <Plus size={18} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <Package size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    PRODUCTS ({selectedItems.length})
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={openProductSelection}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-brand hover:text-white text-gray-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Add More Products"
              >
                <Plus size={16} />
              </button>
            </div>

            {(() => {
              const hasAnyHsn = selectedItems.some(
                (item) => item.hsn && item.hsn.trim() !== "" && item.hsn.trim() !== "-"
              );

              return (
                <div className="space-y-3">
                  <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 font-extrabold text-gray-700 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="p-3 text-center w-10">#</th>
                          <th className="p-3">Item Description</th>
                          {hasAnyHsn && <th className="p-3 text-center w-16">HSN</th>}
                          <th className="p-3 text-center w-20">Qty</th>
                          <th className="p-3 text-right w-28">Price (₹)</th>
                          <th className="p-3 text-right w-24">GST</th>
                          <th className="p-3 text-right w-28">Total (₹)</th>
                          <th className="p-3 text-center w-16">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedItems.map((item, idx) => {
                          const displayName = item.name?.trim() || "Item";
                          let rawDesc = (item.description || "").trim();
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

                          const basePrice = item.quantity * item.unitPrice;
                          const gstAmount = (basePrice * (item.taxPercent || 0)) / 100;
                          const rowTotal = basePrice + gstAmount;

                          return (
                            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="p-3 text-center font-medium text-gray-400">{idx + 1}</td>
                              <td className="p-3">
                                <span className="font-bold text-gray-900 block">{displayName}</span>
                                {cleanedDesc ? (
                                  <span className="text-[11px] text-gray-500 font-normal block mt-0.5">
                                    {cleanedDesc}
                                  </span>
                                ) : null}
                              </td>
                              {hasAnyHsn && (
                                <td className="p-3 text-center text-gray-500">
                                  {item.hsn && item.hsn.trim() !== "-" ? item.hsn.trim() : ""}
                                </td>
                              )}
                              <td className="p-3 text-center font-bold text-gray-800">
                                {item.quantity} <span className="text-[10px] text-gray-500 uppercase">{item.unit || "COILS"}</span>
                              </td>
                              <td className="p-3 text-right font-medium text-gray-800">
                                ₹{basePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right font-medium text-gray-600">
                                <div>₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                                <div className="text-[10px] text-gray-400 font-normal">
                                  {(item.taxPercent || 0).toFixed(2)}%
                                </div>
                              </td>
                              <td className="p-3 text-right font-bold text-gray-900">
                                ₹{(item.total || rowTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={openProductSelection}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 hover:border-brand text-brand hover:bg-brand/5 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Another Product</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ---------------- 3. OTHER CHARGES CARD ---------------- */}
        {!otherCharge ? (
          <div
            onClick={() => {
              setOcLabel("Transportation / Delivery Charges");
              setOcAmount("");
              setOcIsTaxable(false);
              setIsOtherChargeOpen(true);
            }}
            className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs hover:border-brand/50 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <DollarSign size={20} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight group-hover:text-brand transition-colors">
                  OTHER CHARGES
                </h2>
                <p className="text-xs text-gray-500">Freight, transportation, delivery, or packaging</p>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-brand group-hover:text-white text-gray-700 flex items-center justify-center transition-all shadow-xs shrink-0">
              <Plus size={18} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <DollarSign size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    OTHER CHARGES
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setOcLabel(otherCharge.label);
                    setOcAmount(String(otherCharge.amount));
                    setOcIsTaxable(otherCharge.isTaxable);
                    setIsOtherChargeOpen(true);
                  }}
                  className="p-1.5 text-gray-500 hover:text-brand hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                  title="Edit Charge"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setOtherCharge(null)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  title="Remove Charge"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-sm font-bold text-gray-900 block">{otherCharge.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${otherCharge.isTaxable ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-700"}`}>
                  {otherCharge.isTaxable ? "+18% GST Applicable" : "Non-Taxable"}
                </span>
              </div>
              <div className="text-base font-extrabold text-gray-900">
                ₹{otherCharge.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- 4. TERMS & CONDITIONS CARD ---------------- */}
        <div
          onClick={() => setIsTermsPageOpen(true)}
          className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs hover:border-brand/50 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight group-hover:text-brand transition-colors">
                TERMS & CONDITIONS
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {selectedTermIds.length > 0
                  ? `${selectedTermIds.length} of ${termsList.length} clauses selected for quotation`
                  : "Tap to select and configure quotation clauses"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {selectedTermIds.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-brand rounded-xl border border-blue-100 hidden sm:inline-block">
                {selectedTermIds.length} Selected
              </span>
            )}
            <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-brand group-hover:text-white text-gray-700 flex items-center justify-center transition-all shadow-xs shrink-0">
              <Plus size={18} />
            </div>
          </div>
        </div>

        {/* ---------------- 5. ROUND OFF CHARGE CHECKBOX ---------------- */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center space-x-3">
              <input
                type="checkbox"
                id="round-off-checkbox"
                checked={isRoundOff}
                onChange={(e) => setIsRoundOff(e.target.checked)}
                className="w-5 h-5 mt-0.5 sm:mt-0 rounded-md accent-brand cursor-pointer shrink-0"
              />
              <label
                htmlFor="round-off-checkbox"
                className="cursor-pointer select-none"
              >
                <span className="text-sm font-bold text-gray-900 block">
                  Round off total amount to nearest Rupee
                </span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Automatically rounds the grand total to the nearest whole rupee (₹)
                </span>
              </label>
            </div>

            {isRoundOff && (
              <div className="self-end sm:self-center px-3 py-1.5 bg-blue-50 border border-blue-200 text-brand rounded-xl text-xs font-bold flex items-center space-x-1.5">
                <Calculator size={14} />
                <span>
                  Adjustment: {roundOffDifference >= 0 ? `+₹${roundOffDifference.toFixed(2)}` : `-₹${Math.abs(roundOffDifference).toFixed(2)}`}
                </span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ================= DYNAMIC STICKY FOOTER (ALWAYS VISIBLE AT BOTTOM) ================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] py-3 sm:py-3.5 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left / Center: Live Financial Breakdown */}
          <div className="w-full sm:w-auto flex flex-wrap items-baseline justify-between sm:justify-start gap-x-4 gap-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Amount Due:
              </span>
              <span className="text-2xl sm:text-3xl font-black text-brand tracking-tight">
                ₹{amountDue.toLocaleString("en-IN", { minimumFractionDigits: isRoundOff ? 0 : 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-2.5 font-medium">
              <span>Subtotal: ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              {otherCharge && otherCharge.amount > 0 && (
                <span>• Other: ₹{otherCharge.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              )}
              <span>• GST: ₹{taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              {isRoundOff && roundOffDifference !== 0 && (
                <span className="text-brand font-semibold">
                  • Round-Off: {roundOffDifference > 0 ? "+" : ""}₹{roundOffDifference.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Right: Prominent Generate / Save Button */}
          <div className="w-full sm:w-auto flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleGenerateQuotation}
              disabled={isGenerating}
              className="w-full sm:w-auto px-7 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-extrabold tracking-wide shadow-md hover:shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{editId ? "Updating..." : "Generating..."}</span>
                </>
              ) : (
                <>
                  <Check size={17} />
                  <span>{editId ? "Update Quotation" : "Generate"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={cfgTaxPercent}
                    onChange={(e) => setCfgTaxPercent(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={cfgHsn}
                    onChange={(e) => setCfgHsn(e.target.value)}
                    placeholder="Optional HSN"
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
