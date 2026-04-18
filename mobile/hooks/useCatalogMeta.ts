import { useApi } from "@/lib/api";
import { CatalogMeta } from "@/types";
import { useQuery } from "@tanstack/react-query";

const useCatalogMeta = () => {
  const api = useApi();

  const result = useQuery({
    queryKey: ["catalog-meta"],
    queryFn: async () => {
      const { data } = await api.get<CatalogMeta>("/products/meta");
      return data;
    },
  });

  return result;
};

export default useCatalogMeta;
