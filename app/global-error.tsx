"use client"

// Catches errors thrown by the root layout itself. It replaces the entire
// <html> tree, so it must render its own markup and can't rely on globals.css.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          textAlign: "center",
          padding: "0 24px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#0f172a",
          color: "#f8fafc",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
          }}
          aria-hidden="true"
        >
          ⚠️
        </div>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", maxWidth: 380, margin: "8px auto 0" }}>
            The app hit an unexpected error. Your data is safe — try again, and if the problem
            persists, reload the app.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
              Error ref: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            borderRadius: 9999,
            border: "none",
            background: "#ef4444",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
