import { capitalizeFirstLetter, formatDate, getStatusColor } from "@/lib/utils";

describe("lib/utils", () => {
  it("capitalizes the first character", () => {
    expect(capitalizeFirstLetter("delivered")).toBe("Delivered");
  });

  it("returns a stable US formatted date", () => {
    expect(formatDate("2026-03-15T10:20:30.000Z")).toBe("Mar 15, 2026");
  });

  it("returns the expected order status color", () => {
    expect(getStatusColor("delivered")).toBe("#10B981");
    expect(getStatusColor("Shipped")).toBe("#3B82F6");
    expect(getStatusColor("pending")).toBe("#F59E0B");
    expect(getStatusColor("unknown")).toBe("#666");
  });
});
