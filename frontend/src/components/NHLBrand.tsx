import { Image, View } from 'react-native';

import { Text } from '@/components/ui/text';

import NHLShield from '@/assets/images/NHL_Shield.png';

const LOGO_SIZE = 80;

export function NHLBrand() {
  return (
    <View className="items-center gap-3">
      <Image
        source={NHLShield}
        style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
        resizeMode="contain"
        accessibilityLabel="NHL logo"
      />
      <Text variant="large" className="text-primary tracking-[0.35em]">
        ARENAS
      </Text>
    </View>
  );
}
