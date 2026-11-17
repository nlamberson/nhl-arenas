import { Link, Stack } from "expo-router";

import { Box } from "@/components/ui/gluestack/box";
import { Text } from "@/components/ui/text";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <Box className="flex-1 items-center justify-center bg-background px-5">
        <Text variant="large">This screen doesn't exist.</Text>

        <Link href="/(app)/dashboard" className="mt-4 py-4">
          <Text className="text-primary font-medium">Go to dashboard</Text>
        </Link>
      </Box>
    </>
  );
}
