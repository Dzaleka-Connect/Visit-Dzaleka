import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthUser extends User {
  isImpersonating?: boolean;
  originalAdminId?: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      window.location.href = "/";
    },
  });

  const stopImpersonationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/stop-impersonation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Invalidate all queries to refresh data as admin
      queryClient.invalidateQueries();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isImpersonating: user?.isImpersonating || false,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
    stopImpersonation: () => stopImpersonationMutation.mutate(),
    isStoppingImpersonation: stopImpersonationMutation.isPending,
  };
}
