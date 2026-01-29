import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-helpers'
import { HeroSection } from '@/components/landing/hero-section'
import { PhoneMockup } from '@/components/landing/phone-mockup'
import { FeatureHighlights } from '@/components/landing/feature-highlights'
import { AnimatedBackground } from '@/components/backgrounds/animated-background'
import { InstallBanner } from '@/components/pwa/install-banner'

export default async function HomePage() {
  const user = await getCurrentUser()

  // Authenticated users go directly to the app
  if (user) {
    redirect('/vandaag')
  }

  // Unauthenticated users see the landing page
  return (
    <main className="min-h-svh relative">
      <AnimatedBackground />
      <div className="flex flex-col items-center gap-16 md:gap-24 p-4 md:p-8 pt-12 md:pt-20 pb-16">
        <HeroSection />
        <PhoneMockup />
        <FeatureHighlights />
      </div>
      <InstallBanner />
    </main>
  )
}
