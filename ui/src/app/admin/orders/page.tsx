"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { orderingApi } from "@/features/ordering/services/orderApi";
import { Eye, Search, Filter, Clock, CheckCircle, XCircle } from "lucide-react";

// Định nghĩa kiểu dữ liệu Order (Dựa trên response backend)
interface Order {
  id: string;
  userId: string;
  orderDate: string;
  status: "Pending" | "Paid" | "Cancelled";
  totalAmount: number;
  paymentMethod: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderingApi.getAllOrders();
        // Sắp xếp đơn mới nhất lên đầu
        const sorted = data.sort((a: Order, b: Order) => 
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
        setOrders(sorted);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Helper hiển thị trạng thái đẹp mắt
  const renderStatus = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={12} /> Chờ thanh toán
          </span>
        );
      case "Paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} /> Đã thanh toán
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} /> Đã hủy
          </span>
        );
      default:
        return <span className="text-gray-500">{status}</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải danh sách đơn hàng...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Đơn hàng</h1>
        <p className="text-sm text-gray-500">Theo dõi trạng thái đơn hàng và doanh thu.</p>
      </div>

      {/* Filter Bar (Giả lập) */}
      <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo mã đơn hàng..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
          <Filter size={18} /> Lọc
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Mã đơn (ID)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Ngày đặt</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Khách hàng</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tổng tiền</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-blue-600 truncate max-w-[150px]" title={order.id}>
                  {order.id.split('-')[0]}...
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(order.orderDate).toLocaleString('vi-VN')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                   User ...{order.userId.slice(-4)}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  ${order.totalAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {renderStatus(order.status)}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye size={20} />
                  </Link>
                </td>
              </tr>
            ))}
             {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}