"use client";

import { Product } from "@/src/types";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-4/3 overflow-hidden bg-gray-100"
      >
        <Image
          src={
            product.imageUrl || "https://placehold.co/600x400.png?text=No+Image"
          }
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Category Tag */}
        <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm">
          {product.categoryName}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-base font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-bold text-gray-900">
            ${product.price.toLocaleString()}
          </p>

          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-blue-600 hover:text-white"
            aria-label="Add to cart"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
