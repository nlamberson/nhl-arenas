import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NHLBrand } from "@/components/auth/NHLBrand";
import { Box } from "@/components/ui/gluestack/box";

interface AuthScreenShellProps {
  children: ReactNode;
}

export function AuthScreenShell({ children }: AuthScreenShellProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <Box className="mx-auto w-full max-w-sm gap-8">
            <NHLBrand />
            {children}
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
