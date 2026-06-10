import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { LoginResponse } from './types';

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage unavailable (e.g. private browsing)
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage unavailable
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

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
  return getStorageItem(ID_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getStorageItem(REFRESH_TOKEN_KEY);
}

export async function loadStoredSession(): Promise<StoredSession | null> {
  const [idToken, refreshToken, expiresAtRaw] = await Promise.all([
    getStorageItem(ID_TOKEN_KEY),
    getStorageItem(REFRESH_TOKEN_KEY),
    getStorageItem(EXPIRES_AT_KEY),
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
    setStorageItem(ID_TOKEN_KEY, tokens.id_token),
    setStorageItem(REFRESH_TOKEN_KEY, tokens.refresh_token),
    setStorageItem(EXPIRES_AT_KEY, String(expiresAt)),
  ]);
}

export async function clearTokens(): Promise<void> {
  inMemoryIdToken = null;
  await Promise.all([
    deleteStorageItem(ID_TOKEN_KEY),
    deleteStorageItem(REFRESH_TOKEN_KEY),
    deleteStorageItem(EXPIRES_AT_KEY),
  ]);
}
