export const coralPalette = {
  50: '#fff4ed',
  100: '#ffe5d4',
  200: '#ffc7a8',
  300: '#ffa071',
  400: '#ff7f50',
  500: '#fe4711',
  600: '#ef2c07',
  700: '#c61d08',
  800: '#9d190f',
  900: '#7e1810',
  950: '#440806',
} as const;

export type CoralPaletteStep = keyof typeof coralPalette;
