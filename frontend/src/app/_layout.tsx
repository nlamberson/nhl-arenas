import 'react-native-gesture-handler';
import '../global.css';

import * as WebBrowser from 'expo-web-browser';

import { PageLoadingIndicator } from '@/components/PageLoadingIndicator';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { PortalHost } from '@rn-primitives/portal';
import {
  DarkTheme,
  Redirect,
  Stack,
  ThemeProvider,
  usePathname,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

// Completes Google OAuth in the popup/tab that lands on /oauthredirect (must run on app load).
WebBrowser.maybeCompleteAuthSession();

// Hide native splash once React mounts; auth bootstrap shows PageLoadingIndicator.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <QueryProvider>
            <RootLayoutNav />
          </QueryProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const isOAuthRedirect = pathname === '/oauthredirect';

  useEffect(() => {
    if (isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View className="dark flex-1 bg-background">
        <PageLoadingIndicator
          message="Loading…"
          description="This may take a moment if the server is waking up."
        />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';
  const inAppGroup = segments[0] === '(app)';

  if (!isAuthenticated && !inAuthGroup && !isOAuthRedirect) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isAuthenticated && !inAppGroup && !isOAuthRedirect) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <View className="dark flex-1">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="oauthredirect" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <PortalHost />
      </View>
    </ThemeProvider>
  );
}
