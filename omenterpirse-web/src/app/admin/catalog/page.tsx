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
  Settings,
  MoreVertical
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
    ivory: { bg: "#FFFFF0", text: "#374151", border: "#E5E7EB" },
  };
  return colorMap[name] || { bg: "#E5E7EB", text: "#374151", border: "#D1D5DB" };
}

export type Category = {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  tagline?: string | null;
  levelNames?: string | null; // JSON string array of column titles, e.g. ["Brands", "Lengths", "Models", "Specs & Prices"]
};

export type CatalogNode = {
  id: number;
  categoryId: number;
  parentId: number | null;
  levelIndex: number;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  price?: number | null;
  salePrice?: number | null;
  stock?: number | null;
  colors?: string | null; // JSON array string
  specKey?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

export type CombinationRow = {
  id: string;
  brand: string;
  category: string;
  pathNames: string[];
  name: string;
  basePrice: number;
  salePrice: number;
  stock: number;
  unit: string;
  hsn: string;
  gst: number;
  included: boolean;
  imageUrl?: string | null;
  color?: string;
};

export default function MasterCatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nodes, setNodes] = useState<CatalogNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Selected Category
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Selected Path: array of node IDs selected at each level
  // selectedPath[0] = selected ID at Level 0, selectedPath[1] = selected ID at Level 1, etc.
  const [selectedPath, setSelectedPath] = useState<(number | null)[]>([]);

  // Category Modal (Add / Edit)
  const [categoryModalMode, setCategoryModalMode] = useState<"add" | "edit" | null>(null);
  const [catNameInput, setCatNameInput] = useState("");
  const [catImageInput, setCatImageInput] = useState("");
  const [catLevelsInput, setCatLevelsInput] = useState<string[]>(["Brands", "Types", "Specs & Prices"]);
  const [isCategoryUploading, setIsCategoryUploading] = useState(false);

  // Column Rename Modal
  const [renamingColIdx, setRenamingColIdx] = useState<number | null>(null);
  const [renamingColValue, setRenamingColValue] = useState("");

  // Node Add / Edit Modal
  const [nodeModalConfig, setNodeModalConfig] = useState<{
    levelIndex: number;
    parentId: number | null;
    isLeaf: boolean;
    editingNode: CatalogNode | null;
  } | null>(null);

  const [nodeNameInput, setNodeNameInput] = useState("");
  const [nodeImageInput, setNodeImageInput] = useState("");
  const [nodeDescInput, setNodeDescInput] = useState("");
  const [nodePriceInput, setNodePriceInput] = useState("");
  const [nodeSalePriceInput, setNodeSalePriceInput] = useState("");
  const [nodeStockInput, setNodeStockInput] = useState("100");
  const [nodeColors, setNodeColors] = useState<string[]>(["Red", "Yellow", "Blue", "Black", "Green"]);
  const [colorTagInput, setColorTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Combination Generator Modal State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorScope, setGeneratorScope] = useState<"category" | "selected">("category");
  const [includeCategoryInName, setIncludeCategoryInName] = useState(false);
  const [reverseNameOrder, setReverseNameOrder] = useState(false);
  const [globalUnit, setGlobalUnit] = useState("COILS");
  const [globalHsn, setGlobalHsn] = useState("8544");
  const [globalGst, setGlobalGst] = useState("18");
  const [generatorSearch, setGeneratorSearch] = useState("");
  const [generatedProducts, setGeneratedProducts] = useState<CombinationRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<{ created: number; updated: number; total: number } | null>(null);
  const [priceAdjPercent, setPriceAdjPercent] = useState("");
  const [priceAdjAmount, setPriceAdjAmount] = useState("");

  // ── Fetch Catalog Data ──────────────────────────────────────
  const fetchCatalog = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/catalog");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setNodes(data.nodes || []);
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

  // Active Category Object
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.name.toLowerCase() === selectedCategory.toLowerCase()) || categories[0] || null;
  }, [categories, selectedCategory]);

  // Current Level Names (customizable column names & count for this active category)
  const currentLevelNames = useMemo((): string[] => {
    if (activeCategory?.levelNames) {
      try {
        const parsed = typeof activeCategory.levelNames === "string" ? JSON.parse(activeCategory.levelNames) : activeCategory.levelNames;
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return parsed;
        }
      } catch {}
    }
    const lower = (selectedCategory || "").toLowerCase();
    if (lower.includes("pipe") || lower.includes("conduit")) {
      return ["Brands", "Pipe Types", "Class / Schedule", "Sizes & Prices"];
    }
    if (lower.includes("switch") || lower.includes("modular")) {
      return ["Brands", "Series / Range", "Modules", "Types & Prices"];
    }
    if (lower.includes("cable")) {
      return ["Brands", "Core Count", "Armour Type", "Sizes & Prices"];
    }
    return ["Brands", "Lengths", "Models", "Specs & Prices"];
  }, [activeCategory, selectedCategory]);

  const numColumns = currentLevelNames.length;

  // Reset or adjust selectedPath when category changes
  useEffect(() => {
    setSelectedPath(new Array(numColumns).fill(null));
  }, [selectedCategory, numColumns]);

  // Auto-select first item at level 0 if nothing selected
  useEffect(() => {
    if (activeCategory && nodes.length > 0 && selectedPath[0] === null) {
      const rootNodes = nodes.filter((n) => n.categoryId === activeCategory.id && (n.parentId === null || n.levelIndex === 0));
      if (rootNodes.length > 0) {
        setSelectedPath((prev) => {
          const next = [...prev];
          next[0] = rootNodes[0].id;
          return next;
        });
      }
    }
  }, [activeCategory, nodes, selectedPath]);

  // Auto-select first child at subsequent levels if parent selected and no child selected
  useEffect(() => {
    if (!activeCategory) return;
    for (let lvl = 0; lvl < numColumns - 1; lvl++) {
      const parentId = selectedPath[lvl];
      if (parentId && selectedPath[lvl + 1] === null) {
        const children = nodes.filter((n) => n.parentId === parentId && n.levelIndex === lvl + 1);
        if (children.length > 0) {
          setSelectedPath((prev) => {
            const next = [...prev];
            next[lvl + 1] = children[0].id;
            return next;
          });
          break;
        }
      }
    }
  }, [activeCategory, nodes, selectedPath, numColumns]);

  // ── Node Selection Handler ──────────────────────────────────
  const handleSelectNode = (levelIdx: number, nodeId: number) => {
    setSelectedPath((prev) => {
      const next = prev.slice(0, levelIdx);
      next[levelIdx] = nodeId;
      // fill remaining with null
      while (next.length < numColumns) next.push(null);
      return next;
    });
  };

  // ── Column Management (Rename / Add / Remove) ───────────────
  const openRenameColumnModal = (colIdx: number) => {
    setRenamingColIdx(colIdx);
    setRenamingColValue(currentLevelNames[colIdx] || `Level ${colIdx + 1}`);
  };

  const handleSaveColumnRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingColIdx === null || !activeCategory || !renamingColValue.trim()) return;

    try {
      const updatedLevels = [...currentLevelNames];
      updatedLevels[renamingColIdx] = renamingColValue.trim();

      const res = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: activeCategory.id,
          levelNames: updatedLevels,
        }),
      });

      if (res.ok) {
        setSuccess(`Column ${renamingColIdx + 1} renamed to "${renamingColValue.trim()}"!`);
        setRenamingColIdx(null);
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to rename column");
    }
  };

  const handleAddColumn = async () => {
    if (!activeCategory) return;
    const newColName = prompt("Enter the name for the new sub-category column (e.g. Thickness, Class, Series):");
    if (!newColName || !newColName.trim()) return;

    try {
      // Insert right before the last column (Specs & Prices)
      const lastIndex = currentLevelNames.length - 1;
      const updatedLevels = [
        ...currentLevelNames.slice(0, lastIndex),
        newColName.trim(),
        currentLevelNames[lastIndex],
      ];

      const res = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: activeCategory.id,
          levelNames: updatedLevels,
        }),
      });

      if (res.ok) {
        setSuccess(`Added new column "${newColName.trim()}"!`);
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add column");
    }
  };

  const handleRemoveColumn = async (colIdx: number) => {
    if (!activeCategory || currentLevelNames.length <= 2) {
      alert("A category must have at least 2 columns.");
      return;
    }

    if (!confirm(`Are you sure you want to remove the column "${currentLevelNames[colIdx]}"? Items configured under this level will also be adjusted.`)) {
      return;
    }

    try {
      const updatedLevels = currentLevelNames.filter((_, idx) => idx !== colIdx);
      const res = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: activeCategory.id,
          levelNames: updatedLevels,
        }),
      });

      if (res.ok) {
        setSuccess(`Removed column "${currentLevelNames[colIdx]}".`);
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove column");
    }
  };

  // ── Category Management (Add / Edit / Delete) ───────────────
  const openAddCategoryModal = () => {
    setCatNameInput("");
    setCatImageInput("");
    setCatLevelsInput(["Brands", "Types", "Classes", "Specs & Prices"]);
    setCategoryModalMode("add");
  };

  const openEditCategoryModal = (cat: Category) => {
    setCatNameInput(cat.name);
    setCatImageInput(cat.imageUrl || "");
    let levels = ["Brands", "Types", "Classes", "Specs & Prices"];
    if (cat.levelNames) {
      try {
        const parsed = typeof cat.levelNames === "string" ? JSON.parse(cat.levelNames) : cat.levelNames;
        if (Array.isArray(parsed) && parsed.length >= 2) levels = parsed;
      } catch {}
    }
    setCatLevelsInput(levels);
    setCategoryModalMode("edit");
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    try {
      const isEditing = categoryModalMode === "edit" && activeCategory;
      const cleanLevels = catLevelsInput.map((l) => l.trim()).filter(Boolean);
      if (cleanLevels.length < 2) {
        alert("Please provide at least 2 column names (e.g. Brands and Specs & Prices).");
        return;
      }

      const res = await fetch("/api/admin/catalog", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: isEditing ? activeCategory.id : undefined,
          name: catNameInput.trim(),
          imageUrl: catImageInput.trim() || null,
          levelNames: cleanLevels,
        }),
      });

      if (res.ok) {
        setSuccess(isEditing ? "Category updated!" : "New category created!");
        setSelectedCategory(catNameInput.trim());
        setCategoryModalMode(null);
        fetchCatalog();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to save category");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving category");
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete "${cat.name}" and all of its sub-categories and catalog items?`)) return;
    try {
      const res = await fetch(`/api/admin/catalog?type=category&id=${cat.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess(`Category "${cat.name}" deleted.`);
        const remaining = categories.filter((c) => c.id !== cat.id);
        if (remaining.length > 0) {
          setSelectedCategory(remaining[0].name);
        } else {
          setSelectedCategory("");
        }
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete category");
    }
  };

  // ── Node Add / Edit / Delete ────────────────────────────────
  const openAddNodeModal = (levelIndex: number) => {
    if (!activeCategory) return;
    const parentId = levelIndex === 0 ? null : selectedPath[levelIndex - 1];
    if (levelIndex > 0 && !parentId) {
      alert(`Please select an item in Column ${levelIndex} first.`);
      return;
    }

    const isLeaf = levelIndex === numColumns - 1;
    setNodeModalConfig({
      levelIndex,
      parentId,
      isLeaf,
      editingNode: null,
    });
    setNodeNameInput("");
    setNodeImageInput("");
    setNodeDescInput("");
    setNodePriceInput("");
    setNodeSalePriceInput("");
    setNodeStockInput("100");
    setNodeColors(["Red", "Yellow", "Blue", "Black", "Green"]);
    setColorTagInput("");
  };

  const openEditNodeModal = (node: CatalogNode) => {
    const isLeaf = node.levelIndex === numColumns - 1;
    setNodeModalConfig({
      levelIndex: node.levelIndex,
      parentId: node.parentId,
      isLeaf,
      editingNode: node,
    });
    setNodeNameInput(node.name);
    setNodeImageInput(node.imageUrl || "");
    setNodeDescInput(node.description || "");
    setNodePriceInput(node.price !== null && node.price !== undefined ? String(node.price) : "");
    setNodeSalePriceInput(node.salePrice !== null && node.salePrice !== undefined ? String(node.salePrice) : "");
    setNodeStockInput(String(node.stock || 100));

    let parsedColors: string[] = [];
    try {
      parsedColors = typeof node.colors === "string" ? JSON.parse(node.colors) : node.colors || [];
    } catch {
      parsedColors = node.colors ? String(node.colors).split(",").map((c) => c.trim()) : [];
    }
    setNodeColors(parsedColors);
    setColorTagInput("");
  };

  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeModalConfig || !nodeNameInput.trim() || !activeCategory) return;

    try {
      const isEditing = Boolean(nodeModalConfig.editingNode);
      const payload: any = {
        type: "node",
        id: isEditing ? nodeModalConfig.editingNode!.id : undefined,
        categoryId: activeCategory.id,
        parentId: nodeModalConfig.parentId,
        levelIndex: nodeModalConfig.levelIndex,
        name: nodeNameInput.trim(),
        imageUrl: nodeImageInput.trim() || null,
        description: nodeDescInput.trim() || null,
        price: nodePriceInput ? Number(nodePriceInput) : null,
        salePrice: nodeSalePriceInput ? Number(nodeSalePriceInput) : null,
        stock: Number(nodeStockInput) || 100,
        colors: nodeColors,
        specKey: nodeModalConfig.isLeaf ? nodeNameInput.trim() : null,
      };

      const res = await fetch("/api/admin/catalog", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(isEditing ? "Item updated!" : "New item added!");
        setNodeModalConfig(null);
        fetchCatalog();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to save item");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving item");
    }
  };

  const handleDeleteNode = async (node: CatalogNode) => {
    if (!confirm(`Are you sure you want to delete "${node.name}" and any sub-items configured beneath it?`)) return;

    try {
      const res = await fetch(`/api/admin/catalog?type=node&id=${node.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess(`"${node.name}" deleted.`);
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete item");
    }
  };

  const handleAddColorTag = () => {
    if (colorTagInput.trim() && !nodeColors.includes(colorTagInput.trim())) {
      setNodeColors([...nodeColors, colorTagInput.trim()]);
      setColorTagInput("");
    }
  };

  const handleRemoveColorTag = (c: string) => {
    setNodeColors(nodeColors.filter((col) => col !== c));
  };

  // ── Automated Combination Generator ────────────────────────
  const generateAllCombinationsFromTree = (
    catId: number,
    scopeNodeId: number | null = null,
    includeCat: boolean = false,
    reverse: boolean = false
  ): CombinationRow[] => {
    const catNodes = nodes.filter((n) => n.categoryId === catId);
    const rows: CombinationRow[] = [];
    const catName = activeCategory?.name || "Electrical Wires";

    const traverse = (parentId: number | null, lvl: number, path: CatalogNode[]) => {
      let children = catNodes.filter((n) =>
        parentId === null ? (n.parentId === null || n.levelIndex === 0) : n.parentId === parentId
      );

      if (scopeNodeId && lvl === 0) {
        children = children.filter((n) => n.id === scopeNodeId);
      }

      for (const child of children) {
        const nextPath = [...path, child];

        // Terminal level check
        const isTerminal = child.levelIndex === numColumns - 1 || (child.price && child.levelIndex >= numColumns - 2);

        if (isTerminal) {
          let parsedColors: string[] = [];
          try {
            parsedColors = typeof child.colors === "string" ? JSON.parse(child.colors) : child.colors || [];
          } catch {
            parsedColors = child.colors ? String(child.colors).split(",").map((c) => c.trim()) : [];
          }

          const price = Number(child.price) || 0;
          const salePrice = child.salePrice ? Number(child.salePrice) : price;
          const stock = Number(child.stock) || 100;
          const names = nextPath.map((n) => n.name).filter((n) => n && n !== "Default");

          if (parsedColors.length > 0) {
            for (const col of parsedColors) {
              let parts = [
                nextPath[0]?.name,
                includeCat ? catName : "",
                ...names.slice(1),
                col,
              ].filter(Boolean);
              if (reverse) parts = [...parts].reverse();

              rows.push({
                id: `${nextPath.map((n) => n.id).join("-")}-${col}`,
                brand: nextPath[0]?.name || "",
                category: catName,
                pathNames: names,
                name: parts.join(" "),
                basePrice: price,
                salePrice: salePrice,
                stock: stock,
                unit: globalUnit,
                hsn: globalHsn,
                gst: Number(globalGst) || 18,
                included: true,
                imageUrl: nextPath[0]?.imageUrl || null,
                color: col,
              });
            }
          } else {
            let parts = [nextPath[0]?.name, includeCat ? catName : "", ...names.slice(1)].filter(Boolean);
            if (reverse) parts = [...parts].reverse();

            rows.push({
              id: nextPath.map((n) => n.id).join("-"),
              brand: nextPath[0]?.name || "",
              category: catName,
              pathNames: names,
              name: parts.join(" "),
              basePrice: price,
              salePrice: salePrice,
              stock: stock,
              unit: globalUnit,
              hsn: globalHsn,
              gst: Number(globalGst) || 18,
              included: true,
              imageUrl: nextPath[0]?.imageUrl || null,
            });
          }
        } else {
          traverse(child.id, lvl + 1, nextPath);
        }
      }
    };

    traverse(null, 0, []);
    return rows;
  };

  const activeCategoryCombinations = useMemo(() => {
    if (!activeCategory) return [];
    return generateAllCombinationsFromTree(activeCategory.id, null, includeCategoryInName, reverseNameOrder);
  }, [activeCategory, nodes, numColumns, includeCategoryInName, reverseNameOrder, globalUnit, globalHsn, globalGst]);

  const openGeneratorModal = (scope: "category" | "selected" = "category") => {
    if (!activeCategory) return;
    setGeneratorScope(scope);
    const scopeId = scope === "selected" ? selectedPath[0] : null;
    const items = generateAllCombinationsFromTree(activeCategory.id, scopeId, includeCategoryInName, reverseNameOrder);
    setGeneratedProducts(items);
    setGenerationSummary(null);
    setGeneratorSearch("");
    setPriceAdjPercent("");
    setPriceAdjAmount("");
    setIsGeneratorOpen(true);
  };

  const handleToggleIncludeCategory = (val: boolean) => {
    setIncludeCategoryInName(val);
    if (!activeCategory) return;
    const scopeId = generatorScope === "selected" ? selectedPath[0] : null;
    const items = generateAllCombinationsFromTree(activeCategory.id, scopeId, val, reverseNameOrder);
    setGeneratedProducts(items);
  };

  const handleToggleReverseOrder = (val: boolean) => {
    setReverseNameOrder(val);
    if (!activeCategory) return;
    const scopeId = generatorScope === "selected" ? selectedPath[0] : null;
    const items = generateAllCombinationsFromTree(activeCategory.id, scopeId, includeCategoryInName, val);
    setGeneratedProducts(items);
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
    if (!generatorSearch.trim()) return generatedProducts;
    const q = generatorSearch.toLowerCase().trim();
    return generatedProducts.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [generatedProducts, generatorSearch]);

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
      alert("Please select at least one product to generate.");
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
        brand: p.brand,
        imageUrl: p.imageUrl || null,
        specifications: p.pathNames.map((val, idx) => ({
          key: currentLevelNames[idx] || `Level ${idx + 1}`,
          value: val,
        })),
        tags: [p.brand, p.category, ...p.pathNames, p.color].filter(Boolean).join(", "),
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
            Dynamic drill-down configurator: customize category names, column labels &amp; number of columns.
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
            className="flex items-center gap-2 bg-[#0D47A1]/5 hover:bg-[#0D47A1]/10 text-[#0D47A1] px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
            title="Refresh Catalog Data"
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

      {/* Step 1: Active Category Bar (Customizable Main Categories) */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-[#0D47A1]/70 flex items-center gap-2">
            <Grid size={16} className="text-[#FF9800]" /> Select Active Category
          </label>
          <button
            onClick={openAddCategoryModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF9800]/10 hover:bg-[#FF9800]/20 text-[#FF9800] rounded-xl text-xs font-black transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Category</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.name);
                }}
                className={`group px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer select-none ${
                  isSelected
                    ? "bg-[#0D47A1] text-white shadow-lg shadow-[#0D47A1]/20 scale-105"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/50"
                }`}
              >
                <span>{cat.name}</span>
                {isSelected && (
                  <div className="flex items-center gap-1 ml-1 pl-2 border-l border-white/20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCategoryModal(cat);
                      }}
                      className="p-1 hover:bg-white/20 rounded-md text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Edit Category & Column Levels"
                    >
                      <Pencil size={11} />
                    </button>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat);
                        }}
                        className="p-1 hover:bg-red-500 rounded-md text-white/80 hover:text-white transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Customizable Columns (Miller Columns Board) */}
      <div className="flex gap-6 items-start overflow-x-auto pb-6 custom-scrollbar">
        {currentLevelNames.map((levelName, colIdx) => {
          const isLeaf = colIdx === numColumns - 1;
          const parentId = colIdx === 0 ? null : selectedPath[colIdx - 1];
          const parentNode = colIdx > 0 && parentId ? nodes.find((n) => n.id === parentId) : null;

          // Filter nodes for this column
          const colNodes = activeCategory
            ? nodes.filter((n) => {
                if (n.categoryId !== activeCategory.id) return false;
                if (colIdx === 0) return n.parentId === null || n.levelIndex === 0;
                return n.parentId === parentId && n.levelIndex === colIdx;
              })
            : [];

          const selectedNodeIdAtLevel = selectedPath[colIdx];

          return (
            <div
              key={colIdx}
              className="min-w-[280px] max-w-[320px] flex-1 bg-white rounded-3xl p-5 shadow-xl border border-gray-100 space-y-4 shrink-0"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0D47A1] truncate flex items-center gap-1.5">
                    {colIdx === 0 ? (
                      <Award size={15} className="text-[#FF9800] shrink-0" />
                    ) : isLeaf ? (
                      <Tag size={15} className="text-[#FF9800] shrink-0" />
                    ) : (
                      <Package size={15} className="text-[#FF9800] shrink-0" />
                    )}
                    <span className="truncate">
                      {colIdx + 1}. {levelName} ({colNodes.length})
                    </span>
                  </h3>
                  <button
                    onClick={() => openRenameColumnModal(colIdx)}
                    className="text-gray-300 hover:text-[#0D47A1] p-1 shrink-0 cursor-pointer"
                    title={`Rename Column ${colIdx + 1}`}
                  >
                    <Pencil size={11} />
                  </button>
                  {colIdx > 0 && !isLeaf && numColumns > 2 && (
                    <button
                      onClick={() => handleRemoveColumn(colIdx)}
                      className="text-gray-300 hover:text-red-500 p-1 shrink-0 cursor-pointer"
                      title={`Remove Column ${colIdx + 1}`}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => openAddNodeModal(colIdx)}
                  disabled={colIdx > 0 && !parentId}
                  className="p-1.5 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                  title={`Add ${levelName}`}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Column Item List */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {colIdx > 0 && !parentId ? (
                  <p className="text-xs text-gray-400 py-8 text-center">
                    Select a {currentLevelNames[colIdx - 1]} first.
                  </p>
                ) : colNodes.length === 0 ? (
                  <p className="text-xs text-gray-400 py-8 text-center">
                    No {levelName} added {parentNode ? `under ${parentNode.name}` : ""}. Click + to add.
                  </p>
                ) : (
                  colNodes.map((item) => {
                    const isSelected = selectedNodeIdAtLevel === item.id;

                    // If leaf level, render specs & prices view
                    if (isLeaf) {
                      let parsedColors: string[] = [];
                      try {
                        parsedColors = typeof item.colors === "string" ? JSON.parse(item.colors) : item.colors || [];
                      } catch {
                        parsedColors = item.colors ? String(item.colors).split(",").map((c) => c.trim()) : [];
                      }

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 space-y-2 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-[#0D47A1]">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditNodeModal(item)}
                                className="text-gray-300 hover:text-[#0D47A1] p-1 cursor-pointer"
                                title="Edit Spec & Price"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteNode(item)}
                                className="text-gray-300 hover:text-red-500 p-1 cursor-pointer"
                                title="Delete Spec & Price"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold text-[#0D47A1]">
                            <span>₹{item.salePrice || item.price || 0}</span>
                            {item.salePrice && item.price && item.salePrice < item.price && (
                              <span className="text-[10px] text-gray-400 line-through">₹{item.price}</span>
                            )}
                          </div>

                          {parsedColors.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {parsedColors.map((col, cIdx) => {
                                const st = getColorStyles(col);
                                return (
                                  <span
                                    key={cIdx}
                                    style={{ backgroundColor: st.bg, color: st.text, borderColor: st.border }}
                                    className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase border shadow-2xs"
                                  >
                                    {col}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Intermediate levels view
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectNode(colIdx, item.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-[#0D47A1] bg-[#0D47A1]/5 shadow-sm"
                            : "border-gray-100 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-6 h-6 object-contain rounded-md" />
                          ) : colIdx === 0 ? (
                            <Award size={16} className="text-[#0D47A1] shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-[#0D47A1]/40 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-[#0D47A1] truncate">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {colIdx === 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectNode(0, item.id);
                                openGeneratorModal("selected");
                              }}
                              className="text-gray-300 hover:text-[#FF9800] p-1 cursor-pointer"
                              title={`Generate individual products for ${item.name}`}
                            >
                              <Sparkles size={12} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditNodeModal(item);
                            }}
                            className="text-gray-300 hover:text-[#0D47A1] p-1 cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(item);
                            }}
                            className="text-gray-300 hover:text-red-500 p-1 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                          <ChevronRight size={14} className="text-gray-400" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {/* Add Sub-Category Column Card */}
        <div
          onClick={handleAddColumn}
          className="min-w-[220px] self-stretch border-2 border-dashed border-[#0D47A1]/20 hover:border-[#FF9800] rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-amber-50/20 group"
          title="Add another sub-category column level to this category"
        >
          <div className="p-3 bg-[#0D47A1]/5 group-hover:bg-[#FF9800]/10 text-[#0D47A1] group-hover:text-[#FF9800] rounded-2xl transition-colors mb-2">
            <Plus size={20} />
          </div>
          <span className="text-xs font-black text-[#0D47A1] group-hover:text-[#FF9800]">
            + Add Sub-Category Column
          </span>
          <span className="text-[10px] text-gray-400 mt-1">
            Expand hierarchy depth
          </span>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* 1. Category Modal (Add / Edit) */}
      {categoryModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D47A1]/50 backdrop-blur-sm">
          <form onSubmit={handleSaveCategory} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-[#0D47A1]">
              {categoryModalMode === "edit" ? "Edit Category & Hierarchy Levels" : "Create New Main Category"}
            </h3>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500">Category Name *</label>
              <input
                type="text"
                placeholder="e.g. Electrical Pipes & Conduit, Lighting, Switches"
                value={catNameInput}
                onChange={(e) => setCatNameInput(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 flex items-center justify-between">
                <span>Sub-Category Columns / Levels ({catLevelsInput.length})</span>
                <button
                  type="button"
                  onClick={() => setCatLevelsInput([...catLevelsInput, `Level ${catLevelsInput.length + 1}`])}
                  className="text-[#FF9800] hover:underline cursor-pointer"
                >
                  + Add Level
                </button>
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {catLevelsInput.map((lvl, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-400 w-5 text-center">{idx + 1}.</span>
                    <input
                      type="text"
                      value={lvl}
                      onChange={(e) => {
                        const next = [...catLevelsInput];
                        next[idx] = e.target.value;
                        setCatLevelsInput(next);
                      }}
                      placeholder={`Column ${idx + 1} Title`}
                      className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#0D47A1]"
                      required
                    />
                    {catLevelsInput.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setCatLevelsInput(catLevelsInput.filter((_, i) => i !== idx))}
                        className="p-2 text-gray-300 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryModalMode(null)}
                className="flex-1 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#FF9800] text-xs font-black text-white rounded-xl shadow-md cursor-pointer"
              >
                {categoryModalMode === "edit" ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Column Rename Modal */}
      {renamingColIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D47A1]/50 backdrop-blur-sm">
          <form onSubmit={handleSaveColumnRename} className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-[#0D47A1]">
              Rename Column {renamingColIdx + 1}
            </h3>
            <p className="text-xs text-gray-500">
              Customize the title of this sub-category level for <span className="font-bold text-[#0D47A1]">{activeCategory?.name}</span>.
            </p>
            <input
              type="text"
              value={renamingColValue}
              onChange={(e) => setRenamingColValue(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
              required
              autoFocus
            />
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setRenamingColIdx(null)}
                className="flex-1 py-2 bg-gray-100 text-xs font-bold text-gray-600 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-[#FF9800] text-xs font-black text-white rounded-xl shadow-md cursor-pointer"
              >
                Save Name
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Node Modal (Intermediate / Leaf Spec) */}
      {nodeModalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D47A1]/50 backdrop-blur-sm">
          <form onSubmit={handleSaveNode} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-[#0D47A1]">
              {nodeModalConfig.editingNode
                ? `Edit ${currentLevelNames[nodeModalConfig.levelIndex] || "Item"}`
                : `Add ${currentLevelNames[nodeModalConfig.levelIndex] || "Item"}`}
            </h3>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500">
                {nodeModalConfig.isLeaf ? "Specification / Size / Gauge *" : `${currentLevelNames[nodeModalConfig.levelIndex]} Name *`}
              </label>
              <input
                type="text"
                placeholder={nodeModalConfig.isLeaf ? "e.g. 2.5 SQMM, 1/2 inch (15mm), 10A 1-Way" : "e.g. Polycab, 90 metres, CPVC Pro, FR"}
                value={nodeNameInput}
                onChange={(e) => setNodeNameInput(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
                required
              />
            </div>

            {/* If root level (brands), allow image upload */}
            {nodeModalConfig.levelIndex === 0 && (
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500">Logo / Image URL (optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={nodeImageInput}
                  onChange={(e) => setNodeImageInput(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#0D47A1]"
                />
              </div>
            )}

            {/* If leaf level: colors, prices, stock */}
            {nodeModalConfig.isLeaf && (
              <>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500">Available Colors</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add color (e.g. Red, Blue, White)"
                      value={colorTagInput}
                      onChange={(e) => setColorTagInput(e.target.value)}
                      className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#0D47A1]"
                    />
                    <button
                      type="button"
                      onClick={handleAddColorTag}
                      className="px-3.5 bg-gray-200 hover:bg-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {nodeColors.map((c, idx) => {
                      const st = getColorStyles(c);
                      return (
                        <span
                          key={idx}
                          style={{ backgroundColor: st.bg, color: st.text, borderColor: st.border }}
                          className="text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border shadow-2xs"
                        >
                          {c}
                          <button
                            type="button"
                            onClick={() => handleRemoveColorTag(c)}
                            style={{ color: st.text }}
                            className="opacity-70 hover:opacity-100 font-bold cursor-pointer"
                          >
                            ×
                          </button>
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
                      value={nodePriceInput}
                      onChange={(e) => setNodePriceInput(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500">Sale Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1350"
                      value={nodeSalePriceInput}
                      onChange={(e) => setNodeSalePriceInput(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500">Initial Stock</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={nodeStockInput}
                    onChange={(e) => setNodeStockInput(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0D47A1]"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNodeModalConfig(null)}
                className="flex-1 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#FF9800] text-xs font-black text-white rounded-xl shadow-md cursor-pointer"
              >
                {nodeModalConfig.editingNode ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Combination to Products Review Modal */}
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
                      Every path in your {activeCategory?.name} hierarchy will be created as its own individual product row in the Products list.
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
                      Entire Category ({activeCategoryCombinations.length})
                    </button>
                    {selectedPath[0] && (
                      <button
                        type="button"
                        onClick={() => openGeneratorModal("selected")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          generatorScope === "selected"
                            ? "bg-white text-[#0D47A1] shadow-xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Only Selected Brand
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

              {/* Global Fields & Bulk Adjuster */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 border-t border-gray-200/50">
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

              {/* Search & Select All */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search combinations by brand, name, size..."
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
              ) : displayedGeneratedProducts.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <AlertTriangle size={36} className="mx-auto text-amber-500 opacity-60" />
                  <p className="text-sm font-bold text-gray-500">No combinations found matching your filters.</p>
                  <p className="text-xs text-gray-400">
                    Ensure sub-category items and leaf specs (price &amp; colors) are configured across the columns.
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
                      <th className="py-2.5 px-3">Hierarchy Path</th>
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
                              {row.pathNames.map((pName, pIdx) => (
                                <span
                                  key={pIdx}
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                    pIdx === 0
                                      ? "bg-[#0D47A1]/10 text-[#0D47A1] font-extrabold"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {pName}
                                </span>
                              ))}
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
