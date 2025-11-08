import { NextRequest } from "next/server";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, PUT, DELETE } from "@/app/api/product/[id]/route";
import { getProductByIdUseCase, updateProductUseCase, deleteProductUseCase } from "@/lib/container";

// Mock use cases
vi.mock("@/lib/container", () => ({
  getProductByIdUseCase: {
    execute: vi.fn(),
  },
  updateProductUseCase: {
    execute: vi.fn(),
  },
  deleteProductUseCase: {
    execute: vi.fn(),
  },
}));

describe("/api/product/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should return product by id", async () => {
      const mockProduct = { id: 1, name: "Test Product" };
      (getProductByIdUseCase.execute as any).mockResolvedValue({
        product: mockProduct,
      });

      const request = new NextRequest("http://localhost/api/product/1");
      const response = await GET(request, { params: { id: "1" } });
      const data = await response.json();

      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith({ id: 1 });
      expect(response.status).toBe(200);
      expect(data).toEqual(mockProduct);
    });

    it("should return 404 if product not found", async () => {
      (getProductByIdUseCase.execute as any).mockResolvedValue({
        product: null,
      });

      const request = new NextRequest("http://localhost/api/product/1");
      const response = await GET(request, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe("Product not found");
    });

    it("should return 400 for invalid id", async () => {
      const request = new NextRequest("http://localhost/api/product/abc");
      const response = await GET(request, { params: { id: "abc" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe("Invalid ID");
    });
  });

  describe("PUT", () => {
    it("should update product", async () => {
      const mockProduct = { id: 1, name: "Updated Product" };
      const body = { name: "Updated Product" };
      (updateProductUseCase.execute as any).mockResolvedValue({
        product: mockProduct,
      });

      const request = new NextRequest("http://localhost/api/product/1", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const response = await PUT(request, { params: { id: "1" } });
      const data = await response.json();

      expect(updateProductUseCase.execute).toHaveBeenCalledWith({ id: 1, ...body });
      expect(response.status).toBe(200);
      expect(data).toEqual(mockProduct);
    });
  });

  describe("DELETE", () => {
    it("should delete product", async () => {
      (deleteProductUseCase.execute as any).mockResolvedValue({
        success: true,
      });

      const request = new NextRequest("http://localhost/api/product/1", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: { id: "1" } });

      expect(deleteProductUseCase.execute).toHaveBeenCalledWith({ id: 1 });
      expect(response.status).toBe(204);
    });
  });
});
