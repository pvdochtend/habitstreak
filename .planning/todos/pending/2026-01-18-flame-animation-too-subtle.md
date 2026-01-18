---
created: 2026-01-18T08:36
title: Make flame animation more visible/bolder
area: ui
files:
  - src/components/insights/animated-flame.tsx
  - src/app/globals.css
---

## Problem

The flame icon flicker animation on the Inzichten (Insights) page works but is almost not visible. User feedback from UAT: "it's almost not visible. Should be bolder, more visible in my opinion."

Current implementation uses subtle scale/rotate/opacity changes with staggered timing (1.5s flicker, 2s glow). The effect is too subtle to be noticeable.

## Solution

Increase animation intensity:
- Larger scale range (currently subtle, try 0.9-1.1 or more)
- More pronounced opacity changes
- Potentially stronger glow/drop-shadow effect
- Consider slightly faster timing for more energetic feel

Reference: UAT issue from `.planning/phases/04-celebrations-and-streaks/04-UAT.md` test 5
