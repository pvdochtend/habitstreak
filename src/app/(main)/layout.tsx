import { getCurrentUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/navigation/bottom-nav'
import { AnimatedBackground } from '@/components/backgrounds/animated-background'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <main className="pb-20 container max-w-2xl mx-auto relative z-10">{children}</main>
      <BottomNav />
    </div>
  )
}
