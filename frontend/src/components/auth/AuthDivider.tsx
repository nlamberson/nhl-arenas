import { View } from "react-native";

import { Divider } from "@/components/ui/gluestack/divider";
import { Text } from "@/components/ui/gluestack/text";

export function AuthDivider() {
  return (
    <View className="flex-row items-center gap-3">
      <Divider className="flex-1" />
      <Text size="xs" className="uppercase tracking-wide">
        or
      </Text>
      <Divider className="flex-1" />
    </View>
  );
}
