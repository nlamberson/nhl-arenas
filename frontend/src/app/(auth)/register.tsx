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

type RegisterForm = {
  email: string;
  password: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function RegisterScreen() {
  const { register: registerUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showServerWakeupMessage, setShowServerWakeupMessage] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterForm>({
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
      await registerUser(email, password);
      router.replace("/(app)/dashboard");
    } catch (err) {
      const message = getErrorMessage(err, "Registration failed");
      setSubmitError(message);
      showSnackbar({
        message: `Registration failed. ${message}`,
        variant: "error",
      });
    }
  });

  return (
    <AuthScreenShell>
      <Box className="gap-5">
        <FormTextField
          control={control}
          name="email"
          label="Email"
          fieldId="register-email"
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
          fieldId="register-password"
          disabled={isSubmitting}
          rules={{
            required: "Password is required",
            minLength: {
              value: MIN_PASSWORD_LENGTH,
              message: "Password must be at least 6 characters",
            },
          }}
          inputProps={{
            placeholder: "••••••••",
            secureTextEntry: true,
            autoComplete: "new-password",
            textContentType: "newPassword",
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
                : "Creating your account"
              : "Create account"
          }
        >
          {isSubmitting ? <ButtonSpinner /> : null}
          <ButtonText>
            {isSubmitting
              ? showServerWakeupMessage
                ? "Waiting for the server to wake up…"
                : "Creating your account…"
              : "Create account"}
          </ButtonText>
        </Button>

        <AuthDivider />

        <GoogleSignInButton
          label="Sign up with Google"
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
          <Text variant="muted">Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <Button
              action="primary"
              variant="link"
              size="sm"
              accessibilityRole="link"
              style={{ paddingHorizontal: 4, paddingVertical: 2 }}
            >
              <ButtonText className="font-medium">Sign in</ButtonText>
            </Button>
          </Link>
        </Box>
      </Box>
    </AuthScreenShell>
  );
}
