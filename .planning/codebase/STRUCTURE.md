# Codebase Structure

**Analysis Date:** 2026-01-15

## Directory Layout

```
habitstreak/
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── src/                    # Application source code
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Public auth pages (login, signup)
│   │   ├── (main)/        # Protected app pages with layout
│   │   └── api/           # API route handlers
│   ├── components/        # React components by feature
│   │   ├── insights/      # Insights page components
│   │   ├── navigation/    # Navigation components
│   │   ├── tasks/         # Task-related components
│   │   ├── theme/         # Theme management
│   │   └── ui/            # shadcn/ui base components
│   ├── contexts/          # React Context providers
│   ├── lib/               # Business logic utilities
│   └── types/             # TypeScript type definitions
├── tests/                  # Test files
│   ├── e2e/               # Playwright E2E tests
│   └── unit/              # Vitest unit tests
└── [config files]          # Project configuration
```

## Directory Purposes

**prisma/**
- Purpose: Database schema and migrations
- Contains: `schema.prisma`, migration files
- Key files: `schema.prisma` (User, Task, CheckIn, AuthAttempt, AccountLockout models)

**src/app/**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components, route handlers, layouts
- Subdirectories:
  - `(auth)/` - Route group for public pages (login, signup)
  - `(main)/` - Route group for protected pages with BottomNav
  - `api/` - API endpoints (auth, tasks, checkins, insights, today, user)

**src/components/**
- Purpose: React components organized by feature
- Contains: UI components, feature components
- Subdirectories:
  - `ui/` - shadcn/ui primitives (Button, Card, Dialog, Input, etc.)
  - `tasks/` - Task form, list item, today item, icon picker, celebration
  - `insights/` - Weekly chart, streak card
  - `navigation/` - Bottom navigation
  - `theme/` - Theme initializer

**src/contexts/**
- Purpose: React Context providers
- Contains: `theme-context.tsx`
- Key patterns: Theme state (colorScheme, darkMode), localStorage + DB sync

**src/lib/**
- Purpose: Business logic utilities (non-React)
- Contains: Auth, dates, scheduling, streaks, rate limiting, utilities
- Key files:
  - `auth.ts` - NextAuth configuration
  - `auth-helpers.ts` - getCurrentUser, requireAuth, isAuthenticated
  - `dates.ts` - Amsterdam timezone utilities
  - `schedule.ts` - Task scheduling logic (ALL_WEEK, WORKWEEK, WEEKEND, CUSTOM)
  - `streak.ts` - Current/best streak calculation
  - `rate-limit.ts` - Rate limiting and account lockout (422 lines)
  - `prisma.ts` - Singleton Prisma instance
  - `utils.ts` - cn() function for Tailwind class merging

**src/types/**
- Purpose: Centralized TypeScript type definitions
- Contains: `index.ts`, `next-auth.d.ts`
- Key types: ApiResponse<T>, TaskFormProps, domain types re-exported from Prisma

**tests/**
- Purpose: Test files
- Subdirectories:
  - `unit/` - Vitest unit tests (dates, schedule, auth, rate-limit)
  - `e2e/` - Playwright E2E tests (auth/, tasks/, settings/, fixtures/, helpers/)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout (ThemeProvider)
- `src/app/(main)/layout.tsx` - Protected layout (BottomNav)
- `src/middleware.ts` - Route protection

**Configuration:**
- `tsconfig.json` - TypeScript config (strict mode, path aliases)
- `next.config.js` - Next.js config (security headers)
- `tailwind.config.ts` - Tailwind CSS config (dark mode, CSS variables)
- `vitest.config.ts` - Unit test config
- `playwright.config.ts` - E2E test config (Pixel 5 device)
- `.env.local` - Environment variables (gitignored)

**Core Logic:**
- `src/lib/auth.ts` - NextAuth configuration with rate limiting
- `src/lib/streak.ts` - Streak calculation algorithms
- `src/lib/schedule.ts` - Task scheduling logic
- `src/lib/rate-limit.ts` - Security rate limiting

**API Routes:**
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `src/app/api/auth/signup/route.ts` - User registration
- `src/app/api/tasks/route.ts` - Task CRUD
- `src/app/api/checkins/route.ts` - Check-in creation/deletion
- `src/app/api/insights/route.ts` - 7-day insights and streaks
- `src/app/api/today/route.ts` - Today's task data
- `src/app/api/user/route.ts` - User settings

**Testing:**
- `tests/unit/*.test.ts` - Unit tests
- `tests/e2e/**/*.spec.ts` - E2E tests
- `tests/e2e/fixtures/test.ts` - Custom Playwright fixtures
- `tests/e2e/helpers/` - Shared test utilities

## Naming Conventions

**Files:**
- kebab-case for all source files (e.g., `task-form.tsx`, `auth-helpers.ts`)
- `*.test.ts` for unit tests
- `*.spec.ts` for E2E tests
- PascalCase for React components in file content

**Directories:**
- kebab-case for all directories
- Route groups in parentheses: `(auth)`, `(main)`
- Plural names for collections: `components/`, `contexts/`, `types/`

**Special Patterns:**
- `route.ts` for API endpoints
- `page.tsx` for pages
- `layout.tsx` for layouts
- `index.ts` for barrel exports

## Where to Add New Code

**New Feature:**
- Primary code: `src/components/[feature]/`
- API: `src/app/api/[feature]/route.ts`
- Business logic: `src/lib/[feature].ts`
- Types: `src/types/index.ts`
- Tests: `tests/unit/[feature].test.ts`, `tests/e2e/[feature]/`

**New Page:**
- Implementation: `src/app/(main)/[route-name]/page.tsx`
- Dutch route name for user-facing pages
- Add to BottomNav if needed: `src/components/navigation/bottom-nav.tsx`

**New API Route:**
- Definition: `src/app/api/[route]/route.ts`
- Use `requireAuth()` for protected routes
- Return `ApiResponse<T>` wrapper
- Add Zod schema for validation

**New Component:**
- Feature component: `src/components/[feature]/[component-name].tsx`
- UI primitive: `src/components/ui/[component].tsx`
- Use `'use client'` only if interactive

**Utilities:**
- Shared helpers: `src/lib/[name].ts`
- Type definitions: `src/types/index.ts`

## Special Directories

**.next/**
- Purpose: Next.js build output
- Source: Auto-generated by `npm run build`
- Committed: No (in .gitignore)

**node_modules/**
- Purpose: npm dependencies
- Source: Auto-generated by `npm install`
- Committed: No (in .gitignore)

**prisma/migrations/**
- Purpose: Database migration history
- Source: Generated by `npm run db:migrate`
- Committed: Yes (version controlled)

**.planning/**
- Purpose: Project planning documents
- Source: Manual or GSD workflow
- Committed: Yes

---

*Structure analysis: 2026-01-15*
*Update when directory structure changes*
