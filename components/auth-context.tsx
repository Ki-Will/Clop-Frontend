"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { apiClient, User, UpdateProfilePayload } from "@/lib/api-client"

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: { email: string; password: string; username?: string; phone?: string; address?: string }) => Promise<void>
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem("clop_token")
    if (savedToken) {
      setToken(savedToken)
      apiClient.auth
        .getMe()
        .then((userData) => {
          setUser(userData)
          void syncPendingOnboarding()
        })
        .catch((err) => {
          console.warn("Could not restore session:", err)
          localStorage.removeItem("clop_token")
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Onboarding runs before the user has an account, so its answers are
  // staged in localStorage and pushed to the backend once authenticated.
  // The flag stays set on failure so the next session retries.
  const syncPendingOnboarding = async () => {
    if (typeof window === "undefined") return
    if (localStorage.getItem("clop_pending_sync") !== "true") return

    const pref = localStorage.getItem("clop_notification_pref")
    const target = parseInt(localStorage.getItem("clop_daily_target") || "", 10)

    try {
      await apiClient.users.updateProfile({
        experienceLevel: localStorage.getItem("clop_experience_level") || undefined,
        workoutFrequency: parseInt(localStorage.getItem("clop_workout_frequency") || "", 10) || undefined,
        preferredWorkoutDuration: parseInt(localStorage.getItem("clop_workout_duration") || "", 10) || undefined,
        notificationPreference: pref || undefined,
      })
      await apiClient.settings.updateSettings({
        ...(target >= 1 && { dailyGoalCount: target }),
        gymMode: localStorage.getItem("clop_gym_mode") === "true",
        notifications: pref !== "none",
      })
      localStorage.removeItem("clop_pending_sync")
    } catch (err) {
      // Offline or rejected — keep the flag so the next authenticated session retries
      console.warn("Onboarding sync deferred:", err)
    }
  }

  const login = async (email: string, password: string) => {
    const res = await apiClient.auth.login({ email, password })
    localStorage.setItem("clop_token", res.token)
    if (res.user.username) {
      localStorage.setItem("username", res.user.username)
    }
    setToken(res.token)
    setUser(res.user)
    void syncPendingOnboarding()
  }

  const register = async (payload: { email: string; password: string; username?: string; phone?: string; address?: string }) => {
    const res = await apiClient.auth.register(payload)
    localStorage.setItem("clop_token", res.token)
    if (res.user.username) {
      localStorage.setItem("username", res.user.username)
    }
    setToken(res.token)
    setUser(res.user)
    void syncPendingOnboarding()
  }

  const updateProfile = async (payload: UpdateProfilePayload) => {
    const updated = await apiClient.users.updateProfile(payload)
    setUser(updated)
    if (updated.username) {
      localStorage.setItem("username", updated.username)
    }
  }

  const logout = () => {
    localStorage.removeItem("clop_token")
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const userData = await apiClient.auth.getMe()
      setUser(userData)
    } catch (err) {
      console.warn("Failed to refresh user profile:", err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        updateProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
