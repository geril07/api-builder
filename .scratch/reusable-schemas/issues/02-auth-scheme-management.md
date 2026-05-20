Status: done

# 02 - Auth Scheme Management

## What to build

End-to-end Auth Scheme CRUD: database migration, server service layer, oRPC router, and an Auth tab in the sidebar panel. Auth schemes are named security scheme definitions owned by an API Design. Each scheme has a type (bearer, apiKey, oauth2, openIdConnect) and type-specific configuration stored as JSONB. The Auth tab lists all schemes, allows creating new schemes, editing scheme details, and deleting schemes.

The auth scheme editor shows: name field, type selector dropdown, and simple key-value config fields (no type-specific widget — just basic inputs). The config shape matches OpenAPI security scheme object conventions.

## Acceptance criteria

- [ ] `auth_schemes` table exists with id, api_design_id, name, type, config (JSONB), created_at, updated_at
- [ ] Name is unique per API Design
- [ ] Type constrained to 'bearer', 'apiKey', 'oauth2', 'openIdConnect'
- [ ] Server CRUD scoped to API Design ownership via Workspace check
- [ ] oRPC router exposes authScheme.create, authScheme.update, authScheme.delete
- [ ] API Design query returns auth schemes alongside schemas/resources/endpoints
- [ ] Sidebar gains an "Auth" tab, lists all auth schemes with type badge per row
- [ ] "New auth scheme" button creates a scheme with a default type
- [ ] Clicking a scheme opens edit panel: name input, type selector, config key-value inputs
- [ ] Delete auth scheme with confirmation
- [ ] Deleting an auth scheme removes its ID from endpoints.auth_scheme_ids (handled via application logic, not DB cascade — auth_scheme_ids is a JSONB array)
- [ ] Optimistic updates follow existing canvas editor mutation pattern

## Blocked by

None — can start immediately (independent of #01, follows same patterns).
