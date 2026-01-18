# Pitfalls Research

**Domain:** Next.js Docker + Streak Calculation + CSS Animation
**Researched:** 2026-01-18
**Confidence:** HIGH (Docker, Animation) / MEDIUM (Streak edge cases)

## Executive Summary

This research identifies common mistakes for HabitStreak v1.1's three focus areas: Docker deployment for Synology NAS self-hosting, streak calculation with variable schedules (WORKWEEK/WEEKEND), and CSS animation visibility improvements.

Key findings:
- Docker + Next.js + Prisma has well-documented pitfalls around `prisma generate` timing and standalone output configuration
- Streak calculation with variable schedules (weekend-only, workday-only tasks) has subtle bugs around "skip day" semantics and timezone boundaries
- CSS animation visibility issues often stem from low-opacity shadows and `drop-shadow` vs `box-shadow` performance tradeoffs

---

## Docker Deployment Pitfalls

### Pitfall D1: Missing `output: 'standalone'` in next.config.js

**What goes wrong:** Docker image is 1GB+ instead of ~100MB, slow startup, missing files at runtime.

**Why it happens:** Without standalone output, Next.js expects full `node_modules` directory. The current `next.config.js` lacks this setting entirely.

**How to avoid:** Add `output: 'standalone'` to `next.config.js` before creating Dockerfile.

**Warning signs:**
- Docker image size exceeds 200MB
- Build works but `npm start` fails with module not found
- Slow container startup (>10 seconds)

**HabitStreak-specific:** Current `next.config.js` at line 1-42 has no `output` property. Must be added.

---

### Pitfall D2: Prisma Client Not Generated in Docker Build

**What goes wrong:** Runtime error: "@prisma/client did not initialize yet. Please run 'prisma generate'."

**Why it happens:** Prisma Client is generated at build time and must be explicitly included in the Dockerfile. The standalone output doesn't automatically include `.prisma/client` directory.

**How to avoid:**
1. Run `npx prisma generate` in Dockerfile after copying `prisma/schema.prisma`
2. Copy both `.prisma/` and `@prisma/` from `node_modules` to final image
3. Ensure `prisma/schema.prisma` is available at build time

**Warning signs:**
- `prisma generate` not in Dockerfile
- Works locally, fails in container
- Error mentions "outdated Prisma Client"

**HabitStreak-specific:** Current `docker-compose.yml` only defines PostgreSQL. Dockerfile and app service must be added.

---

### Pitfall D3: DATABASE_URL Required at Build Time

**What goes wrong:** Next.js build fails with "DATABASE_URL environment variable not set" even though app runs fine locally.

**Why it happens:** Prisma schema parsing during `next build` requires DATABASE_URL, even for pages marked `force-dynamic`. This is a known Next.js + Prisma issue.

**How to avoid:**
1. Provide a dummy DATABASE_URL at build time: `ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"`
2. Or use Prisma's `--schema` flag with explicit path
3. Real DATABASE_URL is provided at runtime via environment

**Warning signs:**
- Build fails but no DB connection is actually needed at build time
- Works with `npm run dev` but not `npm run build`
- GitHub issue #77436 in vercel/next.js describes this exact problem

**HabitStreak-specific:** The app uses Prisma throughout API routes. Build will fail without this workaround.

---

### Pitfall D4: Container Can't Connect to PostgreSQL

**What goes wrong:** "Can't reach database server at 'localhost:5432'" when running in Docker.

**Why it happens:** `localhost` inside a container refers to the container itself, not the host machine or other containers.

**How to avoid:**
1. Use Docker service name (e.g., `postgres`) as hostname in DATABASE_URL
2. Or use `host.docker.internal` for host-machine PostgreSQL
3. Configure proper Docker networking in `docker-compose.yml`

**Warning signs:**
- DATABASE_URL contains `localhost`
- Works outside Docker, fails inside
- "Connection refused" errors

**HabitStreak-specific:** Current `.env.local` likely uses `localhost`. Production docker-compose needs service name `postgres` (matching existing `docker-compose.yml` service).

---

### Pitfall D5: PostgreSQL Not Ready When App Starts

**What goes wrong:** App container starts before PostgreSQL accepts connections, causing immediate crash.

**Why it happens:** Docker's `depends_on` only waits for container start, not service readiness. PostgreSQL needs several seconds to initialize.

**How to avoid:**
1. Use `depends_on` with `condition: service_healthy` (already have healthcheck in docker-compose.yml)
2. Add healthcheck to app container that verifies DB connection
3. Use restart policy as fallback

**Warning signs:**
- Intermittent startup failures
- Works on retry
- Race condition: sometimes works, sometimes doesn't

**HabitStreak-specific:** The existing `docker-compose.yml` already has PostgreSQL healthcheck. App service must use `depends_on: postgres: condition: service_healthy`.

---

### Pitfall D6: Prisma Migrations Not Applied

**What goes wrong:** Tables don't exist, foreign key errors, schema mismatch between app and database.

**Why it happens:** `prisma migrate deploy` must run before app starts in production, but it's often forgotten.

**How to avoid:**
1. Run migrations in container entrypoint: `npx prisma migrate deploy && npm start`
2. Or use init container in docker-compose
3. Never use `prisma migrate dev` in production (interactive, creates migrations)

**Warning signs:**
- "Table does not exist" errors
- Works with fresh DB but not restored backups
- Schema changes not reflected

**HabitStreak-specific:** Use `prisma migrate deploy` in entrypoint script, not `prisma migrate dev`.

---

### Pitfall D7: Synology NAS Architecture Mismatch

**What goes wrong:** Container crashes or won't start on Synology NAS.

**Why it happens:** Synology NAS devices use various CPU architectures (Intel Atom, ARM). Docker images built on x86_64 may not run on ARM, and vice versa.

**How to avoid:**
1. Build multi-architecture images or build on target platform
2. Use `--platform linux/amd64` if Synology has Intel CPU
3. Check Synology model's CPU architecture before building

**Warning signs:**
- "exec format error" on container start
- Image pulls but won't run
- Works on development machine but not NAS

**HabitStreak-specific:** Verify target Synology model. Most modern Synology NAS (DS920+, DS220+) use Intel Celeron (amd64).

---

### Pitfall D8: Next.js Image Optimization Crashes on Atom CPUs

**What goes wrong:** Docker container stops when using `next/image` component on older Synology NAS with Intel Atom CPU.

**Why it happens:** Next.js image optimization uses Sharp library which can crash on older Intel Atom D2700 processors due to unsupported instructions.

**How to avoid:**
1. Use `unoptimized: true` in next.config.js for images
2. Or use external image optimization service
3. Or disable image optimization entirely for self-hosted deployment

**Warning signs:**
- Container exits with no error message
- Crash happens when page with images loads
- GitHub issue #34198 in vercel/next.js

**HabitStreak-specific:** Current app doesn't heavily use images, but verify target NAS CPU generation.

---

## Streak Calculation Pitfalls

### Pitfall S1: Variable Schedule "Skip Day" Semantics Bug

**What goes wrong:** User has WORKWEEK task (Mon-Fri) and WEEKEND task (Sat-Sun). On Monday, they complete workday task but weekend task wasn't scheduled. Algorithm incorrectly evaluates weekend days.

**Why it happens:** Current streak algorithm in `src/lib/streak.ts` (line 68-76) checks if ANY task was scheduled for a day. If no tasks scheduled, day is skipped. But the bug is: it uses current active tasks to evaluate historical days.

**How to avoid:**
1. Check scheduledCount against THAT day's expected tasks, not current tasks
2. A day with 0 scheduled tasks should not break streak, but also shouldn't count as a success
3. Test edge case: user with only WEEKEND tasks shouldn't have broken streak on Monday

**Warning signs:**
- Streak breaks unexpectedly between Friday and Monday
- User with weekend-only habit shows 0 streak on weekdays
- Streak calculation differs from user expectation

**HabitStreak-specific:** Lines 76-78 in `streak.ts` skip days with no scheduled tasks:
```typescript
if (scheduledCount === 0) {
  continue;
}
```
This is correct behavior - the bug may be elsewhere. Need test coverage for variable schedule scenarios.

---

### Pitfall S2: Task Creation/Deletion Mid-Week Affects History

**What goes wrong:** User creates a WORKWEEK task on Wednesday. Algorithm evaluates Monday/Tuesday as "0 tasks scheduled" but user expects current streak to start from Wednesday.

**Why it happens:** `calculateCurrentStreak` queries current active tasks and applies them to all historical dates. Historical task state isn't tracked.

**How to avoid:**
1. Use task `createdAt` to determine when task became applicable
2. Don't count days before task creation in scheduling evaluation
3. Consider storing task schedule history if requirements expand

**Warning signs:**
- New task shows 0 streak even after completing it
- Deleting (deactivating) task affects past streak calculation
- Inconsistent streak after task modifications

**HabitStreak-specific:** Current implementation at line 28-38 gets only `isActive: true` tasks. Need to also check `createdAt` when evaluating historical days.

---

### Pitfall S3: Timezone Boundary Edge Cases

**What goes wrong:** User checks in at 23:55 Amsterdam time, but server processes at 00:05 next day UTC, creating inconsistent day attribution.

**Why it happens:** The app uses `Europe/Amsterdam` timezone throughout, but if any part of the chain (server, database, Docker) uses different timezone, dates mismatch.

**How to avoid:**
1. Ensure Docker container TZ environment variable is set: `TZ=Europe/Amsterdam`
2. All date comparisons use `getTodayInAmsterdam()` from `src/lib/dates.ts`
3. Never use JavaScript's `new Date()` directly for day calculations

**Warning signs:**
- Check-ins appearing on wrong day
- Streak breaks at midnight
- Different behavior in production vs development

**HabitStreak-specific:** The `dates.ts` module correctly uses Amsterdam timezone. Docker container must set `TZ=Europe/Amsterdam` environment variable.

---

### Pitfall S4: DST Transition Creates 23/25-Hour Days

**What goes wrong:** On DST transition days (last Sunday of March/October in Netherlands), streak calculation fails because day length assumptions break.

**Why it happens:** Naive date arithmetic (`date + 24 hours = next day`) fails during DST. A day can be 23 or 25 hours long.

**How to avoid:**
1. Use date-fns-tz functions (already in use) instead of manual arithmetic
2. `getLastNDays()` at line 50-56 uses `getDaysAgoInAmsterdam()` which should handle this correctly
3. Test specifically with DST transition dates

**Warning signs:**
- Streak breaks on last Sunday of March or October
- Missing or duplicate days in date range
- Off-by-one errors near DST boundaries

**HabitStreak-specific:** The `date-fns-tz` library handles DST correctly. The `getDateRangeArray()` helper at line 192-208 uses `current.setDate(current.getDate() + 1)` which should be safe but could be made more robust.

---

### Pitfall S5: Daily Target vs Scheduled Tasks Mismatch

**What goes wrong:** User has dailyTarget=3 but only 2 tasks scheduled for weekends. They complete both weekend tasks but day isn't "successful" because 2 < 3.

**Why it happens:** Daily target is global setting, but scheduled task count varies by day type.

**How to avoid:**
1. Document that dailyTarget should be <= minimum scheduled tasks per day
2. Or change success criteria to `min(completedCount, scheduledCount) >= dailyTarget`
3. Or make dailyTarget dynamic per day

**Warning signs:**
- User completes all visible tasks but streak doesn't increase
- "Successful day" definition confuses users
- Different behavior on weekdays vs weekends

**HabitStreak-specific:** Lines 81 in `streak.ts`: `const isSuccessful = completedCount >= dailyTarget`. This doesn't account for scheduledCount. May need product decision on expected behavior.

---

### Pitfall S6: Best Streak Uses ALL Tasks Including Inactive

**What goes wrong:** User deactivates a task they never completed. Best streak calculation now shows lower number because historical days with that task are evaluated.

**Why it happens:** `calculateBestStreak()` at line 114-124 queries ALL tasks (including inactive) to evaluate historical completeness. This is intentional but may surprise users.

**How to avoid:**
1. Document this behavior clearly
2. Or only count tasks that were active during the date range being evaluated
3. Consider task `isActive` history for accurate historical reconstruction

**Warning signs:**
- Best streak drops after deactivating task
- User complains streak was "stolen"
- Inconsistency between current and best streak logic

**HabitStreak-specific:** This is a product decision. Current behavior may be intentional to maintain historical accuracy.

---

## CSS Animation Visibility Pitfalls

### Pitfall A1: `drop-shadow` Filter Causes Safari Rendering Bugs

**What goes wrong:** Flame glow animation renders incorrectly on first load, flickers during scroll, or shows wrong on iOS Safari.

**Why it happens:** Safari has known rendering bugs with `filter: drop-shadow()`. The current `animate-flame-glow` uses `filter: drop-shadow()` at lines 506-517 in globals.css.

**How to avoid:**
1. Replace `drop-shadow` with `box-shadow` where possible
2. Add `isolation: isolate; will-change: filter;` to animated elements
3. Test on iOS Safari specifically
4. Consider baking glow into static SVG

**Warning signs:**
- Animation works in Chrome, glitches in Safari
- Flickering during scroll
- First render looks wrong, corrects on interaction

**HabitStreak-specific:** The `animate-flame-glow` at line 515-517 uses `filter: drop-shadow()`. This is a known issue area.

---

### Pitfall A2: Shadow Opacity Too Low for Visibility

**What goes wrong:** Glow animation plays but users can't see it. Appears that "nothing happens."

**Why it happens:** Subtle animations with low-opacity shadows (0.3-0.4 opacity) are barely visible on mobile screens, especially in bright environments.

**How to avoid:**
1. Increase shadow opacity from 0.3 to 0.5 or higher
2. Increase blur radius for more visible spread
3. Use stronger base color (brighter orange for flame)
4. Test in bright ambient light

**Warning signs:**
- Users report "animation not working" when it is
- Visible in dark room, invisible in daylight
- A/B test shows no engagement difference

**HabitStreak-specific:** Current flame glow at line 508 uses `rgba(249, 115, 22, 0.3)` - only 30% opacity. The debug file `.planning/debug/button-hover-glow-not-visible.md` documents this exact issue.

---

### Pitfall A3: `box-shadow` Conflicts During Animation

**What goes wrong:** Visual "blink" or flash when animation ends, shadow snaps to different state.

**Why it happens:** Animation applies one box-shadow value, element has different box-shadow in completed state. When animation class is removed, `transition-all` animates between them creating visible flash.

**How to avoid:**
1. Match animation end state to element's static shadow state
2. Don't combine `transition-all` with shadow animations
3. Use `animation-fill-mode: forwards` to persist end state
4. Remove conflicting shadow classes during animation

**Warning signs:**
- Flash/blink when animation completes
- Shadow "pops" instead of smooth transition
- Works in DevTools slow-mo, ugly at normal speed

**HabitStreak-specific:** This exact bug is documented in `.planning/debug/animate-glow-blink-on-check.md`. The root cause: `shadow-sm` class conflicts with `animate-glow` animation.

---

### Pitfall A4: Animating Filter Properties Kills Performance

**What goes wrong:** Janky 15fps animation, dropped frames, battery drain, phone heats up.

**Why it happens:** CSS `filter` properties (blur, drop-shadow) trigger expensive repaints. Unlike `transform` and `opacity`, filters can't be GPU-composited efficiently.

**How to avoid:**
1. Animate only `transform` and `opacity` when possible
2. For glow effects, animate opacity of a pseudo-element with static shadow
3. Keep filter animations to single elements, not lists
4. Test on low-end mobile devices

**Warning signs:**
- Animation stutters on iPhone Safari
- Smooth on MacBook, janky on phone
- Battery usage spikes during animation

**HabitStreak-specific:** The existing Phase 04 research at `.planning/phases/04-celebrations-and-streaks/04-RESEARCH.md` already identified this: "Using filter: blur() for flame: Causes performance issues on mobile."

---

### Pitfall A5: Missing `prefers-reduced-motion` for New Animations

**What goes wrong:** Accessibility failure - users with vestibular disorders experience discomfort from animations.

**Why it happens:** Adding new animations without updating the `@media (prefers-reduced-motion)` block in globals.css.

**How to avoid:**
1. For every new `@keyframes` or `.animate-*` class, add to reduced-motion block
2. Check lines 584-642 in globals.css - this block must include all animation classes
3. Test with "Reduce motion" enabled in OS settings

**Warning signs:**
- Animations play with OS "Reduce motion" enabled
- Accessibility audit fails
- User complaints about motion sickness

**HabitStreak-specific:** The existing globals.css has comprehensive reduced-motion support. Any new animations must be added to the block at lines 584-642.

---

### Pitfall A6: Animation Invisible Due to Overflow Clipping

**What goes wrong:** Shadow/glow extends outside element bounds but parent has `overflow: hidden`, cutting off the effect.

**Why it happens:** Shadows and glows extend beyond element boundaries. If any parent has `overflow: hidden`, the effect is clipped and invisible.

**How to avoid:**
1. Check for `overflow-hidden` on all parent elements
2. Add padding to parent to accommodate shadow spread
3. Or move glow to pseudo-element within element bounds

**Warning signs:**
- Shadow works in isolation but not in context
- DevTools shows shadow but screen doesn't
- Effect appears when element is repositioned

**HabitStreak-specific:** Debug file `.planning/debug/button-hover-glow-not-visible.md` checked for this - no global overflow-hidden found, but worth verifying in specific components.

---

## "Looks Done But Isn't" Checklist

These are items that appear complete but often have hidden issues:

- [ ] **Docker:** Build succeeds locally but fails in CI (missing build args, arch mismatch)
- [ ] **Docker:** Container starts but can't connect to database (localhost vs service name)
- [ ] **Docker:** App works but migrations weren't applied (tables don't exist)
- [ ] **Docker:** Image runs on dev machine but crashes on Synology (CPU architecture)
- [ ] **Streaks:** Streak counts correctly for ALL_WEEK but wrong for WORKWEEK/WEEKEND
- [ ] **Streaks:** Current streak works but best streak calculation differs
- [ ] **Streaks:** Works in Amsterdam timezone but breaks if server TZ differs
- [ ] **Streaks:** New users see correct streak but task modifications cause recalculation bugs
- [ ] **Animations:** Animation visible in DevTools but not on actual screen (opacity too low)
- [ ] **Animations:** Works in Chrome but glitches in Safari (filter bugs)
- [ ] **Animations:** Smooth on desktop but janky on mobile (filter performance)
- [ ] **Animations:** Animation plays but "blinks" at end (shadow state conflicts)
- [ ] **Animations:** Works with default settings but fails with "Reduce motion" (a11y)

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| D1: Missing standalone output | Docker Setup | Image size < 200MB |
| D2: Prisma not generated | Docker Setup | Container starts without Prisma error |
| D3: DATABASE_URL at build | Docker Setup | `docker build` succeeds |
| D4: localhost vs service name | Docker Setup | App connects to DB in container |
| D5: DB not ready | Docker Setup | Consistent startup without retries |
| D6: Migrations not applied | Docker Setup | App queries succeed |
| D7: Architecture mismatch | Docker Setup | Runs on target Synology model |
| D8: Image optimization crash | Docker Setup | Pages with images load on NAS |
| S1: Variable schedule bug | Streak Fix | Unit tests for WORKWEEK/WEEKEND edge cases |
| S2: Task creation affects history | Streak Fix | New task doesn't break existing streak |
| S3: Timezone boundary | Streak Fix | TZ env var set, midnight tests pass |
| S4: DST transition | Streak Fix | Tests with DST dates pass |
| S5: Daily target mismatch | Streak Fix | Product decision documented |
| S6: Inactive tasks in history | Streak Fix | Product decision documented |
| A1: drop-shadow Safari bugs | Animation Polish | Manual test on iOS Safari |
| A2: Shadow opacity too low | Animation Polish | Visible in bright daylight |
| A3: box-shadow conflicts | Animation Polish | No blink after animation |
| A4: Filter performance | Animation Polish | 60fps on iPhone |
| A5: Missing reduced-motion | Animation Polish | Respects OS setting |
| A6: Overflow clipping | Animation Polish | Shadow visible in context |

---

## Sources

### Docker + Next.js + Prisma
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/docker) - Official Prisma documentation
- [Next.js Docker Deployment](https://nextjs.org/docs/app/getting-started/deploying) - Official Next.js docs
- [Prisma Discussion #24528](https://github.com/prisma/prisma/discussions/24528) - Standalone output issues
- [Next.js Issue #77436](https://github.com/vercel/next.js/issues/77436) - DATABASE_URL build issue
- [Next.js Issue #34198](https://github.com/vercel/next.js/issues/34198) - Synology Atom CPU crash
- [Docker Compose Health Checks](https://docs.docker.com/compose/how-tos/startup-order/) - Official Docker docs
- [Marius Hosting Synology Docker](https://mariushosting.com/category/synology-docker/) - Synology-specific guides

### Streak Calculation
- [Trophy: How to Build Streaks](https://trophy.so/blog/how-to-build-a-streaks-feature) - Comprehensive guide on streak edge cases
- [uhabits Discussion #88](https://github.com/iSoron/uhabits/discussions/88) - Skip days in habit tracking
- Local codebase analysis: `/mnt/c/Sources/habitstreak/src/lib/streak.ts`

### CSS Animation Visibility
- [MDN Browser Compat Issue #17726](https://github.com/mdn/browser-compat-data/issues/17726) - Safari drop-shadow bugs
- [Tobias Ahlin: Animate box-shadow](https://tobiasahlin.com/blog/how-to-animate-box-shadow/) - Performance techniques
- [Josh Comeau: Designing Shadows](https://www.joshwcomeau.com/css/designing-shadows/) - Shadow visibility best practices
- [CSS-Tricks: Getting Deep Into Shadows](https://css-tricks.com/getting-deep-into-shadows/) - Shadow fundamentals
- Local codebase analysis: `/mnt/c/Sources/habitstreak/.planning/debug/*.md`

---

## Metadata

**Confidence breakdown:**
- Docker pitfalls: HIGH - Well-documented in official Prisma and Next.js docs
- Streak calculation: MEDIUM - Local code analysis + general patterns, specific edge cases need testing
- CSS animation: HIGH - Combination of official MDN docs and project-specific debug findings

**Research date:** 2026-01-18
**Valid until:** 2026-03-18 (Docker/CSS patterns stable, streak logic is codebase-specific)
