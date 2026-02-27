---
description: Review test design quality using the Farley Index (0-10)
argument-hint: [directory path]
allowed-tools: Task
---

Use the Task tool to launch the `test-design-reviewer` agent with the following prompt:

```
Review test design quality for: $ARGUMENTS
```

If `$ARGUMENTS` is empty, use the prompt `"Review test design quality"` and the agent will ask for the directory.

The agent produces a Farley Index score (0-10) with a per-property breakdown, signal evidence, worst offenders, and prioritized recommendations.
