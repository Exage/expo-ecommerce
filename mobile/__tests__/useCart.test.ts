import useCart from "@/hooks/useCart";
import { useApi } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

jest.mock("@/lib/api", () => ({
  useApi: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

const mockedUseApi = useApi as jest.Mock;
const mockedUseQuery = useQuery as jest.Mock;
const mockedUseMutation = useMutation as jest.Mock;
const mockedUseQueryClient = useQueryClient as jest.Mock;

const product = {
  _id: "p-1",
  name: "Test Product",
  description: "Description",
  price: 50,
  stock: 10,
  category: "books",
  images: [],
  averageRating: 4.5,
  totalReviews: 11,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("useCart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
  });

  it("filters out cart items without product and calculates totals", () => {
    mockedUseApi.mockReturnValue({ get: jest.fn() });
    mockedUseQuery.mockReturnValue({
      data: {
        _id: "cart-1",
        user: "u-1",
        clerkId: "c-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        items: [
          { _id: "i-1", product, quantity: 2 },
          { _id: "i-2", product: null, quantity: 9 },
        ],
      },
      isLoading: false,
      isError: false,
    });

    mockedUseMutation
      .mockReturnValueOnce({ mutate: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutate: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutate: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutate: jest.fn(), isPending: false });

    const result = useCart();

    expect(result.cart?.items).toHaveLength(1);
    expect(result.cartItemCount).toBe(2);
    expect(result.cartTotal).toBe(100);
  });

  it("wires query and mutation handlers to API endpoints", async () => {
    const invalidateQueries = jest.fn();
    const api = {
      get: jest.fn().mockResolvedValue({ data: { cart: { items: [] } } }),
      post: jest.fn().mockResolvedValue({ data: { cart: { items: [] } } }),
      put: jest.fn().mockResolvedValue({ data: { cart: { items: [] } } }),
      delete: jest.fn().mockResolvedValue({ data: { cart: { items: [] } } }),
    };

    mockedUseApi.mockReturnValue(api);
    mockedUseQueryClient.mockReturnValue({ invalidateQueries });

    let queryConfig: any;
    mockedUseQuery.mockImplementation((config) => {
      queryConfig = config;
      return { data: undefined, isLoading: false, isError: false };
    });

    const mutations: any[] = [];
    mockedUseMutation.mockImplementation((config) => {
      mutations.push(config);
      return { mutate: jest.fn(), isPending: false };
    });

    useCart();

    await queryConfig.queryFn();
    expect(api.get).toHaveBeenCalledWith("/cart");

    await mutations[0].mutationFn({ productId: "p-1", quantity: 3 });
    expect(api.post).toHaveBeenCalledWith("/cart", { productId: "p-1", quantity: 3 });

    await mutations[1].mutationFn({ productId: "p-1", quantity: 2 });
    expect(api.put).toHaveBeenCalledWith("/cart/p-1", { quantity: 2 });

    await mutations[2].mutationFn("p-1");
    expect(api.delete).toHaveBeenCalledWith("/cart/p-1");

    await mutations[3].mutationFn();
    expect(api.delete).toHaveBeenCalledWith("/cart");

    mutations.forEach((mutation) => mutation.onSuccess());
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["cart"] });
  });
});
