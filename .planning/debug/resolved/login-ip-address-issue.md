---
status: resolved
trigger: "Investigate and fix NextAuth login issue: Works on localhost, fails on IP address access"
created: 2026-01-19T00:00:00Z
updated: 2026-01-19T16:30:00Z
resolution: "Migrate to Auth.js v5 in milestone v1.2"
---

## Current Focus

hypothesis: CONFIRMED - NextAuth v4 cannot work on multiple URLs simultaneously. Best practical solution is to enhance deploy.sh to auto-detect and configure NEXTAUTH_URL at deployment time.
test: N/A - Root cause confirmed
expecting: User to choose solution path
next_action: Present findings and solution options to user

## Symptoms

expected: Login should work regardless of how the app is accessed (localhost, IP, domain, reverse proxy)
actual: Login only works when browser URL exactly matches NEXTAUTH_URL in .env file
errors: No user-visible errors. Login button disables, then nothing happens (stuck on login page)
reproduction:
1. Set NEXTAUTH_URL=http://localhost:3000 in .env
2. Access app via http://192.168.0.3:3000
3. Enter valid credentials, click Login
4. Observe: Button disables, stuck indefinitely
started: Existing issue since v1.1, workaround is to change NEXTAUTH_URL and restart

## Eliminated

- hypothesis: trustHost: true enables dynamic URL detection
  evidence: trustHost property does not exist in NextAuth v4.24.11 types or runtime. TypeScript error TS2353 proves this.
  timestamp: 2026-01-19T00:45:00Z

## Evidence

- timestamp: 2026-01-19T00:00:00Z
  checked: Prior context
  found: Root cause is NextAuth callback URL validation mismatch. Two commits attempted fixes and were reverted.
  implication: Need to understand why previous fixes failed to avoid repeating mistakes

## Resolution

root_cause: NextAuth v4.24 has a fundamental security requirement that NEXTAUTH_URL must match the browser URL. The 'trustHost' feature does not exist in v4 (it's an Auth.js v5 feature). User's goal of working simultaneously on localhost, IP, domain, and reverse proxy without configuration is not supported by NextAuth v4 architecture.

**Historical context:** NextAuth v4 was chosen in initial commit (Jan 6, 2026) before GSD planning started. No documented rationale exists in `.planning/` decision logs. This was an inherited decision that now conflicts with deployment requirements.

fix: **Auth.js v5 Migration (v1.2 Milestone)**

NextAuth v4 was selected before formal project planning. Migration to Auth.js v5 will be the focus of milestone v1.2, enabling:
- `trustHost: true` for dynamic URL detection
- No hardcoded NEXTAUTH_URL required
- Works on localhost, IP, domain, and reverse proxy simultaneously
- Better React 19 compatibility
- Framework-agnostic architecture

**Migration scope:**
- Research Auth.js v5 migration guide during v1.2 planning
- Plan migration phases (config updates, testing, deployment)
- Maintain existing auth functionality (credentials provider, sessions)
- Verify Docker compatibility with v5

**Workaround until v1.2:**
- Development: Use `NEXTAUTH_URL=http://192.168.0.3:3001` in `.env.local`
- Production: Configure reverse proxy for single domain access

verification:
files_changed: []
next_milestone: v1.2

- timestamp: 2026-01-19T00:05:00Z
  checked: Git history of commits 998b9d2 and 5f552f1
  found: First attempt (998b9d2) added custom cookie config with secure flag logic based on NEXTAUTH_URL protocol. Second attempt (5f552f1) added trustHost: true. Both caused "Connection Error" and were reverted.
  implication: The cookie config was complex. Let me try trustHost alone without any cookie customization.

- timestamp: 2026-01-19T00:06:00Z
  checked: Current auth.ts file
  found: Currently has NO trustHost, NO custom cookies - completely clean NextAuth config
  implication: Starting from clean slate. Can test trustHost in isolation without interference.

- timestamp: 2026-01-19T00:10:00Z
  checked: .env.local file
  found: NEXTAUTH_URL is already commented out with note "auth will auto-detect from request Host header"
  implication: This was edited during previous attempt but auth.ts was reverted. The .env change alone doesn't help without trustHost in auth.ts.

- timestamp: 2026-01-19T00:11:00Z
  checked: Current auth.ts vs attempted fixes
  found: Current auth.ts is clean (no trustHost, no custom cookies). Commit 5f552f1 added ONLY trustHost: true (no cookies). Commit 998b9d2 had complex cookie config.
  implication: The trustHost-only attempt (5f552f1) should have been simple and safe. "Connection Error" suggests deeper issue.

- timestamp: 2026-01-19T00:15:00Z
  checked: next.config.js comparison
  found: Cookie commit added `allowedDevOrigins: ['192.168.0.*']` which was reverted. This is NOT a standard Next.js option.
  implication: That non-standard config may have caused build errors. The trustHost approach should work without any next.config.js changes.

- timestamp: 2026-01-19T00:20:00Z
  checked: NextAuth version and React version
  found: next-auth: 4.24.11, react: 19.0.0. NextAuth 4.24 supports trustHost. React 19 is very new.
  implication: Possible React 19 compatibility issue? Or previous "Connection Error" was from the non-standard allowedDevOrigins config, not trustHost itself.

- timestamp: 2026-01-19T00:25:00Z
  checked: Applied fix - added trustHost: true to auth.ts
  found: Clean implementation with just trustHost, no other changes. .env.local already has NEXTAUTH_URL commented out.
  implication: This matches commit 5f552f1 approach. If previous failure was from allowedDevOrigins, this should work.

- timestamp: 2026-01-19T00:40:00Z
  checked: TypeScript compilation with trustHost
  found: Error TS2353: 'trustHost' does not exist in type 'AuthOptions'
  implication: NextAuth 4.24.11 types don't include trustHost property. Need to check NextAuth version compatibility or use different approach.

- timestamp: 2026-01-19T00:45:00Z
  checked: NextAuth 4.24.11 source code and types
  found: trustHost property does NOT exist in NextAuth v4.24. Not in types, not in runtime code.
  implication: trustHost may be an Auth.js v5 feature, or doesn't exist at all. Previous commit 5f552f1 likely failed for this reason - TypeScript error would prevent build.

- timestamp: 2026-01-19T00:50:00Z
  checked: NextAuth behavior and environment variables
  found: NextAuth reads NEXTAUTH_URL from process.env at runtime. Next.js standalone builds CAN read runtime env vars if properly configured.
  implication: Can pass NEXTAUTH_URL to Docker container at startup. Need to verify next.config.js allows this.

- timestamp: 2026-01-19T01:00:00Z
  checked: docker-compose.prod.yml configuration
  found: Already passes NEXTAUTH_URL=${NEXTAUTH_URL} as environment variable to container. Docker will read from .env.production or environment.
  implication: The infrastructure supports runtime NEXTAUTH_URL! The issue is that users must manually set it in .env.production before deploying. Can't be truly dynamic.

- timestamp: 2026-01-19T01:05:00Z
  checked: User's actual goal
  found: User wants login to work on localhost, IP, domain, AND reverse proxy - all simultaneously without config changes
  implication: This is fundamentally at odds with NextAuth v4's security model which requires NEXTAUTH_URL to match exactly

- timestamp: 2026-01-19T01:15:00Z
  checked: Complete investigation of NextAuth v4 capabilities
  found: NextAuth v4.24 does NOT support trustHost (that's Auth.js v5). NEXTAUTH_URL MUST match browser URL for security. Cannot work on multiple URLs simultaneously.
  implication: User's desired behavior (work on localhost AND IP AND domain simultaneously) is architecturally impossible with NextAuth v4.
