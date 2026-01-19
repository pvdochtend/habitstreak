# Bug: Login Only Works on localhost, Not IP Address

**Status:** 🔴 OPEN - Needs Investigation
**Reported:** 2026-01-19
**Version:** v1.1+
**Priority:** HIGH - Blocks mobile testing and production usage

## Problem Statement

Users cannot log in when accessing the app via IP address (e.g., `http://192.168.0.3:3000` or `http://192.168.0.3:3001`). Login only works when accessing via `http://localhost:3000` or `http://localhost:3001`.

## Symptoms

1. Access app via IP address (desktop or mobile)
2. Enter valid credentials on login page
3. Click "Login" button
4. Button becomes disabled (loading state)
5. **Nothing happens** - user remains stuck on login page
6. No error message displayed to user
7. No navigation to authenticated pages occurs

## Reproduction

**Works:**
- ✅ Desktop via `http://localhost:3000` (production Docker)
- ✅ Desktop via `http://localhost:3001` (dev server)

**Fails:**
- ❌ Desktop via `http://192.168.0.3:3000` (production Docker)
- ❌ Desktop via `http://192.168.0.3:3001` (dev server)
- ❌ Mobile (iOS Safari) via `http://192.168.0.3:3000`
- ❌ Mobile (iOS Safari) via `http://192.168.0.3:3001`

**Steps to reproduce:**
1. Open browser (desktop or mobile)
2. Navigate to `http://192.168.0.3:3000` (or :3001 for dev)
3. Enter valid login credentials
4. Click "Login"
5. **Observe:** Button disables, no progress, stuck indefinitely

**Frequency:** 100% reproducible when using IP address

## Environment

**Development:**
- Node.js dev server (`npm run dev`)
- Port: 3001
- `.env.local` has: `NEXTAUTH_URL=http://localhost:3001`

**Production:**
- Docker container (v1.1)
- Port: 3000
- `.env.production` has: `NEXTAUTH_URL=http://192.168.0.3:3000` (or localhost)

**Devices tested:**
- Desktop: Works on localhost, fails on IP
- Mobile: iOS Safari, fails on IP

## Root Cause

NextAuth requires `NEXTAUTH_URL` to **exactly match** the URL in the browser's address bar for security reasons (callback URL validation).

**Why localhost works:**
- `.env` file: `NEXTAUTH_URL=http://localhost:3001`
- Browser URL: `http://localhost:3001`
- ✅ Match! Login succeeds

**Why IP address fails:**
- `.env` file: `NEXTAUTH_URL=http://localhost:3001`
- Browser URL: `http://192.168.0.3:3001`
- ❌ Mismatch! Login rejected silently

## Attempted Fixes (Reverted)

### Attempt 1: Custom Cookie Configuration (commit 998b9d2)

**What we tried:**
- Added custom cookie configuration to handle `secure` flag
- Set `secure: false` for HTTP URLs, `secure: true` for HTTPS
- Added different cookie prefixes for dev/prod (`dev.next-auth.*` vs `prod.next-auth.*`)

**Result:**
- ❌ API errors: "Connection Error"
- ❌ Build errors
- Reverted in commit b9b2e99

### Attempt 2: Auto-detect URL with trustHost (commit 5f552f1)

**What we tried:**
- Added `trustHost: true` to NextAuth config
- Made NEXTAUTH_URL optional (auto-detect from Host header)
- Updated `.env.production.example` to document optional NEXTAUTH_URL

**Result:**
- ❌ API errors: "Connection Error"
- ❌ Build errors
- Reverted (skipped empty revert)

**Both attempts reverted:** Back to v1.1 working state (except login IP issue remains)

## Technical Details

### NextAuth URL Validation

NextAuth validates callbacks against `NEXTAUTH_URL` for security:
1. User clicks "Login"
2. NextAuth initiates OAuth-style flow (even for credentials provider)
3. Callback redirects to `NEXTAUTH_URL`
4. If browser URL ≠ `NEXTAUTH_URL`, callback fails
5. Session not created, user remains on login page

### Why localhost is Special

Browsers treat `localhost` specially:
- Allow secure cookies on HTTP (dev exception)
- No CORS restrictions
- Works with `NEXTAUTH_URL=http://localhost`

### Why IP Addresses Fail

IP addresses have strict rules:
- Must match exactly (192.168.0.3 ≠ localhost)
- Secure cookies rejected on HTTP (except localhost)
- CORS can interfere

## Workarounds

### Workaround 1: Change NEXTAUTH_URL (Current Solution)

**For IP testing:**
```env
# .env.local or .env.production
NEXTAUTH_URL=http://192.168.0.3:3001
```

**Downside:**
- Must restart server after changing
- Can't support both localhost AND IP simultaneously
- Desktop users must use IP address too

### Workaround 2: Use /etc/hosts Mapping

Add to `/etc/hosts` (Windows: `C:\Windows\System32\drivers\etc\hosts`):
```
192.168.0.3 habitstreak.local
```

Then use:
```env
NEXTAUTH_URL=http://habitstreak.local:3001
```

Both desktop and mobile access via `http://habitstreak.local:3001`

**Downside:**
- Requires changing system files
- Must configure on every device

## Potential Solutions (Not Yet Tested)

### Solution 1: Runtime Environment Variable Detection

**Idea:** Allow Docker containers to set NEXTAUTH_URL via environment variable at runtime (not baked into image at build time)

**Benefits:**
- Change URL without rebuilding
- Works with Portainer environment variables
- Same image works for localhost/IP/domain

**Risks:**
- Need to verify Next.js standalone build supports runtime env vars
- May require next.config.js changes

### Solution 2: NextAuth trustHost with Better Configuration

**Idea:** Re-try `trustHost: true` but with proper cookie configuration

**What to test:**
- Remove custom cookie config, just use `trustHost: true`
- Or keep default cookies with `trustHost: true`
- Test if build errors were caused by cookie config, not trustHost

**Risks:**
- Already tried and failed
- May have other side effects

### Solution 3: Reverse Proxy (Production Only)

**Idea:** Use Synology reverse proxy to give app a domain name

**Setup:**
1. Configure reverse proxy: `https://habitstreak.local` → `http://localhost:3000`
2. Set `NEXTAUTH_URL=https://habitstreak.local`
3. Access via domain from all devices

**Benefits:**
- Single URL for all access
- Can use HTTPS (secure cookies)
- Professional setup

**Downside:**
- Doesn't solve dev server IP access
- Requires Synology configuration

## Next Steps

### Immediate (User Workaround)

1. **Production:** Update `.env.production` on NAS to use IP:
   ```env
   NEXTAUTH_URL=http://192.168.0.3:3000
   ```
   Redeploy: `./deploy.sh --yes`

2. **Development:** Update `.env.local` to use IP:
   ```env
   NEXTAUTH_URL=http://192.168.0.3:3001
   ```
   Restart: `npm run dev`

3. **Access:** Always use IP address on all devices (desktop and mobile)

### Investigation (Developer)

1. **Test runtime env vars:** Can Next.js standalone read NEXTAUTH_URL from Docker env at runtime?
2. **Re-test trustHost:** Try `trustHost: true` alone without custom cookie config
3. **Check NextAuth logs:** Enable debug mode to see why callbacks fail
4. **Research alternatives:** Are there NextAuth plugins or middleware solutions?

## Related Issues

- None currently tracked

## Impact

**Severity:** HIGH
- Blocks mobile testing during development
- Requires workaround (changing env file and restarting)
- Affects production Docker setup (must choose localhost OR IP OR domain)

**Affected Users:**
- Developers testing on mobile devices
- Production deployments accessed via IP address
- Anyone wanting to use both localhost and IP simultaneously

## References

**Commits:**
- `998b9d2` - Attempted fix with custom cookies (reverted)
- `5f552f1` - Attempted fix with trustHost (reverted)
- `b9b2e99` - Revert commit

**Files:**
- `src/lib/auth.ts` - NextAuth configuration
- `.env.local` - Dev environment
- `.env.production` - Production environment

**External:**
- NextAuth.js docs: https://next-auth.js.org/configuration/options
- NextAuth trustHost: https://next-auth.js.org/configuration/options#trusthost

---

## Investigation Log

### 2026-01-19 - Initial Report
- User reported login stuck on mobile
- Discovered it also fails on desktop when using IP
- Root cause identified: NEXTAUTH_URL mismatch

### 2026-01-19 - Attempted Fixes
- Tried custom cookie configuration → API errors, reverted
- Tried trustHost auto-detect → API errors, reverted
- Both attempts caused build errors and connection errors

### 2026-01-19 - Current Status
- Reverted to v1.1 state (deployment scripts preserved)
- Login works on localhost only
- Bug remains open, workaround documented

---

*Status: Needs proper solution for v1.2 or later. Current workaround: Set NEXTAUTH_URL to IP address.*
