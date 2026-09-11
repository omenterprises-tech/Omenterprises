"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Package, Trash2, Edit3, X, Star, Loader2, Check, Tag, Sparkles, Search } from "lucide-react";
const DEFAULT_SIZES = ["90m", "180m", "1.0 sq mm", "1.5 sq mm", "2.5 sq mm", "4.0 sq mm", "Single Pole", "Double Pole"];

interface Variation { size: string; stock: number; sku: string; basePrice: number; salePrice: number; color?: string | null; imageUrl?: string | null; }
interface Product {
  id: number; name: string; description: string | null;
  basePrice: number; salePrice: number; images: string;
  category: string | null;
  totalStock: number;
  isFeatured: boolean | number | null;
  tags: string | null;
}

const LABEL = "block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-3";
const INPUT = "w-full bg-brand/5 border border-transparent focus:border-[#FF9800]/50 rounded-2xl px-5 py-4 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20";

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockEditingProduct, setStockEditingProduct] = useState<any>(null);
  const [stockVariations, setStockVariations] = useState<Variation[]>([]);

  // ── Form state ──────────────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  // Removed overall mrp and salePrice
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState("");

  // Images
  const [imageInput, setImageInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [allVariations, setAllVariations] = useState<string[]>([...DEFAULT_SIZES]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sizes & Colors → Variations
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([]);

  // Colors & Color-specific Images States
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorImages, setColorImages] = useState<Record<string, string[]>>({});
  const [activeColorTab, setActiveColorTab] = useState<string>("Default");
  const [colorImageInput, setColorImageInput] = useState<string>("");
  const [customColorHex, setCustomColorHex] = useState<string>("#C5A059");
  const [categoriesList, setCategoriesList] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { 
    fetchProducts(); 
    fetchCategoriesList();
  }, []);

  const fetchCategoriesList = async () => {
    try {
      const res = await fetch("/api/admin/categories?all=true");
      const data = await res.json();
      if (data.success) setCategoriesList(data.data);
    } catch {}
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch { } finally { setIsLoading(false); }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.category?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // When selectedSizes or selectedColors or allVariations order changes → regenerate variation matrix
  useEffect(() => {
    if (selectedSizes.length === 0) { 
      if (!editingId) setVariations([]); 
      return; 
    }
    setVariations(prev => {
      const activeOrderedSizes = allVariations.filter(size => selectedSizes.includes(size));
      
      if (selectedColors.length === 0) {
        return activeOrderedSizes.map(size => {
          const existing = prev.find(v => v.size === size && !v.color);
          return existing || { size, stock: 0, sku: "", basePrice: 0, salePrice: 0, color: null, imageUrl: null };
        });
      }
      
      const newVariations: Variation[] = [];
      for (const size of activeOrderedSizes) {
        for (const color of selectedColors) {
          const existing = prev.find(v => v.size === size && v.color === color);
          newVariations.push(existing || {
            size,
            stock: 0,
            sku: "",
            basePrice: 0,
            salePrice: 0,
            color,
            imageUrl: null
          });
        }
      }
      return newVariations;
    });
  }, [selectedSizes, selectedColors, allVariations]);


  const totalStock = useMemo(() => variations.reduce((a, v) => a + (Number(v.stock) || 0), 0), [variations]);
  // Overall discount display removed as pricing is now per variation

  const toggleSize = (s: string) => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const updateVariation = (size: string, color: string | null | undefined, field: keyof Variation, value: any) =>
    setVariations(prev => prev.map(v => (v.size === size && v.color === color) ? { ...v, [field]: value } : v));

  const addColorImage = (url: string) => {
    if (!url) return;
    if (activeColorTab === "Default") {
      setImages(prev => [...prev, url]);
    } else {
      setColorImages(prev => {
        const existing = prev[activeColorTab] || [];
        return {
          ...prev,
          [activeColorTab]: [...existing, url]
        };
      });
    }
    setColorImageInput("");
  };

  const removeColorImage = (idx: number) => {
    if (activeColorTab === "Default") {
      setImages(prev => prev.filter((_, i) => i !== idx));
    } else {
      setColorImages(prev => {
        const existing = prev[activeColorTab] || [];
        return {
          ...prev,
          [activeColorTab]: existing.filter((_, i) => i !== idx)
        };
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        addColorImage(result.url);
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

  const addImage = () => {
    if (imageInput.trim()) { setImages(p => [...p, imageInput.trim()]); setImageInput(""); }
  };

  const addCustomSize = () => {
    const val = customSizeInput.trim();
    if (val) {
      setAllVariations(prev => prev.includes(val) ? prev : [...prev, val]);
      setSelectedSizes(prev => prev.includes(val) ? prev : [...prev, val]);
      setCustomSizeInput("");
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", "variation:" + index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    const data = e.dataTransfer.getData("text/plain");
    let actIndex = draggedIndex;
    
    if (data && data.startsWith("variation:")) {
      actIndex = parseInt(data.replace("variation:", ""), 10);
    }
    
    if (actIndex !== null && actIndex !== dropIndex && !isNaN(actIndex)) {
      setAllVariations(prev => {
        const result = [...prev];
        const [removed] = result.splice(actIndex, 1);
        result.splice(dropIndex, 0, removed);
        return result;
      });
    }
    
    setDraggedIndex(null);
  };

  const addSpecification = () => setSpecifications(prev => [...prev, { key: "", value: "" }]);
  const removeSpecification = (index: number) => setSpecifications(prev => prev.filter((_, idx) => idx !== index));
  const updateSpecification = (index: number, field: "key" | "value", val: string) =>
    setSpecifications(prev => prev.map((spec, idx) => idx === index ? { ...spec, [field]: val } : spec));

  const resetForm = () => {
    setEditingId(null);
    setName(""); setDescription(""); setCategory("");
    setIsFeatured(false); setTags(""); setImages([]);
    setSelectedSizes([]); setVariations([]); setCustomSizeInput("");
    setSpecifications([]);
    setAllVariations([...DEFAULT_SIZES]);
    setSelectedColors([]);
    setColorImages({});
    setActiveColorTab("Default");
    setColorImageInput("");
  };

  const handleEdit = async (id: number) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products?id=${id}`);
      const data = await res.json();
      if (data.success) {
        const p = data.data;
        setEditingId(p.id);
        setName(p.name);
        setDescription(p.description || "");
        setCategory(p.category || "");
        // mrp and salePrice are now in variations
        setIsFeatured(!!p.isFeatured);
        setTags(p.tags || "");
        setImages(JSON.parse(p.images || "[]"));
        
        // Handle variations
        if (p.variations) {
          const sizes = Array.from(new Set(p.variations.map((v: any) => v.size))).filter(s => s !== "Default") as string[];
          setSelectedSizes(sizes);
          
          const colors = Array.from(new Set(p.variations.map((v: any) => v.color).filter(Boolean))) as string[];
          setSelectedColors(colors);
          
          setVariations(p.variations);
          
          // Populate allVariations with database order, followed by other default options
          const remainingDefaults = DEFAULT_SIZES.filter(s => !sizes.includes(s));
          setAllVariations([...sizes, ...remainingDefaults]);
        }
        
        // Handle colorImages
        if (p.colorImages) {
          try {
            const parsedColors = JSON.parse(p.colorImages);
            setColorImages(parsedColors || {});
            
            // Get all colors that have images
            const activeColors = Object.keys(parsedColors).filter(c => c !== "Default");
            setSelectedColors(prev => Array.from(new Set([...prev, ...activeColors])));
          } catch (e) {
            console.error("Failed to parse colorImages during edit load", e);
          }
        } else {
          setColorImages({});
        }
        
        // Handle specifications
        setSpecifications(p.specifications ? JSON.parse(p.specifications) : []);

        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch { showToast("Failed to load product details."); } finally { setIsSubmitting(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showToast("Product name is required.");
    const hasColorImages = Object.values(colorImages).some(imgList => Array.isArray(imgList) && imgList.length > 0);
    if (images.length < 1 && !hasColorImages) return showToast("Add at least 1 general image URL or a color-specific image URL.");
    if (variations.length === 0) return showToast("Please add at least one size/color variation.");
    const overpricedVariation = variations.find(v => Number(v.salePrice) > Number(v.basePrice));
    if (overpricedVariation) return showToast(`Sale Price must be lower than or equal to Base Price for: ${overpricedVariation.size}`);

    setIsSubmitting(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const payload = { 
        id: editingId, name, description, images, variations, 
        category, tags, isFeatured, specifications,
        colorImages: JSON.stringify(colorImages)
      };
      
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { 
        showToast(editingId ? "✓ Product updated!" : "✓ Product added to store!"); 
        fetchProducts(); 
        resetForm(); 
      }
      else showToast(data.details || data.error || "Failed to save product.");
    } catch (err: any) { showToast(err.message || "Network error."); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Product deleted successfully.");
        fetchProducts();
        if (editingId === id) resetForm();
      } else {
        showToast(data.error || "Failed to delete product.");
      }
    } catch { showToast("Network error."); }
  };

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockEditingProduct) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: stockEditingProduct.id, 
          name: stockEditingProduct.name,
          variations: stockVariations 
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✓ Stock updated successfully!");
        fetchProducts();
        setStockModalOpen(false);
      } else {
        showToast(data.error || "Failed to update stock");
      }
    } catch {
      showToast("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStockModal = async (product: Product) => {
    setStockEditingProduct(product);
    setStockModalOpen(true);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`);
      const data = await res.json();
      if (data.success) {
        setStockVariations(data.data.variations || []);
      }
    } catch {
      showToast("Failed to load variations.");
      setStockModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden">
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#0D47A1] text-[#FF9800] px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 font-bold text-sm">
          <Check size={18} /><span>{toast}</span>
        </div>
      )}

      {/* ─── QUICK STOCK MODAL ────────────────────────── */}
      {stockModalOpen && stockEditingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={() => !isSubmitting && setStockModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-brand/5 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-brand/5 flex items-center justify-between bg-brand/5">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-brand/10">
                  <img src={JSON.parse(stockEditingProduct.images || "[]")[0]} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-playfair font-bold text-brand">Quick Stock Update</h2>
                  <p className="text-[10px] font-black text-brand/30 uppercase tracking-widest">{stockEditingProduct.name}</p>
                </div>
              </div>
              <button onClick={() => setStockModalOpen(false)} className="p-2 hover:bg-brand/10 rounded-xl transition-all">
                <X size={20} className="text-brand/40" />
              </button>
            </div>

            <form onSubmit={handleStockUpdate} className="p-8">
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 mb-8">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-brand/30 uppercase tracking-widest">
                    <tr>
                      <th className="pb-4 px-2">Variation</th>
                      <th className="pb-4 px-2">Stock Left</th>
                      <th className="pb-4 px-2">New Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand/5">
                    {stockVariations.map((v, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-4 px-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-brand">{v.size}</span>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`text-xs font-black ${v.stock < 10 ? "text-red-500" : "text-brand/40"}`}>{v.stock}</span>
                        </td>
                        <td className="py-4 px-2">
                          <input 
                            type="number" 
                            min="0"
                            value={v.stock}
                            onChange={(e) => {
                              const newVal = parseInt(e.target.value) || 0;
                              setStockVariations(prev => prev.map((item, i) => i === idx ? { ...item, stock: newVal } : item));
                            }}
                            className="w-24 bg-brand/5 border-2 border-transparent focus:border-brand-accent/30 rounded-xl px-4 py-2 text-xs font-black text-brand outline-none transition-all"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setStockModalOpen(false)}
                  className="flex-1 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-brand/40 hover:bg-brand/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-[2] bg-brand text-brand-accent px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-brand/20 transition-all flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Save Stock Levels</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex h-full w-full overflow-hidden">
        
        {/* ─── LEFT: FORM (Middle Workspace) ────────────────────────── */}
        <div className="flex-[3] h-full overflow-y-auto custom-scrollbar p-4 md:p-6 border-r border-brand/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand-accent/10 rounded-xl">
                {editingId ? <Edit3 className="text-brand-accent" size={22} /> : <Plus className="text-brand-accent" size={22} />}
              </div>
              <div>
                <h1 className="text-3xl font-playfair font-bold text-brand">{editingId ? "Edit Product" : "Add New Product"}</h1>
                <p className="text-brand/40 text-xs font-medium mt-1">
                  {editingId ? `Updating product ID: ${editingId}` : "Fill in the details below to list a new item"}
                </p>
              </div>
            </div>
            {editingId && (
              <button onClick={resetForm} className="px-4 py-2 bg-brand/5 text-brand/40 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand/10 transition-all">
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-brand/5 space-y-8">

            {/* ── Section 1: Identity ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">1</span> Product Identity</h3>
              <div className="space-y-5">
                <div>
                  <label className={LABEL}>Product Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Polycab FR-LSH PVC Insulated Wire" className={INPUT} required />
                </div>
                <div>
                  <label className={LABEL}>Category *</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className={INPUT} 
                    required
                  >
                    <option value="">Select a Category</option>
                    {categoriesList.map(cat => {
                      return (
                        <option key={cat.id} value={cat.slug}>
                          {cat.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the voltage rating, conductor type, insulation details, and applications..." rows={3} className={`${INPUT} resize-none`} />
                </div>
                <div>
                  <label className={LABEL}>Tags (comma-separated)</label>
                  <input value={tags} onChange={e => setTags(e.target.value)} placeholder="copper, polycab, 3-core, flame-retardant, heavy-duty…" className={INPUT} />
                </div>
                <div className="flex items-center justify-between p-6 bg-brand/5 rounded-[2.5rem] border border-brand/10 transition-all hover:bg-brand/[0.08]">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl transition-all ${isFeatured ? "bg-brand-accent/20 text-brand-accent" : "bg-brand/10 text-brand/30"}`}>
                      <Sparkles size={20} className={isFeatured ? "animate-pulse" : ""} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-brand uppercase tracking-widest">Featured Product</p>
                      <p className="text-[10px] text-brand/40 font-medium">Spotlight this item on the homepage</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsFeatured(!isFeatured)} 
                    className={`w-14 h-7 rounded-full transition-all relative flex items-center px-1 ${isFeatured ? "bg-brand-accent shadow-[0_0_15px_rgba(197,160,89,0.3)]" : "bg-brand/20"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-300 ease-out ${isFeatured ? "translate-x-7" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </div>


            {/* ── Section 4: Stock ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">4</span> Inventory Overview</h3>
              <div className="p-5 bg-brand/5 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black text-brand/40 uppercase tracking-widest">Total Combined Stock (All variations)</span>
                <span className="text-2xl font-black text-brand">{totalStock}</span>
              </div>
            </div>

            {/* ── Section 4: Sizes ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">4</span> 
                Available Sizes
              </h3>
              
              <div className="space-y-4">
                {/* Unified Variations List */}
                <div className="flex flex-wrap gap-2 items-center p-5 bg-brand/5 rounded-2xl border border-brand/5">
                  {allVariations.map((size, index) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <div
                        key={size}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={() => setDragOverIndex(null)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          setSelectedSizes(prev => 
                            prev.includes(size) ? prev.filter(x => x !== size) : [...prev, size]
                          );
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-grab active:cursor-grabbing hover:opacity-90 select-none ${
                          draggedIndex === index ? "opacity-40 scale-95" : ""
                        } ${
                          dragOverIndex === index 
                            ? "border-brand-accent bg-brand-accent/10 text-brand scale-105 shadow-md" 
                            : isSelected
                              ? "bg-brand text-white border-brand shadow-sm animate-in fade-in zoom-in-95 duration-200"
                              : "bg-white text-brand/50 border-brand/10 hover:border-brand/30"
                        }`}
                      >
                        <span className="text-current/30 font-black cursor-grab">⋮⋮</span>
                        <span>{size}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse ml-1" />
                        )}
                      </div>
                    );
                  })}

                  {/* Add Custom Input inline with list */}
                  <div className="flex gap-2 ml-auto pl-4 border-l border-brand/10">
                    <input 
                      value={customSizeInput} 
                      onChange={e => setCustomSizeInput(e.target.value)} 
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
                      placeholder="Add custom (e.g. 100mm)" 
                      className="bg-white border border-brand/10 focus:border-brand-accent/50 rounded-xl px-4 py-2 text-xs font-semibold text-brand outline-none transition-all placeholder:text-brand/20 w-44 shadow-sm" 
                    />
                    <button 
                      type="button" 
                      onClick={addCustomSize} 
                      className="bg-brand text-brand-accent p-2 rounded-xl hover:bg-brand-hover transition-all flex items-center justify-center shadow-md cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 5: Available Colors ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">5</span> 
                Available Colors
              </h3>
              
              <div className="space-y-6">
                {/* Preset colors grid */}
                <div className="flex flex-wrap gap-4">
                  {[
                    { name: "BLACK", hex: "#000000" },
                    { name: "WHITE", hex: "#FAFAFA" },
                    { name: "NAVY", hex: "#1B2A4A" },
                    { name: "FOREST GREEN", hex: "#1C3B2B" },
                    { name: "MAROON", hex: "#7D1C1C" },
                    { name: "BEIGE", hex: "#F2E8D5" },
                    { name: "GOLD", hex: "#C5A059" },
                    { name: "RED", hex: "#E53935" },
                    { name: "SKY BLUE", hex: "#63C2DE" },
                    { name: "PINK", hex: "#E83E8C" },
                    { name: "GREY", hex: "#8F9BA6" },
                    { name: "BROWN", hex: "#8B4513" },
                  ].map((color) => {
                    const isSelected = selectedColors.includes(color.name);
                    return (
                      <div
                        key={color.name}
                        onClick={() => {
                          setSelectedColors(prev => 
                            prev.includes(color.name) 
                              ? prev.filter(x => x !== color.name) 
                              : [...prev, color.name]
                          );
                        }}
                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all w-24 h-24 select-none ${
                          isSelected 
                            ? "border-[#C5A059] bg-[#C5A059]/5 shadow-md scale-105 animate-in fade-in zoom-in-95 duration-200" 
                            : "border-brand/10 bg-white hover:border-brand/35 hover:scale-[1.02]"
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-full border border-brand/10 shadow-inner" 
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[9px] font-black uppercase text-brand/60 mt-3 tracking-widest text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {color.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Color Picker */}
                <div className="bg-brand/5 p-5 rounded-[2rem] border border-brand/5">
                  <span className="text-[9px] font-black text-brand/40 uppercase tracking-widest block mb-3">Custom Color Picker</span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      {/* Interactive Color Box */}
                      <div 
                        className="w-14 h-14 rounded-xl border border-brand/10 relative flex items-center justify-center bg-white shadow-sm overflow-hidden" 
                        style={{ backgroundColor: customColorHex }}
                      >
                        <input 
                          type="color" 
                          value={customColorHex} 
                          onChange={e => setCustomColorHex(e.target.value)} 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                        />
                        <div className="w-3 h-3 rounded-full bg-white absolute bottom-1 right-1 border border-brand/20 shadow-sm pointer-events-none" />
                      </div>

                      {/* Hex input */}
                      <input 
                        type="text" 
                        value={customColorHex} 
                        onChange={e => setCustomColorHex(e.target.value)} 
                        placeholder="#C5A059" 
                        className="bg-white border border-brand/10 focus:border-brand-accent/50 rounded-xl px-4 py-2.5 text-xs font-bold text-brand outline-none transition-all placeholder:text-brand/20 w-36 uppercase" 
                      />

                      {/* Add Button */}
                      <button 
                        type="button" 
                        onClick={() => {
                          const hex = customColorHex.trim().toUpperCase();
                          if (!hex.startsWith("#")) return showToast("Color hex code must start with #");
                          const name = hex;
                          if (!selectedColors.includes(name)) {
                            setSelectedColors(prev => [...prev, name]);
                          }
                        }}
                        className="bg-[#1C3B2B] text-white hover:bg-[#2C4B3B] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                      >
                        ADD COLOR TO MATRIX
                      </button>
                    </div>

                    <div className="text-[10px] text-brand/40 font-medium italic sm:max-w-[300px] leading-relaxed">
                      Pick a shade and click "Add Color" to confirm. This will generate new size variations in the matrix below.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 6: Color-Specific Images ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">6</span> 
                Color-Specific Images
              </h3>
              
              <div className="bg-brand/5 p-6 rounded-[2rem] border border-brand/5 space-y-6">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 pb-4 border-b border-brand/10">
                  {["Default", ...selectedColors].map((tab) => {
                    const isSelected = activeColorTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveColorTab(tab)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          isSelected 
                            ? "bg-brand text-white border-brand shadow-sm scale-105" 
                            : "bg-white text-brand/60 border-brand/10 hover:border-brand/20"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div>
                  <span className="text-[10px] font-black text-brand/40 uppercase tracking-widest block mb-4">
                    {activeColorTab} Images ({(activeColorTab === "Default" ? images : (colorImages[activeColorTab] || [])).length})
                  </span>

                  <div className="flex gap-3 mb-5">
                    <input 
                      value={colorImageInput} 
                      onChange={e => setColorImageInput(e.target.value)} 
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addColorImage(colorImageInput.trim()))} 
                      placeholder="Paste URL or upload image →" 
                      className="bg-white border border-brand/10 focus:border-brand-accent/50 rounded-xl px-4 py-2 text-xs font-semibold text-brand outline-none transition-all placeholder:text-brand/20 flex-1 text-brand" 
                    />
                    <button 
                      type="button" 
                      onClick={() => addColorImage(colorImageInput.trim())} 
                      className="bg-[#1C3B2B] text-[#FF9800] px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#2C4B3B] transition-all whitespace-nowrap cursor-pointer"
                    >
                      Add URL
                    </button>
                    
                    <input 
                      type="file" 
                      id="color-image-upload" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="color-image-upload" 
                      className={`bg-[#C5A059] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#D5B069] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Upload Image
                        </>
                      )}
                    </label>
                  </div>

                  {/* Images list */}
                  {((activeColorTab === "Default" ? images : (colorImages[activeColorTab] || []))).length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {(activeColorTab === "Default" ? images : (colorImages[activeColorTab] || [])).map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-brand/10 group bg-white">
                          <img src={img} alt={`color-img-${i}`} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeColorImage(i)} 
                            className="absolute inset-0 bg-red-500/80 text-white items-center justify-center hidden group-hover:flex animate-in fade-in duration-200"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-brand/10 rounded-2xl py-12 text-center text-brand/30">
                      <p className="text-[10px] font-black uppercase tracking-widest">No images added for this color</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 7: Variation Matrix ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">7</span> 
                Variation Matrix (Stock & SKU)
              </h3>
              {variations.length > 0 ? (
                <div className="overflow-hidden rounded-[2rem] border border-brand/5 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-brand text-white/60 font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-5 py-4">Variation</th>
                          <th className="px-5 py-4">Base Price (₹)</th>
                          <th className="px-5 py-4">Sale (₹)</th>
                          <th className="px-5 py-4 text-center">Discount (%)</th>
                          <th className="px-5 py-4">Stock Left</th>
                          <th className="px-5 py-4">SKU</th>
                          <th className="px-5 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand/5">
                        {variations.map((v, idx) => (
                          <tr key={`${v.size}-${v.color || "none"}-${idx}`} className="hover:bg-brand/5 transition-colors">
                            <td className="px-5 py-3 font-bold text-brand">{v.size} {v.color ? `(${v.color})` : ""}</td>
                            <td className="px-5 py-3">
                              <input 
                                type="number" 
                                value={v.basePrice ?? ""} 
                                onChange={e => updateVariation(v.size, v.color, "basePrice", e.target.value === "" ? "" : parseFloat(e.target.value))} 
                                className="w-20 bg-brand/5 border border-transparent focus:border-brand-accent/40 rounded-lg px-3 py-2 text-xs font-bold outline-none text-brand" 
                                placeholder="1000" 
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input 
                                type="number" 
                                value={v.salePrice ?? ""} 
                                onChange={e => updateVariation(v.size, v.color, "salePrice", e.target.value === "" ? "" : parseFloat(e.target.value))} 
                                className={`w-20 border transition-all rounded-lg px-3 py-2 text-xs font-bold outline-none ${
                                  v.salePrice && v.basePrice && Number(v.salePrice) > Number(v.basePrice)
                                    ? "bg-red-50 border-red-200 text-red-600 focus:border-red-400" 
                                    : "bg-brand/5 border-transparent focus:border-brand-accent/40 text-green-600"
                                }`} 
                                placeholder="699" 
                              />
                            </td>
                            <td className="px-5 py-3 text-center font-bold text-brand-accent">
                              {(() => {
                                const base = Number(v.basePrice) || 0;
                                const sale = Number(v.salePrice) || 0;
                                if (base > 0 && sale > 0 && base > sale) {
                                  return `${Math.round(((base - sale) / base) * 100)}%`;
                                }
                                return "0%";
                              })()}
                            </td>
                            <td className="px-5 py-3">
                              <input 
                                type="number" 
                                value={v.stock ?? ""} 
                                onChange={e => updateVariation(v.size, v.color, "stock", e.target.value === "" ? "" : parseInt(e.target.value))} 
                                className="w-16 bg-brand/5 border border-transparent focus:border-brand-accent/40 rounded-lg px-3 py-2 text-xs font-bold text-brand outline-none" 
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input 
                                type="text" 
                                value={v.sku ?? ""} 
                                onChange={e => updateVariation(v.size, v.color, "sku", e.target.value)} 
                                placeholder={`SKU-${v.size}`} 
                                className="w-full min-w-[80px] bg-brand/5 border border-transparent focus:border-brand-accent/40 rounded-lg px-3 py-2 text-xs font-bold text-brand outline-none" 
                              />
                            </td>
                            <td className="px-5 py-3 text-center">
                              <button 
                                type="button" 
                                onClick={() => {
                                  setVariations(prev => prev.filter(x => !(x.size === v.size && x.color === v.color)));
                                }}
                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                  </table>
                </div>
              </div>
              ) : (
                <div className="py-10 text-center border-2 border-dashed border-brand/10 rounded-2xl">
                  <p className="text-[10px] font-black text-brand/30 uppercase tracking-[0.2em]">Select weights above to generate the variation matrix</p>
                </div>
              )}
            </div>

            {/* ── Section 8: Specifications ── */}
            <div>
              <h3 className="text-xs font-black text-brand/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand text-white text-[8px] flex items-center justify-center font-black">8</span> 
                Product Specifications
              </h3>
              
              <div className="space-y-4">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex gap-4 items-center">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={e => updateSpecification(index, "key", e.target.value)}
                      placeholder="e.g. Conductor Material"
                      className={`${INPUT} flex-1`}
                      required
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={e => updateSpecification(index, "value", e.target.value)}
                      placeholder="e.g. Pure Copper"
                      className={`${INPUT} flex-1`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecification(index)}
                      className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSpecification}
                  className="flex items-center gap-2 bg-[#0D47A1]/5 text-[#0D47A1] hover:bg-[#0D47A1]/10 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  <Plus size={14} /> Add Specification
                </button>
              </div>
            </div>

            {/* Submit */}
            <button disabled={isSubmitting}
              className="w-full bg-brand text-brand-accent py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs hover:bg-brand-hover hover:shadow-[0_20px_40px_rgba(27,48,34,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-4 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="relative flex items-center space-x-3">
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : editingId ? <Check size={20} /> : <Plus size={20} />}
                <span>{isSubmitting ? "Processing..." : editingId ? "Update Product" : "Add to Store"}</span>
              </div>
            </button>
          </form>
        </div>

        {/* ─── RIGHT: INVENTORY (Context Sidebar) ───────────────────── */}
        <div className="flex-[1] min-w-[320px] h-full overflow-y-auto bg-brand/5 custom-scrollbar p-6">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="text-[#FF9800]" size={22} />
                <h2 className="text-2xl font-playfair font-bold text-brand">Inventory</h2>
              </div>
              <span className="text-[10px] font-black text-brand/30 uppercase tracking-widest bg-brand/5 px-3 py-1.5 rounded-full">{products.length} total</span>
            </div>

            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/20 group-focus-within:text-[#FF9800] transition-colors" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search inventory..."
                className="w-full bg-white border border-brand/5 focus:border-[#FF9800]/30 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-brand outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2 pr-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-brand/20">
                  <Loader2 size={36} className="animate-spin mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Loading…</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-brand/10 rounded-3xl">
                  <Package size={40} className="text-brand/10 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-brand/30 uppercase tracking-widest">No products found</p>
                  <p className="text-[10px] text-brand/20 mt-2">Try a different search term</p>
                </div>
              ) : filteredProducts.map(product => {
                const imgs = JSON.parse(product.images || "[]");
                const off = product.basePrice && product.salePrice ? Math.round((1 - product.salePrice / product.basePrice) * 100) : 0;
                const isCurrentlyEditing = editingId === product.id;
                
                return (
                  <div key={product.id} className={`bg-white rounded-2xl p-3 border transition-all duration-300 group ${isCurrentlyEditing ? "border-brand-accent shadow-lg" : "border-brand/5 hover:border-brand-accent/30 shadow-sm"}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand/5 border border-brand/5 flex-shrink-0 relative">
                        <img src={imgs[0] || "/images/placeholder.png"} alt={product.name} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = "/images/placeholder.png")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-[11px] font-bold text-brand truncate">{product.name}</h3>
                          {product.isFeatured && <Sparkles size={8} className="text-brand-accent" />}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[10px] font-black text-brand">₹{product.salePrice?.toLocaleString()}</span>
                          {off > 0 && <span className="text-[8px] text-green-600 font-bold">{off}% OFF</span>}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               openStockModal(product);
                             }}
                             title="Click to manage stock"
                             className={`text-[8px] font-black px-2 py-0.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer ${(product.totalStock || 0) > 10 ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}
                           >
                            {product.totalStock || 0} STOCK
                          </button>
                          <div className="flex space-x-1">
                            <button onClick={() => handleEdit(product.id)} className={`p-1.5 rounded-lg transition-all ${isCurrentlyEditing ? "bg-brand text-white" : "bg-brand/5 text-brand hover:bg-brand hover:text-white"}`}><Edit3 size={10} /></button>
                            <button onClick={() => handleDelete(product.id)} className="p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={10} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
