import { useProduct } from "@/hooks/useProduct";
import useProducts from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import useCatalogMeta from "@/hooks/useCatalogMeta";
import { useApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

jest.mock("@/lib/api", () => ({
  useApi: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

const mockedUseApi = useApi as jest.Mock;
const mockedUseQuery = useQuery as jest.Mock;

describe("query hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("useProducts requests /products", async () => {
    const api = { get: jest.fn().mockResolvedValue({ data: [{ _id: "p-1" }] }) };
    mockedUseApi.mockReturnValue(api);

    let queryConfig: any;
    mockedUseQuery.mockImplementation((config) => {
      queryConfig = config;
      return { data: [], isLoading: false, isError: false };
    });

    useProducts();
    expect(queryConfig.queryKey).toEqual(["products"]);

    await queryConfig.queryFn();
    expect(api.get).toHaveBeenCalledWith("/products");
  });

  it("useProduct sets enabled based on productId and queries by id", async () => {
    const api = { get: jest.fn().mockResolvedValue({ data: { _id: "p-1" } }) };
    mockedUseApi.mockReturnValue(api);

    let queryConfig: any;
    mockedUseQuery.mockImplementation((config) => {
      queryConfig = config;
      return { data: null, isLoading: false, isError: false };
    });

    useProduct("p-1");
    expect(queryConfig.queryKey).toEqual(["product", "p-1"]);
    expect(queryConfig.enabled).toBe(true);
    await queryConfig.queryFn();
    expect(api.get).toHaveBeenCalledWith("/products/p-1");

    useProduct("");
    expect(queryConfig.queryKey).toEqual(["product", ""]);
    expect(queryConfig.enabled).toBe(false);
  });

  it("useOrders requests /orders and returns data.orders", async () => {
    const api = {
      get: jest.fn().mockResolvedValue({ data: { orders: [{ _id: "o-1" }] } }),
    };
    mockedUseApi.mockReturnValue(api);

    let queryConfig: any;
    mockedUseQuery.mockImplementation((config) => {
      queryConfig = config;
      return { data: [], isLoading: false, isError: false };
    });

    useOrders();
    expect(queryConfig.queryKey).toEqual(["orders"]);

    const data = await queryConfig.queryFn();
    expect(api.get).toHaveBeenCalledWith("/orders");
    expect(data).toEqual([{ _id: "o-1" }]);
  });

  it("useCatalogMeta requests /products/meta", async () => {
    const api = {
      get: jest.fn().mockResolvedValue({ data: { version: 1, categories: [] } }),
    };
    mockedUseApi.mockReturnValue(api);

    let queryConfig: any;
    mockedUseQuery.mockImplementation((config) => {
      queryConfig = config;
      return { data: null, isLoading: false, isError: false };
    });

    useCatalogMeta();
    expect(queryConfig.queryKey).toEqual(["catalog-meta"]);

    await queryConfig.queryFn();
    expect(api.get).toHaveBeenCalledWith("/products/meta");
  });
});
