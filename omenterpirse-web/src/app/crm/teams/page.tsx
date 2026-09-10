"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function CrmTeamsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Permission: only owner can manage team
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inputsUnlocked, setInputsUnlocked] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [inviteRole, setInviteRole] = useState("Manager");
  const [invitePhone, setInvitePhone] = useState("");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit Member Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("Manager");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadTeam = async () => {
    try {
      const res = await fetch("/api/crm/team");
      const data = await res.json();
      if (data.success && data.members) {
        setTeamMembers(data.members);
        if (typeof data.canManageTeam === "boolean") {
          setCanManageTeam(data.canManageTeam);
        }
      }
    } catch (err) {
      console.error("Failed to load team:", err);
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
        setCanManageTeam(Boolean(data.user?.isOwner ?? (data.user?.role === "Owner")));
        await loadTeam();
      } catch (err) {
        console.error("Failed to load CRM session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router]);

  // Open Add Member Modal
  const openAddModal = () => {
    setInviteName("");
    setInviteEmail("");
    setInvitePassword("");
    setInvitePhone("");
    setInviteRole("Manager");
    setAddError("");
    setInputsUnlocked(false);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddError("");
    setInputsUnlocked(false);
  };

  // Open Edit Member Modal
  const openEditModal = (member: any) => {
    setEditingMember(member);
    setEditName(member.name || "");
    setEditRole(member.role || "Manager");
    setEditPhone(member.phone && member.phone !== "0000000000" ? member.phone : "");
    setEditPassword("");
    setEditError("");
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingMember(null);
    setEditError("");
  };

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setIsSubmittingAdd(true);

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
        throw new Error(data.error || "Failed to add team member.");
      }

      await loadTeam();
      closeAddModal();
      showToast("Team member added successfully!");
    } catch (err: any) {
      setAddError(err.message || "Failed to add team member.");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle Edit Member
  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditError("");
    setIsSubmittingEdit(true);

    try {
      const res = await fetch("/api/crm/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMember.id,
          fullName: editName.trim(),
          role: editRole,
          phoneNumber: editPhone.trim() || undefined,
          password: editPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update team member.");
      }

      await loadTeam();
      closeEditModal();
      showToast("Team member updated successfully!");
    } catch (err: any) {
      setEditError(err.message || "Failed to update team member.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Are you sure you want to revoke CRM access for ${memberName}?`)) return;
    try {
      const res = await fetch(`/api/crm/team?id=${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
        showToast("Team member access removed.");
      } else {
        alert(data.error || "Failed to remove member.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove member.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading Team Roster...</p>
      </div>
    );
  }

  const businessName = business?.businessName || "Your Business";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter">
      {/* Top CRM Header */}
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
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <Users size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-gray-900 tracking-tight text-base">
                    Team Members
                  </span>
                  <span className="text-[10px] bg-purple-50 text-purple-700 font-bold uppercase px-2 py-0.5 rounded-full border border-purple-100">
                    {teamMembers.length} Members
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
        {/* Read-Only Notice for Team Members */}
        {!canManageTeam && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start space-x-3 text-xs text-purple-900">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-purple-600" />
            <div>
              <strong className="block text-sm font-bold text-purple-950 mb-0.5">
                Team Roster (View Access Only)
              </strong>
              <span>
                You are viewing the team member roster for {businessName}. As a{" "}
                <strong>{user?.role || "Team Member"}</strong>, you have view access to team details. Adding, editing, or removing team members is managed exclusively by the primary business owner.
              </span>
            </div>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-playfair">
                Team Directory & Roster
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Staff, managers, and administrators associated with {businessName}
              </p>
            </div>

            {canManageTeam && (
              <button
                type="button"
                onClick={openAddModal}
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
                  <th className="pb-3">Email (Login ID)</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  {canManageTeam && <th className="pb-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamMembers.map((member, idx) => (
                  <tr key={member.id || idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 font-semibold text-gray-900">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                          {(member.name || "U").charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs sm:text-sm">{member.name}</div>
                          {member.phone && member.phone !== "0000000000" ? (
                            <div className="text-[11px] text-gray-400 font-normal">{member.phone}</div>
                          ) : (
                            <div className="text-[11px] text-gray-300 font-normal italic">No phone</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-600 text-xs sm:text-sm font-medium">{member.email}</td>
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
                        className={"inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold " + (
                          member.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}
                      >
                        <span
                          className={"w-1.5 h-1.5 rounded-full " + (
                            member.status === "Active" ? "bg-emerald-500" : "bg-amber-500"
                          )}
                        />
                        <span>{member.status}</span>
                      </span>
                    </td>
                    {canManageTeam && (
                      <td className="py-4 text-right">
                        {!member.isOwner && member.id !== 0 && (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(member)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit team member"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Revoke access"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Team Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Team Member</h3>
                <p className="text-xs text-gray-500">Create login credentials for your colleague</p>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} autoComplete="off" className="space-y-3.5">
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

              <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-xs text-purple-900 leading-relaxed flex items-start gap-2">
                <CheckCircle2 size={15} className="text-purple-600 shrink-0 mt-0.5" />
                <span>
                  Colleagues can log in directly at <strong>/crm</strong> using this email and password.
                </span>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAdd ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Member</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Member Modal */}
      {isEditModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Team Member</h3>
                <p className="text-xs text-gray-500">Update details for {editingMember.email}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white cursor-pointer font-medium"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Reset Password <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Only fill this if you want to set a new password for this team member.
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
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
