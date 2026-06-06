import * as SecureStore from 'expo-secure-store';

import type { LoginResponse } from './types';

const ID_TOKEN_KEY = 'nhl_arenas_id_token';
const REFRESH_TOKEN_KEY = 'nhl_arenas_refresh_token';
const EXPIRES_AT_KEY = 'nhl_arenas_expires_at';

/** Refresh slightly before expiry so requests don't race the clock. */
const EXPIRY_BUFFER_MS = 60_000;

export interface StoredSession {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - EXPIRY_BUFFER_MS;
}

export function expiresAtFromLogin(tokens: LoginResponse): number {
  return Date.now() + tokens.expires_in * 1000;
}

type TokenGetter = () => string | null | Promise<string | null>;

let inMemoryIdToken: string | null = null;
let tokenGetter: TokenGetter | null = null;

/** Optional override so AuthContext can serve the token without async reads. */
export function setTokenGetter(getter: TokenGetter | null): void {
  tokenGetter = getter;
}

export function setInMemoryIdToken(token: string | null): void {
  inMemoryIdToken = token;
}

export async function getIdToken(): Promise<string | null> {
  if (tokenGetter) {
    const token = await tokenGetter();
    if (token) return token;
  }
  if (inMemoryIdToken) return inMemoryIdToken;
  return SecureStore.getItemAsync(ID_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function loadStoredSession(): Promise<StoredSession | null> {
  const [idToken, refreshToken, expiresAtRaw] = await Promise.all([
    SecureStore.getItemAsync(ID_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(EXPIRES_AT_KEY),
  ]);

  if (!idToken || !refreshToken) {
    return null;
  }

  const expiresAt = expiresAtRaw ? parseInt(expiresAtRaw, 10) : 0;
  inMemoryIdToken = idToken;
  return { idToken, refreshToken, expiresAt };
}

export async function saveTokens(tokens: LoginResponse): Promise<void> {
  const expiresAt = expiresAtFromLogin(tokens);
  inMemoryIdToken = tokens.id_token;
  await Promise.all([
    SecureStore.setItemAsync(ID_TOKEN_KEY, tokens.id_token),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token),
    SecureStore.setItemAsync(EXPIRES_AT_KEY, String(expiresAt)),
  ]);
}

export async function clearTokens(): Promise<void> {
  inMemoryIdToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ID_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
  ]);
}
