export interface Product {
  id: string;
  name: string;
  price: number;
  categoryName: string;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductParams {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export interface BasketItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface Basket {
  username: string;
  items: BasketItem[];
  totalPrice: number;
}

export interface Address {
  street: string;
  city: string;
  country: string;
  zipCode?: string;
}

export interface OrderRequest {
  shippingAddress: Address;
  paymentMethod: string;
  notes?: string;
}

export interface OrderResponse {
  message: string;
  orderId: string;
}

export interface Order {
  id: string;
  status: string; // Pending, Paid, Cancelled
  totalAmount: number;
  orderDate: string;
  items: BasketItem[]; // Dùng lại struct này cho gọn
  paymentId?: string;
}
