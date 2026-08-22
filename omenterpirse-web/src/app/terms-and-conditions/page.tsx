"use client";

import React from "react";
import { FileText } from "lucide-react";

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-brand-light text-brand-dark py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-brand/5 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-brand/10 pb-8">
          <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center">
            <FileText size={32} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand">Terms & Conditions</h1>
            <p className="text-brand-dark/60 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-8 text-brand-dark/80 leading-relaxed font-inter">
          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing our website and requesting quotes or purchasing our products, you agree to be bound by these Terms and Conditions and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">2. Products, Quotes, and Pricing</h2>
            <p className="mb-4">
              All products listed on the website are subject to availability. We reserve the right to modify or discontinue any product at any time. Quotes generated on this website are estimates and subject to final confirmation by OM Enterprises. We reserve the right to change specifications or prices without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">3. Shipping and Delivery</h2>
            <p>
              We strive to deliver industrial goods in the best condition and within the estimated project timeline. However, delivery timelines are estimates and not guaranteed. OM Enterprises is not liable for project delays caused by logistics companies or unforeseen supplier delays.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">4. Returns and Cancellation</h2>
            <p>
              Given the custom and heavy industrial nature of our electrical supplies, cancellations or returns are subject to a restocking fee and are not accepted for custom-cut cables or special orders unless there is a manufacturer defect. Any issue must be reported within 48 hours of delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">5. Intellectual Property</h2>
            <p>
              All content included on this site, such as text, graphics, logos, images, and software, is the property of OM Enterprises or its component manufacturers and protected by copyright laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">6. Contact Information</h2>
            <p>
              Questions about the Terms and Conditions should be sent to us at: <br/><br/>
              <strong>Email:</strong> <a href="mailto:support.omenterprises@gmail.com" className="text-brand hover:underline">support.omenterprises@gmail.com</a> <br/>
              <strong>Phone:</strong> <a href="tel:+919849845555" className="text-brand hover:underline">+91 9849845555</a> / 9246999660
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
