"use client";

import React from "react";
import { Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-brand-light text-brand-dark py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-brand/5 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-brand/10 pb-8">
          <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center">
            <Shield size={32} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand">Privacy Policy</h1>
            <p className="text-brand-dark/60 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-8 text-brand-dark/80 leading-relaxed font-inter">
          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">1. Introduction</h2>
            <p>
              Welcome to OM Enterprises. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">2. The Data We Collect About You</h2>
            <p className="mb-4">
              Personal data, or personal information, means any information about an individual from which that person can be identified. We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
              <li><strong>Financial Data</strong> includes bank details for quote payments.</li>
              <li><strong>Transaction Data</strong> includes details about quotes request to and from you and other details of products you have inquired from us.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">3. How We Use Your Data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., fulfilling a quote request or sales order).</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand mb-4">5. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at: <br/><br/>
              <strong>Email:</strong> <a href="mailto:support.omenterprises@gmail.com" className="text-brand hover:underline">support.omenterprises@gmail.com</a> <br/>
              <strong>Phone:</strong> <a href="tel:+919849845555" className="text-brand hover:underline">+91 9849845555</a> / 9246999660
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
