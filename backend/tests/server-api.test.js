import { EventEmitter } from "events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import httpMocks from "node-mocks-http";

const clerkMocks = vi.hoisted(() => {
  return {
    clerkMiddleware: vi.fn(() => (req, _res, next) => next()),
    requireAuth: vi.fn(() => (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token === "valid-token") {
        req.auth = () => ({ userId: "clerk_valid" });
        return next();
      }

      if (token === "missing-user-token") {
        req.auth = () => ({ userId: "clerk_missing" });
        return next();
      }

      return res.status(401).json({ message: "Unauthorized" });
    }),
  };
});

const productsProviderMocks = vi.hoisted(() => {
  return {
    getAllProductsSource: vi.fn(),
    getProductByIdSource: vi.fn(),
    getProductsForFiltersSource: vi.fn(),
    searchProductsSource: vi.fn(),
  };
});

vi.mock("@clerk/express", () => clerkMocks);
vi.mock("inngest/express", () => ({
  serve: vi.fn(() => (_req, _res, next) => next()),
}));
vi.mock("stripe", () => {
  return {
    default: class StripeMock {
      constructor() {
        this.customers = {
          retrieve: vi.fn(),
          create: vi.fn(),
        };
        this.paymentIntents = {
          create: vi.fn(),
        };
        this.webhooks = {
          constructEvent: vi.fn(),
        };
      }
    },
  };
});
vi.mock("../src/services/products.provider.js", () => productsProviderMocks);

const { default: app } = await import("../src/app.js");
const { User } = await import("../src/models/user.model.js");
const { Product } = await import("../src/models/product.model.js");
const { Cart } = await import("../src/models/cart.model.js");
const { Order } = await import("../src/models/order.model.js");
const { Review } = await import("../src/models/review.model.js");

const AUTH_HEADER = { Authorization: "Bearer valid-token" };
const MOCK_USER = {
  _id: "507f1f77bcf86cd799439011",
  clerkId: "clerk_valid",
  email: "user@example.com",
  name: "Test User",
};

async function performRequest({ method, url, headers = {}, body }) {
  const req = httpMocks.createRequest({
    method,
    url,
    headers,
    body,
  });
  req.originalUrl = url;

  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await new Promise((resolve, reject) => {
    res.on("finish", resolve);
    res.on("end", resolve);
    app.handle(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  return {
    status: res.statusCode,
    body: (() => {
      try {
        return res._getJSONData();
      } catch {
        return res._getData();
      }
    })(),
  };
}

describe("Server API routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    productsProviderMocks.getAllProductsSource.mockReset();
    productsProviderMocks.getProductByIdSource.mockReset();
    productsProviderMocks.getProductsForFiltersSource.mockReset();
    productsProviderMocks.searchProductsSource.mockReset();

    vi.spyOn(User, "findOne").mockImplementation(async ({ clerkId }) => {
      if (clerkId === "clerk_valid") return MOCK_USER;
      return null;
    });
  });

  describe("Products API", () => {
    it("returns products list via GET /api/products", async () => {
      productsProviderMocks.getAllProductsSource.mockResolvedValue([
        { _id: "p1", name: "Phone" },
        { _id: "p2", name: "Laptop" },
      ]);

      const response = await performRequest({
        method: "GET",
        url: "/api/products",
        headers: AUTH_HEADER,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({ _id: "p1", name: "Phone" });
      expect(productsProviderMocks.getAllProductsSource).toHaveBeenCalledTimes(1);
    });

    it("blocks request to protected route without token", async () => {
      const response = await performRequest({
        method: "GET",
        url: "/api/products",
      });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: "Unauthorized" });
    });

    it("returns 404 when token is valid but user is missing in DB", async () => {
      const response = await performRequest({
        method: "GET",
        url: "/api/products",
        headers: { Authorization: "Bearer missing-user-token" },
      });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ message: "User not found" });
    });
  });

  describe("Cart API", () => {
    it("returns cart via GET /api/cart", async () => {
      const mockCart = { items: [] };
      vi.spyOn(Cart, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCart),
      });

      const response = await performRequest({
        method: "GET",
        url: "/api/cart",
        headers: AUTH_HEADER,
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ cart: mockCart });
    });

    it("adds item via POST /api/cart", async () => {
      vi.spyOn(Product, "findById").mockResolvedValue({ _id: "p1", stock: 5 });
      const cartDoc = {
        items: [],
        save: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(Cart, "findOne").mockResolvedValue(cartDoc);

      const response = await performRequest({
        method: "POST",
        url: "/api/cart",
        headers: AUTH_HEADER,
        body: {
          productId: "p1",
          quantity: 2,
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Item added to cart");
      expect(cartDoc.items).toHaveLength(1);
      expect(cartDoc.items[0]).toMatchObject({ product: "p1", quantity: 2 });
      expect(cartDoc.save).toHaveBeenCalledTimes(1);
    });

    it("updates item quantity via PUT /api/cart/:productId", async () => {
      const cartDoc = {
        items: [{ product: { toString: () => "p1" }, quantity: 1 }],
        save: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(Cart, "findOne").mockResolvedValue(cartDoc);
      vi.spyOn(Product, "findById").mockResolvedValue({ _id: "p1", stock: 10 });

      const response = await performRequest({
        method: "PUT",
        url: "/api/cart/p1",
        headers: AUTH_HEADER,
        body: { quantity: 4 },
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Cart updated successfully");
      expect(cartDoc.items[0].quantity).toBe(4);
      expect(cartDoc.save).toHaveBeenCalledTimes(1);
    });

    it("removes item via DELETE /api/cart/:productId", async () => {
      const cartDoc = {
        items: [
          { product: { toString: () => "p1" }, quantity: 1 },
          { product: { toString: () => "p2" }, quantity: 2 },
        ],
        save: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(Cart, "findOne").mockResolvedValue(cartDoc);

      const response = await performRequest({
        method: "DELETE",
        url: "/api/cart/p1",
        headers: AUTH_HEADER,
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Item removed from cart");
      expect(cartDoc.items).toHaveLength(1);
      expect(cartDoc.items[0].product.toString()).toBe("p2");
      expect(cartDoc.save).toHaveBeenCalledTimes(1);
    });

    it("clears cart via DELETE /api/cart", async () => {
      const cartDoc = {
        items: [{ product: { toString: () => "p1" }, quantity: 2 }],
        save: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(Cart, "findOne").mockResolvedValue(cartDoc);

      const response = await performRequest({
        method: "DELETE",
        url: "/api/cart",
        headers: AUTH_HEADER,
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Cart cleared");
      expect(cartDoc.items).toHaveLength(0);
      expect(cartDoc.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("Orders API", () => {
    it("creates order and decrements stock via POST /api/orders", async () => {
      const orderPayload = {
        orderItems: [
          {
            product: { _id: "p1" },
            name: "Phone",
            price: 100,
            quantity: 2,
            image: "img.png",
          },
        ],
        shippingAddress: {
          fullName: "John Doe",
          streetAddress: "Main 1",
          city: "Minsk",
          state: "Minsk",
          zipCode: "220000",
          phoneNumber: "+375291112233",
        },
        paymentResult: { id: "pay_1", status: "paid" },
        totalPrice: 200,
      };

      vi.spyOn(Product, "findById").mockResolvedValue({ _id: "p1", name: "Phone", stock: 10 });
      vi.spyOn(Product, "findByIdAndUpdate").mockResolvedValue({});
      vi.spyOn(Order, "create").mockResolvedValue({ _id: "o1", ...orderPayload });

      const response = await performRequest({
        method: "POST",
        url: "/api/orders",
        headers: AUTH_HEADER,
        body: orderPayload,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Order created successfully");
      expect(response.body.order._id).toBe("o1");
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith("p1", { $inc: { stock: -2 } });
    });

    it("returns user orders with review status via GET /api/orders", async () => {
      const orders = [
        {
          _id: "o1",
          toObject: () => ({ _id: "o1", totalPrice: 100 }),
        },
        {
          _id: "o2",
          toObject: () => ({ _id: "o2", totalPrice: 200 }),
        },
      ];

      vi.spyOn(Order, "find").mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(orders),
      });
      vi.spyOn(Review, "find").mockResolvedValue([{ orderId: { toString: () => "o1" } }]);

      const response = await performRequest({
        method: "GET",
        url: "/api/orders",
        headers: AUTH_HEADER,
      });

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.orders[0]).toMatchObject({ _id: "o1", hasReviewed: true });
      expect(response.body.orders[1]).toMatchObject({ _id: "o2", hasReviewed: false });
    });
  });
});
