import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthToken, setAuthTokenGetter } from "../lib/authToken";

describe("authToken", () => {
  beforeEach(() => {
    setAuthTokenGetter(null);
  });

  it("returns null when token getter is not configured", async () => {
    await expect(getAuthToken()).resolves.toBeNull();
  });

  it("returns token from configured getter", async () => {
    const getToken = vi.fn().mockResolvedValue("token-123");

    setAuthTokenGetter(getToken);

    await expect(getAuthToken()).resolves.toBe("token-123");
    expect(getToken).toHaveBeenCalledTimes(1);
  });

  it("returns null when getter throws", async () => {
    setAuthTokenGetter(vi.fn().mockRejectedValue(new Error("boom")));

    await expect(getAuthToken()).resolves.toBeNull();
  });

  it("ignores non-function getter values", async () => {
    setAuthTokenGetter("not-a-function");

    await expect(getAuthToken()).resolves.toBeNull();
  });
});
