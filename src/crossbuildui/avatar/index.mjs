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
// src/Avatar.tsx
import { Text, useTheme } from "@crossbuildui/core";
import { BlurView } from "expo-blur";
import React2, { useMemo, useState } from "react";
import { Image, Platform, StyleSheet as StyleSheet2, View as View2 } from "react-native";

// src/AvatarGroupContext.ts
import { createContext, useContext } from "react";
var AvatarGroupContext = createContext(void 0);
var useAvatarGroup = () => {
  const context = useContext(AvatarGroupContext);
  if (context === void 0) {
  }
  return context;
};

// src/AvatarIcon.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
var AvatarIcon = ({
  size = 24,
  color = "#FFFFFF",
  style
}) => {
  return /* @__PURE__ */ React.createElement(View, { style: [styles.base, style] }, /* @__PURE__ */ React.createElement(Icon, { name: "person", size, color }));
};
var styles = StyleSheet.create({
  base: {
    backgroundColor: "transparent"
  }
});
var AvatarIcon_default = AvatarIcon;

// src/Avatar.tsx
var getInitials = (name) => {
  if (!name) return "";
  const names = name.trim().split(" ");
  if (names.length === 1 && names[0]) return names[0][0].toUpperCase();
  if (names.length > 1 && names[0] && names[names.length - 1]) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return "";
};
var Avatar = ({
  src,
  name,
  icon,
  fallback,
  color: propColor,
  size: propSize,
  radius: propRadius,
  isBordered: propIsBordered,
  isDisabled: propIsDisabled,
  showFallback = true,
  imgProps,
  ImgComponent = Image,
  styles: customSlotsStyles,
  style,
  isGlass: propIsGlass,
  glassTint: propGlassTint,
  glassIntensity: propGlassIntensity = 50,
  onError
}) => {
  const { colors: themeColors, layout: layoutConfig, mode } = useTheme();
  const groupContext = useAvatarGroup();
  const [imageError, setImageError] = useState(false);
  const color = propColor || (groupContext == null ? void 0 : groupContext.color) || "default";
  const size = propSize || (groupContext == null ? void 0 : groupContext.size) || "md";
  const radius = propRadius || (groupContext == null ? void 0 : groupContext.radius) || "full";
  const isBordered = propIsBordered !== void 0 ? propIsBordered : (groupContext == null ? void 0 : groupContext.isBordered) || false;
  const isDisabled = propIsDisabled !== void 0 ? propIsDisabled : (groupContext == null ? void 0 : groupContext.isDisabled) || false;
  const isGlass = propIsGlass !== void 0 ? propIsGlass : (groupContext == null ? void 0 : groupContext.isGlass) || false;
  const glassTint = propGlassTint !== void 0 ? propGlassTint : groupContext == null ? void 0 : groupContext.glassTint;
  const glassIntensity = propGlassIntensity !== void 0 ? propGlassIntensity : (groupContext == null ? void 0 : groupContext.glassIntensity) || 50;
  const handleImageError = (event) => {
    setImageError(true);
    if (onError) {
      onError(event);
    }
  };
  const baseColorSet = themeColors[color] || themeColors.default;
  const avatarBgColor = typeof baseColorSet === "string" ? baseColorSet : baseColorSet.DEFAULT;
  const avatarFgColor = typeof baseColorSet === "string" ? color === "default" && mode === "light" ? themeColors.foreground : themeColors.background : baseColorSet.foreground;
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64
  };
  const avatarDimension = sizeMap[size];
  const radiusValue = useMemo(() => {
    var _a, _b, _c;
    return {
      none: 0,
      sm: ((_a = layoutConfig.borderRadius) == null ? void 0 : _a.sm) || 4,
      md: ((_b = layoutConfig.borderRadius) == null ? void 0 : _b.md) || 8,
      lg: ((_c = layoutConfig.borderRadius) == null ? void 0 : _c.lg) || 12,
      full: avatarDimension / 2
      // For perfect circle
    }[radius];
  }, [radius, avatarDimension, layoutConfig.borderRadius]);
  const initials = useMemo(() => getInitials(name), [name]);
  const displayImage = src && !imageError;
  const renderFallback = () => {
    if (!showFallback) return null;
    if (fallback) return React2.cloneElement(fallback, { style: customSlotsStyles == null ? void 0 : customSlotsStyles.fallback });
    const effectiveGlassTint = glassTint || (mode === "light" ? "light" : "dark");
    const fallbackContentStyle = [
      styles2.fallbackBase,
      {
        width: avatarDimension,
        height: avatarDimension,
        borderRadius: radiusValue,
        backgroundColor: isGlass ? "transparent" : avatarBgColor
        // Transparent for glass
      },
      customSlotsStyles == null ? void 0 : customSlotsStyles.fallback
    ];
    if (icon) {
      return /* @__PURE__ */ React2.createElement(View2, { style: fallbackContentStyle }, isGlass && /* @__PURE__ */ React2.createElement(
        BlurView,
        {
          tint: effectiveGlassTint,
          intensity: glassIntensity,
          style: [StyleSheet2.absoluteFill, { borderRadius: radiusValue, overflow: "hidden" }],
          ...Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
        }
      ), React2.cloneElement(icon, {
        size: avatarDimension * 0.6,
        // Scale icon size
        color: avatarFgColor,
        style: customSlotsStyles == null ? void 0 : customSlotsStyles.icon
      }));
    }
    if (initials) {
      const fontSize = avatarDimension * (initials.length > 1 ? 0.35 : 0.45);
      return /* @__PURE__ */ React2.createElement(View2, { style: fallbackContentStyle }, isGlass && /* @__PURE__ */ React2.createElement(
        BlurView,
        {
          tint: effectiveGlassTint,
          intensity: glassIntensity,
          style: [StyleSheet2.absoluteFill, { borderRadius: radiusValue, overflow: "hidden" }],
          ...Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
        }
      ), /* @__PURE__ */ React2.createElement(Text, { style: [styles2.initialsText, { color: avatarFgColor, fontSize }, customSlotsStyles == null ? void 0 : customSlotsStyles.initials] }, initials));
    }
    return /* @__PURE__ */ React2.createElement(View2, { style: fallbackContentStyle }, isGlass && /* @__PURE__ */ React2.createElement(
      BlurView,
      {
        tint: effectiveGlassTint,
        intensity: glassIntensity,
        style: [StyleSheet2.absoluteFill, { borderRadius: radiusValue, overflow: "hidden" }],
        ...Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
      }
    ), /* @__PURE__ */ React2.createElement(AvatarIcon_default, { size: avatarDimension * 0.6, color: avatarFgColor, style: customSlotsStyles == null ? void 0 : customSlotsStyles.icon }));
  };
  const containerStyle = [
    styles2.base,
    {
      width: avatarDimension,
      height: avatarDimension,
      borderRadius: radiusValue
    },
    isBordered && styles2.bordered,
    isBordered && {
      borderColor: avatarBgColor
    },
    isDisabled && styles2.disabled,
    customSlotsStyles == null ? void 0 : customSlotsStyles.base,
    style
  ];
  const imageStyle = [
    styles2.image,
    {
      width: avatarDimension,
      height: avatarDimension,
      borderRadius: radiusValue
    },
    customSlotsStyles == null ? void 0 : customSlotsStyles.img
  ];
  return /* @__PURE__ */ React2.createElement(View2, { style: containerStyle }, displayImage ? /* @__PURE__ */ React2.createElement(
    ImgComponent,
    {
      source: typeof src === "string" ? { uri: src } : src,
      style: imageStyle,
      onError: handleImageError,
      accessibilityLabel: name || "User avatar",
      ...imgProps
    }
  ) : renderFallback());
};
var styles2 = StyleSheet2.create({
  base: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
    // Ensures border radius clips image/fallback
  },
  image: {
    // width and height set dynamically
  },
  fallbackBase: {
    justifyContent: "center",
    alignItems: "center"
  },
  initialsText: {
    fontWeight: "bold",
    textAlign: "center"
  },
  bordered: {
    padding: 2,
    borderWidth: 2
    // Adjust as needed
  },
  disabled: {
    opacity: 0.5
    // Use layoutConfig.disabledOpacity
  }
});
var Avatar_default = Avatar;

// src/AvatarGroup.tsx
import { Text as Text2, useTheme as useTheme2 } from "@crossbuildui/core";
import { BlurView as BlurView2 } from "expo-blur";
import React3, { Children, isValidElement, useMemo as useMemo2 } from "react";
import { Platform as Platform2, StyleSheet as StyleSheet3, View as View3 } from "react-native";
var AvatarGroup = ({
  children,
  max = 5,
  total,
  size = "md",
  // Default size for the count if not overridden by context
  color = "default",
  radius = "full",
  isBordered = true,
  // Avatars in a group usually have borders
  isDisabled = false,
  isGrid = false,
  // Not fully implemented in this basic version, affects spacing
  renderCount,
  isGlass = false,
  // Propagate to context
  glassTint,
  glassIntensity = 50,
  style,
  countStyles
}) => {
  const { colors: themeColors, layout: layoutConfig, mode } = useTheme2();
  const contextValue = useMemo2(() => ({
    size,
    color,
    radius,
    isBordered,
    isDisabled,
    isGlass,
    glassTint,
    glassIntensity
  }), [size, color, radius, isBordered, isDisabled, isGlass, glassTint, glassIntensity]);
  const validAvatars = Children.toArray(children).filter(
    (child) => isValidElement(child)
  );
  const visibleAvatars = validAvatars.slice(0, max);
  const hiddenCount = total !== void 0 ? Math.max(0, total - max) : Math.max(0, validAvatars.length - max);
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64
  };
  const avatarDimension = sizeMap[size || "md"];
  const overlap = avatarDimension * (isGrid ? 0.1 : 0.35);
  const containerStyle = [
    styles3.base,
    isGrid && styles3.grid,
    style
  ];
  const renderCountComponent = () => {
    var _a, _b;
    if (hiddenCount <= 0) return null;
    if (renderCount) return renderCount(hiddenCount);
    const countBaseColorSet = themeColors[color] || themeColors.default;
    const countBgColor = isGlass ? "transparent" : typeof countBaseColorSet === "string" ? themeColors.content1.DEFAULT : countBaseColorSet["200"];
    const countFgColor = isGlass ? themeColors.foreground : typeof countBaseColorSet === "string" ? themeColors.foreground : countBaseColorSet.foreground;
    const effectiveGlassTint = glassTint || (mode === "light" ? "light" : "dark");
    return /* @__PURE__ */ React3.createElement(
      View3,
      {
        style: [
          styles3.countAvatar,
          {
            width: avatarDimension,
            height: avatarDimension,
            borderRadius: radius === "full" ? avatarDimension / 2 : ((_a = layoutConfig.borderRadius) == null ? void 0 : _a.full) || avatarDimension / 2,
            backgroundColor: countBgColor,
            marginLeft: -overlap,
            zIndex: 999,
            overflow: "hidden"
            // For BlurView clipping
          },
          isBordered && styles3.borderedCount,
          isBordered && !isGlass && { borderColor: typeof countBaseColorSet === "string" ? countBaseColorSet : countBaseColorSet.DEFAULT },
          isBordered && isGlass && { borderColor: "transparent" },
          // Border might look odd with glass, or use a translucent one
          countStyles == null ? void 0 : countStyles.base
        ]
      },
      isGlass && /* @__PURE__ */ React3.createElement(
        BlurView2,
        {
          tint: effectiveGlassTint,
          intensity: glassIntensity,
          style: [StyleSheet3.absoluteFill, { borderRadius: radius === "full" ? avatarDimension / 2 : ((_b = layoutConfig.borderRadius) == null ? void 0 : _b.full) || avatarDimension / 2 }],
          ...Platform2.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
        }
      ),
      /* @__PURE__ */ React3.createElement(Text2, { style: [styles3.countText, { color: countFgColor, fontSize: avatarDimension * 0.4 }, countStyles == null ? void 0 : countStyles.text] }, "+", hiddenCount)
    );
  };
  return /* @__PURE__ */ React3.createElement(AvatarGroupContext.Provider, { value: contextValue }, /* @__PURE__ */ React3.createElement(View3, { style: containerStyle }, visibleAvatars.map(
    (avatar, index) => React3.cloneElement(avatar, {
      key: `avatar-${index}`,
      style: [
        avatar.props.style,
        index > 0 && { marginLeft: -overlap },
        // Apply overlap
        { zIndex: index + 1 }
        // Stacking order
      ]
    })
  ), renderCountComponent()));
};
var styles3 = StyleSheet3.create({
  base: {
    flexDirection: "row",
    alignItems: "center"
  },
  grid: {
    // Add styles for grid layout if needed, e.g., flexWrap: 'wrap'
  },
  countAvatar: {
    justifyContent: "center",
    alignItems: "center"
  },
  borderedCount: {
    borderWidth: 2
  },
  countText: {
    fontWeight: "bold"
  }
});
var AvatarGroup_default = AvatarGroup;
export {
  Avatar_default as Avatar,
  AvatarGroup_default as AvatarGroup,
  AvatarGroupContext,
  AvatarIcon_default as AvatarIcon,
  useAvatarGroup
};
//# sourceMappingURL=index.mjs.map