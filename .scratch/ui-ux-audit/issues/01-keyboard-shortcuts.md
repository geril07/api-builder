# Add keyboard shortcut palette to editor

Status: `ready-for-agent`

## What to build

Add a Cmd+K / Ctrl+K command palette to the API Design editor that surfaces create/delete/save/undo/search actions. A developer-centric tool without keyboard shortcuts misses a core power-user expectation.

The palette should be available from both Canvas Mode and Flat Mode, triggered by the same global keybinding.

## Acceptance criteria

- [ ] Cmd+K (Mac) / Ctrl+K (other) opens a command palette overlay in the editor
- [ ] Palette includes: Create Resource, Create Schema, Create Auth Scheme, Export OpenAPI, AI Agent, Auto-layout, Toggle mode (Canvas/Flat)
- [ ] Palette is filterable by typing
- [ ] Escape closes the palette
- [ ] Enter activates the selected command
- [ ] Works in both Canvas Mode and Flat Mode

## Blocked by

None — can start immediately

## Comments
