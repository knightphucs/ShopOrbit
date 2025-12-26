// src/app/page.tsx
import Header from "@/components/layout/Header";
import ProductSection from "@/features/catalog/components/ProductSection";
import Link from "next/link";
import { Category } from "@/types";

// Hàm lấy danh mục (chạy trên Server)
async function getCategories(): Promise<Category[]> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://127.0.0.1:5000";

  try {
    const res = await fetch(`${apiUrl}/api/v1/categories?pageSize=20`, {
      cache: "no-store", // Luôn lấy mới nhất
    });

    if (!res.ok) {
      console.error("❌ API Error:", res.status);
      return [];
    }

    const jsonResponse = await res.json();

    if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
      return jsonResponse.data;
    }

    if (Array.isArray(jsonResponse)) {
      return jsonResponse;
    }

    console.warn("⚠️ API trả về format lạ:", jsonResponse);
    return [];
  } catch (error) {
    console.error("❌ Fetch failed (Network/Parse):", error);
    return [];
  }
}

export default async function Home() {
  const categories = await getCategories();
  const displayCategories = categories;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />

      <main>
        {/* HERO SECTION */}
        <section className="bg-gray-50 py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <span className="mb-4 inline-block px-3 py-1 text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 rounded-full">
              New Collection 2025
            </span>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
              Technology <br />
              <span className="text-gray-400">Redefined.</span>
            </h1>
            <div className="flex justify-center gap-4 mt-8">
              <Link
                href="/products"
                className="rounded-full bg-black px-8 py-4 text-sm font-bold text-white hover:bg-gray-800"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </section>

        {/* --- SECTION 1: LATEST ARRIVALS --- */}
        <ProductSection title="Latest Arrivals" sort="dateDesc" limit={4} />

        {/* --- DYNAMIC SECTIONS --- */}
        {displayCategories.map((category) => (
          <ProductSection
            key={category.id}
            title={category.name}
            categoryId={category.id}
            limit={4}
          />
        ))}

        {/* --- PROMO BANNER --- */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            {/* ... Banner content ... */}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white py-12 text-center">
        <p className="text-sm text-gray-500">© 2024 ShopOrbit.</p>
      </footer>
    </div>
  );
}
