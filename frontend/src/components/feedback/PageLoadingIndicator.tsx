import { Box } from "@/components/ui/gluestack/box";
import { Spinner } from "@/components/ui/gluestack/spinner";
import { Text } from "@/components/ui/gluestack/text";

interface PageLoadingIndicatorProps {
  message?: string;
  description?: string;
  className?: string;
}

/** Centered spinner and status text for screen-level data loading. */
export function PageLoadingIndicator({
  message = "Loading…",
  description,
  className,
}: PageLoadingIndicatorProps) {
  return (
    <Box
      className={
        className ?? "flex-1 items-center justify-center gap-4 px-6 py-12"
      }
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <Spinner size="large" />
      <Box className="items-center gap-1">
        <Text size="md" bold className="text-center">
          {message}
        </Text>
        {description ? (
          <Text size="sm" className="max-w-xs text-center text-typography-500">
            {description}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}
