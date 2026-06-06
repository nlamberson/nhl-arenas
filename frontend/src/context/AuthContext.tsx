import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getMe,
  login as apiLogin,
  register as apiRegister,
  setOnSessionCleared,
  setOnTokensRefreshed,
} from '@/lib/api';
import { clearVisitQueryCache } from '@/lib/queryClient';
import {
  clearTokens,
  expiresAtFromLogin,
  isTokenExpired,
  loadStoredSession,
  saveTokens,
  setInMemoryIdToken,
  setTokenGetter,
} from '@/lib/authStorage';
import { refreshFirebaseTokens } from '@/lib/firebaseAuth';
import type { LoginResponse, MeResponse } from '@/lib/types';

interface AuthContextValue {
  idToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: MeResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<MeResponse>;
  register: (email: string, password: string) => Promise<MeResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<MeResponse | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applyTokensToState(
  tokens: LoginResponse,
  setters: {
    setIdToken: (v: string) => void;
    setRefreshToken: (v: string) => void;
    setExpiresAt: (v: number) => void;
  },
): number {
  const expiresAt = expiresAtFromLogin(tokens);
  setters.setIdToken(tokens.id_token);
  setters.setRefreshToken(tokens.refresh_token);
  setters.setExpiresAt(expiresAt);
  setInMemoryIdToken(tokens.id_token);
  return expiresAt;
}

function clearAuthState(setters: {
  setIdToken: (v: string | null) => void;
  setRefreshToken: (v: string | null) => void;
  setExpiresAt: (v: number | null) => void;
  setUser: (v: MeResponse | null) => void;
}): void {
  setters.setIdToken(null);
  setters.setRefreshToken(null);
  setters.setExpiresAt(null);
  setters.setUser(null);
  setInMemoryIdToken(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [idToken, setIdToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyTokens = useCallback((tokens: LoginResponse) => {
    applyTokensToState(tokens, {
      setIdToken,
      setRefreshToken,
      setExpiresAt,
    });
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    clearVisitQueryCache();
    clearAuthState({ setIdToken, setRefreshToken, setExpiresAt, setUser });
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<MeResponse> => {
      const tokens = await apiLogin({ email: email.trim(), password });
      applyTokens(tokens);
      const me = await getMe();
      setUser(me);
      return me;
    },
    [applyTokens],
  );

  const register = useCallback(
    async (email: string, password: string): Promise<MeResponse> => {
      const tokens = await apiRegister({ email: email.trim(), password });
      applyTokens(tokens);
      const me = await getMe();
      setUser(me);
      return me;
    },
    [applyTokens],
  );

  const refreshUser = useCallback(async (): Promise<MeResponse | null> => {
    if (!idToken) {
      return null;
    }
    try {
      const me = await getMe();
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }, [idToken]);

  const bootstrap = useCallback(async () => {
    try {
      const session = await loadStoredSession();
      if (!session) {
        return;
      }

      setIdToken(session.idToken);
      setRefreshToken(session.refreshToken);
      setExpiresAt(session.expiresAt);
      setInMemoryIdToken(session.idToken);

      if (isTokenExpired(session.expiresAt)) {
        const tokens = await refreshFirebaseTokens(session.refreshToken);
        if (!tokens) {
          await logout();
          return;
        }
        await saveTokens(tokens);
        applyTokens(tokens);
      }

      const me = await getMe();
      setUser(me);
    } catch {
      await logout();
    } finally {
      setIsLoading(false);
    }
  }, [applyTokens, logout]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    setTokenGetter(() => idToken);
    return () => setTokenGetter(null);
  }, [idToken]);

  useEffect(() => {
    setOnTokensRefreshed((tokens) => applyTokens(tokens));
    setOnSessionCleared(() => {
      clearVisitQueryCache();
      clearAuthState({ setIdToken, setRefreshToken, setExpiresAt, setUser });
      router.replace('/(auth)/login');
    });
    return () => {
      setOnTokensRefreshed(null);
      setOnSessionCleared(null);
    };
  }, [applyTokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      idToken,
      refreshToken,
      expiresAt,
      user,
      isLoading,
      isAuthenticated: Boolean(idToken && user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [
      idToken,
      refreshToken,
      expiresAt,
      user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
