import { createModal } from "@gluestack-ui/core/modal/creator";
import { Pressable, View } from "react-native";

const Modal = createModal({
  Root: View,
  Content: View,
  CloseButton: Pressable,
  Header: View,
  Footer: View,
  Body: View,
  Backdrop: Pressable,
  AnimatePresence: View,
});

export { Modal };
