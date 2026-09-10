"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileCheck2,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function CrmTermsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Terms state
  const [standardTerms, setStandardTerms] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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

        // Fetch terms
        const termsRes = await fetch("/api/crm/terms");
        const termsData = await termsRes.json();
        if (termsData.success && termsData.terms !== undefined) {
          setStandardTerms(termsData.terms);
        } else if (data.business?.otherInfo) {
          setStandardTerms(data.business.otherInfo);
        }
      } catch (err) {
        console.error("Failed to load CRM session or terms:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router]);

  const handleSaveTerms = async () => {
    setIsSaving(true);
    setFeedbackMessage(null);
    setFeedbackError(null);

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
        setFeedbackMessage("Standard Terms & Conditions saved successfully!");
        setStandardTerms(data.terms || "");
        setTimeout(() => setFeedbackMessage(null), 5000);
      } else {
        setFeedbackError(data.error || "Failed to save terms.");
      }
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to save terms.");
    } finally {
      setIsSaving(false);
    }
  };

  const addClause = (clause: string) => {
    setStandardTerms((prev) => (prev ? `${prev}\n${clause}` : clause));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading Standard Terms...</p>
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
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <FileCheck2 size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-gray-900 tracking-tight text-base">
                    Terms & Conditions
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold uppercase px-2 py-0.5 rounded-full border border-indigo-100">
                    Quotation Policies
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-playfair">
                Commercial Quotation Terms
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Standard payment, delivery, warranty, and validity rules stamped onto client quotes
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveTerms}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto disabled:opacity-60"
            >
              {isSaving ? (
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

          {/* Feedback Alerts */}
          {feedbackMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {feedbackError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}

          {/* Explanatory Info Card */}
          <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3 text-xs text-blue-900">
            <AlertCircle size={17} className="shrink-0 mt-0.5 text-blue-600" />
            <div>
              <p className="font-bold">Quotation Auto-Population</p>
              <p className="text-blue-800/80 mt-0.5 leading-relaxed">
                These terms will automatically pre-populate into the Terms & Conditions section of every newly generated quotation for {businessName}. Both administrators and team members can customize these policies.
              </p>
            </div>
          </div>

          {/* Text Editor Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Standard Commercial Terms (Markdown or Bulleted)
            </label>
            <textarea
              value={standardTerms}
              onChange={(e) => setStandardTerms(e.target.value)}
              disabled={isSaving}
              rows={9}
              placeholder="Enter standard validity, payment schedule, delivery timelines, taxes, and warranty policies..."
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-normal leading-relaxed disabled:bg-gray-50"
            />
          </div>

          {/* Quick Insert Clauses */}
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                Quick Insert Clauses (Click to append):
              </span>
              <span className="text-[11px] text-gray-400">Click to add clause to terms</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => addClause("• Validity: 30 days from quote date.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                + 30 Days Validity
              </button>
              <button
                type="button"
                onClick={() => addClause("• Payment: 100% advance against Proforma Invoice.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                + 100% Advance Payment
              </button>
              <button
                type="button"
                onClick={() => addClause("• Delivery: 5 to 7 working days from confirmed Purchase Order.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                + Delivery Timeline
              </button>
              <button
                type="button"
                onClick={() => addClause("• Warranty: 12 months manufacturer warranty against manufacturing defects.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                + 12 Months Warranty
              </button>
              <button
                type="button"
                onClick={() => addClause("• Taxes: GST as applicable at the time of delivery.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                + GST Clause
              </button>
              <button
                type="button"
                onClick={() => addClause("• Freight: Ex-works / Freight charges extra at actuals.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                + Freight Clause
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
