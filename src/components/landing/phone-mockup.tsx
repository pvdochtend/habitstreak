'use client'

import { Check } from 'lucide-react'

/**
 * PhoneMockup - Phone frame with stylized app preview
 *
 * Features:
 * - Realistic phone frame with rounded corners and notch
 * - Stylized "Today" view showing tasks
 * - Gradient border for modern look
 * - Subtle shadow and tilt effect
 * - Responsive sizing
 */
export function PhoneMockup() {
  return (
    <section
      className="animate-slide-up"
      style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
    >
      {/* Phone frame with gradient border */}
      <div
        className="relative mx-auto w-[280px] md:w-[320px]"
        style={{
          perspective: '1000px',
        }}
      >
        <div
          className="relative rounded-[3rem] bg-gradient-to-br from-primary/30 via-primary/10 to-transparent p-1 shadow-2xl"
          style={{
            transform: 'rotateY(-5deg) rotateX(2deg)',
          }}
        >
          {/* Phone inner frame */}
          <div className="rounded-[2.75rem] bg-gray-900 p-2">
            {/* Screen area */}
            <div className="relative rounded-[2.25rem] bg-background overflow-hidden h-[500px] md:h-[580px]">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />

              {/* App content preview */}
              <div className="p-4 pt-10 h-full overflow-hidden">
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Vandaag</h2>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: '66%' }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      2 / 3
                    </span>
                  </div>
                </div>

                {/* Daily target card */}
                <div className="glass rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Dagelijks doel</p>
                      <p className="text-xl font-bold">2 / 2</p>
                    </div>
                    <div className="text-green-600 font-semibold text-sm flex items-center gap-1">
                      <span className="text-lg">&#10003;</span>
                      <span>Behaald!</span>
                    </div>
                  </div>
                </div>

                {/* Task list */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">Je taken</h3>

                  {/* Task 1 - completed */}
                  <TaskPreviewItem
                    name="Mediteren"
                    emoji="&#128171;"
                    isCompleted={true}
                  />

                  {/* Task 2 - completed */}
                  <TaskPreviewItem
                    name="Sporten"
                    emoji="&#128170;"
                    isCompleted={true}
                  />

                  {/* Task 3 - not completed */}
                  <TaskPreviewItem
                    name="Lezen"
                    emoji="&#128218;"
                    isCompleted={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * TaskPreviewItem - Static preview of a task item for the mockup
 */
function TaskPreviewItem({
  name,
  emoji,
  isCompleted,
}: {
  name: string
  emoji: string
  isCompleted: boolean
}) {
  return (
    <div className={`glass rounded-xl p-3 flex items-center gap-3 ${isCompleted ? 'opacity-80' : ''}`}>
      {/* Checkbox */}
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          isCompleted
            ? 'bg-primary border-primary'
            : 'border-muted-foreground/30'
        }`}
      >
        {isCompleted && (
          <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
        )}
      </div>

      {/* Task content */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg" dangerouslySetInnerHTML={{ __html: emoji }} />
        <span className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
          {name}
        </span>
      </div>
    </div>
  )
}
