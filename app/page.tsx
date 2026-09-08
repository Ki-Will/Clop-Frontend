"use client"

import { useState, useEffect } from "react"
import { SplashScreen } from "@/components/splash-screen"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { AuthFlow } from "@/components/auth-flow"
import { Dashboard } from "@/components/dashboard"
import { AuthProvider, useAuth } from "@/components/auth-context"
import { Toaster } from "@/components/ui/sonner"

function MainContent() {
  const { user, loading } = useAuth()
  const [currentScreen, setCurrentScreen] = useState<"splash" | "onboarding" | "auth" | "dashboard">("splash")

  useEffect(() => {
    if (loading) return

    const timer = setTimeout(() => {
      if (user) {
        setCurrentScreen("dashboard")
      } else {
        const hasSeenOnboarding = typeof window !== "undefined" ? localStorage.getItem("has_seen_onboarding") : null
        setCurrentScreen(hasSeenOnboarding ? "auth" : "onboarding")
      }
    }, 1200)

    return () => clearTimeout(timer)
  }, [user, loading])

  const handleOnboardingComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("has_seen_onboarding", "true")
    }
    if (user) {
      setCurrentScreen("dashboard")
    } else {
      setCurrentScreen("auth")
    }
  }

  const handleAuthComplete = () => {
    setCurrentScreen("dashboard")
  }

  if (loading || currentScreen === "splash") {
    return <SplashScreen />
  }

  return (
    <main className="min-h-screen bg-background">
      {currentScreen === "onboarding" && <OnboardingFlow onComplete={handleOnboardingComplete} />}
      {currentScreen === "auth" && !user && <AuthFlow onComplete={handleAuthComplete} />}
      {currentScreen === "dashboard" && <Dashboard />}
      <Toaster position="top-right" />
    </main>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  )
}
