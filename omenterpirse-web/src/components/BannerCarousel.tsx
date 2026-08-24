"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function BannerCarousel({ banners }: { banners: any[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden shadow-xl group">
      <div 
        className="flex transition-transform duration-700 ease-in-out" 
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="min-w-full h-auto md:aspect-[21/9] lg:aspect-[25/9] relative">
            {banner.mobileImageUrl ? (
              <>
                {/* Laptop View */}
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="hidden md:block w-full h-full object-cover" 
                />
                {/* Mobile View */}
                <img 
                  src={banner.mobileImageUrl} 
                  alt={banner.title} 
                  className="block md:hidden w-full h-auto" 
                />
              </>
            ) : (
              <img 
                src={banner.imageUrl} 
                alt={banner.title} 
                className="w-full h-auto md:h-full md:object-cover" 
              />
            )}
          </div>
        ))}
      </div>
      
      {banners.length > 1 && (
        <>
          <button 
            onClick={() => setCurrent(current === 0 ? banners.length - 1 : current - 1)} 
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/90 p-2 rounded-full shadow-lg backdrop-blur text-brand opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setCurrent((current + 1) % banners.length)} 
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/90 p-2 rounded-full shadow-lg backdrop-blur text-brand opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <ChevronRight size={24} />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`} 
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
