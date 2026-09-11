"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
  Package,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  SlidersHorizontal,
  X,
  CheckSquare,
  Square,
  Copy,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  RotateCcw,
  Tag,
  GitBranch,
  Pencil,
  Award,
  Ruler,
  DollarSign,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export function getCrmColorStyles(colorName: string) {
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

export interface CascadingNode {
  id: string;
  name: string;
  parentId: string | null;
  levelIndex: number;
  price?: number;
  salePrice?: number;
  colors?: string[];
  stock?: number;
  imageUrl?: string | null;
}

export interface GeneratedCascadingProduct {
  id: string;
  name: string;
  hierarchy: string[];
  price: number;
  salePrice: number;
  color?: string;
  stock: number;
  included: boolean;
  rootCategory: string;
}

const DEFAULT_CASCADING_NODES: CascadingNode[] = [
  // Column 1: Brands / Main Categories
  { id: "brand-1", name: "Polycab", parentId: null, levelIndex: 0 },
  { id: "brand-2", name: "Finolex", parentId: null, levelIndex: 0 },
  { id: "brand-3", name: "KEI", parentId: null, levelIndex: 0 },

  // Column 2: Lengths (under Polycab)
  { id: "len-1", name: "90 metres", parentId: "brand-1", levelIndex: 1 },
  { id: "len-2", name: "180 metres", parentId: "brand-1", levelIndex: 1 },
  { id: "len-3", name: "200 metres", parentId: "brand-1", levelIndex: 1 },
  { id: "len-4", name: "300 metres", parentId: "brand-1", levelIndex: 1 },

  // Column 2: Types/Sub-Categories (under Finolex)
  { id: "fin-wires", name: "Wires", parentId: "brand-2", levelIndex: 1 },
  { id: "fin-cables", name: "Cables", parentId: "brand-2", levelIndex: 1 },
  { id: "fin-pipes", name: "Pipes", parentId: "brand-2", levelIndex: 1 },

  // Column 3: Models (under Polycab 90m)
  { id: "mod-1", name: "GREEN +", parentId: "len-1", levelIndex: 2 },
  { id: "mod-2", name: "OPTIMA +", parentId: "len-1", levelIndex: 2 },

  // Column 3: Lengths (under Finolex Wires)
  { id: "fin-w-90", name: "90 mts", parentId: "fin-wires", levelIndex: 2 },
  { id: "fin-w-180", name: "180 mts", parentId: "fin-wires", levelIndex: 2 },

  // Column 4: Specs & Prices (under Polycab 90m OPTIMA +)
  {
    id: "spec-1",
    name: "1.0 SQMM",
    parentId: "mod-2",
    levelIndex: 3,
    price: 3145,
    salePrice: 2078,
    colors: ["RED", "YELLOW", "BLUE", "BLACK", "GREEN"],
    stock: 100,
  },
  {
    id: "spec-2",
    name: "1.5 SQMM",
    parentId: "mod-2",
    levelIndex: 3,
    price: 4600,
    salePrice: 3040,
    colors: ["RED", "YELLOW", "BLUE", "BLACK", "GREEN"],
    stock: 100,
  },
  {
    id: "spec-3",
    name: "2.5 SQMM",
    parentId: "mod-2",
    levelIndex: 3,
    price: 4920,
    salePrice: 3251,
    colors: ["RED", "YELLOW", "BLUE", "BLACK", "GREEN"],
    stock: 100,
  },

  // Column 4: Models & Specs (under Finolex Wires 180 mts)
  {
    id: "fin-mod-fr",
    name: "FR",
    parentId: "fin-w-180",
    levelIndex: 3,
    price: 1800,
    salePrice: 1450,
    colors: ["RED", "BLUE", "YELLOW", "BLACK"],
    stock: 100,
  },
  {
    id: "fin-mod-frls",
    name: "FRLS",
    parentId: "fin-w-180",
    levelIndex: 3,
    price: 2400,
    salePrice: 1950,
    colors: ["RED", "BLUE", "YELLOW", "BLACK"],
    stock: 100,
  },
];

export const computeCombinationsFromTree = (
  nodes: CascadingNode[],
  nameOrder: "forward" | "reverse" = "forward"
): GeneratedCascadingProduct[] => {
  const result: GeneratedCascadingProduct[] = [];

  const childrenMap = new Map<string | null, CascadingNode[]>();
  nodes.forEach((n) => {
    const list = childrenMap.get(n.parentId) || [];
    list.push(n);
    childrenMap.set(n.parentId, list);
  });

  const traverse = (currentNode: CascadingNode, path: CascadingNode[]) => {
    const children = childrenMap.get(currentNode.id) || [];

    if (children.length === 0) {
      const fullPath = [...path, currentNode];
      const names = fullPath.map((n) => n.name.trim()).filter(Boolean);
      const rootCategory = fullPath[0]?.name || "General";

      let foundPrice = currentNode.price;
      let foundSalePrice = currentNode.salePrice;
      if (foundPrice === undefined) {
        for (let i = fullPath.length - 1; i >= 0; i--) {
          if (fullPath[i].price !== undefined) {
            foundPrice = fullPath[i].price;
            foundSalePrice = fullPath[i].salePrice;
            break;
          }
        }
      }
      const finalPrice = foundPrice || 0;
      const finalSalePrice = foundSalePrice || finalPrice;
      const finalStock = currentNode.stock || 100;

      let colors: string[] = [];
      for (let i = fullPath.length - 1; i >= 0; i--) {
        if (fullPath[i].colors && fullPath[i].colors!.length > 0) {
          colors = fullPath[i].colors!;
          break;
        }
      }

      if (colors.length > 0) {
        colors.forEach((col) => {
          const comboNames = [...names, col];
          const displayName = nameOrder === "reverse" ? [...comboNames].reverse().join(" ") : comboNames.join(" ");
          result.push({
            id: `${fullPath.map((n) => n.id).join("-")}-${col}`,
            name: displayName,
            hierarchy: comboNames,
            price: finalPrice,
            salePrice: finalSalePrice,
            color: col,
            stock: finalStock,
            included: true,
            rootCategory,
          });
        });
      } else {
        const displayName = nameOrder === "reverse" ? [...names].reverse().join(" ") : names.join(" ");
        result.push({
          id: fullPath.map((n) => n.id).join("-"),
          name: displayName,
          hierarchy: names,
          price: finalPrice,
          salePrice: finalSalePrice,
          stock: finalStock,
          included: true,
          rootCategory,
        });
      }
      return;
    }

    children.forEach((child) => {
      traverse(child, [...path, currentNode]);
    });
  };

  const roots = childrenMap.get(null) || nodes.filter((n) => n.parentId === null);
  roots.forEach((root) => {
    traverse(root, []);
  });

  return result;
};

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (product: any) => void;
  onProductsCreated?: (products: any[]) => void;
  onProductSaved?: (product: any) => void;
  initialProduct?: any | null;
}

interface CategoryLevel {
  id: string;
  label: string;
  values: string[];
  inputValue: string;
  appliesToParents?: string[];
  valueParentMap?: Record<string, string[]>;
  mappingMode?: "level" | "per_value";
}

interface BatchCombinationRow {
  id: string;
  name: string;
  hierarchy: string[];
  price: string;
  included: boolean;
}

export default function ProductModal({
  isOpen,
  onClose,
  onProductCreated,
  onProductsCreated,
  onProductSaved,
  initialProduct,
}: ProductModalProps) {
  const isEditing = Boolean(initialProduct?.id && !initialProduct?._isClone);

  // Tab: "single", "cascading" (Multi-Column Tree), or "batch" (Tag List)
  const [activeTab, setActiveTab] = useState<"single" | "cascading" | "batch">("single");

  // Name order preference: "forward" (a b c d) vs "reverse" (d c b a)
  const [nameOrder, setNameOrder] = useState<"forward" | "reverse">("forward");

  // ================= CASCADING MULTI-COLUMN TREE STATE =================
  const [cascadingNodes, setCascadingNodes] = useState<CascadingNode[]>(DEFAULT_CASCADING_NODES);
  const [columnLabels, setColumnLabels] = useState<string[]>([
    "Main Category",
    "Sub Category",
    "Sub Category",
    "Sub Category",
  ]);
  const [editingColIdx, setEditingColIdx] = useState<number | null>(null);
  const [editingColName, setEditingColName] = useState("");
  const [selectedPath, setSelectedPath] = useState<Record<number, string | null>>({
    0: "brand-1",
    1: "len-1",
    2: "mod-2",
  });

  // Modal to Add / Edit a node in any column
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [nodeEditingId, setNodeEditingId] = useState<string | null>(null);
  const [nodeModalLevel, setNodeModalLevel] = useState<number>(0);
  const [nodeModalParentId, setNodeModalParentId] = useState<string | null>(null);
  const [nodeName, setNodeName] = useState("");
  const [nodePrice, setNodePrice] = useState("");
  const [nodeSalePrice, setNodeSalePrice] = useState("");
  const [nodeColors, setNodeColors] = useState<string[]>(["RED", "YELLOW", "BLUE", "BLACK", "GREEN"]);
  const [nodeColorInput, setNodeColorInput] = useState("");
  const [nodeStock, setNodeStock] = useState("100");

  // Combinations Preview & Generation Modal
  const [cascadingPreviewOpen, setCascadingPreviewOpen] = useState(false);
  const [cascadingGeneratedList, setCascadingGeneratedList] = useState<GeneratedCascadingProduct[]>([]);
  const [cascadingSearch, setCascadingSearch] = useState("");
  const [cascadingUnit, setCascadingUnit] = useState("COILS");
  const [cascadingHsn, setCascadingHsn] = useState("8544");
  const [cascadingGst, setCascadingGst] = useState("18");
  const [cascadingPriceAdjPercent, setCascadingPriceAdjPercent] = useState("");
  const [isCascadingSaving, setIsCascadingSaving] = useState(false);
  const [cascadingSaveSuccess, setCascadingSaveSuccess] = useState<string | null>(null);

  // ================= SINGLE MODE STATE =================
  const [categories, setCategories] = useState<string[]>(["", "", ""]);
  const [name, setName] = useState("");
  const [isManualName, setIsManualName] = useState(false);
  const [price, setPrice] = useState("");
  const [gst, setGst] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [hsn, setHsn] = useState("");

  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [loading, setLoading] = useState(false);
  const [isSavingSimilar, setIsSavingSimilar] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ================= DYNAMIC BATCH GENERATOR STATE =================
  const [batchMainCategory, setBatchMainCategory] = useState("");
  const [batchBasePrice, setBatchBasePrice] = useState("");
  const [batchUnit, setBatchUnit] = useState("COILS");
  const [batchHsn, setBatchHsn] = useState("");
  const [batchGst, setBatchGst] = useState("18");
  const [batchDescription, setBatchDescription] = useState("");

  // Unlimited dynamic sub-category levels
  const [subCategoryLevels, setSubCategoryLevels] = useState<CategoryLevel[]>([
    {
      id: "lvl-1",
      label: "Sub-Category 1",
      values: ["wires"],
      inputValue: "",
    },
    {
      id: "lvl-2",
      label: "Sub-Category 2",
      values: ["180 mts", "90 mts"],
      inputValue: "",
    },
    {
      id: "lvl-3",
      label: "Sub-Category 3",
      values: ["fr", "frls"],
      inputValue: "",
      appliesToParents: ["180 mts"],
    },
    {
      id: "lvl-4",
      label: "Sub-Category 4",
      values: ["1.0 sqmm", "1.5 sqmm"],
      inputValue: "",
    },
    {
      id: "lvl-5",
      label: "Sub-Category 5",
      values: ["red", "blue", "green", "yellow", "black"],
      inputValue: "",
    },
  ]);

  // Per-row price or exclusion overrides in matrix
  const [rowOverrides, setRowOverrides] = useState<
    Record<string, { price?: string; excluded?: boolean }>
  >({});
  const [batchErrors, setBatchErrors] = useState<string>("");

  // Sub-Category Pricing & Matrix View State
  const [pricingViewMode, setPricingViewMode] = useState<"grouped" | "flat">("grouped");
  const [matrixSearch, setMatrixSearch] = useState("");
  const [bulkFilteredPrice, setBulkFilteredPrice] = useState("");
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  const [selectedPricingLevelId, setSelectedPricingLevelId] = useState<string>("");
  const [levelPricesInput, setLevelPricesInput] = useState<Record<string, string>>({});
  const [showLevelPricingDrawer, setShowLevelPricingDrawer] = useState<boolean>(false);

  // Automatically select a sensible default level for Level-Based pricing (e.g. Size or Length)
  useEffect(() => {
    const activeLevels = subCategoryLevels.filter((lvl) => lvl.values.length > 0);
    if (activeLevels.length > 0) {
      if (!selectedPricingLevelId || !activeLevels.some((l) => l.id === selectedPricingLevelId)) {
        const preferred =
          activeLevels.length >= 2
            ? activeLevels[activeLevels.length - 2]
            : activeLevels[0];
        setSelectedPricingLevelId(preferred.id);
      }
    }
  }, [subCategoryLevels, selectedPricingLevelId]);

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Compile name for single mode based on selected nameOrder
  const compiledSingleName = useMemo(() => {
    const valid = categories.map((c) => c.trim()).filter(Boolean);
    if (nameOrder === "reverse") {
      return [...valid].reverse().join(" ");
    }
    return valid.join(" ");
  }, [categories, nameOrder]);

  // ── Cascading Multi-Column Helpers ──────────────────────────
  const activeCascadingCombinations = useMemo(() => {
    return computeCombinationsFromTree(cascadingNodes, nameOrder);
  }, [cascadingNodes, nameOrder]);

  const filteredCascadingProducts = useMemo(() => {
    if (!cascadingSearch.trim()) return cascadingGeneratedList;
    const q = cascadingSearch.toLowerCase().trim();
    return cascadingGeneratedList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.hierarchy.some((h) => h.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q))
    );
  }, [cascadingGeneratedList, cascadingSearch]);

  const parentNodeForModal = useMemo(() => {
    if (!nodeModalParentId) return null;
    return cascadingNodes.find((n) => n.id === nodeModalParentId) || null;
  }, [cascadingNodes, nodeModalParentId]);

  const handleSelectCascadingNode = (level: number, nodeId: string) => {
    setSelectedPath((prev) => {
      const next: Record<number, string | null> = { ...prev, [level]: nodeId };
      for (let k = level + 1; k < 10; k++) {
        delete next[k];
      }
      return next;
    });
  };

  const openAddNodeModal = (level: number) => {
    const parentId = level === 0 ? null : (selectedPath[level - 1] || null);
    if (level > 0 && !parentId) {
      alert(`Please select an item in Column ${level} first before adding sub-categories.`);
      return;
    }
    setNodeEditingId(null);
    setNodeModalLevel(level);
    setNodeModalParentId(parentId);
    setNodeName("");
    setNodePrice("");
    setNodeSalePrice("");
    setNodeColors(["RED", "YELLOW", "BLUE", "BLACK", "GREEN"]);
    setNodeColorInput("");
    setNodeStock("100");
    setNodeModalOpen(true);
  };

  const openEditNodeModal = (node: CascadingNode) => {
    setNodeEditingId(node.id);
    setNodeModalLevel(node.levelIndex);
    setNodeModalParentId(node.parentId);
    setNodeName(node.name);
    setNodePrice(node.price !== undefined ? String(node.price) : "");
    setNodeSalePrice(node.salePrice !== undefined ? String(node.salePrice) : "");
    setNodeColors(node.colors || ["RED", "YELLOW", "BLUE", "BLACK", "GREEN"]);
    setNodeColorInput("");
    setNodeStock(node.stock !== undefined ? String(node.stock) : "100");
    setNodeModalOpen(true);
  };

  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim()) return;

    const parsedPrice = nodePrice.trim() !== "" ? parseFloat(nodePrice) : undefined;
    const parsedSalePrice = nodeSalePrice.trim() !== "" ? parseFloat(nodeSalePrice) : undefined;
    const parsedStock = nodeStock.trim() !== "" ? parseInt(nodeStock) : 100;

    if (nodeEditingId) {
      setCascadingNodes((prev) =>
        prev.map((n) =>
          n.id === nodeEditingId
            ? {
                ...n,
                name: nodeName.trim(),
                price: parsedPrice,
                salePrice: parsedSalePrice,
                colors: nodeColors,
                stock: parsedStock,
              }
            : n
        )
      );
    } else {
      const newNode: CascadingNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: nodeName.trim(),
        parentId: nodeModalParentId,
        levelIndex: nodeModalLevel,
        price: parsedPrice,
        salePrice: parsedSalePrice,
        colors: nodeColors,
        stock: parsedStock,
      };
      setCascadingNodes((prev) => [...prev, newNode]);
      setSelectedPath((prev) => ({
        ...prev,
        [nodeModalLevel]: newNode.id,
      }));
    }

    setNodeModalOpen(false);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!confirm("Are you sure you want to delete this category and all its sub-categories?")) return;

    const toDelete = new Set<string>([nodeId]);
    let added = true;
    while (added) {
      added = false;
      cascadingNodes.forEach((n) => {
        if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
          toDelete.add(n.id);
          added = true;
        }
      });
    }

    setCascadingNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
    setSelectedPath((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((lvlStr) => {
        const lvl = Number(lvlStr);
        if (next[lvl] && toDelete.has(next[lvl]!)) {
          delete next[lvl];
        }
      });
      return next;
    });
  };

  const startEditingColumn = (idx: number) => {
    setEditingColIdx(idx);
    setEditingColName(columnLabels[idx] || (idx === 0 ? "Main Category" : "Sub Category"));
  };

  const saveEditingColumn = () => {
    if (editingColIdx !== null) {
      const trimmed = editingColName.trim();
      if (trimmed) {
        setColumnLabels((prev) =>
          prev.map((c, i) => (i === editingColIdx ? trimmed : c))
        );
      }
      setEditingColIdx(null);
    }
  };

  const handleAddColumn = () => {
    setColumnLabels((prev) => [...prev, "Sub Category"]);
  };

  const handleRemoveColumn = (colIdxToRemove: number) => {
    if (columnLabels.length <= 1) {
      alert("You must have at least one Category column.");
      return;
    }

    const nodesToDelete = cascadingNodes.filter((n) => n.levelIndex >= colIdxToRemove);
    if (nodesToDelete.length > 0) {
      if (
        !confirm(
          `Removing this column will also delete ${nodesToDelete.length} item(s) in this and subsequent columns. Continue?`
        )
      ) {
        return;
      }
    }

    setCascadingNodes((prev) => prev.filter((n) => n.levelIndex < colIdxToRemove));
    setSelectedPath((prev) => {
      const next = { ...prev };
      for (let k = colIdxToRemove; k < 20; k++) {
        delete next[k];
      }
      return next;
    });

    setColumnLabels((prev) => prev.filter((_, idx) => idx !== colIdxToRemove));
  };

  const handleResetToTemplate = () => {
    if (confirm("Reset to sample Polycab & Finolex catalog tree template?")) {
      setCascadingNodes(DEFAULT_CASCADING_NODES);
      setSelectedPath({ 0: "brand-1", 1: "len-1", 2: "mod-2" });
      setColumnLabels(["Main Category", "Sub Category", "Sub Category", "Sub Category"]);
    }
  };

  const handleClearAllCascading = () => {
    if (confirm("Clear all categories and start with an empty catalog?")) {
      setCascadingNodes([]);
      setSelectedPath({});
      setColumnLabels(["Main Category", "Sub Category", "Sub Category", "Sub Category"]);
    }
  };

  const openCascadingPreview = () => {
    const items = computeCombinationsFromTree(cascadingNodes, nameOrder);
    setCascadingGeneratedList(items);
    setCascadingSearch("");
    setCascadingPriceAdjPercent("");
    setCascadingSaveSuccess(null);
    setCascadingPreviewOpen(true);
  };

  const handleToggleCascadingRow = (id: string) => {
    setCascadingGeneratedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, included: !item.included } : item))
    );
  };

  const handleToggleSelectAllCascading = (check: boolean) => {
    setCascadingGeneratedList((prev) => prev.map((item) => ({ ...item, included: check })));
  };

  const handleUpdateCascadingRowPrice = (id: string, price: number, salePrice?: number) => {
    setCascadingGeneratedList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, price, salePrice: salePrice ?? price } : item
      )
    );
  };

  const handleUpdateCascadingRowName = (id: string, name: string) => {
    setCascadingGeneratedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item))
    );
  };

  const applyCascadingPriceAdjustment = (percentStr: string) => {
    const p = parseFloat(percentStr);
    if (isNaN(p)) return;
    setCascadingGeneratedList((prev) =>
      prev.map((item) => {
        if (!item.included) return item;
        const factor = 1 + p / 100;
        return {
          ...item,
          price: Math.round(item.price * factor),
          salePrice: Math.round(item.salePrice * factor),
        };
      })
    );
  };

  const handleSaveCascadingProductsToCrm = async () => {
    const selected = cascadingGeneratedList.filter((p) => p.included);
    if (selected.length === 0) {
      alert("Please select at least one product to create.");
      return;
    }

    setIsCascadingSaving(true);
    try {
      const payload = selected.map((p) => ({
        name: p.name.trim(),
        category: p.rootCategory || "General",
        price: p.salePrice || p.price,
        basePrice: p.price,
        unit: cascadingUnit || "COILS",
        hsn: cascadingHsn || "8544",
        gst: cascadingGst || "18",
        description: `${p.name} - Premium Quality ISI Certified`,
        specifications: p.hierarchy.map((h, i) => ({ key: `Level ${i + 1}`, value: h })),
      }));

      const res = await fetch("/api/crm/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: payload }),
      });

      const data = await res.json();
      if (data.success) {
        setCascadingSaveSuccess(`Successfully created ${selected.length} individual products in your CRM catalog!`);
        if (onProductsCreated && data.products) {
          onProductsCreated(data.products);
        }
      } else {
        alert(data.error || "Failed to create products.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while creating products.");
    } finally {
      setIsCascadingSaving(false);
    }
  };

  // Keep name synced to compiled name if not manually overridden in single mode
  useEffect(() => {
    if (!isManualName) {
      setName(compiledSingleName);
    }
  }, [compiledSingleName, isManualName]);

  // Load initial product on edit or clone
  useEffect(() => {
    if (initialProduct) {
      let loadedHierarchy: string[] = [];
      if (initialProduct.specifications) {
        try {
          const parsed =
            typeof initialProduct.specifications === "string"
              ? JSON.parse(initialProduct.specifications)
              : initialProduct.specifications;
          if (Array.isArray(parsed?.hierarchy) && parsed.hierarchy.length > 0) {
            loadedHierarchy = [...parsed.hierarchy];
          }
        } catch {
          // ignore
        }
      }

      if (loadedHierarchy.length > 0) {
        while (loadedHierarchy.length < 3) {
          loadedHierarchy.push("");
        }
        setCategories(loadedHierarchy);
        setIsManualName(false);
      } else {
        const cat =
          initialProduct.category && initialProduct.category !== "General"
            ? initialProduct.category
            : "";
        setCategories([cat, "", ""]);
        setIsManualName(true);
      }

      setName(initialProduct.name || "");
      const loadedPrice =
        initialProduct.basePrice !== undefined && initialProduct.basePrice !== null
          ? String(initialProduct.basePrice)
          : initialProduct.price !== undefined
          ? String(initialProduct.price)
          : "";
      setPrice(loadedPrice);
      setGst(
        initialProduct.gst !== undefined && initialProduct.gst !== null
          ? String(initialProduct.gst)
          : ""
      );
      setDescription(initialProduct.description || "");
      setUnit(initialProduct.unit || "");
      setHsn(initialProduct.hsn || "");

      // Prepopulate batch tab with same common details
      setBatchMainCategory(loadedHierarchy[0] || initialProduct.category || "");
      setBatchBasePrice(loadedPrice);
      setBatchUnit(initialProduct.unit || "COILS");
      setBatchHsn(initialProduct.hsn || "");
      setBatchGst(
        initialProduct.gst !== undefined && initialProduct.gst !== null
          ? String(initialProduct.gst)
          : "18"
      );
      setBatchDescription(initialProduct.description || "");

      setActiveTab("single");
    } else {
      setCategories(["", "", ""]);
      setName("");
      setIsManualName(false);
      setPrice("");
      setGst("");
      setDescription("");
      setUnit("");
      setHsn("");
      setActiveTab("single");
    }
    setErrors({});
    setGeneralError("");
    setBatchErrors("");
    setToastMessage(null);
  }, [initialProduct, isOpen]);

  // Single mode category updater
  const updateCategoryLevel = (index: number, val: string) => {
    setCategories((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const addCategoryLevel = () => {
    setCategories((prev) => [...prev, ""]);
  };

  const removeCategoryLevel = (index: number) => {
    setCategories((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ================= BATCH SUB-CATEGORY LEVEL ACTIONS =================
  const addSubCategoryLevel = () => {
    const nextNum = subCategoryLevels.length + 1;
    setSubCategoryLevels((prev) => [
      ...prev,
      {
        id: `lvl-${Date.now()}-${nextNum}`,
        label: `Sub-Category ${nextNum}`,
        values: [],
        inputValue: "",
      },
    ]);
  };

  const removeSubCategoryLevel = (id: string) => {
    setSubCategoryLevels((prev) => prev.filter((lvl) => lvl.id !== id));
  };

  const updateSubCategoryLabel = (id: string, label: string) => {
    setSubCategoryLevels((prev) =>
      prev.map((lvl) => (lvl.id === id ? { ...lvl, label } : lvl))
    );
  };

  const updateSubCategoryInputValue = (id: string, inputValue: string) => {
    setSubCategoryLevels((prev) =>
      prev.map((lvl) => (lvl.id === id ? { ...lvl, inputValue } : lvl))
    );
  };

  const addValuesToSubCategory = (id: string, rawText: string) => {
    const pieces = rawText
      .split(/[,;\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (pieces.length === 0) return;

    setSubCategoryLevels((prev) =>
      prev.map((lvl) => {
        if (lvl.id !== id) return lvl;
        const newValues = [...lvl.values];
        pieces.forEach((p) => {
          if (!newValues.includes(p)) {
            newValues.push(p);
          }
        });
        return { ...lvl, values: newValues, inputValue: "" };
      })
    );
  };

  const removeValueFromSubCategory = (id: string, valToRemove: string) => {
    setSubCategoryLevels((prev) =>
      prev.map((lvl) =>
        lvl.id === id
          ? { ...lvl, values: lvl.values.filter((v) => v !== valToRemove) }
          : lvl
      )
    );
  };

  const moveLevel = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subCategoryLevels.length) return;
    setSubCategoryLevels((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Get all unique values defined in levels preceding levelIndex
  const getAvailableParentValues = (levelIndex: number): string[] => {
    const result: string[] = [];
    for (let i = 0; i < levelIndex; i++) {
      const lvl = subCategoryLevels[i];
      if (lvl && lvl.values) {
        lvl.values.forEach((v) => {
          if (v && !result.includes(v)) {
            result.push(v);
          }
        });
      }
    }
    return result;
  };

  const updateSubCategoryAppliesTo = (id: string, parents: string[]) => {
    setSubCategoryLevels((prev) =>
      prev.map((lvl) => (lvl.id === id ? { ...lvl, appliesToParents: parents } : lvl))
    );
  };

  const toggleSubCategoryParent = (id: string, parentVal: string) => {
    setSubCategoryLevels((prev) =>
      prev.map((lvl) => {
        if (lvl.id !== id) return lvl;
        const current = lvl.appliesToParents || [];
        const exists = current.includes(parentVal);
        const next = exists
          ? current.filter((p) => p !== parentVal)
          : [...current, parentVal];
        return { ...lvl, appliesToParents: next };
      })
    );
  };

  const toggleValueParent = (levelId: string, val: string, parentVal: string) => {
    setSubCategoryLevels((prev) =>
      prev.map((lvl) => {
        if (lvl.id !== levelId) return lvl;
        const currentMap = lvl.valueParentMap || {};
        // If not yet set, default to level-wide parents or all available
        const currentValParents = currentMap[val] || lvl.appliesToParents || [];
        const exists = currentValParents.includes(parentVal);
        const nextValParents = exists
          ? currentValParents.filter((p) => p !== parentVal)
          : [...currentValParents, parentVal];

        return {
          ...lvl,
          valueParentMap: {
            ...currentMap,
            [val]: nextValParents,
          },
        };
      })
    );
  };

  const setValueAllParents = (levelId: string, val: string, allParents: string[]) => {
    setSubCategoryLevels((prev) =>
      prev.map((lvl) => {
        if (lvl.id !== levelId) return lvl;
        const currentMap = lvl.valueParentMap || {};
        const currentValParents = currentMap[val] || [];
        const isAllSelected = currentValParents.length === allParents.length;

        return {
          ...lvl,
          valueParentMap: {
            ...currentMap,
            [val]: isAllSelected ? [] : [...allParents],
          },
        };
      })
    );
  };

  const handleDeleteCombination = (rowId: string) => {
    setRowOverrides((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], excluded: true },
    }));
    showLocalToast("Removed combination from active list.");
  };

  const handleDeleteBranch = (branchRows: BatchCombinationRow[]) => {
    setRowOverrides((prev) => {
      const next = { ...prev };
      branchRows.forEach((r) => {
        next[r.id] = { ...next[r.id], excluded: true };
      });
      return next;
    });
    showLocalToast(`Excluded all ${branchRows.length} combinations in branch.`);
  };

  // ================= DYNAMIC CONDITIONAL COMBINATIONS =================
  const combinations = useMemo<BatchCombinationRow[]>(() => {
    const mainCat = batchMainCategory.trim();
    if (!mainCat) return [];

    // Filter active levels that have at least 1 value
    const activeLevels = subCategoryLevels.filter((lvl) => lvl.values.length > 0);

    if (activeLevels.length === 0) {
      // Just the main category
      const override = rowOverrides[mainCat];
      return [
        {
          id: mainCat,
          name: mainCat,
          hierarchy: [mainCat],
          price: override?.price !== undefined ? override.price : batchBasePrice,
          included: override?.excluded ? false : true,
        },
      ];
    }

    // Build paths dynamically across active levels respecting parent dependencies
    let currentPaths: string[][] = [[mainCat]];

    for (const lvl of activeLevels) {
      const hasParentFilter =
        Array.isArray(lvl.appliesToParents) && lvl.appliesToParents.length > 0;
      const hasValueMap =
        Boolean(lvl.valueParentMap && Object.keys(lvl.valueParentMap).length > 0);

      const nextPaths: string[][] = [];

      for (const path of currentPaths) {
        if (!hasParentFilter && !hasValueMap) {
          // Applies to all paths
          for (const val of lvl.values) {
            nextPaths.push([...path, val]);
          }
        } else {
          // Determine which values in this level are allowed for this path
          const allowedValues: string[] = [];

          for (const val of lvl.values) {
            const specificParents = lvl.valueParentMap?.[val];
            if (Array.isArray(specificParents) && specificParents.length > 0) {
              // Value has its own specific parent assignment
              if (specificParents.some((p) => path.includes(p))) {
                allowedValues.push(val);
              }
            } else if (hasParentFilter) {
              // Level-wide parent filter
              if (lvl.appliesToParents!.some((p) => path.includes(p))) {
                allowedValues.push(val);
              }
            } else {
              allowedValues.push(val);
            }
          }

          if (allowedValues.length > 0) {
            for (const val of allowedValues) {
              nextPaths.push([...path, val]);
            }
          } else {
            // Does NOT match parent filter: bypass / skip this level for this path!
            nextPaths.push(path);
          }
        }
      }

      currentPaths = nextPaths;
    }

    const allPaths = currentPaths;

    return allPaths.map((path) => {
      const rowId = path.join("__");
      const override = rowOverrides[rowId];

      // Format name based on selected order
      let formattedName = "";
      if (nameOrder === "reverse") {
        formattedName = [...path].reverse().join(" ");
      } else {
        formattedName = path.join(" ");
      }

      return {
        id: rowId,
        name: formattedName,
        hierarchy: path,
        price: override?.price !== undefined ? override.price : batchBasePrice,
        included: override?.excluded ? false : true,
      };
    });
  }, [batchMainCategory, subCategoryLevels, nameOrder, batchBasePrice, rowOverrides]);

  const includedCount = combinations.filter((r) => r.included).length;

  // Toggle all combinations inclusion
  const handleToggleSelectAll = () => {
    const allSelected = includedCount === combinations.length;
    const next: Record<string, { price?: string; excluded?: boolean }> = { ...rowOverrides };
    combinations.forEach((r) => {
      next[r.id] = { ...next[r.id], excluded: allSelected };
    });
    setRowOverrides(next);
  };

  // Interface for branch-level grouping
  interface CombinationBranch {
    branchKey: string;
    parentHierarchy: string[];
    branchLabel: string;
    rows: BatchCombinationRow[];
    hasMixedPrices: boolean;
    commonPrice: string;
    allIncluded: boolean;
    someIncluded: boolean;
  }

  // Group combinations by parent sub-category branch (e.g. Length + Grade + Size)
  const branches = useMemo<CombinationBranch[]>(() => {
    if (combinations.length === 0) return [];

    const map = new Map<string, CombinationBranch>();

    combinations.forEach((row) => {
      const parentHierarchy =
        row.hierarchy.length > 2 ? row.hierarchy.slice(0, -1) : [row.hierarchy[0]];
      const branchKey = parentHierarchy.join("__");

      let branch = map.get(branchKey);
      if (!branch) {
        let branchLabel = "";
        if (row.hierarchy.length > 2) {
          const subParts = parentHierarchy.slice(1);
          branchLabel =
            nameOrder === "reverse"
              ? [...subParts].reverse().join(" • ")
              : subParts.join(" • ");
        } else {
          branchLabel = parentHierarchy[0];
        }

        branch = {
          branchKey,
          parentHierarchy,
          branchLabel,
          rows: [],
          hasMixedPrices: false,
          commonPrice: "",
          allIncluded: true,
          someIncluded: false,
        };
        map.set(branchKey, branch);
      }
      branch.rows.push(row);
    });

    return Array.from(map.values()).map((b) => {
      const includedRows = b.rows.filter((r) => r.included);
      const allIncluded = b.rows.length > 0 && includedRows.length === b.rows.length;
      const someIncluded = includedRows.length > 0 && !allIncluded;

      const distinctPrices = Array.from(
        new Set(b.rows.map((r) => String(r.price ?? "").trim()).filter(Boolean))
      );
      const hasMixedPrices = distinctPrices.length > 1;
      const commonPrice =
        distinctPrices.length === 1
          ? distinctPrices[0]
          : distinctPrices.length === 0
          ? batchBasePrice
          : "";

      return {
        ...b,
        hasMixedPrices,
        commonPrice,
        allIncluded,
        someIncluded,
      };
    });
  }, [combinations, subCategoryLevels, nameOrder, batchBasePrice]);

  // Filter combinations based on search query
  const filteredCombinations = useMemo(() => {
    if (!matrixSearch.trim()) return combinations;
    const q = matrixSearch.toLowerCase().trim();
    return combinations.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.hierarchy.some((h) => h.toLowerCase().includes(q))
    );
  }, [combinations, matrixSearch]);

  // Filter branches based on search query
  const filteredBranches = useMemo(() => {
    if (!matrixSearch.trim()) return branches;
    const q = matrixSearch.toLowerCase().trim();
    return branches
      .map((b) => {
        const matchingRows = b.rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.hierarchy.some((h) => h.toLowerCase().includes(q))
        );
        if (matchingRows.length === 0) return null;
        return {
          ...b,
          rows: matchingRows,
        };
      })
      .filter(Boolean) as CombinationBranch[];
  }, [branches, matrixSearch]);

  // Set price for an entire branch of variants
  const handleSetBranchPrice = (branchRows: BatchCombinationRow[], newPrice: string) => {
    setRowOverrides((prev) => {
      const next = { ...prev };
      branchRows.forEach((r) => {
        next[r.id] = { ...next[r.id], price: newPrice };
      });
      return next;
    });
  };

  // Toggle inclusion for an entire branch
  const handleToggleBranchIncluded = (
    branchRows: BatchCombinationRow[],
    targetState: boolean
  ) => {
    setRowOverrides((prev) => {
      const next = { ...prev };
      branchRows.forEach((r) => {
        next[r.id] = { ...next[r.id], excluded: !targetState };
      });
      return next;
    });
  };

  // Toggle individual branch expansion
  const toggleBranchExpanded = (branchKey: string) => {
    setExpandedBranches((prev) => ({
      ...prev,
      [branchKey]: !prev[branchKey],
    }));
  };

  // Expand or collapse all branches
  const handleExpandAllBranches = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    branches.forEach((b) => {
      next[b.branchKey] = expand;
    });
    setExpandedBranches(next);
  };

  // Apply bulk price to filtered combinations
  const handleApplyBulkFilteredPrice = () => {
    if (!bulkFilteredPrice || isNaN(Number(bulkFilteredPrice)) || Number(bulkFilteredPrice) < 0) {
      showLocalToast("Please enter a valid rate to apply.");
      return;
    }
    setRowOverrides((prev) => {
      const next = { ...prev };
      filteredCombinations.forEach((r) => {
        next[r.id] = { ...next[r.id], price: bulkFilteredPrice };
      });
      return next;
    });
    showLocalToast(`Updated ${filteredCombinations.length} combinations to ₹${bulkFilteredPrice}`);
  };

  // Include/exclude all filtered items
  const handleIncludeAllFiltered = (include: boolean) => {
    setRowOverrides((prev) => {
      const next = { ...prev };
      filteredCombinations.forEach((r) => {
        next[r.id] = { ...next[r.id], excluded: !include };
      });
      return next;
    });
  };

  // Reset all overrides to default base price
  const handleResetAllToBasePrice = () => {
    setRowOverrides((prev) => {
      const next: Record<string, { price?: string; excluded?: boolean }> = {};
      Object.keys(prev).forEach((key) => {
        if (prev[key]?.excluded !== undefined) {
          next[key] = { excluded: prev[key].excluded };
        }
      });
      return next;
    });
    showLocalToast(`All prices reset to Default Base Rate (₹${batchBasePrice || "0"})`);
  };

  // Quick price by subcategory level
  const handleApplyLevelPrices = () => {
    const activeLevels = subCategoryLevels.filter((lvl) => lvl.values.length > 0);
    const activeLevelIdx = activeLevels.findIndex((lvl) => lvl.id === selectedPricingLevelId);
    if (activeLevelIdx === -1) {
      showLocalToast("Please select a sub-category level first.");
      return;
    }

    const hierIdx = activeLevelIdx + 1; // 0 is main category
    let countUpdated = 0;

    setRowOverrides((prev) => {
      const next = { ...prev };
      combinations.forEach((r) => {
        const val = r.hierarchy[hierIdx];
        if (val && levelPricesInput[val] !== undefined && levelPricesInput[val].trim() !== "") {
          next[r.id] = { ...next[r.id], price: levelPricesInput[val].trim() };
          countUpdated++;
        }
      });
      return next;
    });

    const targetLevel = activeLevels[activeLevelIdx];
    showLocalToast(`Applied rates across ${countUpdated} combinations based on ${targetLevel.label}!`);
  };

  if (!isOpen) return null;

  // ================= SUBMIT SINGLE PRODUCT =================
  const handleSingleSubmit = async (keepCommonDetails: boolean = false) => {
    const newErrors: { name?: string; price?: string } = {};

    const finalName = name.trim() || compiledSingleName.trim();
    if (!finalName) {
      newErrors.name = "Main Category is required to build product name";
    }

    if (!price || String(price).trim() === "") {
      newErrors.price = "Price is required";
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = "Please enter a valid price";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setGeneralError("");
    if (keepCommonDetails) {
      setIsSavingSimilar(true);
    } else {
      setLoading(true);
    }

    try {
      const url = "/api/crm/products";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        name: finalName,
        category: categories[0]?.trim() || "General",
        specifications: {
          hierarchy: categories.map((c) => c.trim()).filter(Boolean),
          nameOrder,
          notes: description.trim(),
        },
        price: parseFloat(price),
        gst: gst.trim() !== "" ? parseFloat(gst) : null,
        description: description.trim() || null,
        unit: unit.trim() || null,
        hsn: hsn.trim() || null,
      };
      if (isEditing && initialProduct?.id) {
        payload.id = initialProduct.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.product) {
        if (isEditing) {
          if (onProductSaved) onProductSaved(data.product);
          onClose();
        } else {
          if (onProductCreated) onProductCreated(data.product);

          if (keepCommonDetails) {
            // Keep Brand, Sub-Category 1, GST, Unit, HSN, Description intact
            setCategories((prev) => [prev[0] || "", prev[1] || "", ""]);
            setPrice("");
            setName("");
            setIsManualName(false);
            showLocalToast(`Added "${data.product.name}"! Common details kept.`);
          } else {
            onClose();
          }
        }
      } else {
        if (data.field === "name") {
          setErrors((prev) => ({ ...prev, name: data.error }));
        } else if (data.field === "price") {
          setErrors((prev) => ({ ...prev, price: data.error }));
        } else {
          setGeneralError(data.error || "Failed to save product.");
        }
      }
    } catch (err: any) {
      setGeneralError(err.message || "Failed to save product.");
    } finally {
      setLoading(false);
      setIsSavingSimilar(false);
    }
  };

  // ================= SUBMIT BATCH PRODUCTS =================
  const handleBatchSubmit = async () => {
    setBatchErrors("");

    if (!batchMainCategory.trim()) {
      setBatchErrors("Main Category (Brand) is required for all combinations.");
      return;
    }

    const activeRows = combinations.filter((r) => r.included);
    if (activeRows.length === 0) {
      setBatchErrors("Please include at least one combination to create.");
      return;
    }

    // Validate that all included rows have a valid price
    for (const r of activeRows) {
      if (!r.price || isNaN(Number(r.price)) || Number(r.price) < 0) {
        setBatchErrors(
          `Please enter a valid price for "${r.name}" or set a Default Base Price above.`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const parsedGst = batchGst.trim() !== "" ? parseFloat(batchGst) : null;

      const productsPayload = activeRows.map((r) => ({
        name: r.name,
        category: batchMainCategory.trim() || "General",
        price: parseFloat(r.price),
        gst: parsedGst,
        unit: batchUnit.trim() || null,
        hsn: batchHsn.trim() || null,
        description: batchDescription.trim() || null,
        specifications: {
          hierarchy: r.hierarchy,
          nameOrder,
          notes: batchDescription.trim(),
        },
      }));

      const res = await fetch("/api/crm/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: productsPayload }),
      });

      const data = await res.json();
      if (data.success && data.products) {
        if (onProductsCreated) {
          onProductsCreated(data.products);
        } else if (onProductCreated) {
          data.products.forEach((p: any) => onProductCreated(p));
        }
        onClose();
      } else {
        setBatchErrors(data.error || "Failed to create products.");
      }
    } catch (err: any) {
      setBatchErrors(err.message || "Network error while saving products.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col overflow-y-auto font-inter text-gray-900 animate-in fade-in duration-150">
      {/* Full-Screen Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-gray-500 hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer mr-1"
                title="Back / Close"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                  {isEditing ? "Edit Product" : "Add Products to Catalog"}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  {isEditing
                    ? "Update catalog product specifications"
                    : activeTab === "batch"
                    ? "Create unlimited hierarchical sub-categories and auto-generate all combinations"
                    : "Add single product or save and repeat with shared common details"}
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center space-x-2">
              {activeTab === "single" ? (
                <>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleSingleSubmit(true)}
                      disabled={loading || isSavingSimilar}
                      className="hidden sm:inline-flex px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-brand border border-blue-200 rounded-xl text-xs font-bold transition-all items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      title="Saves this item and keeps Brand, Sub-Category, GST, HSN & Unit for the next one"
                    >
                      {isSavingSimilar ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Copy size={14} />
                      )}
                      <span>Save & Add Similar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSingleSubmit(false)}
                    disabled={loading || isSavingSimilar}
                    className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>{isEditing ? "Update Product" : "Save Product"}</span>
                      </>
                    )}
                  </button>
                </>
              ) : activeTab === "cascading" ? (
                <button
                  type="button"
                  onClick={openCascadingPreview}
                  disabled={activeCascadingCombinations.length === 0}
                  className="px-5 py-2.5 bg-[#FF9800] hover:bg-[#F57C00] text-white rounded-xl text-xs font-black shadow-md shadow-[#FF9800]/20 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles size={15} />
                  <span>Generate All ({activeCascadingCombinations.length}) Products</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBatchSubmit}
                  disabled={loading || includedCount === 0}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Create All ({includedCount}) Products</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 ${activeTab === "cascading" ? "max-w-7xl" : "max-w-4xl"}`}>
        {/* Toast feedback */}
        {toastMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tab Switcher (Only in create mode) */}
        {!isEditing && (
          <div className="bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap sm:flex-nowrap items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === "single"
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Package size={15} />
              <span>Single Product</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cascading")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer relative ${
                activeTab === "cascading"
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Layers size={15} className="text-[#FF9800]" />
              <span>Cascading Multi-Column Builder</span>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  activeTab === "cascading"
                    ? "bg-[#FF9800] text-white"
                    : "bg-amber-50 text-[#FF9800] border border-amber-200"
                }`}
              >
                Recommended
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("batch")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer relative ${
                activeTab === "batch"
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Sparkles size={14} className="text-gray-400" />
              <span>Tags List Form</span>
            </button>
          </div>
        )}

        {/* Global Name Order Selector Bar */}
        <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal size={15} className="text-brand" />
            <span className="text-xs font-bold text-gray-700">Product Name Display Order:</span>
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setNameOrder("forward")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                nameOrder === "forward"
                  ? "bg-white text-brand shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="Main Category -> Sub 1 -> Sub 2 -> Sub 3..."
            >
              Forward: Finolex Wires 180mts Fr 1.0 sqmm Red
            </button>
            <button
              type="button"
              onClick={() => setNameOrder("reverse")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                nameOrder === "reverse"
                  ? "bg-white text-brand shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="...Sub 3 -> Sub 2 -> Sub 1 -> Main Category"
            >
              Reverse: Red 1.0 sqmm Fr 180mts Wires Finolex
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ==================== TAB 1: SINGLE PRODUCT FORM ========================= */}
        {/* ========================================================================= */}
        {activeTab === "single" && (
          <div className="space-y-6">
            {generalError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{generalError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSingleSubmit(false);
              }}
              className="space-y-6"
            >
              {/* Card 1: Category Hierarchy */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                      <Layers size={14} className="text-brand" />
                      <span>Category Hierarchy (Unlimited Levels)</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Add any number of sub-categories (Type, Length, Grade, Size, Color, etc.).
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand border border-blue-100 uppercase tracking-wider">
                    Electrical Trade
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Level 1: Main Category (a) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>
                        Main Category (a - Brand / Manufacturer) <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">e.g. FINOLEX, POLYCAB, HAVELLS</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={categories[0] || ""}
                        onChange={(e) => updateCategoryLevel(0, e.target.value)}
                        placeholder="e.g. FINOLEX, POLYCAB, HAVELLS"
                        className={`w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                          errors.name
                            ? "border border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
                            : "border border-gray-200 focus:ring-brand/30 focus:border-brand"
                        }`}
                      />
                      <Package
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-rose-600 font-medium mt-1 pl-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Level 2: Sub-Category (b) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>Sub-Category (b - Product Group)</span>
                      <span className="text-[10px] text-gray-400 font-normal">e.g. WIRES, CABLES, PIPES, SWITCHES</span>
                    </label>
                    <input
                      type="text"
                      value={categories[1] || ""}
                      onChange={(e) => updateCategoryLevel(1, e.target.value)}
                      placeholder="e.g. WIRES, CABLES, PIPES, SWITCHES"
                      className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </div>

                  {/* Dynamic Further Sub-Categories */}
                  {categories.slice(2).map((cat, idx) => {
                    const realIdx = idx + 2;
                    const letter = String.fromCharCode(99 + idx); // c, d, e...
                    return (
                      <div key={realIdx} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Sub-Category ({letter} - Level {realIdx + 1})
                          </label>
                          <input
                            type="text"
                            value={cat}
                            onChange={(e) => updateCategoryLevel(realIdx, e.target.value)}
                            placeholder={`e.g. 180 MTS, FR, 1.0 SQ MM, RED (Level ${letter})`}
                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCategoryLevel(realIdx)}
                          className="mt-5 p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Remove Level"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add Sub-Category Button */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={addCategoryLevel}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-brand hover:text-brand-hover bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>+ Add Sub-Category Level</span>
                    </button>
                  </div>

                  {/* Live Compiled Preview Box */}
                  <div className="mt-3 p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <span>Compiled Document Display Name ({nameOrder} order)</span>
                      <span className="text-brand font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {compiledSingleName ? "Auto-Compiled" : "Awaiting Input"}
                      </span>
                    </div>
                    <div className="text-sm font-black text-gray-900 tracking-tight break-words">
                      {compiledSingleName || (
                        <span className="text-gray-400 font-normal italic text-xs">
                          e.g. {nameOrder === "forward" ? "FINOLEX WIRES 180MTS FR 1.0 SQMM RED" : "RED 1.0 SQMM FR 180MTS WIRES FINOLEX"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Manual Name Fine-Tune Expander */}
                  <div className="pt-1">
                    <details className="group">
                      <summary className="text-[11px] font-bold text-gray-500 hover:text-brand cursor-pointer select-none">
                        ▸ Fine-tune compiled product name manually
                      </summary>
                      <div className="pt-2 space-y-1.5">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setIsManualName(true);
                          }}
                          placeholder="Product name"
                          className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-semibold text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                        />
                        {isManualName && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualName(false);
                              setName(compiledSingleName);
                            }}
                            className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
                          >
                            Reset to auto-compiled name ({compiledSingleName})
                          </button>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              </div>

              {/* Card 2: Pricing & GST */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2.5">
                  Pricing & Tax
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Base Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
                      }}
                      placeholder="0.00"
                      className={`w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                        errors.price
                          ? "border border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
                          : "border border-gray-200 focus:ring-brand/30 focus:border-brand"
                      }`}
                    />
                    {errors.price && (
                      <p className="text-xs text-rose-600 font-medium mt-1 pl-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errors.price}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">GST Rate (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={gst}
                        onChange={(e) => setGst(e.target.value)}
                        placeholder="18"
                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Classification & Unit */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2.5">
                  Classification & Measurement
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Unit of Measure
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. COILS, METERS, PCS, SET"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm uppercase text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">HSN / SAC Code</label>
                    <input
                      type="text"
                      value={hsn}
                      onChange={(e) => setHsn(e.target.value)}
                      placeholder="e.g. 8544"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">Specifications / Description</label>
                    <span className="text-[11px] text-gray-400 font-medium">{description.length}/2000</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Technical specifications, grade, manufacturer remarks..."
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none"
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-12">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleSingleSubmit(true)}
                      disabled={loading || isSavingSimilar}
                      className="flex-1 sm:flex-initial px-5 py-3.5 bg-blue-50 hover:bg-blue-100 text-brand border border-blue-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingSimilar ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Copy size={15} />
                      )}
                      <span>Save & Add Similar</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={loading || isSavingSimilar}
                    className="flex-1 sm:flex-initial px-7 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>{isEditing ? "Update Product" : "Save Product"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ==================== TAB 2: CASCADING MULTI-COLUMN BUILDER ============== */}
        {/* ========================================================================= */}
        {activeTab === "cascading" && (
          <div className="space-y-6">
            {/* Top Config & Actions Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#0D47A1] flex items-center gap-2">
                    <Layers className="text-[#FF9800]" size={20} />
                    Cascading Multi-Column Category Builder
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    1. Click <span className="font-bold text-[#FF9800]">+</span> to add items in any column.
                    2. Select an item in any column to drill down and add its sub-categories in the next column.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToTemplate}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Reset to Polycab & Finolex sample tree"
                  >
                    <RefreshCw size={13} />
                    <span>Sample Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAllCascading}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Clear tree to start fresh"
                  >
                    <Trash2 size={13} />
                    <span>Clear All</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="px-3.5 py-2 bg-[#0D47A1]/10 hover:bg-[#0D47A1]/20 text-[#0D47A1] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Level Column</span>
                  </button>

                  <button
                    type="button"
                    onClick={openCascadingPreview}
                    disabled={activeCascadingCombinations.length === 0}
                    className="px-5 py-2.5 bg-[#FF9800] hover:bg-[#F57C00] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md shadow-[#FF9800]/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles size={15} />
                    <span>Generate Individual Products ({activeCascadingCombinations.length})</span>
                  </button>
                </div>
              </div>

              {/* Breadcrumb drill-down bar */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 text-xs">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Active Drill-down:</span>
                {columnLabels.map((lbl, idx) => {
                  const selectedId = selectedPath[idx];
                  const selectedNode = cascadingNodes.find((n) => n.id === selectedId);
                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && <ChevronRight size={12} className="text-gray-300" />}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          selectedNode
                            ? "bg-[#0D47A1]/10 text-[#0D47A1] border border-[#0D47A1]/20"
                            : "bg-gray-100 text-gray-400 border border-gray-200"
                        }`}
                      >
                        {selectedNode ? selectedNode.name : (idx === 0 ? "Main Category" : "Sub Category")}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Interactive Hierarchy Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
              {columnLabels.map((colTitle, colIdx) => {
                let nodesInColumn: CascadingNode[] = [];
                let parentNode: CascadingNode | null = null;
                let parentIsSelected = true;

                if (colIdx === 0) {
                  nodesInColumn = cascadingNodes.filter((n) => n.parentId === null || n.levelIndex === 0);
                } else {
                  const parentSelectedId = selectedPath[colIdx - 1];
                  parentNode = cascadingNodes.find((n) => n.id === parentSelectedId) || null;
                  if (parentSelectedId) {
                    nodesInColumn = cascadingNodes.filter((n) => n.parentId === parentSelectedId);
                  } else {
                    parentIsSelected = false;
                  }
                }

                const selectedNodeId = selectedPath[colIdx];

                return (
                  <div
                    key={colIdx}
                    className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 space-y-4 min-h-[460px] flex flex-col"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="min-w-0 pr-2 flex-1">
                        {editingColIdx === colIdx ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingColName}
                              onChange={(e) => setEditingColName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditingColumn();
                                if (e.key === "Escape") setEditingColIdx(null);
                              }}
                              className="w-full px-2 py-0.5 text-xs font-bold text-[#0D47A1] bg-gray-50 border border-[#0D47A1] rounded focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={saveEditingColumn}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                              title="Save column title"
                            >
                              <Check size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group">
                            <h3 className="text-xs font-black uppercase tracking-wider text-[#0D47A1] flex items-center gap-1.5 truncate">
                              {colIdx === 0 ? (
                                <Layers size={15} className="text-[#FF9800] shrink-0" />
                              ) : (
                                <Tag size={15} className="text-[#FF9800] shrink-0" />
                              )}
                              <span className="truncate">{colTitle}</span>
                              <span className="text-gray-400 text-[11px] font-bold">({nodesInColumn.length})</span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => startEditingColumn(colIdx)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#0D47A1] p-0.5 transition-opacity cursor-pointer"
                              title="Rename column"
                            >
                              <Pencil size={11} />
                            </button>
                          </div>
                        )}
                        {colIdx > 0 && parentNode && (
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">under {parentNode.name}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {colIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(colIdx)}
                            className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={`Remove this ${colTitle} column`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openAddNodeModal(colIdx)}
                          disabled={!parentIsSelected && colIdx > 0}
                          className="p-1.5 bg-[#FF9800] hover:bg-[#F57C00] disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
                          title={`Add item to ${colTitle}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Column Content */}
                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] pr-1">
                      {!parentIsSelected && colIdx > 0 ? (
                        <div className="py-16 text-center space-y-2 text-gray-400">
                          <p className="text-xs font-bold">Select an item in Column {colIdx} first</p>
                          <p className="text-[11px] opacity-70">
                            Sub-categories in this column belong to the selected parent.
                          </p>
                        </div>
                      ) : nodesInColumn.length === 0 ? (
                        <div className="py-16 text-center space-y-2 text-gray-400">
                          <p className="text-xs font-bold">No items added yet</p>
                          <p className="text-[11px] opacity-70">
                            Click <span className="font-bold text-[#FF9800]">+</span> above to add an item.
                          </p>
                        </div>
                      ) : (
                        nodesInColumn.map((item) => {
                          const isSelected = selectedNodeId === item.id;
                          const hasPrice = item.price !== undefined || item.salePrice !== undefined;
                          const hasColors = item.colors && item.colors.length > 0;

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectCascadingNode(colIdx, item.id)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                                isSelected
                                  ? "border-[#0D47A1] bg-[#0D47A1]/5 shadow-sm"
                                  : "border-gray-100 hover:border-gray-300 bg-gray-50/40"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#0D47A1] truncate">
                                  {item.name}
                                </span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditNodeModal(item);
                                    }}
                                    className="text-gray-300 hover:text-[#0D47A1] p-1"
                                    title="Edit item"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNode(item.id);
                                    }}
                                    className="text-gray-300 hover:text-red-500 p-1"
                                    title="Delete item"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                  <ChevronRight
                                    size={14}
                                    className={isSelected ? "text-[#0D47A1]" : "text-gray-400"}
                                  />
                                </div>
                              </div>

                              {/* Pricing Display if configured */}
                              {hasPrice && (
                                <div className="flex items-center gap-2 text-xs font-bold text-[#0D47A1]">
                                  <span>₹{item.salePrice || item.price}</span>
                                  {item.salePrice && item.price && item.salePrice !== item.price && (
                                    <span className="text-[10px] text-gray-400 line-through">
                                      ₹{item.price}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Colors display if configured */}
                              {hasColors && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {item.colors!.map((c, cIdx) => {
                                    const style = getCrmColorStyles(c);
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
                                        {c}
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
        )}

        {/* ========================================================================= */}
        {/* ==================== TAB 3: TAGS FORM GENERATOR (LEGACY) ================= */}
        {/* ========================================================================= */}
        {activeTab === "batch" && (
          <div className="space-y-6">
            {batchErrors && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{batchErrors}</span>
              </div>
            )}

            {/* Step 1: Shared Common Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <SlidersHorizontal size={14} className="text-brand" />
                    <span>1. Common Details (Shared by All Generated Products)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Entered once. All combinations generated from the hierarchy will inherit these values.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                  Inherited
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Main Category (Brand) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Main Category (Brand / Group) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={batchMainCategory}
                    onChange={(e) => setBatchMainCategory(e.target.value)}
                    placeholder="e.g. Finolex, Polycab, Havells"
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                </div>

                {/* Default Base Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Default Base Rate (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={batchBasePrice}
                      onChange={(e) => setBatchBasePrice(e.target.value)}
                      placeholder="e.g. 1200"
                      className="w-full pl-6 pr-3 py-2.5 bg-gray-50 rounded-xl text-sm font-semibold text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                      ₹
                    </span>
                  </div>
                </div>

                {/* Common Unit */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Common Unit of Measure
                  </label>
                  <input
                    type="text"
                    value={batchUnit}
                    onChange={(e) => setBatchUnit(e.target.value)}
                    placeholder="e.g. COILS, METERS, PCS"
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm uppercase text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                </div>

                {/* Common HSN */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Common HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    value={batchHsn}
                    onChange={(e) => setBatchHsn(e.target.value)}
                    placeholder="e.g. 8544"
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                </div>

                {/* Common GST */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Common GST Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={batchGst}
                      onChange={(e) => setBatchGst(e.target.value)}
                      placeholder="18"
                      className="w-full px-4 py-2.5 pr-10 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                {/* Common Description */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Common Specifications / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={batchDescription}
                    onChange={(e) => setBatchDescription(e.target.value)}
                    placeholder="e.g. FR PVC Insulated Copper Flexible 1100V"
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Unlimited Sub-Category Levels */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <Layers size={14} className="text-brand" />
                    <span>2. Hierarchical Sub-Categories (Add as many levels as needed)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Each level can have multiple values (comma-separated or press Enter). Combinations are generated across all levels.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addSubCategoryLevel}
                  className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand/5 hover:bg-brand/10 text-brand text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Add Sub-Category Level</span>
                </button>
              </div>

              {/* Levels Container */}
              <div className="space-y-4">
                {subCategoryLevels.map((lvl, index) => (
                  <div
                    key={lvl.id}
                    className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={lvl.label}
                          onChange={(e) => updateSubCategoryLabel(lvl.id, e.target.value)}
                          className="text-xs font-bold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-brand focus:outline-none px-1 py-0.5"
                          placeholder={`Sub-Category ${index + 1} Name`}
                        />
                        <span className="text-[10px] text-gray-400 font-medium">
                          ({lvl.values.length} values)
                        </span>
                      </div>

                      {/* Reorder and Delete Controls */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => moveLevel(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                          title="Move Level Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLevel(index, "down")}
                          disabled={index === subCategoryLevels.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                          title="Move Level Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSubCategoryLevel(lvl.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer ml-1"
                          title="Delete Level"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Tag / Chip Input for this level */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={lvl.inputValue}
                          onChange={(e) => updateSubCategoryInputValue(lvl.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addValuesToSubCategory(lvl.id, lvl.inputValue);
                            }
                          }}
                          placeholder={`Type values separated by comma or press Enter (e.g. 180 mts, 90 mts)`}
                          className="flex-1 px-3.5 py-2 bg-white rounded-xl text-xs font-medium text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                        />
                        <button
                          type="button"
                          onClick={() => addValuesToSubCategory(lvl.id, lvl.inputValue)}
                          className="px-3.5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Add Values
                        </button>
                      </div>

                      {/* Display Values as Chips */}
                      {lvl.values.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {lvl.values.map((val) => (
                            <span
                              key={val}
                              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-800 rounded-xl text-xs font-semibold shadow-xs"
                            >
                              <span>{val}</span>
                              <button
                                type="button"
                                onClick={() => removeValueFromSubCategory(lvl.id, val)}
                                className="text-gray-400 hover:text-rose-600 cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Branch Dependency (Applies to) */}
                    {index > 0 &&
                      (() => {
                        const parentValues = getAvailableParentValues(index);
                        if (parentValues.length === 0) return null;

                        const hasLevelFilter =
                          Array.isArray(lvl.appliesToParents) && lvl.appliesToParents.length > 0;
                        const hasValueMap = Boolean(
                          lvl.valueParentMap && Object.keys(lvl.valueParentMap).length > 0
                        );
                        const isPerValueMode = lvl.mappingMode === "per_value";
                        const isSpecificParentActive =
                          hasLevelFilter || isPerValueMode || hasValueMap;

                        return (
                          <div className="pt-2.5 border-t border-gray-200/60 mt-1 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <GitBranch size={13} className="text-brand" />
                                <span className="text-xs font-bold text-gray-700">Applies to:</span>
                                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSubCategoryLevels((prev) =>
                                        prev.map((l) =>
                                          l.id === lvl.id
                                            ? {
                                                ...l,
                                                appliesToParents: [],
                                                valueParentMap: {},
                                                mappingMode: "level",
                                              }
                                            : l
                                        )
                                      );
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                      !isSpecificParentActive
                                        ? "bg-brand text-white shadow-xs"
                                        : "text-gray-600 hover:text-gray-900"
                                    }`}
                                  >
                                    All Products
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isSpecificParentActive && parentValues.length > 0) {
                                        updateSubCategoryAppliesTo(lvl.id, [parentValues[0]]);
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                      isSpecificParentActive
                                        ? "bg-brand text-white shadow-xs"
                                        : "text-gray-600 hover:text-gray-900"
                                    }`}
                                  >
                                    Specific Parent Only
                                  </button>
                                </div>
                              </div>

                              {isSpecificParentActive && (
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSubCategoryLevels((prev) =>
                                          prev.map((l) =>
                                            l.id === lvl.id ? { ...l, mappingMode: "level" } : l
                                          )
                                        )
                                      }
                                      className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                                        !isPerValueMode
                                          ? "bg-white text-brand shadow-2xs"
                                          : "text-gray-500 hover:text-gray-800"
                                      }`}
                                    >
                                      Whole Level
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSubCategoryLevels((prev) =>
                                          prev.map((l) => {
                                            if (l.id !== lvl.id) return l;
                                            const map = { ...(l.valueParentMap || {}) };
                                            l.values.forEach((v) => {
                                              if (!map[v]) {
                                                map[v] =
                                                  l.appliesToParents && l.appliesToParents.length > 0
                                                    ? [...l.appliesToParents]
                                                    : [...parentValues];
                                              }
                                            });
                                            return {
                                              ...l,
                                              mappingMode: "per_value",
                                              valueParentMap: map,
                                            };
                                          })
                                        );
                                      }}
                                      className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                                        isPerValueMode
                                          ? "bg-white text-brand shadow-2xs"
                                          : "text-gray-500 hover:text-gray-800"
                                      }`}
                                      title="Set different parents for different values (e.g. 90 mts for Wires only, 180 mts for both)"
                                    >
                                      Assign Per Value (Advanced)
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Option A: Whole Level Parent Chips */}
                            {isSpecificParentActive && !isPerValueMode && (
                              <div className="p-3 bg-white rounded-xl border border-blue-100/80 shadow-2xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-gray-700">
                                    Select parent specification(s) where this level applies:
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    Other products will bypass this level
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {parentValues.map((pval) => {
                                    const isSelected = lvl.appliesToParents?.includes(pval);
                                    return (
                                      <button
                                        key={pval}
                                        type="button"
                                        onClick={() => toggleSubCategoryParent(lvl.id, pval)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                                          isSelected
                                            ? "bg-blue-50 border-brand text-brand shadow-xs"
                                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                        }`}
                                      >
                                        {isSelected ? (
                                          <Check size={12} className="text-brand" />
                                        ) : (
                                          <Square size={12} className="text-gray-400" />
                                        )}
                                        <span>{pval}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Option B: Per-Value Parent Assignment */}
                            {isSpecificParentActive && isPerValueMode && (
                              <div className="p-3 bg-white rounded-xl border border-blue-100/80 shadow-2xs space-y-2.5">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                  <div>
                                    <p className="text-[11px] font-bold text-gray-800">
                                      Per-Value Parent Assignment
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                      Check which parents each value belongs to (e.g. 90 mts for Wires only, 180 mts for both).
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {lvl.values.map((val) => {
                                    const assigned =
                                      lvl.valueParentMap?.[val] ||
                                      lvl.appliesToParents ||
                                      parentValues;

                                    return (
                                      <div
                                        key={val}
                                        className="p-2 bg-gray-50/70 rounded-xl border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-black text-gray-900 shadow-2xs">
                                            {val}
                                          </span>
                                          <span className="text-[10px] text-gray-400 font-medium">
                                            applies to:
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {parentValues.map((pval) => {
                                            const isChecked = assigned.includes(pval);
                                            return (
                                              <button
                                                key={pval}
                                                type="button"
                                                onClick={() =>
                                                  toggleValueParent(lvl.id, val, pval)
                                                }
                                                className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                                                  isChecked
                                                    ? "bg-blue-50 border-brand text-brand shadow-2xs"
                                                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"
                                                }`}
                                              >
                                                {isChecked ? (
                                                  <Check size={11} className="text-brand" />
                                                ) : (
                                                  <Square size={11} className="text-gray-300" />
                                                )}
                                                <span>{pval}</span>
                                              </button>
                                            );
                                          })}

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setValueAllParents(lvl.id, val, parentValues)
                                            }
                                            className="px-1.5 py-0.5 text-[10px] font-bold text-gray-400 hover:text-brand underline cursor-pointer ml-1"
                                          >
                                            {assigned.length === parentValues.length
                                              ? "Clear"
                                              : "All"}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                ))}

                {/* Add Another Level Button */}
                <button
                  type="button"
                  onClick={addSubCategoryLevel}
                  className="w-full py-3 border-2 border-dashed border-gray-200 hover:border-brand hover:bg-brand/5 text-gray-600 hover:text-brand rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>+ Add Another Sub-Category Level</span>
                </button>
              </div>
            </div>

            {/* Step 3: Generated Combinations Matrix Table & Sub-Category Pricing */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand" />
                    <span>3. Generated Combinations & Sub-Category Pricing ({includedCount} Active)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    All permutations from the tree above. Set rates by branch, by sub-category level, or per combination. Order:{" "}
                    <strong className="text-brand font-black">
                      {nameOrder === "forward"
                        ? "Forward (Main Category → Sub-Categories)"
                        : "Reverse (Sub-Categories → Main Category)"}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-bold text-gray-600 hover:text-brand flex items-center space-x-1 py-1 px-2.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {includedCount === combinations.length ? (
                      <>
                        <CheckSquare size={14} className="text-brand" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square size={14} />
                        <span>Select All</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAllToBasePrice}
                    className="text-xs font-bold text-gray-500 hover:text-rose-600 flex items-center space-x-1 py-1 px-2.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title={`Reset all custom rates back to Default Base Rate (₹${batchBasePrice || "0"})`}
                  >
                    <RotateCcw size={13} />
                    <span>Reset to Base Rate</span>
                  </button>
                </div>
              </div>

              {/* Collapsible: Quick Level-Based Pricing Drawer */}
              {combinations.length > 0 && subCategoryLevels.some((l) => l.values.length > 0) && (
                <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => setShowLevelPricingDrawer(!showLevelPricingDrawer)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-blue-100/40 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Tag size={15} className="text-brand" />
                      <span className="text-xs font-bold text-gray-800">
                        ⚡ Quick Price by Sub-Category Level (e.g. Size, Length, or Grade)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand text-white">
                        Fast Rate Setup
                      </span>
                    </div>
                    {showLevelPricingDrawer ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                  </button>

                  {showLevelPricingDrawer && (
                    <div className="p-4 pt-1 border-t border-blue-100/80 space-y-3 bg-white/70">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <label className="text-xs font-bold text-gray-700">
                            Apply prices based on:
                          </label>
                          <select
                            value={selectedPricingLevelId}
                            onChange={(e) => setSelectedPricingLevelId(e.target.value)}
                            className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-brand border border-blue-200 focus:outline-none focus:ring-2 focus:ring-brand/30"
                          >
                            {subCategoryLevels
                              .filter((lvl) => lvl.values.length > 0)
                              .map((lvl) => (
                                <option key={lvl.id} value={lvl.id}>
                                  {lvl.label} ({lvl.values.length} values)
                                </option>
                              ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={handleApplyLevelPrices}
                          className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Apply Level Rates to Matching Combinations</span>
                        </button>
                      </div>

                      {/* Inputs for each value of selected level */}
                      {(() => {
                        const targetLevel =
                          subCategoryLevels.find((lvl) => lvl.id === selectedPricingLevelId) ||
                          subCategoryLevels.find((lvl) => lvl.values.length > 0);
                        if (!targetLevel || targetLevel.values.length === 0) return null;

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                            {targetLevel.values.map((val) => (
                              <div
                                key={val}
                                className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-xs"
                              >
                                <span className="text-xs font-bold text-gray-800 truncate pr-2">
                                  {val}
                                </span>
                                <div className="relative w-28 shrink-0">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={levelPricesInput[val] ?? ""}
                                    onChange={(e) =>
                                      setLevelPricesInput((prev) => ({
                                        ...prev,
                                        [val]: e.target.value,
                                      }))
                                    }
                                    placeholder="Rate"
                                    className="w-full pl-5 pr-2 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand"
                                  />
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                                    ₹
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Search Filter & Bulk Action Bar */}
              {combinations.length > 0 && (
                <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      placeholder="Filter combinations (e.g. 180 mts, frls, 1.0 sqmm, red)..."
                      className="w-full pl-9 pr-8 py-2 bg-white rounded-xl text-xs font-medium text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    />
                    {matrixSearch && (
                      <button
                        type="button"
                        onClick={() => setMatrixSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Bulk Rate for Filtered Items */}
                  <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap gap-y-2">
                    <div className="relative w-28">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={bulkFilteredPrice}
                        onChange={(e) => setBulkFilteredPrice(e.target.value)}
                        placeholder="Bulk Rate"
                        className="w-full pl-5 pr-2 py-1.5 bg-white rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand shadow-xs"
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                        ₹
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyBulkFilteredPrice}
                      disabled={filteredCombinations.length === 0}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                      title="Apply this rate to all filtered/visible combinations"
                    >
                      Set for Filtered ({filteredCombinations.length})
                    </button>

                    {matrixSearch && (
                      <div className="flex items-center space-x-1 pl-1 border-l border-gray-300">
                        <button
                          type="button"
                          onClick={() => handleIncludeAllFiltered(true)}
                          className="px-2 py-1 bg-white hover:bg-gray-100 text-brand border border-gray-200 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Include Visible
                        </button>
                        <button
                          type="button"
                          onClick={() => handleIncludeAllFiltered(false)}
                          className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Exclude Visible
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View Mode Controls: Grouped by Branch vs Flat List */}
              {combinations.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-gray-100 p-0.5 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPricingViewMode("grouped")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                          pricingViewMode === "grouped"
                            ? "bg-white text-brand shadow-xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Layers size={13} />
                        <span>Grouped by Branch ({filteredBranches.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPricingViewMode("flat")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                          pricingViewMode === "flat"
                            ? "bg-white text-brand shadow-xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Package size={13} />
                        <span>Flat List ({filteredCombinations.length})</span>
                      </button>
                    </div>
                  </div>

                  {pricingViewMode === "grouped" && (
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-500">
                      <button
                        type="button"
                        onClick={() => handleExpandAllBranches(true)}
                        className="hover:text-brand cursor-pointer"
                      >
                        Expand All
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleExpandAllBranches(false)}
                        className="hover:text-brand cursor-pointer"
                      >
                        Collapse All
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Combinations Render Area */}
              {combinations.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Enter a Main Category and values in your sub-category levels above to view generated combinations.
                </div>
              ) : pricingViewMode === "grouped" ? (
                /* =================== VIEW 1: GROUPED BY BRANCH =================== */
                <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                  {filteredBranches.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      No branches match &quot;{matrixSearch}&quot;.
                    </div>
                  ) : (
                    filteredBranches.map((b) => (
                      <div
                        key={b.branchKey}
                        className="border border-gray-200/90 rounded-2xl bg-white shadow-xs overflow-hidden transition-all hover:border-brand/40"
                      >
                        {/* Branch Header */}
                        <div className="p-3.5 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-150">
                          <div className="flex items-center space-x-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={b.allIncluded}
                              ref={(el) => {
                                if (el) el.indeterminate = b.someIncluded;
                              }}
                              onChange={(e) =>
                                handleToggleBranchIncluded(b.rows, e.target.checked)
                              }
                              className="w-4 h-4 rounded accent-brand cursor-pointer shrink-0"
                              title="Toggle all items in this branch"
                            />

                            <div
                              className="cursor-pointer select-none min-w-0 flex items-center space-x-2"
                              onClick={() => toggleBranchExpanded(b.branchKey)}
                            >
                              {expandedBranches[b.branchKey] ? (
                                <ChevronDown size={16} className="text-gray-500 shrink-0" />
                              ) : (
                                <ChevronRight size={16} className="text-gray-500 shrink-0" />
                              )}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-black text-gray-900 tracking-tight">
                                    {b.branchLabel}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand border border-blue-100">
                                    {b.rows.length} variants
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                  {b.rows
                                    .map((r) => r.hierarchy[r.hierarchy.length - 1])
                                    .join(", ")}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Branch Price Control */}
                          <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                            <div className="text-right">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                Branch Rate
                              </label>
                              {b.hasMixedPrices && (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  Mixed rates
                                </span>
                              )}
                            </div>
                            <div className="relative w-28">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={b.commonPrice}
                                placeholder={b.hasMixedPrices ? "Mixed" : "Rate"}
                                onChange={(e) => handleSetBranchPrice(b.rows, e.target.value)}
                                className="w-full pl-5 pr-2 py-1.5 bg-white rounded-xl text-xs font-black text-brand border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand shadow-xs"
                              />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                                ₹
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteBranch(b.rows)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Exclude entire branch"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Variant Rows */}
                        {expandedBranches[b.branchKey] && (
                          <div className="divide-y divide-gray-100 bg-white">
                            {b.rows.map((row) => {
                              const leafValue = row.hierarchy[row.hierarchy.length - 1];
                              const isCustom =
                                row.price !== undefined &&
                                row.price !== "" &&
                                row.price !== batchBasePrice;
                              return (
                                <div
                                  key={row.id}
                                  className={`px-4 py-2.5 flex items-center justify-between transition-colors ${
                                    row.included ? "hover:bg-gray-50/70" : "bg-gray-50/40 opacity-50"
                                  }`}
                                >
                                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                                    <input
                                      type="checkbox"
                                      checked={row.included}
                                      onChange={(e) => {
                                        const val = !e.target.checked;
                                        setRowOverrides((prev) => ({
                                          ...prev,
                                          [row.id]: { ...prev[row.id], excluded: val },
                                        }));
                                      }}
                                      className="w-3.5 h-3.5 rounded accent-brand cursor-pointer shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs font-bold text-gray-900">
                                          {leafValue}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono truncate">
                                          ({row.name})
                                        </span>
                                        {isCustom && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            Custom
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Individual Variant Price Input & Exclude */}
                                  <div className="flex items-center space-x-1 shrink-0">
                                    <div className="relative w-24">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        disabled={!row.included}
                                        value={row.price}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setRowOverrides((prev) => ({
                                            ...prev,
                                            [row.id]: { ...prev[row.id], price: val },
                                          }));
                                        }}
                                        className="w-full pl-4 pr-2 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-gray-100"
                                      />
                                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">
                                        ₹
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCombination(row.id)}
                                      className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Exclude combination"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* =================== VIEW 2: FLAT LIST =================== */
                <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                  {filteredCombinations.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      No combinations match &quot;{matrixSearch}&quot;.
                    </div>
                  ) : (
                    filteredCombinations.map((row, idx) => {
                      const isCustom =
                        row.price !== undefined &&
                        row.price !== "" &&
                        row.price !== batchBasePrice;
                      return (
                        <div
                          key={row.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                            row.included
                              ? "bg-white border-gray-200 hover:border-brand/40 shadow-xs"
                              : "bg-gray-50/70 border-gray-150 opacity-50"
                          }`}
                        >
                          {/* Checkbox & Product Name */}
                          <div className="flex items-center space-x-3 flex-1 min-w-0 pr-3">
                            <input
                              type="checkbox"
                              checked={row.included}
                              onChange={(e) => {
                                const val = !e.target.checked;
                                setRowOverrides((prev) => ({
                                  ...prev,
                                  [row.id]: { ...prev[row.id], excluded: val },
                                }));
                              }}
                              className="w-4 h-4 rounded-md accent-brand cursor-pointer shrink-0"
                            />

                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono font-bold text-gray-400">
                                  #{idx + 1}
                                </span>
                                <p className="text-xs font-black text-gray-900 tracking-tight truncate">
                                  {row.name}
                                </p>
                                {isCustom && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    Custom Rate
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-medium mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-gray-100 font-mono">
                                  Unit: {batchUnit || "COILS"}
                                </span>
                                {batchHsn && (
                                  <span className="px-1.5 py-0.2 rounded bg-gray-100 font-mono">
                                    HSN: {batchHsn}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.2 rounded bg-blue-50 text-brand font-bold">
                                  GST: {batchGst || 18}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Editable Price & Exclude for this combination */}
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <div className="w-28 relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                disabled={!row.included}
                                value={row.price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRowOverrides((prev) => ({
                                    ...prev,
                                    [row.id]: { ...prev[row.id], price: val },
                                  }));
                                }}
                                placeholder="Rate"
                                className="w-full pl-5 pr-2.5 py-1.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-gray-100"
                              />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                                ₹
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteCombination(row.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Exclude combination"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Bottom Matrix Summary & Action */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-gray-500 font-medium">
                  Ready to create <strong className="text-brand font-bold">{includedCount}</strong> combinations in commercial catalog.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchSubmit}
                    disabled={loading || includedCount === 0}
                    className="px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>Create All ({includedCount}) Products</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ==================== CASCADING NODE ADD/EDIT MODAL ====================== */}
        {/* ========================================================================= */}
        {nodeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className="bg-white rounded-3xl shadow-2xl border border-gray-150 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF9800]/10 border border-[#FF9800]/20 flex items-center justify-center text-[#FF9800]">
                    {nodeModalLevel === 0 ? (
                      <Layers size={20} />
                    ) : (
                      <Tag size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0D47A1]">
                      {nodeEditingId ? "Edit Item" : "Add Item"} in{" "}
                      {columnLabels[nodeModalLevel] || (nodeModalLevel === 0 ? "Main Category" : "Sub Category")}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {nodeModalLevel === 0
                        ? "Main category level"
                        : parentNodeForModal
                        ? `Belongs under: ${parentNodeForModal.name}`
                        : "Sub-category level"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNodeModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveNode} className="p-6 space-y-5">
                {/* Item Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    placeholder={
                      nodeModalLevel === 0
                        ? "e.g. Finolex, Polycab, Havells"
                        : "e.g. Wires, Pipes, 180 mts, 90 mts, FR, 1.0 sqmm..."
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-semibold text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1]"
                    autoFocus
                  />
                </div>

                {/* Pricing & Stock Fields (Optional, overrides price for this branch) */}
                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] flex items-center gap-1.5">
                      <DollarSign size={14} className="text-[#FF9800]" />
                      Branch Pricing & Stock (Optional)
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Applied to child variants</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">MRP Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={nodePrice}
                        onChange={(e) => setNodePrice(e.target.value)}
                        placeholder="e.g. 2400"
                        className="w-full px-3 py-2 bg-white rounded-xl text-xs font-bold text-gray-800 border border-gray-200 focus:outline-none focus:border-[#0D47A1]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Sale Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={nodeSalePrice}
                        onChange={(e) => setNodeSalePrice(e.target.value)}
                        placeholder="e.g. 2250"
                        className="w-full px-3 py-2 bg-white rounded-xl text-xs font-bold text-gray-800 border border-gray-200 focus:outline-none focus:border-[#0D47A1]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Default Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={nodeStock}
                        onChange={(e) => setNodeStock(e.target.value)}
                        placeholder="100"
                        className="w-full px-3 py-2 bg-white rounded-xl text-xs font-bold text-gray-800 border border-gray-200 focus:outline-none focus:border-[#0D47A1]"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Chips Selector (For leaf specifications or color variants) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                      Color Variants (Optional)
                    </label>
                    <span className="text-[11px] text-gray-400">
                      {nodeColors.length} colors configured
                    </span>
                  </div>

                  {/* Active Color Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {nodeColors.map((c) => {
                      const style = getCrmColorStyles(c);
                      return (
                        <span
                          key={c}
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            borderColor: style.border,
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase border shadow-2xs"
                        >
                          <span>{c}</span>
                          <button
                            type="button"
                            onClick={() => setNodeColors((prev) => prev.filter((item) => item !== c))}
                            className="hover:opacity-75 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  {/* Quick Color Toggles & Custom Add */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={nodeColorInput}
                      onChange={(e) => setNodeColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = nodeColorInput.trim().toUpperCase();
                          if (val && !nodeColors.includes(val)) {
                            setNodeColors((prev) => [...prev, val]);
                            setNodeColorInput("");
                          }
                        }
                      }}
                      placeholder="Add color (e.g. GREY, ORANGE, WHITE)"
                      className="flex-1 px-3 py-1.5 bg-gray-50 rounded-xl text-xs font-medium text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:border-[#0D47A1]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = nodeColorInput.trim().toUpperCase();
                        if (val && !nodeColors.includes(val)) {
                          setNodeColors((prev) => [...prev, val]);
                          setNodeColorInput("");
                        }
                      }}
                      className="px-3 py-1.5 bg-[#0D47A1] hover:bg-[#0A3880] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Standard Color Suggestions */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["RED", "YELLOW", "BLUE", "BLACK", "GREEN", "WHITE", "GREY"].map((preset) => {
                      const isAdded = nodeColors.includes(preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              setNodeColors((prev) => prev.filter((c) => c !== preset));
                            } else {
                              setNodeColors((prev) => [...prev, preset]);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                            isAdded
                              ? "bg-gray-800 text-white border-gray-900 shadow-2xs"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200"
                          }`}
                        >
                          {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-gray-150 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNodeModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF9800] hover:bg-[#F57C00] text-white text-xs font-black rounded-xl transition-colors cursor-pointer shadow-md shadow-[#FF9800]/20 flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>{nodeEditingId ? "Save Changes" : "Add Item"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ============== CASCADING COMBINATIONS REVIEW & CRM GENERATION =========== */}
        {/* ========================================================================= */}
        {cascadingPreviewOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 lg:p-6">
            <div
              className="bg-white rounded-3xl shadow-2xl border border-gray-150 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Header */}
              <div className="p-6 border-b border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0D47A1]/10 border border-[#0D47A1]/20 flex items-center justify-center text-[#0D47A1] shrink-0">
                    <Sparkles size={22} className="text-[#FF9800]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-[#0D47A1]">
                        Review & Generate Individual Products
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#FF9800]/15 text-[#FF9800] border border-[#FF9800]/30 text-[11px] font-black">
                        {cascadingGeneratedList.filter((p) => p.included).length} Ready
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Preview and fine-tune every combination compiled from your category drill-down before saving to CRM catalog.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCascadingPreviewOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Success Notification Banner */}
              {cascadingSaveSuccess && (
                <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>{cascadingSaveSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCascadingPreviewOpen(false);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              )}

              {/* Controls & Common Catalog Settings Bar */}
              <div className="p-4 bg-white border-b border-gray-150 flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Search & Bulk Selection */}
                <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={cascadingSearch}
                      onChange={(e) => setCascadingSearch(e.target.value)}
                      placeholder="Search products by brand, length, spec, or color..."
                      className="w-full pl-9 pr-8 py-2 bg-gray-50 rounded-xl text-xs font-medium text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:border-[#0D47A1]"
                    />
                    {cascadingSearch && (
                      <button
                        type="button"
                        onClick={() => setCascadingSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAllCascading(true)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAllCascading(false)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                {/* Price percentage adjuster & Common Metadata */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Bulk % price adjustment */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="1"
                      value={cascadingPriceAdjPercent}
                      onChange={(e) => setCascadingPriceAdjPercent(e.target.value)}
                      placeholder="± %"
                      className="w-16 px-2 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-gray-800 border border-gray-200 focus:outline-none focus:border-[#0D47A1]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        applyCascadingPriceAdjustment(cascadingPriceAdjPercent);
                        setCascadingPriceAdjPercent("");
                      }}
                      className="px-2.5 py-1.5 bg-[#0D47A1]/10 hover:bg-[#0D47A1]/20 text-[#0D47A1] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Apply % Price
                    </button>
                  </div>

                  {/* Common Unit */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Unit:</span>
                    <input
                      type="text"
                      value={cascadingUnit}
                      onChange={(e) => setCascadingUnit(e.target.value)}
                      placeholder="COILS"
                      className="w-20 px-2 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-800 border border-gray-200 focus:outline-none focus:border-[#0D47A1]"
                    />
                  </div>

                  {/* Common HSN */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400">HSN:</span>
                    <input
                      type="text"
                      value={cascadingHsn}
                      onChange={(e) => setCascadingHsn(e.target.value)}
                      placeholder="8544"
                      className="w-20 px-2 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-800 border border-gray-200 focus:outline-none focus:border-[#0D47A1]"
                    />
                  </div>

                  {/* Common GST */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400">GST %:</span>
                    <input
                      type="number"
                      value={cascadingGst}
                      onChange={(e) => setCascadingGst(e.target.value)}
                      placeholder="18"
                      className="w-16 px-2 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-800 border border-gray-200 focus:outline-none focus:border-[#0D47A1]"
                    />
                  </div>
                </div>
              </div>

              {/* Scrollable Products Table / Matrix */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredCascadingProducts.length === 0 ? (
                  <div className="py-20 text-center text-gray-400 space-y-2">
                    <p className="text-sm font-bold">No combinations found</p>
                    <p className="text-xs">Try clearing your search or add items to your cascading tree columns.</p>
                  </div>
                ) : (
                  filteredCascadingProducts.map((p) => {
                    const colorStyle = p.color ? getCrmColorStyles(p.color) : null;
                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          p.included
                            ? "bg-white border-gray-200 shadow-2xs hover:border-[#0D47A1]/40"
                            : "bg-gray-50/70 border-gray-150 opacity-60"
                        }`}
                      >
                        {/* Checkbox and Product Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={p.included}
                            onChange={() => handleToggleCascadingRow(p.id)}
                            className="w-4 h-4 rounded accent-[#FF9800] cursor-pointer shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            {/* Editable Name */}
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => handleUpdateCascadingRowName(p.id, e.target.value)}
                              className="w-full bg-transparent hover:bg-gray-50 focus:bg-white text-xs font-bold text-[#0D47A1] rounded px-1.5 py-0.5 border border-transparent focus:border-[#0D47A1] focus:outline-none transition-all"
                            />

                            {/* Hierarchy Path Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 px-1.5">
                              {p.hierarchy.map((seg, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200"
                                >
                                  {seg}
                                </span>
                              ))}

                              {/* Color Pill */}
                              {p.color && colorStyle && (
                                <span
                                  style={{
                                    backgroundColor: colorStyle.bg,
                                    color: colorStyle.text,
                                    borderColor: colorStyle.border,
                                  }}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border shadow-2xs"
                                >
                                  {p.color}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center pl-7 sm:pl-0">
                          {/* MRP Price */}
                          <div className="w-24 relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={p.price}
                              onChange={(e) =>
                                handleUpdateCascadingRowPrice(
                                  p.id,
                                  parseFloat(e.target.value) || 0,
                                  p.salePrice
                                )
                              }
                              placeholder="MRP"
                              className="w-full pl-5 pr-2 py-1.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:border-[#0D47A1]"
                            />
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                              ₹
                            </span>
                          </div>

                          {/* Sale Price */}
                          <div className="w-24 relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={p.salePrice}
                              onChange={(e) =>
                                handleUpdateCascadingRowPrice(
                                  p.id,
                                  p.price,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="Sale"
                              className="w-full pl-5 pr-2 py-1.5 bg-gray-50 rounded-xl text-xs font-bold text-[#FF9800] border border-gray-200 focus:outline-none focus:bg-white focus:border-[#FF9800]"
                            />
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#FF9800] text-xs font-bold">
                              ₹
                            </span>
                          </div>

                          {/* Delete Combination */}
                          <button
                            type="button"
                            onClick={() =>
                              setCascadingGeneratedList((prev) => prev.filter((item) => item.id !== p.id))
                            }
                            className="p-1.5 text-gray-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove combination"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Summary & Generate Action */}
              <div className="p-5 border-t border-gray-150 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="text-xs text-gray-600">
                  Ready to create{" "}
                  <strong className="text-[#0D47A1] font-bold">
                    {cascadingGeneratedList.filter((p) => p.included).length}
                  </strong>{" "}
                  of {cascadingGeneratedList.length} combinations as individual products in your commercial catalog.
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCascadingPreviewOpen(false)}
                    className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCascadingProductsToCrm}
                    disabled={isCascadingSaving || cascadingGeneratedList.filter((p) => p.included).length === 0}
                    className="px-6 py-2.5 bg-[#FF9800] hover:bg-[#F57C00] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs shadow-lg shadow-[#FF9800]/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isCascadingSaving ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Creating in CRM...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>
                          Create {cascadingGeneratedList.filter((p) => p.included).length} Products in CRM
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
