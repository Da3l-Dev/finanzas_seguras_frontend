import { useQuery } from "@tanstack/react-query";
import { useAuth, type User } from "@/context/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import { queryFetch } from "@/lib/queryUtils";

export function useProfile() {
  const { user, token, isLoading } = useAuth();
  return useQuery<User>({
    queryKey: queryKeys.profile(user?.id ?? ""),
    queryFn: () => queryFetch<User>("/api/user/profile", token!),
    enabled: !isLoading && !!user && !!token,
  });
}
