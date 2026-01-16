import confetti from 'canvas-confetti';

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Fire confetti for task completion
 * @param origin - Origin point {x, y} as ratios of viewport (0-1)
 */
export function fireTaskConfetti(origin?: { x: number; y: number }): void {
  // Skip confetti for reduced motion preference
  if (prefersReducedMotion()) return;

  // Default to center-ish if no origin provided
  const defaultOrigin = { x: 0.5, y: 0.6 };
  const finalOrigin = origin || defaultOrigin;

  // Small, quick confetti burst - not overwhelming
  confetti({
    particleCount: 30,
    spread: 60,
    origin: finalOrigin,
    colors: [
      '#3b82f6', // blue-500 (primary blue)
      '#ec4899', // pink-500 (primary pink)
      '#22c55e', // green-500
      '#f59e0b', // amber-500
      '#8b5cf6', // violet-500
    ],
    startVelocity: 25,
    gravity: 1.2,
    ticks: 60,
    scalar: 0.8, // Slightly smaller particles
    shapes: ['circle', 'square'],
    disableForReducedMotion: true, // Built-in reduced motion support
  });
}

/**
 * Fire larger confetti for all tasks complete (used in Phase 4)
 * Exported for future use
 */
export function fireAllTasksConfetti(): void {
  if (prefersReducedMotion()) return;

  // Bigger celebration for completing all tasks
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6'],
    startVelocity: 35,
    gravity: 1,
    ticks: 100,
    scalar: 1,
    disableForReducedMotion: true,
  });
}
