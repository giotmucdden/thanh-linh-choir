/**
 * Simplified auth hook — no Manus OAuth.
 * Uses the choir admin cookie session (admin.check / admin.logout).
 */
import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const checkQuery = trpc.admin.check.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const logoutMutation = trpc.admin.logout.useMutation({
    onSuccess: () => {
      utils.admin.check.invalidate();
    },
  });

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const isAdmin = checkQuery.data?.isAdmin ?? false;

  return {
    isAdmin,
    loading: checkQuery.isLoading,
    error: checkQuery.error ?? null,
    // Legacy compat fields used in Admin.tsx
    user: isAdmin ? { name: "Admin", email: "", role: "admin" as const } : null,
    isAuthenticated: isAdmin,
    logout,
    refresh: () => checkQuery.refetch(),
  };
}
