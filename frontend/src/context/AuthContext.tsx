import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { ApiError, setUnauthorizedHandler, tokenStore } from "../api/client";
import { getMe } from "../api/users";
import ServerUnreachable from "../components/ServerUnreachable";
import type { Me, Tokens } from "../types";

interface AuthContextValue {
  me: Me | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: authApi.SignupData) => Promise<void>;
  logout: () => void;
  setMe: (me: Me) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);

  const logout = useCallback(() => {
    tokenStore.clear();
    setMe(null);
  }, []);

  const startSession = async ({ access, refresh }: Tokens) => {
    tokenStore.save(access, refresh);
    setMe(await getMe());
  };

  // Restore the session from stored tokens. Only a rejected token logs the user
  // out; if the server is unreachable the tokens are kept so a retry can succeed.
  const restoreSession = useCallback(() => {
    setLoading(true);
    setUnreachable(false);
    getMe()
      .then(setMe)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
        else setUnreachable(true);
      })
      .finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (tokenStore.access()) restoreSession();
    else setLoading(false);
  }, [logout, restoreSession]);

  if (unreachable) return <ServerUnreachable onRetry={restoreSession} />;

  const value: AuthContextValue = {
    me,
    loading,
    login: async (username, password) => startSession(await authApi.login(username, password)),
    signup: async (data) => startSession(await authApi.signup(data)),
    logout,
    setMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
