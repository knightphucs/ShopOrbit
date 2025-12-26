"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { catalogApi } from "@/features/catalog/services/catalogApi";
import { 
  Save, 
  Plus, 
  Upload, 
  ArrowLeft, 
  Image as ImageIcon, 
  Trash2,
  Package,
  DollarSign,
  Layers
} from "lucide-react";

// Định nghĩa kiểu dữ liệu cho Category
interface Category {
  id: string;
  name: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  
  // State form
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    stockQuantity: 10,
    description: "",
    categoryId: "", // Sẽ tự chọn category đầu tiên khi load xong
    imageFile: "" 
  });

  // State hỗ trợ
  const [isUploading, setIsUploading] = useState(false);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);
  
  // State danh sách Category
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // 1. Load danh sách Category khi vào trang
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await catalogApi.getCategories(1, 100); // Lấy 100 mục đầu
        const cats = res.data || [];
        setCategories(cats);
        
        // Nếu có danh mục, chọn mặc định cái đầu tiên
        if (cats.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
        }
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  // 2. Upload Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "eargasm_preset"); 
    data.append("cloud_name", "dwhgdtdli"); 

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dwhgdtdli/image/upload", {
        method: "POST",
        body: data,
      });
      const uploadedImage = await res.json();
      if (uploadedImage.secure_url) {
         setFormData((prev) => ({ ...prev, imageFile: uploadedImage.secure_url }));
      }
    } catch (error) {
      alert("Lỗi upload ảnh!");
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Logic Specs
  const addSpec = () => setSpecs([...specs, { key: "", value: "" }]);
  const removeSpec = (index: number) => {
    const newSpecs = [...specs];
    newSpecs.splice(index, 1);
    setSpecs(newSpecs);
  };

  // 4. Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra dữ liệu bắt buộc
    if (!formData.categoryId) {
      alert("Vui lòng chọn danh mục sản phẩm!");
      return;
    }

    const specificationsObject = specs.reduce((acc, curr) => {
      if (curr.key && curr.value) acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const payload = {
      Name: formData.name,
      Price: Number(formData.price),
      StockQuantity: Number(formData.stockQuantity),
      Description: formData.description,
      CategoryId: formData.categoryId,
      ImageUrl: formData.imageFile,
      Specifications: specificationsObject
    };

    try {
      await catalogApi.createProduct(payload);
      alert("🎉 Tạo sản phẩm thành công!");
      router.push("/admin/products");
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo sản phẩm! (Kiểm tra lại console/network)");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
            <p className="text-sm text-gray-500">Điền thông tin để tạo mặt hàng mới trong kho.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy bỏ</button>
          <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm">
            <Save size={18} /> Tạo sản phẩm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin chung */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={20} className="text-blue-500"/> Thông tin chung
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                <input 
                  type="text" required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Layers size={20} className="text-purple-500"/> Thông số kỹ thuật
              </h3>
              <button type="button" onClick={addSpec} className="text-sm flex items-center gap-1 text-blue-600 font-medium">
                <Plus size={16} /> Thêm dòng
              </button>
            </div>
            <div className="space-y-3">
              {specs.map((spec, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input placeholder="Tên (VD: RAM)" className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    value={spec.key} onChange={(e) => { const n = [...specs]; n[index].key = e.target.value; setSpecs(n); }} />
                  <input placeholder="Giá trị (VD: 16GB)" className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    value={spec.value} onChange={(e) => { const n = [...specs]; n[index].value = e.target.value; setSpecs(n); }} />
                  <button type="button" onClick={() => removeSpec(index)} className="p-2 text-gray-400 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {specs.length === 0 && <p className="text-sm text-gray-400 italic text-center">Chưa có thông số.</p>}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="lg:col-span-1 space-y-6">
          {/* Ảnh */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase">Hình ảnh</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 relative">
              {formData.imageFile ? (
                <div className="relative w-full aspect-square group">
                  <img src={formData.imageFile} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                  <button type="button" onClick={() => setFormData({...formData, imageFile: ""})} className="absolute top-2 right-2 p-1 bg-white text-red-600 rounded-full shadow hover:bg-gray-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400"><ImageIcon size={48} className="mx-auto mb-2"/>Chưa có ảnh</div>
              )}
              <label className="mt-4 w-full cursor-pointer">
                <div className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium ${isUploading ? 'bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {isUploading ? "Đang tải lên..." : <><Upload size={16} /> Tải ảnh lên</>}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading}/>
              </label>
            </div>
          </div>

          {/* Giá & Kho */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase">Chi tiết bán hàng</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán ($)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input type="number" className="w-full pl-9 pr-4 py-2 border rounded-lg font-bold text-green-700"
                    value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
                <input type="number" className="w-full px-4 py-2 border rounded-lg"
                  value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: Number(e.target.value)})} />
              </div>
            </div>
          </div>

          {/* Danh mục (Đã Fix lỗi Hardcode) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase">Phân loại</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục <span className="text-red-500">*</span></label>
              {loadingCats ? (
                <div className="text-sm text-gray-500 animate-pulse">Đang tải danh mục...</div>
              ) : (
                <select 
                  className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
              {categories.length === 0 && !loadingCats && (
                <p className="text-xs text-red-500 mt-2">Chưa có danh mục nào. Hãy tạo danh mục trước!</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}