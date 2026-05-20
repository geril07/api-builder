# Add prefers-reduced-motion support

Status: `ready-for-agent`

## What to build

Animations (`animate-in`, `slide-in-from-right`, `zoom-in-95`, dialog open/close transitions) run regardless of the user's OS accessibility preference. Add a `@media (prefers-reduced-motion: reduce)` block in `globals.css` that disables or reduces all animations when the user has requested reduced motion.

This applies to:

- Dialog open/close transitions
- Select dropdown animations
- Toast slide-in/out
- Sidebar panel slide-in

## Acceptance criteria

- [ ] When OS "Reduce motion" is enabled, all CSS transitions and animations are minimized or disabled
- [ ] Static UI (no animation) still renders correctly — no layout shifts or missing content
- [ ] Verified in both light and dark mode
- [ ] Existing interactive behavior is unchanged for users without the preference

## Blocked by

None — can start immediately

## Comments
