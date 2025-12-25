"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <select
      onChange={handleSortChange}
      defaultValue={searchParams.get("sort") || ""}
      className="border-gray-300 text-sm rounded-md p-2"
    >
      <option value="">Sort By: Default</option>
      <option value="priceAsc">Price: Low to High</option>
      <option value="priceDesc">Price: High to Low</option>
      <option value="name">Name</option>
    </select>
  );
}
