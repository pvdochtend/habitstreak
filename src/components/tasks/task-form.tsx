'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Task, SchedulePreset, ApiResponse } from '@/types'
import { getSchedulePresetLabel } from '@/lib/schedule'
import { IconPicker } from './icon-picker'

interface TaskFormProps {
  task?: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TaskForm({ task, open, onOpenChange, onSuccess }: TaskFormProps) {
  const isEdit = !!task

  // Use task prop directly as initial values, key on task.id forces remount
  const [title, setTitle] = useState('')
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>('ALL_WEEK')
  const [icon, setIcon] = useState<string>('CheckSquare')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form whenever dialog opens or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        // Edit mode - load task data
        setTitle(task.title)
        setSchedulePreset(task.schedulePreset)
        setIcon(task.icon || 'CheckSquare')
      } else {
        // Create mode - reset to defaults
        setTitle('')
        setSchedulePreset('ALL_WEEK')
        setIcon('CheckSquare')
      }
      setError(null)
    }
  }, [open, task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const url = isEdit ? `/api/tasks/${task.id}` : '/api/tasks'
      const method = isEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          schedulePreset,
          icon,
        }),
      })

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Er is een fout opgetreden')
      }

      // Reset form
      setTitle('')
      setSchedulePreset('ALL_WEEK')
      setIcon('CheckSquare')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Taak bewerken' : 'Nieuwe taak'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Wijzig de details van je taak.'
              : 'Maak een nieuwe gewoonte om bij te houden.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-0">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. Meditatie, Sporten, Lezen"
              required
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule">Schema</Label>
            <Select
              id="schedule"
              value={schedulePreset}
              onChange={(e) => setSchedulePreset(e.target.value as SchedulePreset)}
              disabled={isLoading}
            >
              <option value="ALL_WEEK">{getSchedulePresetLabel('ALL_WEEK')}</option>
              <option value="WORKWEEK">{getSchedulePresetLabel('WORKWEEK')}</option>
              <option value="WEEKEND">{getSchedulePresetLabel('WEEKEND')}</option>
            </Select>
            <p className="text-xs text-muted-foreground">
              Op welke dagen wil je deze taak volbrengen?
            </p>
          </div>

          <IconPicker value={icon} onChange={setIcon} disabled={isLoading} />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Bezig...' : isEdit ? 'Opslaan' : 'Aanmaken'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
