import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';

interface BackButtonProps {
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function BackButton({
  onPress,
  accessibilityLabel = 'Go back',
}: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      className="min-w-12 justify-center py-1 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text className="text-3xl leading-none text-primary">‹</Text>
    </Pressable>
  );
}
