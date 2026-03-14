---
name: interview
description: >
  This skill should be used when the user explicitly asks for an interview or clarification
  session, says "ask me questions about this", "what do you need to know", "let me explain
  the requirements", "let's clarify before we start", "interview me", or "help me think
  through this". Also trigger when the user provides a vague or ambiguous task and asks
  Claude to understand it first before proceeding, or when combined with /analyze before
  implementation tasks where requirements are unclear.
---

Conduct a structured clarifying interview to build a complete, unambiguous picture before proceeding. Your goal is to reach the point where you could explain the user's intent back to them and they'd say "yes, exactly."

## Philosophy

Ask one question at a time. This is non-negotiable. When you bundle multiple questions, the user answers the easiest one and skips the rest — and you lose the ability to ask follow-ups grounded in what you just learned.

Follow up on surprising or vague answers before moving on. A surprising answer usually means you've hit a hidden assumption. That's the most valuable thing to surface.

Ground every question in what you already know. Don't ask "what are the requirements?" — ask "you mentioned users get notified; what triggers the notification?"

## Adaptive depth

Not every situation needs all five layers. Read the context:

- **Bug reports**: focus on reproduction conditions, frequency, and what's already been tried — scope and edge cases matter more than open-ended goals
- **Greenfield features**: all five layers matter; spend most time on scope/intent and constraints
- **Refactors**: focus on what's wrong now, what "done" looks like, and whether behavior is allowed to change
- **Analysis requests**: focus on what decision this analysis will inform and what would change the answer

Start where uncertainty is highest. Skip layers that are already clear from context.

## The five layers (use selectively)

1. **Scope and intent** — What exactly needs to happen? What does success look like? What's explicitly out of scope?
2. **Assumptions** — What are you taking for granted that hasn't been stated? What would break your current mental model if it turned out to be wrong?
3. **Constraints** — What limitations, requirements, or non-negotiables apply? (technical, organizational, time, compatibility)
4. **Edge cases** — What boundary conditions, failure scenarios, or exceptional situations matter for this specific problem?
5. **Open questions** — What is genuinely unclear or could significantly change the approach?

## Question quality

Prefer concrete, answerable questions:
- "What happens when two users submit at the same time?" not "have you considered concurrency?"
- "How slow is slow — are we talking 2 seconds or 20?" not "what are the performance requirements?"
- "What does the current auth module do that the new one shouldn't?" not "what are your goals for the refactor?"

Avoid leading questions. Don't embed your assumptions in the question.

## Exit criteria

Stop when you could summarize the user's intent back to them and they'd confirm it's accurate. Not when you've hit a fixed number of questions — sometimes 3 is enough, sometimes 8 is right.

If an answer closes all remaining unknowns, stop and summarize rather than continuing mechanically.

## Output

End the interview with a structured summary:

**Understanding:** [1-3 sentences describing what needs to happen and why]

**Key constraints:** [bullet list of non-negotiables and boundaries]

**Approach implications:** [what this means for how to proceed — specific enough to inform the next step]

**Open items:** [anything still uncertain that should be revisited — omit if none]

Then ask if the summary is accurate before proceeding.
