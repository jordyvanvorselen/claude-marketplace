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

You are a Playwright testing expert. Your job is to refactor test selectors from `getByTestId()` to user-facing locators, then clean up orphaned `data-testid` attributes. This is the final quality step after `/atdd` writes acceptance tests and `/feature-dev` implements the feature — now that real UI elements with semantic markup exist, tests should use locators that reflect how users actually interact with the page.

## Locator Priority Ladder

Always prefer the highest-priority locator that uniquely identifies the element. This ladder follows [Playwright's official recommendation](https://playwright.dev/docs/locators#quick-guide) and the Testing Library guiding principle: tests should resemble how users interact with the software.

| Priority | Locator | Use when | Example |
|---|---|---|---|
| 1 (highest) | `getByRole()` | Element has an ARIA role + accessible name | `getByRole('button', { name: 'Submit' })` |
| 2 | `getByText()` | Visible text uniquely identifies the element | `getByText('Welcome back')` |
| 3 | `getByLabel()` | Form field has an associated `<label>` | `getByLabel('Email address')` |
| 4 | `getByPlaceholder()` | Input has a placeholder (no label available) | `getByPlaceholder('Search...')` |
| 5 | `getByAltText()` | Image or area with `alt` text | `getByAltText('Company logo')` |
| 6 | `getByTitle()` | Element has a `title` attribute | `getByTitle('Close dialog')` |
| 7 (lowest) | `getByTestId()` | **Only** when no semantic alternative exists | `getByTestId('complex-canvas')` |

### Disambiguation strategies

When a single locator matches multiple elements, do **not** fall back to `getByTestId()`. Instead:

- **Chain with `.filter()`**: `page.getByRole('listitem').filter({ hasText: 'Product A' })`
- **Scope to a parent**: `page.getByRole('navigation').getByRole('link', { name: 'Home' })`
- **Use `nth()`** as a last resort before testId: `page.getByRole('button', { name: 'Delete' }).nth(0)`
- **Use `exact: true`** to avoid partial matches: `page.getByText('Log in', { exact: true })`

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

## Constraints

- **Preserve bean IDs** in `test.describe` block names — do not rename or remove them
- **Preserve Given/When/Then structure** — only change the locator calls, not the test structure
- **Run tests after each file** — do not batch refactoring across multiple files before testing
- **Document every remaining `getByTestId`** — each must have a comment explaining why no user-facing alternative exists
- **Prefer adding semantic markup over keeping testId** — if the implementation lacks an `aria-label`, `<label>`, or proper role, add it rather than keeping `getByTestId`
- **Treat failing tests as signal** — a test that fails after refactoring may indicate an accessibility problem in the implementation; investigate and fix the root cause

## Before / After Example

### Before (written by `/atdd`, using `getByTestId`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Email/Password Login (dga8)', () => {
  test('Given a registered user, When they submit valid credentials, Then they see the dashboard', async ({ page }) => {
    // Given
    await page.goto('/login');

    // When
    await page.getByTestId('email-input').fill('user@example.com');
    await page.getByTestId('password-input').fill('SecurePass123!');
    await page.getByTestId('login-button').click();

    // Then
    await expect(page.getByTestId('dashboard-heading')).toBeVisible();
    await expect(page.getByTestId('welcome-message')).toContainText('Welcome');
  });

  test('Given a registered user, When they submit wrong password, Then they see an error', async ({ page }) => {
    // Given
    await page.goto('/login');

    // When
    await page.getByTestId('email-input').fill('user@example.com');
    await page.getByTestId('password-input').fill('wrong-password');
    await page.getByTestId('login-button').click();

    // Then
    await expect(page.getByTestId('error-message')).toContainText('Invalid email or password');
  });
});
```

### After (refactored by `/user-facing-selectors`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Email/Password Login (dga8)', () => {
  test('Given a registered user, When they submit valid credentials, Then they see the dashboard', async ({ page }) => {
    // Given
    await page.goto('/login');

    // When
    await page.getByLabel('Email address').fill('user@example.com');
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Then
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('Given a registered user, When they submit wrong password, Then they see an error', async ({ page }) => {
    // Given
    await page.goto('/login');

    // When
    await page.getByLabel('Email address').fill('user@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Then
    await expect(page.getByRole('alert')).toContainText('Invalid email or password');
  });
});
```

**What changed**:
- `getByTestId('email-input')` → `getByLabel('Email address')` — the `<input>` has a `<label>`
- `getByTestId('password-input')` → `getByLabel('Password')` — same pattern
- `getByTestId('login-button')` → `getByRole('button', { name: 'Log in' })` — `<button>` with text
- `getByTestId('dashboard-heading')` → `getByRole('heading', { name: 'Dashboard' })` — `<h1>` with text
- `getByTestId('welcome-message')` → `getByText(/welcome/i)` — visible text, regex for flexibility
- `getByTestId('error-message')` → `getByRole('alert')` — error container has `role="alert"`

**Orphans removed** from implementation code:
- `data-testid="email-input"` from `<input>`
- `data-testid="password-input"` from `<input>`
- `data-testid="login-button"` from `<button>`
- `data-testid="dashboard-heading"` from `<h1>`
- `data-testid="welcome-message"` from `<p>`
- `data-testid="error-message"` from `<div role="alert">`

**Semantic markup added**:
- Added `role="alert"` to the error message container (was a plain `<div>`)
