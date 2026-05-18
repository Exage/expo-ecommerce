import { beforeEach, describe, expect, it, vi } from "vitest";

const { axiosInstanceMock } = vi.hoisted(() => ({
  axiosInstanceMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../lib/axios", () => ({
  default: axiosInstanceMock,
}));

import { catalogApi, customerApi, orderApi, productApi, statsApi } from "../lib/api";

describe("admin api clients", () => {
  beforeEach(() => {
    Object.values(axiosInstanceMock).forEach((mockFn) => mockFn.mockReset());
  });

  it("fetches all products", async () => {
    axiosInstanceMock.get.mockResolvedValueOnce({ data: { products: [] } });

    await expect(productApi.getAll()).resolves.toEqual({ products: [] });
    expect(axiosInstanceMock.get).toHaveBeenCalledWith("/admin/products");
  });

  it("creates a product", async () => {
    const payload = new FormData();
    axiosInstanceMock.post.mockResolvedValueOnce({ data: { ok: true } });

    await expect(productApi.create(payload)).resolves.toEqual({ ok: true });
    expect(axiosInstanceMock.post).toHaveBeenCalledWith("/admin/products", payload);
  });

  it("updates a product", async () => {
    const formData = new FormData();
    axiosInstanceMock.put.mockResolvedValueOnce({ data: { updated: true } });

    await expect(productApi.update({ id: "p1", formData })).resolves.toEqual({ updated: true });
    expect(axiosInstanceMock.put).toHaveBeenCalledWith("/admin/products/p1", formData);
  });

  it("deletes a product", async () => {
    axiosInstanceMock.delete.mockResolvedValueOnce({ data: { deleted: true } });

    await expect(productApi.delete("p1")).resolves.toEqual({ deleted: true });
    expect(axiosInstanceMock.delete).toHaveBeenCalledWith("/admin/products/p1");
  });

  it("fetches catalog metadata", async () => {
    axiosInstanceMock.get.mockResolvedValueOnce({ data: { categories: [] } });

    await expect(catalogApi.getMeta()).resolves.toEqual({ categories: [] });
    expect(axiosInstanceMock.get).toHaveBeenCalledWith("/products/meta");
  });

  it("fetches and updates orders", async () => {
    axiosInstanceMock.get.mockResolvedValueOnce({ data: { orders: [] } });
    axiosInstanceMock.patch.mockResolvedValueOnce({ data: { ok: true } });

    await expect(orderApi.getAll()).resolves.toEqual({ orders: [] });
    await expect(orderApi.updateStatus({ orderId: "o1", status: "shipped" })).resolves.toEqual({
      ok: true,
    });

    expect(axiosInstanceMock.get).toHaveBeenCalledWith("/admin/orders");
    expect(axiosInstanceMock.patch).toHaveBeenCalledWith("/admin/orders/o1/status", {
      status: "shipped",
    });
  });

  it("fetches dashboard stats", async () => {
    axiosInstanceMock.get.mockResolvedValueOnce({ data: { totalOrders: 10 } });

    await expect(statsApi.getDashboard()).resolves.toEqual({ totalOrders: 10 });
    expect(axiosInstanceMock.get).toHaveBeenCalledWith("/admin/stats");
  });

  it("fetches customers", async () => {
    axiosInstanceMock.get.mockResolvedValueOnce({ data: { customers: [] } });

    await expect(customerApi.getAll()).resolves.toEqual({ customers: [] });
    expect(axiosInstanceMock.get).toHaveBeenCalledWith("/admin/customers");
  });
});
