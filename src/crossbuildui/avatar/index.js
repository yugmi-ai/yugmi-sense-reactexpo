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
  Avatar: () => Avatar_default,
  AvatarGroup: () => AvatarGroup_default,
  AvatarGroupContext: () => AvatarGroupContext,
  AvatarIcon: () => AvatarIcon_default,
  useAvatarGroup: () => useAvatarGroup
});
module.exports = __toCommonJS(index_exports);

// src/Avatar.tsx
var import_core = require("@crossbuildui/core");
var import_expo_blur = require("expo-blur");
var import_react3 = __toESM(require("react"));
var import_react_native2 = require("react-native");

// src/AvatarGroupContext.ts
var import_react = require("react");
var AvatarGroupContext = (0, import_react.createContext)(void 0);
var useAvatarGroup = () => {
  const context = (0, import_react.useContext)(AvatarGroupContext);
  if (context === void 0) {
  }
  return context;
};

// src/AvatarIcon.tsx
var import_react2 = __toESM(require("react"));
var import_react_native = require("react-native");
var import_MaterialIcons = __toESM(require("react-native-vector-icons/MaterialIcons"));
var AvatarIcon = ({
  size = 24,
  color = "#FFFFFF",
  style
}) => {
  return /* @__PURE__ */ import_react2.default.createElement(import_react_native.View, { style: [styles.base, style] }, /* @__PURE__ */ import_react2.default.createElement(import_MaterialIcons.default, { name: "person", size, color }));
};
var styles = import_react_native.StyleSheet.create({
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
  ImgComponent = import_react_native2.Image,
  styles: customSlotsStyles,
  style,
  isGlass: propIsGlass,
  glassTint: propGlassTint,
  glassIntensity: propGlassIntensity = 50,
  onError
}) => {
  const { colors: themeColors, layout: layoutConfig, mode } = (0, import_core.useTheme)();
  const groupContext = useAvatarGroup();
  const [imageError, setImageError] = (0, import_react3.useState)(false);
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
  const radiusValue = (0, import_react3.useMemo)(() => {
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
  const initials = (0, import_react3.useMemo)(() => getInitials(name), [name]);
  const displayImage = src && !imageError;
  const renderFallback = () => {
    if (!showFallback) return null;
    if (fallback) return import_react3.default.cloneElement(fallback, { style: customSlotsStyles == null ? void 0 : customSlotsStyles.fallback });
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
      return /* @__PURE__ */ import_react3.default.createElement(import_react_native2.View, { style: fallbackContentStyle }, isGlass && /* @__PURE__ */ import_react3.default.createElement(
        import_expo_blur.BlurView,
        {
          tint: effectiveGlassTint,
          intensity: glassIntensity,
          style: [import_react_native2.StyleSheet.absoluteFill, { borderRadius: radiusValue, overflow: "hidden" }],
          ...import_react_native2.Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
        }
      ), import_react3.default.cloneElement(icon, {
        size: avatarDimension * 0.6,
        // Scale icon size
        color: avatarFgColor,
        style: customSlotsStyles == null ? void 0 : customSlotsStyles.icon
      }));
    }
    if (initials) {
      const fontSize = avatarDimension * (initials.length > 1 ? 0.35 : 0.45);
      return /* @__PURE__ */ import_react3.default.createElement(import_react_native2.View, { style: fallbackContentStyle }, isGlass && /* @__PURE__ */ import_react3.default.createElement(
        import_expo_blur.BlurView,
        {
          tint: effectiveGlassTint,
          intensity: glassIntensity,
          style: [import_react_native2.StyleSheet.absoluteFill, { borderRadius: radiusValue, overflow: "hidden" }],
          ...import_react_native2.Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
        }
      ), /* @__PURE__ */ import_react3.default.createElement(import_core.Text, { style: [styles2.initialsText, { color: avatarFgColor, fontSize }, customSlotsStyles == null ? void 0 : customSlotsStyles.initials] }, initials));
    }
    return /* @__PURE__ */ import_react3.default.createElement(import_react_native2.View, { style: fallbackContentStyle }, isGlass && /* @__PURE__ */ import_react3.default.createElement(
      import_expo_blur.BlurView,
      {
        tint: effectiveGlassTint,
        intensity: glassIntensity,
        style: [import_react_native2.StyleSheet.absoluteFill, { borderRadius: radiusValue, overflow: "hidden" }],
        ...import_react_native2.Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
      }
    ), /* @__PURE__ */ import_react3.default.createElement(AvatarIcon_default, { size: avatarDimension * 0.6, color: avatarFgColor, style: customSlotsStyles == null ? void 0 : customSlotsStyles.icon }));
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
  return /* @__PURE__ */ import_react3.default.createElement(import_react_native2.View, { style: containerStyle }, displayImage ? /* @__PURE__ */ import_react3.default.createElement(
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
var styles2 = import_react_native2.StyleSheet.create({
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
var import_core2 = require("@crossbuildui/core");
var import_expo_blur2 = require("expo-blur");
var import_react4 = __toESM(require("react"));
var import_react_native3 = require("react-native");
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
  const { colors: themeColors, layout: layoutConfig, mode } = (0, import_core2.useTheme)();
  const contextValue = (0, import_react4.useMemo)(() => ({
    size,
    color,
    radius,
    isBordered,
    isDisabled,
    isGlass,
    glassTint,
    glassIntensity
  }), [size, color, radius, isBordered, isDisabled, isGlass, glassTint, glassIntensity]);
  const validAvatars = import_react4.Children.toArray(children).filter(
    (child) => (0, import_react4.isValidElement)(child)
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
    return /* @__PURE__ */ import_react4.default.createElement(
      import_react_native3.View,
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
      isGlass && /* @__PURE__ */ import_react4.default.createElement(
        import_expo_blur2.BlurView,
        {
          tint: effectiveGlassTint,
          intensity: glassIntensity,
          style: [import_react_native3.StyleSheet.absoluteFill, { borderRadius: radius === "full" ? avatarDimension / 2 : ((_b = layoutConfig.borderRadius) == null ? void 0 : _b.full) || avatarDimension / 2 }],
          ...import_react_native3.Platform.OS === "android" && { experimentalBlurMethod: "dimezisBlurView" }
        }
      ),
      /* @__PURE__ */ import_react4.default.createElement(import_core2.Text, { style: [styles3.countText, { color: countFgColor, fontSize: avatarDimension * 0.4 }, countStyles == null ? void 0 : countStyles.text] }, "+", hiddenCount)
    );
  };
  return /* @__PURE__ */ import_react4.default.createElement(AvatarGroupContext.Provider, { value: contextValue }, /* @__PURE__ */ import_react4.default.createElement(import_react_native3.View, { style: containerStyle }, visibleAvatars.map(
    (avatar, index) => import_react4.default.cloneElement(avatar, {
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
var styles3 = import_react_native3.StyleSheet.create({
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
//# sourceMappingURL=index.js.map