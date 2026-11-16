import { createAlertDialog } from "@gluestack-ui/core/alert-dialog/creator";
import { Pressable, View } from "react-native";

const AlertDialog = createAlertDialog({
  Root: View,
  Content: View,
  CloseButton: Pressable,
  Header: View,
  Footer: View,
  Body: View,
  Backdrop: Pressable,
  AnimatePresence: View,
});

export { AlertDialog };
