// Auth disabled - always return admin access
export function useAuth() {
  return {
    user: { role: "admin", name: "Admin", openId: "admin" },
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: () => Promise.resolve(),
    logout: () => Promise.resolve(),
  };
}
