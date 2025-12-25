"use client";

import { useEffect, useState } from "react";
import { getOrderById, payOrder } from "@/features/ordering/services/orderApi";
import { Order } from "@/types";
import { useRouter, useParams } from "next/navigation";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Order not found");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaying(true);
    setMsg("");
    try {
      await payOrder(orderId);
      setMsg("Payment initiated successfully! Waiting for confirmation...");
      setTimeout(fetchOrder, 2000);
    } catch (error) {
      setMsg("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (loading)
    return <div className="p-10 text-center">Loading order details...</div>;
  if (!order)
    return <div className="p-10 text-center text-red-500">Order not found</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">
            Order #{order.id.substring(0, 8)}...
          </h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              order.status === "Paid"
                ? "bg-green-100 text-green-800"
                : order.status === "Cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="space-y-4 mb-8">
          <p>
            <strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}
          </p>
          <p>
            <strong>Total Amount:</strong>{" "}
            <span className="text-xl font-bold">${order.totalAmount}</span>
          </p>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold mb-2">Items</h3>
          <ul className="divide-y">
            {order.items.map((item, idx) => (
              <li key={idx} className="py-2 flex justify-between">
                <span>
                  {item.productName} (x{item.quantity})
                </span>
                <span>${item.unitPrice * item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        {msg && (
          <div className="mb-4 text-center text-blue-600 font-medium">
            {msg}
          </div>
        )}

        {order.status === "Pending" && (
          <button
            onClick={handlePayment}
            disabled={paying}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {paying ? "Processing Payment..." : "Pay Now (Simulate)"}
          </button>
        )}

        {order.status === "Paid" && (
          <div className="text-center text-green-600 font-bold text-lg border p-4 rounded bg-green-50">
            Thank you! Your order has been paid.
          </div>
        )}
      </div>
    </div>
  );
}
