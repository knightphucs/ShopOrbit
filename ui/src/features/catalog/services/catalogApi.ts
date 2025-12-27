import axiosClient from "@/lib/axios";
import { PagedResult, Product, ProductParams, Category } from "@/types";
import { env } from "@/env";

export const getProducts = async (
  params: ProductParams
): Promise<PagedResult<Product>> => {
  const response = await axiosClient.get("/api/v1/products", { params });
  return response.data;
};

export const getCategories = async (): Promise<PagedResult<Category>> => {
  const response = await axiosClient.get("/api/v1/categories?pageSize=50");
  return response.data;
};
// Hàm helper để lấy token từ localStorage (hoặc cookie tùy cách bạn lưu)
const getAuthHeaders = () => {
  const token = localStorage.getItem("token"); // Ví dụ lưu ở localStorage
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const catalogApi = {
  // Lấy danh sách (Có phân trang)
  getProducts: async (pageIndex = 1, pageSize = 10) => {
    const res = await fetch(
      `${env.gatewayUrl}/api/v1/products?pageIndex=${pageIndex}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers: getAuthHeaders(),
      }
    );
    // check lỗi để tránh crash nếu token sai hoặc hết hạn
    if (!res.ok) {
      if (res.status === 401)
        throw new Error("Unauthorized - Hãy đăng nhập lại");
      throw new Error("Failed to fetch products");
    }

    return res.json();
  },

  //Tạo mới
  createProduct: async (data: any) => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create product");
    return res.json();
  },

  updateProduct: async (id: string, data: any) => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/products/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        Id: id,
        Name: data.Name || data.name,
        Price: data.Price || data.price,
        StockQuantity: data.StockQuantity || data.stockQuantity,
        Description: data.Description || data.description,
        CategoryId: data.CategoryId || data.categoryId,

        // QUAN TRỌNG: Backend chờ "ImageUrl", Frontend form đang là "imageFile"
        ImageUrl: data.ImageFile || data.imageFile || data.ImageUrl,

        Specifications: data.Specifications || data.specifications,
      }),
    });

    if (!res.ok) throw new Error("Failed to update product");
    return true;
  },

  //Xóa
  deleteProduct: async (id: string) => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(), // Quan trọng: Phải có Token mới xóa được
    });
    if (!res.ok) throw new Error("Failed to delete");
    return true;
  },

  //Lấy chi tiết
  getProductById: async (id: string) => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/products/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized");
      throw new Error("Failed to fetch product detail");
    }
    return res.json();
  },

  //Lấy danh sách Category
  getCategories: async (pageIndex = 1, pageSize = 50) => {
    const res = await fetch(
      `${env.gatewayUrl}/api/v1/categories?pageIndex=${pageIndex}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      if (res.status === 401)
        throw new Error("Unauthorized - Vui lòng đăng nhập lại");
      throw new Error("Failed to fetch categories");
    }

    return res.json();
  },

  //Lấy chi tiết 1 Category
  getCategoryById: async (id: string) => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/categories/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch category");
    return res.json();
  },

  //Tạo Category
  createCategory: async (data: any) => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/categories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create category");
    return res.json();
  },

  //Update Category
  updateCategory: async (id: string, data: any) => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/categories/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        Id: id,
        ...data, // Name, Description
      }),
    });
    if (!res.ok) throw new Error("Failed to update category");
    return true;
  },

  //Delete Category
  deleteCategory: async (id: string) => {
    const res = await fetch(`${env.gatewayUrl}/api/v1/categories/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete category");
    return true;
  },
};
