import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { Pressable } from "@/components/ui/gluestack/pressable";
import { Toast, useToast } from "@/components/ui/gluestack/toast";

export type SnackbarVariant = "default" | "error";

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

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  const showSnackbar = useCallback(
    ({ message, variant = "default", durationMs = 4000 }: ShowSnackbarOptions) => {
      toast.show({
        placement: "bottom",
        duration: durationMs,
        render: ({ id }) => (
          <Pressable
            onPress={() => toast.close(id)}
            accessibilityRole="button"
          >
            <Toast
              className={
                variant === "error" ? "bg-error-700" : "bg-background-800"
              }
            >
              <Toast.Description>{message}</Toast.Description>
            </Toast>
          </Pressable>
        ),
      });
    },
    [toast],
  );

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);
  return (
    <SnackbarContext.Provider value={value}>{children}</SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
}
