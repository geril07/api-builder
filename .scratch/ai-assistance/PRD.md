Status: done

# PRD: AI Assistance

## Problem Statement

Developers designing REST APIs spend significant time on repetitive patterns (auth headers, pagination, error envelopes, CRUD endpoints). They want AI help that speeds up this work without taking away their control over the final API design.

## Solution

Context-aware AI suggestions that appear in flow during API design work — suggesting resources, endpoints, and common patterns. All suggestions remain provisional until the user explicitly accepts them. AI reinforces the canvas-first workflow rather than replacing it.

## User Stories

1. As an API designer, I want to describe an API goal and receive suggested Resources, so that I can speed up initial design scaffolding.
2. As an API designer, I want to receive suggested Endpoints for a Resource based on its context, so that I don't have to define every CRUD operation manually.
3. As an API designer, I want AI to suggest auth patterns (bearer token, API key), pagination shapes, and error response envelopes, so that I follow consistent conventions.
4. As an API designer, I want all AI suggestions to appear as provisional items (translucent/dashed), so that I can review them before they affect my design.
5. As an API designer, I want to accept individual suggestions, so that only the changes I approve get applied.
6. As an API designer, I want to reject suggestions I don't need, so that rejected ideas don't clutter my API Design.
7. As an API designer, I want AI interaction points to appear close to the Resource or Endpoint they affect, so that I stay oriented in my canvas workflow.

## Implementation Decisions

- AI suggestions are triggered from user context (selected Resource, open Endpoint, or explicit prompt).
- Suggestions cover three categories: Resources, Endpoints, and API patterns (auth, pagination, errors).
- All suggestions use a provisional state with distinct visual treatment before acceptance.
- Accepted suggestions become real Resources/Endpoints in the API Design.
- Rejected suggestions are discarded without side effects.
- AI interaction is inlaid into the existing canvas editor, not a separate chat panel.
- AI must not auto-apply any changes — user confirmation is required for every mutation.

## Testing Decisions

- Test suggestion request flow: user triggers AI from context, receives provisional suggestions.
- Test provisional rendering: suggestions appear with visual treatment distinct from committed Resources/Endpoints.
- Test accept flow: accepting a suggestion creates a real Resource or Endpoint in the API Design.
- Test reject flow: rejecting a suggestion does not modify the API Design.
- Test that no suggestion is auto-applied without user action.
- Tests should exercise end-to-end behavior (AI request → provisional render → accept/reject → API Design state).

## Out of Scope

- One-shot "prompt to full spec" generation.
- Automatic application of suggestions without user review.
- Autonomous schema rewrites or API design overhauls.
- Full review/approval automation.
- General-purpose coding assistant (AI is scoped to API design work only).
- AI-driven export or deployment.

## Further Notes

- AI should reinforce the canvas-first modeling workflow, not become the primary interaction surface.
- Copy around AI features should emphasize user control: "Review this suggestion before applying."
- The provisional visual treatment (translucent/dashed) must be clearly distinguishable from committed designs.
