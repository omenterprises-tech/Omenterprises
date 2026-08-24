"use client";

import { useState, useEffect } from "react";
import { Users, Search, Phone, Calendar, Loader2, ArrowLeft } from "lucide-react";

type Customer = {
  id: number;
  fullName: string | null;
  email: string;
  phoneNumber: string | null;
  role: string;
  createdAt: string;
};

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/admin/customers");
        const data = await res.json();
        if (data.success) {
          setCustomers(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch customers");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phoneNumber && c.phoneNumber.includes(searchTerm))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-brand">Customer Management</h1>
          <p className="mt-2 text-brand/60 font-medium">View and manage your registered boutique clientele.</p>
        </div>

        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/30 group-focus-within:text-[#FF9800] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-brand/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-brand focus:outline-none focus:ring-4 focus:ring-[#FF9800]/5 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand/5 border-b border-brand/10">
              <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Customer Details</th>
              <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Phone Number</th>
              <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Role</th>
              <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Joined On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand/5">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-brand/5 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-brand-accent text-white rounded-xl flex items-center justify-center font-black text-sm">
                      {customer.fullName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-bold text-brand">{customer.fullName || "Guest User"}</p>
                      <p className="text-[10px] text-brand/40 font-bold uppercase tracking-widest mt-0.5">ID: #00{customer.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-2 text-brand/60 group-hover:text-brand transition-colors">
                    <Phone size={14} className="text-[#FF9800]" />
                    <span className="font-bold text-sm tracking-widest">{customer.phoneNumber || "N/A"}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    customer.role === "admin" ? "bg-brand text-white shadow-sm" : "bg-brand/5 text-brand/60"
                  }`}>
                    {customer.role}
                  </span>
                </td>
                <td className="px-8 py-6 text-sm text-brand/40 font-bold tracking-tight">
                  {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCustomers.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-16 h-16 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users size={32} className="text-brand/20" />
            </div>
            <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">No customers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
