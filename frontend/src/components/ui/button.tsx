import {
  Button as GluestackButton,
  ButtonIcon,
} from "@/components/ui/gluestack/button";
import type { Pressable } from "react-native";

type ButtonVariant =
  | "default"
  | "destructive"
  | "secondary"
  | "ghost"
  | "outline"
  | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, "ref"> & {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function Button({
  className,
  variant = "default",
  size = "default",
  disabled,
  ...props
}: ButtonProps) {
  const action =
    variant === "destructive"
      ? "negative"
      : variant === "secondary"
        ? "secondary"
        : variant === "ghost"
          ? "default"
          : "primary";

  return (
    <GluestackButton
      action={action}
      variant={variant === "outline" || variant === "link" ? variant : "solid"}
      size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"}
      className={className}
      isDisabled={disabled}
      role="button"
      {...props}
    />
  );
}

export { Button, ButtonIcon };
export type { ButtonProps };
