// Homepage - Server Component for maximum performance
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, ChevronDown, ShieldCheck, CheckCircle, Tag, Truck, Wrench, Users, Factory, Building2, Home as HomeIcon, Hammer, HardHat, PhoneCall, Mail, MapPin, ExternalLink, Zap } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import HomeTabs from "@/components/HomeTabs";
import { db } from "@/db";
import { products, productVariations, pageSections, homeCategoryBanners, homeTabs, navigationMenu, categories } from "@/db/schema";
import { eq, sql, inArray, asc } from "drizzle-orm";
import BannerCarousel from "@/components/BannerCarousel";

async function getHomeBanners() {
  try {
    return await db.select()
      .from(homeCategoryBanners)
      .where(eq(homeCategoryBanners.isActive, true))
      .orderBy(asc(homeCategoryBanners.displayOrder));
  } catch (error) {
    console.error("Error fetching home banners:", error);
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    return await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      basePrice: products.basePrice,
      salePrice: products.salePrice,
      images: products.images,
      category: products.category,
      isFeatured: products.isFeatured,
      totalStock: sql<number>`SUM(${productVariations.stock})`.mapWith(Number)
    })
    .from(products)
    .leftJoin(productVariations, eq(products.id, productVariations.productId))
    .where(eq(products.isFeatured, true))
    .groupBy(products.id);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

async function getHomeSections() {
  try {
    const sections = await db.select().from(pageSections).orderBy(pageSections.displayOrder);
    
    const sectionsWithProducts = await Promise.all(sections.map(async (section) => {
      const productIds = section.productIds
        .split(",")
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      if (productIds.length === 0) {
        return { ...section, products: [] };
      }

      const sectionProducts = await db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        basePrice: products.basePrice,
        salePrice: products.salePrice,
        images: products.images,
        category: products.category,
      })
      .from(products)
      .where(inArray(products.id, productIds));

      return {
        ...section,
        products: sectionProducts
      };
    }));

    return sectionsWithProducts;
  } catch (error) {
    console.error("Error fetching home sections:", error);
    return [];
  }
}

const categoryImages: Record<string, string> = {
  "/category/wires": "/images/wires_category.png",
  "/category/cables": "/images/cables_category.png",
  "/category/switches": "/images/switches_category.png",
  "/category/mcb-db": "/images/mcb_db_category.png",
  "/category/lighting": "https://img.icons8.com/color/96/led-diode.png",
  "/category/fans": "https://img.icons8.com/color/96/ceiling-fan.png",
  "/category/conduits": "https://img.icons8.com/color/96/pipe.png",
  "/category/fittings": "https://img.icons8.com/color/96/pliers.png",
  "/category/industrial": "https://img.icons8.com/color/96/power-plant.png",
  "/category/home-products": "https://img.icons8.com/color/96/socket.png",
};

async function getHomeTabs() {
  try {
    const activeCategories = await db.select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.displayOrder);
      
    return activeCategories.map(item => ({
      id: item.id,
      title: item.name,
      linkHref: `/category/${item.slug}`,
      imageUrl: item.imageUrl || "https://img.icons8.com/color/96/socket.png",
      isActive: true
    }));
  } catch (error) {
    console.error("Error fetching active categories:", error);
    return [];
  }
}

async function getCategoriesWithProducts() {
  try {
    const activeCategories = await db.select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.displayOrder);

    const categoriesWithProducts = await Promise.all(
      activeCategories.map(async (cat) => {
        const catProducts = await db.select({
          id: products.id,
          name: products.name,
          description: products.description,
          basePrice: products.basePrice,
          salePrice: products.salePrice,
          images: products.images,
          category: products.category,
          isFeatured: products.isFeatured,
          totalStock: sql<number>`SUM(${productVariations.stock})`.mapWith(Number)
        })
        .from(products)
        .leftJoin(productVariations, eq(products.id, productVariations.productId))
        .where(sql`LOWER(${products.category}) = ${cat.slug.toLowerCase()}`)
        .groupBy(products.id);

        return {
          ...cat,
          products: catProducts
        };
      })
    );

    return categoriesWithProducts.filter(cat => cat.products.length > 0);
  } catch (error) {
    console.error("Error fetching categories with products:", error);
    return [];
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();
  const categoriesWithProducts = await getCategoriesWithProducts();
  const homeSections = await getHomeSections();
  const tabs = await getHomeTabs();
  const banners = await getHomeBanners();

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark font-sans selection:bg-brand-accent/30">
      {/* Home Page Banner */}
      <div className="w-full">
        {banners.length > 0 ? (
          <BannerCarousel banners={banners} />
        ) : (
          <img 
            src="/images/Home_banner_new.jpg" 
            alt="OM Enterprises Banner" 
            className="w-full h-auto"
          />
        )}
      </div>

      <main id="featured-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-10 pt-8">
        {/* Authorised Dealers Section */}
        <div className="space-y-6 text-center">
          <div>
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Partner Brands</span>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mt-2 text-brand">Our Authorised Dealers</h2>
          </div>
          <div className="flex justify-center">
            <img 
              src="/images/authorized_dealers.png" 
              alt="Our Authorised Dealers" 
              className="max-w-4xl w-full h-auto rounded-2xl border border-gray-100 bg-white p-6 md:p-10 shadow-sm"
            />
          </div>
        </div>

        {/* We Also Deal With Section */}
        <div className="space-y-6 text-center">
          <div>
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Other Brands</span>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mt-2 text-brand">We also deal with</h2>
          </div>
          <div className="flex flex-row justify-center items-center gap-4 max-w-4xl mx-auto flex-wrap">
            <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-xs hover:shadow-sm transition-all w-36 sm:w-44 h-16 sm:h-20 flex items-center justify-center">
              <img 
                src="/images/legrand_logo.jpg" 
                alt="Legrand" 
                className="max-h-8 sm:max-h-12 w-auto object-contain"
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-xs hover:shadow-sm transition-all w-36 sm:w-44 h-16 sm:h-20 flex items-center justify-center">
              <img 
                src="/images/finecab_logo.jpg" 
                alt="Finecab" 
                className="max-h-8 sm:max-h-12 w-auto object-contain"
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-xs hover:shadow-sm transition-all w-36 sm:w-44 h-16 sm:h-20 flex items-center justify-center">
              <img 
                src="/images/lk_logo.jpg" 
                alt="Lauritz Knudsen" 
                className="max-h-8 sm:max-h-12 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Home Tabs */}
        {tabs.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-brand">Shop by Categories</h2>
            </div>
            <HomeTabs tabs={tabs as any} />
          </div>
        )}



        {/* Why Choose OM Enterprises */}
        <section className="space-y-12">
          <div className="text-center">
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Our Commitments</span>
            <h2 className="text-3xl font-bold mt-2 text-brand-dark">Why Choose OM Enterprises</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <ShieldCheck size={28} />, title: "Premium Quality Products", desc: "We source only ISI-marked and laboratory-certified industrial grade electrical products." },
              { icon: <CheckCircle size={28} />, title: "Genuine Brands Only", desc: "As authorized suppliers, we guarantee 100% original switchgears, cables, and lighting equipment." },
              { icon: <Tag size={28} />, title: "Competitive B2B Pricing", desc: "Get direct factory pricing and high margins for wholesale, bulk orders, and commercial projects." },
              { icon: <Truck size={28} />, title: "Fast Project Delivery", desc: "State-wide logistics network ensuring materials are supplied directly to your job site on time." },
              { icon: <Wrench size={28} />, title: "Dedicated Tech Support", desc: "Expert engineers available to assist with component selection, sizing, and design solutions." },
              { icon: <Users size={28} />, title: "Experienced B2B Team", desc: "Over a decade of experience serving contractors, developers, OEMs, and government tenders." }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col p-8 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:border-brand/10 transition-all duration-300">
                <div className="text-brand-accent p-3 bg-brand/5 rounded-xl w-fit mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-brand-dark mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Services */}
        <section className="p-8 md:p-12 bg-brand rounded-3xl text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-1 space-y-6">
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em]">Services</span>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">Professional Services & Bulk Supply</h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Beyond supply, we partner with clients to provide engineering consultancies, customized product assembly, and streamlined logistics.
              </p>
              <Link href="/b2b" className="inline-flex items-center text-sm font-bold text-brand-accent hover:underline gap-1">
                Explore B2B Services <ExternalLink size={14} />
              </Link>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Electrical Product Supply", desc: "End-to-end distribution of standard household wiring accessories, conduits, and accessories." },
                { title: "Industrial Equipment Supply", desc: "Heavy machine power connectors, custom panels, motors, and high-rating breakers." },
                { title: "Bulk & B2B Orders", desc: "Special pricing, dedicated accounts, and flexible payment terms for distributors." },
                { title: "Project & Construction Supply", desc: "Unified BOM fulfillment for real estate builders, industrial plants, and utilities." }
              ].map((service, idx) => (
                <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors duration-300">
                  <h3 className="font-bold text-base mb-2 text-white">{service.title}</h3>
                  <p className="text-white/60 text-xs leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries We Serve */}
        <section className="space-y-12">
          <div className="text-center">
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Sector Focus</span>
            <h2 className="text-3xl font-bold mt-2 text-brand-dark">Industries We Serve</h2>
          </div>
          
          <div className="relative w-full overflow-hidden py-4">
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes marquee-ind {
                0% { transform: translateX(0); }
                100% { transform: translateX(-33.33%); }
              }
              .animate-marquee-ind {
                display: flex;
                width: max-content;
                animation: marquee-ind 20s linear infinite;
              }
              .animate-marquee-ind:hover {
                animation-play-state: paused;
              }
            `}} />
            
            {/* Gradient Fades for Left and Right edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex w-max animate-marquee-ind">
              {[...Array(3)].flatMap((_, repIdx) => [
                { icon: <HomeIcon size={40} />, title: "Residential" },
                { icon: <Building2 size={40} />, title: "Commercial" },
                { icon: <Factory size={40} />, title: "Industrial" },
                { icon: <Hammer size={40} />, title: "Construction" },
                { icon: <Wrench size={40} />, title: "Manufacturing" },
                { icon: <HardHat size={40} />, title: "Infrastructure" }
              ].map((ind, i) => (
                <div key={`${repIdx}-${i}`} className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-2xl hover:border-brand/20 hover:shadow-lg transition-all text-center w-48 h-32 select-none mx-3 flex-shrink-0">
                  <div className="text-brand mb-4">{ind.icon}</div>
                  <span className="text-xs font-bold text-brand-dark">{ind.title}</span>
                </div>
              )))}
            </div>
          </div>
        </section>

        {/* Client Testimonials */}
        <section className="space-y-12">
          <div className="text-center">
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Client Reviews</span>
            <h2 className="text-3xl font-bold mt-2 text-brand-dark">Partner Testimonials</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "OM Enterprises has been our primary electrical vendor for five major residential high-rises. Their Polycab cables and Legrand switch supplies arrived exactly on schedule, keeping our construction deadlines intact.", author: "Rajesh Sharma", role: "Projects Director, Sterling Builders" },
              { quote: "Finding genuine Schneider and Siemens control panels in high volumes can be challenging. OM Enterprises solved that with factory-certified documentation and unmatched B2B project rates.", author: "Aman Singhal", role: "Procurement Manager, ElectroFab Industries" },
              { quote: "Their technical engineering support was vital when we redesigned our factory's distribution boards. They helped choose the right rating MCBs and customized MCCB modules.", author: "Vikram Malhotra", role: "Chief Facility Engineer, AutoTech Ltd" }
            ].map((t, idx) => (
              <div key={idx} className="p-8 bg-white border border-gray-100 rounded-2xl relative shadow-sm hover:shadow-md transition-shadow">
                <p className="text-gray-500 text-sm italic leading-relaxed mb-6">"{t.quote}"</p>
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-bold text-sm text-brand-dark">{t.author}</h4>
                  <span className="text-[10px] font-medium text-gray-400">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="p-8 md:p-12 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
          <div className="space-y-3 max-w-xl">
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Quick Inquiry</span>
            <h3 className="text-2xl font-bold text-brand-dark">Ready to Power Your Next Project?</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Connect with our sales department to get specialized bulk pricing, check product stock levels, or consult with our electrical application engineers.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <a href="mailto:omenterprises@gmail.com" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-bold px-6 py-4 rounded-xl shadow-md transition-all text-center">
              <Mail size={16} /> Email Sales
            </a>
            <a href="tel:+919849845555" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-brand text-sm font-bold px-6 py-4 rounded-xl border border-gray-200 shadow-sm transition-all text-center">
              <PhoneCall size={16} /> Call Store
            </a>
          </div>
        </section>
      </main>

    </div>
  );
}
