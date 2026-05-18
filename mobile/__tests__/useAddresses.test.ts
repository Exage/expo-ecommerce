import { useAddresses } from "@/hooks/useAddressess";
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

describe("useAddresses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
  });

  it("returns empty addresses array when query data is missing", () => {
    mockedUseApi.mockReturnValue({ get: jest.fn() });
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    mockedUseMutation
      .mockReturnValueOnce({ mutate: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutate: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutate: jest.fn(), isPending: false });

    const result = useAddresses();

    expect(result.addresses).toEqual([]);
    expect(result.isLoading).toBe(false);
    expect(result.isError).toBe(false);
  });

  it("wires query and mutation handlers to address endpoints", async () => {
    const invalidateQueries = jest.fn();
    const api = {
      get: jest.fn().mockResolvedValue({ data: { addresses: [] } }),
      post: jest.fn().mockResolvedValue({ data: { addresses: [] } }),
      put: jest.fn().mockResolvedValue({ data: { addresses: [] } }),
      delete: jest.fn().mockResolvedValue({ data: { addresses: [] } }),
    };

    mockedUseApi.mockReturnValue(api);
    mockedUseQueryClient.mockReturnValue({ invalidateQueries });

    let queryConfig: any;
    mockedUseQuery.mockImplementation((config) => {
      queryConfig = config;
      return { data: [], isLoading: false, isError: false };
    });

    const mutations: any[] = [];
    mockedUseMutation.mockImplementation((config) => {
      mutations.push(config);
      return { mutate: jest.fn(), isPending: false };
    });

    useAddresses();

    await queryConfig.queryFn();
    expect(api.get).toHaveBeenCalledWith("/users/addresses");

    const newAddress = {
      label: "Home",
      fullName: "John Doe",
      streetAddress: "Main st 1",
      city: "Minsk",
      state: "Minsk",
      zipCode: "220000",
      phoneNumber: "+375291111111",
      isDefault: true,
    };

    await mutations[0].mutationFn(newAddress);
    expect(api.post).toHaveBeenCalledWith("/users/addresses", newAddress);

    await mutations[1].mutationFn({
      addressId: "addr-1",
      addressData: { city: "Grodno" },
    });
    expect(api.put).toHaveBeenCalledWith("/users/addresses/addr-1", { city: "Grodno" });

    await mutations[2].mutationFn("addr-1");
    expect(api.delete).toHaveBeenCalledWith("/users/addresses/addr-1");

    mutations.forEach((mutation) => mutation.onSuccess());
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["addresses"] });
  });
});
