import api from "@/lib/axios";
import { Basket, BasketItem } from "@/types";

export const getBasket = async (): Promise<Basket> => {
  const response = await api.get("/api/v1/basket");
  return response.data;
};

export const updateBasket = async (items: BasketItem[]): Promise<Basket> => {
  const response = await api.post("/api/v1/basket", { items });
  return response.data;
};

export const addToBasket = async (item: BasketItem): Promise<Basket> => {
  const currentBasket = await getBasket().catch(() => ({ items: [] }));
  const existingItem = currentBasket.items.find(
    (x) => x.productId === item.productId
  );

  let newItems = [];
  if (existingItem) {
    existingItem.quantity += item.quantity;
    newItems = currentBasket.items;
  } else {
    newItems = [...currentBasket.items, item];
  }

  return updateBasket(newItems);
};

export const deleteBasket = async () => {
  await api.delete("/api/v1/basket");
};
