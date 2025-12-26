"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Thêm hook
import ProductCard from "./ProductCard";
import api from "@/lib/axios";
import type { Product, PagedResult, ProductParams } from "@/types";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

export default function ProductsGrid() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Đọc URL

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState(false);

  // Khởi tạo params từ URL
  const [params, setParams] = useState<ProductParams>({
    pageIndex: 1,
    pageSize: 8,
    search: searchParams.get("search") || "", // Lấy từ URL
    sort: "",
    categoryId: searchParams.get("categoryId") || undefined, // Lấy từ URL
  });

  const [searchInput, setSearchInput] = useState<string>(
    searchParams.get("search") || ""
  );

  // Update params khi URL thay đổi (Ví dụ: Search từ Header)
  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || "";
    const categoryFromUrl = searchParams.get("categoryId") || undefined;

    setSearchInput(searchFromUrl);
    setParams((prev) => ({
      ...prev,
      pageIndex: 1,
      search: searchFromUrl,
      categoryId: categoryFromUrl,
    }));
  }, [searchParams]);

  // Debounce Search Input nội bộ
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== params.search) {
        setParams((p) => ({ ...p, pageIndex: 1, search: searchInput.trim() }));
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch Data
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<PagedResult<Product>>("/api/v1/Products", {
        params,
      });

      let items: Product[] = [];
      if (data && Array.isArray((data as any).data)) {
        items = (data as any).data;
      } else if (data && Array.isArray(data.items)) {
        items = data.items;
      }

      const mappedItems = items.map((p) => ({
        ...p,
        imageUrl: p.imageUrl || "",
      }));

      setProducts(mappedItems);
      setTotalPages(data.totalPages ?? (data as any).totalPages ?? 1);
    } catch (e: any) {
      setError("Failed to connect to server.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    params.pageIndex,
    params.search,
    params.sort,
    params.minPrice,
    params.maxPrice,
    params.categoryId,
  ]);

  return (
    <div className="w-full">
      {/* --- Toolbar --- */}
      <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-500">
          Showing results for{" "}
          {params.categoryId ? "Selected Category" : "All Products"}
          {params.search && (
            <span>
              {" "}
              matching "<strong>{params.search}</strong>"
            </span>
          )}
        </div>

        {/* Filter & Sort Buttons */}
        <div className="flex items-center gap-3 ml-auto">
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
            <SlidersHorizontal size={14} /> Filter
          </button>
        </div>
      </div>

      {/* --- Filter Panel --- */}
      {showFilters && (
        <div className="mb-8 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 max-w-lg ml-auto border border-gray-100">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-4/3 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-8 text-center text-sm text-red-600">
          {error}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 py-24 text-center text-gray-500">
          <p className="text-lg font-medium text-gray-900">No products found</p>
          <p>Try adjusting your search or filters.</p>
          <button
            onClick={() => {
              setSearchInput("");
              router.push("/products"); // Reset URL
            }}
            className="mt-4 text-sm font-bold text-blue-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* --- Pagination --- */}
      {products.length > 0 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            disabled={params.pageIndex === 1}
            onClick={() =>
              setParams((p) => ({
                ...p,
                pageIndex: Math.max(1, (p.pageIndex ?? 1) - 1),
              }))
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:border-black disabled:opacity-30 disabled:hover:border-gray-200 transition-all"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="px-4 text-sm font-medium text-gray-900">
            Page {params.pageIndex} / {totalPages}
          </span>

          <button
            disabled={params.pageIndex === totalPages}
            onClick={() =>
              setParams((p) => ({
                ...p,
                pageIndex: Math.min(totalPages ?? 1, (p.pageIndex ?? 1) + 1),
              }))
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:border-black disabled:opacity-30 disabled:hover:border-gray-200 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
