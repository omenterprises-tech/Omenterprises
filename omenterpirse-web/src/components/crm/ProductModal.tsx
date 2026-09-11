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
} from "lucide-react";

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

  // Tab: "single" or "batch"
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");

  // Name order preference: "forward" (a b c d) vs "reverse" (d c b a)
  const [nameOrder, setNameOrder] = useState<"forward" | "reverse">("forward");

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

      const nextPaths: string[][] = [];

      for (const path of currentPaths) {
        if (!hasParentFilter) {
          // Applies to all paths
          for (const val of lvl.values) {
            nextPaths.push([...path, val]);
          }
        } else {
          // Check if this path contains at least one of the parent values
          const matchesParent = lvl.appliesToParents!.some((parentVal) =>
            path.includes(parentVal)
          );

          if (matchesParent) {
            // Expand with this level's values
            for (const val of lvl.values) {
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
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
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tab Switcher (Only in create mode) */}
        {!isEditing && (
          <div className="bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === "single"
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Package size={15} />
              <span>Single Product Entry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("batch")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer relative ${
                activeTab === "batch"
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Sparkles size={15} className="text-amber-400" />
              <span>Hierarchy & Combination Generator</span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  activeTab === "batch"
                    ? "bg-white/20 text-white"
                    : "bg-blue-50 text-brand border border-blue-100"
                }`}
              >
                Unlimited Levels
              </span>
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
        {/* ==================== TAB 2: UNLIMITED HIERARCHICAL GENERATOR ============ */}
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
                        const hasFilter =
                          Array.isArray(lvl.appliesToParents) && lvl.appliesToParents.length > 0;

                        return (
                          <div className="pt-2.5 border-t border-gray-200/60 mt-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <GitBranch size={13} className="text-brand" />
                                <span className="text-xs font-bold text-gray-700">Applies to:</span>
                                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => updateSubCategoryAppliesTo(lvl.id, [])}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                      !hasFilter
                                        ? "bg-brand text-white shadow-xs"
                                        : "text-gray-600 hover:text-gray-900"
                                    }`}
                                  >
                                    All Products
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!hasFilter && parentValues.length > 0) {
                                        updateSubCategoryAppliesTo(lvl.id, [parentValues[0]]);
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                      hasFilter
                                        ? "bg-brand text-white shadow-xs"
                                        : "text-gray-600 hover:text-gray-900"
                                    }`}
                                  >
                                    Specific Parent Only
                                  </button>
                                </div>
                              </div>

                              {hasFilter && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  Conditional: Only for {lvl.appliesToParents!.join(", ")}
                                </span>
                              )}
                            </div>

                            {/* Parent Value Selection Chips */}
                            {hasFilter && (
                              <div className="p-2.5 bg-white rounded-xl border border-blue-100/80 shadow-2xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-gray-600">
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
      </main>
    </div>
  );
}
