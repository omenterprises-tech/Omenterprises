"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  LogOut,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  PenTool,
  Plus,
  Loader2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Zap,
  Briefcase,
  X,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  FileText,
  Printer,
  UserCheck,
  Package,
  FileCheck2,
  PlusCircle,
  Layers,
} from "lucide-react";
import { formatDateWithPattern } from "@/lib/crmCurrencyData";
import CustomerModal from "@/components/crm/CustomerModal";
import { CreateQuotationModal, ViewQuotationModal } from "@/components/crm/QuotationModal";

export default function CrmDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "quotations" | "customers" | "business" | "team" | "products" | "terms"
  >("quotations");

  // Permissions
  const [canManageTeam, setCanManageTeam] = useState(false);
  const canManageBusiness = Boolean(user?.isOwner ?? (user?.role === "Owner"));

  // Team management state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inputsUnlocked, setInputsUnlocked] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [inviteRole, setInviteRole] = useState("Manager");
  const [invitePhone, setInvitePhone] = useState("");
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Quotations state
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isCreateQuotationOpen, setIsCreateQuotationOpen] = useState(false);
  const [isViewQuotationOpen, setIsViewQuotationOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);

  // Customers state
  const [customers, setCustomers] = useState<any[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("General");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productError, setProductError] = useState("");

  // Terms & Conditions state
  const [standardTerms, setStandardTerms] = useState("");
  const [isSavingTerms, setIsSavingTerms] = useState(false);
  const [termsFeedback, setTermsFeedback] = useState("");

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const openEditCustomer = (cust: any) => {
    setEditingCustomer(cust);
    setIsCustomerModalOpen(true);
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setNewProductName("");
    setNewProductCategory("General");
    setNewProductPrice("");
    setNewProductDesc("");
    setProductError("");
    setIsProductModalOpen(true);
  };

  const openEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setNewProductName(prod.name || "");
    setNewProductCategory(prod.category || "General");
    setNewProductPrice(prod.basePrice !== undefined ? String(prod.basePrice) : "");
    setNewProductDesc(prod.description || "");
    setProductError("");
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductError("");
  };

  const openAddMemberModal = () => {
    setInviteName("");
    setInviteEmail("");
    setInvitePassword("");
    setInvitePhone("");
    setInviteRole("Manager");
    setInviteError("");
    setInputsUnlocked(false);
    setIsInviteModalOpen(true);
  };

  const closeAddMemberModal = () => {
    setIsInviteModalOpen(false);
    setInviteError("");
    setInputsUnlocked(false);
  };

  const loadTeam = async () => {
    try {
      const teamRes = await fetch("/api/crm/team");
      const teamData = await teamRes.json();
      if (teamData.success && teamData.members) {
        setTeamMembers(teamData.members);
        if (typeof teamData.canManageTeam === "boolean") {
          setCanManageTeam(teamData.canManageTeam);
        }
      }
    } catch (teamErr) {
      console.error("Failed to load team members:", teamErr);
    }
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

  const loadCustomers = async () => {
    try {
      const res = await fetch("/api/crm/customers");
      const data = await res.json();
      if (data.success && data.customers) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/crm/products");
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
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
        setCanManageTeam(Boolean(data.user?.isOwner ?? (data.user?.role === "Owner")));
        if (data.business?.otherInfo) {
          setStandardTerms(data.business.otherInfo);
        }

        await Promise.all([loadTeam(), loadQuotations(), loadCustomers(), loadProducts()]);
      } catch (err) {
        console.error("Failed to load CRM session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      setProductError("Product name is required.");
      return;
    }
    if (!newProductPrice || isNaN(Number(newProductPrice)) || Number(newProductPrice) < 0) {
      setProductError("Please enter a valid price.");
      return;
    }

    setIsSubmittingProduct(true);
    setProductError("");

    try {
      const isEditing = Boolean(editingProduct?.id);
      const res = await fetch("/api/crm/products", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingProduct.id } : {}),
          name: newProductName.trim(),
          category: newProductCategory.trim() || "General",
          basePrice: parseFloat(newProductPrice),
          description: newProductDesc.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        if (isEditing) {
          setProducts((prev) =>
            prev.map((p) => (p.id === data.product.id ? data.product : p))
          );
        } else {
          setProducts((prev) => [data.product, ...prev]);
        }
        closeProductModal();
      } else {
        setProductError(data.error || `Failed to ${isEditing ? "update" : "create"} product.`);
      }
    } catch (err: any) {
      setProductError(err.message || "Failed to save product.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/crm/products?id=${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        alert(data.error || "Failed to delete product.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    }
  };

  const handleSaveTerms = async () => {
    setIsSavingTerms(true);
    setTermsFeedback("");

    try {
      const res = await fetch("/api/crm/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terms: standardTerms.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBusiness((prev: any) => ({ ...prev, otherInfo: data.terms }));
        setStandardTerms(data.terms || "");
        setTermsFeedback("Terms & Conditions saved successfully!");
        setTimeout(() => setTermsFeedback(""), 4000);
      } else {
        setTermsFeedback(data.error || "Failed to save terms.");
      }
    } catch (err: any) {
      setTermsFeedback(err.message || "Failed to save terms.");
    } finally {
      setIsSavingTerms(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/crm/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    router.replace("/crm");
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setIsSubmittingInvite(true);

    try {
      const res = await fetch("/api/crm/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: inviteName.trim(),
          email: inviteEmail.trim(),
          password: invitePassword.trim(),
          role: inviteRole,
          phoneNumber: invitePhone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create team member.");
      }

      await loadTeam();
      closeAddMemberModal();
    } catch (err: any) {
      setInviteError(err.message || "Failed to create team member.");
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      const res = await fetch("/api/crm/team?id=" + memberId, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        alert(data.error || "Failed to remove member.");
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const handleDeleteQuotation = async (qId: number) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await fetch("/api/crm/quotations/" + qId, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setQuotations((prev) => prev.filter((q) => q.id !== qId));
      } else {
        alert(data.error || "Failed to delete quotation.");
      }
    } catch (err) {
      console.error("Failed to delete quotation:", err);
    }
  };

  const handleQuotationStatusChange = async (newStatus: string) => {
    if (!selectedQuotation) return;
    try {
      const res = await fetch("/api/crm/quotations/" + selectedQuotation.id, {
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
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteCustomer = async (cId: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await fetch("/api/crm/customers?id=" + cId, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== cId));
      } else {
        alert(data.error || "Failed to delete customer.");
      }
    } catch (err) {
      console.error("Failed to delete customer:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Opening CRM Dashboard...</p>
      </div>
    );
  }

  const businessName = business?.businessName || "Your Business";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter">
      {/* Top CRM Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-md">
                <Zap size={20} className="text-[#FF9800] fill-[#FF9800]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-gray-900 tracking-tight text-base">
                    OM <span className="text-[#FF9800]">CRM</span>
                  </span>
                  <span className="text-[10px] bg-brand/10 text-brand font-bold uppercase px-2 py-0.5 rounded-full">
                    Business Portal
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                  {businessName}
                </p>
              </div>
            </div>

            {/* User & Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                type="button"
                onClick={() => router.push("/crm/profile")}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
                title={canManageBusiness ? "Manage Business Profile" : "View Official Business Profile"}
              >
                <Building2 size={14} className="text-brand" />
                <span>{canManageBusiness ? "Manage Profile" : "View Profile"}</span>
              </button>

              <div className="hidden sm:flex flex-col text-right">
                <div className="flex items-center justify-end space-x-1.5">
                  <span className="text-xs font-bold text-gray-900">
                    {user?.fullName || "Business User"}
                  </span>
                  {user?.role && (
                    <span className="text-[10px] bg-brand/10 text-brand font-bold uppercase px-1.5 py-0.5 rounded-md">
                      {user.role}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-500">{user?.email}</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                title="Log out of CRM"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-brand via-[#1565C0] to-[#0D47A1] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-white/90">
                <ShieldCheck size={14} className="text-[#FF9800]" />
                <span>Verified Business Account</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-playfair tracking-tight">
                Welcome, {businessName}!
              </h1>
              <p className="text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed">
                Create official customer quotations, manage clients, inspect your company settings, and collaborate with your team.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs flex items-center space-x-2">
                <FileText size={15} className="text-[#FF9800]" />
                <div>
                  <div className="text-white/70 text-[10px] uppercase font-bold">Quotations</div>
                  <div className="font-semibold text-sm">{quotations.length} Quotes</div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs flex items-center space-x-2">
                <Users size={15} className="text-[#FF9800]" />
                <div>
                  <div className="text-white/70 text-[10px] uppercase font-bold">Customers</div>
                  <div className="font-semibold text-sm">{customers.length} Clients</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= MANAGE SECTION ================= */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
              Manage
            </h3>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-3.5">
            {/* 1. Business */}
            <button
              type="button"
              onClick={() => setActiveTab("business")}
              className={`group text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                activeTab === "business"
                  ? "bg-white border-brand shadow-md ring-2 ring-brand/20"
                  : "bg-white border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  activeTab === "business" ? "bg-brand text-white" : "bg-blue-50 text-brand group-hover:bg-brand group-hover:text-white"
                }`}>
                  <Building2 size={20} />
                </div>
                {activeTab === "business" && (
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                  Business
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Profile & Branding
                </p>
              </div>
            </button>

            {/* 2. Teams */}
            <button
              type="button"
              onClick={() => setActiveTab("team")}
              className={`group text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                activeTab === "team"
                  ? "bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20"
                  : "bg-white border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  activeTab === "team" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                }`}>
                  <Users size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  {teamMembers.length}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  Teams
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Access & Roles
                </p>
              </div>
            </button>

            {/* 3. Customers */}
            <button
              type="button"
              onClick={() => setActiveTab("customers")}
              className={`group text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                activeTab === "customers"
                  ? "bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                  : "bg-white border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  activeTab === "customers" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                }`}>
                  <UserCheck size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {customers.length}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  Customers
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Client Directory
                </p>
              </div>
            </button>

            {/* 4. Products */}
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`group text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                activeTab === "products"
                  ? "bg-white border-amber-600 shadow-md ring-2 ring-amber-500/20"
                  : "bg-white border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  activeTab === "products" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white"
                }`}>
                  <Package size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  {products.length}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                  Products
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Items & Catalog
                </p>
              </div>
            </button>

            {/* 5. Terms */}
            <button
              type="button"
              onClick={() => setActiveTab("terms")}
              className={`group text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                activeTab === "terms"
                  ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20"
                  : "bg-white border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  activeTab === "terms" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                }`}>
                  <FileCheck2 size={20} />
                </div>
                {activeTab === "terms" && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  Terms
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Rules & Policies
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ================= DISCOVER SECTION ================= */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
              Discover
            </h3>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl">
            {/* 1. Quotation */}
            <button
              type="button"
              onClick={() => setIsCreateQuotationOpen(true)}
              className="group text-left p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-brand/50 transition-all duration-200 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-brand group-hover:bg-brand group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <PlusCircle size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                    Quotation
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Create new commercial quote
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-brand/10 text-brand font-bold text-xs group-hover:bg-brand group-hover:text-white transition-all shrink-0">
                + Create
              </span>
            </button>

            {/* 2. Quotation list */}
            <button
              type="button"
              onClick={() => setActiveTab("quotations")}
              className={`group text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                activeTab === "quotations"
                  ? "bg-white border-brand shadow-md ring-2 ring-brand/20"
                  : "bg-white border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                  activeTab === "quotations" ? "bg-brand text-white" : "bg-blue-50 text-brand group-hover:bg-brand group-hover:text-white"
                }`}>
                  <FileText size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                    Quotation list
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View & track all quotations ({quotations.length})
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "quotations"
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-700 group-hover:bg-brand group-hover:text-white"
              }`}>
                View List
              </span>
            </button>
          </div>
        </div>

        {/* ACTIVE VIEW SECTION */}
        <div className="space-y-6 pt-2">
          <div className="border-b border-gray-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-playfair tracking-tight">
              {activeTab === "quotations" && "Quotations"}
              {activeTab === "customers" && "Customers & Clients"}
              {activeTab === "business" && "Business Profile"}
              {activeTab === "team" && "Team Members"}
              {activeTab === "products" && "Products & Catalog"}
              {activeTab === "terms" && "Terms & Conditions"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {activeTab === "quotations" && "Generate, track, and manage official quotations for clients"}
              {activeTab === "customers" && "Manage your client database and direct contact details"}
              {activeTab === "business" && "Official company information registered by the business owner"}
              {activeTab === "team" && "Team access and permissions for your business account"}
              {activeTab === "products" && "Manage standard catalog items and parts for your quotes"}
              {activeTab === "terms" && "Configure standard payment, delivery, and warranty policies for quotations"}
            </p>
          </div>
          {/* ================= TAB 1: QUOTATIONS ================= */}
          {activeTab === "quotations" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Quotation Ledger</h3>
                    <p className="text-xs text-gray-500">Official commercial quotations issued for {businessName}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateQuotationOpen(true)}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>New Quotation</span>
                </button>
              </div>

              {quotations.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">No Quotations Drafted Yet</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                      Create your first client quotation with company branding, tax calculations, and PDF export.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateQuotationOpen(true)}
                    className="mt-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow hover:bg-brand-hover transition-all cursor-pointer"
                  >
                    + Draft First Quote
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
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
                      {quotations.map((q) => (
                        <tr key={q.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 font-bold text-brand text-xs sm:text-sm">
                            {q.quotationNumber}
                          </td>
                          <td className="py-4 text-xs text-gray-500">{q.quotationDate}</td>
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
                            <span
                              className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold " + (
                                q.status === "Accepted"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : q.status === "Sent"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : q.status === "Declined"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              )}
                            >
                              {q.status}
                            </span>
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
                                onClick={() => {
                                  setSelectedQuotation(q);
                                  setIsViewQuotationOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                              >
                                <Eye size={13} />
                                <span>View / Print</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuotation(q.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete quotation"
                              >
                                <Trash2 size={14} />
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
          )}

          {/* ================= TAB 2: CUSTOMERS ================= */}
          {activeTab === "customers" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF9800] flex items-center justify-center">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Customer Directory</h3>
                    <p className="text-xs text-gray-500">Manage client contacts and billing addresses for {businessName}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openAddCustomer}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>Add Customer</span>
                </button>
              </div>

              {customers.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                    <UserCheck size={28} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">No Customers Added Yet</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                      Save client details to easily generate quotations and invoices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddCustomer}
                    className="mt-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow hover:bg-brand-hover transition-all cursor-pointer"
                  >
                    + Add First Customer
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-3">Client</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">GSTIN</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 font-semibold text-gray-900">
                            <div>{c.name}</div>
                            {c.companyName && (
                              <div className="text-xs text-gray-500 font-normal">{c.companyName}</div>
                            )}
                          </td>
                          <td className="py-4 text-xs text-gray-600">
                            <div>{c.phone || "—"}</div>
                            <div className="text-gray-400">{c.email || "—"}</div>
                          </td>
                          <td className="py-4 text-xs text-gray-600">
                            <div>{[c.city, c.state].filter(Boolean).join(", ") || "—"}</div>
                            {c.pincode && <div className="text-gray-400">PIN: {c.pincode}</div>}
                          </td>
                          <td className="py-4 text-xs font-bold text-gray-700 uppercase">
                            {c.gstin || "—"}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreateQuotationOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold transition-colors cursor-pointer"
                              >
                                + Quote
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditCustomer(c)}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit customer details"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomer(c.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete customer"
                              >
                                <Trash2 size={14} />
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
          )}

          {/* ================= TAB 3: BUSINESS PROFILE ================= */}
          {activeTab === "business" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {/* Read-Only Banner for Team Members */}
              {!canManageBusiness && (
                <div className="lg:col-span-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <strong className="block text-sm font-bold text-amber-950 mb-0.5">
                      Official Business Profile (Registered by Owner)
                    </strong>
                    <span>
                      You are viewing the business details registered by the primary owner. As a <strong>{user?.role}</strong>, this profile is read-only. All quotations you issue will carry these company credentials.
                    </span>
                  </div>
                </div>
              )}

              {/* Card 1: Core Business Information */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand flex items-center justify-center">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Business Profile</h3>
                      <p className="text-xs text-gray-500">Official company and contact information</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/crm/profile")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-brand text-xs font-semibold text-gray-700 hover:text-brand transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>{canManageBusiness ? "Manage Profile" : "View Details"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Business Name
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{businessName}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Contact Person
                    </span>
                    <p className="text-sm font-semibold text-gray-900">
                      {business?.contactName || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Phone Number
                    </span>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Phone size={14} className="text-gray-400" />
                      <span>{business?.mobileNumber || "—"}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Business Email
                    </span>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 truncate">
                      <Mail size={14} className="text-gray-400 shrink-0" />
                      <span className="truncate">{business?.email || "—"}</span>
                    </p>
                  </div>

                  {business?.businessCategory && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        Business Category
                      </span>
                      <p className="text-sm font-semibold text-brand">
                        {business.businessCategory}
                      </p>
                    </div>
                  )}

                  {business?.taxNumber && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        {business.taxLabel || "GSTIN"}
                      </span>
                      <p className="text-sm font-semibold text-gray-900">
                        {business.taxNumber}
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Registered Address
                    </span>
                    <p className="text-sm font-semibold text-gray-900 flex items-start gap-1.5">
                      <MapPin size={15} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>
                        {[business?.addressLine1, business?.addressLine2, business?.addressLine3, business?.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Logo & Signature Preview */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900">Official Assets</h3>
                  <p className="text-xs text-gray-500">Logo and signature stamped on quotes</p>
                </div>

                {/* Logo Preview */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Company Logo
                  </span>
                  {business?.logoUrl ? (
                    <div className="w-full h-28 rounded-2xl bg-gray-50 border border-gray-200 p-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={business.logoUrl}
                        alt="Business Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-xs">
                      <span>No logo uploaded</span>
                    </div>
                  )}
                </div>

                {/* Signature Preview */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Authorized Signature
                  </span>
                  {business?.signatureUrl ? (
                    <div className="w-full h-24 rounded-2xl bg-white border border-gray-200 p-2 flex items-center justify-center overflow-hidden shadow-inner">
                      <img
                        src={business.signatureUrl}
                        alt="Authorized Signature"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-xs">
                      <span>No signature added</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: TEAM ================= */}
          {activeTab === "team" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
              {/* Read-Only Banner for Team Members */}
              {!canManageTeam && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start space-x-3 text-xs text-purple-900">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-purple-600" />
                  <div>
                    <strong className="block text-sm font-bold text-purple-950 mb-0.5">
                      Team Roster (View Access Only)
                    </strong>
                    <span>
                      You are viewing the team members roster for {businessName}. As a <strong>{user?.role || "Team Member"}</strong>, you have view access to team details. Adding or removing team members is managed by the business owner.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
                    <p className="text-xs text-gray-500">
                      Manage team access and permissions for {businessName}
                    </p>
                  </div>
                </div>

                {canManageTeam && (
                  <button
                    type="button"
                    onClick={openAddMemberModal}
                    className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus size={15} />
                    <span>Add Team Member</span>
                  </button>
                )}
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <th className="pb-3">Member</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                      {canManageTeam && <th className="pb-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teamMembers.map((member, idx) => (
                      <tr key={member.id || idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-4 font-semibold text-gray-900">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-bold text-xs flex items-center justify-center uppercase shrink-0">
                              {(member.name || "U").charAt(0)}
                            </div>
                            <div>
                              <span>{member.name}</span>
                              {member.phone && member.phone !== "0000000000" && (
                                <p className="text-[11px] text-gray-400 font-normal">{member.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-gray-600 text-xs sm:text-sm">{member.email}</td>
                        <td className="py-4">
                          <span
                            className={"inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold " + (
                              member.role.includes("Owner")
                                ? "bg-amber-100 text-amber-900 font-bold"
                                : member.role === "Admin"
                                ? "bg-purple-100 text-purple-900 font-bold"
                                : member.role === "Manager"
                                ? "bg-blue-100 text-blue-900 font-medium"
                                : "bg-gray-100 text-gray-800"
                            )}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td className="py-4">
                          <span
                            className={"inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold " + (
                              member.status === "Active"
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            )}
                          >
                            <span
                              className={"w-1.5 h-1.5 rounded-full " + (
                                member.status === "Active" ? "bg-green-500" : "bg-amber-500"
                              )}
                            />
                            <span>{member.status}</span>
                          </span>
                        </td>
                        {canManageTeam && (
                          <td className="py-4 text-right">
                            {!member.isOwner && member.id !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove team member"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 5: PRODUCTS ================= */}
          {activeTab === "products" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Products & Catalog</h3>
                    <p className="text-xs text-gray-500">Standard items, parts, and rates for your commercial quotations</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openAddProduct}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>Add Product</span>
                </button>
              </div>

              {products.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-center text-amber-500">
                    <Package size={28} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">No Products Added Yet</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                      Build your product catalog with prices and categories to speed up quotation creation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddProduct}
                    className="mt-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow hover:bg-brand-hover transition-all cursor-pointer"
                  >
                    + Add First Product
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-3">Product Name</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3">Base Price</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 font-bold text-gray-900 text-xs sm:text-sm">
                            {prod.name}
                          </td>
                          <td className="py-4 text-xs">
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-100">
                              {prod.category || "General"}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-gray-500 max-w-xs truncate">
                            {prod.description || "—"}
                          </td>
                          <td className="py-4 font-bold text-gray-900 text-xs sm:text-sm">
                            ₹{Number(prod.basePrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => openEditProduct(prod)}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit product"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 size={14} />
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
          )}

          {/* ================= TAB 6: TERMS ================= */}
          {activeTab === "terms" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileCheck2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Standard Terms & Conditions</h3>
                    <p className="text-xs text-gray-500">
                      Default policies, validity, payment terms, and delivery schedules for your quotations
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveTerms}
                  disabled={isSavingTerms}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto disabled:opacity-60"
                >
                  {isSavingTerms ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      <span>Save Default Terms</span>
                    </>
                  )}
                </button>
              </div>

              {termsFeedback && (
                <div className={`p-3.5 rounded-2xl text-xs font-medium flex items-center space-x-2 animate-in fade-in ${
                  termsFeedback.includes("success")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}>
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{termsFeedback}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3 text-xs text-blue-900">
                  <AlertCircle size={17} className="shrink-0 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-bold">Quotation Auto-Population</p>
                    <p className="text-blue-800/80 mt-0.5">
                      These terms are automatically populated into the Terms & Conditions section of every newly generated quotation.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Standard Commercial Terms
                  </label>
                  <textarea
                    value={standardTerms}
                    onChange={(e) => setStandardTerms(e.target.value)}
                    disabled={isSavingTerms}
                    rows={6}
                    placeholder="Enter standard validity, payment schedule, delivery timelines, taxes, and warranty policies..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase text-gray-400">Quick Insert Clauses:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStandardTerms((prev) => prev ? `${prev}\n• Validity: 30 days from quote date.` : "• Validity: 30 days from quote date.")}
                      className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer transition-colors"
                    >
                      + 30 Days Validity
                    </button>
                    <button
                      type="button"
                      onClick={() => setStandardTerms((prev) => prev ? `${prev}\n• Payment: 100% advance against Proforma Invoice.` : "• Payment: 100% advance against Proforma Invoice.")}
                      className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer transition-colors"
                    >
                      + 100% Advance Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setStandardTerms((prev) => prev ? `${prev}\n• Delivery: 5 to 7 working days from confirmed PO.` : "• Delivery: 5 to 7 working days from confirmed PO.")}
                      className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer transition-colors"
                    >
                      + Delivery Timeline
                    </button>
                    <button
                      type="button"
                      onClick={() => setStandardTerms((prev) => prev ? `${prev}\n• Warranty: 12 months manufacturer warranty from invoice date.` : "• Warranty: 12 months manufacturer warranty from invoice date.")}
                      className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer transition-colors"
                    >
                      + 12 Months Warranty
                    </button>
                    <button
                      type="button"
                      onClick={() => setStandardTerms((prev) => prev ? `${prev}\n• Taxes: GST as applicable at the time of delivery.` : "• Taxes: GST as applicable at the time of delivery.")}
                      className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer transition-colors"
                    >
                      + GST Clause
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Standard terms are shared across your business and automatically loaded into new quotations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Team Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Team Member</h3>
                <p className="text-xs text-gray-500">Create login credentials for your colleague</p>
              </div>
              <button
                type="button"
                onClick={closeAddMemberModal}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {inviteError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInvite} autoComplete="off" className="space-y-3.5">
              <input
                type="text"
                name="fake_autofill_username"
                tabIndex={-1}
                autoComplete="username"
                aria-hidden="true"
                style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
              />
              <input
                type="password"
                name="fake_autofill_password"
                tabIndex={-1}
                autoComplete="current-password"
                aria-hidden="true"
                style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="new_member_name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  onFocus={() => setInputsUnlocked(true)}
                  onClick={() => setInputsUnlocked(true)}
                  placeholder="e.g. Ramesh Sharma"
                  autoComplete="off"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Email Address (Login ID) *
                </label>
                <input
                  type="email"
                  name="new_member_email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onFocus={() => setInputsUnlocked(true)}
                  onClick={() => setInputsUnlocked(true)}
                  readOnly={!inputsUnlocked}
                  placeholder="colleague@company.com"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showInvitePassword ? "text" : "password"}
                    name="new_member_password"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    onFocus={() => setInputsUnlocked(true)}
                    onClick={() => setInputsUnlocked(true)}
                    readOnly={!inputsUnlocked}
                    placeholder="Set at least 6 characters"
                    autoComplete="new-password"
                    required
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvitePassword(!showInvitePassword)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showInvitePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Assigned Role
                  </label>
                  <select
                    name="new_member_role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white cursor-pointer font-medium"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Mobile <span className="text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="new_member_phone"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    onFocus={() => setInputsUnlocked(true)}
                    onClick={() => setInputsUnlocked(true)}
                    placeholder="10-digit mobile"
                    autoComplete="off"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed flex items-start gap-2">
                <CheckCircle2 size={15} className="text-brand shrink-0 mt-0.5" />
                <span>
                  This team member can directly sign in at <strong>/crm</strong> using this email and password.
                </span>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeAddMemberModal}
                  className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingInvite ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Member</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Creation / Edit Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        initialCustomer={editingCustomer}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        onCustomerCreated={(newCust) => {
          setCustomers((prev) => [newCust, ...prev]);
        }}
        onCustomerSaved={(updatedCust) => {
          setCustomers((prev) =>
            prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
          );
        }}
      />

      {/* Quotation Creation Modal */}
      <CreateQuotationModal
        isOpen={isCreateQuotationOpen}
        onClose={() => setIsCreateQuotationOpen(false)}
        onCreated={(newQ) => {
          setQuotations((prev) => [newQ, ...prev]);
          setSelectedQuotation(newQ);
          setIsViewQuotationOpen(true);
        }}
        business={business}
        caller={{
          name: user?.fullName || "User",
          role: user?.role || "Staff",
        }}
        customers={customers}
      />

      {/* Quotation View / Print Modal */}
      <ViewQuotationModal
        isOpen={isViewQuotationOpen}
        onClose={() => setIsViewQuotationOpen(false)}
        quotation={selectedQuotation}
        business={business}
        onStatusChange={handleQuotationStatusChange}
      />

      {/* Product Creation / Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingProduct
                    ? "Update item rates, category, and specifications"
                    : "Save items, parts, or services for quotations"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeProductModal}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {productError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{productError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. 33kV Switchgear Panel"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    placeholder="e.g. Electrical"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Description / Specifications
                </label>
                <textarea
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  placeholder="Technical specs, model numbers, warranty..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-normal"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center space-x-1.5 disabled:opacity-60"
                >
                  {isSubmittingProduct ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? "Save Changes" : "Add Product"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
