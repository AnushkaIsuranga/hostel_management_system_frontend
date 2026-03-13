# Unit Testing Guide for This Project

This guide explains how unit tests work in this repository, how to write new tests, and how to understand coverage output.

## 1) What unit tests are

A unit test checks one small piece of behavior at a time.

Examples:
- A button click calls a function.
- A form with invalid input shows an error.
- A component renders different UI when data is missing.

In this project, unit tests are in:
- tests/unit/

They use:
- Jest (test runner)
- React Testing Library (render and user interactions)

## 2) Basic test file structure

Most test files follow this shape:

```ts
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MyComponent from '../../path/to/MyComponent'

describe('MyComponent', () => {
  beforeEach(() => {
    // reset mocks, setup defaults
  })

  it('does something expected', async () => {
    render(<MyComponent />)

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument()
    })
  })
})
```

Meaning:
- describe(...): groups related tests.
- it(...): one test case.
- render(...): mounts component in test DOM.
- screen.getBy...: find elements.
- fireEvent...: simulate user action.
- expect(...): assertion.
- waitFor(...): wait for async UI updates.

## 3) Arrange, Act, Assert pattern

Every test is easier if you write it in 3 phases.

1. Arrange
- Setup mocks and test data.
- Render component.

2. Act
- Perform user interactions.

3. Assert
- Check expected result.

Example:

```ts
it('shows validation when URL is missing', async () => {
  render(<OwnerSettingsPage />) // Arrange

  fireEvent.click(screen.getByRole('button', { name: 'Submit hostel' })) // Act

  await waitFor(() => {
    expect(screen.getByText('Google Maps URL is required.')).toBeInTheDocument() // Assert
  })
})
```

## 4) Common query methods (how to find elements)

Use accessible queries first.

- getByRole: best for buttons, links, inputs, headings.
- getByLabelText: best for form fields with labels.
- getByText: for visible text.
- queryBy...: like getBy..., but returns null instead of throwing.
- getAllBy...: when multiple matches are expected.

Tips:
- Prefer getByRole(..., { name: '...' }) for stable tests.
- If there are multiple matches, use getAllBy... and assert length.

## 5) Mocking in this repository

Many pages call APIs or Next.js hooks. Tests replace those with mocks.

Common mocks in this repo:
- next/navigation (router, params, pathname)
- next/link and next/image
- API modules in lib/backendApi
- auth helpers in lib/auth

Reusable helpers already created:
- tests/unit/helpers/mockData.ts
- tests/unit/helpers/nextMocks.tsx
- tests/unit/helpers/navigationMocks.ts
- tests/unit/helpers/timerHelpers.ts

Use helpers to reduce duplication and keep tests consistent.

## 6) How to read coverage output

When you run:

- npm run coverage

Jest/Istanbul prints metrics:

### Statements
Percentage of executable statements that ran.

Think of this as: "How many code lines with logic were executed?"

### Branches
Percentage of decision paths that ran.

Examples of branches:
- if / else
- switch cases
- ternary condition ? a : b
- fallback logic like value || default

Important: high statement coverage can still hide low branch coverage if only happy paths are tested.

### Functions
Percentage of functions that were called at least once.

If a helper function is never used in tests, this number drops.

### Lines
Percentage of source lines executed.

Usually close to statements, but not always identical.

## 7) Why branch coverage is usually lower

Example:

```ts
if (!token) {
  setError('Login required')
  return
}

await saveData()
```

You need 2 tests for full branch coverage:
- no token -> error branch
- has token -> save branch

If you only test "has token", statements may look good but branch coverage is incomplete.

## 8) Practical test-case checklist

When adding tests for a page/component, try this checklist:

- Renders normally (basic smoke test)
- Loading state
- Empty state
- Success state
- Error state
- Validation errors
- Permission/auth variants (guest vs logged-in)
- Important user actions (create/edit/delete/submit)
- One negative path for each key if/else

You do not need to test every pixel or CSS class.
Focus on behavior and user-visible outcomes.

## 9) Fast workflow for writing a new test

1. Open component/page and list main branches.
2. Start with one happy-path test.
3. Add one failure/validation test.
4. Add one auth/permission variant if relevant.
5. Reuse fixtures from tests/unit/helpers/mockData.ts.
6. Run only that file first:
   - npm test -- --runInBand tests/unit/YourFile.test.tsx
7. Run full coverage when done:
   - npm run coverage

## 10) Common mistakes (and fixes)

Mistake: brittle selectors using random class names.
Fix: use role/label/text queries.

Mistake: tests fail due to async rendering.
Fix: wrap assertions in waitFor.

Mistake: flaky timers.
Fix: use tests/unit/helpers/timerHelpers.ts.

Mistake: repeated fixture objects everywhere.
Fix: use helper factories in tests/unit/helpers/mockData.ts.

Mistake: only testing success path.
Fix: add error and else-path tests to improve branch coverage.

## 11) Recommended next learning step

Pick one existing suite and map each test to a branch in the component.

Good files to study:
- tests/unit/Navigation.test.tsx
- tests/unit/AdminHostelsPage.test.tsx
- tests/unit/OwnerSettingsPage.test.tsx
- tests/unit/StudentSettingsPage.test.tsx

If you want, I can also create a second document with a "test template" you can copy for new components.
