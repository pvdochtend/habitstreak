---
status: diagnosed
phase: 05-polish-consistency
source: 05-01-SUMMARY.md
started: 2026-01-18T09:00:00Z
updated: 2026-01-18T09:03:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Floating gradient orbs visible on authenticated pages
expected: When you visit any authenticated page (/vandaag, /inzichten, /taken, /instellingen), you should see subtle floating gradient orbs animating slowly behind the content. The orbs should be large, blurred circles that gently move around the screen.
result: issue
reported: "i don't see anything in the background"
severity: major

### 2. Theme-aware background colors (blue/pink)
expected: Switch between blue and pink themes in /instellingen. The gradient orb colors should change to match - blue theme shows blue/indigo/cyan orbs, pink theme shows pink/fuchsia/rose orbs.
result: skipped
reason: can't see the background

### 3. Dark mode opacity adjustment
expected: Toggle dark mode in /instellingen. The gradient orbs should become slightly dimmer/more subtle in dark mode compared to light mode to prevent washing out the background.
result: skipped
reason: don't see the orbs in the background

### 4. Reduced motion accessibility support
expected: Enable "Reduce motion" in your OS accessibility settings (Windows: Settings > Ease of Access > Display > Show animations; Mac: System Preferences > Accessibility > Display > Reduce motion). The orbs should stop animating and remain static.
result: skipped
reason: no orbs in the background visible

### 5. Background stays behind content
expected: All content (cards, buttons, text, navigation) should appear in front of the animated background. The orbs should never obscure or overlap with interactive elements.
result: skipped
reason: no orbs in the background

## Summary

total: 5
passed: 0
issues: 1
pending: 0
skipped: 4

## Gaps

- truth: "User sees subtle animated gradient orbs floating behind content on authenticated pages"
  status: failed
  reason: "User reported: i don't see anything in the background"
  severity: major
  test: 1
  root_cause: "Tailwind CSS JIT compiler purges dynamically accessed background color classes (bg-blue-400, bg-indigo-400, etc.) because they cannot be statically detected in the AnimatedBackground component"
  artifacts:
    - path: "src/components/backgrounds/animated-background.tsx"
      issue: "Uses dynamic class names via object property access (colors.orb1) that Tailwind cannot detect"
    - path: "tailwind.config.ts"
      issue: "No safelist defined to preserve dynamic classes"
  missing:
    - "Replace Tailwind color classes with inline styles using HSL values (recommended)"
    - "OR add safelist to tailwind.config.ts with all orb color classes"
  debug_session: ".planning/debug/animated-orbs-not-visible.md"
