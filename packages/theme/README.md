# @fomo/theme

Shared coral-orange theme primitives for web and native.

## What it provides

- Shared brand palette in `src/palette.ts`
- Semantic brand tokens in `src/semantic.ts`
- Native-friendly theme exports in `src/native.ts`
- Shared CSS variables and Tailwind theme tokens in `src/global.css`

## Default coral tokens

- `primary`: coral `400` `#ff7f50`
- `primary-hover`: coral `700` `#c61d08`
- `primary-active`: coral `800` `#9d190f`
- `primary-soft`: coral `50` `#fff4ed`
- `primary-soft-border`: coral `200` `#ffc7a8`
- `primary-text`: coral `700` `#c61d08`
- `primary-ring`: coral `300` `#ffa071`

## Surface tokens

The package also defines shared surface semantics for both light and dark themes:

- `background`
- `surface`
- `surface-muted`
- `text`
- `muted-text`
- `border`
- `border-strong`

## Native exports

Use the native exports when wiring React Navigation, native tabs, or JS-driven React Native components:

- `nativeTheme.light`
- `nativeTheme.dark`
- `navigationThemeColors.light`
- `navigationThemeColors.dark`

These provide a consistent source for values like `background`, `surface`, `text`, `mutedText`, `border`, `tint`, `primarySoft`, and `primaryText`.

## Usage rules

- Use semantic tokens like `primary`, `background`, and `surface-muted` instead of hardcoded hex values.
- Use `primary` for CTA fills, active navigation states, and key links.
- Use `primary-soft` plus `primary-soft-border` for highlighted surfaces, pills, and subtle emphasis.
- Keep most layout surfaces neutral so coral reads as intentional, not noisy.

## Web

Import `@fomo/theme/global.css` into the app's global stylesheet to register the shared CSS variables and Tailwind tokens.

Example:

```css
@import '@fomo/theme/global.css';
```

## Mobile

Import the same CSS entry into `apps/mobile/src/global.css`, then map any app-level aliases there if needed.

For JS-driven native UI, import from `@fomo/theme/native`.

Example:

```ts
import { nativeTheme, navigationThemeColors } from '@fomo/theme/native';
```
