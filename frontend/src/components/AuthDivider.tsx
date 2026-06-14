import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export function AuthDivider() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-border" />
      <Text variant="muted" className="text-xs uppercase tracking-wide">
        or
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
