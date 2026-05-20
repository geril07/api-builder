# Use sans-serif for headings instead of monospace

Status: `ready-for-human`

## What to build

Currently `--font-heading` resolves to `--font-mono` (`globals.css:8`), meaning headings and body text are the same monospace typeface (JetBrains Mono). This limits visual hierarchy and scannability — monospace is harder to parse quickly at larger sizes for headings.

The ui-ux-pro-max design system recommends a tech-oriented sans-serif pairing (Space Grotesk / DM Sans) for headings while keeping monospace for body/UI labels. This maintains the developer-tool aesthetic while improving readability.

## Acceptance criteria

- [ ] Select a tech-oriented sans-serif font (Space Grotesk or DM Sans from Google Fonts via `next/font`)
- [ ] `--font-heading` resolves to the sans-serif variable
- [ ] Heading components (page titles, dialog titles, card titles) use `font-heading`
- [ ] UI labels and body text remain monospace (`font-mono`)
- [ ] No layout shift on font load (measured via Lighthouse or visual check)
- [ ] Both light and dark mode verified

## Blocked by

None — can start immediately (but needs human to decide: Space Grotesk vs DM Sans, and whether to go ahead with this change at all)

## Comments

This is a stylistic change that affects the entire visual identity. A human should decide whether to proceed.
