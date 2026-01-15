# Technology Stack

**Analysis Date:** 2026-01-15

## Languages

**Primary:**
- TypeScript 5.7.2 - All application code (`package.json`, `tsconfig.json`)

**Secondary:**
- JavaScript - Build scripts, config files
- CSS/Tailwind - Styling (`tailwind.config.ts`, `postcss.config.js`)
- SQL (PostgreSQL) - Database queries via Prisma ORM

## Runtime

**Environment:**
- Node.js (no explicit version; runs on any LTS)
- Next.js 15.1.3 server-side Node runtime
- PostgreSQL 16 (Docker container) - `docker-compose.yml`

**Package Manager:**
- npm (Node Package Manager)
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- Next.js 15.1.3 - Full-stack React framework with App Router - `package.json`
- React 19.0.0 - UI library - `package.json`
- React DOM 19.0.0 - DOM rendering - `package.json`

**Testing:**
- Vitest 2.1.8 - Unit tests - `vitest.config.ts`
- Playwright 1.49.1 - E2E tests (Mobile Chrome/Pixel 5) - `playwright.config.ts`

**Build/Dev:**
- TypeScript 5.7.2 - Compilation and type checking
- ESLint 9.17.0 - Code linting - `.eslintrc.json`
- PostCSS 8.4.49 - CSS transformation

## Key Dependencies

**Critical:**
- NextAuth.js 4.24.11 - JWT-based session management with Credentials provider - `src/lib/auth.ts`
- Prisma 5.22.0 - TypeScript ORM with PostgreSQL adapter - `prisma/schema.prisma`
- bcrypt 5.1.1 - Password hashing (12 rounds) - `src/app/api/auth/signup/route.ts`
- zod 3.24.1 - TypeScript-first schema validation (API input)

**UI/Styling:**
- Tailwind CSS 3.4.17 - Utility-first CSS framework - `tailwind.config.ts`
- shadcn/ui (via @radix-ui/react-slot 1.1.1) - Accessible component library
- Lucide React 0.460.0 - Icon library
- Recharts 2.15.0 - React chart library (7-day insights)

**Utilities:**
- date-fns 4.1.0 + date-fns-tz 3.2.0 - Date utilities with Europe/Amsterdam timezone
- class-variance-authority 0.7.1 - CSS class composition
- clsx 2.1.1 + tailwind-merge 2.6.0 - Conditional className utility

## Configuration

**Environment:**
- `.env.local` (gitignored) - Runtime environment variables
- `.env.example` - Template for required variables
- Required vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `TZ`
- Optional: `RATE_LIMITING_ENABLED` (defaults to true)

**Build:**
- `tsconfig.json` - TypeScript strict mode, ES2020 target, path alias `@/*`
- `next.config.js` - Security headers, image optimization
- `tailwind.config.ts` - Dark mode (class-based), CSS variables for theming
- `vitest.config.ts` - Node environment testing, React plugin
- `playwright.config.ts` - Mobile Chrome testing (Pixel 5), baseURL: http://localhost:3001

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js)
- Docker for local PostgreSQL (`docker-compose up -d`)

**Production:**
- Vercel (primary target) - automatic deployment on main branch
- Any Node.js hosting with PostgreSQL database
- Environment variables configured in hosting dashboard

---

*Stack analysis: 2026-01-15*
*Update after major dependency changes*
