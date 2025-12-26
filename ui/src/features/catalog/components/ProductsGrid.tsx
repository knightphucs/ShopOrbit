// src/features/catalog/components/ProductsGrid.tsx
"use client";
import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import api from "@/src/lib/axios";
import type { Product, PagedResult, ProductParams } from "@/src/types";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

export default function ProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState(false);

  const [params, setParams] = useState<ProductParams>({
    pageIndex: 1,
    pageSize: 8,
    search: "",
    sort: "",
    minPrice: undefined,
    maxPrice: undefined,
    // categoryId: undefined, // Tạm thời bỏ qua filter theo ID
  });

  const [searchInput, setSearchInput] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => {
      setParams((p) => ({ ...p, pageIndex: 1, search: searchInput.trim() }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<PagedResult<Product>>("/api/v1/Products", {
        params,
      });
      const items = (data.items ?? (data as any).data ?? []).map(
        (p: Product) => ({
          ...p,
          imageUrl: p.imageUrl || "",
        })
      );
      setProducts(items);
      setTotalPages(data.totalPages ?? (data as any).totalPages ?? 1);
    } catch (e: any) {
      setError(e?.message || "Failed to load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.pageIndex,
    params.search,
    params.sort,
    params.minPrice,
    params.maxPrice,
  ]);

  return (
    <div className="w-full">
      {/* --- Toolbar --- */}
      <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 pl-9 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        {/* Filter & Sort Buttons */}
        <div className="flex items-center gap-3">
          <select
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-black"
            value={params.sort ?? ""}
            onChange={(e) =>
              setParams((p) => ({ ...p, sort: e.target.value, pageIndex: 1 }))
            }
          >
            <option value="">Sort by: Default</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
              showFilters
                ? "bg-gray-100 text-black border-gray-400"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={14} /> Price Filter
          </button>
        </div>
      </div>

      {/* --- Filter Panel (Toggle) --- */}
      {showFilters && (
        <div className="mb-8 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-2 max-w-lg ml-auto">
          {/* Đã xóa Category ID Input */}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Min Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                placeholder="0"
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    minPrice: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                    pageIndex: 1,
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2 pl-6 text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Max Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                placeholder="Any"
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    maxPrice: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                    pageIndex: 1,
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2 pl-6 text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- Product Grid --- */}
      {loading ? (
        <div className="py-20 text-center text-gray-500">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-sm">Loading inventory...</p>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500">
          <p>No products found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchInput("");
              setParams({ pageIndex: 1, pageSize: 8 });
            }}
            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* --- Pagination --- */}
      {products.length > 0 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            disabled={params.pageIndex === 1}
            onClick={() =>
              setParams((p) => ({
                ...p,
                pageIndex: Math.max(1, (p.pageIndex ?? 1) - 1),
              }))
            }
            className="flex h-9 w-9 items-center justify-center rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="px-4 text-sm font-medium text-gray-700">
            Page {params.pageIndex} of {totalPages}
          </span>

          <button
            disabled={params.pageIndex === totalPages}
            onClick={() =>
              setParams((p) => ({
                ...p,
                pageIndex: Math.min(totalPages ?? 1, (p.pageIndex ?? 1) + 1),
              }))
            }
            className="flex h-9 w-9 items-center justify-center rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
