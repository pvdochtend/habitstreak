'use client'

import Link from 'next/link'
import { CheckCircle, Flame, BarChart3, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * FeatureHighlights - Feature cards grid with secondary CTA
 *
 * Features:
 * - 4 feature cards in responsive grid (1 col mobile, 2 col desktop)
 * - Glassmorphism styling
 * - Lucide icons
 * - Dutch text
 * - Staggered animations
 * - Secondary CTA at bottom
 */
export function FeatureHighlights() {
  const features = [
    {
      icon: CheckCircle,
      title: 'Dagelijkse tracking',
      description: 'Vink je taken af met een voldaan gevoel',
      delay: '0.5s',
    },
    {
      icon: Flame,
      title: 'Streak opbouwen',
      description: 'Bouw een onbreekbare reeks op',
      delay: '0.6s',
    },
    {
      icon: BarChart3,
      title: 'Inzichten',
      description: 'Bekijk je voortgang van de afgelopen week',
      delay: '0.7s',
    },
    {
      icon: Smartphone,
      title: 'Mobiel-first',
      description: 'Ontworpen voor onderweg, werkt overal',
      delay: '0.8s',
    },
  ]

  return (
    <section className="w-full max-w-3xl mx-auto">
      {/* Feature cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="glass rounded-xl p-6 animate-slide-up hover-lift"
            style={{ animationDelay: feature.delay, animationFillMode: 'backwards' }}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary CTA */}
      <div
        className="mt-16 text-center animate-slide-up"
        style={{ animationDelay: '0.9s', animationFillMode: 'backwards' }}
      >
        <p className="text-xl font-semibold mb-4">Klaar om te beginnen?</p>
        <Button asChild size="lg" className="touch-target shadow-lg hover:shadow-xl transition-shadow text-base px-8">
          <Link href="/signup">
            Maak gratis account
          </Link>
        </Button>
      </div>
    </section>
  )
}
