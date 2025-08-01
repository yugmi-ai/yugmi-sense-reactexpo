import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

interface SkeletonSlotsStyles {
    /** Styles for the placeholder view shown during loading. */
    placeholder?: StyleProp<ViewStyle>;
    /** Styles for the animated shimmer view. */
    shimmer?: StyleProp<ViewStyle>;
}
interface SkeletonProps {
    /** The actual content to display once loading is complete. */
    children: ReactNode;
    /**
     * If true, the `children` are rendered. If false, the skeleton placeholder is shown.
     * @default false
     */
    isLoaded?: boolean;
    /**
     * If true, the shimmer animation on the placeholder is disabled.
     * @default false
     */
    disableAnimation?: boolean;
    /**
     * Style applied to the placeholder view when `isLoaded` is false.
     * This defines the shape and size of the skeleton.
     */
    style?: StyleProp<ViewStyle>;
    /** Allows to set custom styles for the Skeleton slots (placeholder, shimmer). */
    styles?: SkeletonSlotsStyles;
    /** Color of the shimmer effect. Defaults to a semi-transparent white or light gray. */
    shimmerColor?: string;
    /** Background color of the placeholder. Defaults to a theme-based gray. */
    placeholderBackgroundColor?: string;
    /**
     * If true, applies a glassmorphism effect to the skeleton placeholder's background.
     * @default false
     */
    isGlass?: boolean;
    /**
     * Tint for the 'glass' variant's BlurView.
     * Can be 'light', 'dark', or 'default'.
     * If undefined, it's derived from the current theme mode.
     */
    glassTint?: 'default' | 'light' | 'dark';
    /**
     * Intensity for the 'glass' variant's BlurView.
     * @default 30
     */
    glassIntensity?: number;
}

declare const Skeleton: React.FC<SkeletonProps>;

export { Skeleton, type SkeletonProps, type SkeletonSlotsStyles };
