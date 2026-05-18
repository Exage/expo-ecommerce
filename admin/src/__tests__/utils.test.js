import { describe, expect, it } from "vitest";
import {
  capitalizeText,
  formatDate,
  getOrderStatusBadge,
  getStockStatusBadge,
} from "../lib/utils";

describe("utils", () => {
  it("capitalizes text", () => {
    expect(capitalizeText("pending")).toBe("Pending");
    expect(capitalizeText("")).toBe("");
    expect(capitalizeText(null)).toBeNull();
  });

  it("returns order status badge class", () => {
    expect(getOrderStatusBadge("pending")).toBe("badge-warning");
    expect(getOrderStatusBadge("shipped")).toBe("badge-info");
    expect(getOrderStatusBadge("delivered")).toBe("badge-success");
    expect(getOrderStatusBadge("unknown")).toBe("badge-ghost");
  });

  it("returns stock status badge object", () => {
    expect(getStockStatusBadge(0)).toEqual({ text: "Out of Stock", class: "badge-error" });
    expect(getStockStatusBadge(10)).toEqual({ text: "Low Stock", class: "badge-warning" });
    expect(getStockStatusBadge(100)).toEqual({ text: "In Stock", class: "badge-success" });
  });

  it("formats valid date and handles invalid values", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("invalid")).toBe("");

    const source = "2025-01-15T12:00:00.000Z";
    const expected = new Date(source).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    expect(formatDate(source)).toBe(expected);
  });
});
