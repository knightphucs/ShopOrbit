"use client";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
}

export default function Pagination({ pageIndex, pageSize, totalCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageIndex", newPage.toString());
    router.push(`/products?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex gap-2">
      <button
        disabled={pageIndex === 1}
        onClick={() => handlePageChange(pageIndex - 1)}
        className="px-4 py-2 border rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span className="px-4 py-2">
        Page {pageIndex} of {totalPages}
      </span>
      <button
        disabled={pageIndex === totalPages}
        onClick={() => handlePageChange(pageIndex + 1)}
        className="px-4 py-2 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
