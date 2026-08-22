"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, AlertCircle, Loader2, Save } from "lucide-react";
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
import { SortableCategoryItem } from "@/components/admin/SortableCategoryItem";

type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  tagline?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
};

export default function AdminCategories() {
  const router = useRouter();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", imageUrl: "", tagline: "", displayOrder: 0, isActive: true });
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/categories?all=true");
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else if (res.status === 401) {
        router.push("/admin/login");
      }
    } catch (err) {
      setError("Failed to fetch categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: CategoryItem) => {
    setEditingId(item.id);
    setFormData({ 
      name: item.name, 
      slug: item.slug, 
      imageUrl: item.imageUrl || "", 
      tagline: item.tagline || "",
      displayOrder: item.displayOrder, 
      isActive: item.isActive 
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", slug: "", imageUrl: "", tagline: "", displayOrder: 0, isActive: true });
  };

  const handleAddNew = () => {
    setFormData({ name: "", slug: "", imageUrl: "", tagline: "", displayOrder: items.length, isActive: true });
    setEditingId(0);
  };

  const handleSave = async (id: number | null) => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const method = id ? "PUT" : "POST";
      const finalSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload = id ? { id, ...formData, slug: finalSlug } : { ...formData, slug: finalSlug };
      
      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(id ? "Category updated successfully!" : "Category created successfully!");
        handleCancel();
        fetchItems();
        router.refresh();
      } else {
        setError(data.error || "Failed to save category.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category? Products in this category will lose their connection.")) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Category deleted successfully!");
        fetchItems();
        router.refresh();
      }
    } catch (err) {
      setError("Failed to delete category.");
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
        await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItems),
        });
        router.refresh();
      } catch (err) {
        setError("Failed to save category order.");
        fetchItems(); // Revert on failure
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
    <>
      <div>
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-playfair font-bold text-brand">Product Categories</h1>
            <p className="mt-2 text-brand/60 font-medium">Manage store categories, dynamic slugs, and homepage cards.</p>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center space-x-2 bg-[#FF9800] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#F57C00] transition-all shadow-lg"
          >
            <Plus size={16} />
            <span>Add New Category</span>
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
              {editingId === 0 ? "Add New Category" : "Edit Category"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Category Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Electrical Cables"
                    className="w-full bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Tag Line (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. High-quality wires for safe installations"
                    className="w-full bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Slug (auto-generated from name if empty)</label>
                  <input 
                    type="text" 
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                    placeholder="e.g. cables"
                    className="w-full bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col">
                  <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Status</label>
                  <button 
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`flex-1 min-h-[48px] flex items-center justify-center space-x-2 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                      formData.isActive 
                        ? "border-green-100 bg-green-50 text-green-600" 
                        : "border-gray-100 bg-gray-50 text-gray-400"
                    }`}
                    type="button"
                  >
                    <div className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>{formData.isActive ? "Active" : "Inactive"}</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Category Card Image URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="e.g. /images/cables_category.png or https://images.unsplash.com/..."
                  className="flex-1 bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                />
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="category-image-file"
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="category-image-file"
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

            <div className="mt-8 flex justify-end space-x-4">
              <button 
                onClick={handleCancel}
                className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs text-brand/40 hover:bg-brand/5 transition-all"
                type="button"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSave(editingId === 0 ? null : editingId)}
                disabled={isSaving || !formData.name.trim()}
                className="flex items-center space-x-2 bg-[#0D47A1] text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#0c3c88] transition-all shadow-lg disabled:opacity-50"
                type="button"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                <span>{editingId === 0 ? "Create Category" : "Save Changes"}</span>
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
                    <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Category</th>
                    <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand/5 relative">
                  {items.map((item) => (
                    <SortableCategoryItem 
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
              <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">No categories found.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
