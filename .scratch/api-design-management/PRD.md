Status: done

# PRD: API Design Management

## Problem Statement

Developers need to create, organize, and maintain named API Design documents inside their Workspace as the starting point for their REST API modeling work.

## Solution

Full CRUD operations on API Designs scoped to a Workspace. Each API Design is a named document that groups Resources and Endpoints. Users create, rename, list, and delete designs from their dashboard.

## User Stories

1. As a developer, I want to create a new API Design from my dashboard, so that I can start modeling a new API.
2. As a developer, I want to name my API Design before it is created, so that I always have a meaningful identifier for my work.
3. As a developer, I want to land in the editor after creating an API Design, so that I can immediately start adding Resources and Endpoints.
4. As a developer, I want to see all my API Designs listed on the dashboard, so that I can find and open existing work.
5. As a developer, I want to rename an API Design when its purpose evolves, so that the name always reflects its contents.
6. As a developer, I want to delete an API Design I no longer need, so that my Workspace stays clean.
7. As a developer, I want each API Design to be owned by my Workspace, so that all my designs are organized in one place.

## Implementation Decisions

- API Design is the user-facing noun. "Design" is used only when the context of a specific API Design is already clear.
- Internal naming follows `ApiDesign`, `apiDesign`, `apiDesigns`, `apiDesignId`, and `api_designs` throughout the codebase.
- API Designs are scoped to the current Workspace — no cross-Workspace visibility.
- Creating an API Design requires a name input before the record is persisted.
- On creation, the user is navigated to `/api-designs/[apiDesignId]` (the editor route).
- Renaming updates the visible name without affecting ownership or the underlying Resources/Endpoints.
- Deleting removes the API Design and all its Resources and Endpoints from the Workspace.

## Testing Decisions

- Test creation flow: user initiates "New API design", provides a name, and is navigated to the editor.
- Test that creating without a name is prevented.
- Test that the dashboard lists all API Designs for the current Workspace.
- Test rename: name updates in the list without changing ownership.
- Test delete: API Design is removed from the list and can no longer be opened.
- Tests should validate external behavior (UI state, route navigation, list contents), not internal state management.

## Out of Scope

- API Design templates or starter designs.
- Version history for API Designs.
- Duplicate or fork flows.
- Public sharing links for API Designs.
- Moving an API Design between Workspaces.
- Batch operations (multi-select delete, etc.).

## Further Notes

- Use "API design" in all user-facing copy: dashboard, empty states, creation flows, destructive action confirmations, and export flows.
- Empty states should guide users toward the core loop: create an API Design → add Resources → define Endpoints → export OpenAPI.
