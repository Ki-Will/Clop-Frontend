const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export interface User {
  id: number
  email: string
  username: string
  phone?: string
  address?: string
  createdAt: string
}

export interface TaskItem {
  id: number
  userId: number
  title: string
  category: string
  durationMinutes: number
  completed: boolean
  color: string
  createdAt: string
  updatedAt: string
}

export interface UserStats {
  totalSessions: number
  totalFocusMinutes: number
  totalFocusHours: string
  completedTasksCount: number
  dayStreak: number
  todaysSessionsCount: number
  dailyGoalCount: number
  dailyProgress: number
}

export interface UserSettingsData {
  id: number
  userId: number
  notifications: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

// Local Storage Fallback Helpers
const isBrowser = typeof window !== "undefined"

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (!isBrowser) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 1,
    userId: 1,
    title: "Complete project proposal",
    category: "Work",
    durationMinutes: 25,
    completed: false,
    color: "bg-blue-500",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    title: "Read chapter 4 of book",
    category: "Personal",
    durationMinutes: 20,
    completed: true,
    color: "bg-emerald-500",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: 1,
    title: "Design mobile app wireframes",
    category: "Design",
    durationMinutes: 45,
    completed: false,
    color: "bg-purple-500",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

function getLocalCurrentUser(): User {
  const user = getStorageItem<User | null>("clop_current_user", null)
  if (user) return user

  const defaultUser: User = {
    id: 1,
    email: "user@example.com",
    username: (isBrowser && localStorage.getItem("username")) || "Demo User",
    createdAt: new Date().toISOString(),
  }
  setStorageItem("clop_current_user", defaultUser)
  return defaultUser
}

function computeLocalStats(userId: number): UserStats {
  const tasks = getStorageItem<TaskItem[]>(`clop_tasks_${userId}`, DEFAULT_TASKS)
  const sessions = getStorageItem<Array<{ id: number; durationMinutes: number; completedAt: string }>>(
    `clop_sessions_${userId}`,
    [],
  )

  const completedTasksCount = tasks.filter((t) => t.completed).length

  const totalSessions = sessions.length
  const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0)
  const totalFocusHours = `${(totalFocusMinutes / 60).toFixed(1)}h`

  const todayStr = new Date().toISOString().split("T")[0]
  const todaysSessions = sessions.filter((s) => s.completedAt && s.completedAt.startsWith(todayStr))
  const todaysSessionsCount = todaysSessions.length

  const dailyGoalCount = 4
  const dailyProgress = Math.min(100, Math.round((todaysSessionsCount / dailyGoalCount) * 100))

  const uniqueDates = Array.from(new Set(sessions.map((s) => s.completedAt.split("T")[0]))).sort()
  const dayStreak = uniqueDates.length

  return {
    totalSessions,
    totalFocusMinutes,
    totalFocusHours,
    completedTasksCount,
    dayStreak: Math.max(1, dayStreak),
    todaysSessionsCount,
    dailyGoalCount,
    dailyProgress,
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = isBrowser ? localStorage.getItem("clop_token") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "An unexpected error occurred"
      throw new ApiError(message, response.status)
    }

    return data as T
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(error?.message || "Backend server unreachable", 503)
  }
}

export const apiClient = {
  auth: {
    register: async (payload: { email: string; password: string; username?: string; phone?: string; address?: string }) => {
      try {
        const res = await request<{ user: User; token: string }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        setStorageItem("clop_current_user", res.user)
        return res
      } catch (err: any) {
        if (err instanceof ApiError && err.status < 500) throw err
        // Fallback for offline / unreachable server
        const newUser: User = {
          id: Date.now(),
          email: payload.email,
          username: payload.username || payload.email.split("@")[0],
          phone: payload.phone,
          address: payload.address,
          createdAt: new Date().toISOString(),
        }
        const token = `mock-token-${Date.now()}`
        setStorageItem("clop_current_user", newUser)
        if (isBrowser) localStorage.setItem("clop_token", token)
        return { user: newUser, token }
      }
    },

    login: async (payload: { email: string; password: string }) => {
      try {
        const res = await request<{ user: User; token: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        setStorageItem("clop_current_user", res.user)
        return res
      } catch (err: any) {
        if (err instanceof ApiError && err.status < 500) throw err
        // Fallback for offline / unreachable server
        const user: User = {
          id: 1,
          email: payload.email,
          username: (isBrowser && localStorage.getItem("username")) || payload.email.split("@")[0],
          createdAt: new Date().toISOString(),
        }
        const token = `mock-token-${Date.now()}`
        setStorageItem("clop_current_user", user)
        if (isBrowser) localStorage.setItem("clop_token", token)
        return { user, token }
      }
    },

    getMe: async () => {
      try {
        const user = await request<User>("/auth/me")
        setStorageItem("clop_current_user", user)
        return user
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) throw err
        return getLocalCurrentUser()
      }
    },
  },

  users: {
    getProfile: async () => {
      try {
        return await request<User>("/users/me")
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) throw err
        return getLocalCurrentUser()
      }
    },

    updateProfile: async (payload: { username?: string; phone?: string; address?: string }) => {
      try {
        const updated = await request<User>("/users/me", {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
        setStorageItem("clop_current_user", updated)
        return updated
      } catch (err: any) {
        if (err instanceof ApiError && err.status < 500) throw err
        const currentUser = getLocalCurrentUser()
        const updated: User = {
          ...currentUser,
          ...(payload.username ? { username: payload.username } : {}),
          ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
          ...(payload.address !== undefined ? { address: payload.address } : {}),
        }
        setStorageItem("clop_current_user", updated)
        return updated
      }
    },

    clearData: async () => {
      const user = getLocalCurrentUser()
      try {
        return await request<{ success: boolean; message: string }>("/users/me/data", { method: "DELETE" })
      } catch (err: any) {
        if (err instanceof ApiError && err.status < 500) throw err
        setStorageItem(`clop_tasks_${user.id}`, [])
        setStorageItem(`clop_sessions_${user.id}`, [])
        return { success: true, message: "Local data cleared" }
      }
    },
  },

  tasks: {
    getTasks: async () => {
      const user = getLocalCurrentUser()
      try {
        const tasks = await request<TaskItem[]>("/tasks")
        setStorageItem(`clop_tasks_${user.id}`, tasks)
        return tasks
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) throw err
        return getStorageItem<TaskItem[]>(`clop_tasks_${user.id}`, DEFAULT_TASKS)
      }
    },

    createTask: async (payload: { title: string; category?: string; durationMinutes?: number; color?: string }) => {
      const user = getLocalCurrentUser()
      try {
        const task = await request<TaskItem>("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        const existing = getStorageItem<TaskItem[]>(`clop_tasks_${user.id}`, DEFAULT_TASKS)
        setStorageItem(`clop_tasks_${user.id}`, [task, ...existing])
        return task
      } catch (err: any) {
        if (err instanceof ApiError && err.status < 500) throw err
        const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500"]
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        const newTask: TaskItem = {
          id: Date.now(),
          userId: user.id,
          title: payload.title,
          category: payload.category || "General",
          durationMinutes: payload.durationMinutes || 25,
          completed: false,
          color: payload.color || randomColor,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const existing = getStorageItem<TaskItem[]>(`clop_tasks_${user.id}`, DEFAULT_TASKS)
        const updatedTasks = [newTask, ...existing]
        setStorageItem(`clop_tasks_${user.id}`, updatedTasks)
        return newTask
      }
    },

    updateTask: async (
      id: number,
      payload: { title?: string; category?: string; durationMinutes?: number; completed?: boolean; color?: string },
    ) => {
      const user = getLocalCurrentUser()
      try {
        const updated = await request<TaskItem>(`/tasks/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
        const existing = getStorageItem<TaskItem[]>(`clop_tasks_${user.id}`, DEFAULT_TASKS)
        setStorageItem(
          `clop_tasks_${user.id}`,
          existing.map((t) => (t.id === id ? updated : t)),
        )
        return updated
      } catch (err: any) {
        if (err instanceof ApiError && err.status < 500) throw err
        const existing = getStorageItem<TaskItem[]>(`clop_tasks_${user.id}`, DEFAULT_TASKS)
        let updatedTask: TaskItem | null = null
        const updatedList = existing.map((t) => {
          if (t.id === id) {
            updatedTask = {
              ...t,
              ...payload,
              updatedAt: new Date().toISOString(),
            }
            return updatedTask
          }
          return t
        })
        setStorageItem(`clop_tasks_${user.id}`, updatedList)
        if (!updatedTask) throw new ApiError("Task not found", 404)
        return updatedTask
      }
    },

    deleteTask: async (id: number) => {
      const user = getLocalCurrentUser()
      try {
        const res = await request<{ success: boolean }>(`/tasks/${id}`, { method: "DELETE" })
        const existing = getStorageItem<TaskItem[]>(`clop_tasks_${user.id}`, DEFAULT_TASKS)
        setStorageItem(
          `clop_tasks_${user.id}`,
          existing.filter((t) => t.id !== id),
        )
        return res
      } catch (err: any) {
        if (err instanceof ApiError && err.status < 500) throw err
        const existing = getStorageItem<TaskItem[]>(`clop_tasks_${user.id}`, DEFAULT_TASKS)
        setStorageItem(
          `clop_tasks_${user.id}`,
          existing.filter((t) => t.id !== id),
        )
        return { success: true }
      }
    },
  },

  sessions: {
    createSession: async (payload: { taskId?: number; durationMinutes?: number }) => {
      const user = getLocalCurrentUser()
      try {
        return await request<{ id: number; durationMinutes: number; completedAt: string }>("/sessions", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      } catch (err: any) {
        if (err instanceof ApiError && err.status < 500) throw err
        const newSession = {
          id: Date.now(),
          durationMinutes: payload.durationMinutes || 25,
          completedAt: new Date().toISOString(),
        }
        const existing = getStorageItem<Array<{ id: number; durationMinutes: number; completedAt: string }>>(
          `clop_sessions_${user.id}`,
          [],
        )
        setStorageItem(`clop_sessions_${user.id}`, [newSession, ...existing])
        return newSession
      }
    },

    getStats: async () => {
      const user = getLocalCurrentUser()
      try {
        return await request<UserStats>("/sessions/stats")
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) throw err
        return computeLocalStats(user.id)
      }
    },
  },

  settings: {
    getSettings: async () => {
      const user = getLocalCurrentUser()
      try {
        return await request<UserSettingsData>("/settings")
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) throw err
        const defaultSettings: UserSettingsData = {
          id: 1,
          userId: user.id,
          notifications: true,
          soundEnabled: true,
          vibrationEnabled: false,
        }
        return getStorageItem<UserSettingsData>(`clop_settings_${user.id}`, defaultSettings)
      }
    },

    updateSettings: async (payload: { notifications?: boolean; soundEnabled?: boolean; vibrationEnabled?: boolean }) => {
      const user = getLocalCurrentUser()
      try {
        const updated = await request<UserSettingsData>("/settings", {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
        setStorageItem(`clop_settings_${user.id}`, updated)
        return updated
      } catch (err: any) {
        if (err instanceof ApiError && err.status < 500) throw err
        const defaultSettings: UserSettingsData = {
          id: 1,
          userId: user.id,
          notifications: true,
          soundEnabled: true,
          vibrationEnabled: false,
        }
        const currentSettings = getStorageItem<UserSettingsData>(`clop_settings_${user.id}`, defaultSettings)
        const updatedSettings = { ...currentSettings, ...payload }
        setStorageItem(`clop_settings_${user.id}`, updatedSettings)
        return updatedSettings
      }
    },

    exportData: async () => {
      const user = getLocalCurrentUser()
      try {
        return await request<any>("/settings/export")
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) throw err
        const tasks = getStorageItem<TaskItem[]>(`clop_tasks_${user.id}`, DEFAULT_TASKS)
        const sessions = getStorageItem<Array<any>>(`clop_sessions_${user.id}`, [])
        const settings = getStorageItem<UserSettingsData>(`clop_settings_${user.id}`, {
          id: 1,
          userId: user.id,
          notifications: true,
          soundEnabled: true,
          vibrationEnabled: false,
        })
        const stats = computeLocalStats(user.id)
        return {
          user,
          tasks,
          sessions,
          settings,
          stats,
          exportedAt: new Date().toISOString(),
        }
      }
    },
  },
}
