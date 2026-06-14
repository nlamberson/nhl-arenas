import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/GoogleIcon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { GoogleAuthError, isGoogleSignInConfigured, useGoogleAuth } from '@/hooks/useGoogleAuth';
import { getErrorMessage } from '@/lib/errors';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  label?: string;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  label = 'Continue with Google',
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const { isConfigured, isReady, promptGoogleSignIn } = useGoogleAuth();
  const [loading, setLoading] = useState(false);

  if (!isGoogleSignInConfigured() || !isConfigured) {
    return null;
  }

  const handlePress = async () => {
    setLoading(true);
    try {
      const googleIdToken = await promptGoogleSignIn();
      await loginWithGoogle(googleIdToken);
      onSuccess?.();
    } catch (err) {
      if (err instanceof GoogleAuthError && err.message.includes('cancelled')) {
        return;
      }
      const message = getErrorMessage(err, 'Google Sign-In failed');
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onPress={handlePress}
      disabled={loading || !isReady}
      accessibilityLabel={label}
    >
      {loading ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator />
          <Text>Signing in…</Text>
        </View>
      ) : (
        <>
          <GoogleIcon size={18} />
          <Text>{label}</Text>
        </>
      )}
    </Button>
  );
}
