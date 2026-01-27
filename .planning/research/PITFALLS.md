# Pitfalls Research

**Domain:** Landing pages and PWA setup for Next.js apps
**Researched:** 2026-01-26
**Confidence:** HIGH (verified against official docs, current project code, and multiple sources)

## Critical Pitfalls

### Pitfall 1: PWA Icons Declared But Not Generated

**What goes wrong:**
The manifest.json references icon files that don't exist, causing 404 errors in the browser console. HabitStreak has this exact issue: manifest declares 8 icon sizes (72x72 through 512x512) but the `/public/icons/` directory only contains a README.md placeholder.

**Why it happens:**
Developers configure the manifest first, planning to "add icons later," but forget or deprioritize. The app still works, so the 404s go unnoticed until someone checks DevTools or tries to install the PWA.

**How to avoid:**
- Generate icons BEFORE configuring manifest (not after)
- Use automated icon generators: PWA Builder (pwabuilder.com/imageGenerator), RealFaviconGenerator
- Add a build-time check or CI step that verifies all declared icons exist
- Keep icon list minimal until ready: only 192x192 and 512x512 are required for Chrome installability

**Warning signs:**
- Console errors: "GET /icons/icon-144x144.png 404"
- PWA install prompt doesn't appear
- "Manifest doesn't have a maskable icon" Lighthouse warning
- `icons` array in manifest has multiple entries but `/public/icons/` is nearly empty

**Phase to address:** PWA/Icon Generation phase - before any landing page work

---

### Pitfall 2: Using "any maskable" Combined Purpose

**What goes wrong:**
Icons display incorrectly on different platforms. Android crops too much; Windows shows excessive padding. Chrome warns: "Declaring an icon with purpose 'any maskable' is discouraged."

**Why it happens:**
Developers think combining purposes saves work. HabitStreak's current manifest uses `"purpose": "any maskable"` for all icons.

**How to avoid:**
- Create SEPARATE icon sets: one for `purpose: "any"` (minimal padding), one for `purpose: "maskable"` (40% safe zone padding)
- Minimum configuration:
  ```json
  { "src": "/icon-192.png", "sizes": "192x192", "purpose": "any" },
  { "src": "/icon-512.png", "sizes": "512x512", "purpose": "any" },
  { "src": "/icon-maskable-192.png", "sizes": "192x192", "purpose": "maskable" },
  { "src": "/icon-maskable-512.png", "sizes": "512x512", "purpose": "maskable" }
  ```
- Test with Maskable.app before finalizing
- For maskable icons: main content must fit within center circle (40% radius)

**Warning signs:**
- Chrome DevTools warning about "any maskable"
- Icons look too small on Android home screen
- Icons have visible padding on Windows
- Different appearance across iOS/Android/desktop

**Phase to address:** PWA/Icon Generation phase

---

### Pitfall 3: Middleware Blocking Static Assets

**What goes wrong:**
manifest.json, icons, robots.txt, or sitemap.xml return 401/403 or 404 because authentication middleware intercepts them. SEO suffers; PWA install fails.

**Why it happens:**
Default middleware patterns catch too much. HabitStreak's current matcher explicitly excludes `/icons` but this is fragile for future static assets.

**Current HabitStreak middleware:**
```typescript
matcher: ['/((?!login|signup|api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)']
```

**How to avoid:**
Use a more robust matcher pattern that excludes ALL static files by extension:
```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf)).*)',
]
```
Or Clerk's recommended pattern:
```typescript
'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'
```

**Warning signs:**
- robots.txt returns 401
- Lighthouse PWA audit fails
- manifest.json blocked on preview deployments
- New static files 404 until manually added to matcher

**Phase to address:** Landing Page phase - update middleware when adding public routes

---

### Pitfall 4: Route Group Conflicts When Adding Landing Page

**What goes wrong:**
Adding a public landing page at `/` conflicts with existing protected routes. Users get redirected to login when hitting root, or worse, the landing page becomes protected.

**Why it happens:**
HabitStreak currently has `(auth)` and `(main)` route groups. Adding a new `(public)` group or standalone page at root requires careful layout and middleware coordination.

**How to avoid:**
- Create explicit `(public)` route group for landing, about, pricing pages
- Update middleware to whitelist public routes BEFORE adding them
- Never create duplicate route paths (e.g., `/about` in both public and main groups)
- Test auth redirect behavior: logged-out users should see landing, logged-in users should go to `/vandaag`

**Warning signs:**
- Root URL redirects to `/login` instead of showing landing page
- "Conflicting route" build errors
- Landing page requires authentication
- Logged-in users stuck on landing page

**Phase to address:** Landing Page phase - first step before building UI

---

### Pitfall 5: First Impression UX Failures

**What goes wrong:**
Users leave within 2.6 seconds because the above-the-fold content doesn't communicate value, has no clear CTA, or loads slowly.

**Why it happens:**
Developers focus on app functionality, treating landing page as an afterthought. They pack too much information above the fold or bury the CTA.

**How to avoid:**
- Keep above-the-fold minimal: headline + value prop + ONE primary CTA
- CTA must be specific: "Start Tracking Free" not "Learn More"
- Load time under 3 seconds (pages loading in 1s convert 2.5-5x better)
- Include social proof visible without scroll
- Mobile-first: test on actual phones, not just responsive preview
- Limit glassmorphism effects (see Performance Traps below)

**Warning signs:**
- High bounce rate (>60%)
- No clear primary action above fold
- CTA uses vague text ("Get Started", "Learn More")
- Loading spinner visible for more than 1 second
- Multiple competing CTAs above fold

**Phase to address:** Landing Page phase - design review checkpoint

---

### Pitfall 6: Apple Touch Icon Misconfiguration

**What goes wrong:**
iOS "Add to Home Screen" shows generic icon or wrong icon. Safari ignores the PWA manifest icons entirely.

**Why it happens:**
iOS requires specific `apple-touch-icon` meta tags AND correct file naming. The manifest.json `icons` array is NOT used by Safari/iOS. HabitStreak's layout.tsx references `/icons/icon-192x192.png` for apple icon, but that file doesn't exist.

**How to avoid:**
- Create `apple-icon.png` (180x180) in `/app` directory (Next.js auto-detects)
- Or use metadata export with explicit apple icon path
- Name must be `apple-icon.png` not `apple-touch-icon.png` for auto-detection
- Always provide fallback in HTML head tags

**Warning signs:**
- iOS home screen shows blank/default icon
- Safari DevTools shows missing apple-touch-icon
- `apple` property in metadata references non-existent file

**Phase to address:** PWA/Icon Generation phase

---

### Pitfall 7: Service Worker Cache Staleness

**What goes wrong:**
Users see old content even after deploying updates. The "just refresh" advice doesn't work because the service worker serves cached content.

**Why it happens:**
Aggressive caching without proper versioning. Service worker installed once, never updates. Safari especially honors cache directives strictly.

**How to avoid:**
- Use version-based cache names: `habitstreak-v1.2.0`
- Clean up old caches in service worker `activate` event
- Implement "Update Available" UI for major changes
- For API calls, use Network-First or add timestamp query params
- Consider workbox for managed caching strategies

**Warning signs:**
- Deployed changes don't appear until force-refresh
- Users report seeing old UI after update
- Cache storage growing unboundedly
- "Update available" notifications fire incorrectly

**Phase to address:** PWA Enhancement phase (if implementing offline)

---

### Pitfall 8: Glassmorphism Performance on Mobile

**What goes wrong:**
`backdrop-filter: blur()` causes jank, dropped frames, or excessive battery drain on mobile devices. Low-end Android phones become unusable.

**Why it happens:**
Glassmorphism is GPU-intensive. Developers test on high-end devices or desktop, missing performance issues.

**How to avoid:**
- Limit blur to 6-10px (not 20+px)
- Maximum 2-3 glassmorphic elements per viewport
- NEVER animate elements with backdrop-filter
- Use `will-change: transform` for hardware acceleration
- Provide solid-color fallback for low-end devices via media query
- Test on actual low-end phones

**Warning signs:**
- Scrolling stutters on mobile
- Battery drains noticeably faster
- FPS drops visible in DevTools Performance tab
- Users complain of "laggy" feeling

**Phase to address:** Landing Page phase - performance review

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Placeholder README instead of icons | Can ship manifest.json structure | Constant 404 errors, PWA broken | Never - either generate icons or remove manifest references |
| `"any maskable"` combined purpose | Fewer icon files to manage | Poor display on all platforms, Chrome warnings | Only during initial prototyping |
| Hardcoded middleware exclusions | Quick fix for one file | Must update for every new static asset | Early development only |
| Skipping mobile testing | Faster iteration | Broken UX on 60%+ of traffic | Never for landing pages |
| Single CTA text for all contexts | Less copy to write | Lower conversion rates | A/B test first |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Large icon files | Slow manifest load, install delay | Compress with TinyPNG, use WebP where supported | On slow connections |
| Too many glassmorphism elements | Scroll jank, high GPU usage | Max 2-3 per viewport, blur under 10px | Mid-range and low-end mobile |
| Animated blur effects | Frame drops, battery drain | Never animate backdrop-filter | Any mobile device |
| Unoptimized landing page images | LCP over 2.5s, bounce rate spike | Use next/image, responsive srcset, lazy loading | Mobile + slow connections |
| Missing font optimization | Layout shift, slow FCP | Use next/font, font-display: swap | All connections |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No landing page CTA above fold | Users don't know what to do | Primary CTA visible without scroll |
| Vague CTA text ("Learn More") | Low click-through | Action-oriented ("Start Tracking Free") |
| Auth redirect flash | Brief login page visible before landing | Check auth server-side, no client flash |
| Missing value proposition | Users leave within 3s | Clear headline: what it is + who it's for |
| No social proof | Low trust, hesitation | Testimonials or user count near CTA |
| Landing identical for logged-in users | Confusing, wastes time | Redirect logged-in users to /vandaag |
| Mobile nav hamburger above fold | Wastes prime real estate | Simplify or remove nav on landing |

---

## "Looks Done But Isn't" Checklist

### PWA Icons
- [ ] All declared icon sizes actually exist as files in `/public/icons/`
- [ ] Icons render correctly at small sizes (test 72x72)
- [ ] Maskable icons have proper 40% safe zone
- [ ] Apple touch icon exists at 180x180 AND is referenced correctly
- [ ] No console 404 errors for icon paths
- [ ] Lighthouse PWA audit passes icon checks

### Landing Page
- [ ] Accessible without authentication (middleware allows it)
- [ ] CTA visible above fold on mobile (not just desktop)
- [ ] Page loads in under 3 seconds on 3G
- [ ] Logged-in users redirected to app (not stuck on landing)
- [ ] No auth flash/flicker during load
- [ ] Social proof visible (even if placeholder)
- [ ] Works without JavaScript (basic content visible)

### Middleware Configuration
- [ ] robots.txt accessible (test in incognito)
- [ ] sitemap.xml accessible
- [ ] manifest.json accessible
- [ ] All icon paths accessible
- [ ] Landing page route explicitly allowed
- [ ] No blanket pattern that might catch future static files

### Performance
- [ ] Glassmorphism blur under 10px
- [ ] No more than 3 glass elements visible at once
- [ ] No animations on backdrop-filter elements
- [ ] Tested on actual mid-range Android phone
- [ ] Lighthouse performance score > 80

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| PWA Icons Not Generated | Icon Generation (first) | `ls public/icons/*.png` shows all declared sizes |
| "any maskable" Combined Purpose | Icon Generation | Manifest has separate `any` and `maskable` entries |
| Middleware Blocking Static Assets | Landing Page Setup | `curl -I domain.com/manifest.json` returns 200 |
| Route Group Conflicts | Landing Page Setup | Unauthenticated user sees landing at `/` |
| First Impression UX Failures | Landing Page Design | CTA above fold on 375px viewport |
| Apple Touch Icon Misconfiguration | Icon Generation | iOS simulator shows correct icon |
| Service Worker Cache Staleness | PWA Enhancement | Version bump triggers cache clear |
| Glassmorphism Performance | Landing Page Design | Lighthouse performance > 80 on mobile |

---

## Specific Fixes for HabitStreak

### Immediate (before landing page work):

1. **Generate PWA icons** - The `/public/icons/` directory needs actual PNG files, not just a README
2. **Fix manifest.json** - Change `"purpose": "any maskable"` to separate icon entries
3. **Update middleware** - Use extension-based exclusion pattern for future-proofing
4. **Create apple-icon.png** - 180x180 in `/app` directory

### During landing page work:

5. **Add `(public)` route group** - Clean separation from `(auth)` and `(main)`
6. **Whitelist landing route** - Update middleware before adding the page
7. **Implement auth-aware redirect** - Logged-in users go to `/vandaag`
8. **Audit glassmorphism usage** - Reduce blur values and element count

---

## Sources

### Primary (HIGH confidence)
- [Next.js Metadata Files Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons) - favicon/icon configuration
- [MDN PWA Icons Reference](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons) - manifest icon specification
- [Chrome Lighthouse PWA Audit](https://developer.chrome.com/docs/lighthouse/pwa/maskable-icon-audit) - maskable icon requirements
- [Next.js Route Groups Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) - route organization

### Secondary (MEDIUM confidence)
- [Clerk Blog: Skip Middleware for Static Files](https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files) - middleware patterns
- [Dev.to: Why PWA icons shouldn't use "any maskable"](https://dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78) - icon purpose separation
- [Zoho: 13 Landing Page Mistakes 2025](https://www.zoho.com/landingpage/landing-page-mistakes.html) - conversion pitfalls
- [web.dev PWA Update Guide](https://web.dev/learn/pwa/update) - service worker versioning

### Tertiary (verified against project code)
- HabitStreak `/public/manifest.json` - current manifest structure
- HabitStreak `/src/middleware.ts` - current middleware pattern
- HabitStreak `/public/icons/README.md` - confirms icons not generated
- HabitStreak `/src/app/layout.tsx` - confirms apple icon reference to missing file
