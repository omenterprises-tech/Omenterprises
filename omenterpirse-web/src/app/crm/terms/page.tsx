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
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  List,
  Sparkles,
  RotateCcw,
  Eye,
  FileText,
} from "lucide-react";

export interface TermPoint {
  id: string;
  text: string;
}

export const DEFAULT_TERM_POINTS: string[] = [
  "Validity: 30 days from quote date.",
  "Payment: 100% advance against Proforma Invoice.",
  "Delivery: 5 to 7 working days from confirmed Purchase Order.",
  "Warranty: 12 months manufacturer warranty against manufacturing defects.",
  "Taxes: GST as applicable at the time of delivery.",
];

export function parseTermsToPoints(termsStr: string): TermPoint[] {
  if (!termsStr || !termsStr.trim()) {
    return DEFAULT_TERM_POINTS.map((text, idx) => ({
      id: `default-${idx}-${Date.now()}`,
      text,
    }));
  }

  // If stored as JSON array
  if (termsStr.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(termsStr);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => typeof item === "string" && item.trim())
          .map((item, idx) => ({
            id: `p-${idx}-${Date.now()}`,
            text: item.trim().replace(/^(\d+[\.\)]\s*|[•\-\*]\s*)/, "").trim(),
          }));
      }
    } catch {
      // fallback to line split
    }
  }

  // Split by newlines
  const lines = termsStr.split("\n");
  const points: TermPoint[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const clean = raw.replace(/^(\d+[\.\)]\s*|[•\-\*]\s*)/, "").trim();
    if (clean) {
      points.push({ id: `p-${i}-${Date.now()}`, text: clean });
    }
  }

  return points.length > 0
    ? points
    : DEFAULT_TERM_POINTS.map((text, idx) => ({
        id: `default-${idx}-${Date.now()}`,
        text,
      }));
}

export default function CrmTermsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Terms State: list of points
  const [points, setPoints] = useState<TermPoint[]>([]);
  const [pointStyle, setPointStyle] = useState<"numbered" | "bulleted">("numbered");
  const [viewMode, setViewMode] = useState<"points" | "raw">("points");
  const [rawText, setRawText] = useState("");

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
        const savedTerms =
          termsData.success && termsData.terms !== undefined
            ? termsData.terms
            : data.business?.otherInfo || "";

        const parsed = parseTermsToPoints(savedTerms);
        setPoints(parsed);
        setRawText(
          parsed.map((p, idx) => `${idx + 1}. ${p.text}`).join("\n")
        );
      } catch (err) {
        console.error("Failed to load CRM session or terms:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router]);

  // Synchronize rawText when switching views
  const handleSwitchToRaw = () => {
    const formatted =
      pointStyle === "numbered"
        ? points.map((p, idx) => `${idx + 1}. ${p.text}`).join("\n")
        : points.map((p) => `• ${p.text}`).join("\n");
    setRawText(formatted);
    setViewMode("raw");
  };

  const handleSwitchToPoints = () => {
    const parsed = parseTermsToPoints(rawText);
    setPoints(parsed);
    setViewMode("points");
  };

  const addPoint = (text = "") => {
    const newId = `point-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setPoints((prev) => [...prev, { id: newId, text }]);
  };

  const updatePoint = (id: string, newText: string) => {
    setPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, text: newText } : p))
    );
  };

  const deletePoint = (id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
  };

  const movePoint = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === points.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setPoints((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const resetDefaults = () => {
    if (confirm("Reset terms to standard commercial default points?")) {
      setPoints(
        DEFAULT_TERM_POINTS.map((text, idx) => ({
          id: `default-${idx}-${Date.now()}`,
          text,
        }))
      );
    }
  };

  const handleSaveTerms = async () => {
    setIsSaving(true);
    setFeedbackMessage(null);
    setFeedbackError(null);

    // Format points based on current mode
    let pointsToSend: string[] = [];
    if (viewMode === "points") {
      pointsToSend = points.map((p) => p.text.trim()).filter(Boolean);
    } else {
      const parsed = parseTermsToPoints(rawText);
      pointsToSend = parsed.map((p) => p.text.trim()).filter(Boolean);
      setPoints(parsed);
    }

    if (pointsToSend.length === 0) {
      setFeedbackError("Please enter at least one terms point.");
      setIsSaving(false);
      return;
    }

    const formattedPayload =
      pointStyle === "numbered"
        ? pointsToSend.map((txt, idx) => `${idx + 1}. ${txt}`).join("\n")
        : pointsToSend.map((txt) => `• ${txt}`).join("\n");

    try {
      const res = await fetch("/api/crm/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terms: formattedPayload,
          points: pointsToSend,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMessage("Terms & Conditions points saved successfully!");
        setBusiness((prev: any) => ({ ...prev, otherInfo: data.terms }));
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading Terms & Points...</p>
      </div>
    );
  }

  const businessName = business?.businessName || "Your Business";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter">
      {/* Top Header Navigation */}
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
                    {points.length} Points
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

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
          {/* Title & Save Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-playfair">
                Commercial Quotation Terms Points
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Add, edit, and organize any text as distinct points for official quotations
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveTerms}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
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

          {/* Permissions / Info Banner */}
          <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex items-start space-x-3 text-xs text-indigo-900">
            <Sparkles size={18} className="shrink-0 mt-0.5 text-indigo-600" />
            <div className="space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>Quotation Terms Points Builder</span>
                {user?.role && (
                  <span className="text-[10px] bg-indigo-200/60 text-indigo-900 px-2 py-0.5 rounded-full uppercase font-extrabold">
                    {user.role} Access
                  </span>
                )}
              </p>
              <p className="text-indigo-800/80 leading-relaxed">
                Both administrators and team members can add any custom text as separate terms points. Each point will be neatly numbered on every customer quotation issued for <strong>{businessName}</strong>.
              </p>
            </div>
          </div>

          {/* Toolbar: Style selection & Add Point */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Point Format:
              </span>
              <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setPointStyle("numbered")}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pointStyle === "numbered"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <ListOrdered size={14} />
                  <span>Numbered (1, 2, 3)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPointStyle("bulleted")}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pointStyle === "bulleted"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <List size={14} />
                  <span>Bullets (•)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={resetDefaults}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold cursor-pointer transition-colors"
                title="Reset points to commercial defaults"
              >
                <RotateCcw size={13} />
                <span>Reset Defaults</span>
              </button>

              {viewMode === "points" ? (
                <button
                  type="button"
                  onClick={handleSwitchToRaw}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <FileText size={13} />
                  <span>Raw Text Mode</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSwitchToPoints}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  <ListOrdered size={13} />
                  <span>Points View</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => addPoint("")}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>+ Add Point</span>
              </button>
            </div>
          </div>

          {/* Points Editor View */}
          {viewMode === "points" ? (
            <div className="space-y-3 pt-2">
              {points.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ListOrdered size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">No Terms Points Yet</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                      Click "+ Add Point" or pick from the Quick Clauses below to add your first point.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addPoint("")}
                    className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow hover:bg-brand-hover cursor-pointer"
                  >
                    + Add First Point
                  </button>
                </div>
              ) : (
                points.map((p, idx) => (
                  <div
                    key={p.id}
                    className="group bg-[#F8FAFC] hover:bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex items-start gap-3"
                  >
                    {/* Point Number Badge */}
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      {pointStyle === "numbered" ? idx + 1 : "•"}
                    </div>

                    {/* Point Text Input */}
                    <div className="flex-1">
                      <textarea
                        rows={2}
                        value={p.text}
                        onChange={(e) => updatePoint(p.id, e.target.value)}
                        placeholder={`Point ${idx + 1}: Enter any text (e.g. Payment: 50% advance, balance against delivery)`}
                        className="w-full bg-transparent px-3 py-2 rounded-xl border border-transparent focus:border-indigo-400 focus:bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium leading-relaxed resize-y"
                      />
                    </div>

                    {/* Reorder and Delete Controls */}
                    <div className="flex items-center space-x-1 shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={() => movePoint(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        title="Move Up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePoint(idx, "down")}
                        disabled={idx === points.length - 1}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        title="Move Down"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePoint(p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Delete Point"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Add Point Bottom Button */}
              {points.length > 0 && (
                <button
                  type="button"
                  onClick={() => addPoint("")}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-gray-600 hover:text-indigo-700 text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Plus size={16} />
                  <span>+ Add Another Point</span>
                </button>
              )}
            </div>
          ) : (
            /* Raw Text Editor View */
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Raw Terms Text (One Point Per Line)
              </label>
              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Type or paste any terms points here (each line becomes a separate point)..."
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-normal leading-relaxed"
              />
              <p className="text-xs text-gray-400">
                Tip: Each line will be saved as a numbered point. Switch back to "Points View" to inspect individual cards.
              </p>
            </div>
          )}

          {/* Quick Insert Clauses */}
          <div className="space-y-2.5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                Quick Insert Clauses (Click to add as a new point):
              </span>
              <span className="text-[11px] text-gray-400">Appends point to list</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addPoint("Validity: 30 days from quotation date.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-semibold cursor-pointer transition-colors border border-transparent hover:border-indigo-200"
              >
                + 30 Days Validity
              </button>
              <button
                type="button"
                onClick={() => addPoint("Payment: 100% advance against Proforma Invoice.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-semibold cursor-pointer transition-colors border border-transparent hover:border-indigo-200"
              >
                + 100% Advance Payment
              </button>
              <button
                type="button"
                onClick={() => addPoint("Payment: 50% advance along with Purchase Order, 50% balance against delivery.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-semibold cursor-pointer transition-colors border border-transparent hover:border-indigo-200"
              >
                + 50% Advance, 50% on Delivery
              </button>
              <button
                type="button"
                onClick={() => addPoint("Delivery: 5 to 7 working days from the date of confirmed PO.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-semibold cursor-pointer transition-colors border border-transparent hover:border-indigo-200"
              >
                + Delivery Timeline (5-7 Days)
              </button>
              <button
                type="button"
                onClick={() => addPoint("Warranty: 12 months comprehensive manufacturer warranty against manufacturing defects.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-semibold cursor-pointer transition-colors border border-transparent hover:border-indigo-200"
              >
                + 12 Months Warranty
              </button>
              <button
                type="button"
                onClick={() => addPoint("Taxes: GST as applicable at the prevailing rates at the time of invoice.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-semibold cursor-pointer transition-colors border border-transparent hover:border-indigo-200"
              >
                + GST Clause
              </button>
              <button
                type="button"
                onClick={() => addPoint("Freight: Ex-works warehouse. Freight and transport charges extra at actuals.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-semibold cursor-pointer transition-colors border border-transparent hover:border-indigo-200"
              >
                + Freight Clause
              </button>
              <button
                type="button"
                onClick={() => addPoint("Jurisdiction: All disputes subject to local jurisdiction only.")}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-semibold cursor-pointer transition-colors border border-transparent hover:border-indigo-200"
              >
                + Jurisdiction Clause
              </button>
            </div>
          </div>

          {/* Live Quotation Preview Card */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 mb-3">
              <Eye size={16} className="text-gray-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Live Quotation Document Preview (Terms & Conditions)
              </h3>
            </div>

            <div className="bg-[#FAFBFD] p-5 rounded-2xl border border-gray-200/90 shadow-inner space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200/70 pb-2">
                <span className="font-extrabold text-xs text-gray-900 uppercase tracking-tight">
                  Official Terms & Conditions
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Printed on {businessName} Quotes
                </span>
              </div>

              {points.filter((p) => p.text.trim()).length === 0 ? (
                <p className="text-xs text-gray-400 italic">No terms points defined.</p>
              ) : (
                <ol className="space-y-1.5 text-xs text-gray-700 font-medium pl-1">
                  {points
                    .filter((p) => p.text.trim())
                    .map((p, idx) => (
                      <li key={p.id} className="flex items-start space-x-2 leading-relaxed">
                        <span className="font-bold text-indigo-600 shrink-0">
                          {pointStyle === "numbered" ? `${idx + 1}.` : "•"}
                        </span>
                        <span>{p.text}</span>
                      </li>
                    ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
