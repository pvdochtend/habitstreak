---
created: 2026-01-18T08:25
title: Streak calculation wrong for weekend with weekday tasks
area: ui
files:
  - src/app/(main)/vandaag/page.tsx
  - src/lib/streak.ts
---

## Problem

The today (vandaag) page isn't calculating the streak correctly when:
- It's a weekend day (Saturday or Sunday)
- One or more tasks are scheduled for weekdays only (WORKWEEK preset)

The streak calculation appears to not properly account for days where no tasks are scheduled. According to the domain rules in CLAUDE.md: "Days with no scheduled tasks don't affect streak" — but this may not be working correctly when viewing on a weekend with only weekday tasks.

## Solution

TBD - Investigate:
1. How streak.ts handles days with no scheduled tasks
2. Whether the vandaag page is passing correct task scheduling data
3. Edge case: user has ONLY weekday tasks and it's Saturday/Sunday
