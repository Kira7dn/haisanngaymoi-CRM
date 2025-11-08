// Dependency Injection Container
import { bannerRepository } from "@/infrastructure/repositories/banner-repo";
import { categoryRepository } from "@/infrastructure/repositories/category-repo";
import { productRepository } from "@/infrastructure/repositories/product-repo";
import { stationRepository } from "@/infrastructure/repositories/station-repo";
import { userRepository } from "@/infrastructure/repositories/user-repo";
import { orderRepository } from "@/infrastructure/repositories/order-repo";

// Services
export const bannerService = {
  ...bannerRepository,
};

export const categoryService = {
  ...categoryRepository,
};

export const productService = {
  ...productRepository,
};

export const stationService = {
  ...stationRepository,
};

export const userService = {
  ...userRepository,
};

export const orderService = {
  ...orderRepository,
};

// Use Cases
import { FilterProductsUseCase } from "@/core/application/usecases/product/filter-products";
import { CreateProductUseCase } from "@/core/application/usecases/product/create-product";
import { GetProductByIdUseCase } from "@/core/application/usecases/product/get-product-by-id";
import { UpdateProductUseCase } from "@/core/application/usecases/product/update-product";
import { DeleteProductUseCase } from "@/core/application/usecases/product/delete-product";

import { GetBannersUseCase } from "@/core/application/usecases/banner/get-banners";
import { CreateBannerUseCase } from "@/core/application/usecases/banner/create-banner";
import { GetBannerByIdUseCase } from "@/core/application/usecases/banner/get-banner-by-id";
import { UpdateBannerUseCase } from "@/core/application/usecases/banner/update-banner";
import { DeleteBannerUseCase } from "@/core/application/usecases/banner/delete-banner";

import { GetCategoriesUseCase } from "@/core/application/usecases/category/get-categories";
import { CreateCategoryUseCase } from "@/core/application/usecases/category/create-category";
import { GetCategoryByIdUseCase } from "@/core/application/usecases/category/get-category-by-id";
import { UpdateCategoryUseCase } from "@/core/application/usecases/category/update-category";
import { DeleteCategoryUseCase } from "@/core/application/usecases/category/delete-category";

import { GetStationsUseCase } from "@/core/application/usecases/station/get-stations";
import { CreateStationUseCase } from "@/core/application/usecases/station/create-station";
import { GetStationByIdUseCase } from "@/core/application/usecases/station/get-station-by-id";
import { UpdateStationUseCase } from "@/core/application/usecases/station/update-station";
import { DeleteStationUseCase } from "@/core/application/usecases/station/delete-station";

import { UpsertUserUseCase } from "@/core/application/usecases/user/upsert-user";
import { GetUserByIdUseCase } from "@/core/application/usecases/user/get-user-by-id";

import { GetOrdersUseCase } from "@/core/application/usecases/order/get-orders";
import { CreateOrderUseCase } from "@/core/application/usecases/order/create-order";
import { GetOrderByIdUseCase } from "@/core/application/usecases/order/get-order-by-id";
import { UpdateOrderUseCase } from "@/core/application/usecases/order/update-order";
import { DeleteOrderUseCase } from "@/core/application/usecases/order/delete-order";

export const filterProductsUseCase = new FilterProductsUseCase(productService);
export const createProductUseCase = new CreateProductUseCase(productService);
export const getProductByIdUseCase = new GetProductByIdUseCase(productService);
export const updateProductUseCase = new UpdateProductUseCase(productService);
export const deleteProductUseCase = new DeleteProductUseCase(productService);

export const getBannersUseCase = new GetBannersUseCase(bannerService);
export const createBannerUseCase = new CreateBannerUseCase(bannerService);
export const getBannerByIdUseCase = new GetBannerByIdUseCase(bannerService);
export const updateBannerUseCase = new UpdateBannerUseCase(bannerService);
export const deleteBannerUseCase = new DeleteBannerUseCase(bannerService);

export const getCategoriesUseCase = new GetCategoriesUseCase(categoryService);
export const createCategoryUseCase = new CreateCategoryUseCase(categoryService);
export const getCategoryByIdUseCase = new GetCategoryByIdUseCase(categoryService);
export const updateCategoryUseCase = new UpdateCategoryUseCase(categoryService);
export const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryService);

export const getStationsUseCase = new GetStationsUseCase(stationService);
export const createStationUseCase = new CreateStationUseCase(stationService);
export const getStationByIdUseCase = new GetStationByIdUseCase(stationService);
export const updateStationUseCase = new UpdateStationUseCase(stationService);
export const deleteStationUseCase = new DeleteStationUseCase(stationService);

export const upsertUserUseCase = new UpsertUserUseCase(userService);
export const getUserByIdUseCase = new GetUserByIdUseCase(userService);

export const getOrdersUseCase = new GetOrdersUseCase(orderService);
export const createOrderUseCase = new CreateOrderUseCase(orderService);
export const getOrderByIdUseCase = new GetOrderByIdUseCase(orderService);
export const updateOrderUseCase = new UpdateOrderUseCase(orderService);
export const deleteOrderUseCase = new DeleteOrderUseCase(orderService);
