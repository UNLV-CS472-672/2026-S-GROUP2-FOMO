import { brandSemanticColors, surfaceTheme } from './semantic';

export const nativeTheme = {
  light: {
    ...surfaceTheme.light,
    tint: brandSemanticColors.primary,
    tintForeground: brandSemanticColors.primaryForeground,
    tintHover: brandSemanticColors.primaryHover,
    primarySoft: brandSemanticColors.primarySoft,
    primarySoftBorder: brandSemanticColors.primarySoftBorder,
    primaryText: brandSemanticColors.primaryText,
  },
  dark: {
    ...surfaceTheme.dark,
    tint: brandSemanticColors.primary,
    tintForeground: brandSemanticColors.primaryForeground,
    tintHover: brandSemanticColors.primaryHover,
    primarySoft: brandSemanticColors.primarySoft,
    primarySoftBorder: brandSemanticColors.primarySoftBorder,
    primaryText: brandSemanticColors.primaryText,
  },
} as const;

export const navigationThemeColors = {
  light: {
    primary: nativeTheme.light.tint,
    background: nativeTheme.light.background,
    card: nativeTheme.light.surface,
    text: nativeTheme.light.text,
    border: nativeTheme.light.border,
    notification: nativeTheme.light.tint,
  },
  dark: {
    primary: nativeTheme.dark.tint,
    background: nativeTheme.dark.background,
    card: nativeTheme.dark.surface,
    text: nativeTheme.dark.text,
    border: nativeTheme.dark.border,
    notification: nativeTheme.dark.tint,
  },
} as const;
