import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import type { AddressInfo } from "net";

// Mock DB setup (similar to backend setup)
beforeAll(async () => {
  // Start Next.js server in dev mode with Turbopack disabled (use webpack instead)
  // This avoids Turbopack internal errors in test environments
  const app = next({
    dev: true,
    turbo: false, // Disable Turbopack, use webpack
  });

  try {
    await app.prepare();
    const handle = app.getRequestHandler();

    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 60000); // 60 second timeout for server startup

      server.listen(0, () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    const addr = server.address() as AddressInfo;
    (global as any).testServer = server;
    (global as any).baseUrl = `http://127.0.0.1:${addr.port}`;

    console.log(`Test server started at ${(global as any).baseUrl}`);
  } catch (error) {
    console.error('Failed to start Next.js test server:', error);
    throw error;
  }
}, 90000); // Increase timeout to 90 seconds for Next.js dev server startup

afterAll(async () => {
  const srv = (global as any).testServer as ReturnType<typeof createServer> | undefined;
  if (srv) {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn('Server close timeout - forcing exit');
        resolve(); // Resolve anyway to allow cleanup to continue
      }, 5000);

      srv.close(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}, 10000);

// Note: No beforeEach needed - server is initialized in beforeAll

const getBaseUrl = () => (global as any).baseUrl as string;

describe("Next.js API Integration Tests", () => {
  it("GET /api/health returns OK", async () => {
    const res = await fetch(`${getBaseUrl()}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
    expect(typeof data.timestamp).toBe("string");
  }, 60000); // 60 seconds timeout - first API route needs time to compile (can take 40+ seconds)

  it("CRUD categories", async () => {
    // Create
    const createRes = await fetch(`${getBaseUrl()}/api/category`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Category",
        description: "Test description",
      }),
    });
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.id).toBeDefined();
    const categoryId = createData.id;

    // Read
    const getRes = await fetch(`${getBaseUrl()}/api/category/${categoryId}`);
    const getData = await getRes.json();
    expect(getRes.status).toBe(200);
    expect(getData.id).toBe(categoryId);

    // Update
    const updateRes = await fetch(`${getBaseUrl()}/api/category/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Test Category",
        description: "Updated description",
      }),
    });
    expect(updateRes.status).toBe(200);

    // Verify update
    const getUpdatedRes = await fetch(`${getBaseUrl()}/api/category/${categoryId}`);
    const getUpdatedData = await getUpdatedRes.json();
    expect(getUpdatedRes.status).toBe(200);
    expect(getUpdatedData.name).toBe("Updated Test Category");

    // Delete
    const deleteRes = await fetch(`${getBaseUrl()}/api/category/${categoryId}`, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(204);
  }, 30000); // 30 seconds timeout - multiple API routes need time to compile

  it("CRUD products", async () => {
    // Create category first
    const categoryRes = await fetch(`${getBaseUrl()}/api/category`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Product Test Category",
        description: "For product testing",
      }),
    });
    const categoryData = await categoryRes.json();
    const categoryId = categoryData.id;

    // Create product
    const createRes = await fetch(`${getBaseUrl()}/api/product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Product",
        description: "Test product description",
        price: 100,
        categoryId,
      }),
    });
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.id).toBeDefined();
    const productId = createData.id;

    // Read
    const getRes = await fetch(`${getBaseUrl()}/api/product/${productId}`);
    const getData = await getRes.json();
    expect(getRes.status).toBe(200);
    expect(getData.id).toBe(productId);

    // Update
    const updateRes = await fetch(`${getBaseUrl()}/api/product/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Test Product",
        price: 150,
      }),
    });
    expect(updateRes.status).toBe(200);

    // Delete
    const deleteRes = await fetch(`${getBaseUrl()}/api/product/${productId}`, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(204);

    // Cleanup category
    await fetch(`${getBaseUrl()}/api/category/${categoryId}`, {
      method: "DELETE",
    });
  }, 30000); // 30 seconds timeout - multiple API routes need time to compile
});
