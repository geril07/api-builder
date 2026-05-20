Status: done

# 01 - Schema Management

## What to build

End-to-end Schema CRUD: database migration, server service layer, oRPC router, and a Schemas tab in the sidebar panel. Schemas are named JSON Schema definitions owned by an API Design. The Schemas tab lists all schemas with endpoint reference counts, allows creating new schemas, editing JSON Schema content via a basic textarea, and deleting schemas (with a confirmation dialog that warns when the schema is referenced by endpoints).

The schema editor panel (opened when clicking a schema row) shows: name field, optional description field, JSON Schema textarea, and a **"Referenced by"** section listing every Endpoint that references this schema, with the endpoint's method, path, and parent Resource name. Each referenced endpoint is clickable — navigates to that endpoint in the Endpoint editor view.

## Acceptance criteria

- [ ] `schemas` table exists with id, api_design_id, name, description, json_schema, created_at, updated_at
- [ ] Name is unique per API Design (enforced at DB or service layer)
- [ ] Server CRUD (create, update, delete) scoped to API Design ownership via Workspace check
- [ ] oRPC router exposes schema.create, schema.update, schema.delete
- [ ] API Design query returns schemas alongside resources/endpoints
- [ ] Sidebar gains a "Schemas" tab, lists all schemas with endpoint reference count badge per row
- [ ] "New schema" button creates a schema with placeholder content
- [ ] Clicking a schema opens detail panel: name input, description input, JSON Schema textarea (validates valid JSON on save)
- [ ] Detail panel shows "Referenced by N Endpoints" section listing each referencing endpoint (method + path + parent Resource name), each clickable — navigates to that endpoint editor
- [ ] Delete schema shows confirmation. If schema is referenced, dialog warns: "Referenced by N Endpoints. Deleting will remove the reference (endpoints fall back to inline body/shape)."
- [ ] Deleting a schema sets request_body_schema_id / response_shape_schema_id to NULL on referencing endpoints (migration must define FK with ON DELETE SET NULL)
- [ ] Optimistic updates for schema mutations follow existing pattern (see resource/endpoint mutations in canvas editor)

## Blocked by

None — can start immediately.
