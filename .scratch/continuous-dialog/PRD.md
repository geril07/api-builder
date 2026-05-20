Status: ready-for-agent

# PRD: Continuous Dialog with AI Agent

## Problem Statement

The current AI agent dialog supports only a single prompt-response turn. Each invocation resets the entire UI state: the input disappears on completion, the response text and tool cards are shown as a one-shot log, and the dialog must be closed and reopened for a new prompt. There is no conversation — the agent cannot reference prior context, and the user cannot ask follow-ups like "now add auth to that" or "make the endpoint path plural".

Users want to iterate with the agent naturally: describe what they want, see the agent act, then refine with additional prompts — all within a single dialog session, with the full conversation visible.

## Solution

Replace the single-turn flow with a continuous chat-style dialog. The agent sends and receives a message history on each turn, so it can reference prior commands and results. The input area stays visible at all times. Each turn appends to a scrollable message list showing user prompts and agent responses (text + tool call cards). On dialog close, the conversation resets.

## User Stories

1. As an API designer, I want to send a follow-up prompt after the agent completes, so that I can refine the design iteratively without closing and reopening the dialog.
2. As an API designer, I want the full conversation history visible in the dialog, so that I can scroll back and see what the agent did in previous turns.
3. As an API designer, I want the input area to remain visible after the agent finishes, so that I can immediately type the next prompt.
4. As an API designer, I want the agent to receive prior conversation context, so that follow-ups like "add bearer auth to that" work without re-explaining.
5. As an API designer, I want the canvas to reflect changes from each turn, so that I can see intermediate results and build on them.
6. As an API designer, I want to cancel a running agent and have the input return to idle state, so that I can re-prompt without a garbled partial message in history.
7. As an API designer, I want to retry or edit my last prompt when the agent errors, so that I can fix typos or rephrase without losing the conversation context.
8. As an API designer, I want the conversation to reset when I close the dialog, so that a fresh session starts next time.
9. As an API designer, I want to see the agent's reasoning text and tool call cards from all previous turns, so that I can review what happened in each step.

## Implementation Decisions

### Client State Model

Replace the flat `assistantText` + `toolCalls` pair with an accumulated message list:

- **`messages`**: `Array<{ role: 'user' | 'assistant', content: string, toolCalls: ToolCallEntry[] }>` — finalized turns, each assistant message carries its completed tool call cards.
- **`draftContent`**: `string` — streaming text for the current in-progress assistant response.
- **`draftToolCalls`**: `ToolCallEntry[]` — streaming tool call entries for the current turn.
- **`status`**: `'idle' | 'streaming' | 'error'` (no `'done'` state — after streaming ends, status returns to `'idle'`).

On submit: append `{ role: 'user', content: prompt }` to messages, clear draft, set streaming.
On stream end: append `{ role: 'assistant', content: draftContent, toolCalls: draftToolCalls }` to messages, clear draft, set idle.
On cancel: abort stream, discard draft, set idle.
On error: set error status, bring the failed user prompt back to the input field, allow retry or edit.

### Server Message Contract

The oRPC procedure input changes from `{ apiDesignId, userPrompt }` to `{ apiDesignId, messages }` where `messages` is `Array<{ role: 'user' | 'assistant', content: string }>`. The server passes `messages` to `streamText({ system, messages, tools })` instead of `streamText({ system, prompt: userPrompt, tools })`.

The system prompt with fresh design context is built on every turn, reflecting changes made by previous turns' tool calls.

### UI Layout

- Input area is always visible at the bottom, regardless of status.
- Message list renders above the input, scrollable, with user prompts and assistant responses interleaved.
- Each assistant response shows reasoning text (if any) followed by tool call cards.
- On error, the user prompt that caused the error stays in the message list. The input is pre-filled with that prompt.
- On dialog close (`onOpenChangeComplete`), all state resets.

### Cancel Behavior

Aborting mid-stream discards the partial draft entirely. Completed tool calls remain on the canvas. The user can type a new prompt.

### Error Recovery

When a stream error occurs, the last user prompt is brought back to the input field. A "Retry" action resubmits it as-is. The user can also edit the input before retrying.

## Testing Decisions

- Tests should verify that the client correctly accumulates messages across turns and clears drafts appropriately.
- Tests should verify that the server correctly passes messages to `streamText` and that the design context is fresh on each turn.
- Prior art: existing `ai-panel.tsx` tests (if any) or the behavior-driven patterns used in the existing agent tests.

## Out of Scope

- Persisting conversation history across dialog opens (resets on close).
- In-place editing of past user messages (only the failed turn is brought back to input).
- Tool call history sent to the LLM — the fresh design context on each turn is sufficient.
- Undo/rollback of previous turns' tool effects.
- Streaming canvas node animations during tool execution.

## Further Notes

- The `useChat` hook from `@ai-sdk/react` is NOT used. The client uses a raw `for await...of` loop over the oRPC event iterator, dispatching chunks by type — the same pattern as the current implementation.
- The tool return `summary` field (implemented in the previous iteration) continues to serve as the human-friendly display text for completed tool call cards.
