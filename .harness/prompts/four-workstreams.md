# Four Workstreams Prompt

Use this when the user has four active tasks and wants Codex to distribute them:

```text
Codex, act as Lead Agent under `AGENTS.md`.

Read `PROJECT_BRIEF.md`, `HARNESS.md`, and `.harness/state/*`.
I have four workstreams. First classify dependencies and conflict risk.
Then use subagents for the independent parts:

- Planner: decide order, dependency, and ownership.
- Explorer: inspect relevant code paths for each workstream.
- Implementer: implement only assigned files/modules.
- Reviewer: review each finished diff.
- Tester: run targeted verification.
- UX Reviewer: use only for user-facing UI work.
- Scribe: update harness state and next work.

Do not ask me to mediate routine handoffs.
Ask me only for checkpoints listed in `AGENTS.md`.

Workstream 1:

Workstream 2:

Workstream 3:

Workstream 4:
```
