# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HabitStreak** is a mobile-first habit tracking web application built with Next.js 15, TypeScript, Prisma, and PostgreSQL. The app allows users to track daily habits, build streaks, and visualize progress with a 7-day chart.

**Key Principles:**
- Mobile-first design (all UI optimized for touch)
- All code/variables/comments in **English**
- All user-facing text in **Dutch**
- Timezone: **Europe/Amsterdam** (hardcoded)
- User data strictly scoped by `userId`

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Start PostgreSQL
docker-compose up -d

# Run database migrations
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Start dev server
npm run dev
```

### Database
```bash
# Create new migration
npm run db:migrate

# Push schema changes (dev only)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Testing
```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm test -- --watch

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### Build & Production
```bash
# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Auth**: NextAuth.js (Credentials provider with JWT sessions)
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Testing**: Vitest (unit), Playwright (E2E)

### Key Architecture Patterns

#### 1. Route Structure
```
(auth)/           - Auth pages without main layout (login, signup)
(main)/           - Protected app pages with bottom nav
  vandaag/        - Today's tasks
  inzichten/      - 7-day insights + streaks
  taken/          - Task CRUD
  instellingen/   - User settings
```

#### 2. Data Flow
```
User → UI (Client Component) →
API Route → Business Logic →
Prisma → PostgreSQL
```

#### 3. Authentication
- **Session Strategy**: JWT (stored in httpOnly cookies)
- **Auth Helpers**: `getCurrentUser()`, `requireAuth()`, `isAuthenticated()`
- **Middleware**: Protects all routes except /login, /signup, /api, static files
- **User Scoping**: All queries filter by `userId` for security

#### 4. Business Logic Location
- **Date utilities**: `src/lib/dates.ts` (Amsterdam timezone handling)
- **Scheduling logic**: `src/lib/schedule.ts` (task scheduling for ALL_WEEK, WORKWEEK, WEEKEND)
- **Streak calculation**: `src/lib/streak.ts` (current/best streak algorithms)
- **API routes**: Thin controllers that call business logic

### Database Schema

**Users:**
- `dailyTarget` (default: 1) - Number of tasks to complete for a successful day
- `streakFreezes` (default: 0) - For future freeze mechanic

**Tasks:**
- `schedulePreset` - ALL_WEEK | WORKWEEK | WEEKEND | CUSTOM
- `daysOfWeek` - Array of ISO weekdays (0=Mon, 6=Sun) for CUSTOM preset
- `isActive` - Soft delete flag (preserves check-in history)

**CheckIns:**
- `date` - YYYY-MM-DD string in Amsterdam timezone
- `status` - DONE (only option for MVP)
- Unique constraint: `(taskId, date)`

### Important Domain Rules

#### Streak Calculation
- A day is "successful" if `completedCount >= user.dailyTarget`
- Streaks count consecutive successful days
- Days with no scheduled tasks don't affect streak
- Missing a scheduled day resets streak to 0
- Algorithm: walk backwards from today, count consecutive successes

#### Task Scheduling
```typescript
ALL_WEEK  → Always scheduled
WORKWEEK  → Monday (0) through Friday (4)
WEEKEND   → Saturday (5) and Sunday (6)
CUSTOM    → Check if dayOfWeek in task.daysOfWeek array
```

#### Timezone Handling
- All dates stored as YYYY-MM-DD strings
- All date operations use `Europe/Amsterdam` timezone
- Use `getTodayInAmsterdam()` for current date
- Use `getDayOfWeek(dateString)` for ISO weekday (0=Mon)

## Common Development Tasks

### Adding a New API Route

1. Create route file in `src/app/api/`
2. Use `requireAuth()` to get current user
3. Validate input with Zod schema
4. Filter all queries by `userId`
5. Return `ApiResponse<T>` type
6. Add Dutch error messages

Example:
```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const data = await prisma.yourModel.findMany({
      where: { userId: user.id },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    })
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
}
```

### Adding a New Page

1. Create page in `src/app/(main)/route-name/page.tsx`
2. Use Client Component (`'use client'`) if interactive
3. Fetch data from API routes (not direct DB access)
4. Add loading skeleton state
5. Add error handling
6. Use `animate-fade-in` and `animate-slide-up` classes
7. Ensure all Dutch text for UI

### Modifying the Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate` (creates migration)
3. Name migration descriptively
4. Update TypeScript types if needed
5. Update API routes that use changed models
6. Test with `npm run db:studio`

### Adding a UI Component

1. Create in `src/components/` (organized by feature)
2. Use shadcn/ui components as base
3. Apply Tailwind classes for styling
4. Add animations (`animate-*` classes)
5. Ensure touch targets ≥ 44px (`.touch-target` class)
6. Use Dutch text for user-facing labels

## Code Style Guidelines

### TypeScript
- Use strict mode (already configured)
- Prefer interfaces over types for object shapes
- Use `ApiResponse<T>` for all API responses
- Export types from `src/types/index.ts`

### React
- Server Components by default
- Client Components only when needed (interactivity, hooks)
- Use `async` Server Components for data fetching
- Avoid prop drilling (keep components shallow)

### Tailwind
- Use semantic color variables (`primary`, `muted`, etc.)
- Mobile-first (base styles = mobile, use `md:` for desktop)
- Use `cn()` helper for conditional classes
- Animations: `animate-fade-in`, `animate-slide-up`, `animate-scale-in`

### Database Queries
- **Always** filter by `userId` for user data
- Use Prisma's type-safe queries
- Use `select` to limit returned fields
- Prefer `findUnique` over `findFirst` when possible

### Error Handling
- Return Dutch error messages to users
- Log English errors to console
- Use try-catch in API routes
- Check auth first, then validate input, then business logic

## Testing Strategy

### Unit Tests
- Test business logic in `src/lib/`
- Test date utilities, scheduling, streaks
- Mock Prisma where needed
- Located in `tests/unit/`

### E2E Tests
- Test critical user journeys
- Signup → Create task → Check in → View insights
- Test auth flows
- Located in `tests/e2e/`

### Running Tests
```bash
# Run unit tests
npm test

# Run specific test file
npm test -- dates.test.ts

# Run E2E tests
npm run test:e2e
```

## Security Considerations

- **User Scoping**: All queries MUST filter by `userId`
- **Auth Check**: Use `requireAuth()` in all protected API routes
- **Input Validation**: Use Zod schemas on POST/PATCH routes
- **Password Hashing**: bcrypt with 12 rounds (configured)
- **Session Security**: httpOnly cookies, 30-day expiry
- **CSRF Protection**: Built into NextAuth
- **SQL Injection**: Prevented by Prisma parameterization

## Performance Optimization

- Use Server Components for static content
- Client Components only for interactivity
- Minimize client-side JavaScript
- CSS animations (GPU-accelerated)
- Database indexes on frequently queried fields
- Prisma connection pooling (configured)

## Debugging Approach

Before asking the user to verify anything or take action:
1. Map the full pipeline/flow where the issue could occur
2. Identify which steps can be verified locally
3. Check all local-verifiable steps first
4. Only involve the user when local investigation is exhausted

Goal: Be 95% confident about the root cause before asking user for verification.

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps

# Restart PostgreSQL
docker-compose restart

# Check connection string
cat .env.local | grep DATABASE_URL
```

### Prisma Client Out of Sync
```bash
# Regenerate Prisma Client
npm run db:generate

# If schema changed, create migration
npm run db:migrate
```

### Type Errors
```bash
# Regenerate Prisma types
npm run db:generate

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run dev
```

### Auth Issues
- Check `NEXTAUTH_SECRET` is set (min 32 chars)
- Check `NEXTAUTH_URL` matches your domain
- Clear cookies and try again
- Check middleware config in `src/middleware.ts`

## Deployment Checklist

- [ ] Generate production `NEXTAUTH_SECRET`
- [ ] Set production `DATABASE_URL`
- [ ] Set production `NEXTAUTH_URL`
- [ ] Run `prisma migrate deploy`
- [ ] Generate PWA icons
- [ ] Test signup/login flow
- [ ] Test task creation and check-in
- [ ] Verify insights chart displays correctly
- [ ] Test on mobile devices
- [ ] Enable production error tracking

## Important Files

- `src/lib/auth.ts` - NextAuth configuration
- `src/lib/auth-helpers.ts` - Auth utility functions
- `src/lib/dates.ts` - Amsterdam timezone utilities
- `src/lib/schedule.ts` - Task scheduling logic
- `src/lib/streak.ts` - Streak calculation algorithms
- `src/middleware.ts` - Route protection
- `prisma/schema.prisma` - Database schema
- `src/types/index.ts` - Shared TypeScript types

## Notes for Future Development

### Planned Features (Not Yet Implemented)
- **Streak Freezes**: Data model ready, UI/logic not implemented
- **CUSTOM Day Selection**: Schema supports it, UI form not implemented
- **Reminders**: Mentioned in spec, not implemented
- **Dark Mode**: CSS variables ready, toggle not implemented
- **Data Export**: Mentioned in spec, not implemented

### Extension Points
- Add new schedule presets in `SchedulePreset` enum
- Add new check-in statuses in `CheckInStatus` enum
- Extend insights with more date ranges
- Add user preferences table for future settings
