import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { View, type PressableProps } from "react-native";

import { Pressable } from "@/components/ui/gluestack/pressable";

interface CardSurfaceProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onPress?: PressableProps["onPress"];
  accessibilityLabel?: PressableProps["accessibilityLabel"];
}

function CardSurface({
  children,
  className,
  interactive = false,
  onPress,
  accessibilityLabel,
}: CardSurfaceProps) {
  const resolvedClassName = cn(
    "overflow-hidden rounded-xl border border-border bg-card",
    interactive && "active:opacity-95",
    className,
  );

  if (interactive) {
    return (
      <Pressable
        className={resolvedClassName}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return <View className={resolvedClassName}>{children}</View>;
}

export { CardSurface };
