import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

export type SnackbarVariant = 'default' | 'error';

export type ShowSnackbarOptions = {
  message: string;
  variant?: SnackbarVariant;
  /** Auto-dismiss delay in ms. Default 4000. */
  durationMs?: number;
};

type SnackbarContextValue = {
  showSnackbar: (options: ShowSnackbarOptions) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

type SnackbarState = {
  id: number;
  message: string;
  variant: SnackbarVariant;
  durationMs: number;
};

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const idRef = useRef(0);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    setSnackbar(null);
  }, []);

  const showSnackbar = useCallback((options: ShowSnackbarOptions) => {
    idRef.current += 1;
    setSnackbar({
      id: idRef.current,
      message: options.message,
      variant: options.variant ?? 'default',
      durationMs: options.durationMs ?? 4000,
    });
  }, []);

  useEffect(() => {
    if (!snackbar) {
      return;
    }
    const timer = setTimeout(hide, snackbar.durationMs);
    return () => clearTimeout(timer);
  }, [snackbar, hide]);

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  const isError = snackbar?.variant === 'error';

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {snackbar ? (
        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 z-50 items-center px-4"
          style={{ bottom: Math.max(insets.bottom, 12) + 8 }}
        >
          <Animated.View
            key={snackbar.id}
            entering={FadeInDown.duration(200)}
            exiting={FadeOutDown.duration(150)}
            className="w-full max-w-lg rounded-xl px-4 py-3.5"
            style={
              isError
                ? {
                    backgroundColor: '#7f1d1d',
                    borderWidth: 1,
                    borderColor: '#991b1b',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 8,
                  }
                : {
                    backgroundColor: '#1e293b',
                    borderWidth: 1,
                    borderColor: '#334155',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }
            }
          >
            <Pressable onPress={hide} accessibilityRole="button">
              <Text
                className="text-center text-sm font-medium"
                style={{ color: '#fef2f2' }}
              >
                {snackbar.message}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}
