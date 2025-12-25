import axiosClient from "@/lib/axios";
import { PagedResult, Product, ProductParams, Category } from "@/types";

export const getProducts = async (
  params: ProductParams
): Promise<PagedResult<Product>> => {
  const response = await axiosClient.get("/api/catalog/products", { params });
  return response.data;
};

export const getCategories = async (): Promise<PagedResult<Category>> => {
  const response = await axiosClient.get("/api/categories?pageSize=50");
  return response.data;
};
