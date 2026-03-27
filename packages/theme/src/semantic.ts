import { coralPalette } from './palette';

export const brandSemanticColors = {
  primary: coralPalette[600],
  primaryForeground: '#fff7f2',
  primaryHover: coralPalette[700],
  primaryActive: coralPalette[800],
  primarySoft: coralPalette[50],
  primarySoftBorder: coralPalette[200],
  primaryText: coralPalette[700],
  primaryRing: coralPalette[300],
} as const;

export const surfaceTheme = {
  light: {
    background: '#fffaf6',
    surface: '#fffdfb',
    surfaceMuted: '#fff3eb',
    text: '#201713',
    mutedText: '#786860',
    border: '#ead8ce',
    borderStrong: '#d8c1b5',
  },
  dark: {
    background: '#181311',
    surface: '#211916',
    surfaceMuted: '#2a201d',
    text: '#f7eee8',
    mutedText: '#baa99f',
    border: '#4e3b33',
    borderStrong: '#6a4d42',
  },
} as const;
