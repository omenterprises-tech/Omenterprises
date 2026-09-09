"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ShoppingCart, User, Menu, X, LogOut, AlertCircle, BookOpen, Briefcase, Zap, Loader2, ChevronDown } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";

type NavItem = {
  id: number;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();


  const [navItems, setNavItems] = useState<NavItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ fullName: string | null; phoneNumber: string } | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [collections, setCollections] = useState<{ name: string; slug: string }[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: number; name: string; slug: string; isActive: boolean }[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  let closeTimeout: NodeJS.Timeout;

  // Cart store hydration handling
  const [cartCount, setCartCount] = useState(0);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname === "/login" || pathname.startsWith("/crm")) return;

    setCartCount(getTotalItems());

    // Sync cart with backend if user is logged in
    const syncCart = async () => {
      if (user && cartItems.length > 0) {
        try {
          await fetch("/api/cart/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: cartItems }),
          });
        } catch (error) {
          console.error("Failed to sync cart", error);
        }
      }
    };

    const timeoutId = setTimeout(syncCart, 1000); // Debounce sync
    return () => clearTimeout(timeoutId);
  }, [cartItems, getTotalItems, user, pathname]);

  useEffect(() => {
    const fetchData = async () => {
      if (pathname.startsWith("/admin") || pathname === "/login" || pathname.startsWith("/crm")) return;

      const safeJson = async (res: Response) => {
        if (!res.ok) return null;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await res.json();
        }
        return null;
      };

      try {
        // Fetch Nav Items
        const navRes = await fetch("/api/admin/nav");
        const navData = await safeJson(navRes);
        if (navData?.success) {
          setNavItems(navData.data);
        }

        // Fetch Session
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
        const sessionData = await safeJson(sessionRes);
        if (sessionData?.authenticated) {
          setUser(sessionData.user);
        } else if (sessionData) {
          setUser(null);
          // If the user is logged out, ensure the cart is empty
          if (cartItems.length > 0) {
            clearCart();
          }
        }

        // Fetch Collections (Carousel Names) - For all users
        const collRes = await fetch("/api/home/collections");
        const collData = await safeJson(collRes);
        if (collData?.success) {
          setCollections(collData.data);
        }

        // Fetch All Categories (active and inactive) for collections dropdown
        const allCatsRes = await fetch("/api/admin/categories?all=true");
        const allCatsData = await safeJson(allCatsRes);
        if (allCatsData?.success) {
          setAllCategories(allCatsData.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }

    };

    fetchData();
  }, [pathname, cartItems.length, clearCart]);



  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        clearCart();
        setIsLogoutModalOpen(false);
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Hide Navbar for Admin Portal, Login Page, and CRM
  if (pathname.startsWith("/admin") || pathname === "/login" || pathname.startsWith("/crm")) {
    return null;
  }


  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-brand border-b border-white/10 shadow-lg font-inter">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center mr-2 sm:mr-4 xl:mr-6">
              <Link href="/" className="flex items-center space-x-1.5 transition-transform hover:scale-105 duration-300">
                <Zap size={18} className="text-[#FF9800] fill-[#FF9800] flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base xl:text-xl font-black tracking-wider text-white">
                  OM <span className="text-[#FF9800]">ENTERPRISES</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation removed from main Navbar row */}

            <div className="hidden md:flex items-center space-x-1.5 lg:space-x-2 xl:space-x-3.5 ml-auto text-white">
              <Link href="/" aria-label="Home" className="hover:text-[#FF9800] transition-colors p-1.5 flex items-center gap-1 group whitespace-nowrap">
                <Home className="h-4 w-4" />
                <span className="text-[11px] xl:text-[12px] font-bold tracking-wide hidden lg:block">Home</span>
              </Link>

              <Link href="/about" aria-label="Our Store" className="hover:text-[#FF9800] transition-colors p-1.5 flex items-center gap-1 group whitespace-nowrap">
                <BookOpen className="h-4 w-4" />
                <span className="text-[11px] xl:text-[12px] font-bold tracking-wide hidden lg:block">Our Store</span>
              </Link>

              <Link href={user ? "/cart" : "/login"} aria-label="Cart" className="hover:text-[#FF9800] transition-colors relative p-1.5">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-0.5 -right-0.5 bg-[#FF9800] text-white text-[9px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border border-brand">
                  {cartCount}
                </span>
              </Link>

              {user ? (
                <ProfileDropdown
                  user={user}
                  onLogout={() => setIsLogoutModalOpen(true)}
                />
              ) : (
                <button
                  onClick={() => window.location.href = "/login"}
                  className="flex items-center space-x-1.5 text-[11px] xl:text-xs font-bold tracking-wider bg-[#FF9800] text-white px-3.5 py-2 rounded-full hover:bg-[#F57C00] transition-all shadow-md cursor-pointer relative z-10"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-1 sm:space-x-3 flex-shrink-0">
              <Link href="/" aria-label="Home" className="text-white p-1 sm:p-2 flex-shrink-0">
                <Home className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </Link>
              <Link href="/about" aria-label="Our Store" className="text-white p-1 sm:p-2 flex-shrink-0">
                <BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </Link>
              <Link href={user ? "/cart" : "/login"} aria-label="Cart" className="text-white relative p-1 sm:p-2 flex-shrink-0">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="absolute -top-0.5 -right-0.5 bg-[#FF9800] text-white text-[9px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border border-brand">
                  {cartCount}
                </span>
              </Link>
              {user ? (
                <div className="flex-shrink-0">
                  <ProfileDropdown
                    user={user}
                    onLogout={() => setIsLogoutModalOpen(true)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => window.location.href = "/login"}
                  className="flex items-center justify-center bg-[#FF9800] text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-[#F57C00] transition-all shadow-md cursor-pointer relative z-10 flex-shrink-0"
                  aria-label="Login"
                >
                  <User className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </button>
              )}
            </div>
          </div>
        </div>





      </header>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="text-red-500 h-6 w-6" />
              </div>
              <h3 className="text-xl font-playfair font-bold text-brand mb-2">Log out</h3>
              <p className="text-brand/60 text-sm mb-8 leading-relaxed">
                Are you sure you want to log out from Om Enterprises? You'll need to verify your phone number to sign in again.
              </p>

              <div className="w-full space-y-3">
                <button
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-red-50 text-red-500 font-bold text-sm tracking-widest uppercase hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Yes, Logout"
                  )}
                </button>
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3.5 rounded-xl bg-brand text-white font-bold text-sm tracking-widest uppercase hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}



