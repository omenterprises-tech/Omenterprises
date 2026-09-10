"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, AlertCircle, Contact, Check } from "lucide-react";
import { INDIAN_STATES } from "@/lib/crmCategoriesData";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: (customer: any) => void;
  onCustomerSaved?: (customer: any) => void;
  initialCustomer?: any | null;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
  onCustomerSaved,
  initialCustomer,
}: CustomerModalProps) {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [otherInfo, setOtherInfo] = useState("");
  const [gstin, setGstin] = useState("");
  const [state, setState] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const [errors, setErrors] = useState<{ name?: string; companyName?: string }>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const isEditing = Boolean(initialCustomer?.id);

  useEffect(() => {
    if (initialCustomer) {
      setName(initialCustomer.name || "");
      setCompanyName(initialCustomer.companyName || "");
      setEmail(initialCustomer.email || "");
      setMobile(initialCustomer.phone || initialCustomer.mobile || "");
      setAddressLine1(initialCustomer.addressLine1 || initialCustomer.address || "");
      setAddressLine2(initialCustomer.addressLine2 || "");
      setOtherInfo(initialCustomer.otherInfo || "");
      setGstin(initialCustomer.gstin || "");
      setState(initialCustomer.state || "");
      setShippingAddress(initialCustomer.shippingAddress || "");
    } else {
      setName("");
      setCompanyName("");
      setEmail("");
      setMobile("");
      setAddressLine1("");
      setAddressLine2("");
      setOtherInfo("");
      setGstin("");
      setState("");
      setShippingAddress("");
    }
    setErrors({});
    setGeneralError("");
  }, [initialCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; companyName?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!companyName.trim()) {
      newErrors.companyName = "Company Name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setGeneralError("");
    setLoading(true);

    try {
      const url = "/api/crm/customers";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: mobile.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        otherInfo: otherInfo.trim(),
        gstin: gstin.trim(),
        state: state.trim(),
        shippingAddress: shippingAddress.trim(),
      };
      if (isEditing && initialCustomer?.id) {
        payload.id = initialCustomer.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.customer) {
        if (isEditing) {
          if (onCustomerSaved) onCustomerSaved(data.customer);
        } else {
          if (onCustomerCreated) onCustomerCreated(data.customer);
        }
        onClose();
      } else {
        if (data.field === "name") {
          setErrors((prev) => ({ ...prev, name: data.error }));
        } else if (data.field === "companyName") {
          setErrors((prev) => ({ ...prev, companyName: data.error }));
        } else {
          setGeneralError(data.error || "Failed to save customer.");
        }
      }
    } catch (err: any) {
      setGeneralError(err.message || "Failed to save customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col overflow-y-auto font-inter text-gray-900 animate-in fade-in duration-150">
      {/* Full-Screen Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-gray-500 hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer mr-1"
                title="Back / Close"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                  {isEditing ? "Edit Customer" : "Add Customer"}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  {isEditing ? "Update customer profile details" : "Register a new client profile"}
                </p>
              </div>
            </div>

            <button
              type="submit"
              form="customer-modal-form"
              disabled={loading}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>{isEditing ? "Update Customer" : "Save Customer"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {generalError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        <form id="customer-modal-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Core Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2.5">
              Client & Company Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Contact person or client name"
                    className={`w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                      errors.name
                        ? "border border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
                        : "border border-gray-200 focus:ring-brand/30 focus:border-brand"
                    }`}
                  />
                  <Contact
                    size={18}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-600 font-medium mt-1 pl-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (errors.companyName)
                      setErrors((prev) => ({ ...prev, companyName: undefined }));
                  }}
                  placeholder="Enterprise / Business legal name"
                  className={`w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                    errors.companyName
                      ? "border border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
                      : "border border-gray-200 focus:ring-brand/30 focus:border-brand"
                  }`}
                />
                {errors.companyName && (
                  <p className="text-xs text-rose-600 font-medium mt-1 pl-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.companyName}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Contact & Tax Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2.5">
              Contact & Tax Identifiers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile / Phone</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="29AAAAA0000A1Z5"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm uppercase text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">State / Province</label>
                <input
                  type="text"
                  value={state}
                  list="customer-modal-states"
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra, Karnataka, Gujarat..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
                <datalist id="customer-modal-states">
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Card 3: Address & Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2.5">
              Billing & Shipping Addresses
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Door / Flat / Plot No, Building, Street"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Area, Landmark, City, Pincode"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Shipping Address (Optional)
                </label>
                <textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter dispatch / shipping address if different from billing address..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Other Notes / Remarks
                </label>
                <input
                  type="text"
                  value={otherInfo}
                  onChange={(e) => setOtherInfo(e.target.value)}
                  placeholder="Special client instructions, payment terms, or remarks"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>
            </div>
          </div>

          {/* Form Action Buttons at bottom */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 pb-12">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Update Customer" : "Save Customer"}</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
