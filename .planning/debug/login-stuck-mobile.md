# Bug: Login Stuck on Mobile (Button Disabled, No Progress)

**Status:** ✅ RESOLVED
**Reported:** 2026-01-19
**Fixed:** 2026-01-19
**Affects:** v1.1+ (regression from v1.0)
**Environment:** Mobile (both dev and prod)

## Root Cause

Uncommitted changes to `src/lib/auth.ts` added custom cookie configuration with `secure: true` in production. This caused browsers to **reject cookies** when accessing the app over HTTP (non-HTTPS), preventing session creation and breaking login.

**The bug:**
```typescript
secure: process.env.NODE_ENV === 'production'  // Always true in prod, requires HTTPS
```

**Why it failed:**
- Production Docker app accessed via `http://nas-ip:3000` (HTTP, not HTTPS)
- Browsers refuse to set `secure: true` cookies on HTTP connections
- NextAuth couldn't create session → login appeared to work but no session was stored
- User stuck with disabled button, no error message

**Why dev worked:**
- Dev environment has `secure: false`, allows HTTP cookies

## Resolution

Changed cookie security to check NEXTAUTH_URL protocol:
```typescript
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false
```

Now:
- HTTP URLs (like `http://192.168.x.x:3000`): `secure: false` ✓ Works
- HTTPS URLs (like `https://habitstreak.example.com`): `secure: true` ✓ Secure

## Symptoms

1. User enters credentials on login page
2. Clicks "Login" button
3. Button becomes disabled (loading state)
4. **Nothing happens** - stuck indefinitely
5. Cannot proceed past login screen

## Reproduction

**Steps:**
1. Open app on mobile device
2. Navigate to /login
3. Enter valid credentials
4. Tap "Login" button
5. **Observe:** Button disables but no navigation occurs

**Frequency:** 100% on mobile

## Environment

- **Devices:** Mobile (specific device/browser TBD)
- **Servers:** Both development server AND production Docker container
- **Version:** v1.1 (regression - v1.0 worked)
- **Desktop:** Unknown if affected

## What Changed in v1.1

Phases that could affect login:
- **Phase 8 (Animation Polish):**
  - Dialog portal rendering with createPortal
  - Animation-only-on-mount pattern (hasMounted ref)
  - PageTransition transform fixes

Could any of these affect form submission or page navigation?

## Hypotheses

### 1. Form Submission Handler Broken
- Network request not completing
- Response not being processed
- Error swallowed silently

### 2. Page Navigation Blocked
- PageTransition changes affecting route transitions?
- Next.js navigation intercepted somehow?

### 3. Mobile-Specific Issue
- Touch event vs click event?
- Mobile viewport specific CSS/JS bug?
- Mobile browser compatibility?

### 4. API Response Issue
- CORS problem in production?
- NextAuth session cookie issue?
- Health check endpoint interfering?

## Investigation Needed

**High Priority:**
1. Check browser console for errors (mobile debugging)
2. Check network tab - does login API request complete?
3. Check if desktop is also affected
4. Test with different mobile browsers (Safari, Chrome, Firefox)
5. Check login page component for recent changes
6. Verify NextAuth configuration unchanged

**Files to Inspect:**
- `src/app/(auth)/login/page.tsx` - Login form component
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `src/lib/auth.ts` - Auth helper functions
- `src/middleware.ts` - Route protection
- Any recent changes to PageTransition or layout components

## Workarounds

None - login is completely blocked on mobile.

## Next Steps

1. **Immediate:** Enable mobile debugging to capture console errors
2. **Test:** Verify if desktop is also affected
3. **Investigate:** Check what Phase 8 changes could affect forms/navigation
4. **Compare:** Diff login page between v1.0 (working) and v1.1 (broken)
5. **Fix:** Create hotfix if critical production issue

## User Impact

**Severity:** 🔴 CRITICAL
- Existing mobile users cannot log in
- New mobile users cannot access app
- Blocks all mobile usage

**Affected Users:** All mobile users on v1.1

## Notes

- Desktop status unknown (user should test)
- Both dev and prod affected (rules out environment-specific issue)
- Regression suggests specific v1.1 change caused this

---

*Next: Enable mobile debugging, capture console errors, verify desktop behavior*
