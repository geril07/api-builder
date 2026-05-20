Status: done

# 05 - AI Schema Suggestions

## What to build

Extend the AI suggestion pipeline so the LLM can optionally propose reusable Schemas alongside Resources and Endpoints. The Ziggy schema (`suggestionSchema`) gains an optional `schemas` array. The AI panel in the canvas editor presents suggested schemas as provisional items with accept/reject actions, matching the existing pattern for suggested resources and endpoints.

## Acceptance criteria

- [ ] `suggestionSchema` zod schema extended with optional `schemas` array field. Each schema suggestion has `name`, `description` (optional/nullable), and `jsonSchema` (string)
- [ ] AI system prompt updated to describe the Schema concept so the LLM can suggest them
- [ ] AI panel renders provisional schema suggestions (matching the existing translucent/dashed provisional visual treatment)
- [ ] Accepting a provisional schema creates a real Schema in the API Design (via the same mutation used in #01)
- [ ] Rejecting a provisional schema discards it without side effects
- [ ] Suggested schemas appear alongside suggested resources/endpoints in the AI panel, not hidden behind extra clicks

## Blocked by

- #01 - Schema Management
