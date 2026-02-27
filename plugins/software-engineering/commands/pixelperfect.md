---
description: Fetch a Stitch design and implement it pixel-perfectly
argument-hint: <stitch-screen-id>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# /pixelperfect - Implement a Stitch Design Pixel-Perfectly

Fetch a Stitch screen design and implement it pixel-perfectly in the current codebase, adapting it to the existing design system with minimal deviation.

**Input**: `$ARGUMENTS` is the Stitch screen ID (short or full form, e.g. `e52a2467`)

---

You are a pixel-perfect UI implementer. Your job is to close the gap between a Stitch design and the current implementation — faithfully, systematically, and without inventing anything.

## Step 1: Fetch the design

Use `mcp__stitch__get_screen` with the screen ID from `$ARGUMENTS` to download the HTML/Tailwind source.

- If `$ARGUMENTS` is empty, ask: _"Which Stitch screen ID should I implement? Check the Screen ID Mapping table in CLAUDE.md."_
- Use the **Screen ID Mapping** table in CLAUDE.md to verify you have the right screen. If the short ID maps to a known screen, confirm it in your output. If the content doesn't match what the table says, update the table in CLAUDE.md.
- The Stitch MCP does NOT support renaming screens — the `title` field is internal and unreliable. Always verify content by reading the HTML.

## Step 2: Identify what needs to change

Read the currently implemented components/pages for this feature (infer from git branch context, or ask if unclear). Compare them against the Stitch HTML side-by-side, noting differences in:

- Layout (flex/grid structure, nesting, alignment)
- Spacing (padding, gap, margin — exact Tailwind classes)
- Typography (size, weight, color, line-height, truncation)
- Colors (background, border, text — map to existing design tokens where possible)
- Component shapes (border-radius, shadow, border style/width)
- Interactive states (hover, focus, disabled)
- Avatar/image treatment
- Badge/chip appearance
- Icon usage (see Icon Rule below)

Produce a **gap list** — a concise bullet list of every visual difference found.

## Step 3: Design system gap analysis

The design system lives in `app/components/ui/`. Before implementing, check every gap in the list against what already exists. There are three cases to handle:

**Case A — No equivalent exists at all** (new color token, new utility, missing component):
> "The Stitch design uses [X], which isn't in our design system at all. Should I add it, or use [closest existing alternative]?"

**Case B — A close match exists but differs slightly** (e.g. a Card variant that's almost right but has different padding or shadow; a Badge color that's close but not exact):
> "The Stitch design uses a [component/value] that's similar to our existing [X] but differs in [Y]. Should I: (1) add a new variant, (2) update the existing one, or (3) use the existing one as-is and skip this difference?"

**Case C — An exact match exists:** Use it silently, no need to ask.

Wait for confirmation on A and B before implementing. Do not silently approximate.

**One silent exception — icon substitution:** Replace every Material Symbols icon in the Stitch HTML with the equivalent `lucide:*` icon (project convention uses `<Icon name="lucide:..." />`). No need to ask.

## Step 4: Implement

With all design gaps resolved (either confirmed additions, updates, or approved substitutions):

1. Edit the relevant `.vue` files to match the Stitch design exactly:
   - Use `app/components/ui/` primitives (Card, Badge, Button, etc.) wherever the design uses a matching pattern
   - Apply Tailwind classes that precisely match the Stitch spacing, color, and typography
   - Keep all `data-testid` attributes intact — do not remove or rename them
   - Keep all functional logic, props, emits, and reactive state intact — only change visual markup and classes

2. If the Stitch design requires a new design system token or component variant (confirmed in Step 3), add it to the appropriate file first (`main.css` for `@utility` / `@theme`, or the relevant `ui/` component), then use it.

3. Run `bun run typecheck && bun run test:unit` to confirm nothing is broken.

4. Note to the user: if visual regression tests exist for this page, they need to be regenerated with `bun run test:visual-regression:fix` (runs in Docker for consistency).

## Rules summary

| Rule | Behaviour |
|---|---|
| Always fetch Stitch first | Use `mcp__stitch__get_screen` before writing a single line |
| Data-testids | Never remove or rename — tests depend on them |
| Logic/behaviour | Never change — only visual markup |
| Design system gaps (new) | Ask before adding |
| Design system gaps (close match) | Ask: new variant, update existing, or use existing as-is? |
| Icons | Silently swap Material Symbols → `lucide:*` |
| Visual regression snapshots | Remind user to run `bun run test:visual-regression:fix` after implementation |
