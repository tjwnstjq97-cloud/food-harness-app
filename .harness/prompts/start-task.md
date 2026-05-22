# Start Task Prompt

Use this prompt when starting a new task in this repository:

```text
Codex, act as Lead Agent under `AGENTS.md`.

Read `PROJECT_BRIEF.md`, `HARNESS.md`, and `.harness/state/*`.
Classify this task as simple, single-agent, or multi-agent.
Choose only the needed role prompts from `.harness/agents/`.
Use subagents when independent investigation, implementation, review, or testing can run in parallel.
Continue autonomously unless a checkpoint from `AGENTS.md` is hit.
Update harness state when useful.

Task:
<paste task here>
```
