import { SafeAreaView, ScrollView, View } from "react-native";

import {
  Button,
  ButtonText,
} from "@/components/ui/gluestack/button";
import { Text } from "@/components/ui/gluestack/text";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 items-center gap-1">
      <Text size="2xl" bold>
        {value}
      </Text>
      <Text size="xs" className="text-center text-typography-500">
        {label}
      </Text>
    </View>
  );
}

export default function DashboardPreviewScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="grow px-6 pb-10 pt-6">
        <View className="items-center gap-3 pb-8">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary">
            <Text size="2xl" bold className="text-primary-foreground">
              NF
            </Text>
          </View>
          <Text size="2xl" bold className="text-center">
            Welcome back, Nathan!
          </Text>
          <Text size="sm" className="text-typography-500">
            Dashboard preview · Gluestack primitives
          </Text>
        </View>

        <View className="flex-row rounded-xl border border-border bg-background-50 px-2 py-6">
          <Stat value={12} label="Teams seen" />
          <View className="w-px self-stretch bg-border" />
          <Stat value={8} label="Arenas visited" />
          <View className="w-px self-stretch bg-border" />
          <Stat value={14} label="Total visits" />
        </View>

        <View className="mt-6 gap-3">
          <Text size="lg" bold>
            Latest visit
          </Text>
          <View className="overflow-hidden rounded-xl border border-border bg-background-50">
            <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
              <Text size="sm" bold>
                Nov 8, 2026
              </Text>
              <Text size="sm" bold>
                Madison Square Garden
              </Text>
            </View>
            <View className="h-24 flex-row">
              <View className="flex-1 items-start justify-center bg-blue-900 px-4">
                <Text size="sm" bold className="text-white">
                  TOR · Maple Leafs
                </Text>
                <Text size="2xl" bold className="text-white">
                  3
                </Text>
              </View>
              <View className="flex-1 items-end justify-center bg-blue-700 px-4">
                <Text size="sm" bold className="text-white">
                  NYR · Rangers
                </Text>
                <Text size="2xl" bold className="text-white">
                  2
                </Text>
              </View>
            </View>
            <View className="px-4 py-3">
              <Text size="sm" bold className="text-primary-500">
                View Details ›
              </Text>
            </View>
          </View>

          <Button
            variant="link"
            action="primary"
            size="md"
            className="self-center"
          >
            <ButtonText>View all history</ButtonText>
          </Button>
        </View>

        <Button
          variant="outline"
          action="primary"
          size="md"
          className="mt-10 w-full"
        >
          <ButtonText>Sign out</ButtonText>
        </Button>
      </ScrollView>

      <Button
        action="primary"
        size="lg"
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full"
        accessibilityLabel="Log a new visit"
      >
        <ButtonText>+</ButtonText>
      </Button>
    </SafeAreaView>
  );
}
