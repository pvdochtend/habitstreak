'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, CheckSquare, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    name: 'Vandaag',
    href: '/vandaag',
    icon: Home,
  },
  {
    name: 'Inzichten',
    href: '/inzichten',
    icon: TrendingUp,
  },
  {
    name: 'Taken',
    href: '/taken',
    icon: CheckSquare,
  },
  {
    name: 'Instellingen',
    href: '/instellingen',
    icon: Settings,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 shadow-lg pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full touch-target transition-all duration-200',
                'active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn(
                'h-5 w-5 transition-transform duration-200',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-xs font-medium transition-all duration-200',
                isActive && 'font-semibold'
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
