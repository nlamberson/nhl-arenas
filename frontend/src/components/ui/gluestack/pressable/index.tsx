import { createPressable } from "@gluestack-ui/core/pressable/creator";
import { Pressable as NativePressable } from "react-native";

const Pressable = createPressable({ Root: NativePressable });

export { Pressable };
