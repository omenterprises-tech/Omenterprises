import type { NextConfig } from "next";
import path from "path";
import dns from "node:dns";

if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'img.icons8.com',
      },
    ],
  },
  experimental: {
    scrollRestoration: true,
  },
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      { source: '/business', destination: '/crm/business', permanent: false },
      { source: '/teams', destination: '/crm/teams', permanent: false },
      { source: '/team', destination: '/crm/teams', permanent: false },
      { source: '/customers', destination: '/crm/customers', permanent: false },
      { source: '/products', destination: '/crm/products', permanent: false },
      { source: '/terms', destination: '/crm/terms', permanent: false },
      { source: '/quotations', destination: '/crm/quotations', permanent: false },
      { source: '/quotation', destination: '/crm/quotations/create', permanent: false },
      { source: '/quotation-list', destination: '/crm/quotations', permanent: false },
      { source: '/add-customer', destination: '/crm/customers/add', permanent: false },
      { source: '/customer-add', destination: '/crm/customers/add', permanent: false },
    ];
  },
};

export default nextConfig;
