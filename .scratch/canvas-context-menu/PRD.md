Status: done

# PRD: Canvas Context Menu

## Problem Statement

The "Add resource" button sits prominently in the top-right corner of the canvas toolbar, but it only handles one of three entity creation actions available to users (resource, schema, auth scheme). Users have no way to create schemas or auth schemes directly from the canvas surface — they must click a node first to open the sidebar, then use controls inside the panel. A single-purpose button wastes prime screen real estate and creates a discoverability gap for schema and auth scheme creation.

## Solution

Remove the standalone "Add resource" button and replace it with a right-click context menu on the canvas empty area. The menu surfaces all three creation actions — Add resource, Add schema, Add auth scheme — in one discoverable, spatially-attached affordance. The existing Export and AI panels remain in the top-right toolbar.

## User Stories

1. As an API designer, I want to right-click anywhere on the empty canvas to create a new Resource, so that I can start modeling without hunting for a toolbar button.
2. As an API designer, I want to right-click on the canvas to create a new Schema, so that I can define reusable schemas directly from the workspace.
3. As an API designer, I want to right-click on the canvas to create a new Auth Scheme, so that I can set up authentication configurations from the workspace.
4. As an API designer, I want the context menu to appear at my click location, so that it feels spatially connected to my action.
5. As an API designer, I want the context menu to close when I click elsewhere or press Escape, so that it does not obstruct my work.

## Implementation Decisions

- Use ReactFlow's `onPaneContextMenu` prop (fires `(event: ReactMouseEvent | MouseEvent) => void`) to detect right-clicks on empty canvas area.
- Call `event.preventDefault()` to suppress the browser's native context menu.
- Store click coordinates (`clientX`, `clientY`) in local state and render a positioned `<div>` at those coordinates using `position: fixed`.
- The menu renders three action buttons as plain `<button>` elements, styled with existing design tokens: `bg-popover`, `text-popover-foreground`, `font-mono`, `text-xs`, `rounded-none`, `border-border`.
- Dismiss on: click outside (via `mousedown` listener on `window`), Escape key (via `keydown` listener), and after executing any action.
- Set `panOnDrag={[1]}` on ReactFlow to prevent right-click from simultaneously triggering canvas pan + context menu.
- Remove the "Add resource" `<Button>` from the top-right toolbar div (lines 433-439 in canvas.tsx). Keep ExportPanel and AiPanel unchanged.
- Wire the existing `handleCreate` callback to the "Add resource" menu item.
- Wire the existing `handleCreateSchema` and `handleCreateAuthScheme` callbacks to their respective menu items. Pass default name arguments when called from the menu.

## Testing Decisions

- No tests required. This is a UX affordance change that touches only the rendering layer of a single component. Existing mutation tests cover the underlying create operations.

## Out of Scope

- Right-click context menu on nodes or edges (only canvas background).
- Customization or reordering of menu items.
- Keyboard shortcut for opening the context menu (besides the existing Escape to close).
- Submenus, separators, checkboxes, or radio groups within the context menu.

## Further Notes

- Follow existing visual conventions: `rounded-none`, `font-mono`, `text-xs`, no emojis, high-contrast palette via design tokens.
- The menu must not interfere with ReactFlow's node interaction or pane drag.
