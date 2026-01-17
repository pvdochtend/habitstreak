import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedFlameProps {
  isActive: boolean;
  className?: string;
}

/**
 * Animated flame icon for active streaks
 *
 * Wraps Lucide Flame icon with CSS flicker and glow animations when active.
 * When inactive, displays static gray flame. Respects prefers-reduced-motion.
 *
 * @param isActive - Whether streak is active (> 0)
 * @param className - Optional additional classes
 */
export function AnimatedFlame({ isActive, className }: AnimatedFlameProps) {
  return (
    <div className={cn(isActive && 'animate-flame-glow')}>
      <Flame
        className={cn(
          'h-6 w-6',
          isActive && 'animate-flame-flicker text-orange-500',
          !isActive && 'text-muted-foreground',
          className
        )}
        strokeWidth={2.5}
      />
    </div>
  );
}
