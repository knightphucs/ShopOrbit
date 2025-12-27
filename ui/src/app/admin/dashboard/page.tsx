"use client";
import { useEffect, useState } from "react";
import { orderingApi } from "@/features/ordering/services/orderApi";
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  XCircle, 
  TrendingUp,
  ArrowUpRight 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

// Màu cho biểu đồ tròn (Pie Chart)
const COLORS = ["#F59E0B", "#10B981", "#EF4444", "#3B82F6"]; // Vàng (Pending), Xanh (Paid), Đỏ (Cancel), Lam (Shipped)

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    cancelledOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy tất cả đơn hàng từ API
        const orders: any[] = await orderingApi.getAllOrders();

        // 2. Tính toán thống kê (Client-side Calculation)
        let revenue = 0;
        let pending = 0;
        let paid = 0;
        let cancelled = 0;
        
        // Group doanh thu theo ngày (để vẽ biểu đồ cột)
        const revenueByDate: Record<string, number> = {};

        orders.forEach(order => {
            // Chỉ cộng doanh thu nếu đơn Đã thanh toán hoặc Đã giao
            if (order.status === 'Paid' || order.status === 'Shipped' || order.status === 'Delivered') {
                revenue += order.totalAmount;
                
                // Gom nhóm theo ngày (YYYY-MM-DD)
                const date = new Date(order.orderDate).toLocaleDateString('vi-VN');
                revenueByDate[date] = (revenueByDate[date] || 0) + order.totalAmount;
            }

            if (order.status === 'Pending') pending++;
            else if (order.status === 'Paid') paid++;
            else if (order.status === 'Cancelled') cancelled++;
        });

        // Format dữ liệu cho Biểu đồ cột
        const barData = Object.keys(revenueByDate).map(date => ({
            date,
            amount: revenueByDate[date]
        })).slice(-7); // Chỉ lấy 7 ngày gần nhất

        // Format dữ liệu cho Biểu đồ tròn
        const pieData = [
            { name: 'Chờ xử lý', value: pending },
            { name: 'Đã thanh toán', value: paid },
            { name: 'Đã hủy', value: cancelled },
        ];

        // 3. Cập nhật State
        setStats({
          totalRevenue: revenue,
          totalOrders: orders.length,
          pendingOrders: pending,
          paidOrders: paid,
          cancelledOrders: cancelled
        });
        setChartData(barData);
        setStatusData(pieData);
        
        // Lấy 5 đơn mới nhất
        const sortedOrders = [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setRecentOrders(sortedOrders.slice(0, 5));

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu thống kê...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Tổng quan</h1>
        <p className="text-sm text-gray-500">Chào mừng quay trở lại, Admin!</p>
      </div>

      {/* --- PHẦN 1: CARDS THỐNG KÊ --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh thu */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">Tổng doanh thu</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        ${stats.totalRevenue.toLocaleString()}
                    </h3>
                </div>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <DollarSign size={20} />
                </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
                <TrendingUp size={14} className="mr-1" /> +12% so với tháng trước
            </div>
        </div>

        {/* Card 2: Tổng đơn */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">Tổng đơn hàng</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</h3>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <ShoppingBag size={20} />
                </div>
            </div>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">Đang chờ xử lý</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingOrders}</h3>
                </div>
                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                    <Clock size={20} />
                </div>
            </div>
        </div>

        {/* Card 4: Cancelled */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">Đơn đã hủy</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.cancelledOrders}</h3>
                </div>
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <XCircle size={20} />
                </div>
            </div>
        </div>
      </div>

      {/* --- PHẦN 2: BIỂU ĐỒ (CHARTS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu (Chiếm 2 phần) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-6">Doanh thu 7 ngày gần nhất</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(val) => `$${val}`} />
                        <Tooltip 
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Doanh thu']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Biểu đồ tròn trạng thái (Chiếm 1 phần) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Tỷ lệ trạng thái đơn</h3>
            <div className="h-64 w-full flex justify-center items-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">
                Dựa trên {stats.totalOrders} đơn hàng
            </div>
        </div>
      </div>

      {/* --- PHẦN 3: ĐƠN HÀNG GẦN ĐÂY --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Đơn hàng mới nhất</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                Xem tất cả <ArrowUpRight size={16} />
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                    <tr>
                        <th className="px-6 py-3">Mã đơn</th>
                        <th className="px-6 py-3">Khách hàng</th>
                        <th className="px-6 py-3">Ngày đặt</th>
                        <th className="px-6 py-3">Tổng tiền</th>
                        <th className="px-6 py-3">Trạng thái</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">#{order.id.split('-')[0]}</td>
                            <td className="px-6 py-4 text-gray-600">User ...{order.userId.slice(-4)}</td>
                            <td className="px-6 py-4 text-gray-500">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">${order.totalAmount.toLocaleString()}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    order.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {order.status}
                                </span>
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