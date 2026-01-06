import { getCurrentUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/navigation/bottom-nav'

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
    <div className="min-h-screen bg-background">
      <main className="pb-20 container max-w-2xl mx-auto">{children}</main>
      <BottomNav />
    </div>
  )
}
