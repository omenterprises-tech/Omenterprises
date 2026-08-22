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
import { SortableNavItem } from "@/components/admin/SortableNavItem";

type NavItem = {
  id: number;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  imageUrl?: string | null;
};

export default function AdminNavigation() {
  const router = useRouter();
  const [items, setItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ label: "", href: "", imageUrl: "", order: 0, isActive: true });
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
      const res = await fetch("/api/admin/nav?all=true");
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else if (res.status === 401) {
        router.push("/admin/login");
      }
    } catch (err) {
      setError("Failed to fetch navigation items.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: NavItem) => {
    setEditingId(item.id);
    setFormData({ label: item.label, href: item.href, imageUrl: item.imageUrl || "", order: item.order, isActive: item.isActive });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ label: "", href: "", imageUrl: "", order: 0, isActive: true });
  };

  const handleAddNew = () => {
    setFormData({ label: "", href: "", imageUrl: "", order: items.length, isActive: true });
    setEditingId(0);
  };

  const handleSave = async (id: number | null) => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const method = id ? "PUT" : "POST";
      
      // Auto-generate href if empty
      const finalHref = formData.href || `/category/${formData.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const payload = id ? { id, ...formData, href: finalHref } : { ...formData, href: finalHref };
      
      const res = await fetch("/api/admin/nav", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(id ? "Item updated successfully!" : "Item added successfully!");
        handleCancel();
        fetchItems();
        router.refresh();
      } else {
        setError(data.error || "Failed to save item.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/nav?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Item deleted successfully!");
        fetchItems();
        router.refresh();
      }
    } catch (err) {
      setError("Failed to delete item.");
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
        order: index,
      }));

      setItems(newItems);

      try {
        await fetch("/api/admin/nav", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItems),
        });
        router.refresh();
      } catch (err) {
        setError("Failed to save new order.");
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
            <h1 className="text-4xl font-playfair font-bold text-brand">Navigation & Pages</h1>
            <p className="mt-2 text-brand/60 font-medium">Manage primary menu links and their page sections.</p>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center space-x-2 bg-[#FF9800] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#F57C00] transition-all shadow-lg"
          >
            <Plus size={16} />
            <span>Add New Link</span>
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
              {editingId === 0 ? "Add New Navigation Link" : "Edit Navigation Link"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Menu Label</label>
                <input 
                  type="text" 
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. New Arrivals"
                  className="w-full bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Status</label>
                <button 
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`flex-1 flex items-center justify-center space-x-2 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
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
            <div className="mt-6">
              <label className="block text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-2 ml-1">Category Image URL (for homepage tab/card)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="e.g. https://images.unsplash.com/... or /images/...png"
                  className="flex-1 bg-brand/5 border border-brand/10 rounded-xl py-3 px-4 text-sm font-bold text-brand focus:outline-none focus:border-[#FF9800]/30 focus:ring-4 focus:ring-[#FF9800]/10 transition-all"
                />
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="nav-image-file"
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="nav-image-file"
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
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSave(editingId === 0 ? null : editingId)}
                disabled={isSaving || !formData.label.trim()}
                className="flex items-center space-x-2 bg-[#0D47A1] text-[#FF9800] px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#1565C0] transition-all shadow-lg disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                <span>{editingId === 0 ? "Create Link" : "Save Changes"}</span>
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
                    <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Menu Label</th>
                    <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand/5 relative">
                  {items.map((item) => (
                    <SortableNavItem 
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
              <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">No navigation items found.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
