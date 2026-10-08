import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { queryKeys, type CategoryType } from "@/lib/queryKeys";
import { queryFetch } from "@/lib/queryUtils";

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  code: string | null;
  parentId: string | null;
  sortOrder: number;
  isSystem?: boolean;
  isActive?: boolean;
};

export function useCategories(type: CategoryType) {
  const { user, token, isLoading } = useAuth();
  return useQuery<Category[]>({
    queryKey: queryKeys.categoryList(user?.id ?? "", type),
    queryFn: () => queryFetch<Category[]>(`/api/category/${type}`, token!),
    enabled: !isLoading && !!user && !!token,
    staleTime: 60_000,
  });
}

// Listado administrativo: muestra también categorías ocultas anteriormente.
export function useAllCategories(type: CategoryType) {
  const { user, token, isLoading } = useAuth();
  return useQuery<Category[]>({
    queryKey: [...queryKeys.categoryList(user?.id ?? "", type), "archived"],
    queryFn: () => queryFetch<Category[]>(`/api/category/${type}?includeArchived=true`, token!),
    enabled: !isLoading && !!user && !!token,
  });
}
