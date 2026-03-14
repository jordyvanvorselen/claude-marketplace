---
description: Clarify assumptions and solidify understanding through structured questioning
allowed-tools: AskUserQuestion
---

# /interview - Clarifying Interview

Interview the user to resolve assumptions, uncover edge cases, and build a complete understanding of the current context or task before proceeding.

**Context**: $ARGUMENTS

---

Use **AskUserQuestion** to ask one focused question at a time. Never bundle multiple questions into one turn.

Work through these layers until you have no remaining unknowns:

1. **Scope and intent** — What exactly needs to happen? What does success look like?
2. **Assumptions** — What are you taking for granted that hasn't been stated explicitly?
3. **Constraints** — What limitations, requirements, or non-negotiables apply?
4. **Edge cases** — What boundary conditions, failure scenarios, or exceptional situations matter?
5. **Open questions** — What is genuinely unclear or could significantly change the approach?

Follow up on vague or surprising answers before moving to the next area. Keep asking until you have a complete, unambiguous picture.

When done, summarize your understanding back to the user before proceeding.
