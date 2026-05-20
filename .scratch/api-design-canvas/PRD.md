Status: done

# PRD: API Design Canvas

## Problem Statement

Developers need a visual, spatial way to design REST APIs — placing Resources on a canvas, defining Endpoints, and understanding the API structure at a glance — without writing raw OpenAPI by hand.

## Solution

A canvas-based editor where users add Resource cards, attach Endpoints to them, and capture endpoint metadata (HTTP method, path, summary, request body, response shape, auth requirement). The canvas provides spatial orientation around API structure.

## User Stories

1. As an API designer, I want to open an API Design in a canvas editor at `/api-designs/[apiDesignId]`, so that I can start modeling visually.
2. As an API designer, I want to add a Resource card to the canvas, so that I can represent a REST concept like "Users" or "Orders".
3. As an API designer, I want to define Endpoints on a Resource, so that I can specify how clients interact with each Resource.
4. As an API designer, I want to support GET, POST, PUT, PATCH, and DELETE HTTP methods, so that I can model standard REST operations.
5. As an API designer, I want to capture endpoint metadata (path, summary, request body, response shape, auth requirement), so that my API Design is detailed enough for export.
6. As an API designer, I want to scan HTTP methods, paths, and summaries at a glance, so that I can understand the API structure quickly.
7. As an API designer, I want to see the spatial layout of Resources on the canvas, so that I can reason about API relationships visually.
8. As an API designer, I want my modeled Resources and Endpoints to be usable by the Export feature, so that my design work produces a real OpenAPI spec.

## Implementation Decisions

- The editor route is `/api-designs/[apiDesignId]`. It only loads API Designs owned by the current user's Workspace.
- Resources are placed as cards on a canvas with x/y positions. A Resource can exist without Endpoints (placeholder until wired up).
- Endpoints belong to exactly one Resource. No cross-Resource endpoint sharing. Moving an endpoint requires delete and re-create.
- Supported HTTP methods: GET, POST, PUT, PATCH, DELETE.
- Each Endpoint captures: path, summary, request body schema, response shape, and auth requirement (required/optional/none).
- The canvas is API-structure-oriented, not a generic diagramming tool.
- Resources and Endpoints defined on the canvas feed directly into the Export feature's OpenAPI generation.

## Testing Decisions

- Test that the editor loads only API Designs owned by the current Workspace.
- Test adding a Resource to the canvas and verifying it appears.
- Test adding Endpoints to a Resource with each supported HTTP method.
- Test that endpoint metadata (path, summary, body, response, auth) is captured and visible.
- Test that the Export feature correctly includes all modeled Resources and Endpoints.
- Test that users cannot access API Designs from other Workspaces.
- Tests should validate canvas state and export output, not internal canvas rendering details.

## Out of Scope

- Full schema designer (detailed JSON Schema editing).
- GraphQL modeling or any non-REST protocol.
- API versioning or changelog tracking.
- Review threads or team approval workflows.
- Live multi-user collaborative editing (real-time sync).
- Cross-Resource relationships (linking Resources on the canvas).
- Reordering or sorting Endpoints within a Resource.

## Further Notes

- Resource cards must stay compact and scannable — avoid large previews or heavy decoration.
- HTTP method badges (GET, POST, etc.) should use high-signal color coding for quick scanning.
- Paths, method names, IDs, and schema-like fields must use monospace typography.
- An Endpoint belongs to exactly one Resource. No orphaned Endpoints. Delete and re-create for moves.
- Each API Design owns its own Resources — no cross-API Design Resource sharing. Two designs with a "Users" Resource are independent copies.
