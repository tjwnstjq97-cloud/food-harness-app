# Harness Framework

The harness turns a vague request into a controlled agent workflow.

## Operating Model

```text
User
  -> Lead Agent
    -> chooses needed role prompts
    -> delegates bounded work when useful
    -> integrates outputs
    -> verifies
    -> updates state
  -> User only for checkpoints
```

## Task Intake

For each task, Lead records or infers:

- `Goal`: what outcome is needed.
- `Scope`: files, modules, or features involved.
- `Boundaries`: what not to touch.
- `Completion`: how to know the task is done.
- `Verification`: commands or checks to run.
- `Checkpoint`: what, if anything, requires the user.

## Agent Selection

Use this selection guide:

- Planner: unclear scope, multiple possible paths, or 3+ steps.
- Explorer: unfamiliar codebase area or technical uncertainty.
- Implementer: concrete code or content changes.
- Reviewer: meaningful diff, behavior risk, or missing tests.
- Tester: runnable verification, broken tests, or end-to-end flow.
- UX Reviewer: user-facing layout, copy, navigation, interaction, or visual polish.
- Scribe: project state, docs, task summaries, handoffs.

## Autonomy Rule

The Lead must continue without user input unless the task hits a checkpoint in
`AGENTS.md`. If the next step is safe and reversible, do it.

## State Files

- `.harness/state/backlog.md`: queued and discovered tasks.
- `.harness/state/active.md`: current run and task ownership.
- `.harness/state/decisions.md`: durable decisions.
- `.harness/state/checkpoints.md`: questions that truly require the user.
- `.harness/state/run-log.md`: concise chronological run notes.

## Run Output

Each substantial task should leave this shape in the final response:

- `Changed`: what was changed or decided.
- `Verified`: checks run and result.
- `Next`: the next useful task, if any.
- `Checkpoint`: only if user input is required.
