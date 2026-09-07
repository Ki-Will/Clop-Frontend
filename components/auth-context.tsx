"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { apiClient, User } from "@/lib/api-client"

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: { email: string; password: string; username?: string; phone?: string; address?: string }) => Promise<void>
  updateProfile: (payload: { username?: string; phone?: string; address?: string }) => Promise<void>
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
        })
        .catch(() => {
          localStorage.removeItem("clop_token")
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await apiClient.auth.login({ email, password })
    localStorage.setItem("clop_token", res.token)
    if (res.user.username) {
      localStorage.setItem("username", res.user.username)
    }
    setToken(res.token)
    setUser(res.user)
  }

  const register = async (payload: { email: string; password: string; username?: string; phone?: string; address?: string }) => {
    const res = await apiClient.auth.register(payload)
    localStorage.setItem("clop_token", res.token)
    if (res.user.username) {
      localStorage.setItem("username", res.user.username)
    }
    setToken(res.token)
    setUser(res.user)
  }

  const updateProfile = async (payload: { username?: string; phone?: string; address?: string }) => {
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
    } catch {}
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
