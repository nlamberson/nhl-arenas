"use client";

import { createModal as createDrawer } from "@gluestack-ui/core/modal/creator";
import {
  tva,
  useStyleContext,
  withStyleContext,
  type VariantProps,
} from "@gluestack-ui/utils/nativewind-utils";
import { BlurView } from "expo-blur";
import { cssInterop } from "nativewind";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  SlideOutDown,
  SlideOutLeft,
  SlideOutRight,
  SlideOutUp,
} from "react-native-reanimated";

const SCOPE = "DRAWER";
const SLIDE_DURATION = 300;
const BACKDROP_FADE_DURATION = 180;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

cssInterop(AnimatedPressable, { className: { target: "style" } });
cssInterop(AnimatedView, { className: { target: "style" } });

const UIDrawer = createDrawer({
  Root: withStyleContext(View, SCOPE),
  Backdrop: AnimatedPressable,
  Content: AnimatedView,
  Body: ScrollView,
  CloseButton: Pressable,
  Footer: View,
  Header: View,
});

const drawerStyle = tva({
  base: "relative h-full w-full web:pointer-events-none",
  variants: {
    size: {
      sm: "",
      md: "",
      lg: "",
      full: "",
    },
    anchor: {
      left: "items-start",
      right: "items-end",
      top: "justify-start",
      bottom: "justify-end",
    },
  },
});

const drawerBackdropStyle = tva({
  base: "absolute inset-0 z-0 bg-black/35 web:cursor-default",
});

const drawerContentStyle = tva({
  base: "absolute z-10 bg-background shadow-hard-5",
  parentVariants: {
    size: {
      sm: "",
      md: "",
      lg: "",
      full: "",
    },
    anchor: {
      left: "left-0 top-0 h-full border-r border-border/80",
      right: "right-0 top-0 h-full border-l border-border/80",
      top: "left-0 top-0 w-full border-b border-border/80 rounded-b-xl",
      bottom: "left-0 bottom-0 w-full border-t border-border/80 rounded-t-xl",
    },
  },
  parentCompoundVariants: [
    { size: "sm", anchor: "left", class: "w-2/5 sm:w-1/4" },
    { size: "sm", anchor: "right", class: "w-2/5 sm:w-1/4" },
    { size: "sm", anchor: "top", class: "h-1/4" },
    { size: "sm", anchor: "bottom", class: "h-1/4" },
    { size: "md", anchor: "left", class: "w-1/2" },
    { size: "md", anchor: "right", class: "w-1/2" },
    { size: "md", anchor: "top", class: "h-1/2" },
    { size: "md", anchor: "bottom", class: "h-1/2" },
    { size: "lg", anchor: "left", class: "w-3/4" },
    { size: "lg", anchor: "right", class: "w-3/4" },
    { size: "lg", anchor: "top", class: "h-3/4" },
    { size: "lg", anchor: "bottom", class: "h-3/4" },
    { size: "full", anchor: "left", class: "w-full" },
    { size: "full", anchor: "right", class: "w-full" },
    { size: "full", anchor: "top", class: "h-full" },
    { size: "full", anchor: "bottom", class: "h-full" },
  ],
});

const drawerHeaderStyle = tva({
  base: "flex-row items-center justify-between pb-4",
});

const drawerBodyStyle = tva({
  base: "mt-4 mb-6 shrink-0",
});

const drawerFooterStyle = tva({
  base: "flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end",
});

type DrawerProps = React.ComponentProps<typeof UIDrawer> &
  VariantProps<typeof drawerStyle> & { className?: string };
type DrawerBackdropProps = Omit<
  React.ComponentProps<typeof UIDrawer.Backdrop>,
  "children"
> & { className?: string };
type DrawerContentProps = React.ComponentProps<typeof UIDrawer.Content> &
  VariantProps<typeof drawerContentStyle> & { className?: string };
type DrawerHeaderProps = React.ComponentProps<typeof UIDrawer.Header> & {
  className?: string;
};
type DrawerBodyProps = React.ComponentProps<typeof UIDrawer.Body> & {
  className?: string;
};
type DrawerFooterProps = React.ComponentProps<typeof UIDrawer.Footer> & {
  className?: string;
};
type DrawerCloseButtonProps = React.ComponentProps<
  typeof UIDrawer.CloseButton
> & { className?: string };

const Drawer = React.forwardRef<
  React.ComponentRef<typeof UIDrawer>,
  DrawerProps
>(function Drawer(
  { className, size = "md", anchor = "left", ...props },
  ref,
) {
  return (
    <UIDrawer
      ref={ref}
      {...props}
      pointerEvents="box-none"
      className={drawerStyle({ size, anchor, class: className })}
      context={{ size, anchor }}
    />
  );
});

const DrawerBackdrop = React.forwardRef<
  React.ComponentRef<typeof UIDrawer.Backdrop>,
  DrawerBackdropProps
>(function DrawerBackdrop({ className, ...props }, ref) {
  const [blurVisible, setBlurVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setBlurVisible(true), SLIDE_DURATION);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <UIDrawer.Backdrop
      ref={ref}
      {...props}
      entering={FadeIn.delay(SLIDE_DURATION)
        .duration(BACKDROP_FADE_DURATION)
        .easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(BACKDROP_FADE_DURATION)}
      className={drawerBackdropStyle({ class: className })}
    >
      {blurVisible ? (
        <BlurView
          intensity={30}
          tint="dark"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
    </UIDrawer.Backdrop>
  );
});

const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof UIDrawer.Content>,
  DrawerContentProps
>(function DrawerContent({ className, ...props }, ref) {
  const { size, anchor } = useStyleContext(SCOPE);
  const isHorizontal = anchor === "left" || anchor === "right";
  const positionClass = isHorizontal
    ? `top-0 ${anchor === "left" ? "left-0" : "right-0"}`
    : `left-0 ${anchor === "top" ? "top-0" : "bottom-0"}`;
  const enteringAnimation =
    anchor === "left"
      ? SlideInLeft.duration(SLIDE_DURATION).easing(Easing.out(Easing.cubic))
      : anchor === "right"
        ? SlideInRight.duration(SLIDE_DURATION).easing(Easing.out(Easing.cubic))
        : anchor === "top"
          ? SlideInUp.duration(SLIDE_DURATION).easing(Easing.out(Easing.cubic))
          : SlideInDown.duration(SLIDE_DURATION).easing(
              Easing.out(Easing.cubic),
            );
  const exitingAnimation =
    anchor === "left"
      ? SlideOutLeft.duration(SLIDE_DURATION).easing(Easing.in(Easing.cubic))
      : anchor === "right"
        ? SlideOutRight.duration(SLIDE_DURATION).easing(Easing.in(Easing.cubic))
        : anchor === "top"
          ? SlideOutUp.duration(SLIDE_DURATION).easing(Easing.in(Easing.cubic))
          : SlideOutDown.duration(SLIDE_DURATION).easing(
              Easing.in(Easing.cubic),
            );

  return (
    <UIDrawer.Content
      ref={ref}
      {...props}
      entering={enteringAnimation}
      exiting={exitingAnimation}
      className={drawerContentStyle({
        parentVariants: { size, anchor },
        class: `${className ?? ""} ${positionClass}`,
      })}
      pointerEvents="auto"
    />
  );
});

const DrawerHeader = React.forwardRef<
  React.ComponentRef<typeof UIDrawer.Header>,
  DrawerHeaderProps
>(function DrawerHeader({ className, ...props }, ref) {
  return (
    <UIDrawer.Header
      ref={ref}
      {...props}
      className={drawerHeaderStyle({ class: className })}
    />
  );
});

const DrawerBody = React.forwardRef<
  React.ComponentRef<typeof UIDrawer.Body>,
  DrawerBodyProps
>(function DrawerBody({ className, ...props }, ref) {
  return (
    <UIDrawer.Body
      ref={ref}
      {...props}
      className={drawerBodyStyle({ class: className })}
    />
  );
});

const DrawerFooter = React.forwardRef<
  React.ComponentRef<typeof UIDrawer.Footer>,
  DrawerFooterProps
>(function DrawerFooter({ className, ...props }, ref) {
  return (
    <UIDrawer.Footer
      ref={ref}
      {...props}
      className={drawerFooterStyle({ class: className })}
    />
  );
});

const DrawerCloseButton = React.forwardRef<
  React.ComponentRef<typeof UIDrawer.CloseButton>,
  DrawerCloseButtonProps
>(function DrawerCloseButton({ className, ...props }, ref) {
  return (
    <UIDrawer.CloseButton
      ref={ref}
      {...props}
      className={className}
    />
  );
});

Drawer.displayName = "Drawer";
DrawerBackdrop.displayName = "DrawerBackdrop";
DrawerContent.displayName = "DrawerContent";
DrawerHeader.displayName = "DrawerHeader";
DrawerBody.displayName = "DrawerBody";
DrawerFooter.displayName = "DrawerFooter";
DrawerCloseButton.displayName = "DrawerCloseButton";

export {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
};
