"use client";
import { useEffect, useState } from "react";
import { catalogApi } from "@/features/catalog/services/catalogApi";
import Link from "next/link";
import { Plus, Search, Filter, Edit2, Trash2, MoreHorizontal } from "lucide-react";
// 1. Cập nhật Interface: Thêm imageUrl
interface Product {
  id: string;
  name: string;
  price: number;
  categoryName: string;
  imageUrl?: string; // <--- Thêm dòng này
  specifications?: Record<string, string>;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data
  const fetchProducts = async () => {
    try {
      const data = await catalogApi.getProducts(1, 100);
      setProducts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Xử lý xóa
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await catalogApi.deleteProduct(id);
      alert("Đã xóa thành công!");
      fetchProducts();
    } catch (error) {
      alert("Lỗi khi xóa!");
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  const renderSpecs = (specs?: Record<string, string>) => {
    if (!specs) return <span className="text-gray-400 italic">Không có thông số</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(specs).slice(0, 3).map(([k, v]) => (
          <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {k}: {v}
          </span>
        ))}
        {Object.keys(specs).length > 3 && (
            <span className="text-xs text-gray-500 self-center">+{Object.keys(specs).length - 3}</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sản phẩm</h1>
          <p className="text-sm text-gray-500">Quản lý kho hàng và danh mục sản phẩm của bạn.</p>
        </div>
        <Link 
          href="/admin/products/create" 
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          Thêm sản phẩm
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
            <Filter size={18} />
            Bộ lọc
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
                <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông số</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
                {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0 rounded-lg border border-gray-200 overflow-hidden bg-white">
                                <img 
                                    src={product.imageUrl || "https://placehold.co/100?text=No+Img"} 
                                    alt={product.name} 
                                    className="h-full w-full object-contain"
                                    onError={(e) => e.currentTarget.src = "https://placehold.co/100?text=Error"}
                                />
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-500">ID: {product.id.slice(0, 8)}...</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.categoryName}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">${product.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                        {renderSpecs(product.specifications)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                            <Link 
                                href={`/admin/products/${product.id}`} 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Sửa"
                            >
                                <Edit2 size={18} />
                            </Link>
                            <button 
                                onClick={() => handleDelete(product.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}