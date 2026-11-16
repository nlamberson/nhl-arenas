import {
  createToast,
  createToastHook,
} from "@gluestack-ui/core/toast/creator";
import { Text } from "@/components/ui/gluestack/text";
import { Animated, View } from "react-native";

const Toast = createToast({
  Root: View,
  Title: Text,
  Description: Text,
});

const useToast = createToastHook(Animated.View, View);

export { Toast, useToast };
