import { Box } from "@/components/ui/gluestack/box";
import { Text } from "@/components/ui/text";
import { BackButton } from "@/components/layout/BackButton";

interface ScreenHeaderProps {
  title: string;
  backAccessibilityLabel?: string;
  trailingSpacerWidth?: "sm" | "md";
}

const TRAILING_WIDTH = {
  sm: "min-w-12",
  md: "min-w-16",
} as const;

export function ScreenHeader({
  title,
  backAccessibilityLabel,
  trailingSpacerWidth = "md",
}: ScreenHeaderProps) {
  return (
    <Box className="flex-row shrink-0 items-center border-b border-border px-4 py-3">
      <BackButton accessibilityLabel={backAccessibilityLabel} />
      <Text variant="large" className="flex-1 text-center">
        {title}
      </Text>
      <Box className={TRAILING_WIDTH[trailingSpacerWidth]} />
    </Box>
  );
}
