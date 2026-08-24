"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, AlertCircle, Loader2, Save, Image as ImageIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableBannerItem } from "@/components/admin/SortableBannerItem";

type BannerItem = {
  id: number;
  title: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  linkHref: string;
  displayOrder: number;
  isActive: boolean;
};

export default function AdminHomeBanners() {
  const router = useRouter();
  const [items, setItems] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    title: "Homepage Banner", 
    imageUrl: "", 
    mobileImageUrl: "",
    linkHref: "", 
    displayOrder: 0, 
    isActive: true 
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "imageUrl" | "mobileImageUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === "imageUrl") {
      setIsUploading(true);
    } else {
      setIsUploadingMobile(true);
    }
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (result.url) {
        setFormData(prev => ({ ...prev, [field]: result.url }));
      } else {
        alert(result.error || "Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    } finally {
      if (field === "imageUrl") {
        setIsUploading(false);
      } else {
        setIsUploadingMobile(false);
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/home-banners?all=true");
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else if (res.status === 401) {
        router.push("/admin/login");
      }
    } catch (err) {
      setError("Failed to fetch banners.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: BannerItem) => {
    setEditingId(item.id);
    setFormData({ 
      title: item.title, 
      imageUrl: item.imageUrl, 
      mobileImageUrl: item.mobileImageUrl || "",
      linkHref: item.linkHref, 
      displayOrder: item.displayOrder, 
      isActive: item.isActive 
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ title: "Homepage Banner", imageUrl: "", mobileImageUrl: "", linkHref: "", displayOrder: 0, isActive: true });
  };

  const handleAddNew = () => {
    setFormData({ title: "Homepage Banner", imageUrl: "", mobileImageUrl: "", linkHref: "", displayOrder: items.length, isActive: true });
    setEditingId(0);
  };

  const handleSave = async (id: number | null) => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const method = id ? "PUT" : "POST";
      const payload = id ? { id, ...formData } : formData;
      
      const res = await fetch("/api/admin/home-banners", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(id ? "Banner updated successfully!" : "Banner added successfully!");
        handleCancel();
        fetchItems();
        router.refresh();
      } else {
        setError(data.error || "Failed to save banner.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/home-banners?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Banner deleted successfully!");
        fetchItems();
        router.refresh();
      }
    } catch (err) {
      setError("Failed to delete banner.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        displayOrder: index,
      }));

      setItems(newItems);

      try {
        await fetch("/api/admin/home-banners", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItems),
        });
        router.refresh();
      } catch (err) {
        setError("Failed to save new order.");
        fetchItems();
      }
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
          <h1 className="text-4xl font-playfair font-bold text-brand">Homepage Banners</h1>
          <p className="mt-2 text-brand/60 font-medium">Manage sliding laptop and mobile banners displayed on the homepage.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-[#FF9800] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#F57C00] transition-all shadow-lg"
        >
          <Plus size={16} />
          <span>Add New Banner</span>
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
            {editingId === 0 ? "Add New Banner" : "Edit Banner"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="hidden" value={formData.linkHref} />
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Laptop View Banner Image URL (Recommended: 21:9 or wider)</label>
              <div className="flex space-x-4 items-center">
                <div className="flex-1 flex gap-2">
                  <input 
                    type="text" 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="e.g. /images/silks_laptop.jpg"
                    className="flex-1 bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                    required
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "imageUrl")}
                      id="laptop-banner-image-file"
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="laptop-banner-image-file"
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
                          Upload laptop file
                        </>
                      )}
                    </label>
                  </div>
                </div>
                {formData.imageUrl && (
                  <div className="w-16 h-12 rounded-xl bg-brand/5 border border-brand/10 overflow-hidden shrink-0">
                    <img src={formData.imageUrl} alt="Laptop Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Mobile View Banner Image URL (Recommended: 16:9 or similar)</label>
              <div className="flex space-x-4 items-center">
                <div className="flex-1 flex gap-2">
                  <input 
                    type="text" 
                    value={formData.mobileImageUrl}
                    onChange={(e) => setFormData({ ...formData, mobileImageUrl: e.target.value })}
                    placeholder="e.g. /images/silks_mobile.jpg"
                    className="flex-1 bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "mobileImageUrl")}
                      id="mobile-banner-image-file"
                      className="hidden"
                      disabled={isUploadingMobile}
                    />
                    <label 
                      htmlFor="mobile-banner-image-file"
                      className={`h-full flex items-center justify-center gap-1.5 px-4 bg-brand text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer hover:bg-brand-hover active:scale-[0.98] transition-all whitespace-nowrap min-h-[46px] ${isUploadingMobile ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isUploadingMobile ? (
                        <>
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          Upload mobile file
                        </>
                      )}
                    </label>
                  </div>
                </div>
                {formData.mobileImageUrl && (
                  <div className="w-16 h-12 rounded-xl bg-brand/5 border border-brand/10 overflow-hidden shrink-0">
                    <img src={formData.mobileImageUrl} alt="Mobile Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Status</label>
              <button 
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`flex-1 flex items-center justify-center space-x-2 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest py-3 ${
                  formData.isActive 
                    ? "border-green-100 bg-green-50 text-green-600" 
                    : "border-gray-100 bg-gray-50 text-gray-400"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>{formData.isActive ? "Active" : "Inactive"}</span>
              </button>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button 
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs text-brand/40 hover:bg-brand/5 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSave(editingId === 0 ? null : editingId)}
              disabled={isSaving || !formData.title.trim() || !formData.imageUrl.trim()}
              className="flex items-center space-x-2 bg-[#0D47A1] text-[#FF9800] px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#1565C0] transition-all shadow-lg disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              <span>{editingId === 0 ? "Create Banner" : "Save Changes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sortable Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand/5 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand/5 border-b border-brand/10">
                  <th className="w-16 px-8 py-6"></th>
                  <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Banner Info</th>
                  <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5 relative">
                {items.map((item) => (
                  <SortableBannerItem 
                    key={item.id} 
                    item={item} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
        {items.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand/20">
              <ImageIcon size={32} />
            </div>
            <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">No banners found. Click 'Add New Banner' to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}
