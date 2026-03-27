# @fomo/theme

Shared coral-orange design tokens for web and native.

## Default Coral Primary

- `primary`: coral `600` `#ef2c07`
- `primary-hover`: coral `700` `#c61d08`
- `primary-active`: coral `800` `#9d190f`
- `primary-soft`: coral `50` `#fff4ed`
- `primary-soft-border`: coral `200` `#ffc7a8`
- `primary-text`: coral `700` `#c61d08`

## Usage Rules

- Use semantic tokens like `primary` and `primary-soft` instead of hardcoded coral hex values.
- Use `primary` for CTA fills, active navigation states, and key links.
- Use `primary-soft` plus `primary-soft-border` for highlighted surfaces, pills, and subtle emphasis.
- Keep most layout surfaces neutral so coral reads as intentional, not noisy.

## Web

Import `packages/theme/src/theme.css` into global styles, then map semantic variables into Tailwind theme tokens.

## Mobile

Import the same CSS file into `apps/mobile/src/global.css` and alias the shared brand tokens into app-level semantic tokens such as `--color-app-tint`.
