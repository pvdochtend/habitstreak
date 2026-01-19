# Requirements: HabitStreak v1.2

**Defined:** 2026-01-19
**Core Value:** Make every interaction feel rewarding.

## v1.2 Requirements

Requirements for Auth.js v5 migration milestone.

### Authentication Migration

- [ ] **AUTH-01**: Install next-auth@beta package and update dependencies
- [ ] **AUTH-02**: Create edge-compatible auth.config.ts if needed for middleware
- [ ] **AUTH-03**: Rewrite auth.ts with v5 export pattern (handlers, signIn, signOut, auth)
- [ ] **AUTH-04**: Update API route handler to use new exports
- [ ] **AUTH-05**: Update middleware to use auth export
- [ ] **AUTH-06**: Update auth-helpers.ts to use auth() instead of getServerSession
- [ ] **AUTH-07**: Update environment variables (AUTH_SECRET, AUTH_TRUST_HOST)
- [ ] **AUTH-08**: Update TypeScript type declarations for v5

### Dynamic URL Detection

- [ ] **URL-01**: Configure trustHost: true for automatic URL detection
- [ ] **URL-02**: Login works on localhost:3000
- [ ] **URL-03**: Login works on 127.0.0.1:3000
- [ ] **URL-04**: Login works on LAN IP address
- [ ] **URL-05**: Proper X-Forwarded-Host/Proto header support for reverse proxy
- [ ] **URL-06**: Login works on any custom domain via Host header

## v2 Requirements

*None — this milestone is tightly scoped to Auth.js v5 migration only.*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cookie migration | Complexity not worth it for small user base — users re-login once after upgrade |
| Reverse proxy configuration | Code enables capability; actual nginx/traefik setup is deployment task |
| OAuth providers | Credentials-only auth sufficient for personal self-hosted app |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 9 | Pending |
| AUTH-02 | Phase 9 | Pending |
| AUTH-03 | Phase 9 | Pending |
| AUTH-04 | Phase 9 | Pending |
| AUTH-05 | Phase 9 | Pending |
| AUTH-06 | Phase 9 | Pending |
| AUTH-07 | Phase 9 | Pending |
| AUTH-08 | Phase 9 | Pending |
| URL-01 | Phase 9 | Pending |
| URL-02 | Phase 9 | Pending |
| URL-03 | Phase 9 | Pending |
| URL-04 | Phase 9 | Pending |
| URL-05 | Phase 9 | Pending |
| URL-06 | Phase 9 | Pending |

**Coverage:**
- v1.2 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after initial definition*
