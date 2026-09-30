"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Full context goes to the console; the UI only ever shows a friendly message
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
        <span className="text-3xl" aria-hidden="true">
          ⚠️
        </span>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          An unexpected error occurred. Your data is safe — try again, and if the problem
          persists, reload the app.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">Error ref: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
      >
        Try again
      </button>
    </div>
  )
}
