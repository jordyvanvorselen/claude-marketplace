---
description: Refactor Playwright tests to use user-facing selectors and clean up orphaned data-testid attributes
argument-hint: [path]
allowed-tools: Read, Edit, Bash, Glob, Grep
---

# /user-facing-selectors - Refactor to User-Facing Selectors

Refactor Playwright tests from `getByTestId()` to user-facing locators, then clean up orphaned `data-testid` attributes in implementation code.

**Input**: Use `$ARGUMENTS` to determine the scope:
- A path (e.g., `integration-tests/login.spec.ts`): work on that file or directory
- Empty: default to `integration-tests/`

---

You are a Playwright testing expert. Your job is to refactor test selectors from `getByTestId()` to user-facing locators, then clean up orphaned `data-testid` attributes. This is the final quality step after `/dev:atdd` writes acceptance tests and `/feature-dev` implements the feature — now that real UI elements with semantic markup exist, tests should use locators that reflect how users actually interact with the page.

> The locator priority ladder, disambiguation strategies, constraints, and before/after examples are available in the `playwright-selectors` skill.

## Workflow

Follow these steps in order. Do not skip steps or batch multiple files.

### Step 1 — Inventory

Scan the target path for all `getByTestId()` calls.

```
# Find all getByTestId usage in the target tests
```

Use Grep to search for `getByTestId` in the target path. Build a list of:
- File name
- Line number
- The test-id string used (e.g., `'login-button'`, `'email-input'`)

Report the total count to the user before proceeding.

### Step 2 — Inspect

For **each** `getByTestId()` call found in Step 1:

1. Find the corresponding element in the implementation code (search for the `data-testid` value)
2. Read the surrounding markup to determine available semantic attributes:
   - Tag name and implicit ARIA role (e.g., `<button>` → `role="button"`)
   - Visible text content
   - Associated `<label>` elements
   - `placeholder`, `alt`, `title` attributes
   - `aria-label`, `aria-labelledby` attributes
3. Determine the best replacement locator from the priority ladder
4. If the element **lacks** semantic markup entirely, note that you will need to add it in Step 3

Build a replacement plan as a mental map:
```
getByTestId('login-btn') → getByRole('button', { name: 'Log in' })
getByTestId('email-input') → getByLabel('Email address')
getByTestId('error-msg') → getByText('Invalid credentials')
getByTestId('canvas-widget') → KEEP (no semantic alternative, add comment)
```

### Step 3 — Replace

For each test file (one at a time):

1. **Replace selectors**: Swap each `getByTestId()` with the chosen user-facing locator from Step 2
2. **Add semantic markup when needed**: If the implementation code lacks the semantic attributes needed for the replacement locator, add them:
   - Add `aria-label` to interactive elements without visible text
   - Add `<label>` elements to form fields that lack them
   - Add `role` attributes where implicit roles are insufficient
   - Add `alt` text to images missing it
3. **Keep `getByTestId` only when necessary**: If no user-facing locator is possible (e.g., a `<canvas>` element or purely structural container), keep `getByTestId()` and add a comment explaining why:
   ```typescript
   // getByTestId kept: <canvas> has no semantic role or text content
   page.getByTestId('drawing-canvas')
   ```
4. **Handle dynamic content**: For elements with dynamic text, use patterns like:
   - `getByRole('heading', { name: /welcome/i })` — regex for partial match
   - `getByRole('row').filter({ hasText: variableName })` — filter with variable

### Step 4 — Run tests

After modifying **each** test file, run its tests immediately:

```bash
npx playwright test <file-path>
```

- **All pass**: Move to the next file
- **Failures**: Investigate immediately. Common causes:
  - Locator matches multiple elements → add `.filter()` or parent scoping
  - Text doesn't match exactly → use `{ exact: true }` or regex
  - Role name is wrong → check the [ARIA roles reference](https://www.w3.org/TR/wai-aria-1.2/#role_definitions)
  - Element is hidden → the locator may need `{ includeHidden: true }` or the test may need to wait for visibility
  - **Accessibility problem in implementation** → treat this as a real bug, fix the implementation markup

Do **not** proceed to the next file until the current file's tests all pass.

### Step 5 — Clean up orphans

After all test files are refactored and passing:

1. **Collect all remaining `getByTestId()` references** across the entire test suite (not just the target path)
2. **Find all `data-testid` attributes** in implementation code
3. **Remove orphaned `data-testid` attributes** — any `data-testid` in implementation code that is no longer referenced by any test file

Be thorough: search in `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, and any template files. A `data-testid` is orphaned only if **no** test file references its value.

### Step 6 — Final verification

Run the full test suite to confirm everything passes:

```bash
npx playwright test
```

If any test fails, fix it before finishing. Report a summary to the user:

- Total `getByTestId()` calls refactored
- Breakdown by replacement locator type (how many became `getByRole`, `getByText`, etc.)
- Number of `getByTestId()` calls kept (with reasons)
- Number of orphaned `data-testid` attributes removed
- Number of semantic markup additions made to implementation code
- Final test suite status
