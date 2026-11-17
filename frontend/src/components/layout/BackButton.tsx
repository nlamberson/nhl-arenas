import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { Button, ButtonIcon } from "@/components/ui/gluestack/button";

interface BackButtonProps {
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function goBackOrHome() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace("/(app)/dashboard");
}

export function BackButton({
  onPress,
  accessibilityLabel = "Go back",
}: BackButtonProps) {
  return (
    <Button
      onPress={onPress ?? goBackOrHome}
      action="default"
      variant="solid"
      size="md"
      className="h-10 min-w-12 justify-center rounded-full p-0 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <ButtonIcon as={ChevronLeft} width={24} height={24} />
    </Button>
  );
}
