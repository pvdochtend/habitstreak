# Stack Research: Landing Pages and PWA Enhancement

**Domain:** Landing pages and PWA enhancement for Next.js 15 apps
**Researched:** 2026-01-26
**Confidence:** HIGH

## Executive Summary

HabitStreak v1.3 requires a landing page, PWA icons, and login polish. The existing stack (Next.js 15, React 19, Tailwind CSS 3.4, shadcn/ui) already provides everything needed for landing pages. No new framework dependencies required.

**Key findings:**
- Landing pages are static by default in Next.js 15 App Router - just create a `page.tsx` without dynamic data
- Glassmorphism CSS is already implemented in `globals.css` (`.glass`, `.glass-subtle`, `.glass-strong`)
- PWA manifest exists but icon files are missing from `/public/icons/`
- Use `@vite-pwa/assets-generator` (standalone CLI, works without Vite) for icon generation

## Recommended Stack

### Core Technologies (Already Installed)

| Technology | Current Version | Purpose | Notes |
|------------|-----------------|---------|-------|
| Next.js | 15.1.3 | Framework | Static generation is default for pages without dynamic data |
| React | 19.0.0 | UI library | Server Components for landing page |
| Tailwind CSS | 3.4.17 | Styling | Has `backdrop-blur-*` utilities built-in |
| shadcn/ui | (radix-based) | Components | Already installed, use for CTAs |

### Supporting Libraries (Already Installed)

| Library | Version | Purpose | Landing Page Use |
|---------|---------|---------|------------------|
| lucide-react | 0.460.0 | Icons | Feature section icons |
| tailwindcss-animate | 1.0.7 | Animations | Hero entrance animations |
| clsx/tailwind-merge | 2.1.1/2.6.0 | Class utilities | Conditional styling |

### New Dev Dependencies

| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| @vite-pwa/assets-generator | ^0.2.6 | PWA icon generation | Single source image to all PWA sizes |

### Optional: Animation Enhancement

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| motion | 12.x | Advanced animations | Only if CSS animations insufficient |

**Recommendation:** Start with CSS animations (already have `animate-slide-up`, `animate-fade-in`). Only add `motion` if hero section needs complex orchestrated animations.

## Installation

```bash
# PWA icon generation (dev dependency)
npm install -D @vite-pwa/assets-generator

# Optional: only if CSS animations insufficient for hero
npm install motion
```

## Glassmorphism Implementation

### Existing Utilities (globals.css)

The project already has glassmorphism classes:

```css
/* Already in globals.css - use these */
.glass {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: hsl(var(--card) / 0.7);
  border: 1px solid hsl(var(--border) / 0.3);
}

.glass-subtle {
  backdrop-filter: blur(8px);
  background: hsl(var(--card) / 0.5);
}

.glass-strong {
  backdrop-filter: blur(20px);
  background: hsl(var(--card) / 0.85);
}
```

### Hero Section Pattern

```tsx
// Glassmorphism hero with gradient background
<section className="relative min-h-screen overflow-hidden">
  {/* Gradient background */}
  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />

  {/* Floating orbs (already have animate-float-* classes) */}
  <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/30 blur-3xl animate-float-slow" />
  <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-accent/30 blur-3xl animate-float-medium" />

  {/* Content panel */}
  <div className="relative z-10 glass rounded-2xl p-8 max-w-xl mx-auto">
    <h1 className="text-4xl font-bold animate-fade-in">...</h1>
  </div>
</section>
```

### Tailwind Backdrop-Blur Utilities

Built-in utilities (no configuration needed):

| Class | Blur Amount | Use Case |
|-------|-------------|----------|
| `backdrop-blur-sm` | 4px | Subtle glass |
| `backdrop-blur-md` | 12px | Standard glass |
| `backdrop-blur-lg` | 16px | Prominent glass |
| `backdrop-blur-xl` | 24px | Strong glass |
| `backdrop-blur-2xl` | 40px | Very strong |
| `backdrop-blur-3xl` | 64px | Maximum |

**Pattern:** `backdrop-blur-md bg-white/30 border border-white/20`

## Landing Page Architecture

### Route Structure

```
src/app/
├── (public)/           # Route group for public pages
│   ├── layout.tsx      # Minimal layout (no auth, no bottom nav)
│   └── page.tsx        # Landing page (static by default)
├── (auth)/             # Existing auth pages
└── (main)/             # Existing protected app
```

### Static Generation (Default)

Landing pages are **automatically static** in Next.js 15 App Router unless you:
- Use `cookies()`, `headers()`, or `searchParams`
- Call `fetch()` with `cache: 'no-store'`
- Export `dynamic = 'force-dynamic'`

**Do not add `generateStaticParams` for the landing page** - it's unnecessary for non-dynamic routes.

### Metadata Configuration

```tsx
// src/app/(public)/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HabitStreak - Bouw betere gewoonten',
  description: 'Track dagelijkse gewoonten, bouw streaks, en bereik je doelen met HabitStreak.',
  metadataBase: new URL('https://habitstreak.nl'), // Required for OG images
  openGraph: {
    title: 'HabitStreak - Bouw betere gewoonten',
    description: 'Track dagelijkse gewoonten, bouw streaks, en bereik je doelen.',
    images: ['/og-image.png'], // 1200x630 recommended
    locale: 'nl_NL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HabitStreak - Bouw betere gewoonten',
    description: 'Track dagelijkse gewoonten, bouw streaks, en bereik je doelen.',
    images: ['/og-image.png'],
  },
}
```

### Landing Page Sections

Standard structure for SaaS landing pages:

1. **Hero** - Headline, subheadline, CTA, app preview
2. **Features** - 3-4 key benefits with icons
3. **How it works** - Simple 3-step process
4. **Social proof** - Optional for v1.3
5. **CTA** - Final call to action

## PWA Icon Generation

### Current State

`public/manifest.json` references icons that do not exist:
- `/icons/icon-72x72.png` through `/icons/icon-512x512.png`
- All 8 sizes need to be generated

### Using @vite-pwa/assets-generator

**Step 1: Create source image**

Create a 512x512 or larger SVG/PNG at `public/logo.svg` (SVG recommended for quality).

**Step 2: Add script to package.json**

```json
{
  "scripts": {
    "generate-pwa-icons": "pwa-assets-generator --preset minimal-2023 public/logo.svg"
  }
}
```

**Step 3: Run generation**

```bash
npm run generate-pwa-icons
```

### Output Files (minimal-2023 preset)

The `minimal-2023` preset generates:

| File | Size | Purpose |
|------|------|---------|
| `pwa-64x64.png` | 64x64 | Small favicon |
| `pwa-192x192.png` | 192x192 | Android home screen |
| `pwa-512x512.png` | 512x512 | Android splash |
| `maskable-icon-512x512.png` | 512x512 | Maskable (full-bleed) |
| `apple-touch-icon-180x180.png` | 180x180 | iOS home screen |

**Note:** Rename output files to match existing manifest.json paths, OR update manifest.json to use new naming.

### Maskable Icon Guidelines

Maskable icons allow full-bleed display on Android. Critical content must be in the **safe zone** (central 80% of icon - 40% radius from center).

```
┌─────────────────┐
│                 │
│   ┌─────────┐   │
│   │ SAFE    │   │  ← Critical content here
│   │ ZONE    │   │
│   └─────────┘   │
│                 │
└─────────────────┘
     10% margin
```

### Recommended Manifest Update

After generation, update `manifest.json` icons array:

```json
{
  "icons": [
    {
      "src": "/icons/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

**Important:** Do not use `"purpose": "any maskable"` - use separate icon entries.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| CSS animations | motion (framer-motion) | Complex orchestrated sequences, spring physics, layout animations |
| @vite-pwa/assets-generator | pwa-asset-generator | Need iOS splash screens (uses Puppeteer, heavier) |
| Static metadata export | generateMetadata | Dynamic OG images per page (not needed for landing) |
| Tailwind backdrop-blur | Custom CSS | Never - Tailwind covers all blur values |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next-pwa` | Adds service worker complexity, overkill for icons | Just generate icons manually |
| `pwa-asset-generator` (Puppeteer-based) | Heavy dependency, uses browser for generation | `@vite-pwa/assets-generator` (sharp-based) |
| `motion` for simple fades | Unnecessary JS bundle | CSS `animate-fade-in`, `animate-slide-up` |
| External animation libraries (GSAP, anime.js) | Not needed, adds bundle size | Tailwind animations + optional motion |
| Static export (`output: 'export'`) | Breaks ISR, API routes | Keep `output: 'standalone'` |
| `generateStaticParams` for landing page | Only needed for dynamic [slug] routes | Default static generation |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.1.3 | React 19.0.0 | Verified working |
| motion 12.x | React 19.0.0 | Use `import { motion } from "motion/react"` |
| @vite-pwa/assets-generator 0.2.x | Node.js 18+ | Standalone CLI, no Vite required |
| Tailwind CSS 3.4.x | Next.js 15 | Works out of box |

## Performance Considerations

### Backdrop-Filter Performance

**Issue:** `backdrop-filter: blur()` is GPU-intensive, can cause jank on mobile.

**Mitigations:**
1. Apply glass effects to small, static elements (cards, not full-screen)
2. Avoid animating glass elements
3. Use `will-change: transform` sparingly
4. Test on low-end devices (Android Go, old iPhones)

### Hero Animation Performance

**Best practices:**
- Use CSS transforms, not layout properties (top, left, width)
- Prefer `opacity` and `transform` for 60fps
- Add `prefers-reduced-motion` support (already in globals.css)
- Limit floating orb count (2-3 max)

## File Checklist for v1.3

### Files to Create

| File | Purpose |
|------|---------|
| `public/logo.svg` | Source image for PWA icon generation |
| `public/icons/*.png` | Generated PWA icons |
| `public/og-image.png` | 1200x630 Open Graph image |
| `src/app/(public)/layout.tsx` | Public page layout (no auth) |
| `src/app/(public)/page.tsx` | Landing page |

### Files to Modify

| File | Change |
|------|--------|
| `public/manifest.json` | Update icon paths after generation |
| `src/app/layout.tsx` | Add metadataBase for OG images |
| `package.json` | Add `generate-pwa-icons` script |

## Sources

### Primary (HIGH confidence)
- [Next.js App Icons Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons) - File conventions for PWA icons
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) - SEO and OG configuration
- [Tailwind CSS Backdrop Blur](https://tailwindcss.com/docs/backdrop-filter-blur) - Official backdrop-filter utilities
- [@vite-pwa/assets-generator CLI](https://vite-pwa-org.netlify.app/assets-generator/cli) - PWA icon generation

### Secondary (MEDIUM confidence)
- [Motion for React Upgrade Guide](https://motion.dev/docs/react-upgrade-guide) - React 19 compatibility confirmed
- [Epic Web Dev Glassmorphism](https://www.epicweb.dev/tips/creating-glassmorphism-effects-with-tailwind-css) - Tailwind glass patterns
- [Next.js 15 SEO Checklist](https://dev.to/vrushikvisavadiya/nextjs-15-seo-checklist-for-developers-in-2025-with-code-examples-57i1) - 2025 best practices

### Verified from Project
- `package.json` - Current dependency versions (Next.js 15.1.3, React 19.0.0, Tailwind 3.4.17)
- `globals.css` - Existing `.glass`, `.glass-subtle`, `.glass-strong` utilities
- `public/manifest.json` - Existing PWA manifest structure
- `next.config.js` - Current configuration (`output: 'standalone'`)
