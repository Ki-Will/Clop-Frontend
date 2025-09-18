"use client"

import { useState, useEffect } from "react"
import { SplashScreen } from "@/components/splash-screen"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { AuthFlow } from "@/components/auth-flow"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<"splash" | "onboarding" | "auth" | "dashboard">("splash")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Simulate splash screen duration
    const timer = setTimeout(() => {
      setCurrentScreen("onboarding")
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleOnboardingComplete = () => {
    setCurrentScreen("auth")
  }

  const handleAuthComplete = () => {
    setIsAuthenticated(true)
    setCurrentScreen("dashboard")
  }

  return (
    <main className="min-h-screen bg-background">
      {currentScreen === "splash" && <SplashScreen />}
      {currentScreen === "onboarding" && <OnboardingFlow onComplete={handleOnboardingComplete} />}
      {currentScreen === "auth" && <AuthFlow onComplete={handleAuthComplete} />}
      {currentScreen === "dashboard" && <Dashboard />}
    </main>
  )
}
