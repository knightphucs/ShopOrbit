"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import api from "@/lib/axios";
import type { Product, PagedResult } from "@/types";
import { ArrowRight } from "lucide-react";

interface Props {
  title: string;
  categoryId?: string;
  sort?: string;
  limit?: number;
}

export default function ProductSection({
  title,
  categoryId,
  sort,
  limit = 4,
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get<PagedResult<Product>>(
          "/api/v1/Products",
          {
            params: {
              pageIndex: 1,
              pageSize: limit,
              categoryId: categoryId,
              sort: sort,
            },
          }
        );

        const items = (data.items ?? (data as any).data ?? []).map(
          (p: Product) => ({
            ...p,
            imageUrl: p.imageUrl || "",
          })
        );

        setProducts(items);
      } catch (error) {
        console.error(`Failed to load section ${title}`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, sort, limit, title]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-12 border-b border-gray-100 last:border-0">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {title}
            </h2>
            <div className="h-1 w-20 bg-black mt-2 rounded-full"></div>
          </div>

          <Link
            href={
              categoryId ? `/products?categoryId=${categoryId}` : "/products"
            }
            className="group flex items-center text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
          >
            View All
            <ArrowRight
              size={16}
              className="ml-1 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Grid products */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="aspect-4/3 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
