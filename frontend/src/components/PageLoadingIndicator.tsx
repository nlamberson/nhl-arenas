import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { PAGE_SPINNER_COLOR } from '@/constants/theme';

interface PageLoadingIndicatorProps {
  message?: string;
  description?: string;
  className?: string;
}

/** Centered spinner and status text for screen-level data loading. */
export function PageLoadingIndicator({
  message = 'Loading…',
  description,
  className,
}: PageLoadingIndicatorProps) {
  return (
    <View
      className={className ?? 'flex-1 items-center justify-center gap-4 px-6 py-12'}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <ActivityIndicator size="large" color={PAGE_SPINNER_COLOR} />
      <View className="items-center gap-1">
        <Text className="text-center text-base font-medium">{message}</Text>
        {description ? (
          <Text variant="muted" className="max-w-xs text-center text-sm">
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
