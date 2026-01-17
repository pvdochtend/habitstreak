interface AnimatedStreakNumberProps {
  value: number;
  previousValue?: number;
}

/**
 * Animated streak number component with CSS-based rolling animation
 *
 * Displays a single or double-digit number that rolls vertically when the value changes.
 * Uses pure CSS translateY transforms for GPU-accelerated animation.
 *
 * @param value - Current streak number to display (0-99)
 * @param previousValue - Previous value (used to trigger animation)
 */
export function AnimatedStreakNumber({ value, previousValue }: AnimatedStreakNumberProps) {
  const shouldAnimate = previousValue !== undefined && value !== previousValue;

  // Handle single-digit numbers (0-9)
  if (value < 10) {
    return (
      <span className="inline-block relative h-[1em] overflow-hidden align-baseline">
        <span
          className={`flex flex-col ${shouldAnimate ? 'transition-transform duration-500 ease-out' : ''}`}
          style={{ transform: `translateY(-${value * 1}em)` }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <span key={digit} className="h-[1em] leading-none flex items-center justify-center">
              {digit}
            </span>
          ))}
        </span>
      </span>
    );
  }

  // Handle double-digit numbers (10-99)
  const tensDigit = Math.floor(value / 10);
  const onesDigit = value % 10;
  const prevTensDigit = previousValue !== undefined ? Math.floor(previousValue / 10) : undefined;
  const prevOnesDigit = previousValue !== undefined ? previousValue % 10 : undefined;

  return (
    <span className="inline-flex">
      {/* Tens digit roller */}
      <span className="inline-block relative h-[1em] overflow-hidden align-baseline">
        <span
          className={`flex flex-col ${shouldAnimate && prevTensDigit !== tensDigit ? 'transition-transform duration-500 ease-out' : ''}`}
          style={{ transform: `translateY(-${tensDigit * 1}em)` }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <span key={digit} className="h-[1em] leading-none flex items-center justify-center">
              {digit}
            </span>
          ))}
        </span>
      </span>
      {/* Ones digit roller */}
      <span className="inline-block relative h-[1em] overflow-hidden align-baseline">
        <span
          className={`flex flex-col ${shouldAnimate && prevOnesDigit !== onesDigit ? 'transition-transform duration-500 ease-out' : ''}`}
          style={{ transform: `translateY(-${onesDigit * 1}em)` }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <span key={digit} className="h-[1em] leading-none flex items-center justify-center">
              {digit}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
