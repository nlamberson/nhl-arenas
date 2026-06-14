import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

function getGoogleClientIds(): {
  webClientId: string | undefined;
  iosClientId: string | undefined;
} {
  return {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  };
}

/** Stable redirect URI — must be whitelisted in Google Cloud Console OAuth client. */
export function getGoogleRedirectUri(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/oauthredirect`;
  }

  return makeRedirectUri({
    native: `${Constants.expoConfig?.ios?.bundleIdentifier ?? Constants.expoConfig?.android?.package ?? 'com.example.nhlarenas'}:/oauthredirect`,
    scheme: 'nhlarenas',
    path: 'oauthredirect',
  });
}

export function isGoogleSignInConfigured(): boolean {
  const { webClientId } = getGoogleClientIds();
  return Boolean(webClientId?.trim());
}

/** Prompt Google OAuth and return the Google ID token for backend exchange. */
export function useGoogleAuth() {
  const { webClientId, iosClientId } = getGoogleClientIds();
  const isConfigured = Boolean(webClientId?.trim());
  const redirectUri = getGoogleRedirectUri();

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId,
    iosClientId: iosClientId ?? webClientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (__DEV__ && isConfigured) {
      console.info(
        `[Google Sign-In] Add this redirect URI to Google Cloud Console → Credentials → your Web OAuth client → Authorized redirect URIs:\n  ${redirectUri}`,
      );
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        console.info(
          `[Google Sign-In] Also add this JavaScript origin:\n  ${window.location.origin}`,
        );
      }
    }
  }, [isConfigured, redirectUri]);

  const promptGoogleSignIn = useCallback(async (): Promise<string> => {
    if (!isConfigured || !webClientId) {
      throw new GoogleAuthError(
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in frontend/.env.',
      );
    }

    if (!request) {
      throw new GoogleAuthError('Google Sign-In is still loading. Try again in a moment.');
    }

    const result = await promptAsync();

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new GoogleAuthError('Google Sign-In was cancelled.');
    }

    if (result.type !== 'success') {
      throw new GoogleAuthError(
        `Google Sign-In failed. If you see redirect_uri_mismatch, add this redirect URI in Google Cloud Console: ${redirectUri}`,
      );
    }

    const idToken = result.params.id_token ?? result.authentication?.idToken;

    if (!idToken) {
      throw new GoogleAuthError('Google did not return an ID token.');
    }

    return idToken;
  }, [isConfigured, webClientId, request, promptAsync, redirectUri]);

  return useMemo(
    () => ({
      isConfigured,
      isReady: Boolean(request),
      redirectUri,
      promptGoogleSignIn,
    }),
    [isConfigured, request, redirectUri, promptGoogleSignIn],
  );
}
