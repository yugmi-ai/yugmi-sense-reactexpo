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
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Skeleton: () => Skeleton_default
});
module.exports = __toCommonJS(index_exports);

// src/Skeleton.tsx
var import_core = require("@crossbuildui/core");
var import_expo_blur = require("expo-blur");
var import_expo_linear_gradient = require("expo-linear-gradient");
var import_react = __toESM(require("react"));
var import_react_native = require("react-native");
var import_react_native_reanimated = __toESM(require("react-native-reanimated"));
var AnimatedBlurView = import_react_native_reanimated.default.createAnimatedComponent(import_expo_blur.BlurView);
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
  const { colors: themeColors, mode } = (0, import_core.useTheme)();
  const progress = (0, import_react_native_reanimated.useSharedValue)(0);
  let placeholderBg = customPlaceholderBgColor || (mode === "dark" ? themeColors.default["200"] : themeColors.default["100"]);
  if (isGlass) {
    placeholderBg = "transparent";
  }
  const shimmerColor = customShimmerColor || (isGlass ? mode === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)" : mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)");
  const shimmerBg = customShimmerColor ? customShimmerColor.replace("rgba", "rgb").replace(/,[^,]*\)/, ")") : mode === "dark" ? "rgba(100,100,100,0.1)" : "rgba(200,200,200,0.2)";
  (0, import_react.useEffect)(() => {
    if (!isLoaded && !disableAnimation) {
      progress.value = (0, import_react_native_reanimated.withRepeat)(
        (0, import_react_native_reanimated.withTiming)(1, { duration: 1200, easing: import_react_native_reanimated.Easing.inOut(import_react_native_reanimated.Easing.ease) }),
        -1,
        // Infinite repeat
        false
        // Don't reverse
      );
    } else {
      progress.value = 0;
    }
  }, [isLoaded, disableAnimation, progress]);
  const animatedShimmerStyle = (0, import_react_native_reanimated.useAnimatedStyle)(() => {
    const translateX = (0, import_react_native_reanimated.interpolate)(
      progress.value,
      [0, 1],
      [-200, 400]
      // Adjust these values based on typical skeleton width for a good sweep
    );
    return {
      transform: [{ translateX }]
    };
  });
  const animatedGlassIntensityProps = (0, import_react_native_reanimated.useAnimatedProps)(() => {
    const peakIntensityDelta = 20;
    const currentIntensity = (0, import_react_native_reanimated.interpolate)(
      progress.value,
      [0, 0.5, 1],
      [glassIntensity, glassIntensity + peakIntensityDelta, glassIntensity]
    );
    return { intensity: currentIntensity };
  });
  if (isLoaded) {
    return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, children);
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
  const flatPlaceholderStyle = import_react_native.StyleSheet.flatten(placeholderStyle);
  return /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: placeholderStyle }, isGlass ? disableAnimation ? /* @__PURE__ */ import_react.default.createElement(
    import_expo_blur.BlurView,
    {
      style: [
        import_react_native.StyleSheet.absoluteFillObject,
        { borderRadius: flatPlaceholderStyle.borderRadius },
        import_react_native.Platform.OS === "android" && { backgroundColor: effectiveGlassTint === "dark" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }
      ],
      tint: effectiveGlassTint,
      intensity: glassIntensity,
      ...import_react_native.Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
    }
  ) : /* @__PURE__ */ import_react.default.createElement(
    AnimatedBlurView,
    {
      style: [
        import_react_native.StyleSheet.absoluteFillObject,
        { borderRadius: flatPlaceholderStyle.borderRadius },
        import_react_native.Platform.OS === "android" && { backgroundColor: effectiveGlassTint === "dark" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }
      ],
      tint: effectiveGlassTint,
      animatedProps: animatedGlassIntensityProps,
      ...import_react_native.Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
    }
  ) : !disableAnimation && /* @__PURE__ */ import_react.default.createElement(import_react_native_reanimated.default.View, { style: [import_react_native.StyleSheet.absoluteFill, animatedShimmerStyle, { zIndex: 1 }] }, /* @__PURE__ */ import_react.default.createElement(
    import_expo_linear_gradient.LinearGradient,
    {
      colors: [`${placeholderBg}00`, shimmerColor, `${placeholderBg}00`],
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
      style: shimmerStyle
    }
  )));
};
var styles = import_react_native.StyleSheet.create({
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
//# sourceMappingURL=index.js.map