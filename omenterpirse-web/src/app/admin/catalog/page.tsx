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
  CheckCircle2,
  FolderPlus,
  FolderTree,
} from "lucide-react";

export function getColorStyles(colorName: string) {
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

export interface CatalogNode {
  id: number;
  parentId: number | null;
  level: number;
  name: string;
  description?: string | null;
  price?: number | null;
  salePrice?: number | null;
  colors?: string | null;
  stock: number;
  displayOrder: number;
  isActive: boolean;
}

export interface GeneratedCombinationItem {
  id: string;
  name: string;
  pathNames: string[];
  leafId: number;
  brand: string;
  category: string;
  price: number;
  salePrice: number;
  color?: string | null;
  thickness?: string | null;
  length?: string | null;
  model?: string | null;
  stock: number;
  unit: string;
  hsn: string;
  gst: number;
  included: boolean;
}

export default function MasterCatalogPage() {
  const [nodes, setNodes] = useState<CatalogNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Cascading Selection Path: index 0 is Level 1, index 1 is Level 2, etc.
  const [selectedPath, setSelectedPath] = useState<number[]>([]);

  // Category filter tabs (Electrical Wires, Electrical Cables, General Items, etc.)
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("All");

  // Node Modal State (Add / Edit)
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [modalTargetParentId, setModalTargetParentId] = useState<number | null>(null);
  const [modalTargetLevel, setModalTargetLevel] = useState<number>(1);
  const [editingNode, setEditingNode] = useState<CatalogNode | null>(null);

  // Modal Form Inputs
  const [nodeName, setNodeName] = useState("");
  const [nodeDesc, setNodeDesc] = useState("");
  const [nodePrice, setNodePrice] = useState("");
  const [nodeSalePrice, setNodeSalePrice] = useState("");
  const [nodeStock, setNodeStock] = useState("100");
  const [nodeColors, setNodeColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");

  // Combinations Generator Modal State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GeneratedCombinationItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<{ created: number; updated: number; total: number } | null>(null);
  const [includeCategoryInName, setIncludeCategoryInName] = useState(false);
  const [reverseNameOrder, setReverseNameOrder] = useState(false);
  const [globalUnit, setGlobalUnit] = useState("COILS");
  const [globalHsn, setGlobalHsn] = useState("8544");
  const [globalGst, setGlobalGst] = useState("18");
  const [generatorSearch, setGeneratorSearch] = useState("");
  const [generatorBrandFilter, setGeneratorBrandFilter] = useState("all");
  const [priceAdjPercent, setPriceAdjPercent] = useState("");
  const [priceAdjAmount, setPriceAdjAmount] = useState("");

  // Fetch Tree from API
  const fetchTree = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/catalog/tree");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNodes(data.nodes || []);
          // If no selection yet and we have root nodes, default select the first root node
          if (data.nodes && data.nodes.length > 0) {
            const rootNodes = data.nodes.filter((n: CatalogNode) => n.parentId === null);
            if (rootNodes.length > 0 && selectedPath.length === 0) {
              setSelectedPath([rootNodes[0].id]);
            }
          }
        }
      } else {
        setError("Failed to fetch catalog tree data.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Error connecting to catalog tree API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  // Compute Root Nodes (Level 1)
  const rootNodes = useMemo(() => {
    const roots = nodes.filter((n) => n.parentId === null);
    if (activeCategoryTab === "All") return roots;
    return roots.filter((n) => {
      const desc = (n.description || "").toLowerCase();
      const tab = activeCategoryTab.toLowerCase();
      return desc.includes(tab) || n.name.toLowerCase().includes(tab);
    });
  }, [nodes, activeCategoryTab]);

  // Determine active levels to display. Always display at least 4 columns.
  // Each column K displays nodes whose parentId is selectedPath[K - 2] (or null for K=1)
  const totalColumns = Math.max(4, selectedPath.length + 1);

  // Helper to get nodes for a specific column index (0-indexed)
  const getNodesForColumn = (colIdx: number): CatalogNode[] => {
    if (colIdx === 0) {
      return rootNodes;
    }
    const parentId = selectedPath[colIdx - 1];
    if (!parentId) return [];
    return nodes.filter((n) => n.parentId === parentId);
  };

  // Helper to get selected parent node for column index
  const getParentForColumn = (colIdx: number): CatalogNode | null => {
    if (colIdx === 0) return null;
    const parentId = selectedPath[colIdx - 1];
    if (!parentId) return null;
    return nodes.find((n) => n.id === parentId) || null;
  };

  // Handle clicking an item in Column `colIdx`
  const handleSelectNode = (colIdx: number, nodeId: number) => {
    // Truncate path up to colIdx and add the new nodeId
    const newPath = [...selectedPath.slice(0, colIdx), nodeId];

    // Check if this node has children; if so, we can optionally auto-select its first child
    const children = nodes.filter((n) => n.parentId === nodeId);
    if (children.length > 0) {
      newPath.push(children[0].id);
    }

    setSelectedPath(newPath);
  };

  // Open modal to add a node in Column `colIdx`
  const openAddNodeModal = (colIdx: number) => {
    if (colIdx === 0) {
      setModalTargetParentId(null);
      setModalTargetLevel(1);
    } else {
      const parent = getParentForColumn(colIdx);
      if (!parent) {
        alert(`Please select an item in Column ${colIdx} first to add a sub-category under it.`);
        return;
      }
      setModalTargetParentId(parent.id);
      setModalTargetLevel(parent.level + 1);
    }
    setEditingNode(null);
    setNodeName("");
    setNodeDesc("");
    setNodePrice("");
    setNodeSalePrice("");
    setNodeStock("100");
    setNodeColors(colIdx >= 2 ? ["Red", "Yellow", "Blue", "Black", "Green"] : []);
    setColorInput("");
    setIsNodeModalOpen(true);
  };

  // Open modal to edit an existing node
  const openEditNodeModal = (node: CatalogNode) => {
    setEditingNode(node);
    setModalTargetParentId(node.parentId);
    setModalTargetLevel(node.level);
    setNodeName(node.name);
    setNodeDesc(node.description || "");
    setNodePrice(node.price !== null && node.price !== undefined ? String(node.price) : "");
    setNodeSalePrice(node.salePrice !== null && node.salePrice !== undefined ? String(node.salePrice) : "");
    setNodeStock(String(node.stock || 100));

    let parsedColors: string[] = [];
    try {
      parsedColors = typeof node.colors === "string" ? JSON.parse(node.colors) : node.colors || [];
    } catch {
      parsedColors = node.colors ? String(node.colors).split(",").map((c) => c.trim()) : [];
    }
    setNodeColors(parsedColors);
    setColorInput("");
    setIsNodeModalOpen(true);
  };

  // Close node modal
  const closeNodeModal = () => {
    setIsNodeModalOpen(false);
    setEditingNode(null);
    setNodeName("");
    setNodeDesc("");
    setNodePrice("");
    setNodeSalePrice("");
    setNodeStock("100");
    setNodeColors([]);
    setColorInput("");
  };

  // Handle saving node (Create or Update)
  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim()) return;

    try {
      const payload = {
        id: editingNode ? editingNode.id : undefined,
        parentId: modalTargetParentId,
        level: modalTargetLevel,
        name: nodeName.trim(),
        description: nodeDesc.trim() || null,
        price: nodePrice.trim() ? parseFloat(nodePrice) : null,
        salePrice: nodeSalePrice.trim() ? parseFloat(nodeSalePrice) : null,
        colors: nodeColors,
        stock: parseInt(nodeStock) || 100,
      };

      const res = await fetch("/api/admin/catalog/tree", {
        method: editingNode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(editingNode ? "Sub-category updated!" : "Sub-category added!");
        closeNodeModal();
        await fetchTree();
        // If adding child, ensure path contains this parent
        if (modalTargetParentId && !selectedPath.includes(modalTargetParentId)) {
          const parent = nodes.find((n) => n.id === modalTargetParentId);
          if (parent) {
            setSelectedPath((prev) => [...prev.slice(0, parent.level - 1), parent.id, data.node.id]);
          }
        }
      } else {
        alert(data.error || "Failed to save item");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error saving item to catalog tree.");
    }
  };

  // Handle deleting a node and all descendants
  const handleDeleteNode = async (node: CatalogNode) => {
    if (!confirm(`Are you sure you want to delete "${node.name}" and all of its sub-categories?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/catalog/tree?id=${node.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Deleted "${node.name}" and all sub-categories!`);
        // Remove from selected path if present
        setSelectedPath((prev) => prev.filter((id) => id !== node.id));
        fetchTree();
      } else {
        alert(data.error || "Failed to delete item");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error deleting item from tree.");
    }
  };

  // Color Tag Helpers
  const handleAddColorTag = () => {
    const val = colorInput.trim();
    if (val && !nodeColors.includes(val)) {
      setNodeColors([...nodeColors, val]);
      setColorInput("");
    }
  };

  const handleRemoveColorTag = (c: string) => {
    setNodeColors(nodeColors.filter((col) => col !== c));
  };

  // ── All Combinations Generator Engine ────────────────────────
  // Traverses all root-to-leaf paths in the tree and yields individual combination products
  const computeAllCombinations = useMemo(() => {
    const results: GeneratedCombinationItem[] = [];

    // Helper map of parentId -> children
    const childrenMap = new Map<number | null, CatalogNode[]>();
    nodes.forEach((n) => {
      const p = n.parentId;
      if (!childrenMap.has(p)) childrenMap.set(p, []);
      childrenMap.get(p)!.push(n);
    });

    const traverse = (
      currentNode: CatalogNode,
      currentPath: CatalogNode[],
      accumulatedPrice: number,
      accumulatedSalePrice: number
    ) => {
      const path = [...currentPath, currentNode];
      const effPrice = currentNode.price !== null && currentNode.price !== undefined ? currentNode.price : accumulatedPrice;
      const effSalePrice =
        currentNode.salePrice !== null && currentNode.salePrice !== undefined
          ? currentNode.salePrice
          : currentNode.price !== null && currentNode.price !== undefined
          ? currentNode.price
          : accumulatedSalePrice;

      const children = childrenMap.get(currentNode.id) || [];

      if (children.length === 0) {
        // Leaf node reached: generate combination product
        let parsedColors: string[] = [];
        try {
          parsedColors = typeof currentNode.colors === "string" ? JSON.parse(currentNode.colors) : currentNode.colors || [];
        } catch {
          parsedColors = currentNode.colors ? String(currentNode.colors).split(",").map((c) => c.trim()) : [];
        }

        const pathNames = path.map((n) => n.name);
        const rootBrand = path[0]?.name || "Brand";
        const catName = activeCategoryTab !== "All" ? activeCategoryTab : "Electrical Wires";

        if (parsedColors.length > 0) {
          parsedColors.forEach((col) => {
            const fullName = [...pathNames, col].join(" ");
            results.push({
              id: `${path.map((n) => n.id).join("-")}-${col}`,
              name: fullName,
              pathNames: [...pathNames, col],
              leafId: currentNode.id,
              brand: rootBrand,
              category: catName,
              price: effPrice || 1000,
              salePrice: effSalePrice || effPrice || 1000,
              color: col,
              stock: currentNode.stock || 100,
              unit: globalUnit,
              hsn: globalHsn,
              gst: Number(globalGst) || 18,
              included: true,
            });
          });
        } else {
          const fullName = pathNames.join(" ");
          results.push({
            id: `${path.map((n) => n.id).join("-")}-nocolor`,
            name: fullName,
            pathNames: pathNames,
            leafId: currentNode.id,
            brand: rootBrand,
            category: catName,
            price: effPrice || 1000,
            salePrice: effSalePrice || effPrice || 1000,
            color: null,
            stock: currentNode.stock || 100,
            unit: globalUnit,
            hsn: globalHsn,
            gst: Number(globalGst) || 18,
            included: true,
          });
        }
        return;
      }

      // Continue traversal down children
      for (const child of children) {
        traverse(child, path, effPrice, effSalePrice);
      }
    };

    // Start traversal for each root node in active category
    for (const root of rootNodes) {
      traverse(root, [], 0, 0);
    }

    return results;
  }, [nodes, rootNodes, activeCategoryTab, globalUnit, globalHsn, globalGst]);

  // Open Generator Modal
  const openGeneratorModal = () => {
    setGeneratedItems(computeAllCombinations);
    setGenerationSummary(null);
    setGeneratorSearch("");
    setGeneratorBrandFilter("all");
    setPriceAdjPercent("");
    setPriceAdjAmount("");
    setIsGeneratorOpen(true);
  };

  // Bulk Price Adjusters
  const applyPercentPriceAdjustment = (percentStr: string) => {
    const percent = parseFloat(percentStr);
    if (isNaN(percent)) return;
    setGeneratedItems((prev) =>
      prev.map((p) => {
        if (!p.included) return p;
        const factor = 1 + percent / 100;
        return {
          ...p,
          price: Math.round(p.price * factor),
          salePrice: Math.round(p.salePrice * factor),
        };
      })
    );
  };

  const applyFlatPriceAdjustment = (amountStr: string) => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return;
    setGeneratedItems((prev) =>
      prev.map((p) => {
        if (!p.included) return p;
        return {
          ...p,
          price: Math.max(0, p.price + amount),
          salePrice: Math.max(0, p.salePrice + amount),
        };
      })
    );
  };

  const applyGlobalUnit = (unit: string) => {
    setGlobalUnit(unit);
    setGeneratedItems((prev) => prev.map((p) => ({ ...p, unit })));
  };

  const applyGlobalHsn = (hsn: string) => {
    setGlobalHsn(hsn);
    setGeneratedItems((prev) => prev.map((p) => ({ ...p, hsn })));
  };

  const applyGlobalGst = (gst: string) => {
    setGlobalGst(gst);
    const numGst = Number(gst) || 18;
    setGeneratedItems((prev) => prev.map((p) => ({ ...p, gst: numGst })));
  };

  // Filtered generated items in preview modal
  const displayedGeneratedItems = useMemo(() => {
    return generatedItems.filter((p) => {
      if (generatorBrandFilter !== "all" && p.brand.toLowerCase() !== generatorBrandFilter.toLowerCase()) {
        return false;
      }
      if (!generatorSearch.trim()) return true;
      const q = generatorSearch.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.color && p.color.toLowerCase().includes(q))
      );
    });
  }, [generatedItems, generatorBrandFilter, generatorSearch]);

  const toggleSelectAllGenerated = (check: boolean) => {
    const ids = new Set(displayedGeneratedItems.map((p) => p.id));
    setGeneratedItems((prev) => prev.map((p) => (ids.has(p.id) ? { ...p, included: check } : p)));
  };

  const toggleRowIncluded = (id: string) => {
    setGeneratedItems((prev) => prev.map((p) => (p.id === id ? { ...p, included: !p.included } : p)));
  };

  const updateGeneratedRow = (id: string, field: keyof GeneratedCombinationItem, value: any) => {
    setGeneratedItems((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  // Save generated products to commercial Products database table
  const handleSaveGeneratedProducts = async () => {
    const selected = generatedItems.filter((p) => p.included);
    if (selected.length === 0) {
      alert("Please select at least one individual product to generate.");
      return;
    }

    setIsGenerating(true);
    setError("");
    try {
      const payload = selected.map((p) => ({
        name: p.name.trim(),
        category: p.category || "Electrical Wires",
        basePrice: Number(p.price) || 0,
        salePrice: Number(p.salePrice) || Number(p.price) || 0,
        unit: p.unit || globalUnit,
        hsn: p.hsn || globalHsn,
        gst: Number(p.gst) || 18,
        stock: Number(p.stock) || 100,
        color: p.color || null,
        size: p.pathNames.length > 2 ? p.pathNames[1] : "Standard",
        brand: p.brand,
        specifications: p.pathNames.map((name, idx) => ({
          key: idx === 0 ? "Brand" : `Level ${idx + 1}`,
          value: name,
        })),
        tags: p.pathNames.join(", "),
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
          total: selected.length,
        });
        setSuccess(`🎉 Generated ${data.createdCount} new individual products (${data.updatedCount} updated) in the Products list!`);
      } else {
        setError(data.error || "Failed to generate products.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Network error while creating individual products.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Column Title generator based on level and context
  const getColumnTitle = (colIdx: number) => {
    if (colIdx === 0) return "1. MAIN CATEGORIES";
    if (colIdx === 1) return "2. SUB-CATEGORIES";
    if (colIdx === 2) return "3. SUB-CATEGORIES";
    if (colIdx === 3) return "4. SPECS & PRICES";
    return `${colIdx + 1}. SUB-CATEGORIES`;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#0D47A1]/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#FF9800] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-[#0D47A1]">
          Loading Dynamic Catalog Tree...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#0D47A1]/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#0D47A1] tracking-tight flex items-center gap-3">
            <Layers className="text-[#FF9800]" size={32} />
            Master Catalog &amp; Cascading Hierarchy
          </h1>
          <p className="text-[#0D47A1]/60 text-sm mt-1">
            Dynamic multi-level drill-down: Main Category → Sub-Categories → Sub-Categories → Specs, Colors &amp; Pricing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openGeneratorModal}
            disabled={computeAllCombinations.length === 0}
            className="flex items-center gap-2 bg-[#FF9800] hover:bg-[#F57C00] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-[#FF9800]/25 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Generate Combinations as Products</span>
            {computeAllCombinations.length > 0 && (
              <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[11px] font-black">
                {computeAllCombinations.length} Ready
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
            onClick={fetchTree}
            className="flex items-center gap-2 bg-[#0D47A1]/5 hover:bg-[#0D47A1]/10 text-[#0D47A1] px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync Tree
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

      {/* Category Pills (Optional Root Filter) */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4">
        <label className="text-xs font-black uppercase tracking-wider text-[#0D47A1]/70 flex items-center gap-2">
          <Grid size={16} className="text-[#FF9800]" /> Select Active Category
        </label>
        <div className="flex flex-wrap gap-3">
          {["All", "Electrical Wires", "Electrical Cables", "General Items"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategoryTab(cat);
                setSelectedPath([]);
              }}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeCategoryTab.toLowerCase() === cat.toLowerCase()
                  ? "bg-[#0D47A1] text-white shadow-lg shadow-[#0D47A1]/20 scale-105"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic N-Column Cascading Drill-Down Board */}
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="grid grid-flow-col auto-cols-[300px] md:auto-cols-[340px] gap-6 items-start">
          {Array.from({ length: totalColumns }).map((_, colIdx) => {
            const colNodes = getNodesForColumn(colIdx);
            const parent = getParentForColumn(colIdx);
            const selectedIdInCol = selectedPath[colIdx];
            const isColActive = colIdx === 0 || selectedPath[colIdx - 1] !== undefined;

            return (
              <div
                key={colIdx}
                className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 space-y-4 min-h-[520px] flex flex-col transition-all"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#0D47A1] flex items-center gap-2">
                      {colIdx === 0 ? (
                        <Award size={16} className="text-[#FF9800]" />
                      ) : colIdx === 1 ? (
                        <Ruler size={16} className="text-[#FF9800]" />
                      ) : colIdx === 2 ? (
                        <Package size={16} className="text-[#FF9800]" />
                      ) : (
                        <Tag size={16} className="text-[#FF9800]" />
                      )}
                      <span>
                        {getColumnTitle(colIdx)} ({colNodes.length})
                      </span>
                    </h3>
                    {parent && (
                      <p className="text-[11px] text-gray-400 font-bold mt-0.5 truncate max-w-[200px]">
                        under: <span className="text-[#0D47A1]">{parent.name}</span>
                      </p>
                    )}
                  </div>

                  {isColActive && (
                    <button
                      onClick={() => openAddNodeModal(colIdx)}
                      className="p-1.5 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors cursor-pointer shadow-sm"
                      title={`Add item to ${getColumnTitle(colIdx)}`}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Column Content / Item List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 max-h-[500px]">
                  {!isColActive ? (
                    <div className="text-center py-16 px-4 space-y-2">
                      <p className="text-xs font-bold text-gray-400">
                        Select an item in Column {colIdx} to view its sub-categories.
                      </p>
                    </div>
                  ) : colNodes.length === 0 ? (
                    <div className="text-center py-16 px-4 space-y-2">
                      <p className="text-xs font-bold text-gray-400">
                        {colIdx === 0
                          ? "No main categories yet."
                          : `No sub-categories added under "${parent?.name || ""}".`}
                      </p>
                      <button
                        onClick={() => openAddNodeModal(colIdx)}
                        className="text-xs font-black text-[#FF9800] hover:underline cursor-pointer"
                      >
                        + Click here to add
                      </button>
                    </div>
                  ) : (
                    colNodes.map((node) => {
                      const isSelected = selectedIdInCol === node.id;
                      let parsedColors: string[] = [];
                      try {
                        parsedColors = typeof node.colors === "string" ? JSON.parse(node.colors) : node.colors || [];
                      } catch {
                        parsedColors = node.colors ? String(node.colors).split(",").map((c) => c.trim()) : [];
                      }

                      return (
                        <div
                          key={node.id}
                          onClick={() => handleSelectNode(colIdx, node.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                            isSelected
                              ? "border-[#0D47A1] bg-[#0D47A1]/5 shadow-sm"
                              : "border-gray-100 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-xs font-bold truncate ${
                                  isSelected ? "text-[#0D47A1]" : "text-gray-800"
                                }`}
                              >
                                {node.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditNodeModal(node);
                                }}
                                className="text-gray-300 hover:text-[#0D47A1] p-1 cursor-pointer"
                                title="Edit"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNode(node);
                                }}
                                className="text-gray-300 hover:text-red-500 p-1 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                              <ChevronRight
                                size={14}
                                className={isSelected ? "text-[#0D47A1]" : "text-gray-400"}
                              />
                            </div>
                          </div>

                          {/* Pricing (if configured on this node) */}
                          {(node.price !== null && node.price !== undefined) && (
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0D47A1]">
                              <span>₹{node.salePrice || node.price}</span>
                              {node.salePrice && node.salePrice !== node.price && (
                                <span className="text-[10px] text-gray-400 line-through">
                                  ₹{node.price}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Colors (if configured on this node) */}
                          {parsedColors.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {parsedColors.map((col, cIdx) => {
                                const style = getColorStyles(col);
                                return (
                                  <span
                                    key={cIdx}
                                    style={{
                                      backgroundColor: style.bg,
                                      color: style.text,
                                      borderColor: style.border,
                                    }}
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
            );
          })}
        </div>
      </div>

      {/* ── MODAL: ADD / EDIT CASCADING NODE ───────────────────────── */}
      {isNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D47A1]/50 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveNode}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-[#0D47A1]">
                {editingNode
                  ? `Edit "${editingNode.name}"`
                  : modalTargetParentId
                  ? `Add Sub-Category (Level ${modalTargetLevel})`
                  : "Add Main Category"}
              </h3>
              <button
                type="button"
                onClick={closeNodeModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">
                Name / Title *
              </label>
              <input
                type="text"
                placeholder={
                  modalTargetLevel === 1
                    ? "e.g. Polycab, Finolex, Pipes"
                    : modalTargetLevel === 2
                    ? "e.g. Wires, Cables, 90 metres"
                    : modalTargetLevel === 3
                    ? "e.g. FR, FRLS, GREEN +"
                    : "e.g. 1.0 SQMM, 1.5 SQMM"
                }
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1] focus:bg-white focus:outline-none focus:border-[#0D47A1]"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">
                Description / Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="Short description..."
                value={nodeDesc}
                onChange={(e) => setNodeDesc(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#0D47A1] focus:bg-white focus:outline-none focus:border-[#0D47A1]"
              />
            </div>

            {/* Optional Pricing */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">
                  Regular Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={nodePrice}
                  onChange={(e) => setNodePrice(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#0D47A1] focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">
                  Sale Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1800"
                  value={nodeSalePrice}
                  onChange={(e) => setNodeSalePrice(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#0D47A1] focus:bg-white"
                />
              </div>
            </div>

            {/* Optional Colors */}
            <div className="pt-1 border-t border-gray-100 space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 block">
                Available Colors (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add color (e.g. Red, Blue, Grey)"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddColorTag();
                    }
                  }}
                  className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#0D47A1] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddColorTag}
                  className="px-4 bg-gray-200 hover:bg-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Color Presets */}
              <div className="flex flex-wrap gap-1">
                {["Red", "Yellow", "Blue", "Black", "Green", "White", "Grey"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (!nodeColors.includes(c)) setNodeColors([...nodeColors, c]);
                    }}
                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase border transition-all cursor-pointer ${
                      nodeColors.includes(c)
                        ? "bg-[#0D47A1] text-white border-[#0D47A1]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    + {c}
                  </button>
                ))}
              </div>

              {/* Selected Color Badges */}
              {nodeColors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {nodeColors.map((c, idx) => {
                    const style = getColorStyles(c);
                    return (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                          borderColor: style.border,
                        }}
                        className="text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border shadow-2xs"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => handleRemoveColorTag(c)}
                          style={{ color: style.text }}
                          className="opacity-70 hover:opacity-100 font-black cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={closeNodeModal}
                className="flex-1 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#FF9800] hover:bg-[#F57C00] text-xs font-bold text-white rounded-xl cursor-pointer shadow-md"
              >
                {editingNode ? "Save Changes" : "Add to Tree"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: COMBINATIONS REVIEW & BATCH SYNC TO PRODUCTS ────── */}
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
                      Generate Individual Products from Combinations
                      <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-amber-200">
                        {generatedItems.length} Combinations Available
                      </span>
                    </h2>
                    <p className="text-white/70 text-xs mt-0.5">
                      Every combination branch from your cascading tree will be created as its own individual product row in your Products list.
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-200/50">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search combinations..."
                      value={generatorSearch}
                      onChange={(e) => setGeneratorSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#0D47A1] placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
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
              ) : displayedGeneratedItems.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <AlertTriangle size={36} className="mx-auto text-amber-500 opacity-60" />
                  <p className="text-sm font-bold text-gray-500">No combinations found matching your search.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-wider bg-gray-50/50 sticky top-0 z-10 backdrop-blur-xs">
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={displayedGeneratedItems.length > 0 && displayedGeneratedItems.every((p) => p.included)}
                          onChange={(e) => toggleSelectAllGenerated(e.target.checked)}
                          className="rounded text-[#0D47A1] focus:ring-[#0D47A1]"
                        />
                      </th>
                      <th className="py-2.5 px-2 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Individual Product Name</th>
                      <th className="py-2.5 px-3">Tree Path Breakdown</th>
                      <th className="py-2.5 px-3 w-32">MRP (₹)</th>
                      <th className="py-2.5 px-3 w-32">Sale Price (₹)</th>
                      <th className="py-2.5 px-3 w-24 text-center">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {displayedGeneratedItems.map((row, idx) => {
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
                              {row.pathNames.map((part, pIdx) => {
                                if (part === row.color && colorStyle) {
                                  return (
                                    <span
                                      key={pIdx}
                                      style={{
                                        backgroundColor: colorStyle.bg,
                                        color: colorStyle.text,
                                        borderColor: colorStyle.border,
                                      }}
                                      className="text-[9px] px-2 py-0.5 rounded font-black uppercase border shadow-2xs"
                                    >
                                      {part}
                                    </span>
                                  );
                                }
                                return (
                                  <span
                                    key={pIdx}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                      pIdx === 0
                                        ? "bg-[#0D47A1]/10 text-[#0D47A1] border-blue-100"
                                        : "bg-gray-100 text-gray-700 border-gray-200"
                                    }`}
                                  >
                                    {part}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                              <input
                                type="number"
                                value={row.price}
                                onChange={(e) => updateGeneratedRow(row.id, "price", Number(e.target.value))}
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
                    {generatedItems.filter((p) => p.included).length}
                  </span>
                  <span> of {generatedItems.length} individual products</span>
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
                    disabled={isGenerating || generatedItems.filter((p) => p.included).length === 0}
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
                        <span>Create {generatedItems.filter((p) => p.included).length} Individual Products</span>
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
