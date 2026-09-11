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
  FolderTree,
  Folder,
  FolderPlus,
  CornerDownRight,
} from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (product: any) => void;
  onProductsCreated?: (products: any[]) => void;
  onProductSaved?: (product: any) => void;
  initialProduct?: any | null;
}

export interface TreeNode {
  id: string;
  name: string;
  price?: string;
  children: TreeNode[];
}

const createDefaultCategoryTree = (brand: string = "Finolex"): TreeNode => ({
  id: "root",
  name: brand || "Finolex",
  children: [
    {
      id: "wires",
      name: "wires",
      children: [
        {
          id: "w-180",
          name: "180 mts",
          children: [
            {
              id: "w-180-fr",
              name: "fr",
              children: [
                {
                  id: "w-180-fr-1.0",
                  name: "1.0 sqmm",
                  children: [
                    { id: "w-180-fr-1.0-red", name: "red", price: "1200", children: [] },
                    { id: "w-180-fr-1.0-blue", name: "blue", price: "1200", children: [] },
                    { id: "w-180-fr-1.0-green", name: "green", price: "1200", children: [] },
                    { id: "w-180-fr-1.0-yellow", name: "yellow", price: "1200", children: [] },
                    { id: "w-180-fr-1.0-black", name: "black", price: "1200", children: [] },
                  ],
                },
                {
                  id: "w-180-fr-1.5",
                  name: "1.5 sqmm",
                  children: [
                    { id: "w-180-fr-1.5-red", name: "red", price: "1650", children: [] },
                    { id: "w-180-fr-1.5-blue", name: "blue", price: "1650", children: [] },
                    { id: "w-180-fr-1.5-green", name: "green", price: "1650", children: [] },
                    { id: "w-180-fr-1.5-yellow", name: "yellow", price: "1650", children: [] },
                    { id: "w-180-fr-1.5-black", name: "black", price: "1650", children: [] },
                  ],
                },
              ],
            },
            {
              id: "w-180-frls",
              name: "frls",
              children: [
                {
                  id: "w-180-frls-1.0",
                  name: "1.0 sqmm",
                  children: [
                    { id: "w-180-frls-1.0-red", name: "red", price: "1350", children: [] },
                    { id: "w-180-frls-1.0-blue", name: "blue", price: "1350", children: [] },
                    { id: "w-180-frls-1.0-green", name: "green", price: "1350", children: [] },
                    { id: "w-180-frls-1.0-yellow", name: "yellow", price: "1350", children: [] },
                    { id: "w-180-frls-1.0-black", name: "black", price: "1350", children: [] },
                  ],
                },
                {
                  id: "w-180-frls-1.5",
                  name: "1.5 sqmm",
                  children: [
                    { id: "w-180-frls-1.5-red", name: "red", price: "1850", children: [] },
                    { id: "w-180-frls-1.5-blue", name: "blue", price: "1850", children: [] },
                    { id: "w-180-frls-1.5-green", name: "green", price: "1850", children: [] },
                    { id: "w-180-frls-1.5-yellow", name: "yellow", price: "1850", children: [] },
                    { id: "w-180-frls-1.5-black", name: "black", price: "1850", children: [] },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "w-90",
          name: "90 mts",
          children: [
            {
              id: "w-90-1.0",
              name: "1.0 sqmm",
              children: [
                { id: "w-90-1.0-red", name: "red", price: "650", children: [] },
                { id: "w-90-1.0-blue", name: "blue", price: "650", children: [] },
                { id: "w-90-1.0-green", name: "green", price: "650", children: [] },
                { id: "w-90-1.0-yellow", name: "yellow", price: "650", children: [] },
                { id: "w-90-1.0-black", name: "black", price: "650", children: [] },
              ],
            },
            {
              id: "w-90-1.5",
              name: "1.5 sqmm",
              children: [
                { id: "w-90-1.5-red", name: "red", price: "850", children: [] },
                { id: "w-90-1.5-blue", name: "blue", price: "850", children: [] },
                { id: "w-90-1.5-green", name: "green", price: "850", children: [] },
                { id: "w-90-1.5-yellow", name: "yellow", price: "850", children: [] },
                { id: "w-90-1.5-black", name: "black", price: "850", children: [] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "pipes",
      name: "pipes",
      children: [
        {
          id: "p-20mm",
          name: "20mm",
          children: [
            { id: "p-20mm-heavy", name: "heavy", price: "180", children: [] },
            { id: "p-20mm-light", name: "light", price: "140", children: [] },
          ],
        },
      ],
    },
  ],
});

// Clone a tree node deeply with new unique IDs
function deepCloneWithNewIds(node: TreeNode): TreeNode {
  return {
    id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: node.name,
    price: node.price,
    children: (node.children || []).map(deepCloneWithNewIds),
  };
}

// Find node by id in tree
function findNodeInTree(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) return root;
  for (const child of root.children || []) {
    const found = findNodeInTree(child, id);
    if (found) return found;
  }
  return null;
}

// Find path from root to node
function findPathToNode(root: TreeNode, id: string, path: TreeNode[] = []): TreeNode[] | null {
  const currentPath = [...path, root];
  if (root.id === id) return currentPath;
  for (const child of root.children || []) {
    const found = findPathToNode(child, id, currentPath);
    if (found) return found;
  }
  return null;
}

// Add children to target node in tree
function addChildrenToTreeNode(root: TreeNode, parentId: string, names: string[]): TreeNode {
  if (root.id === parentId) {
    const existingNames = new Set((root.children || []).map((c) => c.name.toLowerCase().trim()));
    const newChildren = [...(root.children || [])];
    names.forEach((name) => {
      const trimmed = name.trim();
      if (trimmed && !existingNames.has(trimmed.toLowerCase())) {
        existingNames.add(trimmed.toLowerCase());
        newChildren.push({
          id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: trimmed,
          children: [],
        });
      }
    });
    return {
      ...root,
      price: newChildren.length > 0 ? undefined : root.price,
      children: newChildren,
    };
  }
  return {
    ...root,
    children: (root.children || []).map((c) => addChildrenToTreeNode(c, parentId, names)),
  };
}

// Delete a node from tree
function deleteNodeFromTree(root: TreeNode, idToDelete: string): TreeNode {
  if (root.id === idToDelete) {
    return { ...root, children: [] };
  }
  return {
    ...root,
    children: (root.children || [])
      .filter((c) => c.id !== idToDelete)
      .map((c) => deleteNodeFromTree(c, idToDelete)),
  };
}

// Rename a node
function renameNodeInTree(root: TreeNode, nodeId: string, newName: string): TreeNode {
  if (root.id === nodeId) {
    return { ...root, name: newName };
  }
  return {
    ...root,
    children: (root.children || []).map((c) => renameNodeInTree(c, nodeId, newName)),
  };
}

// Set price on a node
function setNodePriceInTree(root: TreeNode, nodeId: string, price: string): TreeNode {
  if (root.id === nodeId) {
    return { ...root, price };
  }
  return {
    ...root,
    children: (root.children || []).map((c) => setNodePriceInTree(c, nodeId, price)),
  };
}

// Apply price to all leaf descendants under nodeId
function applyPriceToDescendantLeaves(root: TreeNode, nodeId: string, price: string): TreeNode {
  function applyToAllLeaves(node: TreeNode): TreeNode {
    if (!node.children || node.children.length === 0) {
      return { ...node, price };
    }
    return {
      ...node,
      children: node.children.map(applyToAllLeaves),
    };
  }

  if (root.id === nodeId) {
    return applyToAllLeaves(root);
  }
  return {
    ...root,
    children: (root.children || []).map((c) => applyPriceToDescendantLeaves(c, nodeId, price)),
  };
}

// Copy children from source to target
function copyChildrenBetweenNodes(root: TreeNode, sourceNodeId: string, targetNodeId: string): TreeNode {
  const sourceNode = findNodeInTree(root, sourceNodeId);
  if (!sourceNode || !sourceNode.children || sourceNode.children.length === 0) return root;

  const clonedChildren = sourceNode.children.map(deepCloneWithNewIds);

  function insertCloned(node: TreeNode): TreeNode {
    if (node.id === targetNodeId) {
      const existingNames = new Set((node.children || []).map((c) => c.name.toLowerCase().trim()));
      const combined = [...(node.children || [])];
      clonedChildren.forEach((child) => {
        if (!existingNames.has(child.name.toLowerCase().trim())) {
          existingNames.add(child.name.toLowerCase().trim());
          combined.push(child);
        }
      });
      return {
        ...node,
        price: undefined,
        children: combined,
      };
    }
    return {
      ...node,
      children: (node.children || []).map(insertCloned),
    };
  }

  return insertCloned(root);
}

// Count total leaf nodes under a node
function countLeafNodes(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((acc, child) => acc + countLeafNodes(child), 0);
}

// Collect all leaf products from tree
function collectTreeLeafProducts(
  root: TreeNode,
  nameOrder: "forward" | "reverse",
  batchBasePrice: string,
  rowOverrides: Record<string, { price?: string; excluded?: boolean }>
): BatchCombinationRow[] {
  const results: BatchCombinationRow[] = [];

  function traverse(node: TreeNode, path: string[]) {
    const currentPath = [...path, node.name];
    if (!node.children || node.children.length === 0) {
      const rowId = currentPath.join("__");
      const override = rowOverrides[rowId];
      let formattedName = "";
      if (nameOrder === "reverse") {
        formattedName = [...currentPath].reverse().join(" ");
      } else {
        formattedName = currentPath.join(" ");
      }

      const assignedPrice =
        override?.price !== undefined
          ? override.price
          : node.price !== undefined && node.price !== ""
          ? node.price
          : batchBasePrice;

      results.push({
        id: rowId,
        name: formattedName,
        hierarchy: currentPath,
        price: assignedPrice || "",
        included: override?.excluded ? false : true,
      });
      return;
    }

    for (const child of node.children) {
      traverse(child, currentPath);
    }
  }

  traverse(root, []);
  return results;
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
  const [batchMainCategory, setBatchMainCategory] = useState("Finolex");
  const [batchBasePrice, setBatchBasePrice] = useState("");
  const [batchUnit, setBatchUnit] = useState("COILS");
  const [batchHsn, setBatchHsn] = useState("");
  const [batchGst, setBatchGst] = useState("18");
  const [batchDescription, setBatchDescription] = useState("");

  // Mode Switcher: "tree" (Interactive Nested Tree) vs "matrix" (Flat Level Matrix)
  const [generatorMode, setGeneratorMode] = useState<"tree" | "matrix">("tree");

  // Interactive Tree State
  const [treeRoot, setTreeRoot] = useState<TreeNode>(() =>
    createDefaultCategoryTree("Finolex")
  );
  const [activeDrillDownId, setActiveDrillDownId] = useState<string>("root");
  const [drillDownInput, setDrillDownInput] = useState<string>("");
  const [bulkBranchPriceInput, setBulkBranchPriceInput] = useState<string>("");
  const [copySourceNodeId, setCopySourceNodeId] = useState<string>("");
  const [showCopyBranchModal, setShowCopyBranchModal] = useState<boolean>(false);
  const [treeSearchQuery, setTreeSearchQuery] = useState<string>("");
  const [treeExpandedNodes, setTreeExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    wires: true,
    "w-180": true,
    "w-180-fr": true,
    "w-180-frls": true,
    "w-90": true,
    pipes: true,
    "p-20mm": true,
  });

  // Keep tree root name synced to brand/main category
  useEffect(() => {
    if (batchMainCategory.trim() && treeRoot.name !== batchMainCategory.trim()) {
      setTreeRoot((prev) => ({ ...prev, name: batchMainCategory.trim() }));
    }
  }, [batchMainCategory]);

  const activeDrillDownNode = useMemo(() => {
    return findNodeInTree(treeRoot, activeDrillDownId) || treeRoot;
  }, [treeRoot, activeDrillDownId]);

  const activeDrillDownPath = useMemo(() => {
    return findPathToNode(treeRoot, activeDrillDownNode.id) || [treeRoot];
  }, [treeRoot, activeDrillDownNode]);

  // Tree action handlers
  const handleAddChildrenToActiveNode = (customText?: string) => {
    const textToAdd = customText !== undefined ? customText : drillDownInput;
    const pieces = textToAdd
      .split(/[,;\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (pieces.length === 0) return;

    setTreeRoot((prev) => addChildrenToTreeNode(prev, activeDrillDownNode.id, pieces));
    if (customText === undefined) {
      setDrillDownInput("");
    }
    setTreeExpandedNodes((prev) => ({ ...prev, [activeDrillDownNode.id]: true }));
    showLocalToast(`Added ${pieces.length} sub-categories under "${activeDrillDownNode.name}"!`);
  };

  const handleDeleteTreeNode = (nodeId: string, nodeName: string) => {
    if (nodeId === "root") {
      setTreeRoot((prev) => ({ ...prev, children: [] }));
      showLocalToast("Cleared all sub-categories from catalog tree.");
      return;
    }
    setTreeRoot((prev) => deleteNodeFromTree(prev, nodeId));
    if (activeDrillDownId === nodeId) {
      const path = findPathToNode(treeRoot, nodeId);
      if (path && path.length > 1) {
        setActiveDrillDownId(path[path.length - 2].id);
      } else {
        setActiveDrillDownId("root");
      }
    }
    showLocalToast(`Removed "${nodeName}" and its sub-categories.`);
  };

  const handleSetTreeNodePrice = (nodeId: string, priceVal: string) => {
    setTreeRoot((prev) => setNodePriceInTree(prev, nodeId, priceVal));
  };

  const handleApplyBulkPriceToBranch = (nodeId: string, priceVal: string) => {
    if (!priceVal || isNaN(Number(priceVal)) || Number(priceVal) < 0) {
      showLocalToast("Please enter a valid rate to apply.");
      return;
    }
    setTreeRoot((prev) => applyPriceToDescendantLeaves(prev, nodeId, priceVal));
    setBulkBranchPriceInput("");
    showLocalToast(`Applied ₹${priceVal} to all leaf products under "${activeDrillDownNode.name}"!`);
  };

  const handleCopyChildren = (sourceId: string, targetId: string) => {
    setTreeRoot((prev) => copyChildrenBetweenNodes(prev, sourceId, targetId));
    setShowCopyBranchModal(false);
    setCopySourceNodeId("");
    showLocalToast("Copied specifications successfully!");
  };

  const handleResetToSampleTree = () => {
    setTreeRoot(createDefaultCategoryTree(batchMainCategory || "Finolex"));
    setActiveDrillDownId("root");
    showLocalToast("Loaded Finolex sample tree with wires & pipes!");
  };

  const handleClearTree = () => {
    setTreeRoot({
      id: "root",
      name: batchMainCategory.trim() || "Main Category",
      children: [],
    });
    setActiveDrillDownId("root");
    showLocalToast("Started fresh with an empty category tree!");
  };

  const nodesWithChildren = useMemo(() => {
    const list: { id: string; name: string; pathStr: string; count: number }[] = [];
    function scan(node: TreeNode, path: string[]) {
      const currentPath = [...path, node.name];
      if (node.children && node.children.length > 0) {
        if (node.id !== activeDrillDownNode.id) {
          list.push({
            id: node.id,
            name: node.name,
            pathStr: currentPath.join(" > "),
            count: node.children.length,
          });
        }
        for (const child of node.children) {
          scan(child, currentPath);
        }
      }
    }
    scan(treeRoot, []);
    return list;
  }, [treeRoot, activeDrillDownNode.id]);

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

  // Tree Mode Leaf Products
  const treeLeafProducts = useMemo<BatchCombinationRow[]>(() => {
    return collectTreeLeafProducts(treeRoot, nameOrder, batchBasePrice, rowOverrides);
  }, [treeRoot, nameOrder, batchBasePrice, rowOverrides]);

  // Active Combinations based on selected generatorMode ("tree" vs "matrix")
  const activeCombinations = useMemo<BatchCombinationRow[]>(() => {
    return generatorMode === "tree" ? treeLeafProducts : combinations;
  }, [generatorMode, treeLeafProducts, combinations]);

  const includedCount = activeCombinations.filter((r) => r.included).length;

  // Toggle all combinations inclusion
  const handleToggleSelectAll = () => {
    const allSelected = includedCount === activeCombinations.length;
    const next: Record<string, { price?: string; excluded?: boolean }> = { ...rowOverrides };
    activeCombinations.forEach((r) => {
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
    if (activeCombinations.length === 0) return [];

    const map = new Map<string, CombinationBranch>();

    activeCombinations.forEach((row) => {
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
  }, [activeCombinations, nameOrder, batchBasePrice]);

  // Filter combinations based on search query
  const filteredCombinations = useMemo(() => {
    if (!matrixSearch.trim()) return activeCombinations;
    const q = matrixSearch.toLowerCase().trim();
    return activeCombinations.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.hierarchy.some((h) => h.toLowerCase().includes(q))
    );
  }, [activeCombinations, matrixSearch]);

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
      activeCombinations.forEach((r) => {
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

    const activeRows = activeCombinations.filter((r) => r.included);
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

            {/* Card 1: Brand & Shared Defaults */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Brand / Main Category */}
                <div className="flex-1 max-w-sm">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Main Category / Brand <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={batchMainCategory}
                    onChange={(e) => setBatchMainCategory(e.target.value)}
                    placeholder="e.g. Finolex, Polycab"
                    className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>

                {/* Measurement Unit */}
                <div className="w-32">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={batchUnit}
                    onChange={(e) => setBatchUnit(e.target.value)}
                    placeholder="COILS"
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold uppercase text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>

                {/* GST */}
                <div className="w-24">
                  <label className="block text-xs font-bold text-gray-700 mb-1">GST %</label>
                  <input
                    type="number"
                    value={batchGst}
                    onChange={(e) => setBatchGst(e.target.value)}
                    placeholder="18"
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>

                {/* Quick Sample / Reset buttons */}
                <div className="flex items-center space-x-2 pt-2 lg:pt-4">
                  <button
                    type="button"
                    onClick={handleResetToSampleTree}
                    className="px-3 py-2 text-xs font-bold text-brand bg-brand/5 hover:bg-brand/10 border border-brand/20 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                    title="Reload Finolex sample structure"
                  >
                    <RotateCcw size={13} />
                    <span>Load Finolex Sample</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearTree}
                    className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                    title="Clear all categories and start blank"
                  >
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Cascading Category Builder */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-4">
              {/* Breadcrumb Trail */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center flex-wrap gap-1.5 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1 flex items-center gap-1">
                    <FolderTree size={12} className="text-brand" />
                    Current Level:
                  </span>
                  {activeDrillDownPath.map((node, idx) => {
                    const isLast = idx === activeDrillDownPath.length - 1;
                    return (
                      <React.Fragment key={node.id}>
                        <button
                          type="button"
                          onClick={() => setActiveDrillDownId(node.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                            isLast
                              ? "bg-brand text-white shadow-xs"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }`}
                        >
                          {idx === 0 ? <Folder size={11} /> : <CornerDownRight size={11} />}
                          <span>{node.name}</span>
                        </button>
                        {!isLast && <ChevronRight size={12} className="text-gray-400 shrink-0" />}
                      </React.Fragment>
                    );
                  })}
                </div>

                {activeDrillDownPath.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const parentNode = activeDrillDownPath[activeDrillDownPath.length - 2];
                      if (parentNode) setActiveDrillDownId(parentNode.id);
                    }}
                    className="text-xs font-bold text-brand hover:underline flex items-center space-x-1 cursor-pointer shrink-0 ml-2"
                  >
                    <ArrowUp size={13} />
                    <span>Back to {activeDrillDownPath[activeDrillDownPath.length - 2].name}</span>
                  </button>
                )}
              </div>

              {/* Active Node Workspace */}
              <div className="space-y-4">
                {/* Sub-categories input & Presets */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Add sub-categories inside <span className="text-brand font-black">&quot;{activeDrillDownNode.name}&quot;</span>:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={drillDownInput}
                      onChange={(e) => setDrillDownInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddChildrenToActiveNode();
                        }
                      }}
                      placeholder="Type sub-categories (comma-separated, e.g. 180 mts, 90 mts or red, blue, green)"
                      className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddChildrenToActiveNode()}
                      className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>+ Add</span>
                    </button>
                  </div>

                  {/* Quick Suggestions */}
                  <div className="flex items-center flex-wrap gap-1 pt-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1">
                      Suggestions:
                    </span>
                    {[
                      { label: "Wires & Pipes", val: "wires, pipes" },
                      { label: "Lengths", val: "180 mts, 90 mts" },
                      { label: "Grades", val: "fr, frls" },
                      { label: "Wire Sizes", val: "1.0 sqmm, 1.5 sqmm, 2.5 sqmm, 4.0 sqmm" },
                      { label: "Colors", val: "red, blue, green, yellow, black" },
                      { label: "Pipe Sizes", val: "20mm, 25mm, 32mm" },
                      { label: "Pipe Thickness", val: "heavy, light" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleAddChildrenToActiveNode(item.val)}
                        className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-brand/10 hover:text-brand text-gray-600 text-[10px] font-bold border border-gray-200 transition-colors cursor-pointer"
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Replicate / Copy tool helper */}
                {nodesWithChildren.length > 0 && (
                  <div className="flex items-center space-x-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                    <Copy size={13} className="text-brand shrink-0" />
                    <span className="text-gray-600 font-semibold text-[11px] shrink-0">
                      Copy sub-categories from:
                    </span>
                    <select
                      value={copySourceNodeId}
                      onChange={(e) => setCopySourceNodeId(e.target.value)}
                      className="px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-gray-800 border border-blue-200 flex-1 max-w-xs focus:outline-none"
                    >
                      <option value="">-- Choose a branch --</option>
                      {nodesWithChildren.map((src) => (
                        <option key={src.id} value={src.id}>
                          {src.pathStr} ({src.count} items)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!copySourceNodeId}
                      onClick={() => handleCopyChildren(copySourceNodeId, activeDrillDownNode.id)}
                      className="px-3 py-1 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover disabled:opacity-40 cursor-pointer"
                    >
                      Copy Here
                    </button>
                  </div>
                )}

                {/* Active Category Children or Leaf Pricing */}
                {activeDrillDownNode.children.length === 0 ? (
                  /* Leaf final product */
                  <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-emerald-900">
                        🌿 Final Product Tier: &quot;{activeDrillDownNode.name}&quot;
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        This category has no further sub-categories. Enter its commercial selling price:
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-emerald-900">Rate:</span>
                      <div className="relative w-32">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={activeDrillDownNode.price || ""}
                          onChange={(e) => handleSetTreeNodePrice(activeDrillDownNode.id, e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-2.5 py-1.5 bg-white rounded-xl text-sm font-bold text-gray-900 border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold">
                          ₹
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* List of children */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">
                        Sub-categories in &quot;{activeDrillDownNode.name}&quot; ({activeDrillDownNode.children.length}):
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Click &quot;Open &gt;&quot; to drill down into any sub-category
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {activeDrillDownNode.children.map((child) => {
                        const childIsLeaf = !child.children || child.children.length === 0;
                        return (
                          <div
                            key={child.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              childIsLeaf
                                ? "bg-emerald-50/40 border-emerald-200"
                                : "bg-gray-50 border-gray-200 hover:border-brand/40"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs">{childIsLeaf ? "🌿" : "📁"}</span>
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {child.name}
                                </p>
                              </div>
                              {childIsLeaf ? (
                                <div className="flex items-center space-x-1 mt-1">
                                  <span className="text-[10px] font-bold text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={child.price || ""}
                                    onChange={(e) => handleSetTreeNodePrice(child.id, e.target.value)}
                                    placeholder="Rate"
                                    className="w-20 px-1.5 py-0.5 bg-white rounded border border-emerald-300 text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                  />
                                </div>
                              ) : (
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  {child.children.length} sub-categories
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setActiveDrillDownId(child.id)}
                                className="px-2 py-1 bg-white hover:bg-brand hover:text-white text-gray-700 text-[11px] font-bold border border-gray-200 rounded-lg transition-colors cursor-pointer"
                              >
                                {childIsLeaf ? "+ Sub" : "Open >"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTreeNode(child.id, child.name)}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                title={`Delete ${child.name}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Generated Products Preview & Creation */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand" />
                    <span>Generated Catalog Products ({includedCount} Active)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    All leaf combinations automatically compiled from your categories above.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-bold text-gray-600 hover:text-brand px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {includedCount === activeCombinations.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
              </div>

              {/* Search filter */}
              {activeCombinations.length > 0 && (
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    placeholder="Filter products (e.g. 180 mts, pipes, red)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 rounded-xl text-xs font-medium text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              )}

              {/* Products list */}
              {activeCombinations.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No products created yet. Add sub-categories above to generate catalog products.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {filteredCombinations.map((row, idx) => (
                    <div
                      key={row.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        row.included
                          ? "bg-white border-gray-200/80 hover:border-brand/40"
                          : "bg-gray-50/60 border-gray-200/40 opacity-50"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setRowOverrides((prev) => ({
                              ...prev,
                              [row.id]: { ...prev[row.id], excluded: !checked },
                            }));
                          }}
                          className="w-4 h-4 rounded accent-brand cursor-pointer shrink-0"
                        />
                        <span className="text-[10px] font-mono text-gray-400 w-5 text-right shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{row.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium truncate">
                            {row.hierarchy.join(" > ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="relative w-28">
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
                            className="w-full pl-5 pr-2 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand disabled:bg-gray-100"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                            ₹
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCombination(row.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Exclude product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-gray-500 font-medium">
                  Ready to create <strong className="text-brand font-black">{includedCount}</strong> products in your commercial catalog.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchSubmit}
                    disabled={loading || includedCount === 0}
                    className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
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
