'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * HeroSection - Landing page hero with headline, subheadline, and CTAs
 *
 * Features:
 * - Dutch text for all user-facing content
 * - Glassmorphism styling
 * - Animations: fade-in container, slide-up text elements
 * - Responsive typography
 * - Primary CTA (signup) and secondary link (login)
 */
export function HeroSection() {
  return (
    <section className="flex flex-col items-center text-center animate-fade-in">
      <div className="glass-strong rounded-2xl p-8 md:p-12 max-w-2xl w-full shadow-xl">
        {/* Headline */}
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 animate-slide-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
        >
          Bouw gewoontes die{' '}
          <span className="text-primary">blijven hangen</span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto animate-slide-up"
          style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
        >
          Track je dagelijkse taken, bouw streaks op, en maak van discipline een feestje.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
        >
          <Button asChild size="lg" className="touch-target shadow-lg hover:shadow-xl transition-shadow text-base px-8">
            <Link href="/signup">
              Aan de slag
            </Link>
          </Button>

          <p className="text-sm text-muted-foreground">
            Al een account?{' '}
            <Link
              href="/login"
              className="text-primary hover:underline font-semibold transition-all"
            >
              Inloggen
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
