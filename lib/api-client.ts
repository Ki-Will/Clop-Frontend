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

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("clop_token") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

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
}

export const apiClient = {
  auth: {
    register: (payload: { email: string; password: string; username?: string; phone?: string; address?: string }) =>
      request<{ user: User; token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    login: (payload: { email: string; password: string }) =>
      request<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getMe: () => request<User>("/auth/me"),
  },

  users: {
    getProfile: () => request<User>("/users/me"),

    updateProfile: (payload: { username?: string; phone?: string; address?: string }) =>
      request<User>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    clearData: () => request<{ success: boolean; message: string }>("/users/me/data", { method: "DELETE" }),
  },

  tasks: {
    getTasks: () => request<TaskItem[]>("/tasks"),

    createTask: (payload: { title: string; category?: string; durationMinutes?: number; color?: string }) =>
      request<TaskItem>("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    updateTask: (id: number, payload: { title?: string; category?: string; durationMinutes?: number; completed?: boolean; color?: string }) =>
      request<TaskItem>(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    deleteTask: (id: number) => request<{ success: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
  },

  sessions: {
    createSession: (payload: { taskId?: number; durationMinutes?: number }) =>
      request<{ id: number; durationMinutes: number; completedAt: string }>("/sessions", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getStats: () => request<UserStats>("/sessions/stats"),
  },

  settings: {
    getSettings: () => request<UserSettingsData>("/settings"),

    updateSettings: (payload: { notifications?: boolean; soundEnabled?: boolean; vibrationEnabled?: boolean }) =>
      request<UserSettingsData>("/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    exportData: () => request<any>("/settings/export"),
  },
}
