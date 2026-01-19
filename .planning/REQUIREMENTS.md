# Requirements: HabitStreak v1.1

**Defined:** 2026-01-18
**Core Value:** Make every interaction feel rewarding

## v1.1 Requirements

Requirements for v1.1 Self-Hosting & Polish release.

### Docker Deployment

- [ ] **DOCKER-01**: App can be built as standalone Docker image under 300MB
- [ ] **DOCKER-02**: docker-compose includes PostgreSQL with health checks
- [ ] **DOCKER-03**: App exposes `/api/health` endpoint for container orchestration
- [ ] **DOCKER-04**: Environment variables documented in `.env.production.example`
- [ ] **DOCKER-05**: App runs Prisma migrations automatically at startup
- [ ] **DOCKER-06**: Synology NAS deployment steps documented

### Streak Calculation

- [ ] **STREAK-01**: Days with fewer scheduled tasks than dailyTarget are evaluated correctly (effectiveTarget = min(dailyTarget, scheduledCount))
- [ ] **STREAK-02**: calculateCurrentStreak handles WORKWEEK tasks on weekends
- [ ] **STREAK-03**: calculateBestStreak uses same effectiveTarget logic
- [ ] **STREAK-04**: Unit tests cover WORKWEEK/WEEKEND edge cases

### Animation Polish

- [ ] **ANIM-01**: Flame glow opacity increased from 30% to 50%+ for visibility
- [ ] **ANIM-02**: Animation end state fixed (no blink from shadow-sm conflict)
- [ ] **ANIM-03**: prefers-reduced-motion support maintained

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Streak Enhancements

- **STREAK-05**: Streak freeze feature (schema ready, UI not implemented)
- **STREAK-06**: Grace period for midnight completions (3-6 hours)

### Animation Enhancements

- **ANIM-04**: iOS Safari-specific box-shadow optimization
- **ANIM-05**: DST transition testing

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Streak freeze UI | Schema ready but adds complexity; defer to v2 |
| Historical schedule snapshots | Would require schema changes; current approach documented |
| Sound effects | User preference varies; visual-first per v1.0 research |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOCKER-01 | Phase 6 | Complete |
| DOCKER-02 | Phase 6 | Complete |
| DOCKER-03 | Phase 6 | Complete |
| DOCKER-04 | Phase 6 | Complete |
| DOCKER-05 | Phase 6 | Complete |
| DOCKER-06 | Phase 6 | Complete |
| STREAK-01 | Phase 7 | Complete |
| STREAK-02 | Phase 7 | Complete |
| STREAK-03 | Phase 7 | Complete |
| STREAK-04 | Phase 7 | Complete |
| ANIM-01 | Phase 8 | Pending |
| ANIM-02 | Phase 8 | Pending |
| ANIM-03 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 13 total
- Mapped to phases: 13 ✓
- Unmapped: 0

---
*Requirements defined: 2026-01-18*
*Last updated: 2026-01-19 after completing Phase 7*
