"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.authenticated) {
          setFullName(data.user.fullName || "");
          setPhoneNumber(data.user.phoneNumber || "");
        } else {
          router.push("/login");
        }
      } catch (err) {
        setError("Failed to load profile details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);

    if (phoneNumber.length !== 10) {
      setError("Phone Number must be exactly 10 digits.");
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "Failed to update profile.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF9800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 rounded-full bg-white border border-brand/5 hover:border-[#FF9800]/30 transition-all text-brand">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-4xl font-playfair font-bold text-brand">Edit Profile</h1>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-brand/5">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand/60 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/40">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-brand-light border border-brand/10 rounded-2xl py-4 pl-12 pr-4 text-brand font-medium focus:outline-none focus:border-[#FF9800] focus:ring-1 focus:ring-[#FF9800] transition-all"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            {/* Phone (Editable) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand/60 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/40">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhoneNumber(val);
                  }}
                  className="w-full bg-brand-light border border-brand/10 rounded-2xl py-4 pl-12 pr-4 text-brand font-medium focus:outline-none focus:border-[#FF9800] focus:ring-1 focus:ring-[#FF9800] transition-all"
                  placeholder="10 Digits"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-500 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 text-green-600 rounded-xl text-sm font-medium border border-green-100">
              Profile updated successfully!
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center space-x-3 bg-brand text-white px-10 py-4 rounded-2xl font-bold tracking-widest uppercase text-sm hover:bg-brand-hover transition-all shadow-xl disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
