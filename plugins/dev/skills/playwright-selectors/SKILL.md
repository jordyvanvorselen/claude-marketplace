---
name: playwright-selectors
description: >
  This skill should be used when working with the /user-facing-selectors command or when
  the user asks about Playwright locator strategy, selector priority, user-facing locators,
  getByRole vs getByTestId, disambiguation strategies, "flaky selectors", "brittle tests",
  "data-testid", "accessible selectors", "test locators", "page.locator best practices",
  or needs guidance on refactoring Playwright tests to use accessible, user-facing selectors.
  Also useful when writing new Playwright tests — not only when refactoring existing ones.
---

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

## Constraints

- **Preserve bean IDs** in `test.describe` block names — do not rename or remove them
- **Preserve Given/When/Then structure** — only change the locator calls, not the test structure
- **Run tests after each file** — do not batch refactoring across multiple files before testing
- **Document every remaining `getByTestId`** — each must have a comment explaining why no user-facing alternative exists
- **Prefer adding semantic markup over keeping testId** — if the implementation lacks an `aria-label`, `<label>`, or proper role, add it rather than keeping `getByTestId`
- **Treat failing tests as signal** — a test that fails after refactoring may indicate an accessibility problem in the implementation; investigate and fix the root cause

## Before / After Example

### Before (written by `/dev:atdd`, using `getByTestId`)

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

### After (refactored by `/dev:user-facing-selectors`)

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
