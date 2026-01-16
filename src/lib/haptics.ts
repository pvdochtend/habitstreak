/**
 * Haptic feedback utility for mobile devices
 * Uses the Navigator Vibration API with graceful fallback
 */

/**
 * Check if vibration is supported
 */
export function isHapticSupported(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 * @param type - Preset type: 'light' (10ms), 'medium' (20ms), 'heavy' (30ms), 'success' (pattern), 'error' (pattern)
 */
export function triggerHaptic(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'medium'
): void {
  if (!isHapticSupported()) return;

  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [15, 50, 25], // short-pause-longer for completion feel
    error: [50, 50, 50],   // triple pulse for error
  };

  try {
    navigator.vibrate(patterns[type]);
  } catch {
    // Silently fail - haptics are non-critical
  }
}
