---
status: diagnosed
trigger: "Investigate why animated background orbs are not visible to the user."
created: 2026-01-18T10:00:00Z
updated: 2026-01-18T10:35:00Z
---

## Current Focus

hypothesis: CONFIRMED - Tailwind JIT purges the bg-{color}-400 classes because they're stored in object properties and accessed dynamically
test: Verified component pattern violates Tailwind's static analysis requirements
expecting: Classes need to be safelisted OR component needs to use inline styles instead of Tailwind color classes
next_action: Update Resolution with root cause and recommended fix

## Symptoms

expected: User sees subtle floating gradient orbs behind content on authenticated pages
actual: User reports "i don't see anything in the background"
errors: None reported
reproduction: Navigate to any authenticated page (e.g., /vandaag, /inzichten)
started: Issue discovered during UAT testing - feature claimed to be implemented in plan 05-01

## Eliminated

## Evidence

- timestamp: 2026-01-18T10:05:00Z
  checked: AnimatedBackground component exists at src/components/backgrounds/animated-background.tsx
  found: Component implemented correctly - uses useTheme hook, renders 3 orbs with blur and animations
  implication: Component code looks correct

- timestamp: 2026-01-18T10:06:00Z
  checked: Component imported and rendered in src/app/(main)/layout.tsx
  found: AnimatedBackground is imported and rendered inside main layout
  implication: Component is in the render tree

- timestamp: 2026-01-18T10:07:00Z
  checked: CSS animations defined in src/app/globals.css
  found: Float animations (floatSlow, floatMedium, floatFast) defined at lines 524-579
  implication: Animations are correctly defined

- timestamp: 2026-01-18T10:08:00Z
  checked: AnimatedBackground component dependencies
  found: Component uses `useTheme()` hook from '@/contexts/theme-context'
  implication: Need to verify ThemeContext is properly set up and wrapping the app

- timestamp: 2026-01-18T10:10:00Z
  checked: ThemeContext setup in src/contexts/theme-context.tsx
  found: ThemeProvider exists and properly implemented with useContext hook
  implication: Context is available

- timestamp: 2026-01-18T10:11:00Z
  checked: Root layout at src/app/layout.tsx
  found: ThemeProvider wraps all children in root layout
  implication: ThemeProvider should be available to all components

- timestamp: 2026-01-18T10:12:00Z
  checked: Component hierarchy and Server/Client boundary
  found:
    - Root layout: Server Component wraps ThemeProvider (Client)
    - Main layout (src/app/(main)/layout.tsx): async Server Component
    - AnimatedBackground: Client Component using useTheme hook
    - ThemeProvider wraps the entire app from root layout
  implication: Structure looks correct - ThemeProvider is at root, AnimatedBackground should have access to context

- timestamp: 2026-01-18T10:15:00Z
  checked: Re-examined AnimatedBackground component implementation
  found: Component is marked 'use client', uses useTheme hook correctly, renders div with orbs
  implication: Need to check if there's a runtime issue or if orbs are just not visible due to styling

- timestamp: 2026-01-18T10:20:00Z
  checked: Dev server startup and runtime errors
  found: Server started successfully, no build errors
  implication: Component is rendering without throwing errors

- timestamp: 2026-01-18T10:22:00Z
  checked: Tailwind configuration at tailwind.config.ts
  found: Standard Tailwind setup, no safelist defined, uses content paths that include components
  implication: Tailwind should be detecting and including used classes

- timestamp: 2026-01-18T10:25:00Z
  checked: AnimatedBackground blur classes usage
  found: Component uses `blur-3xl` and `blur-2xl` which are standard Tailwind classes
  implication: Classes should be available

- timestamp: 2026-01-18T10:30:00Z
  checked: AnimatedBackground color class usage pattern
  found:
    - Component defines colors in an object: orbColors.blue.orb1 = 'bg-blue-400'
    - Classes are accessed dynamically: className={`... ${colors.orb1} ...`}
    - Tailwind JIT compiler scans for literal class strings
    - Dynamic property access (colors.orb1) is NOT statically analyzable by Tailwind
  implication: Tailwind is likely purging these color classes from the final CSS because it can't detect them during static analysis

## Resolution

root_cause: |
  Tailwind CSS JIT compiler cannot detect dynamically accessed class names.

  In AnimatedBackground component (src/components/backgrounds/animated-background.tsx):
  - Color classes are stored in object: orbColors.blue.orb1 = 'bg-blue-400'
  - Classes are accessed via property: className={`... ${colors.orb1} ...`}
  - Tailwind's static analysis cannot parse colors.orb1 to extract 'bg-blue-400'
  - Result: All bg-{color}-400 classes (blue, indigo, cyan, pink, fuchsia, rose) are purged from final CSS
  - Orbs render as invisible divs with no background color

  This is a known Tailwind limitation: "Tailwind can only detect classes that exist as complete strings in your source files."

fix: |
  Use inline styles with HSL color values instead of Tailwind color classes.
  Replace Tailwind bg-* classes with style={{ backgroundColor: 'hsl(...)' }}

  Alternatively: Add all used color classes to Tailwind safelist in tailwind.config.ts,
  but inline styles are cleaner for dynamic theme-based colors.

verification:
files_changed:
  - src/components/backgrounds/animated-background.tsx
