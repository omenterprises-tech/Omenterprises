"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, AlertCircle, Contact } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Blue Theme Header */}
        <div className="bg-brand text-white px-5 py-4 flex items-center space-x-3 shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Back / Close"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-bold tracking-tight text-white">
            {isEditing ? "Edit Customer" : "Add Customer"}
          </h2>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {generalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{generalError}</span>
            </div>
          )}

          {/* 1. Name (Mandatory) */}
          <div>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                placeholder="Name"
                className={`w-full bg-[#F4F5F7] px-4 py-3.5 pr-11 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                  errors.name
                    ? "border border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/20"
                    : "border border-transparent focus:ring-brand/30"
                }`}
              />
              <Contact
                size={20}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-rose-600 font-medium mt-1 pl-1 flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* 2. Company Name (Mandatory) */}
          <div>
            <input
              type="text"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (errors.companyName) {
                  setErrors((prev) => ({ ...prev, companyName: undefined }));
                }
              }}
              placeholder="Company Name"
              className={`w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                errors.companyName
                  ? "border border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/20"
                  : "border border-transparent focus:ring-brand/30"
              }`}
            />
            {errors.companyName && (
              <p className="text-xs text-rose-600 font-medium mt-1 pl-1 flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.companyName}</span>
              </p>
            )}
          </div>

          {/* 3. Email (Optional) */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
            />
          </div>

          {/* 4. Mobile (Optional) */}
          <div>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Mobile"
              className="w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
            />
          </div>

          {/* 5. Address Line 1 (Optional) */}
          <div>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Address Line 1"
              className="w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
            />
          </div>

          {/* 6. Address Line 2 (Optional) */}
          <div>
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Address Line 2"
              className="w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
            />
          </div>

          {/* 7. Other Info (Optional) */}
          <div>
            <input
              type="text"
              value={otherInfo}
              onChange={(e) => setOtherInfo(e.target.value)}
              placeholder="Other Info"
              className="w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
            />
          </div>

          {/* 8. GSTIN Number (Optional) */}
          <div>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="GSTIN Number"
              className="w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
            />
          </div>

          {/* 9. State (Optional) */}
          <div>
            <input
              type="text"
              value={state}
              list="customer-modal-states"
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
            />
            <datalist id="customer-modal-states">
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st} />
              ))}
            </datalist>
          </div>

          {/* Section: Shipping Details */}
          <div className="pt-2">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Shipping Details</h3>
            <div className="bg-[#F4F5F7] rounded-2xl p-3.5 border border-transparent focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/30 transition-all">
              <label className="block text-xs text-gray-400 font-medium mb-1">
                Shipping Address
              </label>
              <textarea
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Shipping Address"
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-3 pb-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Add"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
