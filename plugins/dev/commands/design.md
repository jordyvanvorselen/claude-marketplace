---
description: Orchestrate the full screen-design pipeline in Pencil — wireframes, UX copy, design direction, hi-fi, critique, hardening, handoff — spawning a Fable subagent per phase
argument-hint: [flows/analysis path] [target .pen file]
allowed-tools: Read, Write, Glob, Bash, Agent, AskUserQuestion, ToolSearch
---

# /design - Screen Design Pipeline

Turn analyzed flows and stories into production-grade screen designs in a Pencil (`.pen`) file, by orchestrating the Intent and Impeccable design skills in a fixed order. Run each phase in its own Fable subagent so every phase starts with a clean context and communicates only through files.

**Input**: `$ARGUMENTS` may contain a path to the design inputs (a journeys/flows document or an analysis file) and/or a target `.pen` file path. Defaults, in order of preference: `.intent/journeys.md`, most recent `.analyses/*.md`. Default canvas: the currently open document in the Pen desktop app.

**Pipeline position**: run after `/dev:stories` (stories exist) and before `/dev:atdd` (tests and implementation inherit the finished design).

---

## Prerequisites — verify before phase 1, fail fast

1. **Plugins**: the `intent` and `impeccable` plugins must be installed (their skills are invoked by the phase subagents). If missing, stop and tell the user exactly which plugin to install.
2. **Pencil MCP**: `mcp__pencil__*` tools must be available (load via ToolSearch). If absent, stop and instruct: open the Pen desktop app first, then restart Claude Code.
3. **Canvas identity check (critical)**: Pencil's `execute` silently retargets the currently open document when the requested `filePath` does not resolve — work can land in the wrong file while every call reports success. Before any phase touches the canvas, call `get_app_state`, confirm the active document is the intended target, and have the user open the right file in the Pen app if not. Re-verify at the start of every canvas-touching phase.
4. **Design inputs exist**: at minimum an analysis document. If neither an analysis nor a flows document exists, stop and suggest `/dev:analyze` first.

## Orchestration rules

- Spawn **one subagent per phase** with the Agent tool: `subagent_type: "general-purpose"`, `model: "fable"`, `run_in_background: false`. Phases run **strictly sequentially** — they share one canvas; parallel canvas edits corrupt each other.
- Each subagent prompt must contain: the phase goal, the exact skill to invoke via the Skill tool, the input file paths to read, the output artifacts to produce, and the **canvas preamble** below.
- Subagents return a short summary; the orchestrator relays it to the user between phases. All real output lives in files and the `.pen` canvas, never only in a subagent's reply.
- **Checkpoints**: pause with AskUserQuestion after phase 1 (approve structure before words) and after phase 5 (approve visuals before hardening). All other phases proceed without asking.
- **Bounded loops**: the critique-fix cycle in phase 5 runs at most 2 rounds. If issues remain after round 2, list them for the user and continue — a third round signals misalignment that the user must resolve, not the loop.
- If a phase subagent fails or returns unusable output, retry it once with the failure context appended; on second failure, stop and report.

### Canvas preamble (include verbatim in every canvas-touching subagent prompt)

> Load the Pencil MCP tools via ToolSearch first. Call `get_app_state` with all four flags before any canvas work and verify the active document is `<target>.pen` — abort with a clear message if it is not. Never use Read or Grep on `.pen` files. Set `name` on every node. Verify each screen with a `Get` problems-check after building it; screenshot only completed sections. Do not delete nodes you did not create.
>
> One `.pen` file holds the whole project (components and variables cannot cross files). Name top-level frames by section — `DS / …` for tokens and components, `Screen / <name>` for screens, `States / <screen> — <state>` for non-happy-path variants — and read the canvas with targeted `Get` calls (depth limits, visitors), never a whole-document dump. Componentize repeated UI in `DS / Components` before instancing it in screens.

## Phases

| # | Phase | Skill (in subagent) | Reads | Produces |
|---|-------|--------------------|-------|----------|
| 0 | Flows *(conditional)* | `intent:journey` | analysis, `.intent/context.md` if present | `.intent/journeys.md` (end-to-end flows, interventions, metrics) |
| 1 | Wireframes | `intent:wireframe` | journeys.md, `.intent/context.md` if present | Grayscale screens in `.pen`; `.intent/wireframes.md` (screen inventory + rationale) |
| 2 | UX copy | `intent:articulate` | wireframes.md, flows | `.intent/copy.md`; real copy applied to wireframe screens |
| 3 | Design direction | `impeccable` (teach) | context.md, wireframes.md | `DESIGN.md` (tokens, type, color, motion principles) |
| 4 | Hi-fi | none — Pencil MCP guided by `DESIGN.md` | DESIGN.md, copy.md | Hi-fi screens in `.pen`, one screen at a time |
| 5 | Critique & fix | `impeccable` (critique) | hi-fi screens (screenshots), DESIGN.md | `.intent/critique.md`; fixes applied; ≤2 rounds |
| 6 | Harden states | `intent:fortify` | journeys/flows, hi-fi screens | Non-happy-path variants in `.pen` (empty, error, loading, recovery) |
| 7 | Inclusive pass | `intent:include` | all screens | Contrast/legibility/a11y fixes applied; `.intent/a11y.md` findings log |
| 8 | Extract & handoff | `impeccable` (extract) | finished screens | Reusable components + tokens in `.pen`; PNG exports to `.intent/screens/`; handoff notes appended to DESIGN.md |

**Phase 0 runs only when useful**: skip it when a current flows document already exists (e.g. `.intent/journeys.md` newer than the analysis it derives from). Run it when flows are missing, or when the user passed an analysis file as input. When phase 0 runs in a subagent, instruct it to produce the markdown deliverable only and skip the journey skill's visualization prompt — subagents cannot ask the user questions; screens materialize the flows visually in phase 1 anyway.

Phase ordering encodes cost-of-change: flows (cheapest) → structure → words → direction → pixels → review → states → handoff (expensive). Never let a later phase silently rework an earlier phase's decisions — surface the conflict to the user instead.

## Phase-subagent prompt template

```
You are running phase <N> (<name>) of the /dev:design pipeline.

Goal: <one-sentence phase goal>.
Invoke the `<skill>` skill with the Skill tool and follow it for this phase's methodology.
Read first: <input files>.
<canvas preamble, if the phase touches the canvas>
Produce: <output artifacts with exact paths>.
Constraints: touch only this phase's outputs; do not redesign earlier phases' decisions —
if an earlier decision blocks you, stop and report the conflict instead of overriding it.
Return: a summary under 150 words of what was produced and any conflicts or open issues.
```

## Completion

After phase 8, report to the user: screens produced (with PNG paths), DESIGN.md location, critique score progression, remaining open issues, and the suggested next command (`/dev:atdd`, with implementation later validated against the `.pen` designs).
