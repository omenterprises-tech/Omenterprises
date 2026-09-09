import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OM Enterprises CRM | Business Management Platform",
  description: "Manage your business profile, identity, documents, and team.",
};

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-inter antialiased flex flex-col">
      {children}
    </div>
  );
}
