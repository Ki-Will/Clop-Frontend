"use client"

import { useEffect, useState } from "react"

export function SplashScreen() {
  const [phase, setPhase] = useState<"initial" | "logo" | "text" | "done">("initial")

  useEffect(() => {
    // Staggered reveal: logo first, then wordmark, then fade to transparent
    const t1 = setTimeout(() => setPhase("logo"), 80)
    const t2 = setTimeout(() => setPhase("text"), 500)
    const t3 = setTimeout(() => setPhase("done"), 1000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-[#0f172a] transition-opacity duration-500
        ${phase === "done" ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Radial ambient glow behind logo */}
      <div
        className={`absolute inset-0 flex items-center justify-center
          transition-all duration-700 ease-out
          ${phase === "initial" ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}
        aria-hidden="true"
      >
        <div className="w-64 h-64 rounded-full bg-[#ef4444]/10 blur-3xl" />
      </div>

      {/* Logo mark */}
      <div
        className={`relative z-10 transition-all duration-500 ease-out
          ${phase === "initial" ? "opacity-0 scale-75 translate-y-4" : "opacity-100 scale-100 translate-y-0"}`}
      >
        <ClopLogoMark />
      </div>

      {/* Wordmark + tagline */}
      <div
        className={`relative z-10 mt-6 flex flex-col items-center space-y-1
          transition-all duration-500 ease-out delay-100
          ${phase === "initial" || phase === "logo" ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}
      >
        <span className="text-3xl font-bold tracking-tight text-white">
          Clop
        </span>
        <span className="text-sm font-medium tracking-widest uppercase text-white/40">
          Focus · Lift · Win
        </span>
      </div>

      {/* Loading bar */}
      <div
        className={`absolute bottom-12 left-1/2 -translate-x-1/2
          transition-all duration-500 delay-200
          ${phase === "initial" || phase === "logo" ? "opacity-0" : "opacity-100"}`}
      >
        <div className="w-20 h-0.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full bg-[#ef4444] rounded-full transition-all duration-700 ease-in-out
              ${phase === "text" || phase === "done" ? "w-full" : "w-0"}`}
          />
        </div>
      </div>
    </div>
  )
}

function ClopLogoMark() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_0_24px_rgba(239,68,68,0.5)]"
    >
      {/* Outer rounded square */}
      <rect width="80" height="80" rx="20" fill="#ef4444" />

      {/* Stylised "C" / focus-ring shape — two arcs forming an open circle */}
      {/* Top-left arc segment — represents focus/clock hand */}
      <circle
        cx="40"
        cy="40"
        r="20"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="94.2"
        strokeDashoffset="24"
        fill="none"
        transform="rotate(-90 40 40)"
      />

      {/* Centre dot — the "beat" */}
      <circle cx="40" cy="40" r="5" fill="white" />

      {/* Small tick mark at the 12 o'clock position — progress indicator */}
      <line
        x1="40"
        y1="16"
        x2="40"
        y2="22"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  )
}
