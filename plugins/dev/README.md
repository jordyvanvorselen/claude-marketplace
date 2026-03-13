# software-engineering

A Claude Code plugin for a structured software engineering workflow: from problem analysis through user stories, acceptance tests, implementation, and test quality review.

## Development Pipeline

```
/analyze <problem>
    → .analyses/<slug>.md

/stories .analyses/<slug>.md
    → beans (epic + user stories with acceptance criteria)

/atdd [bean-id]
    → failing Playwright acceptance tests

/feature-dev:feature-dev /clean-code <story>
    → clean, tested implementation, but UI is often simplified

/pixel-perfect [stitch screen id]
    → cleaned up frontend implementation, as pixel perfect as possible following the design within your design system

# Optional when needed

/user-facing-selectors [path]
    → user-facing selectors, orphaned data-testid cleanup

/refactor <path>
    → refactored code using the 66-technique catalog

/test-review [directory]
    → Farley Index report (0-10)
```

## Components

### Commands (7)

| Command | Description |
|---|---|
| `/dev:analyze <problem>` | Deep problem analysis — stakeholders, requirements, constraints, risks. Outputs `.analyses/<slug>.md`. |
| `/dev:stories <analysis-path>` | Decomposes an analysis into INVEST-compliant user stories tracked as beans (epic + features). |
| `/dev:atdd [bean-id]` | Writes failing Playwright acceptance tests for a bean story. |
| `/dev:pixelperfect <stitch-id>` | Fetches a Stitch design and implements it pixel-perfectly in the current codebase. |
| `/dev:user-facing-selectors [path]` | Refactors Playwright tests to use user-facing selectors (getByRole, getByText, getByLabel, etc.) and cleans up orphaned data-testid attributes. |
| `/dev:refactor <path>` | Identifies code smells and applies the 66-technique Fowler refactoring catalog. |
| `/dev:test-review [directory]` | Spawns the test-design-reviewer agent to evaluate test quality and produce a Farley Index report. |

### Skills (5)

| Skill | Trigger |
|---|---|
| `clean-code` | "write clean code", "apply SOLID principles", "apply GRASP patterns", "improve code quality" |
| `refactoring-techniques` | Loaded by the /refactor command — complete 66-technique catalog with smell mappings, sequencing, risk, and complexity |
| `playwright-selectors` | Loaded by the /user-facing-selectors command — locator priority ladder, disambiguation strategies, constraints, and examples |
| `farley-properties-and-scoring` | Loaded by the test-design-reviewer agent — scoring rubrics and Farley Index formula |
| `signal-detection-patterns` | Loaded by the test-design-reviewer agent — static detection heuristics per language |

### Agents (1)

| Agent | Description |
|---|---|
| `test-design-reviewer` | Evaluates test code quality using Dave Farley's 8 Properties of Good Tests. Two-phase scoring: static signal detection (60%) + LLM assessment (40%). Outputs a Farley Index (0-10) with per-property breakdown, tautology theatre analysis, worst offenders, and recommendations. |

## Prerequisites

| Tool | Required by |
|---|---|
| [beans CLI](https://github.com/hmans/beans) | `/stories`, `/atdd` |
| [Playwright](https://playwright.dev) | `/atdd` |
| [Stitch MCP](https://stitch.design) | `/pixelperfect` |
| Python 3 | `/test-review` (scoring calculator) |

## Usage Examples

```bash
# Analyze a new problem domain
/dev:analyze "We need a student directory dashboard for administrators"

# Decompose the analysis into user stories
/dev:stories .analyses/student-directory-dashboard.md

# Write acceptance tests for a specific story
/dev:atdd cd2l

# Write the code using the excellent official Anthropic plugin in combination with clean code best practices
/feature-dev:feature-dev /clean-code cd2l

# Implement pixel-perfect from a Stitch design
/dev:pixelperfect e52a2467

# Refactor tests to user-facing selectors
/dev:user-facing-selectors integration-tests/login.spec.ts

# Refactor a file or directory
/dev:refactor src/services/

# Review test design quality
/dev:test-review src/test/java/

# Ask Claude to apply clean code principles (triggers skill automatically)
"Write clean code for the UserRepository class"
```

## Acknowledgements

Big thanks to [@andlaf-ak](https://github.com/andlaf-ak) — a large portion of this plugin is based on their excellent work at [andlaf-ak/claude-code-agents](https://github.com/andlaf-ak/claude-code-agents).

## Farley Index Rating Scale

| Score | Rating |
|---|---|
| 9.0 - 10.0 | Exemplary |
| 7.5 - 8.9 | Excellent |
| 6.0 - 7.4 | Good |
| 4.5 - 5.9 | Fair |
| 3.0 - 4.4 | Poor |
| 0.0 - 2.9 | Critical |
