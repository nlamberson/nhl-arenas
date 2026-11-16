import { tva, type VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import React from "react";
import { View } from "react-native";

const cardStyle = tva({
  base: "overflow-hidden rounded-xl border border-border bg-card",
  variants: {
    size: {
      sm: "p-3",
      md: "p-5",
      lg: "p-6",
    },
    variant: {
      elevated: "shadow-md",
      outline: "",
      ghost: "border-transparent bg-transparent",
      filled: "bg-background-50",
    },
  },
});

type CardProps = React.ComponentProps<typeof View> &
  VariantProps<typeof cardStyle> & {
    className?: string;
  };

const Card = React.forwardRef<React.ElementRef<typeof View>, CardProps>(
  ({ className, size = "md", variant = "elevated", ...props }, ref) => (
    <View
      ref={ref}
      {...props}
      className={cardStyle({ size, variant, class: className })}
    />
  ),
);

Card.displayName = "Card";

export { Card };
