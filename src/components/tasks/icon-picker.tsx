'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { TASK_ICONS, getTaskIcon } from '@/lib/task-icons'
import { cn } from '@/lib/utils'

interface IconPickerProps {
  value: string | null | undefined
  onChange: (iconName: string) => void
  disabled?: boolean
}

export function IconPicker({ value, onChange, disabled }: IconPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', label: 'Alle' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'wellness', label: 'Welzijn' },
    { id: 'productivity', label: 'Productiviteit' },
    { id: 'daily', label: 'Dagelijks' },
  ]

  const filteredIcons =
    selectedCategory === 'all'
      ? TASK_ICONS
      : TASK_ICONS.filter((icon) => icon.category === selectedCategory)

  return (
    <div className="space-y-3">
      <Label>Icoon (optioneel)</Label>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-6 gap-2 max-h-[240px] overflow-y-auto p-1 border rounded-lg">
        {filteredIcons.map(({ name, icon: Icon, label }) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            disabled={disabled}
            title={label}
            className={cn(
              'flex items-center justify-center p-3 rounded-lg transition-all',
              'hover:bg-accent hover:scale-110 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              value === name
                ? 'bg-primary text-primary-foreground shadow-md scale-110'
                : 'bg-card border border-border'
            )}
            aria-label={label}
            aria-pressed={value === name}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      {/* Selected Icon Preview */}
      {value && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {(() => {
            const SelectedIcon = getTaskIcon(value)
            return <SelectedIcon className="h-4 w-4" />
          })()}
          <span>
            Geselecteerd: {TASK_ICONS.find((i) => i.name === value)?.label}
          </span>
        </div>
      )}
    </div>
  )
}
