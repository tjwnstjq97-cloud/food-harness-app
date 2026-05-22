# Harness Quick Start

This harness is for reducing user handoff work.

## Start A Normal Task

Use `.harness/prompts/start-task.md`.

Minimum user prompt:

```text
Codex, act as Lead Agent under AGENTS.md.
Task: <what needs to happen>
```

## Start Four Workstreams

Use `.harness/prompts/four-workstreams.md`.

The Lead Agent must:

1. classify dependencies and conflicts
2. choose needed role prompts
3. delegate bounded work to subagents when useful
4. integrate and verify
5. ask the user only for real checkpoints

## Maintain Project Memory

Update:

- `PROJECT_BRIEF.md` for durable product context
- `.harness/state/backlog.md` for work discovered later
- `.harness/state/decisions.md` for decisions that should persist
- `.harness/state/checkpoints.md` for true user questions
- `.harness/state/run-log.md` for short run notes

## Rule Of Thumb

If the user would otherwise copy a result into ChatGPT to ask "what next?",
Lead should do that reasoning directly and continue.
