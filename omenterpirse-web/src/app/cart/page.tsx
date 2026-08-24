"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, CreditCard, ShieldCheck, CheckCircle2, Scissors, Sparkles, MapPin, AlertTriangle, Truck, Star, Pencil, ClipboardList, QrCode, Building, Lock, X, Wallet, MessageCircle, Award, XCircle, PhoneCall, Box } from "lucide-react";
import { useRouter } from "next/navigation";
import PincodeEstimatorModal from "@/components/PincodeEstimatorModal";
import { formatLength, formatPrice } from "@/lib/utils";

const PACKAGE_DIMENSIONS: Record<number, { L: number; B: number; H: number }> = {
  0.5 : { L: 10, B: 10, H: 10 },
  1 : { L: 20, B: 20, H: 20 },
  1.5 : { L: 30, B: 30, H: 30 },
  2 : { L: 40, B: 40, H: 40 },
};

function getDimensionsForWeight(weightInKg: number) {
  const keys = [0.5, 1, 1.5, 2];
  const matchedKey = keys.find(k => k >= weightInKg) || 2;
  return PACKAGE_DIMENSIONS[matchedKey as keyof typeof PACKAGE_DIMENSIONS];
}

function parseWeightToKg(sizeStr: string): number {
  if (!sizeStr) return 0.5;
  const clean = sizeStr.toLowerCase().trim();
  const numeric = parseFloat(clean);
  if (isNaN(numeric)) return 0.5;
  if (clean.endsWith("kg")) {
    return numeric;
  }
  if (clean.endsWith("g")) {
    return numeric / 1000;
  }
  // Fallback for unlabeled numbers
  return numeric >= 10 ? numeric / 1000 : numeric;
}

function getColorStyles(colorName: string) {
  const name = (colorName || "").toLowerCase().trim();
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    red: { bg: "#EF4444", text: "#FFFFFF", border: "#DC2626" },
    yellow: { bg: "#FBBF24", text: "#000000", border: "#D97706" },
    blue: { bg: "#2563EB", text: "#FFFFFF", border: "#1D4ED8" },
    green: { bg: "#10B981", text: "#FFFFFF", border: "#059669" },
    black: { bg: "#1F2937", text: "#FFFFFF", border: "#111827" },
    white: { bg: "#FFFFFF", text: "#1F2937", border: "#E5E7EB" },
    grey: { bg: "#9CA3AF", text: "#FFFFFF", border: "#7B808A" },
    gray: { bg: "#9CA3AF", text: "#FFFFFF", border: "#7B808A" },
    orange: { bg: "#F97316", text: "#FFFFFF", border: "#EA580C" },
    pink: { bg: "#EC4899", text: "#FFFFFF", border: "#DB2777" },
    purple: { bg: "#8B5CF6", text: "#FFFFFF", border: "#7C3AED" },
    brown: { bg: "#78350F", text: "#FFFFFF", border: "#451A03" },
  };
  return colorMap[name] || { bg: "#E5E7EB", text: "#374151", border: "#D1D5DB" };
}

function calculateTotalWeight(items: any[]): number {
  if (!items || !Array.isArray(items) || items.length === 0) return 0.5;
  let total = 0;
  for (const item of items) {
    const qty = item.quantity || 1;
    const w = parseWeightToKg(item.size || "");
    total += w * qty;
  }
  return total > 0 ? total : 0.5;
}

function extractPincode(address: string): string {
  if (!address) return "";
  const match = address.match(/\b\d{6}\b/);
  return match ? match[0] : "";
}

function calculateFallbackShipping(totalWeightGrams: number): number {
  if (totalWeightGrams <= 500) {
    return 65;
  }
  const extraWeight = totalWeightGrams - 500;
  const extraUnits = Math.ceil(extraWeight / 500);
  return 65 + extraUnits * 50;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"address" | "payment_options" | "payment_confirm" | "processing">("address");
  const [paymentMethodTab, setPaymentMethodTab] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  const [dummyCardNumber, setDummyCardNumber] = useState("");
  const [dummyCardExpiry, setDummyCardExpiry] = useState("");
  const [dummyCardCVV, setDummyCardCVV] = useState("");
  const [dummyUpiId, setDummyUpiId] = useState("");
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [address, setAddress] = useState({
    fullName: "",
    apartment: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    phone: ""
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const handleAddressFieldChange = (field: keyof typeof address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    if (addressErrors[field]) {
      setAddressErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateAddressForm = () => {
    const errors: Record<string, string> = {};
    if (showNewAddressForm) {
      if (!address.fullName.trim()) errors.fullName = "Full Name is required";
      if (!address.apartment.trim()) errors.apartment = "Apartment/Suite is required";
      if (!address.street.trim()) errors.street = "Street address is required";
      if (!address.city.trim()) errors.city = "City is required";
      if (!address.state.trim()) errors.state = "State is required";
      if (!address.pincode.trim()) {
        errors.pincode = "Pincode is required";
      } else if (address.pincode.length !== 6) {
        errors.pincode = "Enter a valid 6-digit pincode";
      }
      if (!address.phone.trim()) {
        errors.phone = "Phone number is required";
      } else if (address.phone.length !== 10) {
        errors.phone = "Enter a valid 10-digit phone number";
      }
    } else {
      if (savedAddresses.length > 0 && selectedAddressIndex === null) {
        errors.savedAddress = "Please select a delivery address";
      }
    }
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const [orderId, setOrderId] = useState<number | null>(null);
  const router = useRouter();

  // Shipping dynamic rates state variables
  const [shippingCost, setShippingCost] = useState<number | null>(0);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);

  const totalWeight = calculateTotalWeight(items);
  const dimensions = getDimensionsForWeight(totalWeight);

  const handlePincodeSubmit = (pincode: string) => {
    setAddress((prev) => ({ ...prev, pincode }));
    fetchAndCalculateShipping(pincode);
  };

  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
    const selected = shippingRates.find((r) => r.id === rateId);
    if (selected) {
      setShippingCost(selected.charge);
    }
  };

  const fetchAndCalculateShipping = async (pincode: string) => {
    setIsLoadingRates(true);
    setShippingError(null);
    try {
      const totalWeightKg = calculateTotalWeight(items);
      let charge = 0;
      let serviceName = "Porter Delivery";
      
      if (totalWeightKg <= 20) {
        charge = 150 + Math.ceil(totalWeightKg) * 8;
        serviceName = "Porter (2 Wheeler)";
      } else if (totalWeightKg <= 300) {
        charge = 450 + Math.ceil(totalWeightKg - 20) * 5;
        serviceName = "Porter (3 Wheeler)";
      } else {
        charge = 950 + Math.ceil(totalWeightKg - 300) * 3;
        serviceName = "Porter (Tata Ace/Pickup)";
      }
      
      const porterRate = {
        id: "porter_local",
        name: serviceName,
        charge: Math.round(charge),
      };

      setShippingRates([porterRate]);
      setSelectedRateId("porter_local");
      setShippingCost(porterRate.charge);
    } catch (err) {
      console.error(err);
      setShippingError("Failed to calculate Porter delivery charges.");
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Handle hydration and load Razorpay script
  useEffect(() => {
    setIsHydrated(true);
    
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Load saved addresses and session on mount, trigger auto-fetch if default address exists
  useEffect(() => {
    if (!isHydrated) return;

    const loadSavedAddressesOnMount = async () => {
      setFetchingAddress(true);
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated) {
          const res = await fetch("/api/profile/address");
          const data = await res.json();
          if (data.success && data.addresses && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            setSelectedAddressIndex(0);
            setShowNewAddressForm(false);
            
            // Extract pincode and calculate immediately
            const pincode = extractPincode(data.addresses[0]);
            if (pincode && pincode.length === 6) {
              fetchAndCalculateShipping(pincode);
            }
          } else {
            setSavedAddresses([]);
            setShowNewAddressForm(true);
          }
        } else {
          setSavedAddresses([]);
          setShowNewAddressForm(true);
        }
      } catch (e) {
        console.error("Failed to load saved addresses on mount", e);
        setShowNewAddressForm(true);
      } finally {
        setFetchingAddress(false);
      }
    };

    loadSavedAddressesOnMount();
  }, [isHydrated]);

  // Fetch live shipping rates when pincode changes or address changes
  useEffect(() => {
    if (!isHydrated) return;

    let activePincode = "";
    let shouldDebounce = false;

    if (showNewAddressForm) {
      activePincode = address.pincode.trim();
      shouldDebounce = true;
    } else if (selectedAddressIndex !== null && savedAddresses[selectedAddressIndex]) {
      activePincode = extractPincode(savedAddresses[selectedAddressIndex]);
      shouldDebounce = false;
    }

    if (!activePincode || activePincode.length !== 6) {
      setShippingRates([]);
      setShippingCost(null);
      setSelectedRateId("");
      if (showNewAddressForm && activePincode.length > 0) {
        setShippingError("Please enter a valid 6-digit delivery pincode.");
      } else if (!showNewAddressForm && savedAddresses.length > 0) {
        setShippingError("Please select a delivery address.");
      } else {
        setShippingError(null);
      }
      return;
    }

    const calculate = () => {
      fetchAndCalculateShipping(activePincode);
    };

    if (shouldDebounce) {
      const timer = setTimeout(calculate, 500);
      return () => clearTimeout(timer);
    } else {
      calculate();
    }
  }, [
    isHydrated,
    showNewAddressForm,
    selectedAddressIndex,
    savedAddresses,
    address.pincode,
    totalWeight,
    dimensions.L,
    dimensions.B,
    dimensions.H
  ]);

  if (!isHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF9800] animate-spin" />
      </div>
    );
  }

  if (items.length === 0 && !isCheckoutModalOpen && !isProcessingPayment) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-brand/5 rounded-full flex items-center justify-center mb-6">
          <ClipboardList className="text-brand/20" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-brand mb-4">Your cart is empty</h1>
        <p className="text-brand/60 mb-10 text-center max-w-md leading-relaxed">
          Looks like you haven't added any electrical products to your cart yet. Explore our catalog to start shopping.
        </p>
        <Link 
          href="/" 
          className="bg-brand text-white px-10 py-4 rounded-2xl font-bold tracking-widest uppercase text-sm hover:bg-brand-hover transition-all shadow-xl active:scale-95"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const gst = subtotal * 0.18;
  const shipping = 0;
  const total = subtotal + gst + shipping;

  const handleCheckout = async () => {
    setIsCheckoutModalOpen(true);
    setPaymentStep("address");
    
    // Attempt to fetch saved addresses
    setFetchingAddress(true);
    try {
      const res = await fetch("/api/profile/address");
      const data = await res.json();
      if (data.success && data.addresses && data.addresses.length > 0) {
        setSavedAddresses(data.addresses);
        if (selectedAddressIndex === null || selectedAddressIndex >= data.addresses.length) {
          setSelectedAddressIndex(0);
        }
        setShowNewAddressForm(false);
      } else {
        setSavedAddresses([]);
        setShowNewAddressForm(true);
      }
    } catch (e) {
      console.error("Failed to load saved addresses", e);
      setShowNewAddressForm(true);
    } finally {
      setFetchingAddress(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentStep("processing");

    try {
      // Find selected rate details to send
      const selectedRate = shippingRates.find((r) => r.id === selectedRateId);
      const shippingDetailsObj = selectedRate ? {
        courierId: selectedRate.id,
        courierName: selectedRate.name,
        shippingCharges: selectedRate.charge,
        weight: totalWeight,
        dimensions: dimensions
      } : null;

      // Directly verify and create order in DB with paymentMethod = "quote"
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalAmount: total,
          paymentMethod: "quote",
          shippingAddress: showNewAddressForm 
            ? `Name: ${address.fullName}, Street: ${address.street}${address.apartment ? `, Apt: ${address.apartment}` : ""}${address.landmark ? `, Landmark: ${address.landmark}` : ""}, City: ${address.city}, State: ${address.state}, Pincode: ${address.pincode}, Contact: ${address.phone}`
            : savedAddresses[selectedAddressIndex || 0],
          shippingDetails: shippingDetailsObj ? JSON.stringify(shippingDetailsObj) : null,
        })
      });

      const checkoutData = await checkoutRes.json();
      if (checkoutData.success) {
        if (showNewAddressForm) {
          const newAddressStr = `Name: ${address.fullName}, Street: ${address.street}${address.apartment ? `, Apt: ${address.apartment}` : ""}${address.landmark ? `, Landmark: ${address.landmark}` : ""}, City: ${address.city}, State: ${address.state}, Pincode: ${address.pincode}, Contact: ${address.phone}`;
          try {
            await fetch("/api/profile/address", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: newAddressStr })
            });
          } catch (e) {
            console.error("Failed to auto-save new address to profile:", e);
          }
        }
        clearCart();
        router.push("/profile/orders");
      } else {
        alert("Quote submission failed: " + checkoutData.error);
        setPaymentStep("address");
        setIsProcessingPayment(false);
      }
    } catch (error: any) {
      console.error("Quote submission error:", error);
      alert(error.message || "Something went wrong. Please try again.");
      setPaymentStep("address");
      setIsProcessingPayment(false);
    }
  };

  const handleWhatsAppOrder = async () => {
    setIsProcessingPayment(true);
    setPaymentStep("processing");

    try {
      const shippingAddressStr = showNewAddressForm
        ? `Name: ${address.fullName}, Street: ${address.street}${address.apartment ? `, Apt: ${address.apartment}` : ""}${address.landmark ? `, Landmark: ${address.landmark}` : ""}, City: ${address.city}, State: ${address.state}, Pincode: ${address.pincode}, Contact: ${address.phone}`
        : savedAddresses[selectedAddressIndex || 0];

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalAmount: total,
          paymentMethod: "whatsapp_order",
          shippingAddress: shippingAddressStr,
        })
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutData.success) {
        throw new Error(checkoutData.error || "Order creation failed");
      }

      const createdOrderId = checkoutData.orderId;

      if (showNewAddressForm) {
        try {
          await fetch("/api/profile/address", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: shippingAddressStr })
          });
        } catch (e) {
          console.error("Failed to auto-save address:", e);
        }
      }

      const itemsListText = items.map((item, idx) => {
        const specs = [
          item.size ? `Size: ${item.size}` : null,
          item.color ? `Color: ${item.color}` : null,
          item.customizations?.lengthInMeters ? `Length: ${formatLength(item.customizations.lengthInMeters)}` : null
        ].filter(Boolean).join(" | ");

        return `${idx + 1}. *${item.name}*\n   • ${specs}\n   • Qty: ${item.quantity} Coils @ ₹${formatPrice(item.price)} = ₹${formatPrice(item.quantity * item.price)}`;
      }).join("\n\n");

      const waText = `🛒 *NEW ORDER ON OM ENTERPRISES*
*Order ID:* #${createdOrderId}

📦 *ITEMS ORDERED:*
${itemsListText}

💰 *SUBTOTAL:* ₹${formatPrice(subtotal)}
🚚 *DELIVERY CHARGES:* As per Porter
⭐ *TOTAL AMOUNT:* ₹${formatPrice(total)} (INCL GST)

📍 *DELIVERY ADDRESS:*
${shippingAddressStr}

Please confirm my order. Thank you!`;

      const encodedMsg = encodeURIComponent(waText);
      const whatsappUrl = `https://wa.me/919849845555?text=${encodedMsg}`;

      window.open(whatsappUrl, "_blank");

      clearCart();
      setIsCheckoutModalOpen(false);
      router.push("/profile/orders");
    } catch (error: any) {
      console.error("WhatsApp Order Error:", error);
      alert(error.message || "Something went wrong. Please try again.");
      setPaymentStep("address");
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <div className="flex items-center space-x-4 mb-6">
        <h1 className="text-3xl font-bold text-brand">Shopping Cart</h1>
        <span className="bg-brand/5 text-brand/60 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
          {getTotalItems()} Products
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-5 lg:max-h-[75vh] lg:overflow-y-auto lg:pr-4 no-scrollbar">
          {items.map((item) => {
            const isBespoke = item.customizations?.type === "Bespoke";
            return (
              <div 
                key={item.id} 
                className={`group rounded-3xl p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 border ${
                  isBespoke 
                    ? 'bg-[#F9F6EE] border-[#FF9800]/40' 
                    : 'bg-white border-brand/40 hover:border-brand/70'
                }`}
              >
              {/* Product Image */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white border border-gray-100 rounded-2xl overflow-hidden flex-shrink-0 relative p-2 flex items-center justify-center">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="max-w-full max-h-full object-contain transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              {/* Item Info */}
              <div className="flex-1 flex flex-col h-full text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-base font-bold text-brand leading-tight">{item.name}</h3>
                      {isBespoke && (
                        <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#FF9800] text-white rounded-full">
                          <Scissors size={10} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Bespoke</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-1">
                      <span className="text-[9px] font-bold text-brand/40 uppercase tracking-widest bg-brand/5 px-2 py-0.5 rounded-full">
                        Specification: {item.size}
                      </span>
                      {item.color && (
                        <span 
                          style={{ 
                            backgroundColor: getColorStyles(item.color).bg, 
                            color: getColorStyles(item.color).text, 
                            borderColor: getColorStyles(item.color).border 
                          }} 
                          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs"
                        >
                          Color: {item.color}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 text-lg font-bold text-brand">
                    ₹{formatPrice(item.price)}
                  </div>
                </div>

                <div className="mt-auto pt-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100">
                  {/* Quantity Selector */}
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden transition-colors hover:border-gray-300">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-2 sm:px-3 hover:bg-gray-200 text-gray-600 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 sm:w-10 text-center font-bold text-gray-900 text-xs sm:text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-2 sm:px-3 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="mt-4 sm:mt-0 flex items-center space-x-2 text-gray-400 hover:text-red-500 transition-colors group/remove"
                  >
                    <div className="p-2 rounded-xl bg-gray-50 group-hover/remove:bg-red-50 transition-colors">
                      <Trash2 size={16} className="group-hover/remove:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Remove</span>
                  </button>
                </div>
              </div>
              </div>
            );
          })}
        </div>

        {/* Right: Price Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 sticky top-24">
            <h2 className="text-sm font-bold mb-6 tracking-widest uppercase border-b border-gray-100 pb-4 text-brand">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-brand/60">
                <span className="text-xs font-bold tracking-widest uppercase">Est. Subtotal</span>
                <span className="text-sm font-bold tracking-widest text-brand">₹{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-brand/60 pb-4 border-b border-gray-100">
                <span className="text-xs font-bold tracking-widest uppercase">Est. Shipping</span>
                <span className="text-brand font-bold text-xs uppercase tracking-wide">Based on Porter charges</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-black tracking-widest uppercase text-brand">Total Estimate</span>
                <span className="text-xl font-black text-brand tracking-widest">₹{formatPrice(total)} (INCL GST)</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full bg-brand text-white py-4 rounded-xl font-bold tracking-widest uppercase text-xs hover:bg-brand-hover transition-all shadow-md flex items-center justify-center group active:scale-[0.98]"
            >
              Proceed to Buy
              <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="mt-6 flex items-center justify-center space-x-3 opacity-40">
              <div className="text-[8px] text-brand uppercase tracking-[0.3em] font-black">No Online Payment</div>
              <div className="h-1 w-1 rounded-full bg-brand"></div>
              <div className="text-[8px] text-brand uppercase tracking-[0.3em] font-black">Order Review</div>
            </div>

            <div className="grid grid-cols-3 gap-y-6 gap-x-2 mt-8 pt-6 border-t border-gray-150">
              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div className="w-10 h-10 rounded-full bg-[#0D47A1]/5 text-[#0D47A1] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0D47A1]/10">
                  <Truck size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-[#0D47A1] uppercase tracking-wide leading-tight">
                  Porter<br/>Delivery
                </span>
              </div>

              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div className="w-10 h-10 rounded-full bg-[#0D47A1]/5 text-[#0D47A1] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0D47A1]/10">
                  <ShieldCheck size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-[#0D47A1] uppercase tracking-wide leading-tight">
                  Secure<br/>payments
                </span>
              </div>

              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div className="w-10 h-10 rounded-full bg-[#0D47A1]/5 text-[#0D47A1] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0D47A1]/10">
                  <Award size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-[#0D47A1] uppercase tracking-wide leading-tight">
                  Genuine<br/>products
                </span>
              </div>

              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div className="w-10 h-10 rounded-full bg-[#0D47A1]/5 text-[#0D47A1] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0D47A1]/10">
                  <XCircle size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-[#0D47A1] uppercase tracking-wide leading-tight">
                  Non<br/>returnable
                </span>
              </div>

              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div className="w-10 h-10 rounded-full bg-[#0D47A1]/5 text-[#0D47A1] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0D47A1]/10">
                  <PhoneCall size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-[#0D47A1] uppercase tracking-wide leading-tight">
                  Call<br/>support
                </span>
              </div>

              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div className="w-10 h-10 rounded-full bg-[#0D47A1]/5 text-[#0D47A1] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0D47A1]/10">
                  <Box size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-[#0D47A1] uppercase tracking-wide leading-tight">
                  Heavy<br/>& Bulky
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className={`bg-white rounded-[2.5rem] w-full shadow-2xl relative overflow-hidden max-h-[95vh] overflow-y-auto no-scrollbar transition-all duration-300 ${
              (paymentStep === "payment_options" || paymentStep === "payment_confirm") 
                ? "max-w-4xl p-0" 
                : "max-w-xl p-8"
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >

            {paymentStep === "address" && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-brand/5 rounded-2xl text-brand">
                    {fetchingAddress ? <Loader2 size={24} className="animate-spin" /> : <MapPin size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand">Project Delivery Address</h3>
                    <p className="text-[10px] text-brand/40 font-black uppercase tracking-widest">
                      {fetchingAddress ? "Looking for your saved address..." : "Where should we deliver your products?"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {!showNewAddressForm && savedAddresses.length > 0 ? (
                    <div className="space-y-4">
                      <div className="max-h-60 overflow-y-auto no-scrollbar space-y-3 pr-2">
                        {savedAddresses.map((addr, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => {
                              setSelectedAddressIndex(idx);
                              if (addressErrors.savedAddress) {
                                setAddressErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy.savedAddress;
                                  return copy;
                                });
                              }
                            }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedAddressIndex === idx 
                                ? 'border-[#FF9800] bg-[#FF9800]/5' 
                                : 'border-brand/10 hover:border-brand/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium text-brand whitespace-pre-wrap break-words min-w-0">{addr}</p>
                              {selectedAddressIndex === idx && <CheckCircle2 size={18} className="text-[#FF9800] flex-shrink-0 mt-1" />}
                            </div>
                          </div>
                        ))}
                      </div>
                      {addressErrors.savedAddress && (
                        <p className="text-xs text-red-500 font-bold text-center py-2 bg-red-50 border border-red-100 rounded-xl animate-in fade-in">{addressErrors.savedAddress}</p>
                      )}
                      <button 
                        onClick={() => {
                          setShowNewAddressForm(true);
                          setAddressErrors({});
                        }}
                        className="w-full py-4 border-2 border-dashed border-brand/20 rounded-xl text-xs font-bold text-brand hover:bg-brand/5 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Add New Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {savedAddresses.length > 0 && (
                        <button 
                          onClick={() => setShowNewAddressForm(false)}
                          className="text-xs font-bold text-brand hover:underline self-start mb-2 flex items-center gap-2"
                        >
                          &larr; Back to saved addresses
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={address.fullName}
                            onChange={(e) => handleAddressFieldChange("fullName", e.target.value)}
                            className={`w-full bg-brand/5 border rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all ${
                              addressErrors.fullName ? 'border-red-500 focus:ring-red-100 bg-red-50/10' : 'border-brand/5'
                            }`}
                            placeholder="John Doe"
                          />
                          {addressErrors.fullName && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{addressErrors.fullName}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Apartment / Suite / Flat</label>
                          <input 
                            type="text" 
                            required
                            value={address.apartment}
                            onChange={(e) => handleAddressFieldChange("apartment", e.target.value)}
                            className={`w-full bg-brand/5 border rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all ${
                              addressErrors.apartment ? 'border-red-500 focus:ring-red-100 bg-red-50/10' : 'border-brand/5'
                            }`}
                            placeholder="Suite 4B"
                          />
                          {addressErrors.apartment && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{addressErrors.apartment}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Street Address</label>
                          <input 
                            type="text" 
                            required
                            value={address.street}
                            onChange={(e) => handleAddressFieldChange("street", e.target.value)}
                            className={`w-full bg-brand/5 border rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all ${
                              addressErrors.street ? 'border-red-500 focus:ring-red-100 bg-red-50/10' : 'border-brand/5'
                            }`}
                            placeholder="123 Boutique Lane"
                          />
                          {addressErrors.street && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{addressErrors.street}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Landmark</label>
                          <input 
                            type="text" 
                            value={address.landmark}
                            onChange={(e) => handleAddressFieldChange("landmark", e.target.value)}
                            className="w-full bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                            placeholder="Near City Mall"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">City</label>
                          <input 
                            type="text" 
                            required
                            value={address.city}
                            onChange={(e) => handleAddressFieldChange("city", e.target.value)}
                            className={`w-full bg-brand/5 border rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all ${
                              addressErrors.city ? 'border-red-500 focus:ring-red-100 bg-red-50/10' : 'border-brand/5'
                            }`}
                            placeholder="Mumbai"
                          />
                          {addressErrors.city && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{addressErrors.city}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">State</label>
                          <input 
                            type="text" 
                            required
                            value={address.state}
                            onChange={(e) => handleAddressFieldChange("state", e.target.value)}
                            className={`w-full bg-brand/5 border rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all ${
                              addressErrors.state ? 'border-red-500 focus:ring-red-100 bg-red-50/10' : 'border-brand/5'
                            }`}
                            placeholder="Maharashtra"
                          />
                          {addressErrors.state && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{addressErrors.state}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Pincode</label>
                          <input 
                            type="text" 
                            required
                            maxLength={6}
                            value={address.pincode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              handleAddressFieldChange("pincode", val);
                            }}
                            className={`w-full bg-brand/5 border rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all ${
                              addressErrors.pincode ? 'border-red-500 focus:ring-red-100 bg-red-50/10' : 'border-brand/5'
                            }`}
                            placeholder="6 Digits"
                          />
                          {addressErrors.pincode && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{addressErrors.pincode}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Contact Phone</label>
                          <input 
                            type="text" 
                            required
                            maxLength={10}
                            value={address.phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              handleAddressFieldChange("phone", val);
                            }}
                            className={`w-full bg-brand/5 border rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all ${
                              addressErrors.phone ? 'border-red-500 focus:ring-red-100 bg-red-50/10' : 'border-brand/5'
                            }`}
                            placeholder="10 Digits"
                          />
                          {addressErrors.phone && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{addressErrors.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  


                  {/* Checkout Order Summary inside modal */}
                  {!isLoadingRates && !shippingError && shippingCost !== null && (
                    <div className="bg-brand-light border border-brand/30 rounded-2xl p-4 space-y-2.5 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex justify-between items-center text-xs font-bold text-brand/60">
                        <span>Est. Subtotal</span>
                        <span>₹{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-brand/60">
                        <span>Est. Shipping</span>
                        <span className="text-[10px] uppercase font-black tracking-wide text-brand">Based on Porter charges</span>
                      </div>
                      <div className="border-t border-brand/10 pt-2 flex justify-between items-center text-sm font-black text-brand">
                        <span>Total Estimate</span>
                        <span className="text-brand">₹{formatPrice(total)} (INCL GST)</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsCheckoutModalOpen(false)}
                      className="flex-1 py-4 border-2 border-brand/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand/40 hover:bg-brand/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      disabled={isLoadingRates}
                      onClick={() => {
                        if (validateAddressForm()) {
                          handleWhatsAppOrder();
                        }
                      }}
                      className="flex-[2] py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} />
                      <span>Proceed via WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            )}


            {(paymentStep === "payment_options" || paymentStep === "payment_confirm") && (
              <div className="flex flex-col md:flex-row h-full min-h-[500px] animate-in fade-in duration-300">
                {/* Left Panel (Theme Blue Sidebar) */}
                <div className="w-full md:w-1/3 bg-[#0D47A1] text-white p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
                  <div className="space-y-6">
                    {/* Header: Brand Name */}
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <Sparkles className="text-brand-accent h-6 w-6" />
                      </div>
                      <span className="text-lg font-black tracking-widest uppercase">OM Enterprises</span>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-white/10 rounded-2xl p-4">
                      <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Price Summary</p>
                      <h3 className="text-3xl font-black tracking-widest">₹{formatPrice(total)}</h3>
                    </div>

                    {/* Contact Number */}
                    <div className="flex items-center space-x-2 text-xs font-semibold text-white/80 bg-white/5 rounded-xl py-3 px-4">
                      <ShieldCheck size={14} className="text-white/60" />
                      <span>Using as {address.phone || "+91 9999999999"}</span>
                    </div>
                  </div>

                  {/* Trust branding */}
                  <div className="mt-8 pt-4 border-t border-white/10 flex items-center space-x-2 text-[9px] text-white/40 font-bold uppercase tracking-widest">
                    <Lock size={10} />
                    <span>Secured by Razorpay</span>
                  </div>
                </div>

                {/* Right Panel (Content) */}
                <div className="flex-1 bg-white p-8 flex flex-col justify-between">
                  {/* Close Modal Button */}
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="text-sm font-bold text-brand uppercase tracking-widest">Payment Options</span>
                    <button 
                      type="button"
                      onClick={() => setIsCheckoutModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {paymentStep === "payment_options" ? (
                    <div className="flex flex-1 flex-col md:flex-row mt-6 gap-6 min-h-[350px]">
                      {/* Tabs List */}
                      <div className="w-full md:w-1/3 flex flex-row md:flex-col border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4 gap-1">
                        <button
                          type="button"
                          onClick={() => setPaymentMethodTab("upi")}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all w-full ${
                            paymentMethodTab === "upi" 
                              ? "bg-brand/5 text-brand" 
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <QrCode size={16} />
                          <span>UPI / QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethodTab("card")}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all w-full ${
                            paymentMethodTab === "card" 
                              ? "bg-brand/5 text-brand" 
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <CreditCard size={16} />
                          <span>Cards</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethodTab("netbanking")}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all w-full ${
                            paymentMethodTab === "netbanking" 
                              ? "bg-brand/5 text-brand" 
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <Building size={16} />
                          <span>Netbanking</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethodTab("wallet")}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all w-full ${
                            paymentMethodTab === "wallet" 
                              ? "bg-brand/5 text-brand" 
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <Wallet size={16} />
                          <span>Wallet</span>
                        </button>
                      </div>

                      {/* Tab Content Panel */}
                      <div className="flex-1 overflow-y-auto max-h-[350px] pr-2">
                        {paymentMethodTab === "upi" && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-gray-700">UPI QR Code</h4>
                              <span className="text-[10px] text-gray-400 font-bold flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1"></span>
                                Live QR
                              </span>
                            </div>
                            <div className="bg-brand/5 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 border border-brand/5">
                              {/* Dummy QR Code */}
                              <div className="w-32 h-32 bg-white border border-gray-200 rounded-xl p-2 flex items-center justify-center shadow-xs">
                                <QrCode size={100} className="text-brand" />
                              </div>
                              <div className="space-y-2 text-center md:text-left">
                                <p className="text-xs font-bold text-brand">Scan the QR using any UPI App</p>
                                <div className="flex justify-center md:justify-start gap-1.5 opacity-60">
                                  <span className="bg-brand/10 text-[9px] font-black px-1.5 py-0.5 rounded text-brand uppercase">GPay</span>
                                  <span className="bg-brand/10 text-[9px] font-black px-1.5 py-0.5 rounded text-brand uppercase">PhonePe</span>
                                  <span className="bg-brand/10 text-[9px] font-black px-1.5 py-0.5 rounded text-brand uppercase">Paytm</span>
                                  <span className="bg-brand/10 text-[9px] font-black px-1.5 py-0.5 rounded text-brand uppercase">BHIM</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 pt-2">
                              <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Pay via UPI ID</label>
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  value={dummyUpiId}
                                  onChange={(e) => setDummyUpiId(e.target.value)}
                                  className="flex-1 bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none"
                                  placeholder="username@upi"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPaymentDetail(dummyUpiId || "UPI QR");
                                    setPaymentStep("payment_confirm");
                                  }}
                                  className="bg-brand hover:bg-brand-hover text-white px-6 rounded-xl text-xs font-bold uppercase tracking-wider"
                                >
                                  Continue
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {paymentMethodTab === "card" && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <h4 className="text-xs font-bold text-gray-700">Add a new card</h4>
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">Card Number</label>
                                <input
                                  type="text"
                                  maxLength={19}
                                  value={dummyCardNumber}
                                  onChange={(e) => setDummyCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                                  className="w-full bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none"
                                  placeholder="4111 2222 3333 4444"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">MM / YY</label>
                                  <input
                                    type="text"
                                    maxLength={5}
                                    value={dummyCardExpiry}
                                    onChange={(e) => setDummyCardExpiry(e.target.value)}
                                    className="w-full bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none"
                                    placeholder="12/29"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-brand/40 uppercase tracking-widest ml-1">CVV</label>
                                  <input
                                    type="password"
                                    maxLength={3}
                                    value={dummyCardCVV}
                                    onChange={(e) => setDummyCardCVV(e.target.value)}
                                    className="w-full bg-brand/5 border border-brand/5 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none"
                                    placeholder="•••"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 pt-2">
                                <input type="checkbox" id="save-card" className="rounded text-[#0D47A1]" />
                                <label htmlFor="save-card" className="text-[10px] font-bold text-gray-500">Save this card as per RBI guidelines</label>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentDetail(`Card ending in ${dummyCardNumber.slice(-4) || "1111"}`);
                                  setPaymentStep("payment_confirm");
                                }}
                                disabled={dummyCardNumber.length < 15 || dummyCardExpiry.length < 5 || dummyCardCVV.length < 3}
                                className="w-full py-4 bg-[#0D47A1] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b3c8a] shadow-lg transition-all disabled:opacity-50"
                              >
                                Continue
                              </button>
                            </div>
                          </div>
                        )}

                        {paymentMethodTab === "netbanking" && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <h4 className="text-xs font-bold text-gray-700">Suggested Banks</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {[
                                "Bank of Baroda - Retail Banking",
                                "Canara Bank",
                                "Punjab National Bank - Retail Banking",
                                "PNB (Erstwhile-United Bank of India)",
                                "IDBI",
                                "State Bank of India",
                                "HDFC Bank",
                                "ICICI Bank"
                              ].map((bank) => (
                                <button
                                  type="button"
                                  key={bank}
                                  onClick={() => {
                                    setSelectedPaymentDetail(`Netbanking: ${bank}`);
                                    setPaymentStep("payment_confirm");
                                  }}
                                  className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-brand/40 hover:bg-brand/5 transition-all text-xs font-bold text-gray-700 flex items-center justify-between"
                                >
                                  <span>{bank}</span>
                                  <ArrowRight size={14} className="text-gray-400" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {paymentMethodTab === "wallet" && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <h4 className="text-xs font-bold text-gray-700">All Wallet Options</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {["Mobikwik", "Ola Money (Postpaid + Wallet)", "PayZapp", "Amazon Pay", "Paytm Wallet"].map((wallet) => (
                                <button
                                  type="button"
                                  key={wallet}
                                  onClick={() => {
                                    setSelectedPaymentDetail(`Wallet: ${wallet}`);
                                    setPaymentStep("payment_confirm");
                                  }}
                                  className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-brand/40 hover:bg-brand/5 transition-all text-xs font-bold text-gray-700 flex items-center justify-between"
                                >
                                  <span>{wallet}</span>
                                  <ArrowRight size={14} className="text-gray-400" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Final Confirmation step: payment_confirm */
                    <div className="flex-1 flex flex-col justify-center items-center text-center py-8 space-y-6 animate-in zoom-in duration-300">
                      <div className="w-16 h-16 bg-brand/5 rounded-full flex items-center justify-center text-brand">
                        <Lock size={32} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-brand">Confirm Payment</h4>
                        <p className="text-xs text-gray-500 font-medium">You selected: <span className="font-bold text-brand">{selectedPaymentDetail}</span></p>
                      </div>

                      <div className="w-full max-w-sm bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-2.5">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                          <span>Subtotal</span>
                          <span>₹{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                          <span>Shipping</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand">Based on Porter charges</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-sm font-black text-brand">
                          <span>Total Amount</span>
                          <span>₹{formatPrice(total)} (INCL GST)</span>
                        </div>
                      </div>

                      <div className="flex gap-4 w-full max-w-sm">
                        <button
                          type="button"
                          onClick={() => setPaymentStep("payment_options")}
                          className="flex-1 py-4 border border-gray-250 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-wider transition-all"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleRazorpayPayment}
                          className="flex-[2] py-4 bg-brand text-white hover:bg-brand-hover rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
                        >
                          Pay ₹{formatPrice(total)} (INCL GST)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {paymentStep === "processing" && (
              <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                <div className="relative mb-10">
                  <div className="w-24 h-24 border-4 border-brand-accent/20 rounded-full"></div>
                  <div className="absolute inset-0 w-24 h-24 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck size={32} className="text-brand-accent animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-brand mb-2 font-inter">Processing Order</h3>
                <p className="text-[10px] text-brand/40 font-black uppercase tracking-widest">Registering your order in our system...</p>
              </div>
            )}


          </div>
        </div>
      )}

      <PincodeEstimatorModal
        isOpen={isPincodeModalOpen}
        onClose={() => setIsPincodeModalOpen(false)}
        onSubmit={handlePincodeSubmit}
      />
    </div>
  );
}
