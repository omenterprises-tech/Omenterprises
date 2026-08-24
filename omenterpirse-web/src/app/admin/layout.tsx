"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Map, 
  Zap, 
  Package, 
  Users, 
  LogOut,
  ChevronRight,
  Box,
  BarChart3,
  AlertTriangle,
  X,
  Grid,
  Award,
  Ruler,
  Layers,
  Image as ImageIcon
} from "lucide-react";

const sidebarLinks = [
  { name: "Categories", href: "/admin/categories", icon: Grid },
  { name: "Master Catalog", href: "/admin/catalog", icon: Layers },
  { name: "Banners", href: "/admin/home-banners", icon: ImageIcon },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Customers", href: "/admin/customers", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Don't show sidebar on login/denied pages
  if (pathname === "/admin/login" || pathname === "/admin/denied") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex h-screen bg-brand-light font-inter overflow-hidden">
      {/* Sidebar */}
      <aside className={`w-60 bg-[#0D47A1] text-white flex flex-col shadow-2xl fixed inset-y-0 z-50 transition-all duration-300 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 overflow-hidden rounded-full border border-white/10 shadow-lg flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="Om Enterprises Logo"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="font-bold text-xs tracking-wider text-white uppercase block leading-none">
                OM Enterprises
              </span>
              <p className="text-[8px] uppercase tracking-[0.2em] text-[#FF9800] font-black mt-1">Admin Panel</p>
            </div>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all ml-2 cursor-pointer"
            title="Hide Sidebar"
          >
            <LayoutDashboard size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto min-h-0 sidebar-scrollbar">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? "bg-[#FF9800] text-[#0D47A1] shadow-lg translate-x-1" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Icon size={18} className={isActive ? "text-[#0D47A1]" : "text-[#FF9800]/60 group-hover:text-[#FF9800]"} />
                  <span className="text-sm font-bold tracking-tight">{link.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >
            <LogOut size={18} />
            <span className="text-sm font-bold tracking-tight">Logout</span>
          </button>
        </div>
      </aside>


      {/* Main Content */}
      <main className={`flex-1 min-w-0 h-full overflow-hidden flex flex-col relative transition-all duration-300 ${
        isSidebarOpen ? "ml-60" : "ml-0"
      }`}>
        {/* Floating circular logo toggle button when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-6 left-6 z-50 group flex items-center justify-center w-12 h-12 rounded-full border border-brand/10 shadow-lg bg-white overflow-hidden transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
            title="Show Sidebar"
          >
            {/* Logo default state */}
            <div className="absolute inset-0 transition-opacity duration-300 opacity-100 group-hover:opacity-0 flex items-center justify-center">
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="Om Enterprises Logo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            {/* Dashboard Icon hover state */}
            <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#0D47A1]">
              <LayoutDashboard size={22} />
            </div>
          </button>
        )}

        {/* Header decoration */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#FF9800]/20 to-transparent flex-shrink-0"></div>
        <div 
          id="admin-scroll-container" 
          className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${
            !isSidebarOpen ? "pt-20" : ""
          }`}
        >
          {children}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#0D47A1]/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#0D47A1] mb-2">Confirm Logout</h3>
              <p className="text-[#0D47A1]/60 text-sm mb-8">Are you sure you want to exit the admin panel? You will need to login again to access these settings.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-[#0D47A1]/40 hover:text-[#0D47A1] hover:bg-brand-light transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Logout
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 p-2 text-[#0D47A1]/20 hover:text-[#0D47A1] transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
