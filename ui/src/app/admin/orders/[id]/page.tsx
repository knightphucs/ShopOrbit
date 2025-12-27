"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { orderingApi } from "@/features/ordering/services/orderApi";
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Package, 
  User, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle 
} from "lucide-react";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  specifications?: Record<string, string>; 
  imageUrl?: string;
}

interface Address {
  firstName: string;
  lastName: string;
  emailAddress: string;
  addressLine: string;
  country: string;
  state: string;
  zipCode: string;
}

interface OrderDetail {
  id: string;
  userId: string;
  orderDate: string;
  status: "Pending" | "Paid" | "Cancelled";
  totalAmount: number;
  paymentMethod: string;
  notes?: string;
  shippingAddress: Address;
  items: OrderItem[];
  paymentId?: string; // Có thể null nếu chưa thanh toán
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); // Unwrap params cho Next.js 15

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Load dữ liệu
  const fetchOrder = async () => {
    try {
      const data = await orderingApi.getOrderById(id);
      setOrder(data);
    } catch (error) {
      alert("Không tìm thấy đơn hàng hoặc có lỗi xảy ra!");
      router.push("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Hành động: Mô phỏng thanh toán (Test Flow)
  const handleSimulatePayment = async () => {
    if (!confirm("Xác nhận KHÁCH ĐÃ THANH TOÁN cho đơn hàng này?")) return;
    try {
      await orderingApi.simulatePayment(id);
      alert("✅ Thanh toán thành công! Trạng thái đơn đã cập nhật.");
      fetchOrder(); // Reload lại để thấy trạng thái mới
    } catch (error) {
      alert("❌ Lỗi khi xử lý thanh toán.");
    }
  };

  // Helper render trạng thái
  const renderStatus = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-100">
            <Clock size={20} />
            <span className="font-bold">Chờ thanh toán</span>
          </div>
        );
      case "Paid":
        return (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-100">
            <CheckCircle size={20} />
            <span className="font-bold">Đã thanh toán</span>
          </div>
        );
      case "Cancelled":
        return (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
            <XCircle size={20} />
            <span className="font-bold">Đã hủy</span>
          </div>
        );
      default:
        return <span>{status}</span>;
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!order) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-white bg-gray-100 rounded-full text-gray-600 transition-colors shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Mã đơn: <span className="font-mono text-gray-700">#{order.id.split('-')[0]}</span></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {new Date(order.orderDate).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {order.status === "Pending" && (
            <button 
              onClick={handleSimulatePayment}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm transition-colors"
            >
              <CreditCard size={18} />
              Xác nhận Thanh toán
            </button>
          )}
          {/* Nút hủy đơn (Nếu cần) - Có thể thêm logic gọi API cancel sau */}
          {order.status === "Pending" && (
             <button className="flex items-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 font-medium transition-colors">
               <XCircle size={18} /> Hủy đơn
             </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI: Sản phẩm (Chiếm 2 phần) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Package size={20} className="text-blue-600"/> 
                Danh sách sản phẩm ({order.items.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-6 flex items-start gap-4">
                  {/* Ảnh giả lập (Backend chưa lưu ảnh vào OrderItem, có thể update sau) */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 overflow-hidden">
                    {item.imageUrl ? (
                        <img 
                        src={item.imageUrl} 
                        alt={item.productName} 
                        className="w-full h-full object-cover" 
                        />
                    ) : (
                        <Package size={24} className="text-gray-400" />
                    )}
                    </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-lg">{item.productName}</h4>
                    <p className="text-sm text-gray-500 font-mono">ID: {item.productId.slice(0,8)}...</p>
                    
                    {/* Hiển thị Specs (JSONB) */}
                    {item.specifications && Object.keys(item.specifications).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(item.specifications).map(([key, value]) => (
                          <span key={key} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-lg">${item.unitPrice.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">x{item.quantity}</div>
                    <div className="text-sm font-semibold text-blue-600 mt-1">
                      = ${(item.unitPrice * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-6 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Tổng tiền đơn hàng</span>
                <span className="text-2xl font-bold text-blue-700">${order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Note từ khách hàng */}
          {order.notes && (
             <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 text-yellow-800">
                <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Ghi chú của khách hàng:</span>
                  <p className="mt-1 text-sm">{order.notes}</p>
                </div>
             </div>
          )}
        </div>

        {/* CỘT PHẢI: Thông tin (Chiếm 1 phần) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Trạng thái */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Trạng thái hiện tại</h3>
            {renderStatus(order.status)}
            {order.paymentId && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                Payment Ref: <span className="font-mono">{order.paymentId}</span>
              </div>
            )}
          </div>

          {/* Card Khách hàng & Giao nhận */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-purple-600"/> Khách hàng
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-1" />
                <div className="text-sm">
                  <p className="font-bold text-gray-900">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-gray-600 mt-1">{order.shippingAddress.addressLine}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.state}, {order.shippingAddress.country} - {order.shippingAddress.zipCode}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                <div className="w-5 flex justify-center"><span className="text-gray-400">@</span></div>
                <p className="text-sm text-blue-600 truncate">{order.shippingAddress.emailAddress}</p>
              </div>
            </div>
          </div>

          {/* Card Thanh toán */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-indigo-600"/> Thanh toán
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Phương thức:</span>
                <span className="font-medium text-gray-900">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền tệ:</span>
                <span className="font-medium text-gray-900">USD ($)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}