"use client";

import React from "react";
import { Mail, Phone, MessageCircle, MapPin, Clock, Navigation, CheckCircle2 } from "lucide-react";

export default function AboutUs() {
  return (
    <main className="min-h-screen bg-brand-light text-brand-dark">
      
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-brand-dark/75 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=1200&q=80")' }}
        ></div>
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <span className="text-[#FF9800] font-black uppercase tracking-[0.4em] text-xs mb-4 block">Since 1998</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-playfair">Our Store</h1>
          <p className="text-white/80 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Visit our store for premium electrical wires, cables, and solutions.
          </p>
        </div>
      </section>

      {/* Main Story & Experience Center */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div className="space-y-6">
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Visit Us</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand font-playfair">Delivering Excellence in Electrical Supplies</h2>
            <p className="text-brand-dark/70 leading-relaxed text-base">
              Visit our store to get to know more details and fulfill your requirement. We display a wide collection of authentic, certified wires and cables to meet all your project needs.
            </p>
            <p className="text-brand-dark/70 leading-relaxed text-base">
              Whether you are looking for safety-assured domestic house wires or heavy industrial power cables, our Hyderabad showroom showcases solutions crafted for every scale.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#FF9800] flex-shrink-0" />
                <span className="text-sm font-semibold text-brand-dark/80">Certified Products</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#FF9800] flex-shrink-0" />
                <span className="text-sm font-semibold text-brand-dark/80">Direct Dealerships</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#FF9800] flex-shrink-0" />
                <span className="text-sm font-semibold text-brand-dark/80">Expert Consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#FF9800] flex-shrink-0" />
                <span className="text-sm font-semibold text-brand-dark/80">Unmatched Quality</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-[380px] w-full rounded-[2rem] overflow-hidden shadow-xl border border-brand/10">
            <img 
              src="/images/about_wires.png" 
              alt="Electrical Wires Showcase" 
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        {/* Contact & Location Section */}
        <div id="contact" className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-stretch border-t border-brand/5 pt-16 scroll-mt-24">
          
          {/* Left Column: Get In Touch & Address (Col Span 7) */}
          <div className="lg:col-span-7 space-y-10">
            {/* Get In Touch */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-brand font-playfair flex items-center gap-3">
                Get In Touch <Mail size={24} className="text-[#FF9800]" />
              </h3>
              <div className="space-y-4">
                <a href="mailto:support.omenterprises@gmail.com" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center group-hover:bg-[#FF9800] transition-all duration-500">
                    <Mail size={18} className="text-brand group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">Email Us</p>
                    <p className="text-sm font-bold text-brand-dark hover:text-brand transition-colors">support.omenterprises@gmail.com</p>
                  </div>
                </a>
                
                <a href="tel:+919849845555" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center group-hover:bg-[#FF9800] transition-all duration-500">
                    <Phone size={18} className="text-brand group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#FF9800]">Call Us</p>
                    <p className="text-xs font-bold text-brand-dark hover:text-brand transition-colors">+91 9849845555 / 9246999660</p>
                  </div>
                </a>
                
                <a href="https://wa.me/919849845555" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center group-hover:bg-[#25D366] transition-all duration-500">
                    <MessageCircle size={18} className="text-brand group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#25D366]">WhatsApp Us</p>
                    <p className="text-xs font-bold text-brand-dark hover:text-brand transition-colors">+91 9849845555 / 9849033511</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Showroom Details (Address & Hours) */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-brand font-playfair">Showroom Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand/5 flex flex-col justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-brand/5 rounded-xl text-brand flex-shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-brand mb-2 uppercase tracking-widest text-[10px]">Address</h4>
                      <p className="text-xs text-brand-dark/70 leading-relaxed mb-4">
                        # 1-8-288/1, Sindhi Colony,<br/>
                        P.G. Road,<br/>
                        Secunderabad - 500 003
                      </p>
                    </div>
                  </div>
                  <a 
                    href="https://maps.google.com/?q=17.4413520,78.4804000" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center justify-center space-x-2 bg-brand text-white px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-hover transition-all shadow-sm active:scale-95 group mt-2 w-full"
                  >
                    <span>Get Directions</span>
                    <Navigation size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand/5 flex flex-col justify-between h-full">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-brand/5 rounded-xl text-brand flex-shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-brand mb-2 uppercase tracking-widest text-[10px]">Store Hours</h4>
                      <p className="text-xs text-brand-dark/70 leading-relaxed">
                        <span className="block mb-1"><strong>Mon - Sat:</strong> 9:00 AM - 7:00 PM</span>
                        <span className="block text-red-500"><strong>Sunday:</strong> Closed</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-brand-dark/40 font-bold uppercase tracking-widest text-center bg-brand/5 py-2.5 rounded-xl mt-2 w-full">
                    Walk-ins Welcome
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Map (Col Span 5) */}
          <div className="lg:col-span-5 min-h-[450px] relative rounded-[2rem] overflow-hidden shadow-lg border-2 border-white">
            <iframe 
              src="https://maps.google.com/maps?q=17.4413520,78.4804000&t=&z=16&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0, minHeight: "450px" }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[20%] opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-700 w-full h-full"
            ></iframe>
          </div>

        </div>
      </section>
    </main>
  );
}
