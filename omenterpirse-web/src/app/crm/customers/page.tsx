"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import CustomerModal from "@/components/crm/CustomerModal";
import { CreateQuotationModal } from "@/components/crm/QuotationModal";

export default function CrmCustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Customers data & search
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Quote modal
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);
  const [selectedCustomerForQuote, setSelectedCustomerForQuote] = useState<any | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
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
        await loadCustomers();
      } catch (err) {
        console.error("Failed to load CRM session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.gstin?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const openEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleDeleteCustomer = async (cId: number, cName: string) => {
    if (!confirm(`Are you sure you want to delete customer "${cName}"?`)) return;
    try {
      const res = await fetch(`/api/crm/customers?id=${cId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== cId));
        showToast("Customer deleted successfully.");
      } else {
        alert(data.error || "Failed to delete customer.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete customer.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading Customer Directory...</p>
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
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <UserCheck size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-gray-900 tracking-tight text-base">
                    Customer Directory
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold uppercase px-2 py-0.5 rounded-full border border-emerald-100">
                    {customers.length} Clients
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
          {/* Controls Bar: Search & Add */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-playfair">
                Clients & Direct Accounts
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Client directory with billing details and GSTIN records
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
                  placeholder="Search name, company, GSTIN..."
                  className="w-full sm:w-64 pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              {/* Add Customer Button */}
              <button
                type="button"
                onClick={openAddCustomer}
                className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          {/* Customers Table */}
          {filteredCustomers.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <UserCheck size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">
                  {searchQuery ? "No Matching Clients Found" : "No Customers Saved Yet"}
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  {searchQuery
                    ? `No clients matched your query "${searchQuery}". Try a different keyword.`
                    : "Save customer profiles with GSTIN and billing address to quickly generate quotations."}
                </p>
              </div>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={openAddCustomer}
                  className="mt-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow hover:bg-brand-hover transition-all cursor-pointer"
                >
                  + Add First Customer
                </button>
              )}
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
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 font-semibold text-gray-900">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm">{c.name}</div>
                        {c.companyName && (
                          <div className="text-xs text-gray-500 font-normal">{c.companyName}</div>
                        )}
                      </td>
                      <td className="py-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Phone size={12} className="text-gray-400" />
                          <span>{c.phone || "—"}</span>
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                            <Mail size={12} />
                            <span>{c.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-gray-400" />
                          <span>{[c.city, c.state].filter(Boolean).join(", ") || "—"}</span>
                        </div>
                        {c.pincode && <div className="text-[11px] text-gray-400 pl-4.5">PIN: {c.pincode}</div>}
                      </td>
                      <td className="py-4 text-xs font-bold text-gray-700 uppercase">
                        {c.gstin ? (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-md">{c.gstin}</span>
                        ) : (
                          <span className="text-gray-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerForQuote(c);
                              setIsCreateQuoteOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold transition-colors cursor-pointer"
                            title="Create quotation for client"
                          >
                            + Quote
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditCustomer(c)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit customer details"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete customer"
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
      </main>

      {/* Customer Create / Edit Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        initialCustomer={editingCustomer}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        onCustomerCreated={(newCust) => {
          setCustomers((prev) => [newCust, ...prev]);
          showToast("Customer added successfully!");
        }}
        onCustomerSaved={(updatedCust) => {
          setCustomers((prev) =>
            prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
          );
          showToast("Customer details updated successfully!");
        }}
      />

      {/* Quotation Creation Modal (from +Quote button) */}
      <CreateQuotationModal
        isOpen={isCreateQuoteOpen}
        onClose={() => {
          setIsCreateQuoteOpen(false);
          setSelectedCustomerForQuote(null);
        }}
        onCreated={() => {
          setIsCreateQuoteOpen(false);
          setSelectedCustomerForQuote(null);
          showToast("Quotation created successfully!");
          router.push("/crm/dashboard");
        }}
        business={business}
        caller={{
          name: user?.fullName || "User",
          role: user?.role || "Staff",
        }}
        customers={customers}
      />
    </div>
  );
}
