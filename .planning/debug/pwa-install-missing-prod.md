---
status: investigating
trigger: "PWA install options (settings card + install banner) not visible on production site after container rebuild"
created: 2026-01-31T12:00:00Z
updated: 2026-01-31T12:00:00Z
---

## Current Focus

hypothesis: Production container was not rebuilt with new code (commits 09731ff, 0bc06fb, d372f51 not deployed)
test: SSH to prod server, check git log and running container image build time
expecting: If git log shows old commit OR container image is old, that confirms deployment issue
next_action: CHECKPOINT - need user to verify deployment status on production server

## Symptoms

expected: Both the InstallSettingsCard in settings page AND the InstallBanner should be visible on https://habit.petero.nl
actual: Neither PWA install option is showing up on production
errors: Not checked yet by user
reproduction: Visit https://habit.petero.nl and go to settings - no install option visible
started: Just rebuilt container on PROD, expected new features from last milestone to appear

## Eliminated

## Evidence

- timestamp: 2026-01-31T12:01:00Z
  checked: PWA install component visibility conditions
  found: |
    InstallSettingsCard shows when: !isLoading && !isStandalone && platform !== 'unsupported'
    InstallBanner shows when: !isLoading && canInstall (canInstall requires deferredPrompt for Chromium)
    Platform detection: Chromium detected via /Chrome|Chromium|Edg|OPR|SamsungBrowser/.test(ua)
    For Chromium, canInstall = deferredPrompt !== null (requires beforeinstallprompt event)
  implication: If platform is 'unsupported' OR beforeinstallprompt never fires, components won't show

- timestamp: 2026-01-31T12:03:00Z
  checked: Code integration in layouts
  found: |
    Root layout.tsx: PwaInstallProvider wraps app (lines 45-47)
    Main layout.tsx: InstallBanner imported (line 5), rendered (line 22)
    instellingen/page.tsx: InstallSettingsCard imported (line 12), rendered (line 297)
    manifest.json: Valid PWA manifest with icons, display mode, etc.
  implication: Code is properly integrated in source - if not working, either not deployed or runtime issue

- timestamp: 2026-01-31T12:04:00Z
  checked: InstallSettingsCard visibility logic
  found: |
    Line 25: if (isLoading || isStandalone || platform === 'unsupported') return null
    DOES NOT check canInstall or deferredPrompt
    Should show on Chromium even without beforeinstallprompt event
  implication: If InstallSettingsCard doesn't show, either (1) code not deployed, (2) platform='unsupported', or (3) isStandalone=true

- timestamp: 2026-01-31T12:06:00Z
  checked: Deployment mechanism
  found: |
    deploy.sh does: git pull -> docker-compose build --no-cache -> docker-compose up -d
    If user just ran "docker-compose up -d" without rebuild, old image would be used
    docker-compose.prod.yml has "build:" directive which SHOULD trigger rebuild
  implication: Need to verify if deploy.sh was run OR if just up -d was run

## Resolution

root_cause:
fix:
verification:
files_changed: []
