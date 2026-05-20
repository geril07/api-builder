Status: done

# PRD: AI Agent System

## Problem Statement

The current AI suggestion system is a single-shot prompt-to-structured-output pipeline. It calls Gemini once with `generateObject()`, returns a fixed list of suggested resources/endpoints/schemas, and requires the user to accept each item individually. This is slow, limited to one round of generation, and cannot handle complex multi-step requests like "create a full CRUD for Users with proper auth and a reusable schema" in one shot.

Users want to describe an API goal in natural language and have an AI agent execute it end-to-end — creating resources, endpoints, schemas, and auth schemes directly on the canvas, using tools, with streaming feedback.

## Solution

Replace the single-shot suggestion system with a **tool-calling AI agent** that runs via the Vercel AI SDK's `streamText()` with `maxSteps`. The agent uses OpenRouter (`tencent/hy3-preview`) and has fine-grained CRUD tools (create/update/delete for Resource, Endpoint, Schema, AuthScheme). The agent streams its reasoning and tool calls to the client via oRPC SSE (Event Iterator), and the canvas auto-updates as entities are created.

The user types a prompt → agent receives it with full design context → agent plans and calls tools step-by-step → each tool creates/modifies/deletes entities in real-time on the canvas → user sees the agent's reasoning and actions streaming in the dialog.

## User Stories

1. As an API designer, I want to type a prompt like "create a CRUD for Users with name, email, and age fields" and have the agent create the resource and all 5 REST endpoints in one go, so that I scaffold APIs quickly.
2. As an API designer, I want the agent to create corresponding schemas (e.g. CreateUserDto, UserResponse, ErrorResponse) when I ask for CRUD, so that my API has reusable type definitions.
3. As an API designer, I want the agent to attach auth schemes to endpoints (e.g. "protect POST/PATCH/DELETE with bearer auth") so that security is configured automatically.
4. As an API designer, I want to ask the agent to "add a search endpoint to Products" and have it add just that one endpoint to an existing resource, so that I can make targeted additions.
5. As an API designer, I want the agent to be able to update existing resources (rename, change endpoints, modify schemas) so that I can iterate without manual clicking.
6. As an API designer, I want to see the agent's reasoning and tool calls stream in real-time, so that I understand what the agent is doing and can cancel if it's going off-track.
7. As an API designer, I want the canvas to update automatically as each entity is created/modified/deleted, so that I see the results immediately without refreshing.
8. As an API designer, I want a "Cancel" button to abort the agent mid-execution, so that I can stop unwanted changes.
9. As an API designer, I want existing entities in the design to be passed as context to the agent, so that the agent understands what already exists and avoids duplicates.
10. As an API designer, I want partial work preserved if a step fails (e.g. 3 of 4 resources created), so that I don't lose progress.

## Implementation Decisions

### Provider & Model

- **OpenRouter** as the AI provider, using the `@openrouter/ai-sdk-provider` package (`createOpenRouter`).
- Model: `tencent/hy3-preview` (hardcoded — NOT configurable from env)
- API key: `OPENROUTER_API_KEY` in env only
- Headers: `Authorization: Bearer ${OPENROUTER_API_KEY}`, `HTTP-Referer`, `X-Title` set to help OpenRouter usage tracking
- No other AI provider or model configuration — this is the only path.

### Agent Loop

- Uses `streamText()` from the `ai` package with `maxSteps: 25`.
- Agent receives the full API Design context (all resources, endpoints, schemas, auth schemes) in the system prompt.
- The system prompt instructs the agent to plan and execute tool calls to fulfill the user request.
- Each step: LLM decides → tool is executed → result fed back → LLM decides next step → continues until done.
- The stream is converted to oRPC Event Iterator via `streamToEventIterator(result.toUIMessageStream())`.

### Tools (12 tools, fine-grained CRUD)

Tools use the `tool()` helper from the `ai` SDK, wrapping domain service calls directly:

| Tool               | Input                                                                           | Returns                                       |
| ------------------ | ------------------------------------------------------------------------------- | --------------------------------------------- |
| `createResource`   | name, description?, positionX?, positionY?                                      | `{ id, name, summary }`                       |
| `updateResource`   | id, name?, description?                                                         | `{ success, name, summary }`                  |
| `deleteResource`   | id                                                                              | `{ success, name, summary }`                  |
| `createEndpoint`   | resourceId, method, path, summary, requestBody?, responseShape?, authSchemeIds? | `{ id, method, path, resourceName, summary }` |
| `updateEndpoint`   | id, method?, path?, summary?, requestBody?, responseShape?, authSchemeIds?      | `{ success, label, summary }`                 |
| `deleteEndpoint`   | id                                                                              | `{ success, label, summary }`                 |
| `createSchema`     | name, description?, jsonSchema                                                  | `{ id, name, summary }`                       |
| `updateSchema`     | id, name?, description?, jsonSchema?                                            | `{ success, name, summary }`                  |
| `deleteSchema`     | id                                                                              | `{ success, name, summary }`                  |
| `createAuthScheme` | name, type, config                                                              | `{ id, name, type, summary }`                 |
| `updateAuthScheme` | id, name?, type?, config?                                                       | `{ success, name, summary }`                  |
| `deleteAuthScheme` | id                                                                              | `{ success, name, summary }`                  |

Each tool:

- Runs in the auth context of the requesting user (uses `protectedProcedure` middleware).
- Gets `workspaceId` from the oRPC context.
- Calls the existing domain service (e.g. `resourceService.createResource`, `endpointService.createEndpoint`).
- Returns a `summary` string (e.g. `Created resource "Users"`) used by the UI for human-friendly display.
- Delete tools fetch the entity name from the DB before deleting to include in the summary.

### Streaming Protocol

- **oRPC Event Iterator (SSE)** — NOT a separate Route Handler.
- The agent procedure uses `os.handler(async function* (...))` generator pattern via the service returning the iterator directly, handled by oRPC's built-in event iterator support.
- Server: `streamText()` result is converted via `streamToEventIterator(result.toUIMessageStream())` from `@orpc/server`.
- **Client**: Raw `for await...of` loop over the oRPC event iterator, dispatching by chunk type (`text-delta`, `reasoning-delta`, `tool-input-available`, `tool-output-available`, `tool-output-error`). No `useChat` hook.
- This keeps the streaming inside the existing oRPC infrastructure, with full type safety.

### Error Handling

- **Keep partial work** — no DB transaction wrapping the agent run.
- If a tool call fails, the error message is returned as the tool result. The agent can decide to retry, skip, or stop.
- A global step limit (`maxSteps: 25`) prevents runaway agents.
- Client-side "Cancel" button calls `abortSignal()` to disconnect the stream, stopping the agent mid-flight.

### UI Design

The `AiPanel` is rewritten:

1. **Prompt input** — textarea (same as current), with keyboard shortcut
2. **Generate button** — triggers the agent
3. **Streaming log** — replaces the suggestion cards list. Shows:
   - Agent reasoning text (streaming tokens, monospace, subtle color)
   - Tool call cards (human-friendly label during running, summary on completion, error inline)
   - Error alerts inline
4. **Canvas updates** — after each tool call resolves, invalidate and refetch the relevant query so the canvas reflects the new state in real-time
5. **Cancel button** — visible during agent execution
6. **Close on completion** — dialog remains open so user can review the log, or close manually

### Module Structure Changes

**New/Modified files:**

| File                                                | Change                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/modules/ai/service.ts`                         | Replace `suggestApiDesign` with `agent` function using `streamText()` + tools            |
| `src/modules/ai/schemas.ts`                         | Remove `suggestionSchema` — no longer needed                                             |
| `src/modules/ai/tools.ts`                           | **New** — tool definitions using `tool()` from `ai`, wrapping domain services directly   |
| `src/modules/ai/orpc.ts`                            | Replace `suggest`/`accept`/`acceptSchema` with single `agent` procedure (Event Iterator) |
| `src/modules/ai/index.ts`                           | Update exports                                                                           |
| `src/modules/api-design-editor/panels/ai-panel.tsx` | Rewrite to streaming agent UI with raw event iterator (`for await...of`)                 |
| `src/modules/orpc/router.ts`                        | Update `aiRouter` reference (unchanged structure)                                        |

**Dependencies to add:**

- `@orpc/server` — for `streamToEventIterator`
- `@openrouter/ai-sdk-provider` — for `createOpenRouter` (OpenRouter)

## Testing Decisions

- Test that the agent procedure accepts an event iterator response (SSE stream).
- Test that each tool (create/update/delete resource, endpoint, schema, authScheme) executes correctly when called by the agent.
- Test that the agent uses the provided design context (doesn't hallucinate existing resources).
- Test error handling: tool failure returns error to LLM, agent continues.
- Test partial work preservation: if one tool fails, previous tools' effects remain.
- Test cancellation: abort signal stops the agent mid-execution.
- Prior art: existing ORPC CRUD procedures already have tests in their respective modules. The new tests should follow the same patterns (mock DB, invoke procedure, assert state).

## Out of Scope

- Multi-model/provider support (only OpenRouter + hy3-preview)
- Chat history / conversation memory across agent runs
- Autonomous background agents (always triggered by user action)
- Agent-generated test scripts or deployment configs
- Image/vision input in prompts
- Streaming UI canvas node animations (nodes appear, they don't animate in)

## Further Notes

- The old accept/reject-per-suggestion UX is removed. The agent directly mutates the design. Users who want to review changes before committing can use Git/history — the PRD scope does not include an undo system.
- Tools use the standard `tool()` function from `ai` directly, wrapping service calls by hand. The `@orpc/ai-sdk` `createTool` helper was considered but not used.
- The model is hardcoded intentionally — change the source code to swap models.
- The old `suggestionSchema` Zod schema and `acceptSuggestion`/`acceptSchemaSuggestion` functions are removed entirely.
