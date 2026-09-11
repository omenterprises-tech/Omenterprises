"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Layers, 
  Award, 
  Ruler, 
  Package, 
  Plus, 
  Trash2, 
  Pencil,
  Check, 
  X, 
  RefreshCw, 
  ChevronRight, 
  Sparkles, 
  Tag, 
  DollarSign,
  AlertTriangle,
  Grid,
  Loader2,
  ExternalLink,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2
} from "lucide-react";

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

type Category = {
  id: number;
  name: string;
  slug: string;
};

type Variation = {
  id: number;
  modelId?: number | null;
  brandId?: number | null;
  thickness?: string | null;
  colors: string; // JSON string
  price: number;
  salePrice?: number | null;
  stock: number;
  isActive: boolean;
};

type BrandModel = {
  id: number;
  brandLengthId?: number | null;
  brandId?: number | null;
  name: string;
  description?: string | null;
  isActive: boolean;
  variations: Variation[];
};

type BrandLength = {
  id: number;
  brandId: number;
  lengthInMeters: number;
  isActive: boolean;
  models: BrandModel[];
};

type Brand = {
  id: number;
  name: string;
  category: string;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  lengths: BrandLength[];
  directModels?: BrandModel[];
  directVariations?: Variation[];
};

export type CombinationRow = {
  id: string;
  brand: string;
  category: string;
  length?: string;
  model?: string;
  thickness?: string;
  color?: string;
  name: string;
  basePrice: number;
  salePrice: number;
  stock: number;
  unit: string;
  hsn: string;
  gst: number;
  included: boolean;
  imageUrl?: string | null;
};

export default function MasterCatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalog, setCatalog] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Current Selections for step-by-step editing
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedLengthId, setSelectedLengthId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);

  // Modal / Form state
  const [activeModal, setActiveModal] = useState<"brand" | "length" | "model" | "variation" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Combination Generator Modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorScope, setGeneratorScope] = useState<"category" | "brand">("category");
  const [includeCategoryInName, setIncludeCategoryInName] = useState(false);
  const [reverseNameOrder, setReverseNameOrder] = useState(false);
  const [globalUnit, setGlobalUnit] = useState("COILS");
  const [globalHsn, setGlobalHsn] = useState("8544");
  const [globalGst, setGlobalGst] = useState("18");
  const [generatorSearch, setGeneratorSearch] = useState("");
  const [generatorBrandFilter, setGeneratorBrandFilter] = useState("all");
  const [generatedProducts, setGeneratedProducts] = useState<CombinationRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<{ created: number; updated: number; total: number } | null>(null);
  const [priceAdjPercent, setPriceAdjPercent] = useState("");
  const [priceAdjAmount, setPriceAdjAmount] = useState("");

  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandImage, setNewBrandImage] = useState("");
  const [newLength, setNewLength] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelDesc, setNewModelDesc] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleBrandImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (result.url) {
        setNewBrandImage(result.url);
      } else {
        alert(result.error || "Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };
  
  // Variation Form Fields
  const [varThickness, setVarThickness] = useState("");
  const [varColors, setVarColors] = useState<string[]>(["Red", "Yellow", "Blue", "Black", "Green"]);
  const [colorInput, setColorInput] = useState("");
  const [varPrice, setVarPrice] = useState("");
  const [varSalePrice, setVarSalePrice] = useState("");
  const [varStock, setVarStock] = useState("100");

  const fetchCatalog = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/catalog");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setCatalog(data.catalog || []);
        if (!selectedCategory && data.categories?.length > 0) {
          setSelectedCategory(data.categories[0].name);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load catalog data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Auto-select the "Default" model if it is configured under the selected length
  useEffect(() => {
    if (selectedLength) {
      const defaultModel = selectedLength.models?.find((m) => m.name === "Default");
      if (defaultModel) {
        setSelectedModelId(defaultModel.id);
      } else {
        setSelectedModelId(null);
      }
    } else {
      setSelectedModelId(null);
    }
  }, [selectedLengthId, catalog]);

  // Filtered lists based on selections
  const selectedCatObj = categories.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase()) || null;

  const filteredBrands = catalog.filter((b) => {
    if (!selectedCategory) return true;
    if (b.category.toLowerCase() === selectedCategory.toLowerCase()) return true;
    if (selectedCatObj && b.category.toLowerCase() === selectedCatObj.slug.toLowerCase()) return true;
    if (selectedCategory.toLowerCase().startsWith(b.category.toLowerCase())) return true;
    if (b.category.toLowerCase().startsWith(selectedCategory.toLowerCase())) return true;
    return false;
  });

  const selectedBrand = catalog.find((b) => b.id === selectedBrandId) || filteredBrands[0] || null;
  const availableLengths = selectedBrand ? selectedBrand.lengths : [];

  const selectedLength = availableLengths.find((l) => l.id === selectedLengthId) || null;
  const availableModels = selectedLength 
    ? (selectedLength.models || []) 
    : (selectedBrand ? (selectedBrand.directModels || []) : []);

  const selectedModel = availableModels.find((m) => m.id === selectedModelId) || null;
  const availableVariations = selectedModel 
    ? (selectedModel.variations || []) 
    : (selectedBrand && !selectedLength ? (selectedBrand.directVariations || []) : []);

  // ── Combination Generator Logic ──────────────────────────────
  const generateCombinationsForBrands = (
    targetBrands: Brand[],
    includeCat: boolean = false,
    reverse: boolean = false
  ): CombinationRow[] => {
    const rows: CombinationRow[] = [];

    targetBrands.forEach((b) => {
      const catName = b.category || selectedCategory || "Electrical Wires";

      // 1. Lengths hierarchy
      if (b.lengths && b.lengths.length > 0) {
        b.lengths.forEach((l) => {
          const rawLength = String(l.lengthInMeters || "");
          const lengthStr = rawLength ? (rawLength.toLowerCase().includes("m") ? rawLength : `${rawLength}m`) : "";

          if (l.models && l.models.length > 0) {
            l.models.forEach((m) => {
              const modelName = m.name === "Default" ? "" : m.name;

              if (m.variations && m.variations.length > 0) {
                m.variations.forEach((v) => {
                  let parsedColors: string[] = [];
                  try {
                    parsedColors = typeof v.colors === "string" ? JSON.parse(v.colors) : v.colors || [];
                  } catch {
                    parsedColors = v.colors ? String(v.colors).split(",").map((c) => c.trim()) : [];
                  }

                  const thickStr = v.thickness || "";
                  const price = Number(v.price) || 0;
                  const salePrice = v.salePrice ? Number(v.salePrice) : price;
                  const stock = Number(v.stock) || 100;

                  if (parsedColors.length > 0) {
                    parsedColors.forEach((color) => {
                      let parts = [b.name, includeCat ? catName : "", lengthStr, modelName, thickStr, color].filter(Boolean);
                      if (reverse) parts = [...parts].reverse();
                      rows.push({
                        id: `${b.id}-${l.id}-${m.id}-${v.id}-${color}`,
                        brand: b.name,
                        category: catName,
                        length: lengthStr,
                        model: modelName,
                        thickness: thickStr,
                        color: color,
                        name: parts.join(" "),
                        basePrice: price,
                        salePrice: salePrice,
                        stock: stock,
                        unit: globalUnit,
                        hsn: globalHsn,
                        gst: Number(globalGst) || 18,
                        included: true,
                        imageUrl: b.imageUrl,
                      });
                    });
                  } else {
                    let parts = [b.name, includeCat ? catName : "", lengthStr, modelName, thickStr].filter(Boolean);
                    if (reverse) parts = [...parts].reverse();
                    rows.push({
                      id: `${b.id}-${l.id}-${m.id}-${v.id}-nocolor`,
                      brand: b.name,
                      category: catName,
                      length: lengthStr,
                      model: modelName,
                      thickness: thickStr,
                      name: parts.join(" "),
                      basePrice: price,
                      salePrice: salePrice,
                      stock: stock,
                      unit: globalUnit,
                      hsn: globalHsn,
                      gst: Number(globalGst) || 18,
                      included: true,
                      imageUrl: b.imageUrl,
                    });
                  }
                });
              }
            });
          }
        });
      }

      // 2. Direct models (no length)
      if (b.directModels && b.directModels.length > 0) {
        b.directModels.forEach((m) => {
          const modelName = m.name === "Default" ? "" : m.name;
          if (m.variations && m.variations.length > 0) {
            m.variations.forEach((v) => {
              let parsedColors: string[] = [];
              try {
                parsedColors = typeof v.colors === "string" ? JSON.parse(v.colors) : v.colors || [];
              } catch {
                parsedColors = v.colors ? String(v.colors).split(",").map((c) => c.trim()) : [];
              }
              const thickStr = v.thickness || "";
              const price = Number(v.price) || 0;
              const salePrice = v.salePrice ? Number(v.salePrice) : price;
              const stock = Number(v.stock) || 100;

              if (parsedColors.length > 0) {
                parsedColors.forEach((color) => {
                  let parts = [b.name, includeCat ? catName : "", modelName, thickStr, color].filter(Boolean);
                  if (reverse) parts = [...parts].reverse();
                  rows.push({
                    id: `${b.id}-direct-${m.id}-${v.id}-${color}`,
                    brand: b.name,
                    category: catName,
                    model: modelName,
                    thickness: thickStr,
                    color: color,
                    name: parts.join(" "),
                    basePrice: price,
                    salePrice: salePrice,
                    stock: stock,
                    unit: globalUnit,
                    hsn: globalHsn,
                    gst: Number(globalGst) || 18,
                    included: true,
                    imageUrl: b.imageUrl,
                  });
                });
              } else {
                let parts = [b.name, includeCat ? catName : "", modelName, thickStr].filter(Boolean);
                if (reverse) parts = [...parts].reverse();
                rows.push({
                  id: `${b.id}-direct-${m.id}-${v.id}-nocolor`,
                  brand: b.name,
                  category: catName,
                  model: modelName,
                  thickness: thickStr,
                  name: parts.join(" "),
                  basePrice: price,
                  salePrice: salePrice,
                  stock: stock,
                  unit: globalUnit,
                  hsn: globalHsn,
                  gst: Number(globalGst) || 18,
                  included: true,
                  imageUrl: b.imageUrl,
                });
              }
            });
          }
        });
      }

      // 3. Direct variations (no length and no model)
      if (b.directVariations && b.directVariations.length > 0) {
        b.directVariations.forEach((v) => {
          let parsedColors: string[] = [];
          try {
            parsedColors = typeof v.colors === "string" ? JSON.parse(v.colors) : v.colors || [];
          } catch {
            parsedColors = v.colors ? String(v.colors).split(",").map((c) => c.trim()) : [];
          }
          const thickStr = v.thickness || "";
          const price = Number(v.price) || 0;
          const salePrice = v.salePrice ? Number(v.salePrice) : price;
          const stock = Number(v.stock) || 100;

          if (parsedColors.length > 0) {
            parsedColors.forEach((color) => {
              let parts = [b.name, includeCat ? catName : "", thickStr, color].filter(Boolean);
              if (reverse) parts = [...parts].reverse();
              rows.push({
                id: `${b.id}-var-${v.id}-${color}`,
                brand: b.name,
                category: catName,
                thickness: thickStr,
                color: color,
                name: parts.join(" "),
                basePrice: price,
                salePrice: salePrice,
                stock: stock,
                unit: globalUnit,
                hsn: globalHsn,
                gst: Number(globalGst) || 18,
                included: true,
                imageUrl: b.imageUrl,
              });
            });
          } else {
            let parts = [b.name, includeCat ? catName : "", thickStr].filter(Boolean);
            if (reverse) parts = [...parts].reverse();
            rows.push({
              id: `${b.id}-var-${v.id}-nocolor`,
              brand: b.name,
              category: catName,
              thickness: thickStr,
              name: parts.join(" "),
              basePrice: price,
              salePrice: salePrice,
              stock: stock,
              unit: globalUnit,
              hsn: globalHsn,
              gst: Number(globalGst) || 18,
              included: true,
              imageUrl: b.imageUrl,
            });
          }
        });
      }
    });

    return rows;
  };

  // Real-time count of all combinations configured in the current category
  const activeCategoryCombinations = useMemo(() => {
    return generateCombinationsForBrands(filteredBrands, includeCategoryInName, reverseNameOrder);
  }, [filteredBrands, selectedCategory, includeCategoryInName, reverseNameOrder, globalUnit, globalHsn, globalGst]);

  const openGeneratorModal = (scope: "category" | "brand" = "category") => {
    setGeneratorScope(scope);
    const targetBrands = scope === "brand" && selectedBrand ? [selectedBrand] : filteredBrands;
    const items = generateCombinationsForBrands(targetBrands, includeCategoryInName, reverseNameOrder);
    setGeneratedProducts(items);
    setGenerationSummary(null);
    setGeneratorSearch("");
    setGeneratorBrandFilter("all");
    setPriceAdjPercent("");
    setPriceAdjAmount("");
    setIsGeneratorOpen(true);
  };

  const handleToggleIncludeCategory = (val: boolean) => {
    setIncludeCategoryInName(val);
    setGeneratedProducts((prev) =>
      prev.map((p) => {
        let parts = [
          p.brand,
          val ? p.category : "",
          p.length,
          p.model && p.model !== "Default" ? p.model : "",
          p.thickness,
          p.color,
        ].filter(Boolean);
        if (reverseNameOrder) parts = [...parts].reverse();
        return { ...p, name: parts.join(" ") };
      })
    );
  };

  const handleToggleReverseOrder = (val: boolean) => {
    setReverseNameOrder(val);
    setGeneratedProducts((prev) =>
      prev.map((p) => {
        let parts = [
          p.brand,
          includeCategoryInName ? p.category : "",
          p.length,
          p.model && p.model !== "Default" ? p.model : "",
          p.thickness,
          p.color,
        ].filter(Boolean);
        if (val) parts = [...parts].reverse();
        return { ...p, name: parts.join(" ") };
      })
    );
  };

  const applyPercentPriceAdjustment = (percentStr: string) => {
    const percent = parseFloat(percentStr);
    if (isNaN(percent)) return;
    setGeneratedProducts((prev) =>
      prev.map((p) => {
        if (!p.included) return p;
        const factor = 1 + percent / 100;
        return {
          ...p,
          basePrice: Math.round(p.basePrice * factor),
          salePrice: Math.round(p.salePrice * factor),
        };
      })
    );
  };

  const applyFlatPriceAdjustment = (amountStr: string) => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return;
    setGeneratedProducts((prev) =>
      prev.map((p) => {
        if (!p.included) return p;
        return {
          ...p,
          basePrice: Math.max(0, p.basePrice + amount),
          salePrice: Math.max(0, p.salePrice + amount),
        };
      })
    );
  };

  const applyGlobalUnit = (unit: string) => {
    setGlobalUnit(unit);
    setGeneratedProducts((prev) => prev.map((p) => ({ ...p, unit })));
  };

  const applyGlobalHsn = (hsn: string) => {
    setGlobalHsn(hsn);
    setGeneratedProducts((prev) => prev.map((p) => ({ ...p, hsn })));
  };

  const applyGlobalGst = (gst: string) => {
    setGlobalGst(gst);
    const numGst = Number(gst) || 18;
    setGeneratedProducts((prev) => prev.map((p) => ({ ...p, gst: numGst })));
  };

  const displayedGeneratedProducts = useMemo(() => {
    return generatedProducts.filter((p) => {
      if (generatorBrandFilter !== "all" && p.brand.toLowerCase() !== generatorBrandFilter.toLowerCase()) {
        return false;
      }
      if (!generatorSearch.trim()) return true;
      const q = generatorSearch.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.length && p.length.toLowerCase().includes(q)) ||
        (p.model && p.model.toLowerCase().includes(q)) ||
        (p.thickness && p.thickness.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q))
      );
    });
  }, [generatedProducts, generatorBrandFilter, generatorSearch]);

  const toggleSelectAllGenerated = (check: boolean) => {
    const ids = new Set(displayedGeneratedProducts.map((p) => p.id));
    setGeneratedProducts((prev) => prev.map((p) => (ids.has(p.id) ? { ...p, included: check } : p)));
  };

  const toggleRowIncluded = (id: string) => {
    setGeneratedProducts((prev) => prev.map((p) => (p.id === id ? { ...p, included: !p.included } : p)));
  };

  const updateGeneratedRow = (id: string, field: keyof CombinationRow, value: any) => {
    setGeneratedProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleSaveGeneratedProducts = async () => {
    const selectedItems = generatedProducts.filter((p) => p.included);
    if (selectedItems.length === 0) {
      alert("Please select at least one individual product to generate.");
      return;
    }

    setIsGenerating(true);
    setError("");
    try {
      const payload = selectedItems.map((p) => ({
        name: p.name.trim(),
        category: p.category,
        basePrice: Number(p.basePrice) || 0,
        salePrice: Number(p.salePrice) || Number(p.basePrice) || 0,
        unit: p.unit || globalUnit,
        hsn: p.hsn || globalHsn,
        gst: Number(p.gst) || 18,
        stock: Number(p.stock) || 100,
        color: p.color || null,
        size: p.length || p.thickness || "Standard",
        brand: p.brand,
        imageUrl: p.imageUrl || null,
        specifications: [
          { key: "Brand", value: p.brand },
          ...(p.length ? [{ key: "Length", value: p.length }] : []),
          ...(p.model ? [{ key: "Model", value: p.model }] : []),
          ...(p.thickness ? [{ key: "Thickness", value: p.thickness }] : []),
          ...(p.color ? [{ key: "Color", value: p.color }] : []),
        ],
        tags: [p.brand, p.category, p.length, p.model, p.thickness, p.color].filter(Boolean).join(", "),
      }));

      const res = await fetch("/api/admin/catalog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: payload }),
      });

      const data = await res.json();
      if (data.success) {
        setGenerationSummary({
          created: data.createdCount || 0,
          updated: data.updatedCount || 0,
          total: selectedItems.length,
        });
        setSuccess(`🎉 Generated ${data.createdCount} new individual products (${data.updatedCount} updated) in the Products list!`);
      } else {
        setError(data.error || "Failed to generate products.");
      }
    } catch (err: any) {
      console.error("Save generated products error:", err);
      setError("Network error while generating products.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handlers
  // Start editing helpers
  const startEditBrand = (b: Brand) => {
    setNewBrandName(b.name);
    setNewBrandImage(b.imageUrl || "");
    setEditingId(b.id);
    setActiveModal("brand");
  };

  const startEditLength = (l: BrandLength) => {
    setNewLength(String(l.lengthInMeters));
    setEditingId(l.id);
    setActiveModal("length");
  };

  const startEditModel = (m: BrandModel) => {
    setNewModelName(m.name);
    setNewModelDesc(m.description || "");
    setEditingId(m.id);
    setActiveModal("model");
  };

  const startEditVariation = (v: Variation) => {
    setVarThickness(v.thickness || "");
    let parsedColors: string[] = [];
    try {
      parsedColors = typeof v.colors === "string" ? JSON.parse(v.colors) : v.colors || [];
    } catch (e) {
      parsedColors = v.colors ? v.colors.split(",") : [];
    }
    setVarColors(parsedColors);
    setColorInput("");
    setVarPrice(String(v.price));
    setVarSalePrice(v.salePrice ? String(v.salePrice) : "");
    setVarStock(String(v.stock));
    setEditingId(v.id);
    setActiveModal("variation");
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingId(null);
    setNewBrandName("");
    setNewBrandImage("");
    setNewLength("");
    setNewModelName("");
    setNewModelDesc("");
    setVarThickness("");
    setVarColors(["Red", "Yellow", "Blue", "Black", "Green"]);
    setColorInput("");
    setVarPrice("");
    setVarSalePrice("");
    setVarStock("100");
  };

  // Handlers
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      const isEditing = editingId !== null;
      const res = await fetch("/api/admin/catalog", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "brand",
          id: editingId,
          name: newBrandName,
          category: selectedCategory || "Electrical Wires",
          imageUrl: newBrandImage || null,
        }),
      });
      if (res.ok) {
        setSuccess(isEditing ? "Brand updated!" : "Brand added!");
        closeModal();
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveLength = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand || !newLength) return;
    try {
      const isEditing = editingId !== null;
      const res = await fetch("/api/admin/catalog", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "length",
          id: editingId,
          brandId: selectedBrand.id,
          lengthInMeters: newLength.trim(),
        }),
      });
      if (res.ok) {
        setSuccess(isEditing ? "Length updated!" : "Length option added!");
        closeModal();
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand || !newModelName.trim()) return;
    try {
      const isEditing = editingId !== null;
      const res = await fetch("/api/admin/catalog", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "model",
          id: editingId,
          brandLengthId: selectedLength ? selectedLength.id : null,
          brandId: selectedBrand.id,
          name: newModelName,
          description: newModelDesc,
        }),
      });
      if (res.ok) {
        setSuccess(isEditing ? "Model updated!" : "Model added!");
        closeModal();
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddVariationModal = () => {
    setVarThickness("");
    setVarColors(["Red", "Yellow", "Blue", "Black", "Green"]);
    setColorInput("");
    setVarPrice("");
    setVarSalePrice("");
    setVarStock("100");
    setEditingId(null);
    setActiveModal("variation");
  };

  const handleSaveVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand || !varPrice) return;
    try {
      const isEditing = editingId !== null;
      const res = await fetch("/api/admin/catalog", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "variation",
          id: editingId,
          modelId: selectedModel ? selectedModel.id : null,
          brandId: selectedBrand.id,
          brandLengthId: selectedLength ? selectedLength.id : null,
          thickness: varThickness.trim() || null,
          colors: varColors,
          price: Number(varPrice),
          salePrice: varSalePrice ? Number(varSalePrice) : null,
          stock: Number(varStock) || 100,
        }),
      });
      if (res.ok) {
        setSuccess(isEditing ? "Variation updated!" : "Variation added!");
        closeModal();
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (type: string, id: number) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const res = await fetch(`/api/admin/catalog?type=${type}&id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess(`${type} deleted!`);
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddColorTag = () => {
    if (colorInput.trim() && !varColors.includes(colorInput.trim())) {
      setVarColors([...varColors, colorInput.trim()]);
      setColorInput("");
    }
  };

  const handleRemoveColorTag = (c: string) => {
    setVarColors(varColors.filter((col) => col !== c));
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#0D47A1]/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#FF9800] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-[#0D47A1]">Loading Master Catalog...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#0D47A1]/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#0D47A1] tracking-tight flex items-center gap-3">
            <Layers className="text-[#FF9800]" size={32} />
            Master Catalog Configurator
          </h1>
          <p className="text-[#0D47A1]/60 text-sm mt-1">
            Single-page management for Category → Brands → Lengths → Models → Thicknesses, Colors & Pricing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => openGeneratorModal("category")}
            disabled={activeCategoryCombinations.length === 0}
            className="flex items-center gap-2 bg-[#FF9800] hover:bg-[#F57C00] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-[#FF9800]/25 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Generate Combinations as Products</span>
            {activeCategoryCombinations.length > 0 && (
              <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[11px] font-black">
                {activeCategoryCombinations.length} Ready
              </span>
            )}
          </button>
          <a
            href="/admin/products"
            className="flex items-center gap-2 bg-[#0D47A1]/5 hover:bg-[#0D47A1]/10 text-[#0D47A1] px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors"
          >
            <span>Products List</span>
            <ExternalLink size={14} />
          </a>
          <button
            onClick={fetchCatalog}
            className="flex items-center gap-2 bg-[#0D47A1]/5 hover:bg-[#0D47A1]/10 text-[#0D47A1] px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync Catalog
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-4 rounded-2xl text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}><X size={16} /></button>
        </div>
      )}

      {/* Step 1: Category Selector Pills */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4">
        <label className="text-xs font-black uppercase tracking-wider text-[#0D47A1]/70 flex items-center gap-2">
          <Grid size={16} className="text-[#FF9800]" /> Select Active Category
        </label>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.name);
                setSelectedBrandId(null);
                setSelectedLengthId(null);
                setSelectedModelId(null);
              }}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? "bg-[#0D47A1] text-white shadow-lg shadow-[#0D47A1]/20 scale-105"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column Interactive Hierarchy Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* COLUMN 1: BRANDS */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0D47A1] flex items-center gap-2">
              <Award size={16} className="text-[#FF9800]" />
              1. Brands ({filteredBrands.length})
            </h3>
            <button
              onClick={() => setActiveModal("brand")}
              className="p-1.5 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors"
              title="Add Brand"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredBrands.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No brands in {selectedCategory}. Click + to add one.</p>
            ) : (
              filteredBrands.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBrandId(b.id);
                    setSelectedLengthId(null);
                    setSelectedModelId(null);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedBrand?.id === b.id
                      ? "border-[#0D47A1] bg-[#0D47A1]/5 shadow-sm"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt={b.name} className="w-7 h-7 object-contain rounded-md" />
                    ) : (
                      <Award size={18} className="text-[#0D47A1]" />
                    )}
                    <span className="text-xs font-bold text-[#0D47A1] truncate">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBrandId(b.id);
                        openGeneratorModal("brand");
                      }}
                      className="text-gray-300 hover:text-[#FF9800] p-1"
                      title={`Generate individual products for ${b.name}`}
                    >
                      <Sparkles size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditBrand(b); }}
                      className="text-gray-300 hover:text-[#0D47A1] p-1"
                      title="Edit Brand"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteItem("brand", b.id); }}
                      className="text-gray-300 hover:text-red-500 p-1"
                      title="Delete Brand"
                    >
                      <Trash2 size={12} />
                    </button>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: LENGTHS IN METRES */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0D47A1] flex items-center gap-2">
              <Ruler size={16} className="text-[#FF9800]" />
              2. Lengths ({availableLengths.length})
            </h3>
            {selectedBrand && (
              <button
                onClick={() => setActiveModal("length")}
                className="p-1.5 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors"
                title="Add Length"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {!selectedBrand ? (
              <p className="text-xs text-gray-400 py-6 text-center">Select a brand first.</p>
            ) : availableLengths.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No lengths configured for {selectedBrand.name}. Click + to add.</p>
            ) : (
              availableLengths.map((l) => (
                <div
                  key={l.id}
                  onClick={() => {
                    setSelectedLengthId(l.id);
                    setSelectedModelId(null);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedLength?.id === l.id
                      ? "border-[#0D47A1] bg-[#0D47A1]/5 shadow-sm"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xs font-bold text-[#0D47A1]">
                    {l.lengthInMeters} <span className="text-[10px] text-gray-400">metres</span>
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditLength(l); }}
                      className="text-gray-300 hover:text-[#0D47A1] p-1"
                      title="Edit Length"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteItem("length", l.id); }}
                      className="text-gray-300 hover:text-red-500 p-1"
                      title="Delete Length"
                    >
                      <Trash2 size={12} />
                    </button>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: MODELS / TYPES */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0D47A1] flex items-center gap-2">
              <Package size={16} className="text-[#FF9800]" />
              3. Models ({availableModels.length})
            </h3>
            {selectedBrand && (
              <button
                onClick={() => setActiveModal("model")}
                className="p-1.5 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors"
                title="Add Model"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {!selectedBrand ? (
              <p className="text-xs text-gray-400 py-6 text-center">Select a brand first.</p>
            ) : availableModels.filter(m => m.name !== "Default").length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No models added. Click + to add.</p>
            ) : (
              availableModels.filter(m => m.name !== "Default").map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedModelId(m.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedModel?.id === m.id
                      ? "border-[#0D47A1] bg-[#0D47A1]/5 shadow-sm"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xs font-bold text-[#0D47A1] truncate">{m.name}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditModel(m); }}
                      className="text-gray-300 hover:text-[#0D47A1] p-1"
                      title="Edit Model"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteItem("model", m.id); }}
                      className="text-gray-300 hover:text-red-500 p-1"
                      title="Delete Model"
                    >
                      <Trash2 size={12} />
                    </button>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 4: VARIATIONS (THICKNESS, COLORS, PRICES) */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0D47A1] flex items-center gap-2">
              <Tag size={16} className="text-[#FF9800]" />
              4. Specs & Prices ({availableVariations.length})
            </h3>
            {selectedBrand && (
              <button
                onClick={openAddVariationModal}
                className="p-1.5 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors"
                title="Add Spec & Price"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {!selectedBrand ? (
              <p className="text-xs text-gray-400 py-6 text-center">Select a brand first.</p>
            ) : availableVariations.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No specifications added. Click + to add.</p>
            ) : (
              availableVariations.map((v) => {
                let parsedColors: string[] = [];
                try {
                  parsedColors = typeof v.colors === "string" ? JSON.parse(v.colors) : v.colors || [];
                } catch (e) {
                  parsedColors = v.colors ? v.colors.split(",") : [];
                }

                return (
                  <div key={v.id} className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#0D47A1]">{v.thickness || "Default Specification"}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEditVariation(v)}
                          className="text-gray-300 hover:text-[#0D47A1]"
                          title="Edit Spec & Price"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem("variation", v.id)}
                          className="text-gray-300 hover:text-red-500"
                          title="Delete Spec & Price"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-[#0D47A1]">
                      <span>₹{v.salePrice || v.price}</span>
                      {v.salePrice && <span className="text-[10px] text-gray-400 line-through">₹{v.price}</span>}
                    </div>

                    {parsedColors.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {parsedColors.map((col, idx) => {
                          const style = getColorStyles(col);
                          return (
                            <span 
                              key={idx} 
                              style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }} 
                              className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border shadow-2xs"
                            >
                              {col}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* MODALS FOR ADDING/EDITING HIERARCHICAL ITEMS */}

      {/* 1. Brand Modal */}
      {activeModal === "brand" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D47A1]/50 backdrop-blur-sm">
          <form onSubmit={handleSaveBrand} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[#0D47A1]">
              {editingId ? "Edit Brand" : `Add Brand to ${selectedCategory}`}
            </h3>
            <input
              type="text"
              placeholder="Brand Name (e.g. Polycab, Havells)"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Brand Logo Image URL (optional)"
                value={newBrandImage}
                onChange={(e) => setNewBrandImage(e.target.value)}
                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
              />
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleBrandImageUpload}
                  id="catalog-brand-image-file"
                  className="hidden"
                  disabled={isUploading}
                />
                <label 
                  htmlFor="catalog-brand-image-file"
                  className={`h-full flex items-center justify-center gap-1.5 px-4 bg-[#0D47A1] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer hover:bg-[#0D47A1]/95 active:scale-[0.98] transition-all whitespace-nowrap min-h-[46px] ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Upload
                    </>
                  )}
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[#FF9800] text-xs font-bold text-white rounded-xl">
                {editingId ? "Save Changes" : "Add Brand"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Length Modal */}
      {activeModal === "length" && selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D47A1]/50 backdrop-blur-sm">
          <form onSubmit={handleSaveLength} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[#0D47A1]">
              {editingId ? "Edit Length" : `Add Length to ${selectedBrand.name}`}
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 90, 180 (Coil), 200m, 100"
                value={newLength}
                onChange={(e) => setNewLength(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[#FF9800] text-xs font-bold text-white rounded-xl">
                {editingId ? "Save Changes" : "Add Length"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Model Modal */}
      {activeModal === "model" && selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D47A1]/50 backdrop-blur-sm">
          <form onSubmit={handleSaveModel} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[#0D47A1]">
              {editingId ? "Edit Model" : `Add Model to ${selectedLength ? `${selectedLength.lengthInMeters}m` : selectedBrand.name}`}
            </h3>
            <input
              type="text"
              placeholder="Model / Type Name (e.g. Flame Retardant FR, FRLSH)"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
              required
            />
            <textarea
              placeholder="Short Description (optional)"
              value={newModelDesc}
              onChange={(e) => setNewModelDesc(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
              rows={2}
            />
            <div className="flex gap-3">
              <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[#FF9800] text-xs font-bold text-white rounded-xl">
                {editingId ? "Save Changes" : "Add Model"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Variation Modal (Thickness, Colors, Price) */}
      {activeModal === "variation" && selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D47A1]/50 backdrop-blur-sm">
          <form onSubmit={handleSaveVariation} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#0D47A1]">
              {editingId ? "Edit Spec & Price" : `Add Spec & Price (${selectedModel ? selectedModel.name : selectedBrand.name})`}
            </h3>
            
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500">Thickness / Gauge (optional)</label>
              <input
                type="text"
                placeholder="e.g. 1.0 sq mm, 1.5 sq mm, 2.5 sq mm"
                value={varThickness}
                onChange={(e) => setVarThickness(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1] mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {["1.0 sq mm", "1.5 sq mm", "2.5 sq mm", "4.0 sq mm"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setVarThickness(size)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition-all cursor-pointer ${
                      varThickness === size 
                        ? "bg-[#FF9800] text-white border-[#FF9800] shadow-sm" 
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500">Available Colors</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add color (e.g. Red, Blue)"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#0D47A1]"
                />
                <button type="button" onClick={handleAddColorTag} className="px-3 bg-gray-200 hover:bg-gray-300 text-xs font-bold rounded-xl">+</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {varColors.map((c, idx) => {
                  const style = getColorStyles(c);
                  return (
                    <span 
                      key={idx} 
                      style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }} 
                      className="text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border shadow-xs"
                    >
                      {c}
                      <button type="button" onClick={() => handleRemoveColorTag(c)} style={{ color: style.text }} className="opacity-70 hover:opacity-100 font-bold">×</button>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500">Regular Price (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={varPrice}
                  onChange={(e) => setVarPrice(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500">Sale Price (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1350"
                  value={varSalePrice}
                  onChange={(e) => setVarSalePrice(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[#FF9800] text-xs font-bold text-white rounded-xl">
                {editingId ? "Save Changes" : "Save Specification"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. COMBINATIONS TO INDIVIDUAL PRODUCTS GENERATOR MODAL */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-[#0D47A1]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-6xl w-full h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#0D47A1] to-[#1565C0] text-white flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FF9800] text-white rounded-xl shadow-md">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                      Generate Individual Products
                      <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-amber-200">
                        {generatedProducts.length} Combinations Available
                      </span>
                    </h2>
                    <p className="text-white/70 text-xs mt-0.5">
                      Every combination will be created as its own individual product row in your Products list with individual pricing &amp; SKU.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Controls Bar */}
            <div className="p-4 bg-gray-50/80 border-b border-gray-200/80 space-y-3">
              {/* Scope & Naming Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Scope selector */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Scope:</span>
                  <div className="inline-flex rounded-xl bg-gray-200/70 p-0.5">
                    <button
                      type="button"
                      onClick={() => openGeneratorModal("category")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        generatorScope === "category"
                          ? "bg-white text-[#0D47A1] shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      All Brands in {selectedCategory} ({activeCategoryCombinations.length})
                    </button>
                    {selectedBrand && (
                      <button
                        type="button"
                        onClick={() => openGeneratorModal("brand")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          generatorScope === "brand"
                            ? "bg-white text-[#0D47A1] shadow-xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Only {selectedBrand.name}
                      </button>
                    )}
                  </div>
                </div>

                {/* Name format options */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={includeCategoryInName}
                      onChange={(e) => handleToggleIncludeCategory(e.target.checked)}
                      className="rounded text-[#0D47A1] focus:ring-[#0D47A1]"
                    />
                    <span>Include Category in Name</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={reverseNameOrder}
                      onChange={(e) => handleToggleReverseOrder(e.target.checked)}
                      className="rounded text-[#0D47A1] focus:ring-[#0D47A1]"
                    />
                    <span>Reverse Order</span>
                  </label>
                </div>
              </div>

              {/* Global Product Fields & Bulk Price Adjuster */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 border-t border-gray-200/50">
                {/* Default Unit */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-500 whitespace-nowrap">Unit:</span>
                  <select
                    value={globalUnit}
                    onChange={(e) => applyGlobalUnit(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#0D47A1]"
                  >
                    <option value="COILS">COILS</option>
                    <option value="MTRS">MTRS (Metres)</option>
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="BOX">BOX</option>
                    <option value="SET">SET</option>
                  </select>
                </div>

                {/* Default HSN */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-500 whitespace-nowrap">HSN:</span>
                  <input
                    type="text"
                    value={globalHsn}
                    onChange={(e) => applyGlobalHsn(e.target.value)}
                    placeholder="8544"
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#0D47A1]"
                  />
                </div>

                {/* Default GST */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-500 whitespace-nowrap">GST %:</span>
                  <select
                    value={globalGst}
                    onChange={(e) => applyGlobalGst(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#0D47A1]"
                  >
                    <option value="18">18%</option>
                    <option value="12">12%</option>
                    <option value="5">5%</option>
                    <option value="28">28%</option>
                    <option value="0">0%</option>
                  </select>
                </div>

                {/* Bulk Price Adjuster */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-gray-500 whitespace-nowrap">Bulk Price:</span>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      placeholder="±%"
                      value={priceAdjPercent}
                      onChange={(e) => setPriceAdjPercent(e.target.value)}
                      className="w-16 bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold text-[#0D47A1]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        applyPercentPriceAdjustment(priceAdjPercent);
                        setPriceAdjPercent("");
                      }}
                      disabled={!priceAdjPercent}
                      className="px-2.5 py-1.5 bg-[#0D47A1] text-white text-[10px] font-black rounded-xl hover:bg-[#0B3C8A] disabled:opacity-40 cursor-pointer"
                    >
                      Apply %
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by combination name, length, color, gauge..."
                      value={generatorSearch}
                      onChange={(e) => setGeneratorSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#0D47A1] placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Brand Filter */}
                  <select
                    value={generatorBrandFilter}
                    onChange={(e) => setGeneratorBrandFilter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#0D47A1]"
                  >
                    <option value="all">All Brands ({filteredBrands.length})</option>
                    {filteredBrands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => toggleSelectAllGenerated(true)}
                    className="text-xs font-bold text-[#0D47A1] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => toggleSelectAllGenerated(false)}
                    className="text-xs font-bold text-gray-500 hover:underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {generationSummary ? (
                <div className="p-8 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-xl font-black text-emerald-900">Products Generated Successfully!</h3>
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-emerald-700">{generationSummary.created} new individual products</span> were created, and{" "}
                    <span className="font-bold text-blue-700">{generationSummary.updated} existing products</span> were updated in your commercial catalog.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <a
                      href="/admin/products"
                      className="px-5 py-2.5 bg-[#0D47A1] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#0B3C8A] shadow-md"
                    >
                      <span>View in Products List</span>
                      <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGeneratorOpen(false);
                        setGenerationSummary(null);
                      }}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : displayedGeneratedProducts.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <AlertTriangle size={36} className="mx-auto text-amber-500 opacity-60" />
                  <p className="text-sm font-bold text-gray-500">No combinations found matching your filters.</p>
                  <p className="text-xs text-gray-400">
                    Make sure lengths, models, and variation specs (price &amp; colors) are configured in the 4 columns.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-wider bg-gray-50/50 sticky top-0 z-10 backdrop-blur-xs">
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={displayedGeneratedProducts.length > 0 && displayedGeneratedProducts.every((p) => p.included)}
                          onChange={(e) => toggleSelectAllGenerated(e.target.checked)}
                          className="rounded text-[#0D47A1] focus:ring-[#0D47A1]"
                        />
                      </th>
                      <th className="py-2.5 px-2 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Individual Product Name</th>
                      <th className="py-2.5 px-3">Hierarchy Breakdown</th>
                      <th className="py-2.5 px-3 w-32">MRP (₹)</th>
                      <th className="py-2.5 px-3 w-32">Sale Price (₹)</th>
                      <th className="py-2.5 px-3 w-24 text-center">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {displayedGeneratedProducts.map((row, idx) => {
                      const colorStyle = row.color ? getColorStyles(row.color) : null;
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            row.included ? "bg-white" : "bg-gray-50/60 opacity-60"
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.included}
                              onChange={() => toggleRowIncluded(row.id)}
                              className="rounded text-[#0D47A1] focus:ring-[#0D47A1]"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-400 font-mono text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => updateGeneratedRow(row.id, "name", e.target.value)}
                              className="w-full p-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#0D47A1] rounded-xl text-xs font-bold text-[#0D47A1] transition-all"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-extrabold bg-[#0D47A1]/10 text-[#0D47A1] px-2 py-0.5 rounded-md">
                                {row.brand}
                              </span>
                              {row.length && (
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                  {row.length}
                                </span>
                              )}
                              {row.model && row.model !== "Default" && (
                                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-md">
                                  {row.model}
                                </span>
                              )}
                              {row.thickness && (
                                <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-md">
                                  {row.thickness}
                                </span>
                              )}
                              {row.color && colorStyle && (
                                <span
                                  style={{ backgroundColor: colorStyle.bg, color: colorStyle.text, borderColor: colorStyle.border }}
                                  className="text-[9px] px-2 py-0.5 rounded font-black uppercase border shadow-2xs"
                                >
                                  {row.color}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                              <input
                                type="number"
                                value={row.basePrice}
                                onChange={(e) => updateGeneratedRow(row.id, "basePrice", Number(e.target.value))}
                                className="w-full pl-6 pr-2 py-1.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs">₹</span>
                              <input
                                type="number"
                                value={row.salePrice}
                                onChange={(e) => updateGeneratedRow(row.id, "salePrice", Number(e.target.value))}
                                className="w-full pl-6 pr-2 py-1.5 bg-emerald-50/50 hover:bg-white focus:bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              value={row.stock}
                              onChange={(e) => updateGeneratedRow(row.id, "stock", Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 text-center"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            {!generationSummary && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs font-bold text-gray-600">
                  <span>Selected: </span>
                  <span className="text-[#0D47A1] font-black">
                    {generatedProducts.filter((p) => p.included).length}
                  </span>
                  <span> of {generatedProducts.length} individual products</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGeneratorOpen(false)}
                    className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGeneratedProducts}
                    disabled={isGenerating || generatedProducts.filter((p) => p.included).length === 0}
                    className="px-6 py-2.5 bg-[#FF9800] hover:bg-[#F57C00] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-lg shadow-[#FF9800]/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Creating Individual Products...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Create {generatedProducts.filter((p) => p.included).length} Individual Products</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
