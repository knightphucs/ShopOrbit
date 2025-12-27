import api from "@/lib/axios";
import { Order, OrderRequest, OrderResponse } from "@/types";
//import { env } from "process";
import { env } from "@/env"; // bị lỗi path env.ts nên dùng import này thay với process

export const createOrder = async (
  orderData: OrderRequest
): Promise<OrderResponse> => {
  const response = await api.post("/api/v1/orders", orderData);
  return response.data;
};

export const getOrderById = async (id: string): Promise<Order> => {
  const response = await api.get(`/api/v1/orders/${id}`);
  return response.data;
};

export const payOrder = async (orderId: string) => {
  const response = await api.post(`/api/v1/orders/${orderId}/pay`);
  return response.data;
};

// Helper lấy token
const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const orderingApi = {
  // Lấy tất cả đơn hàng (Admin)
  getAllOrders: async () => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/orders`, {
      cache: "no-store",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
  },

  // Lấy chi tiết đơn hàng
  getOrderById: async (id: string) => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/orders/${id}`, {
      cache: "no-store",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch order details");
    return res.json();
  },

  // Giả lập thanh toán (Dùng để test flow Pending -> Paid)
  simulatePayment: async (id: string) => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/orders/${id}/pay`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Payment failed");
    return res.json();
  }
};
