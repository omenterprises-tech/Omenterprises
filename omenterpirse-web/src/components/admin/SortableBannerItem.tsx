"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, Trash2, ExternalLink } from "lucide-react";

interface BannerItem {
  id: number;
  title: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  linkHref: string;
  displayOrder: number;
  isActive: boolean;
}

interface Props {
  item: BannerItem;
  onEdit: (item: BannerItem) => void;
  onDelete: (id: number) => void;
}

export function SortableBannerItem({ item, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
    position: 'relative' as const,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`hover:bg-brand/5 transition-all group ${isDragging ? 'bg-white shadow-2xl opacity-50' : ''}`}
    >
      <td className="px-8 py-5">
        <button 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 text-brand/20 hover:text-[#FF9800] transition-colors"
        >
          <GripVertical size={20} />
        </button>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2 shrink-0">
            <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden border border-brand/5 shadow-sm relative group/thumb flex items-end justify-center">
              <img src={item.imageUrl} alt="Laptop" className="w-full h-full object-cover" />
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white font-bold text-center py-0.5 uppercase tracking-wider font-mono">Laptop</span>
            </div>
            {item.mobileImageUrl && (
              <div className="w-10 h-12 bg-gray-100 rounded-lg overflow-hidden border border-brand/5 shadow-sm relative group/thumb flex items-end justify-center">
                <img src={item.mobileImageUrl} alt="Mobile" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white font-bold text-center py-0.5 uppercase tracking-wider font-mono">Mobile</span>
              </div>
            )}
          </div>
          <div>
            <span className="font-bold text-brand block">Banner #{item.displayOrder + 1}</span>
          </div>
        </div>
      </td>
      <td className="px-8 py-5">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          item.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
        }`}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-8 py-5 text-right">
        <div className="flex justify-end space-x-2">
          <a 
            href={item.linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-lg bg-brand/5 text-brand/60 hover:bg-[#FF9800] hover:text-white transition-all"
          >
            <ExternalLink size={14} />
          </a>
          <button 
            onClick={() => onEdit(item)}
            className="p-2.5 rounded-lg bg-brand/5 text-brand/60 hover:bg-brand-accent hover:text-white transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-2.5 rounded-lg bg-brand/5 text-brand/60 hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
