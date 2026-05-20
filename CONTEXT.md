# API Builder

A REST API design tool with canvas and flat editing modes. Developers define Resources, Endpoints, Schemas, and Auth Schemes, get AI suggestions, and export to OpenAPI.

## Language

**Workspace**:
A scoped container for API Designs. Every user gets a personal Workspace on sign-in.
_Avoid_: Organization (the DB table name inherited from Better Auth — an implementation detail)

**API Design**:
A named document that groups Resources and Endpoints into a single API specification. Owned by a Workspace.
Its Resources, Endpoints, Schemas, and Auth Schemes are design-document entities, distinct from app authentication records and runtime backend resources.
_Avoid_: Project, spec, blueprint

**Editor Mode**:
The way an API Design is presented for editing. Supported modes are Canvas Mode and Flat Mode.
_Avoid_: View type, layout mode

**Canvas Mode**:
A spatial editor mode where Resources, Schemas, and Auth Schemes appear as positioned items connected by derived Edges.
_Avoid_: Graph-only editor

**Flat Mode**:
A non-canvas editor mode where Resources, Schemas, and Auth Schemes are edited through tabbed lists and a detail panel.
_Avoid_: Table mode, document view

**Resource**:
A REST resource in an API Design (e.g. "Users", "Orders"). Has a name, description, and a canvas position.
_Avoid_: Node, card, entity

**Endpoint**:
A REST endpoint attached to a Resource. Has an HTTP method (GET/POST/PUT/PATCH/DELETE), path, summary, request body, response shape, and auth requirement.
_Avoid_: Route, operation

**Schema**:
A JSON Schema definition in an API Design (e.g. "User", "OrderPayload"). Reusable across Endpoints as request body or response shape. Has a name, description, JSON schema body, and a canvas position.
_Avoid_: type, model, DTO

**Auth Scheme**:
An authentication method definition in an API Design (e.g. "Bearer JWT", "API Key"). Types: bearer, apiKey, oauth2, openIdConnect. Has a name, type, config, and a canvas position.
_Avoid_: security scheme, auth provider

**Query Parameter**:
A query/search parameter defined on an Endpoint, rendered as `?key=value` in the URL. Each parameter has a name, optional description, optional required flag, an optional type (string/number/integer/boolean, default string), and an optional allowMultiple toggle. Stored as JSON. Exports to OpenAPI as a parameter with `in: query`.
_Avoid_: search param, URL param, filter

**Edge**:
A visual connection on the canvas between a Resource and a Schema or Auth Scheme. Derived from Endpoint data — never user-drawn. Styled by connection type: solid blue for requestBody, dashed green for responseShape, dotted amber for auth. Uniquely per Resource→target pair; if multiple endpoints create the same pair, parallel edges are rendered.

## Relationships

- A **Workspace** contains one or more **API Designs**
- An **API Design** contains one or more **Resources**, **Schemas**, and **Auth Schemes**
- An **API Design** can be edited in **Canvas Mode** or **Flat Mode**
- A **Resource** exposes one or more **Endpoints**
- An **Endpoint** may reference a **Schema** as its request body or response shape
- An **Endpoint** may reference one or more **Auth Schemes**
- An **Edge** visually connects a **Resource** to a **Schema** (requestBody/responseShape) or to an **Auth Scheme** (auth)

## Example dialogue

> **Dev:** "Can a Resource exist without any Endpoints?"
> **Domain expert:** "Yes — you can place a Resource on the canvas and add Endpoints later. A Resource is a placeholder for a REST concept until you wire it up."
>
> **Dev:** "What if two API Designs need the same Resource, like 'Users'?"
> **Domain expert:** "Each API Design owns its own Resources. There's no cross-API Design sharing. If two designs both have a 'Users' Resource, they're independent copies."
>
> **Dev:** "Can I move an Endpoint from one Resource to another?"
> **Domain expert:** "No — an Endpoint belongs to exactly one Resource. Delete and re-create on the other Resource."

## Flagged ambiguities

- DB table `organizations` maps to the domain concept **Workspace** — the table name is inherited from Better Auth's schema. Code should prefer `workspace` in variable/route naming.
