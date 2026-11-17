import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Box } from "@/components/ui/gluestack/box";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthScreenShell } from "@/components/auth/AuthScreenShell";
import { FormTextField } from "@/components/forms/FormTextField";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  Button,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/gluestack/button";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { getErrorMessage } from "@/lib/errors";

type LoginForm = {
  email: string;
  password: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { login } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showServerWakeupMessage, setShowServerWakeupMessage] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!isSubmitting) {
      setShowServerWakeupMessage(false);
      return;
    }

    const timeout = setTimeout(() => setShowServerWakeupMessage(true), 5000);
    return () => clearTimeout(timeout);
  }, [isSubmitting]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    try {
      await login(email, password);
      router.replace("/(app)/dashboard");
    } catch (err) {
      const message = getErrorMessage(err, "Login failed");
      setSubmitError(message);
      showSnackbar({ message: `Sign in failed. ${message}`, variant: "error" });
    }
  });

  return (
    <AuthScreenShell>
      <Box className="gap-5">
        <FormTextField
          control={control}
          name="email"
          label="Email"
          fieldId="login-email"
          disabled={isSubmitting}
          rules={{
            required: "Email is required",
            pattern: {
              value: EMAIL_PATTERN,
              message: "Enter a valid email address",
            },
          }}
          inputProps={{
            placeholder: "you@example.com",
            keyboardType: "email-address",
            autoCapitalize: "none",
            autoComplete: "email",
            textContentType: "emailAddress",
          }}
        />

        <FormTextField
          control={control}
          name="password"
          label="Password"
          fieldId="login-password"
          disabled={isSubmitting}
          rules={{
            required: "Password is required",
            minLength: { value: 1, message: "Password is required" },
          }}
          inputProps={{
            placeholder: "••••••••",
            secureTextEntry: true,
            autoComplete: "password",
            textContentType: "password",
          }}
        />

        {submitError ? (
          <Text className="text-center text-sm text-destructive">
            {submitError}
          </Text>
        ) : null}

        <Button
          className="mt-1"
          onPress={() => void onSubmit()}
          isDisabled={isSubmitting}
          accessibilityLabel={
            isSubmitting
              ? showServerWakeupMessage
                ? "Waiting for the server to wake up"
                : "Signing in"
              : "Sign in"
          }
        >
          {isSubmitting ? <ButtonSpinner /> : null}
          <ButtonText>
            {isSubmitting
              ? showServerWakeupMessage
                ? "Waiting for the server to wake up…"
                : "Signing in…"
              : "Sign in"}
          </ButtonText>
        </Button>

        <AuthDivider />

        <GoogleSignInButton
          disabled={isSubmitting}
          onSuccess={() => router.replace("/(app)/dashboard")}
          onError={(message) => {
            setSubmitError(message);
            showSnackbar({
              message: `Google Sign-In failed. ${message}`,
              variant: "error",
            });
          }}
        />

        <Box className="flex-row items-center justify-center gap-1">
          <Text variant="muted">No account?</Text>
          <Link href="/(auth)/register" asChild>
            <Button
              action="primary"
              variant="link"
              size="sm"
              accessibilityRole="link"
              style={{ paddingHorizontal: 4, paddingVertical: 2 }}
            >
              <ButtonText className="font-medium">Create one</ButtonText>
            </Button>
          </Link>
        </Box>
      </Box>
    </AuthScreenShell>
  );
}
