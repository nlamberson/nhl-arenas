import type { LoginResponse } from './types';

const FIREBASE_TOKEN_URL = 'https://securetoken.googleapis.com/v1/token';

/** Refresh Firebase id_token using the stored refresh_token (Identity Toolkit REST API). */
export async function refreshFirebaseTokens(
  refreshToken: string,
): Promise<LoginResponse | null> {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!refreshToken || !apiKey) {
    return null;
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(`${FIREBASE_TOKEN_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    id_token: string;
    refresh_token: string;
    expires_in: string;
  };

  return {
    id_token: data.id_token,
    refresh_token: data.refresh_token,
    expires_in: parseInt(data.expires_in, 10),
  };
}
