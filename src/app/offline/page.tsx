'use client'

import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="glass rounded-2xl p-8 max-w-sm text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">Je bent offline</h1>
        <p className="text-muted-foreground">
          Controleer je internetverbinding en probeer het opnieuw.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors touch-target"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  )
}
