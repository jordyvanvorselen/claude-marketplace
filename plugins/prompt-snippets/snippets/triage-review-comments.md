---
name: Triage review comments
description: Judge each open review comment, its impact and fix size. No changes
placement: append
order: 45
---
Triage every unresolved review comment on the PR(s) named above. Include inline comments, review bodies and bot comments. Skip resolved and outdated threads, but list how many you skipped.

For each comment, check the claim against the actual code on the PR branch. Do not trust the reviewer or your memory. Then report:

1. **Valid?** Yes, partly, or no. Give the evidence as `file:line` or a short quote. If you cannot verify it, say so.
2. **Impact if we ignore it.** What breaks, for whom, and how likely. Rate it: blocker, should fix, nice to have, or none.
3. **Fix.** The best approach in one or two sentences, and an estimate of changed lines (including tests). Name a cheaper alternative if one exists.

Group the report per PR and link each comment. End with one table across all PRs: comment, valid, severity, lines, recommendation (fix now, follow-up ticket, or reply and resolve). Do not change code, commit, or reply on GitHub.
