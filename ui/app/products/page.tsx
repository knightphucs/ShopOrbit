import {
  getProducts,
  getCategories,
} from "@/features/catalog/services/catalogApi";
import ProductCard from "@/features/catalog/components/ProductCard";
import ProductFilters from "@/features/catalog/components/ProductFilters";
import { ProductParams } from "@/types";
import SortSelect from "./_components/SortSelect";
import Pagination from "./_components/Pagination";

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;

  const apiParams: ProductParams = {
    pageIndex: Number(resolvedSearchParams.pageIndex) || 1,
    pageSize: 10,
    search: resolvedSearchParams.search,
    categoryId: resolvedSearchParams.categoryId,
    sort: resolvedSearchParams.sort,
    minPrice: resolvedSearchParams.minPrice
      ? Number(resolvedSearchParams.minPrice)
      : undefined,
    maxPrice: resolvedSearchParams.maxPrice
      ? Number(resolvedSearchParams.maxPrice)
      : undefined,
  };

  const [productsData, categoriesData] = await Promise.all([
    getProducts(apiParams),
    getCategories(),
  ]);

  return (
    <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-baseline justify-between border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Products
          </h1>

          {/* Sort Dropdown đơn giản */}
          <div className="flex items-center">
            <SortSelect />
          </div>
        </div>

        <section aria-labelledby="products-heading" className="pb-24 pt-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
            {/* Sidebar Filters */}
            <form className="hidden lg:block">
              <ProductFilters categories={categoriesData.items} />
            </form>

            {/* Product Grid */}
            <div className="lg:col-span-3">
              {productsData.items.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No products found.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                  {productsData.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              <div className="mt-10 flex justify-center space-x-2">
                <Pagination
                  pageIndex={productsData.pageIndex}
                  totalCount={productsData.totalCount}
                  pageSize={productsData.pageSize}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
