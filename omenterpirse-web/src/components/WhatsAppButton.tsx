"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function WhatsAppButton() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname === "/login" || pathname.startsWith("/crm")) {
    return null;
  }

  const phoneNumber = "9849845555";
  const customMessage = encodeURIComponent(
    "Hello OM Enterprises, I visited your website and would like to inquire about your products and services."
  );
  const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${customMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full transition-all duration-300 animate-whatsapp group focus:outline-none focus:ring-4 focus:ring-green-300"
      aria-label="Chat on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      {/* Official WhatsApp SVG Logo */}
      <svg
        className="w-8 h-8 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.927 9.927 0 0 0 4.808 1.238h.005c5.502 0 9.99-4.479 9.99-9.986.002-2.67-1.037-5.18-2.93-7.071A9.902 9.902 0 0 0 12.012 2zm5.82 14.156c-.32.9-1.85 1.748-2.527 1.86-.59.1-1.36.14-3.69-.83-2.98-1.24-4.9-4.28-5.05-4.48-.15-.2-1.22-1.62-1.22-3.1 0-1.47.77-2.19 1.05-2.48.28-.29.61-.36.81-.36.2 0 .4 0 .58.01.19.01.44-.07.69.53.25.6 1.05 2.56 1.14 2.75.1.19.16.41.03.66-.13.25-.26.4-.38.56-.13.16-.27.34-.38.5-.13.15-.27.31-.11.59.16.27.7 1.16 1.5 1.87.8.71 1.48.93 1.78 1.07.3.14.47.12.65-.08.18-.2.78-.9 1-1.2.2-.3.4-.26.68-.16.27.1 1.74.82 2.04.97.3.15.5.22.58.35.07.13.07.76-.25 1.66z" />
      </svg>

      {/* Subtle Tooltip on Hover */}
      <span className="absolute right-16 scale-0 transition-all rounded bg-brand px-3 py-1.5 text-xs text-white font-bold tracking-wider uppercase group-hover:scale-100 whitespace-nowrap shadow-md pointer-events-none">
        Chat with us!
      </span>
    </a>
  );
}
