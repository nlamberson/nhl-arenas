import { router } from "expo-router";
import { Plus } from "lucide-react-native";

import { Button, ButtonIcon } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddVisitButtonProps {
  className?: string;
}

export function AddVisitButton({ className }: AddVisitButtonProps) {
  return (
    <Button
      onPress={() => router.push("/visits/new")}
      className={cn(
        "absolute bottom-6 right-6 h-14 w-14 rounded-full p-3.5 shadow-md active:opacity-90",
        className,
      )}
      accessibilityRole="button"
      accessibilityLabel="Log a new visit"
      size="lg"
    >
      <ButtonIcon as={Plus} />
    </Button>
  );
}
