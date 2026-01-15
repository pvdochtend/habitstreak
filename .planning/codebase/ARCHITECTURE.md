# Architecture

**Analysis Date:** 2026-01-15

## Pattern Overview

**Overall:** Layered Full-Stack Web Application (Next.js 15 App Router)

**Key Characteristics:**
- Monolithic full-stack application (frontend + backend in same repo)
- Server Components as default with Client Components for interactivity
- File-based routing (App Router pattern)
- TypeScript throughout for type safety
- Mobile-first responsive design
- All UI text in Dutch, all code/variables in English

## Layers

**Presentation Layer:**
- Purpose: User interface and interactions
- Contains: React components, pages, contexts
- Location: `src/components/`, `src/app/(auth)/`, `src/app/(main)/`
- Depends on: API layer for data, contexts for client state
- Used by: End users via browser

**API Layer:**
- Purpose: HTTP endpoints for data operations
- Contains: Route handlers (thin controllers), Zod validation
- Location: `src/app/api/`
- Depends on: Business logic layer, Prisma client
- Used by: Presentation layer via fetch()

**Business Logic Layer:**
- Purpose: Core application logic
- Contains: Auth, dates, scheduling, streaks, rate limiting
- Location: `src/lib/`
- Depends on: Prisma client, date-fns
- Used by: API layer

**Data Layer:**
- Purpose: Database access and type definitions
- Contains: Prisma schema, generated types
- Location: `prisma/`, `src/types/`
- Depends on: PostgreSQL database
- Used by: Business logic layer

**Middleware Layer:**
- Purpose: Route protection
- Contains: NextAuth middleware
- Location: `src/middleware.ts`
- Depends on: Auth configuration
- Used by: All protected routes

## Data Flow

**HTTP Request Lifecycle:**

1. User interacts with page
2. Middleware checks authentication
3. Page renders (Server Component by default)
4. Client Component fetches from API if interactive
5. API Route validates input with Zod
6. `requireAuth()` checks session
7. Business logic processes request
8. Prisma queries database (filtered by userId)
9. `ApiResponse<T>` wrapper returned
10. Client updates UI

**State Management:**
- Server: Stateless (database per request)
- Client: React Context for theme (`src/contexts/theme-context.tsx`)
- Persistence: localStorage (fast) + database (sync across devices)

## Key Abstractions

**ApiResponse<T>:**
- Purpose: Consistent API response format
- Location: `src/types/index.ts`
- Pattern: Generic wrapper with `success`, `data`, `error` fields
- Used by: All API routes

**Auth Helpers:**
- Purpose: Authentication utilities
- Location: `src/lib/auth-helpers.ts`
- Functions: `getCurrentUser()`, `requireAuth()`, `isAuthenticated()`
- Pattern: Throws error if not authenticated

**Date Utilities:**
- Purpose: Amsterdam timezone handling
- Location: `src/lib/dates.ts`
- Functions: `getTodayInAmsterdam()`, `getDayOfWeek()`, `getLastNDays()`
- Pattern: All dates as YYYY-MM-DD strings

**Scheduling:**
- Purpose: Task scheduling logic
- Location: `src/lib/schedule.ts`
- Function: `isTaskScheduledForDate()`
- Presets: ALL_WEEK, WORKWEEK, WEEKEND, CUSTOM

**Streaks:**
- Purpose: Calculate user streaks
- Location: `src/lib/streak.ts`
- Functions: `calculateCurrentStreak()`, `calculateBestStreak()`
- Pattern: Walk backwards from today counting consecutive successes

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page request
- Responsibilities: ThemeProvider wrapper, HTML structure

**Main Layout:**
- Location: `src/app/(main)/layout.tsx`
- Triggers: Protected page requests
- Responsibilities: Auth check, BottomNav, page wrapper

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every request
- Responsibilities: Redirect unauthenticated users to /login

**API Routes:**
- Location: `src/app/api/*/route.ts`
- Triggers: fetch() calls
- Responsibilities: Validate, authorize, process, respond

## Error Handling

**Strategy:** Throw errors, catch at boundaries, return Dutch messages

**Patterns:**
- API routes wrap in try/catch
- Zod validation errors return first error message
- Auth errors return "Authenticatie vereist"
- Generic errors return "Er is een fout opgetreden"
- Console.error for debugging (English)

## Cross-Cutting Concerns

**Logging:**
- Console.log for normal output
- Console.error for errors
- No structured logging service

**Validation:**
- Zod schemas at API boundary
- Dutch error messages
- Input sanitization via schema

**Authentication:**
- NextAuth middleware on all protected routes
- JWT tokens in httpOnly cookies
- 30-day session expiry

**Rate Limiting:**
- In-memory store with database audit trail
- Email-based: 5 attempts / 15 minutes
- IP-based: 15 attempts / 15 minutes
- Account lockout: 5 failures trigger 15-minute lock

**Timezone:**
- Hardcoded Europe/Amsterdam
- All dates stored as YYYY-MM-DD strings
- ISO weekday: 0=Monday, 6=Sunday

---

*Architecture analysis: 2026-01-15*
*Update when major patterns change*
