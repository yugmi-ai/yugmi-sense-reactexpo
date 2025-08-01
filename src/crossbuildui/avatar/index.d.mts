import * as React from 'react';
import React__default, { ReactElement, ComponentType } from 'react';
import { ThemeColors } from '@crossbuildui/core';
import { ImageSourcePropType, StyleProp, ViewStyle, ImageProps, TextStyle } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg';
type AvatarRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
type AvatarColor = keyof Pick<ThemeColors, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'>;
interface AvatarIconProps {
    size?: number;
    color?: string;
    style?: StyleProp<ViewStyle>;
    path?: string;
}
interface AvatarSlotsStyles {
    base?: StyleProp<ViewStyle>;
    img?: StyleProp<ViewStyle>;
    fallback?: StyleProp<ViewStyle>;
    initials?: StyleProp<TextStyle>;
    icon?: StyleProp<ViewStyle>;
    border?: StyleProp<ViewStyle>;
}
interface AvatarProps {
    /** The source URI for the avatar image. */
    src?: ImageSourcePropType | string;
    /**
     * The name of the user. Used for initials if `src` is unavailable or fails to load.
     */
    name?: string;
    /**
     * Custom icon element to display as a fallback or if `src` and `name` are not provided.
     * Overrides default initials/icon.
     */
    icon?: ReactElement<AvatarIconProps>;
    /**
     * A custom fallback component to display when the image fails to load or `src` is not provided.
     * Overrides `icon` and `name` (initials) if `showFallback` is true.
     */
    fallback?: ReactElement;
    /**
     * The semantic color of the avatar, used for background/border if no image and for fallback initials/icon.
     * @default 'default'
     */
    color?: AvatarColor;
    /**
     * The size of the avatar.
     * @default 'md'
     */
    size?: AvatarSize;
    /**
     * The border radius of the avatar.
     * @default 'full'
     */
    radius?: AvatarRadius;
    /** If true, a border will be displayed around the avatar. Color is derived from theme or `color` prop. */
    isBordered?: boolean;
    /** If true, the avatar will have a disabled appearance. */
    isDisabled?: boolean;
    /**
     * If true, shows the fallback icon or initials when the image (`src`) fails to load or is not provided.
     * @default true
     */
    showFallback?: boolean;
    /** Additional props to be passed to the underlying Image component. */
    imgProps?: Omit<ImageProps, 'source' | 'style'>;
    /**
     * Custom Image component to use for rendering the avatar image.
     * Useful for integration with image caching libraries.
     */
    ImgComponent?: ComponentType<ImageProps>;
    /** Allows to set custom styles for the avatar slots. */
    styles?: AvatarSlotsStyles;
    /** Custom style for the avatar's outer container. */
    style?: StyleProp<ViewStyle>;
    /** Callback fired when the image fails to load. */
    onError?: ImageProps['onError'];
    /**
     * If true, applies a glassmorphism effect to the avatar's fallback background.
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
     * @default 50
     */
    glassIntensity?: number;
}
interface AvatarGroupContextProps {
    size?: AvatarSize;
    color?: AvatarColor;
    radius?: AvatarRadius;
    isBordered?: boolean;
    isDisabled?: boolean;
    isGlass?: boolean;
    glassTint?: 'default' | 'light' | 'dark';
    glassIntensity?: number;
}
interface AvatarGroupProps extends AvatarGroupContextProps {
    children: ReactElement<AvatarProps> | ReactElement<AvatarProps>[];
    /** The maximum number of visible avatars. Others will be summarized in a count. */
    max?: number;
    /**
     * The total number of avatars. If provided and greater than `max`,
     * it will be used for the count instead of `children.length - max`.
     */
    total?: number;
    /** If true, the avatars will be displayed in a grid-like layout (not implemented in this basic version, typically means more spacing). */
    isGrid?: boolean;
    /** Custom component to render the count of hidden avatars. Receives `count` as a prop. */
    renderCount?: (count: number) => ReactElement;
    /** Custom styles for the avatar group container. */
    style?: StyleProp<ViewStyle>;
    /** Custom styles for the count indicator. */
    countStyles?: {
        base?: StyleProp<ViewStyle>;
        text?: StyleProp<TextStyle>;
    };
}

declare const Avatar: React__default.FC<AvatarProps>;

declare const AvatarGroup: React__default.FC<AvatarGroupProps>;

declare const AvatarGroupContext: React.Context<AvatarGroupContextProps | undefined>;
declare const useAvatarGroup: () => AvatarGroupContextProps | undefined;

/**
 * Default fallback icon for Avatar.
 */
declare const AvatarIcon: React__default.FC<AvatarIconProps>;

export { Avatar, type AvatarColor, AvatarGroup, AvatarGroupContext, type AvatarGroupContextProps, type AvatarGroupProps, AvatarIcon, type AvatarIconProps, type AvatarProps, type AvatarRadius, type AvatarSize, type AvatarSlotsStyles, useAvatarGroup };
