# Coding Conventions

**Analysis Date:** 2026-01-15

## Naming Patterns

**Files:**
- kebab-case for all files (`task-form.tsx`, `auth-helpers.ts`, `rate-limit.ts`)
- `*.test.ts` for unit tests alongside source pattern
- `*.spec.ts` for E2E tests
- `index.ts` for barrel exports

**Functions:**
- camelCase for all functions (`getTodayInAmsterdam`, `calculateCurrentStreak`)
- No special prefix for async functions
- `handle*` for event handlers (`handleClick`, `handleSubmit`)

**Variables:**
- camelCase for variables (`colorScheme`, `darkMode`, `scheduledCount`)
- UPPER_SNAKE_CASE for constants (`TIMEZONE`, `DEFAULT_PASSWORD`, `RATE_LIMIT_CONFIG`)
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces, no I prefix (`User`, `Task`, `ApiResponse`)
- PascalCase for type aliases (`TaskFormProps`, `ThemeContextType`)
- PascalCase for enum names, UPPER_CASE for values (`SchedulePreset.ALL_WEEK`)

## Code Style

**Formatting:**
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Unix line endings

**Linting:**
- ESLint with `.eslintrc.json`
- Extends `next/core-web-vitals`
- Run: `npm run lint`

**TypeScript:**
- Strict mode enabled (`tsconfig.json`)
- ES2020 target
- Path alias: `@/*` maps to `src/*`

## Import Organization

**Order:**
1. React imports (`import { useState, useEffect } from 'react'`)
2. External packages (`import { NextRequest } from 'next/server'`)
3. Internal modules (`import { cn } from '@/lib/utils'`)
4. Relative imports (`import { TaskForm } from './task-form'`)
5. Type imports (`import type { Task } from '@/types'`)

**Grouping:**
- Blank line between groups
- Alphabetical within each group (generally)

**Path Aliases:**
- `@/` maps to `src/` (use for all internal imports)

## Error Handling

**Patterns:**
- Throw errors, catch at API route boundaries
- `requireAuth()` throws "Authenticatie vereist" if not authenticated
- Zod validation returns first error message (Dutch)
- Generic catch returns "Er is een fout opgetreden"

**Error Types:**
- Throw on: invalid input, missing auth, database failures
- Return error in ApiResponse: validation errors, business logic failures
- Console.error for debugging (English)

**Example:**
```typescript
try {
  const user = await requireAuth()
  // ... business logic
  return NextResponse.json<ApiResponse>({ success: true, data })
} catch (error) {
  if (error instanceof Error && error.message === 'Authenticatie vereist') {
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message },
      { status: 401 }
    )
  }
  return NextResponse.json<ApiResponse>(
    { success: false, error: 'Er is een fout opgetreden' },
    { status: 500 }
  )
}
```

## Logging

**Framework:**
- Console.log for normal output
- Console.error for errors
- No structured logging library

**Patterns:**
- Log errors before throwing/returning
- English messages for debugging
- No console.log in production paths (except errors)

## Comments

**When to Comment:**
- Explain "why" not "what"
- Document business rules (e.g., streak calculation)
- Explain non-obvious algorithms
- JSDoc for public functions

**JSDoc/TSDoc:**
- Required for public API functions in `src/lib/`
- Use `@param`, `@returns`, `@throws` tags
- Example from `src/lib/schedule.ts`:
```typescript
/**
 * Determine if a task is scheduled for a given date (YYYY-MM-DD)
 *
 * @param schedulePreset - The task's schedule preset
 * @param daysOfWeek - Custom days array (only used for CUSTOM preset). 0=Mon, 6=Sun
 * @param dateString - The date to check (YYYY-MM-DD)
 * @returns true if task is scheduled for this date
 */
```

**Section Headers:**
- Use separator comments for API route sections:
```typescript
// ════════════════════════════════════════════════════════════════════════════
// GET /api/tasks - List all tasks
// ════════════════════════════════════════════════════════════════════════════
```

## Function Design

**Size:**
- Keep under 50 lines
- Extract helpers for complex logic

**Parameters:**
- Max 3 parameters
- Use object for 4+ parameters with destructuring
- Example: `function create({ title, schedulePreset }: CreateTaskInput)`

**Return Values:**
- Explicit return statements
- Return early for guard clauses
- Use `ApiResponse<T>` for API responses

## Module Design

**Exports:**
- Named exports preferred
- Default exports for React components (optional)
- Re-export types from `src/types/index.ts`

**Barrel Files:**
- `index.ts` for public API exports
- Keep internal helpers private

## React Patterns

**Server vs Client Components:**
- Server Components by default (no `'use client'`)
- Client Components only for interactivity, hooks, browser APIs
- Mark with `'use client'` at file top

**Props:**
- Define as interfaces: `interface TaskFormProps { ... }`
- Destructure in parameter list

**Styling:**
- Tailwind CSS classes
- `cn()` helper for conditional classes
- Mobile-first (base styles = mobile, `md:` for desktop)
- Touch targets: min 44px (use `.touch-target` class)

**Animations:**
- Use Tailwind classes: `animate-fade-in`, `animate-slide-up`, `animate-scale-in`
- `active:scale-[0.97]` for button press feedback

## Language Convention

**Code/Variables/Comments:** English
**User-Facing Text:** Dutch

Examples:
- Variable: `scheduledCount` (English)
- Error message: `'Titel is verplicht'` (Dutch)
- Button label: `'Account aanmaken'` (Dutch)
- Console.error: `'Failed to load theme'` (English)

---

*Convention analysis: 2026-01-15*
*Update when patterns change*
