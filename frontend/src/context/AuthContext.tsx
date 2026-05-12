import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, TOKEN_KEY } from "../api/client";
import type { PermissionName, UserContext } from "../api/types";

type AuthContextValue = {
  user: UserContext | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  acceptInvitation: (token: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (...permissions: PermissionName[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .me()
      .then(({ user: nextUser }) => {
        if (mounted) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (mounted) {
          logout();
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [logout, token]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const acceptInvitation = useCallback(async (inviteToken: string, password: string) => {
    const result = await api.acceptInvitation(inviteToken, password);
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const hasPermission = useCallback(
    (...permissions: PermissionName[]) => {
      if (!user) {
        return false;
      }
      return user.permissions.includes("admin_access") || permissions.some((permission) => user.permissions.includes(permission));
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, token, loading, login, acceptInvitation, logout, hasPermission }),
    [acceptInvitation, hasPermission, loading, login, logout, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
