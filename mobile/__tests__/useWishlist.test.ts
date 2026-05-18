import useWishlist from "@/hooks/useWishlist";
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

const wishlistProduct = {
  _id: "p-1",
  name: "Wishlist Product",
  description: "Description",
  price: 99,
  stock: 4,
  category: "electronics",
  images: [],
  averageRating: 4.9,
  totalReviews: 40,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("useWishlist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
  });

  it("checks if product exists in wishlist and exposes count", () => {
    mockedUseApi.mockReturnValue({ get: jest.fn() });
    mockedUseQuery.mockReturnValue({
      data: [wishlistProduct],
      isLoading: false,
      isError: false,
    });
    mockedUseMutation
      .mockReturnValueOnce({ mutate: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutate: jest.fn(), isPending: false });

    const result = useWishlist();

    expect(result.wishlistCount).toBe(1);
    expect(result.isInWishlist("p-1")).toBe(true);
    expect(result.isInWishlist("p-2")).toBe(false);
  });

  it("toggles wishlist by calling add/remove mutate", () => {
    const addMutate = jest.fn();
    const removeMutate = jest.fn();

    mockedUseApi.mockReturnValue({ get: jest.fn() });
    mockedUseQuery.mockReturnValue({
      data: [wishlistProduct],
      isLoading: false,
      isError: false,
    });
    mockedUseMutation
      .mockReturnValueOnce({ mutate: addMutate, isPending: false })
      .mockReturnValueOnce({ mutate: removeMutate, isPending: false });

    const result = useWishlist();
    result.toggleWishlist("p-1");
    result.toggleWishlist("p-2");

    expect(removeMutate).toHaveBeenCalledWith("p-1");
    expect(addMutate).toHaveBeenCalledWith("p-2");
  });

  it("invalidates wishlist after add/remove success", () => {
    const invalidateQueries = jest.fn();
    mockedUseApi.mockReturnValue({
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({ data: { wishlist: ["p-1"] } }),
      delete: jest.fn().mockResolvedValue({ data: { wishlist: [] } }),
    });
    mockedUseQueryClient.mockReturnValue({ invalidateQueries });
    mockedUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    const mutations: any[] = [];
    mockedUseMutation.mockImplementation((config) => {
      mutations.push(config);
      return { mutate: jest.fn(), isPending: false };
    });

    useWishlist();
    mutations.forEach((mutation) => mutation.onSuccess());

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["wishlist"] });
  });
});
