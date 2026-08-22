"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, AlertCircle, Loader2, Save, Trash2, Edit2, Image as ImageIcon, Award } from "lucide-react";

type BrandItem = {
  id: number;
  name: string;
  imageUrl?: string | null;
  category: string;
  displayOrder: number;
  isActive: boolean;
};

type CategoryItem = {
  id: number;
  name: string;
  slug: string;
};

export default function AdminBrands() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    imageUrl: "", 
    category: "", 
    displayOrder: 0, 
    isActive: true 
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setFormData(prev => ({ ...prev, imageUrl: result.url }));
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

  const fetchData = async () => {
    try {
      const [brandsRes, catRes] = await Promise.all([
        fetch("/api/admin/brands?all=true"),
        fetch("/api/admin/categories?all=true")
      ]);

      const brandsData = await brandsRes.json();
      const catData = await catRes.json();

      if (brandsData.success) {
        setBrands(brandsData.data);
      } else if (brandsRes.status === 401) {
        router.push("/admin/login");
      }

      if (catData.success) {
        setCategories(catData.data);
        if (catData.data.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: catData.data[0].name }));
        }
      }
    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item: BrandItem) => {
    setEditingId(item.id);
    setFormData({ 
      name: item.name, 
      imageUrl: item.imageUrl || "", 
      category: item.category,
      displayOrder: item.displayOrder, 
      isActive: item.isActive 
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ 
      name: "", 
      imageUrl: "", 
      category: categories.length > 0 ? categories[0].name : "", 
      displayOrder: 0, 
      isActive: true 
    });
  };

  const handleAddNew = () => {
    setFormData({ 
      name: "", 
      imageUrl: "", 
      category: categories.length > 0 ? categories[0].name : "", 
      displayOrder: brands.length, 
      isActive: true 
    });
    setEditingId(0);
  };

  const handleSave = async (id: number | null) => {
    if (!formData.name.trim() || !formData.category.trim()) {
      setError("Brand Name and Category are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const method = id ? "PUT" : "POST";
      const payload = id ? { id, ...formData } : { ...formData };
      
      const res = await fetch("/api/admin/brands", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(id ? "Brand updated successfully!" : "Brand created successfully!");
        handleCancel();
        fetchData();
        router.refresh();
      } else {
        setError(data.error || "Failed to save brand.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/brands?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Brand deleted successfully!");
        fetchData();
        router.refresh();
      }
    } catch (err) {
      setError("Failed to delete brand.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#FF9800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Award className="text-[#FF9800]" size={32} />
            <h1 className="text-4xl font-playfair font-bold text-brand">Brand Management</h1>
          </div>
          <p className="mt-1 text-brand/60 font-medium ml-1">Manage brand partners, associate them with product categories, and upload brand logos.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-[#FF9800] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#F57C00] transition-all shadow-lg cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Brand</span>
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center space-x-3 text-green-600 animate-in fade-in">
          <Check size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-500 animate-in fade-in">
          <AlertCircle size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {editingId !== null && (
        <div className="mb-12 bg-white rounded-3xl p-8 shadow-sm border border-brand/5 animate-in zoom-in-95 duration-200">
          <h2 className="text-xl font-playfair font-bold text-brand mb-6">
            {editingId === 0 ? "Add New Brand" : "Edit Brand"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Brand Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Polycab, Legrand, Havells"
                  className="w-full bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  {/* Fallback option if user enters a custom category name */}
                  {!categories.some(c => c.name === formData.category) && formData.category && (
                    <option value={formData.category}>{formData.category}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Brand Logo / Image URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="e.g. https://img.icons8.com/... or /images/brand_logo.png"
                    className="flex-1 bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      id="brand-image-file"
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="brand-image-file"
                      className={`h-full flex items-center justify-center gap-1.5 px-4 bg-brand text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer hover:bg-brand-hover active:scale-[0.98] transition-all whitespace-nowrap min-h-[46px] ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          Upload file
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 flex flex-col justify-between">
              <div>
                <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Logo Preview</label>
                <div className="w-full h-36 bg-brand/5 border border-brand/10 rounded-2xl flex items-center justify-center overflow-hidden p-4">
                  {formData.imageUrl ? (
                    <img 
                      src={formData.imageUrl} 
                      alt={formData.name || "Brand Preview"} 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-brand/30 gap-2">
                      <ImageIcon size={32} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">No Image Provided</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Status</label>
                <button 
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`min-h-[48px] flex items-center justify-center space-x-2 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer ${
                    formData.isActive 
                      ? "border-green-100 bg-green-50 text-green-600" 
                      : "border-gray-100 bg-gray-50 text-gray-400"
                  }`}
                  type="button"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>{formData.isActive ? "Active" : "Inactive"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4 border-t border-brand/5 pt-6">
            <button 
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs text-brand/40 hover:bg-brand/5 transition-all cursor-pointer"
              type="button"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSave(editingId === 0 ? null : editingId)}
              disabled={isSaving || !formData.name.trim() || !formData.category.trim()}
              className="flex items-center space-x-2 bg-[#0D47A1] text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#0c3c88] transition-all shadow-lg disabled:opacity-50 cursor-pointer"
              type="button"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              <span>{editingId === 0 ? "Create Brand" : "Save Changes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Brands Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand/5 border-b border-brand/10">
              <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Logo</th>
              <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Brand Name</th>
              <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Category</th>
              <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand/5">
            {brands.map((brand) => (
              <tr key={brand.id} className="hover:bg-brand/5 transition-colors">
                <td className="px-8 py-4">
                  <div className="w-14 h-14 bg-gray-50 border border-brand/10 rounded-xl flex items-center justify-center overflow-hidden p-2">
                    {brand.imageUrl ? (
                      <img src={brand.imageUrl} alt={brand.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImageIcon className="text-brand/20" size={20} />
                    )}
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span className="font-bold text-brand text-sm">{brand.name}</span>
                </td>
                <td className="px-8 py-4">
                  <span className="inline-block px-3 py-1 bg-[#0D47A1]/10 text-[#0D47A1] font-bold text-xs rounded-full uppercase tracking-wider">
                    {brand.category}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    brand.isActive ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${brand.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {brand.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(brand)}
                      className="p-2.5 bg-brand/5 text-brand hover:bg-[#0D47A1] hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Edit Brand"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id)}
                      className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Delete Brand"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {brands.length === 0 && (
          <div className="p-20 text-center">
            <Award className="mx-auto mb-3 text-brand/20" size={40} />
            <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">No brands found. Click "Add New Brand" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
