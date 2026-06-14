import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, View } from 'react-native';

import { AuthDivider } from '@/components/AuthDivider';
import { AuthScreenShell } from '@/components/AuthScreenShell';
import { FormTextField } from '@/components/FormTextField';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { PageLoadingIndicator } from '@/components/PageLoadingIndicator';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';

type LoginForm = {
  email: string;
  password: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    try {
      await login(email, password);
      router.replace('/(app)/dashboard');
    } catch (err) {
      const message = getErrorMessage(err, 'Login failed');
      setSubmitError(message);
      Alert.alert('Sign in failed', message);
    }
  });

  return (
    <AuthScreenShell>
      {isSubmitting ? (
        <PageLoadingIndicator
          message="Signing in…"
          description="This may take a moment if the server is waking up."
          className="items-center justify-center py-16"
        />
      ) : (
      <View className="gap-5">
        <FormTextField
          control={control}
          name="email"
          label="Email"
          fieldId="login-email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: EMAIL_PATTERN,
              message: 'Enter a valid email address',
            },
          }}
          inputProps={{
            placeholder: 'you@example.com',
            keyboardType: 'email-address',
            autoCapitalize: 'none',
            autoComplete: 'email',
            textContentType: 'emailAddress',
          }}
        />

        <FormTextField
          control={control}
          name="password"
          label="Password"
          fieldId="login-password"
          rules={{
            required: 'Password is required',
            minLength: { value: 1, message: 'Password is required' },
          }}
          inputProps={{
            placeholder: '••••••••',
            secureTextEntry: true,
            autoComplete: 'password',
            textContentType: 'password',
          }}
        />

        {submitError ? (
          <Text className="text-center text-sm text-destructive">{submitError}</Text>
        ) : null}

        <Button className="mt-1" onPress={onSubmit} disabled={isSubmitting}>
          <Text>Sign in</Text>
        </Button>

        <AuthDivider />

        <GoogleSignInButton
          onSuccess={() => router.replace('/(app)/dashboard')}
          onError={(message) => {
            setSubmitError(message);
            Alert.alert('Google Sign-In failed', message);
          }}
        />

        <View className="flex-row justify-center gap-1">
          <Text variant="muted">No account?</Text>
          <Link href="/(auth)/register" asChild>
            <Text className="font-medium text-primary" accessibilityRole="link">
              Create one
            </Text>
          </Link>
        </View>
      </View>
      )}
    </AuthScreenShell>
  );
}
