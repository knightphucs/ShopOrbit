"use client";
import { useEffect, useState, use } from "react";
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

interface Category {
  id: string;
  name: string;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    stockQuantity: 0,
    categoryId: "",
    description: "",
    imageFile: "", 
  });

  // 1. Load Data (Product + Categories)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Gọi song song cả 2 API để tiết kiệm thời gian
        const [product, catRes] = await Promise.all([
          catalogApi.getProductById(id),
          catalogApi.getCategories(1, 100)
        ]);

        // 1. Set Categories
        setCategories(catRes.data || []);

        // 2. Set Form Data từ Product
        setFormData({
          name: product.name,
          price: product.price,
          stockQuantity: product.stockQuantity || 0, // Backend có thể chưa trả field này, tạm để 0
          // Quan trọng: Backend cần trả về categoryId mới auto-select được
          categoryId: product.categoryId || (catRes.data?.[0]?.id || ""), 
          description: product.description || "",
          imageFile: product.imageUrl || "",
        });

        // 3. Set Specs
        if (product.specifications) {
          const specArray = Object.entries(product.specifications).map(([key, value]) => ({
            key,
            value: String(value),
          }));
          setSpecs(specArray);
        }

      } catch (error) {
        console.error(error);
        alert("Không tải được dữ liệu sản phẩm!");
        router.push("/admin/products");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, router]);

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
      if(uploadedImage.secure_url) {
        setFormData((prev) => ({ ...prev, imageFile: uploadedImage.secure_url }));
      }
    } catch (error) {
      alert("Lỗi upload ảnh!");
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Specs Logic
  const addSpec = () => setSpecs([...specs, { key: "", value: "" }]);
  const removeSpec = (index: number) => {
    const newSpecs = [...specs];
    newSpecs.splice(index, 1);
    setSpecs(newSpecs);
  };

  // 4. Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const specificationsObject = specs.reduce((acc, curr) => {
      if (curr.key && curr.value) acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const payload = {
      Id: id,
      Name: formData.name,
      Price: Number(formData.price),
      StockQuantity: Number(formData.stockQuantity),
      CategoryId: formData.categoryId,
      Description: formData.description,
      ImageUrl: formData.imageFile,
      Specifications: specificationsObject
    };

    try {
      await catalogApi.updateProduct(id, payload);
      alert("✅ Cập nhật thành công!");
      router.push("/admin/products");
    } catch (error) {
      console.error(error);
      alert("Lỗi khi cập nhật!");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-gray-500 text-sm">Đang tải dữ liệu...</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
      
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
            <p className="text-sm text-gray-500">ID: {id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy bỏ</button>
          <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm">
            <Save size={18} /> Lưu thay đổi
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
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
                  {isUploading ? "Đang tải lên..." : <><Upload size={16} /> Thay đổi ảnh</>}
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

          {/* Danh mục (Đã Fix Dynamic) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase">Phân loại</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select 
                className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}