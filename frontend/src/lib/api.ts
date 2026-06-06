import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  clearTokens,
  getIdToken,
  getRefreshToken,
  saveTokens,
} from './authStorage';
import { refreshFirebaseTokens } from './firebaseAuth';
import type {
  ArenaResponse,
  GetVisitsParams,
  LoginRequest,
  LoginResponse,
  MeResponse,
  TeamResponse,
  VisitCreate,
  VisitUpdate,
  VisitResponse,
  VisitStatsResponse,
  VisitsPage,
} from './types';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  console.warn(
    'EXPO_PUBLIC_API_URL is not set. API calls will fail until you configure frontend/.env',
  );
}

type RequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;
let onSessionCleared: (() => void) | null = null;
let onTokensRefreshed: ((tokens: LoginResponse) => void) | null = null;

/** Clear in-memory auth state when refresh fails (wired by AuthContext). */
export function setOnSessionCleared(handler: (() => void) | null): void {
  onSessionCleared = handler;
}

/** Keep AuthContext state in sync when the axios interceptor refreshes tokens. */
export function setOnTokensRefreshed(
  handler: ((tokens: LoginResponse) => void) | null,
): void {
  onTokensRefreshed = handler;
}

async function refreshIdToken(): Promise<string | null> {
  const storedRefresh = await getRefreshToken();
  if (!storedRefresh) {
    return null;
  }

  const tokens = await refreshFirebaseTokens(storedRefresh);
  if (!tokens) {
    return null;
  }

  await saveTokens(tokens);
  onTokensRefreshed?.(tokens);
  return tokens.id_token;
}

async function tryRefreshToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshIdToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function clearSession(): Promise<void> {
  await clearTokens();
  onSessionCleared?.();
}

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

function isPublicAuthRoute(url: string | undefined): boolean {
  return Boolean(url?.includes('/auth/login') || url?.includes('/auth/register'));
}

api.interceptors.request.use(async (config) => {
  if (isPublicAuthRoute(config.url)) {
    return config;
  }

  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RequestConfig | undefined;
    if (!config || config._retry || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isPublicAuthRoute(config.url)) {
      return Promise.reject(error);
    }

    config._retry = true;
    const newToken = await tryRefreshToken();

    if (newToken) {
      config.headers.Authorization = `Bearer ${newToken}`;
      return api.request(config);
    }

    await clearSession();
    return Promise.reject(error);
  },
);

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/v1/auth/login', credentials);
  await saveTokens(data);
  return data;
}

export async function register(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/v1/auth/register', credentials);
  await saveTokens(data);
  return data;
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>('/api/v1/auth/me');
  return data;
}

export async function getVisitStats(): Promise<VisitStatsResponse> {
  const { data } = await api.get<VisitStatsResponse>('/api/v1/visits/stats');
  return data;
}

export async function getLatestVisit(): Promise<VisitResponse | null> {
  const { data } = await api.get<VisitResponse | null>('/api/v1/visits/latest');
  return data;
}

export async function getVisits(params: GetVisitsParams = {}): Promise<VisitsPage> {
  const { data, headers } = await api.get<VisitResponse[]>('/api/v1/visits', {
    params,
  });
  const rawTotal = headers['x-total-count'] ?? headers['X-Total-Count'];
  const total = parseInt(String(rawTotal ?? '0'), 10);
  return { visits: data, total };
}

export async function getVisit(id: string): Promise<VisitResponse> {
  const { data } = await api.get<VisitResponse>(`/api/v1/visits/${id}`);
  return data;
}

export async function createVisit(payload: VisitCreate): Promise<VisitResponse> {
  const { data } = await api.post<VisitResponse>('/api/v1/visits', payload);
  return data;
}

export async function updateVisit(
  id: string,
  payload: VisitUpdate,
): Promise<VisitResponse> {
  const { data } = await api.patch<VisitResponse>(`/api/v1/visits/${id}`, payload);
  return data;
}

export async function getTeams(): Promise<TeamResponse[]> {
  const { data } = await api.get<TeamResponse[]>('/api/v1/reference/teams');
  return data;
}

export async function getArenas(): Promise<ArenaResponse[]> {
  const { data } = await api.get<ArenaResponse[]>('/api/v1/reference/arenas');
  return data;
}
