"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, MapPin, Mail, PhoneCall } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Hide Footer for Admin Portal and Login Page
  if (pathname.startsWith("/admin") || pathname === "/login") {
    return null;
  }

  return (
    <footer className="w-full bg-brand py-10 px-8 text-white/80 font-inter mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Link href="/" className="flex items-center space-x-2 transition-transform hover:scale-105 duration-300">
            <Zap size={22} className="text-[#FF9800] fill-[#FF9800]" />
            <span className="text-lg font-black tracking-wider text-white">
              OM <span className="text-[#FF9800]">ENTERPRISES</span>
            </span>
          </Link>
          <p className="text-white/60 max-w-sm leading-relaxed text-sm">
            OM Enterprises is a trusted supplier of premium electrical cables, wires, switches, distribution boards, LED lighting, and industrial automation solutions.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-white font-bold uppercase tracking-[0.2em] text-xs mb-6">Contact Details</h4>
          <ul className="space-y-4 text-xs text-white/90">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="text-[#FF9800] flex-shrink-0" />
              <span>Showroom: # 1-8-288/1, Sindhi Colony, P.G. Road, Secunderabad - 500 003</span>
            </li>
            <li>
              <a href="mailto:support.omenterprises@gmail.com" className="flex items-center gap-2 hover:text-[#FF9800] transition-colors">
                <Mail size={16} className="text-[#FF9800] flex-shrink-0" />
                <span>support.omenterprises@gmail.com</span>
              </a>
            </li>
            <li>
              <a href="tel:+919849845555" className="flex items-center gap-2 hover:text-[#FF9800] transition-colors">
                <PhoneCall size={16} className="text-[#FF9800] flex-shrink-0" />
                <span>+91 9849845555 / 9246999660</span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-[0.2em] text-xs mb-6">Navigation</h4>
          <ul className="space-y-4 text-sm text-white/70">
            <li><Link href="/about" className="hover:text-[#FF9800] transition-colors">Our Showroom</Link></li>
            <li><Link href="/b2b" className="hover:text-[#FF9800] transition-colors">B2B Supplies</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-[#FF9800] transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms-and-conditions" className="hover:text-[#FF9800] transition-colors">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-8 border-t border-white/10 flex flex-col items-center justify-center text-center text-[10px] uppercase tracking-[0.2em] space-y-2">
        <p className="text-white/45">© 2026 OM Enterprises. All rights reserved.</p>
        <p className="text-white/45">Quality, Reliability & Trust</p>
      </div>
    </footer>
  );
}
