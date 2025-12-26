"use client";

import { Category } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Props {
  categories: Category[];
}

export default function ProductFilters({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("pageIndex", "1");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Categories</h3>
        <ul className="mt-2 space-y-2">
          <li>
            <button
              onClick={() => handleFilterChange("categoryId", "")}
              className={`text-sm ${
                !searchParams.get("categoryId")
                  ? "font-bold text-blue-600"
                  : "text-gray-600"
              }`}
            >
              All Categories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => handleFilterChange("categoryId", cat.id)}
                className={`text-sm ${
                  searchParams.get("categoryId") === cat.id
                    ? "font-bold text-blue-600"
                    : "text-gray-600"
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Filter */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Price Range</h3>
        <div className="flex items-center space-x-2 mt-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-20 border rounded px-2 py-1 text-sm"
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-20 border rounded px-2 py-1 text-sm"
          />
        </div>
        <button
          onClick={() => {
            handleFilterChange("minPrice", minPrice);
            handleFilterChange("maxPrice", maxPrice);
          }}
          className="mt-2 w-full bg-black text-white py-1 rounded text-sm hover:bg-gray-800"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
