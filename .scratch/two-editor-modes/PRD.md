# PRD: Two Editor Modes for API Designs

Status: done

## Problem Statement

The API Design editor currently only supports Canvas Mode. Canvas Mode is useful for understanding relationships between Resources, Schemas, Auth Schemes, and derived Edges, but it is not always the fastest way to make edits. Users need a non-canvas editing experience for linear API Design work, especially when they want to scan and edit Resources, Endpoints, Schemas, and Auth Schemes without panning around a graph.

## Solution

Add two explicit Editor Modes for an API Design:

1. Canvas Mode: the existing spatial canvas editor where Resources, Schemas, and Auth Schemes are positioned and connected by derived Edges.
2. Flat Mode: a non-canvas, tabbed master-detail editor where Resources, Schemas, and Auth Schemes are peer sections.

Flat Mode should not reuse the existing canvas sidebar as a dialog. Instead, the current entity editor forms should be reused through shared editor primitives, while Canvas Mode and Flat Mode each get their own shell:

1. Canvas Mode keeps the current right-side overlay panel behavior.
2. Flat Mode uses an in-page detail panel that feels like part of the flat editor, not a floating dialog.

The active mode should be persisted in the URL so users can refresh or share a link to the same Editor Mode.

The mode switch should be presented as a labeled segmented control: Canvas | Flat. The control should make the active mode obvious because switching modes changes the editor's mental model, not just its visual styling.

## User Stories

1. As an API Design author, I want to switch between Canvas Mode and Flat Mode, so that I can choose the editing style that fits my current task.
2. As an API Design author, I want Canvas Mode to keep working as it does today, so that existing graph-based workflows are not disrupted.
3. As an API Design author, I want Flat Mode to avoid the canvas entirely, so that I can edit without panning, zooming, or arranging items.
4. As an API Design author, I want my selected Editor Mode to persist in the URL, so that refreshes and shared links keep the same mode.
5. As an API Design author, I want Canvas Mode to be the default mode, so that existing behavior stays familiar.
6. As an API Design author, I want mode switching to use clearly labeled Canvas and Flat options, so that I understand which editing experience is active.
7. As an API Design author, I want the editor to preserve my selected entity across mode switches when possible, so that I can continue editing the same Resource, Endpoint, Schema, or Auth Scheme after switching modes.
8. As an API Design author, I want Flat Mode to have tabs for Resources, Schemas, and Auth Schemes, so that top-level API Design concepts are easy to navigate.
9. As an API Design author, I want the active Flat Mode tab to persist in the URL, so that refreshes and shared links keep the same section open.
10. As an API Design author, I want the Resources tab to show a list of Resources, so that I can scan my API Design by REST concept.
11. As an API Design author, I want each Resource in Flat Mode to expand inline, so that I can see its Endpoints without opening an editor panel.
12. As an API Design author, I want each Endpoint under a Resource to show its HTTP method and path, so that I can identify it quickly.
13. As an API Design author, I want expanded Resource rows to provide a + Endpoint action, so that I can create Endpoints without first opening the Resource detail panel.
14. As an API Design author, I want to select a Resource from the flat list, so that I can edit its name, description, and Endpoints in the detail panel.
15. As an API Design author, I want to select an Endpoint from the flat list, so that I can edit its method, path, summary, query parameters, body, response shape, and auth requirements.
16. As an API Design author, I want Endpoint rows to optionally show compact relationship chips for linked request Schema, response Schema, and Auth Schemes, so that Flat Mode gives me some relationship context without becoming a graph.
17. As an API Design author, I want the Schemas tab to show all Schemas, so that I can manage reusable request and response structures from one place.
18. As an API Design author, I want each Schema list item to show where it is used, so that Flat Mode still communicates relationships that Canvas Mode normally shows with Edges.
19. As an API Design author, I want Schema usage to identify referencing Endpoints, so that I can understand the impact of changing a Schema.
20. As an API Design author, I want to select a Schema from the flat list, so that I can edit its name, description, and JSON schema body.
21. As an API Design author, I want the Auth Schemes tab to show all Auth Schemes, so that I can manage authentication definitions from one place.
22. As an API Design author, I want each Auth Scheme list item to show where it is used, so that I can understand which Endpoints depend on it.
23. As an API Design author, I want to select an Auth Scheme from the flat list, so that I can edit its name, type, and config.
24. As an API Design author, I want Flat Mode to provide a + Resource button in the Resources tab, so that I can create Resources without using the canvas context menu.
25. As an API Design author, I want Flat Mode to provide a + Schema button in the Schemas tab, so that I can create reusable Schemas without using the canvas context menu.
26. As an API Design author, I want Flat Mode to provide a + Auth Scheme button in the Auth Schemes tab, so that I can create Auth Schemes without using the canvas context menu.
27. As an API Design author, I want newly created flat entities to open in the detail panel when possible, so that I can immediately rename and configure them.
28. As an API Design author, I want newly created flat entities to remain usable in Canvas Mode, so that switching modes does not produce broken or missing canvas items.
29. As an API Design author, I want newly created flat entities to receive deterministic canvas positions, so that Canvas Mode can render them predictably before auto-layout.
30. As an API Design author, I want Canvas Mode auto-layout to remain available only in Canvas Mode, so that Flat Mode does not expose canvas-specific controls.
31. As an API Design author, I want Export and AI actions to be available in both modes, so that mode switching does not remove global API Design actions.
32. As an API Design author, I want Flat Mode selection to use a normal in-page detail panel, so that the interface feels like a flat editor rather than a graph with an overlay.
33. As an API Design author, I want Canvas Mode selection to keep using a right-side overlay panel, so that existing canvas interactions remain unchanged.
34. As an API Design author, I want delete confirmation to work consistently in both modes, so that destructive actions remain safe.
35. As an API Design author, I want deletion to leave me in a sensible place, so that I do not end up looking at a deleted item or an empty broken detail panel.
36. As an API Design author, I want the same editor forms to power both modes, so that behavior and validation stay consistent.
37. As an API Design author on desktop, I want Flat Mode to show the list and detail panel side by side, so that selection and editing can happen without losing list context.
38. As an API Design author on a small screen, I want Flat Mode to move between list and detail screens with a clear Back action, so that the editor remains usable on mobile.
39. As an API Design author, I want actionable empty states for each Flat Mode tab, so that I can create the first Resource, Schema, or Auth Scheme directly from the empty state.
40. As an API Design author, I want optimistic updates in Flat Mode, so that creates, edits, deletes, and reorders feel as responsive as Canvas Mode.
41. As an API Design author, I want mode switching to preserve my API Design data, so that changing the presentation never changes the underlying API Design.
42. As an API Design author, I want Flat Mode references to update after editing Endpoint Schema or Auth Scheme references, so that relationship summaries stay current.

## Implementation Decisions

- Introduce explicit Editor Mode handling with two supported values: Canvas Mode and Flat Mode.
- Store the active Editor Mode in the URL query string as `mode=canvas` or `mode=flat`.
- Default to Canvas Mode when the URL has no mode or an invalid mode.
- Present mode switching as a labeled segmented control with Canvas and Flat options.
- Preserve the current entity selection across mode switches when the selected entity still exists and can be represented in the target mode.
- Store the active Flat Mode tab in the URL query string as `tab=resources`, `tab=schemas`, or `tab=auth-schemes`.
- Default the Flat Mode tab to Resources when the URL has no tab or an invalid tab.
- Keep Canvas Mode as the existing ReactFlow-based editor.
- Add Flat Mode as a separate mode shell, not as a variation of the canvas.
- Do not reuse the existing sidebar dialog shell for Flat Mode.
- Extract shared editor primitives from the current sidebar behavior so Canvas Mode and Flat Mode can reuse the editor content and destructive-action flow without sharing layout wrappers.
- Create a shared entity editor content module that resolves the current selection and renders the correct Resource, Endpoint, Schema, or Auth Scheme editor form.
- Create a shared entity editor header primitive that handles titles, back navigation from Endpoint to Resource, close/back behavior, and delete affordances.
- Create a shared entity delete confirmation primitive that handles delete mutation wiring and success behavior for Resource, Endpoint, Schema, and Auth Scheme selections.
- Keep separate presentation shells for the editor panel: one canvas overlay shell and one flat in-page detail shell.
- Extract mode-neutral selection state from the canvas-specific selection hook.
- Selection should support selecting a Resource, Endpoint, Schema, or Auth Scheme; closing the editor; and returning from an Endpoint to its parent Resource.
- Canvas Mode should adapt ReactFlow node clicks into the shared selection API.
- Flat Mode should adapt list item clicks into the shared selection API.
- Add a shared editor toolbar area that can render mode switching, Export, AI, and mode-specific actions.
- Canvas Mode should keep Auto-layout in the toolbar.
- Flat Mode should not show Auto-layout.
- Flat Mode should use a tabbed master-detail layout with an explicit desktop and mobile behavior.
- On desktop, Flat Mode should render the active tab list and selected entity detail panel side by side.
- On mobile, Flat Mode should switch between list and detail screens, with the detail screen offering a clear Back action to return to the list.
- In Flat Mode, Resources, Schemas, and Auth Schemes are peer sections.
- The Resources tab should render Resources as expandable list items.
- Expanded Resource items should show their Endpoints inline.
- Endpoint rows should show the HTTP method and path.
- Expanded Resource items should include an inline + Endpoint action.
- Selecting a Resource should open the Resource editor in the flat detail panel.
- Selecting an Endpoint should open the Endpoint editor in the flat detail panel.
- Endpoint rows may show compact relationship chips for linked request Schema, response Schema, and Auth Schemes. These chips are optional for v1 and should be omitted if they make the list feel noisy.
- The Schemas tab should render each Schema with name, description where available, and usage references.
- Schema usage references should be derived from Endpoints that use the Schema as request body or response shape.
- The Auth Schemes tab should render each Auth Scheme with name, type, and usage references.
- Auth Scheme usage references should be derived from Endpoints that reference the Auth Scheme.
- Reference summaries should be derived from existing API Design data, not persisted separately.
- Reference summaries can stay simple in v1. Advanced truncation, expansion, or richer reference browsing belongs in backlog.
- Add a deep, testable derived-data module for Flat Mode list data and reference summaries.
- Flat Mode should support create actions from each tab.
- Creating a Resource in Flat Mode should use a default name and deterministic canvas position.
- Creating a Schema in Flat Mode should use a default name, an empty JSON schema body, and a deterministic canvas position.
- Creating an Auth Scheme in Flat Mode should use a default name, bearer type, empty config, and a deterministic canvas position.
- After creating an entity in Flat Mode, the editor should select it, open it in the detail panel, and focus its name field when feasible.
- Deterministic flat-created canvas positions should avoid overlapping the exact same coordinates for every new item when feasible.
- Flat-created entities should remain eligible for Canvas Mode auto-layout.
- Empty states in Flat Mode should be actionable and include the relevant create action for the current tab.
- After deleting an Endpoint, the editor should return to the parent Resource when possible.
- After deleting a Resource, Schema, or Auth Scheme, the editor should close the detail panel and keep the user on the current Flat Mode tab.
- After deletion, focus should move to the nearest remaining relevant row when feasible.
- No database schema changes are required.
- No API contract changes are required unless existing create procedures reject deterministic placeholder positions.
- Existing optimistic mutation behavior should be reused.
- Existing Resource, Endpoint, Schema, and Auth Scheme editor forms should remain the source of truth for editing entity details.
- Update domain language so API Builder is described as supporting both Canvas Mode and Flat Mode.

## Testing Decisions

- Tests should focus on external behavior and stable contracts, not component internals.
- Test Editor Mode parsing: missing mode defaults to Canvas Mode, invalid mode defaults to Canvas Mode, valid modes are preserved.
- Test Flat Mode tab parsing: missing or invalid tab defaults to Resources, valid tabs are preserved.
- Test shared selection behavior: selecting each entity type opens the correct selection state, selecting an Endpoint keeps its parent Resource, closing clears selection, and back from Endpoint returns to Resource.
- Test Flat Mode derived data: Resources include sorted/associated Endpoints, Schemas include correct request/response usage references, and Auth Schemes include correct Endpoint usage references.
- Test Flat Mode create-position helper if extracted: new items receive deterministic positions that are valid numbers and stable for the same input.
- Test Flat Mode create behavior where practical: newly created entities are selected and opened in the detail panel when mutation results make that possible.
- Test delete navigation behavior where practical: Endpoint deletion returns to parent Resource and top-level entity deletion closes the detail panel.
- Add component-level tests for Flat Mode where practical: Resources tab renders expandable Resources and selectable Endpoint rows; Schemas and Auth Schemes show usage references.
- Keep existing canvas layout and edge tests intact.
- Existing tests for auto-layout are prior art for testing deep derived modules.
- Existing editor/sidebar behavior should be covered through shared editor primitive tests only where there is new behavior.

## Out of Scope

- Inline editing directly inside flat list rows.
- Replacing the existing Resource, Endpoint, Schema, or Auth Scheme editor forms.
- Changing OpenAPI export behavior.
- Changing AI assistant behavior.
- Changing database schema.
- Making positions nullable.
- Persisting reference summaries separately.
- Advanced Used By interactions such as truncation rules, expand/collapse behavior, or rich reference browsing.
- User-drawn Edges.
- Moving an Endpoint between Resources.
- Replacing Canvas Mode with Flat Mode.
- Building a rendered OpenAPI document preview.
- Adding filtering, searching, or sorting beyond the default ordering already used by the API Design editor.
- Making relationship chips mandatory for v1.

## Further Notes

- Flat Mode exists to make editing linear and fast, not to replace Canvas Mode's relationship visualization.
- Canvas positions remain part of Resource, Schema, and Auth Scheme data because Canvas Mode still needs them.
- The current domain language previously described API Builder as canvas-based. The glossary should now describe the product as supporting both Canvas Mode and Flat Mode.
- The implementation should prefer small, focused refactors before adding Flat Mode UI, especially around selection and editor panel primitives.
- The most important architectural boundary is content reuse without shell reuse: both modes share editor content, but each mode owns its layout wrapper.
- The UX goal is that Flat Mode feels like a first-class editor, not a list wrapped around the existing canvas sidebar.
