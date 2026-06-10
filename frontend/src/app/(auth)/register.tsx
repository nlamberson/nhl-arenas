import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AuthScreenShell } from '@/components/AuthScreenShell';
import { PageLoadingIndicator } from '@/components/PageLoadingIndicator';
import { FormTextField } from '@/components/FormTextField';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';

type RegisterForm = {
  email: string;
  password: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function RegisterScreen() {
  const { register: registerUser } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    try {
      await registerUser(email, password);
      router.replace('/(app)');
    } catch (err) {
      const message = getErrorMessage(err, 'Registration failed');
      setSubmitError(message);
      Alert.alert('Registration failed', message);
    }
  });

  return (
    <AuthScreenShell>
      {isSubmitting ? (
        <PageLoadingIndicator
          message="Creating your account…"
          description="This may take a moment if the server is waking up."
          className="items-center justify-center py-16"
        />
      ) : (
      <View className="gap-5">
        <FormTextField
          control={control}
          name="email"
          label="Email"
          fieldId="register-email"
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
          fieldId="register-password"
          rules={{
            required: 'Password is required',
            minLength: {
              value: MIN_PASSWORD_LENGTH,
              message: 'Password must be at least 6 characters',
            },
          }}
          inputProps={{
            placeholder: '••••••••',
            secureTextEntry: true,
            autoComplete: 'new-password',
            textContentType: 'newPassword',
          }}
        />

        {submitError ? (
          <Text className="text-center text-sm text-destructive">{submitError}</Text>
        ) : null}

        <Button className="mt-1" onPress={onSubmit} disabled={isSubmitting}>
          <Text>Create account</Text>
        </Button>

        <View className="flex-row justify-center gap-1">
          <Text variant="muted">Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <Text className="font-medium text-primary" accessibilityRole="link">
              Sign in
            </Text>
          </Link>
        </View>
      </View>
      )}
    </AuthScreenShell>
  );
}
