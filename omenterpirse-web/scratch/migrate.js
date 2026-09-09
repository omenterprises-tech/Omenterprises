const fs = require('fs');
const path = require('path');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();
const { createClient } = require('@libsql/client');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✓ Wrote:', relPath);
}

// 0. CustomerModal component
const customerModalContent = `"use client";

import React, { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { INDIAN_STATES } from "@/lib/crmCategoriesData";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: any) => void;
}

export default function CustomerModal({ isOpen, onClose, onCustomerCreated }: CustomerModalProps) {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstin, setGstin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/crm/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          companyName: companyName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          gstin: gstin.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.customer) {
        onCustomerCreated(data.customer);
        onClose();
      } else {
        setError(data.error || "Failed to create customer.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add New Customer</h3>
            <p className="text-xs text-gray-500">Save client details for quotations and orders</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Kumar Infotech"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Billing Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop/Office No., Street, Area"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-2 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white cursor-pointer"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={pincode}
                maxLength={6}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="500001"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              GSTIN / Tax ID <span className="text-gray-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 36AAAAA0000A1Z5"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Customer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

writeFile('src/components/crm/CustomerModal.tsx', customerModalContent);

const customersRoute = `import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmCustomers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCrmSession } from "@/lib/crmAuth";
import { resolveBusinessAndRole } from "@/lib/crmBusinessResolver";

export async function GET() {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const customers = await db
      .select()
      .from(crmCustomers)
      .where(eq(crmCustomers.businessId, business.id))
      .orderBy(desc(crmCustomers.id));

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error: any) {
    console.error("Fetch customers error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customers." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const body = await request.json();
    const { name, companyName, email, phone, address, city, state, pincode, gstin } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Customer name is required." }, { status: 400 });
    }

    const newCustomer = await db
      .insert(crmCustomers)
      .values({
        businessId: business.id,
        name: name.trim(),
        companyName: companyName?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        gstin: gstin?.trim() || null,
        createdByUserId: session.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      customer: newCustomer[0],
    });
  } catch (error: any) {
    console.error("Create customer error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ success: false, error: "Customer ID is required." }, { status: 400 });
    }

    const id = parseInt(idParam, 10);
    await db.delete(crmCustomers).where(eq(crmCustomers.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete customer." },
      { status: 500 }
    );
  }
}
`;

// 2. Quotations List & Create Route
const quotationsRoute = `import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmQuotations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCrmSession } from "@/lib/crmAuth";
import { resolveBusinessAndRole } from "@/lib/crmBusinessResolver";

export async function GET() {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business, role, user } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const quotations = await db
      .select()
      .from(crmQuotations)
      .where(eq(crmQuotations.businessId, business.id))
      .orderBy(desc(crmQuotations.id));

    return NextResponse.json({
      success: true,
      quotations,
      business,
      caller: {
        id: session.userId,
        name: user?.fullName || "User",
        role: role || "Staff",
      },
    });
  } catch (error: any) {
    console.error("Fetch quotations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch quotations." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business, role, user } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const body = await request.json();
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerGstin,
      quotationDate,
      validUntil,
      items,
      subtotal,
      taxTotal,
      grandTotal,
      notes,
      termsConditions,
      status,
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ success: false, error: "Customer name is required." }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "At least one item is required." }, { status: 400 });
    }

    // Generate Quotation Number
    const existingCount = await db
      .select({ id: crmQuotations.id })
      .from(crmQuotations)
      .where(eq(crmQuotations.businessId, business.id));

    const nextSeq = existingCount.length + 1;
    const year = new Date().getFullYear();
    const qNum = "QT-" + year + "-" + String(nextSeq).padStart(4, "0");

    const authorName = user?.fullName || "Team Member";
    const authorRole = role || "Staff";

    const newQuotation = await db
      .insert(crmQuotations)
      .values({
        businessId: business.id,
        quotationNumber: qNum,
        quotationDate: quotationDate || new Date().toISOString().split("T")[0],
        validUntil: validUntil || null,
        customerId: customerId ? Number(customerId) : null,
        customerName: customerName.trim(),
        customerEmail: customerEmail?.trim() || null,
        customerPhone: customerPhone?.trim() || null,
        customerAddress: customerAddress?.trim() || null,
        customerGstin: customerGstin?.trim() || null,
        items: JSON.stringify(items),
        subtotal: Number(subtotal) || 0,
        taxTotal: Number(taxTotal) || 0,
        grandTotal: Number(grandTotal) || 0,
        notes: notes?.trim() || null,
        termsConditions: termsConditions?.trim() || null,
        status: status || "Draft",
        createdByUserId: session.userId,
        createdByName: authorName,
        createdByRole: authorRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      quotation: newQuotation[0],
    });
  } catch (error: any) {
    console.error("Create quotation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create quotation." },
      { status: 500 }
    );
  }
}
`;

// 3. Quotation Detail Route
const quotationDetailRoute = `import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmQuotations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCrmSession } from "@/lib/crmAuth";
import { resolveBusinessAndRole } from "@/lib/crmBusinessResolver";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const { id: idParam } = await context.params;
    const quotationId = parseInt(idParam, 10);

    const quotationList = await db
      .select()
      .from(crmQuotations)
      .where(
        and(
          eq(crmQuotations.id, quotationId),
          eq(crmQuotations.businessId, business.id)
        )
      )
      .limit(1);

    if (quotationList.length === 0) {
      return NextResponse.json({ success: false, error: "Quotation not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      quotation: quotationList[0],
      business,
    });
  } catch (error: any) {
    console.error("Fetch single quotation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch quotation." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    const { id: idParam } = await context.params;
    const quotationId = parseInt(idParam, 10);

    const body = await request.json();
    const { status } = body;

    const updated = await db
      .update(crmQuotations)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(crmQuotations.id, quotationId),
          eq(crmQuotations.businessId, business.id)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      quotation: updated[0],
    });
  } catch (error: any) {
    console.error("Update quotation status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update quotation." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { business, role } = await resolveBusinessAndRole(session.userId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found." }, { status: 404 });
    }

    if (role !== "Owner" && role !== "Admin" && role !== "Manager") {
      return NextResponse.json({ success: false, error: "Permission denied." }, { status: 403 });
    }

    const { id: idParam } = await context.params;
    const quotationId = parseInt(idParam, 10);

    await db
      .delete(crmQuotations)
      .where(
        and(
          eq(crmQuotations.id, quotationId),
          eq(crmQuotations.businessId, business.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete quotation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete quotation." },
      { status: 500 }
    );
  }
}
`;

writeFile('src/app/api/crm/customers/route.ts', customersRoute);
writeFile('src/app/api/crm/quotations/route.ts', quotationsRoute);
writeFile('src/app/api/crm/quotations/[id]/route.ts', quotationDetailRoute);

// 4. QuotationModal Component
const quotationModalContent = `"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, AlertCircle, Printer, CheckCircle2, Building2 } from "lucide-react";

interface ItemRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  total: number;
}

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (quotation: any) => void;
  business: any;
  caller: { name: string; role: string };
  customers: any[];
}

export function CreateQuotationModal({
  isOpen,
  onClose,
  onCreated,
  business,
  caller,
  customers,
}: CreateQuotationModalProps) {
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
  const [terms, setTerms] = useState("1. Payment terms: 50% advance, balance before dispatch.\\n2. Quote is valid for 30 days.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

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
      setCustomerAddress([found.address, found.city, found.state, found.pincode].filter(Boolean).join(", "));
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

  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const totalWithTax = items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  const taxTotal = Math.round((totalWithTax - subtotal) * 100) / 100;
  const grandTotal = Math.round(totalWithTax * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (items.some((it) => !it.description.trim())) {
      setError("All item descriptions must be filled.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/crm/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId || null,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || null,
          customerPhone: customerPhone.trim() || null,
          customerAddress: customerAddress.trim() || null,
          customerGstin: customerGstin.trim() || null,
          quotationDate,
          validUntil,
          items,
          subtotal,
          taxTotal,
          grandTotal,
          notes,
          termsConditions: terms,
          status: "Draft",
        }),
      });

      const data = await res.json();
      if (data.success && data.quotation) {
        onCreated(data.quotation);
        onClose();
      } else {
        setError(data.error || "Failed to create quotation.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create quotation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Create New Quotation</h3>
            <p className="text-xs text-gray-500">Draft a formal quotation for your client</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Official Admin Business Header Badge */}
        <div className="mb-5 p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Building2 size={16} className="text-brand shrink-0" />
            <span className="text-gray-700">
              Company Header: <strong className="text-brand font-bold">{business?.businessName || "Your Business"}</strong> (Admin Registered)
            </span>
          </div>
          <div className="text-gray-500">
            Author: <strong className="text-gray-800 font-semibold">{caller.name}</strong> ({caller.role})
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection & Details */}
          <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800">Customer Details</span>
              {customers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Select Existing:</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white font-medium"
                  >
                    <option value="">-- Quick Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? "• " + c.companyName : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Client Name or Company"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Contact Mobile"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Complete Address, City, State"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Customer GSTIN
                </label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>
            </div>
          </div>

          {/* Quotation Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800">Quotation Line Items</span>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold cursor-pointer transition-all"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Item Description *</th>
                    <th className="p-3 w-20">Qty</th>
                    <th className="p-3 w-28">Rate (₹)</th>
                    <th className="p-3 w-24">GST %</th>
                    <th className="p-3 w-28 text-right">Total (₹)</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="Product / Service description"
                          required
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-brand"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-brand text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-brand text-right"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={it.taxPercent}
                          onChange={(e) => handleItemChange(idx, "taxPercent", Number(e.target.value))}
                          className="w-full px-1.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-brand bg-white"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>
                      <td className="p-2 text-right font-bold text-gray-900 pr-3">
                        ₹{(Number(it.total) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-72 bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST):</span>
                  <span className="font-semibold">₹{taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
                  <span>Grand Total:</span>
                  <span className="text-brand font-black">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Client Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Quotation...</span>
                </>
              ) : (
                <span>Create Quotation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ViewQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: any;
  business: any;
  onStatusChange?: (newStatus: string) => void;
}

export function ViewQuotationModal({
  isOpen,
  onClose,
  quotation,
  business,
  onStatusChange,
}: ViewQuotationModalProps) {
  if (!isOpen || !quotation) return null;

  let parsedItems: any[] = [];
  try {
    parsedItems = typeof quotation.items === "string" ? JSON.parse(quotation.items) : quotation.items || [];
  } catch (e) {
    parsedItems = [];
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-6 sm:p-10 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:border-none">
        {/* Modal Controls (Hidden when printing) */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase text-gray-500">Status:</span>
            <select
              value={quotation.status}
              onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 font-bold"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow cursor-pointer transition-all"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE QUOTATION SHEET */}
        <div className="space-y-6 text-gray-900 font-inter">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-brand/20 pb-6">
            <div className="space-y-1.5 max-w-sm">
              {business?.logoUrl ? (
                <img src={business.logoUrl} alt="Logo" className="h-12 object-contain mb-2" />
              ) : (
                <div className="text-2xl font-black text-brand tracking-tight font-playfair">
                  {business?.businessName || "BUSINESS NAME"}
                </div>
              )}
              <h2 className="text-lg font-bold text-gray-900">{business?.businessName}</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                {[business?.addressLine1, business?.addressLine2, business?.addressLine3, business?.state].filter(Boolean).join(", ")}
              </p>
              <p className="text-xs text-gray-600">
                Phone: {business?.mobileNumber} | Email: {business?.email}
              </p>
              {business?.taxNumber && (
                <p className="text-xs font-semibold text-brand">
                  {business?.taxLabel || "GSTIN"}: {business?.taxNumber}
                </p>
              )}
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-brand text-white text-xs font-extrabold uppercase tracking-widest rounded-md">
                QUOTATION
              </span>
              <p className="text-sm font-black text-gray-900 pt-1">{quotation.quotationNumber}</p>
              <p className="text-xs text-gray-500">Date: {quotation.quotationDate}</p>
              {quotation.validUntil && (
                <p className="text-xs text-gray-500">Valid Until: {quotation.validUntil}</p>
              )}
            </div>
          </div>

          {/* Customer / Quotation To */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Quotation Prepared For
              </span>
              <h4 className="text-sm font-bold text-gray-900">{quotation.customerName}</h4>
              {quotation.customerAddress && (
                <p className="text-gray-600 mt-0.5">{quotation.customerAddress}</p>
              )}
              {quotation.customerPhone && (
                <p className="text-gray-600 mt-0.5">Phone: {quotation.customerPhone}</p>
              )}
              {quotation.customerEmail && (
                <p className="text-gray-600 mt-0.5">Email: {quotation.customerEmail}</p>
              )}
            </div>

            <div className="sm:text-right">
              {quotation.customerGstin && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Customer GSTIN
                  </span>
                  <span className="font-bold text-gray-800 uppercase">{quotation.customerGstin}</span>
                </div>
              )}
              <div className="mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Author / Created By
                </span>
                <span className="font-semibold text-brand">
                  {quotation.createdByName} ({quotation.createdByRole})
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 font-bold uppercase tracking-wider text-gray-700">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center w-16">Qty</th>
                  <th className="p-3 text-right w-24">Rate (₹)</th>
                  <th className="p-3 text-center w-16">Tax %</th>
                  <th className="p-3 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedItems.map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-semibold text-gray-900">{it.description}</td>
                    <td className="p-3 text-center font-medium">{it.quantity}</td>
                    <td className="p-3 text-right">
                      ₹{Number(it.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center text-gray-500">{it.taxPercent || 0}%</td>
                    <td className="p-3 text-right font-bold text-gray-900">
                      ₹{Number(it.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Signatory Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            {/* Notes & Terms */}
            <div className="flex-1 space-y-3 text-xs text-gray-600">
              {quotation.notes && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-800 block mb-0.5">Notes:</span>
                  <p className="whitespace-pre-line">{quotation.notes}</p>
                </div>
              )}
              {quotation.termsConditions && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-800 block mb-0.5">Terms & Conditions:</span>
                  <p className="whitespace-pre-line">{quotation.termsConditions}</p>
                </div>
              )}
            </div>

            {/* Financial Totals & Signatory */}
            <div className="w-full sm:w-72 space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    ₹{Number(quotation.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax Amount:</span>
                  <span className="font-semibold">
                    ₹{Number(quotation.taxTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
                  <span>Grand Total:</span>
                  <span className="text-brand font-black">
                    ₹{Number(quotation.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Authorized Signatory of the Business */}
              <div className="border border-gray-200 rounded-2xl p-3 text-center space-y-1">
                {business?.signatureUrl ? (
                  <div className="h-16 flex items-center justify-center">
                    <img src={business.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-14 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-[11px] text-gray-400">
                    Authorized Signatory
                  </div>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  For {business?.businessName || "OM Enterprises"}
                </span>
                <span className="text-[10px] text-gray-400">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

writeFile('src/components/crm/QuotationModal.tsx', quotationModalContent);

// 5. Dashboard Page Content
const dashboardPageContent = `"use client";

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
} from "lucide-react";
import { formatDateWithPattern } from "@/lib/crmCurrencyData";
import CustomerModal from "@/components/crm/CustomerModal";
import { CreateQuotationModal, ViewQuotationModal } from "@/components/crm/QuotationModal";

export default function CrmDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"quotations" | "customers" | "business" | "team">("quotations");

  // Permissions
  const [canManageTeam, setCanManageTeam] = useState(true);
  const canManageBusiness = user?.role === "Owner" || user?.role === "Admin";

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

        await Promise.all([loadTeam(), loadQuotations(), loadCustomers()]);
      } catch (err) {
        console.error("Failed to load CRM session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

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

        {/* NAVIGATION TABS */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-playfair tracking-tight">
                {activeTab === "quotations" && "Quotations"}
                {activeTab === "customers" && "Customers & Clients"}
                {activeTab === "business" && "Business Profile"}
                {activeTab === "team" && "Team Members"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {activeTab === "quotations" && "Generate, track, and manage official quotations for clients"}
                {activeTab === "customers" && "Manage your client database and direct contact details"}
                {activeTab === "business" && "Official company information registered by the business owner"}
                {activeTab === "team" && "Team access and permissions for your business account"}
              </p>
            </div>

            {/* Four Tab Toggle Buttons */}
            <div className="flex bg-gray-200/80 p-1.5 rounded-2xl shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("quotations")}
                className={"flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 " + (
                  activeTab === "quotations"
                    ? "bg-white text-brand shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <FileText size={15} />
                <span>Quotations</span>
                {quotations.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center">
                    {quotations.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("customers")}
                className={"flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 " + (
                  activeTab === "customers"
                    ? "bg-white text-brand shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <UserCheck size={15} />
                <span>Customers</span>
                {customers.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center">
                    {customers.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("business")}
                className={"flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 " + (
                  activeTab === "business"
                    ? "bg-white text-brand shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Building2 size={15} />
                <span>Business</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("team")}
                className={"flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 " + (
                  activeTab === "team"
                    ? "bg-white text-brand shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Users size={15} />
                <span>Team</span>
                {teamMembers.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center">
                    {teamMembers.length}
                  </span>
                )}
              </button>
            </div>
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
                  onClick={() => setIsCustomerModalOpen(true)}
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
                    onClick={() => setIsCustomerModalOpen(true)}
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

      {/* Customer Creation Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerCreated={(newCust) => {
          setCustomers((prev) => [newCust, ...prev]);
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
    </div>
  );
}
`;

writeFile('src/app/crm/dashboard/page.tsx', dashboardPageContent);



async function run() {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  console.log('Connecting to Turso to ensure tables...');
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS crm_customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL REFERENCES crm_businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        company_name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        gstin TEXT,
        created_by_user_id INTEGER REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at TEXT,
        updated_at TEXT
      )
    `);
    console.log('✓ crm_customers table ensured');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS crm_quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL REFERENCES crm_businesses(id) ON DELETE CASCADE,
        quotation_number TEXT NOT NULL,
        quotation_date TEXT NOT NULL,
        valid_until TEXT,
        customer_id INTEGER REFERENCES crm_customers(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        customer_address TEXT,
        customer_gstin TEXT,
        items TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax_total REAL NOT NULL,
        grand_total REAL NOT NULL,
        notes TEXT,
        terms_conditions TEXT,
        status TEXT NOT NULL DEFAULT 'Draft',
        created_by_user_id INTEGER NOT NULL REFERENCES crm_users(id) ON DELETE CASCADE,
        created_by_name TEXT NOT NULL,
        created_by_role TEXT NOT NULL DEFAULT 'Staff',
        created_at TEXT,
        updated_at TEXT
      )
    `);
    console.log('✓ crm_quotations table ensured');
  } catch (err) {
    console.log('Table migration note:', err.message || err);
  }
}

run().catch(console.error);

