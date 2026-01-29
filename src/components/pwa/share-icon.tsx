interface IosShareIconProps {
  className?: string
}

/**
 * iOS Share icon matching SF Symbols "square.and.arrow.up"
 * Used in the iOS Add to Home Screen walkthrough to help users
 * recognize the familiar Safari share button
 */
export function IosShareIcon({ className }: IosShareIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Arrow pointing up */}
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      {/* Rounded rectangle with open top */}
      <path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" />
    </svg>
  )
}
