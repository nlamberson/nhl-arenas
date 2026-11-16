import { Text as GluestackText } from "@/components/ui/gluestack/text";
import { cn } from "@/lib/utils";
import { Slot } from "@rn-primitives/slot";
import * as React from "react";
import { Platform, Text as RNText, type Role } from "react-native";

const TEXT_SIZE = {
  default: "md",
  h1: "4xl",
  h2: "3xl",
  h3: "2xl",
  h4: "xl",
  p: "md",
  blockquote: "md",
  code: "sm",
  lead: "xl",
  large: "lg",
  small: "sm",
  muted: "sm",
} as const;

type TextVariant = keyof typeof TEXT_SIZE;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  blockquote: Platform.select({ web: "blockquote" as Role }),
  code: Platform.select({ web: "code" as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: "1",
  h2: "2",
  h3: "3",
  h4: "4",
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = "default",
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> & {
    variant?: TextVariant;
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const accessibilityProps = {
    role: ROLE[variant],
    "aria-level": ARIA_LEVEL[variant],
  };

  if (asChild) {
    return (
      <Slot
        className={cn(textClass, className)}
        {...accessibilityProps}
        {...props}
      />
    );
  }

  return (
    <GluestackText
      size={TEXT_SIZE[variant]}
      className={cn(textClass, className)}
      {...accessibilityProps}
      {...props}
    />
  );
}

export { Text, TextClassContext };
