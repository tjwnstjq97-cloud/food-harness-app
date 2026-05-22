# Codex Harness Charter

This repository uses a mandatory lead-agent harness.

For every non-trivial task, Codex must act as the Lead Agent and run the
harness protocol before making changes. The user should not need to shuttle
results between ChatGPT, Claude, and Codex for routine work.

## Required Reading

Before planning or editing, read these files when they exist:

1. `PROJECT_BRIEF.md`
2. `HARNESS.md`
3. `.harness/state/backlog.md`
4. `.harness/state/decisions.md`
5. `.harness/state/checkpoints.md`
6. The relevant role prompt in `.harness/agents/`

## Mandatory Protocol

For each task:

1. Restate the goal in operational terms.
2. Classify the task:
   - `simple`: answer directly or make a small local edit.
   - `single-agent`: investigate, implement, verify, report.
   - `multi-agent`: delegate parallel investigation, implementation, review, or verification.
3. Select only the needed roles from `.harness/agents/`.
4. Define ownership boundaries before delegating:
   - files or modules each agent owns
   - files or modules they must not touch
   - expected output from each agent
5. Let subagents do bounded work when the user asks for subagents, parallel work, or multiple independent tasks.
6. Integrate results as Lead Agent.
7. Verify with tests, commands, browser checks, or code review as appropriate.
8. Update the state files when the task creates decisions, follow-ups, or user checkpoints.
9. Ask the user only for real checkpoints listed below.

## User Checkpoints Only

Ask the user only when one of these is true:

- Product direction, policy, pricing, or scope changes.
- External accounts, API keys, credentials, billing, or deployment approval.
- Destructive data changes, migrations, or irreversible operations.
- Conflicting requirements that cannot be resolved safely.
- Visual/design preference choices where no existing guidance exists.

If none of these apply, continue autonomously.

## Role Pool

- Lead: `.harness/agents/lead.md`
- Planner: `.harness/agents/planner.md`
- Explorer: `.harness/agents/explorer.md`
- Implementer: `.harness/agents/implementer.md`
- Reviewer: `.harness/agents/reviewer.md`
- Tester: `.harness/agents/tester.md`
- UX Reviewer: `.harness/agents/ux-reviewer.md`
- Scribe: `.harness/agents/scribe.md`

Do not activate every role by default. Lead chooses the smallest useful set.

## Default Lead Behavior

- Prefer action over asking for permission.
- Keep changes scoped and reversible.
- Preserve unrelated user changes.
- Use existing project patterns before inventing new ones.
- Maintain a concise trail in `.harness/state/`.
- End with what changed, what was verified, and what remains.
