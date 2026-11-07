---
name: justea-communication
description: How the user wants to work with Justea agents — via the orchestrator session in desktop
metadata:
  node_type: memory
  type: feedback
  originSessionId: e7996e5e-5999-425b-bf90-c63ec8210d05
  modified: 2026-11-06T19:26:21.109Z
---

User talks to the Justea orchestrator session in Claude Desktop; the orchestrator itself messages the background agents (justea-*) and relays. User occasionally opens agents in the terminal (`claude agents`).

**Why:** user stated 2026-11-06 that the hub model is the target workflow.
**How to apply:** route agent questions to the user through the orchestrator, batch them; state of decisions lives in justea-web/docs/agents/ORCHESTRATOR.md.
