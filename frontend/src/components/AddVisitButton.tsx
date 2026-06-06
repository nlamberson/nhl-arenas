import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface AddVisitButtonProps {
  className?: string;
}

export function AddVisitButton({ className }: AddVisitButtonProps) {
  return (
    <Pressable
      onPress={() => router.push('/visits/new')}
      className={cn(
        'absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-md active:opacity-90',
        className,
      )}
      accessibilityRole="button"
      accessibilityLabel="Log a new visit"
    >
      <Text className="text-3xl leading-none text-primary-foreground">+</Text>
    </Pressable>
  );
}
