# Agentic Testing Workflow

This repo treats AI agents as engineering accelerators, not as an unreviewed source of truth.
The governing decision is [ADR-0004](adr/0004-agents-propose-humans-approve.md).

## Playwright Test Agents

Playwright ships three agents: **planner**, **generator** and **healer**. Generate the agent
definitions for your environment (they are regenerated on each Playwright upgrade and are therefore
not committed here):

```bash
npm run agents:claude    # .claude/agents/*
npm run agents:codex
npm run agents:vscode
# also available: --loop=copilot, --loop=opencode
```

### Suggested workflow

1. **Planner** explores the sample app and produces a Markdown test plan.
2. A human reviews scope, risk and test intent.
3. **Generator** converts approved scenarios into Playwright tests.
4. CI runs the deterministic tests.
5. **Healer** may propose repairs for failing tests after UI changes.
6. A human confirms the repair preserves the original intent before merging.

Example planner request:

> Explore the demo checkout flow. Create a concise risk-based test plan covering the happy path,
> API failure handling visible to the user, and accessibility-relevant status feedback.
> Do not change application code.

## Playwright MCP

Start the MCP server for an agent that needs structured browser interaction:

```bash
npm run mcp
```

MCP is useful for exploration and for reproducing a bug interactively. Generated code and proposed
repairs still go through version control, review and CI.

## Guardrails demonstrated by this repo

- Agent output is never merged automatically.
- CI remains deterministic; no agent runs inside CI.
- Stable role-based locators are preferred so the healer has less to heal.
- Contract, API and integration checks stay below the UI layer where appropriate.
- A healer repairs implementation drift; it does not silently change business expectations.
