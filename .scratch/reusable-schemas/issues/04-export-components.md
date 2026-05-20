Status: done

# 04 - Export Components

## What to build

Upgrade the OpenAPI export service to emit all Schemas into `components.schemas` and all Auth Schemes into `components.securitySchemes`. Update endpoint operation generation to use `$ref` when a schema reference is set (instead of inline schema value), and emit `security` arrays when auth scheme references are set.

When an endpoint has a schema ref (requestBodySchemaId or responseShapeSchemaId), the export uses `$ref: '#/components/schemas/SchemaName'`. When no ref is set, the existing inline raw JSON path is used unchanged.

When an endpoint has auth scheme refs, each referenced scheme name is emitted in the operation's `security` array: `security: [{ SchemeName: [] }]`.

## Acceptance criteria

- [ ] Export fetch joins schemas and auth_schemes tables alongside resources/endpoints
- [ ] All schemas emitted into `components.schemas`, keyed by schema name, value is the json_schema content
- [ ] All auth schemes emitted into `components.securitySchemes`, keyed by name, with `type` and config fields merged (OpenAPI standard shape)
- [ ] Endpoint with requestBodySchemaId set emits `$ref: '#/components/schemas/...'` in requestBody content schema — inline requestBody field is ignored
- [ ] Endpoint without requestBodySchemaId emits inline requestBody as before (JSON wrapped in application/json content)
- [ ] Same rules for responseShapeSchemaId / responseShape
- [ ] Endpoint with non-empty authSchemeIds emits `security: [{ SchemeA: [] }, { SchemeB: [] }]` in the operation object
- [ ] Endpoint with empty authSchemeIds omits the `security` key (no security on that operation)
- [ ] Both JSON and YAML export formats include the new components
- [ ] Export preview panel shows the full spec with schemas and security schemes

## Blocked by

- #01 - Schema Management
- #02 - Auth Scheme Management
- #03 - Endpoint Editor Upgrade
