import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductsGrid from "@/features/catalog/components/ProductsGrid";
import { Suspense } from "react";

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      <Header />

      <main className="grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            All Products
          </h1>
          <p className="text-gray-500 mt-2">
            Browse our extensive collection of premium technology.
          </p>
        </div>

        {/* Suspense là bắt buộc khi dùng useSearchParams trong Client Component của Next.js */}
        <Suspense fallback={<div>Loading products...</div>}>
          <ProductsGrid />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
