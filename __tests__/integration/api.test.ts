import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createServer } from "http";
import { parse } from "url";
import next from "next";

// Mock DB setup (similar to backend setup)
beforeAll(async () => {
  // Start Next.js server
  const app = next({ dev: false });
  await app.prepare();
  const handle = app.getRequestHandler();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  await new Promise<void>((resolve) => {
    server.listen(3001, () => resolve());
  });

  global.testServer = server;
});

afterAll(async () => {
  if (global.testServer) {
    await new Promise<void>((resolve) => {
      global.testServer.close(() => resolve());
    });
  }
});

beforeEach(async () => {
  // Seed test data if needed
});

const baseUrl = "http://localhost:3001";

describe("Next.js API Integration Tests", () => {
  it("GET /api/health returns OK", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
  });

  it("CRUD categories", async () => {
    const categoryPayload = {
      name: "Danh mục thử nghiệm",
      image: "https://example.com/category.png",
    };

    // Create
    const createRes = await fetch(`${baseUrl}/api/category`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryPayload),
    });
    const createData = await createRes.json();
    expect(createRes.status).toBe(201);
    expect(createData.category.id).toBeDefined();
    expect(createData.category.name).toBe(categoryPayload.name);

    const categoryId = createData.category.id;

    // Get
    const getRes = await fetch(`${baseUrl}/api/category/${categoryId}`);
    const getData = await getRes.json();
    expect(getRes.status).toBe(200);
    expect(getData.id).toBe(categoryId);

    // Update
    const updateRes = await fetch(`${baseUrl}/api/category/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Danh mục cập nhật" }),
    });
    const updateData = await updateRes.json();
    expect(updateRes.status).toBe(200);
    expect(updateData.name).toBe("Danh mục cập nhật");

    // Delete
    const deleteRes = await fetch(`${baseUrl}/api/category/${categoryId}`, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(204);

    // Get after delete
    const getAfterDeleteRes = await fetch(`${baseUrl}/api/category/${categoryId}`);
    expect(getAfterDeleteRes.status).toBe(404);
  });

  // Similar for products, banners, stations, orders
  it("CRUD products", async () => {
    // Get category first
    const catRes = await fetch(`${baseUrl}/api/category`);
    const categories = await catRes.json();
    const categoryId = categories[0]?.id || 1;

    const productPayload = {
      categoryId,
      name: "Sản phẩm thử nghiệm",
      price: 123000,
    };

    // Create
    const createRes = await fetch(`${baseUrl}/api/product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productPayload),
    });
    const createData = await createRes.json();
    expect(createRes.status).toBe(201);
    expect(createData.product.id).toBeDefined();

    const productId = createData.product.id;

    // Get
    const getRes = await fetch(`${baseUrl}/api/product/${productId}`);
    const getData = await getRes.json();
    expect(getRes.status).toBe(200);
    expect(getData.id).toBe(productId);

    // Update
    const updateRes = await fetch(`${baseUrl}/api/product/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: 99000 }),
    });
    const updateData = await updateRes.json();
    expect(updateRes.status).toBe(200);
    expect(updateData.price).toBe(99000);

    // Delete
    const deleteRes = await fetch(`${baseUrl}/api/product/${productId}`, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(204);

    // Get after delete
    const getAfterDeleteRes = await fetch(`${baseUrl}/api/product/${productId}`);
    expect(getAfterDeleteRes.status).toBe(404);
  });
});
