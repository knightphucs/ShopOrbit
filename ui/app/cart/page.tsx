"use client";

import { useEffect, useState } from "react";
import { getBasket, updateBasket } from "@/features/basket/services/basketApi";
import { Basket } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [basket, setBasket] = useState<Basket | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBasket();
  }, []);

  const fetchBasket = async () => {
    try {
      const data = await getBasket();
      setBasket(data);
    } catch (error) {
      console.error("Failed to fetch basket", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (
    productId: string,
    newQuantity: number
  ) => {
    if (!basket) return;
    if (newQuantity < 1) {
      const newItems = basket.items.filter((i) => i.productId !== productId);
      setBasket({ ...basket, items: newItems });
      await updateBasket(newItems);
      return;
    }

    const newItems = basket.items.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );

    setBasket({ ...basket, items: newItems });
    await updateBasket(newItems);
  };

  const calculateTotal = () => {
    return (
      basket?.items.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0
      ) || 0
    );
  };

  if (loading) return <div className="p-10 text-center">Loading cart...</div>;
  if (!basket || basket.items.length === 0)
    return (
      <div className="p-10 text-center text-xl">
        Your cart is empty.{" "}
        <Link href="/products" className="text-blue-600 underline">
          Go Shopping
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {basket.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between border-b py-4"
            >
              <div className="flex items-center">
                {/* Placeholder Image */}
                <div className="h-20 w-20 bg-gray-200 rounded-md mr-4"></div>
                <div>
                  <h3 className="text-lg font-medium">{item.productName}</h3>
                  <p className="text-gray-500">${item.unitPrice}</p>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() =>
                    handleQuantityChange(item.productId, item.quantity - 1)
                  }
                  className="px-3 py-1 border rounded-l hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-1 border-t border-b">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    handleQuantityChange(item.productId, item.quantity + 1)
                  }
                  className="px-3 py-1 border rounded-r hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <div className="font-bold">${item.unitPrice * item.quantity}</div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>${calculateTotal()}</span>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${calculateTotal()}</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="w-full bg-black text-white mt-6 py-3 rounded-lg hover:bg-gray-800"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
