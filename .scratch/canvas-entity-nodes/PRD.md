Status: done

# PRD: Schema & Auth Scheme Nodes on Canvas

## Problem Statement

Schema and Auth Scheme entities are invisible on the canvas. Users create them through context menu or sidebar, but they only exist in sidebar list views — there is no visual, spatial representation of them on the canvas. This creates a split-brain UX: Resources live on the canvas with spatial position, but Schemas and Auth Schemes are relegated to sidebar tabs with no spatial affordance. Users cannot arrange, see, or interact with Schemas and Auth Schemes as first-class canvas entities.

## Solution

Make Schema and Auth Scheme entities full canvas citizens. Each Schema and Auth Scheme gets a draggable node rendered on the ReactFlow canvas, positioned at creation coordinates (from the right-click context menu), with visual distinction from Resource nodes. The existing sidebar list views remain as an alternative navigation path. All three entity types — Resource, Schema, Auth Scheme — coexist on the same canvas with independent position state persisted to the database.

## User Stories

1. As an API designer, I want to see Schema nodes on the canvas after creating them via the context menu, so that I can position them spatially alongside Resources.
2. As an API designer, I want to drag Schema nodes to reposition them on the canvas, so that I can organize my workspace visually.
3. As an API designer, I want to click a Schema node to open its detail view in the sidebar, so that I can edit the schema definition.
4. As an API designer, I want to see Auth Scheme nodes on the canvas after creating them via the context menu, so that they have a visual place in my API design.
5. As an API designer, I want to drag Auth Scheme nodes to reposition them on the canvas, so that I can organize authentication configurations spatially.
6. As an API designer, I want to click an Auth Scheme node to open its detail view in the sidebar, so that I can edit auth configuration.
7. As an API designer, I want Resource, Schema, and Auth Scheme nodes to all coexist on the same canvas, so that I have a unified spatial workspace for my entire API design.
8. As an API designer, I want node positions to persist across page reloads, so that my spatial arrangement is durable.
9. As an API designer, I want Schema nodes to be visually distinct from Resource nodes, so that I can tell entity types apart at a glance.

## Implementation Decisions

- **Database migration**: Add `position_x real DEFAULT 0` and `position_y real DEFAULT 0` columns to both `schemas` and `auth_schemes` tables. Generated via `npx drizzle-kit generate` after modifying the Drizzle schema.
- **Drizzle schema**: Mirror the pattern from `resourcesTable` — add `positionX: real('position_x').notNull().default(0)` and `positionY: real('position_y').notNull().default(0)` to `schemasTable` and `authSchemesTable`. The `SchemaDto` and `AuthSchemeDto` types (inferred via `$inferSelect`) will automatically gain these fields.
- **Service layer** (`schema/service.ts`, `auth-scheme/service.ts`): Accept `positionX: number` and `positionY: number` in create functions (required). Accept `positionX?: number` and `positionY?: number` in update functions (optional, conditionally included in the update object). Follow the existing pattern in `resource/service.ts`.
- **ORPC procedures** (`schema/orpc.ts`, `auth-scheme/orpc.ts`): Add `positionX: z.number()` to create input schemas (required). Add `positionX: z.number().optional()` and `positionY: z.number().optional()` to update input schemas.
- **Mutations** (`mutations.ts`): Add `positionX`/`positionY` to `createSchemaMutationOptions` and `createAuthSchemeMutationOptions` input types and optimistic payloads. Add optional `positionX`/`positionY` to `updateSchemaMutationOptions` and `updateAuthSchemeMutationOptions` input types with conditional optimistic spreading.
- **New node components**: Create `schema-node.tsx` and `auth-scheme-node.tsx`, modeled after `resource-node.tsx`. Each is a memoized component receiving `NodeProps` with typed node data (entity DTO + onDelete callback). Schema nodes show name, type badge ("Schema"), and delete button. Auth scheme nodes show name, type badge ("Auth: bearer"/"Auth: apiKey"/etc.), and delete button. Both follow the existing visual conventions: `rounded-none`, `font-mono`, `border-border`/`border-ring` for selected state, compact card layout.
- **Canvas integration** (`canvas.tsx`):
  - Add `schema` and `authScheme` node types to `nodeTypes`.
  - Extend the node sync `useEffect` to also map schemas and auth schemes to nodes (same pattern as resources: add on create, remove on delete).
  - Add `onNodeDragStop` handling for schema and auth scheme nodes (call update mutations with rounded position, rollback on error).
  - Add `handleNodeClick` handling: clicking a schema node sets `selectedNodeId` to the schema ID and opens sidebar in schema detail mode; clicking an auth scheme node does the same for auth scheme detail.
  - Update `handleMenuAddSchema` and `handleMenuAddAuthScheme` to convert context menu client coordinates to flow coordinates via `reactFlowInstance.screenToFlowPosition`, then pass `positionX`/`positionY` to the respective create mutations.
  - Store context menu position in a ref so it's accessible inside the creation handlers (the state-based `contextMenu.x/y` may be stale inside useCallback deps).
- **Context menu position**: The context menu state holds `clientX`/`clientY`. Use `reactFlowInstance.screenToFlowPosition({ x: contextMenu.x, y: contextMenu.y })` to convert to flow coordinates. Round to integers.
- **Sidebar interaction**: Clicking a schema or auth scheme node opens the sidebar with that entity's detail view directly — no tab navigation. The sidebar content is determined solely by the selected node (endpoint > schema > auth scheme > resource priority). The tab-based navigation (Resource/Schemas/Auth) has been removed as it's redundant with canvas node selection.

## Testing Decisions

- No tests required. This follows the existing untested canvas UI patterns. All mutations are already covered by existing tests.

## Out of Scope

- Edges or connections between schema/auth-scheme nodes and resource nodes.
- Schema node preview of JSON Schema content (name + badge only).
- Inline editing of schema/auth-scheme content on the node (sidebar handles editing).
- Node-specific right-click context menus (global canvas context menu only).
- Reordering or sorting of nodes automatically.

## Further Notes

- Schema and Auth Scheme nodes must use the same visual language as Resource nodes (border, bg, font-mono, compact).
- The existing sidebar schema/auth-scheme list views remain fully functional — this adds canvas rendering in addition, not instead of.
- Node IDs are the entity IDs (schema ID, auth scheme ID) — no ID collision risk since each table uses UUID PKs.
