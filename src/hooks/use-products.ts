import { useState, useEffect, useCallback, useRef } from "react";
import { Product } from "@/types";

interface UseProductsOptions {
  initialFilter?: string;
  limit?: number;
  categoryId?: string;
  lowStock?: boolean;
  supplierId?: string;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterByCategory: (categoryId: string | null) => void;
  filterBySupplier: (supplierId: string | null) => void;
  filterByStock: (option: "all" | "low" | "out") => void;
  sortBy: (field: "name" | "sku" | "stock" | "price") => void;
  sortDirection: "asc" | "desc";
  toggleSortDirection: () => void;
  resetFilters: () => void;
  hasMoreItems: boolean;
  loadMore: () => void;
}

export function useProducts({
  initialFilter = "",
  limit = 20,
  categoryId,
  lowStock = false,
  supplierId,
}: UseProductsOptions = {}): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTermState] = useState(initialFilter);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(
    categoryId || null
  );
  const [currentSupplierId, setCurrentSupplierId] = useState<string | null>(
    supplierId || null
  );
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">(
    lowStock ? "low" : "all"
  );
  const [sortField, setSortField] = useState<
    "name" | "sku" | "stock" | "price"
  >("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore && !hasMore) return;

      const newPage = isLoadMore ? page + 1 : 1;
      if (!isLoadMore) setLoading(true);

      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (currentCategoryId) params.append("categoryId", currentCategoryId);
        if (currentSupplierId) params.append("supplierId", currentSupplierId);
        if (stockFilter !== "all") params.append("stock", stockFilter);
        params.append("sort", sortField);
        params.append("direction", sortDirection);
        params.append("page", newPage.toString());
        params.append("limit", limit.toString());

        const response = await fetch(`/api/products?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar produtos");
        }

        if (isLoadMore) {
          setProducts((current) => [...current, ...data.products]);
        } else {
          setProducts(data.products);
        }

        setHasMore(data.products.length === limit);
        setPage(newPage);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao buscar produtos"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      searchTerm,
      currentCategoryId,
      currentSupplierId,
      stockFilter,
      sortField,
      sortDirection,
      page,
      hasMore,
      limit,
    ]
  );

  useEffect(() => {
    setPage(1);
    fetchProducts();
  }, [
    searchTerm,
    currentCategoryId,
    currentSupplierId,
    stockFilter,
    sortField,
    sortDirection,
    fetchProducts,
  ]);

  const debouncedSetSearchTerm = useCallback(
    (term: string) => {
      const handler = setTimeout(() => {
        setSearchTermState(term);
      }, 300);

      return () => clearTimeout(handler);
    },
    [setSearchTermState]
  );

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    const setSearchTerm = (term: string) => {
      if (cleanupFn) cleanupFn();
      cleanupFn = debouncedSetSearchTerm(term);
    };

    setSearchTermFn.current = setSearchTerm;

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [debouncedSetSearchTerm]);


  const setSearchTermFn = useRef<(term: string) => void>(() => {});

  const filterByCategory = (catId: string | null) => {
    setCurrentCategoryId(catId);
  };

  const filterBySupplier = (supId: string | null) => {
    setCurrentSupplierId(supId);
  };

  const filterByStock = (option: "all" | "low" | "out") => {
    setStockFilter(option);
  };

  const sortBy = (field: "name" | "sku" | "stock" | "price") => {
    if (field === sortField) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  };

  const resetFilters = () => {
    setSearchTermState("");
    setCurrentCategoryId(null);
    setCurrentSupplierId(null);
    setStockFilter("all");
    setSortField("name");
    setSortDirection("asc");
  };

  const loadMore = () => {
    fetchProducts(true);
  };

  return {
    products,
    loading,
    error,
    searchTerm,
    setSearchTerm: setSearchTermFn.current,
    filterByCategory,
    filterBySupplier,
    filterByStock,
    sortBy,
    sortDirection,
    toggleSortDirection,
    resetFilters,
    hasMoreItems: hasMore,
    loadMore,
  };
}
