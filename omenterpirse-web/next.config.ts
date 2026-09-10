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
    ];
  },
};

export default nextConfig;
