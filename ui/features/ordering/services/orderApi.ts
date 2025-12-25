import api from "@/lib/axios";
import { Order, OrderRequest, OrderResponse } from "@/types";

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
