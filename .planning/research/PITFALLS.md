# Domain Pitfalls: Service Workers in Next.js 15

**Domain:** Adding service worker to existing Next.js 15 PWA with standalone output
**Researched:** 2026-01-31
**Confidence:** HIGH (verified with official docs and community experiences)

## Critical Pitfalls

Mistakes that cause rewrites, broken deployments, or users stuck on old versions.

---

### Pitfall 1: Users Stuck on Stale Content (The "Hostage" Problem)

**What goes wrong:** After deploying updates, users continue seeing the old version indefinitely. The browser shows old UI even though the server returns new content. Users report "the app never updates" or "I see different content than my colleague."

**Why it happens:**
- Service worker caches the app shell and serves it from cache
- Default `stale-while-revalidate` strategy serves cached content immediately
- Service worker update lifecycle requires ALL tabs to close before new version activates
- Old service worker persists in browser even after deployment

**Consequences:**
- Users never see bug fixes or new features
- Support complaints about "broken" features that were already fixed
- Impossible to deploy urgent security patches
- `curl` returns correct content but browser shows old version

**Prevention:**
1. **Never use stale-while-revalidate for navigation/HTML** - Use `NetworkFirst` for pages
2. **Implement versioned caches** - Name caches `habitstreak-v1`, delete old versions in activate
3. **Configure Cache-Control for sw.js** - Set `no-cache, no-store, must-revalidate` header
4. **Add update detection UI** - Show "Update available, tap to refresh" prompt
5. **Consider skipWaiting + clients.claim()** - But understand the tradeoffs (see Pitfall 4)

**Detection:**
- Test in incognito vs normal browser - if different, it's caching
- Check DevTools > Application > Service Workers for "waiting" status
- Compare `curl` response to browser response

**Phase:** Address in initial service worker implementation (Phase 1)

**Sources:**
- [Dev.to: Service Worker Held Site Hostage](https://dev.to/bradleymatera/the-day-a-service-worker-held-my-entire-site-hostage-21d3)
- [GitHub Discussion: Stale Data Issues](https://github.com/vercel/next.js/discussions/52024)

---

### Pitfall 2: Service Worker Scope Mismatch

**What goes wrong:** Service worker doesn't control all pages. Install prompt never fires. Some pages work offline, others don't.

**Why it happens:**
- Service worker placed in wrong directory (e.g., `/js/sw.js` instead of `/sw.js`)
- Scope defaults to directory where sw.js is located
- Manifest `start_url` outside service worker scope
- Docker/standalone output changes file paths

**Consequences:**
- Chrome never fires `beforeinstallprompt` event
- Lighthouse PWA audit fails with "No matching service worker"
- Partial offline support (confusing UX)
- Install button never appears

**Prevention:**
1. **Place sw.js in public/ root** - Will be served at `/sw.js` with scope `/`
2. **Explicitly set scope on registration** - `navigator.serviceWorker.register('/sw.js', { scope: '/' })`
3. **Verify manifest start_url is within scope** - HabitStreak uses `/` which is correct
4. **Test with Lighthouse PWA audit** - Catches scope mismatches early

**Detection:**
- DevTools > Application > Service Workers shows wrong scope
- Lighthouse: "Does not register a service worker that controls page and start_url"
- `beforeinstallprompt` event never fires

**Phase:** Address in initial service worker setup (Phase 1)

**Sources:**
- [web.dev: Service Workers](https://web.dev/learn/pwa/service-workers)
- [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)

---

### Pitfall 3: Standalone Output Breaking Service Worker Paths

**What goes wrong:** Service worker works in development but fails in Docker production. sw.js returns 404. Static assets not found.

**Why it happens:**
- Next.js standalone output changes directory structure
- `public/` and `.next/static/` not copied automatically to standalone
- Docker image missing required files
- Custom server not configured to serve sw.js

**Consequences:**
- Production PWA not installable
- Offline support broken in production only
- Difficult to debug (works locally, fails deployed)

**Prevention:**
1. **Explicitly copy public/ to standalone** - In Dockerfile:
   ```dockerfile
   COPY .next/standalone ./
   COPY .next/static ./.next/static
   COPY public ./public
   ```
2. **Verify sw.js accessible in production** - `curl https://yoursite.com/sw.js`
3. **Add header configuration in next.config.js** - For proper Content-Type
4. **Test with `npm run build && npm start`** - Simulates production locally

**Detection:**
- DevTools shows sw.js 404 in production
- Service worker registration fails silently
- `navigator.serviceWorker.controller` is null

**Phase:** Address during Docker/deployment configuration (Phase 2)

**Sources:**
- [Next.js Docs: Standalone Output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [Medium: Dockerizing Next.js Standalone](https://medium.com/@techwithtwin/dockerizing-next-js-v14-application-using-output-standalone-and-self-hos-eb636aa9b441)

---

### Pitfall 4: skipWaiting() Causing Page Inconsistency

**What goes wrong:** After update, page shows mix of old and new content. JavaScript errors from version mismatch. App crashes or behaves unexpectedly.

**Why it happens:**
- `skipWaiting()` activates new service worker while old page is still loaded
- Cached assets from old version mixed with new service worker logic
- Page was fetched by old SW, but subsequent requests handled by new SW
- Version mismatch between HTML shell and JS bundles

**Consequences:**
- Runtime errors from code expecting different API
- UI glitches from mismatched CSS
- Data corruption from schema changes
- Users blame app quality ("it's buggy")

**Prevention:**
1. **Prompt user before skipWaiting** - "Update available, click to refresh"
2. **Use clients.claim() with full page reload** - Ensure consistency
3. **Consider "skip when solo" pattern** - Only skipWaiting if single tab open
4. **Version your caches** - Old SW can still serve old cached assets

**Detection:**
- Console errors after deployment
- UI looks "broken" with mixed styles
- Only affects users with multiple tabs open

**Phase:** Address when implementing update UX (Phase 2)

**Sources:**
- [Chrome Developers: Handling Service Worker Updates](https://developer.chrome.com/docs/workbox/handling-service-worker-updates)
- [whatwebcando.today: Handling SW Updates](https://whatwebcando.today/articles/handling-service-worker-updates/)

---

## Moderate Pitfalls

Mistakes that cause delays, poor UX, or technical debt.

---

### Pitfall 5: Caching API Routes / Authentication Data

**What goes wrong:** Logged-out users see cached data from logged-in session. User A sees User B's data. JWT tokens cached and reused incorrectly.

**Why it happens:**
- Service worker caches API responses without considering auth headers
- Cache key doesn't include user-specific information
- Stale authentication tokens served from cache
- next-pwa default config caches everything

**Consequences:**
- Privacy/security violation (users see other users' data)
- Auth flows break (cached login state)
- Data appears outdated or inconsistent

**Prevention:**
1. **Never cache authenticated API routes** - Exclude `/api/*` from caching
2. **Use NetworkOnly for auth-required endpoints** - No fallback cache
3. **Configure cache exclusions** - In runtimeCaching config
4. **Let browser handle API requests natively** - Don't intercept with SW

**Detection:**
- Logout doesn't clear data
- Different data in incognito vs normal
- API calls show "from ServiceWorker" in DevTools

**Phase:** Address in caching strategy design (Phase 1)

**Sources:**
- [GitHub Discussion: Cache with Auth Headers](https://github.com/vercel/next.js/discussions/51279)

---

### Pitfall 6: Precaching Too Many Assets (Performance Regression)

**What goes wrong:** Initial page load becomes slower after adding service worker. Time-to-Interactive increases. Users on slow connections wait minutes for SW to install.

**Why it happens:**
- Default precache includes ALL static assets
- SW installation blocks main thread during asset download
- Sequential downloads even on HTTP/2
- Large images/fonts included unnecessarily

**Consequences:**
- Lighthouse scores drop by 10-15 points
- First-time visitors penalized most
- Mobile users on 3G have terrible experience
- Defeats purpose of PWA (supposed to be faster)

**Prevention:**
1. **Be selective about precaching** - Only cache app shell essentials
2. **Exclude images/large assets from precache** - Use runtime caching instead
3. **Register SW after page load event** - Don't compete with critical resources
4. **Use glob exclusions** - `exclude: [/\.(?:png|jpg|jpeg|svg)$/]`
5. **Measure before/after** - Compare Lighthouse scores

**Detection:**
- Lighthouse performance score drops
- Network tab shows SW fetching many assets during load
- "ServiceWorker" in waterfall before interactive

**Phase:** Address in caching strategy design (Phase 1)

**Sources:**
- [Chrome Developers: Service Worker Deployment](https://developer.chrome.com/docs/workbox/service-worker-deployment)
- [GitHub Issue: Aggressive Caching Slower](https://github.com/hanford/next-offline/issues/221)

---

### Pitfall 7: App Router RSC Payload Caching Conflicts

**What goes wrong:** Page navigation shows stale content. Client-side navigation returns old data. Inconsistent content between pages.

**Why it happens:**
- Next.js App Router uses RSC payload for client navigation (with `?_rsc=` params)
- Service worker intercepts RSC requests differently than HTML
- Router Cache conflicts with Service Worker cache
- CDN caching interacts poorly with RSC payloads

**Consequences:**
- Users see old content on navigation
- Eventually syncs (15+ minutes later)
- Confusing UX - same page, different content depending on how accessed

**Prevention:**
1. **Don't cache RSC prefetch requests** - Detect by `RSC: 1` header
2. **Use NetworkFirst for navigation** - Let Next.js handle RSC
3. **Understand three cache layers** - Browser cache, SW cache, Router cache
4. **Test client-side navigation specifically** - Not just full page loads

**Detection:**
- Different content on refresh vs navigation
- Content eventually "catches up"
- DevTools shows `_rsc` requests from cache

**Phase:** Address in caching strategy for App Router (Phase 1)

**Sources:**
- [Next.js Docs: Caching](https://nextjs.org/docs/app/guides/caching)
- [GitHub Discussion: RSC and CDN Cache](https://github.com/vercel/next.js/discussions/59167)

---

### Pitfall 8: Development/Production Testing Gap

**What goes wrong:** Service worker works in production but can't be tested in development. Bugs only discovered after deployment. Hot reload conflicts with SW.

**Why it happens:**
- Many frameworks disable SW in development intentionally
- Hot Module Replacement (HMR) conflicts with SW caching
- Production build generates different SW than dev
- Can't iterate quickly on SW code

**Consequences:**
- Bugs only found in production
- Slow development cycle (build, deploy, test, repeat)
- Developers avoid testing SW thoroughly
- "Works on my machine" problems

**Prevention:**
1. **Test with production build locally** - `npm run build && npm start`
2. **Use incognito windows** - Fresh state each time
3. **Enable "Update on reload" in DevTools** - Bypass SW during dev
4. **Consider conditional registration** - Enable SW in dev with flag
5. **Use HTTPS locally** - `next dev --experimental-https`

**Detection:**
- SW code changes don't take effect in dev
- "Waiting" SW in DevTools that never activates
- Different behavior between dev and prod

**Phase:** Address in development workflow (Phase 1)

**Sources:**
- [Chrome Developers: Improving SW Dev Experience](https://developer.chrome.com/docs/workbox/improving-development-experience)
- [Medium: Random Notes on SW Development](https://mmazzarolo.com/blog/2022-06-18-service-workers-tips-and-tricks/)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable quickly.

---

### Pitfall 9: Missing Offline Fallback Page

**What goes wrong:** Offline users see browser's default "No internet" page instead of branded offline experience.

**Why it happens:**
- No offline.html precached
- Navigation requests not handled with fallback
- App Router requires specific file location (`/~offline/page.tsx`)

**Prevention:**
1. **Create `/app/~offline/page.tsx`** - For App Router
2. **Precache the offline page** - Add to SW install
3. **Return offline page for failed navigation** - In fetch handler

**Phase:** Address in offline experience phase (Phase 2)

---

### Pitfall 10: Service Worker Cache Headers Wrong

**What goes wrong:** Browsers cache sw.js itself, updates not picked up. 24-hour delay before new SW activates.

**Why it happens:**
- Server sends Cache-Control headers for sw.js
- Browser checks for updates at most every 24 hours (per spec)
- CDN caches sw.js file

**Prevention:**
1. **Set no-cache headers for sw.js** - In next.config.js headers()
2. **Use updateViaCache: 'none'** - On registration
3. **Verify headers in production** - `curl -I https://yoursite.com/sw.js`

**Phase:** Address in initial configuration (Phase 1)

**Sources:**
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)

---

### Pitfall 11: Forgetting HTTPS Requirement

**What goes wrong:** Service worker registration fails silently in production.

**Why it happens:**
- SW only works on HTTPS (localhost exempted for dev)
- Mixed content blocks SW
- Redirect from HTTP to HTTPS not handled

**Prevention:**
1. **Ensure HTTPS in production** - Already the case for most deployments
2. **Check for mixed content** - All resources must be HTTPS
3. **Test on actual production URL** - Not just localhost

**Phase:** Verify during deployment (Phase 2)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Initial SW setup | Scope mismatch (P2) | Place in public/, test with Lighthouse |
| Caching strategy | Precache bloat (P6) | Start minimal, exclude images |
| Auth handling | Caching API routes (P5) | Exclude /api/*, NetworkOnly |
| Update mechanism | Stale content (P1) | Implement update prompt UI |
| Standalone build | Path issues (P3) | Copy public/ in Dockerfile |
| App Router integration | RSC conflicts (P7) | NetworkFirst for navigation |
| skipWaiting usage | Page inconsistency (P4) | Prompt before refresh |

## Recommended Implementation Order

Based on pitfall severity, implement in this order:

1. **Phase 1: Minimal SW with correct scope**
   - sw.js in public/
   - Proper headers in next.config.js
   - Minimal precache (HTML shell only)
   - Exclude /api/* from caching
   - NetworkFirst for navigation

2. **Phase 2: Update mechanism**
   - Version caches
   - Detect updates
   - Show "Update available" prompt
   - Controlled skipWaiting

3. **Phase 3: Offline experience**
   - Offline fallback page
   - Runtime caching for static assets
   - Handle failed API requests gracefully

4. **Phase 4: Standalone/Docker integration**
   - Verify Dockerfile copies public/
   - Test production build locally
   - Verify sw.js accessible in production

## Sources Summary

| Source | Confidence | Topics Covered |
|--------|------------|----------------|
| [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) | HIGH | Official implementation, headers |
| [Chrome Workbox Docs](https://developer.chrome.com/docs/workbox/handling-service-worker-updates) | HIGH | Update patterns, skipWaiting |
| [web.dev PWA Course](https://web.dev/learn/pwa/service-workers) | HIGH | Scope, lifecycle |
| [GitHub Next.js Discussions](https://github.com/vercel/next.js/discussions/52024) | MEDIUM | Real-world issues, stale data |
| [Infinity Interactive Blog](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior) | MEDIUM | Cache invalidation patterns |
| [LogRocket Blog](https://blog.logrocket.com/implementing-service-workers-next-js/) | MEDIUM | Next.js integration |
