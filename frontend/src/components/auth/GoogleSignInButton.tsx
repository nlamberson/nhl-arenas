import { useState } from "react";
import { View } from "react-native";

import {
  Button,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/gluestack/button";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { useAuth } from "@/context/AuthContext";
import {
  GoogleAuthError,
  isGoogleSignInConfigured,
  useGoogleAuth,
} from "@/hooks/useGoogleAuth";
import { getErrorMessage } from "@/lib/errors";

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  label?: string;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  label = "Continue with Google",
  disabled = false,
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
      if (err instanceof GoogleAuthError && err.message.includes("cancelled")) {
        return;
      }
      const message = getErrorMessage(err, "Google Sign-In failed");
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      action="primary"
      size="md"
      className="w-full"
      onPress={handlePress}
      isDisabled={loading || !isReady || disabled}
      accessibilityLabel={label}
    >
      {loading ? (
        <View className="flex-row items-center gap-2">
          <ButtonSpinner />
          <ButtonText>Signing in…</ButtonText>
        </View>
      ) : (
        <>
          <GoogleIcon size={18} />
          <ButtonText>{label}</ButtonText>
        </>
      )}
    </Button>
  );
}
