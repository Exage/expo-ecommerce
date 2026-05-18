import { useReviews } from "@/hooks/useReviews";
import { useApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

jest.mock("@/lib/api", () => ({
  useApi: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

const mockedUseApi = useApi as jest.Mock;
const mockedUseMutation = useMutation as jest.Mock;
const mockedUseQueryClient = useQueryClient as jest.Mock;

describe("useReviews", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
  });

  it("posts review payload and invalidates products/orders on success", async () => {
    const invalidateQueries = jest.fn();
    const api = {
      post: jest.fn().mockResolvedValue({ data: { ok: true } }),
    };

    mockedUseApi.mockReturnValue(api);
    mockedUseQueryClient.mockReturnValue({ invalidateQueries });

    let mutationConfig: any;
    mockedUseMutation.mockImplementation((config) => {
      mutationConfig = config;
      return { mutateAsync: jest.fn(), isPending: false };
    });

    useReviews();

    const payload = { productId: "p-1", orderId: "o-1", rating: 5 };
    await mutationConfig.mutationFn(payload);
    expect(api.post).toHaveBeenCalledWith("/reviews", payload);

    mutationConfig.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["products"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["orders"] });
  });

  it("exposes mutateAsync and pending state", () => {
    const mutateAsync = jest.fn();
    mockedUseApi.mockReturnValue({ post: jest.fn() });
    mockedUseMutation.mockReturnValue({ mutateAsync, isPending: true });

    const result = useReviews();

    expect(result.createReviewAsync).toBe(mutateAsync);
    expect(result.isCreatingReview).toBe(true);
  });
});
