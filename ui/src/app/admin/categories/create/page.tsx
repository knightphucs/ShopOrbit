"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { catalogApi } from "@/features/catalog/services/catalogApi";

export default function CreateCategoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await catalogApi.createCategory(formData);
      alert("Tạo thành công!");
      router.push("/admin/categories");
    } catch (error) {
      alert("Lỗi khi tạo!");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Thêm Danh mục</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tên danh mục</label>
          <input 
            type="text" 
            className="mt-1 block w-full border border-gray-300 rounded p-2"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea 
            className="mt-1 block w-full border border-gray-300 rounded p-2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">
          LƯU DANH MỤC
        </button>
      </form>
    </div>
  );
}