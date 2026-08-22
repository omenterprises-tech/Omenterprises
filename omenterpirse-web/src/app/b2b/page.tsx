"use client";

import React from "react";
import { Mail, Phone, Briefcase, TrendingUp, Handshake, ShieldCheck, MessageCircle } from "lucide-react";

export default function B2BPage() {
  return (
    <main className="min-h-screen bg-brand-light text-brand-dark">
      
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-brand-dark/80 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&q=80")' }}
        ></div>
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <span className="text-brand-accent font-black uppercase tracking-[0.4em] text-xs mb-4 block">Partner With Us</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">B2B & Dealership</h1>
          <p className="text-white/80 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Powering commercial projects, construction developments, and manufacturing plants with verified industrial electrical components.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand mb-4">Why Partner With OM Enterprises?</h2>
          <p className="text-brand-dark/70 max-w-2xl mx-auto text-lg">
            We offer premium quality, direct manufacturer pricing, and engineering support to power your enterprise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-brand/5 text-center group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 mx-auto bg-brand/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-accent group-hover:text-white transition-colors duration-300">
              <ShieldCheck size={32} className="text-brand-accent group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-brand mb-3">Premium Quality</h3>
            <p className="text-brand-dark/60 text-sm leading-relaxed">
              We source only ISI-marked and laboratory-certified industrial products to guarantee safe and durable operations.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-brand/5 text-center group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 mx-auto bg-brand/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-accent group-hover:text-white transition-colors duration-300">
              <Handshake size={32} className="text-brand-accent group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-brand mb-3">Trusted Dealership</h3>
            <p className="text-brand-dark/60 text-sm leading-relaxed">
              Become an authorized distributor and enjoy exclusive pricing benefits, priority supply, and dedicated technical submittals.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-brand/5 text-center group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 mx-auto bg-brand/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-accent group-hover:text-white transition-colors duration-300">
              <TrendingUp size={32} className="text-brand-accent group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-brand mb-3">Wholesale Pricing</h3>
            <p className="text-brand-dark/60 text-sm leading-relaxed">
              Highly competitive wholesale rates designed to maximize project budgets while delivering top-tier performance.
            </p>
          </div>
        </div>

        {/* Detailed Info Sections */}
        <div className="space-y-16">
          <div className="bg-brand text-white rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-[80px]"></div>
            <div className="md:w-1/2 relative z-10">
              <h2 className="text-3xl font-bold mb-6">Project Supply Opportunities</h2>
              <p className="text-white/80 leading-relaxed mb-6">
                OM Enterprises supplies complete electrical bills of materials (BOM) for residential townships, commercial parks, and manufacturing complexes. Join our contractor and developer partner network.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand-accent"></span> Custom Switchgear Sizing</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand-accent"></span> Dedicated Project Logistics</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand-accent"></span> Comprehensive Technical Drawings</li>
              </ul>
              <a href="#contact" className="inline-block bg-brand-accent hover:bg-brand-accent/90 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors shadow-lg">
                Partner With Us
              </a>
            </div>
            <div className="md:w-1/2 flex justify-center relative z-10">
              <div className="w-full max-w-sm aspect-square bg-white/10 rounded-[2.5rem] p-8 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                <Briefcase size={120} className="text-brand-accent/50" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 md:p-16 border border-brand/10 flex flex-col md:flex-row-reverse items-center gap-12 shadow-sm">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-brand mb-6">Bulk & OEM Purchases</h2>
              <p className="text-brand-dark/70 leading-relaxed mb-6">
                Ideal for control panel builders, machine manufacturers, and wholesale electrical retailers. Whether you need bulk armoured cables, modular components, or distribution boards, we ensure consistent supplies.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand"></span> Tiered Volume Discounts</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand"></span> Consolidated Job-site Shipments</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand"></span> Customized Switch Assemblies</li>
              </ul>
              <a href="#contact" className="inline-block bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors shadow-lg">
                Request Bulk Quote
              </a>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="w-full max-w-sm aspect-square bg-brand/5 rounded-[2.5rem] p-8 border border-brand/10 flex items-center justify-center">
                <TrendingUp size={120} className="text-brand/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Connect Section */}
      <section id="contact" className="bg-brand-dark py-24 text-white relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Let's Power Projects Together</h2>
          <p className="text-white/70 mb-12 text-lg max-w-2xl mx-auto">
            Connect with our industrial sales department. Whether you require a project estimate or wholesale distribution terms, we are here to support.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="mailto:support.omenterprises@gmail.com" className="bg-white/5 hover:bg-white/10 transition-colors p-8 rounded-3xl border border-white/10 backdrop-blur-sm flex flex-col items-center group">
              <Mail size={32} className="text-brand-accent mb-4" />
              <h4 className="text-sm font-bold uppercase tracking-widest mb-2 text-white/50">Email</h4>
              <p className="font-medium hover:text-brand-accent transition-colors">support.omenterprises@gmail.com</p>
            </a>
            
            <a href="tel:+919849845555" className="bg-white/5 hover:bg-white/10 transition-colors p-8 rounded-3xl border border-white/10 backdrop-blur-sm flex flex-col items-center group">
              <Phone size={32} className="text-brand-accent mb-4" />
              <h4 className="text-sm font-bold uppercase tracking-widest mb-2 text-white/50">Call Us</h4>
              <p className="font-medium hover:text-brand-accent transition-colors">+91 9849845555 / 9246999660</p>
            </a>
 
            <a href="https://wa.me/919849845555" target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-[#25D366]/20 transition-colors p-8 rounded-3xl border border-white/10 backdrop-blur-sm flex flex-col items-center group">
              <MessageCircle size={32} className="text-brand-accent group-hover:text-[#25D366] transition-colors mb-4" />
              <h4 className="text-sm font-bold uppercase tracking-widest mb-2 text-white/50">WhatsApp</h4>
              <p className="font-medium">+91 9849845555 / 9849033511</p>
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
