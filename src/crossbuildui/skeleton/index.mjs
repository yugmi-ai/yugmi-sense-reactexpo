/**
 * @license Copyright (c) 2025 Crossbuild UI. All Rights Reserved.
 *
 * This software is proprietary to Crossbuild UI.
 *
 * Your use of this software is subject to the terms and conditions
 * outlined in the main LICENSE file located in the root of this repository
 * (https://github.com/crossbuildui/crossbuildui/blob/main/LICENSE).
 *
 * Key points regarding usage:
 * - Commercial Use: Requires an active Crossbuild UI subscription. All components (Free and Paid) are licensed for commercial use only with an active subscription.
 * - Non-Commercial Use: Free Components may be used for non-commercial purposes (e.g., personal projects, educational, non-profit) even without an active subscription, as detailed in the main LICENSE file.
 * - License Validity: Your license for commercial use is valid only while your CrossBuild UI subscription is active. It terminates immediately upon subscription inactivity.
 * - Non-Transferable: Subscriptions and licenses are valid exclusively for the purchasing individual, team, or organization and cannot be transferred.
 *
 * To obtain a subscription or for any licensing inquiries,
 * please contact CrossBuild UI at support@crossbuildui.com
 *
 * Unauthorized copying, use, modification, or distribution of this software,
 * or any part of it, is strictly prohibited.
 */
// src/Skeleton.tsx
import { useTheme } from "@crossbuildui/core";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";
var AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
var Skeleton = ({
  children,
  isLoaded = false,
  disableAnimation = false,
  style: placeholderStyleProp,
  // This style defines the skeleton's shape
  styles: slotStylesProp,
  shimmerColor: customShimmerColor,
  placeholderBackgroundColor: customPlaceholderBgColor,
  isGlass = false,
  glassTint: propGlassTint,
  glassIntensity = 30
}) => {
  const { colors: themeColors, mode } = useTheme();
  const progress = useSharedValue(0);
  let placeholderBg = customPlaceholderBgColor || (mode === "dark" ? themeColors.default["200"] : themeColors.default["100"]);
  if (isGlass) {
    placeholderBg = "transparent";
  }
  const shimmerColor = customShimmerColor || (isGlass ? mode === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)" : mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)");
  const shimmerBg = customShimmerColor ? customShimmerColor.replace("rgba", "rgb").replace(/,[^,]*\)/, ")") : mode === "dark" ? "rgba(100,100,100,0.1)" : "rgba(200,200,200,0.2)";
  useEffect(() => {
    if (!isLoaded && !disableAnimation) {
      progress.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        // Infinite repeat
        false
        // Don't reverse
      );
    } else {
      progress.value = 0;
    }
  }, [isLoaded, disableAnimation, progress]);
  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-200, 400]
      // Adjust these values based on typical skeleton width for a good sweep
    );
    return {
      transform: [{ translateX }]
    };
  });
  const animatedGlassIntensityProps = useAnimatedProps(() => {
    const peakIntensityDelta = 20;
    const currentIntensity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [glassIntensity, glassIntensity + peakIntensityDelta, glassIntensity]
    );
    return { intensity: currentIntensity };
  });
  if (isLoaded) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, children);
  }
  const placeholderStyle = [
    styles.placeholderBase,
    { backgroundColor: placeholderBg },
    placeholderStyleProp,
    // User-defined shape and size
    slotStylesProp == null ? void 0 : slotStylesProp.placeholder
  ];
  const shimmerStyle = [
    styles.shimmerBase,
    slotStylesProp == null ? void 0 : slotStylesProp.shimmer
  ];
  const effectiveGlassTint = propGlassTint || (mode === "light" ? "light" : "dark");
  const flatPlaceholderStyle = StyleSheet.flatten(placeholderStyle);
  return /* @__PURE__ */ React.createElement(View, { style: placeholderStyle }, isGlass ? disableAnimation ? /* @__PURE__ */ React.createElement(
    BlurView,
    {
      style: [
        StyleSheet.absoluteFillObject,
        { borderRadius: flatPlaceholderStyle.borderRadius },
        Platform.OS === "android" && { backgroundColor: effectiveGlassTint === "dark" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }
      ],
      tint: effectiveGlassTint,
      intensity: glassIntensity,
      ...Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
    }
  ) : /* @__PURE__ */ React.createElement(
    AnimatedBlurView,
    {
      style: [
        StyleSheet.absoluteFillObject,
        { borderRadius: flatPlaceholderStyle.borderRadius },
        Platform.OS === "android" && { backgroundColor: effectiveGlassTint === "dark" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }
      ],
      tint: effectiveGlassTint,
      animatedProps: animatedGlassIntensityProps,
      ...Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
    }
  ) : !disableAnimation && /* @__PURE__ */ React.createElement(Animated.View, { style: [StyleSheet.absoluteFill, animatedShimmerStyle, { zIndex: 1 }] }, /* @__PURE__ */ React.createElement(
    LinearGradient,
    {
      colors: [`${placeholderBg}00`, shimmerColor, `${placeholderBg}00`],
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
      style: shimmerStyle
    }
  )));
};
var styles = StyleSheet.create({
  placeholderBase: {
    overflow: "hidden"
    // Important to clip the shimmer
    // Default width/height if not provided by user style, though user style is expected
    // width: '100%',
    // height: 20, // A small default height
    // borderRadius: 4, // Default radius
  },
  shimmerBase: {
    width: "200%",
    // Make shimmer wider than placeholder to sweep across
    height: "100%"
  }
});
var Skeleton_default = Skeleton;
export {
  Skeleton_default as Skeleton
};
//# sourceMappingURL=index.mjs.map