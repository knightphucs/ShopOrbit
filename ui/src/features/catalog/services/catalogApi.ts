import axiosClient from "@/src/lib/axios";
import { PagedResult, Product, ProductParams, Category } from "@/src/types";

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
