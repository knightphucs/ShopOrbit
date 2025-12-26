"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { catalogApi } from "@/features/catalog/services/catalogApi";

// Nhận params ID từ URL
export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Unwrap params (Yêu cầu của Next.js 15)
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  
  // State form
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // 1. Load dữ liệu cũ khi vào trang
  useEffect(() => {
    const loadData = async () => {
      try {
        // Gọi API lấy chi tiết Category
        const category = await catalogApi.getCategoryById(id);
        
        // Đổ dữ liệu vào Form
        setFormData({
          name: category.name,
          description: category.description || "", // Nếu null thì để rỗng
        });
      } catch (error) {
        alert("Không tìm thấy danh mục hoặc lỗi kết nối!");
        router.push("/admin/categories"); // Đẩy về trang danh sách nếu lỗi
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, router]);

  // 2. Xử lý lưu thay đổi (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Gọi API Update
      await catalogApi.updateCategory(id, formData);
      alert("Cập nhật thành công!");
      router.push("/admin/categories"); // Quay về danh sách
    } catch (error) {
      console.error(error);
      alert("Lỗi khi cập nhật!");
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Sửa Danh mục</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Tên Danh mục */}
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

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea 
            className="mt-1 block w-full border border-gray-300 rounded p-2 h-32"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Nút bấm */}
        <div className="flex gap-4 pt-2">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="w-1/3 bg-gray-500 text-white p-3 rounded font-medium hover:bg-gray-600"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            className="w-2/3 bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700"
          >
            LƯU THAY ĐỔI
          </button>
        </div>

      </form>
    </div>
  );
}