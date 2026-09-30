const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export interface User {
  id: number
  email: string
  username: string
  phone?: string
  address?: string
  // Onboarding profile fields
  experienceLevel?: string
  workoutFrequency?: number
  preferredWorkoutDuration?: number
  notificationPreference?: string
  createdAt: string
}

export interface UpdateProfilePayload {
  username?: string
  phone?: string
  address?: string
  experienceLevel?: string
  workoutFrequency?: number
  preferredWorkoutDuration?: number
  notificationPreference?: string
}

export interface TaskItem {
  id: number
  userId: number
  title: string
  category: string
  durationMinutes: number
  completed: boolean
  color: string
  // Gym mode fields
  isGymExercise: boolean
  setsPlanned: number | null
  repsPerSet: number | null
  weightKg: number | null
  restSeconds: number | null
  muscleGroup: string | null
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
  gymMode: boolean
  restTimerSeconds: number
  autoRestTimer: boolean
  weightUnit: string
  dailyGoalCount: number
}

export interface GymExercise {
  id: number
  userId: number
  name: string
  muscleGroup: string
  defaultSets: number
  defaultReps: number
  defaultWeight: number | null
  restSeconds: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface GymSessionLog {
  id: number
  userId: number
  exerciseId: number
  taskId: number | null
  setNumber: number
  reps: number
  weightKg: number | null
  restAfterSec: number | null
  completed: boolean
  completedAt: string
  exercise?: GymExercise
}

export interface GymStats {
  totalSets: number
  totalVolume: number
  totalReps: number
  todaySets: number
  todayVolume: number
}

export interface WorkoutSession {
  id: number
  userId: number
  startTime: string
  endTime: string | null
  duration: number
  totalVolume: number
  totalReps: number
  totalSets: number
  exerciseCount: number
  notes: string | null
  completed: boolean
  createdAt: string
}

export interface WorkoutStats {
  totalWorkouts: number
  totalDuration: number
  totalVolume: number
  totalReps: number
  avgDuration: number
  thisWeekWorkouts: number
  thisWeekDuration: number
}

export interface WorkoutTemplate {
  id: number
  userId: number
  name: string
  description: string | null
  category: string
  difficulty: string
  duration: number
  exercises: string // JSON string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface ProgressionDataPoint {
  date: string
  maxWeight: number
  avgWeight: number
  totalVolume: number
  totalReps: number
  totalSets: number
  maxReps: number
  sessions: number
}

export interface ExerciseProgression {
  exercise: {
    id: number
    name: string
    muscleGroup: string
  }
  totalSessions: number
  progressionData: ProgressionDataPoint[]
  personalRecords: {
    maxWeight: number
    maxReps: number
    maxVolume: number
  }
  trends: {
    weightTrend: number
    repsTrend: number
    weightTrendDirection: 'up' | 'down' | 'stable'
    repsTrendDirection: 'up' | 'down' | 'stable'
  }
  totalVolume: number
  totalReps: number
}

export interface ProgressionExerciseStats {
  exerciseId: number
  exerciseName: string
  muscleGroup: string
  totalSessions: number
  maxWeight: number
  maxReps: number
  totalVolume: number
  weightProgression: number
  lastSessionDate: string
}

export interface PersonalRecord {
  exerciseId: number
  exerciseName: string
  muscleGroup: string
  maxWeight: {
    weight: number
    reps: number
    date: string
  }
  maxReps: {
    weight: number
    reps: number
    date: string
  }
  maxVolume: {
    volume: number
    weight: number
    reps: number
    date: string
  }
  totalSessions: number
}

// Fallback user-facing messages by HTTP status (backend messages take precedence)
const USER_ERROR_MESSAGES: Record<number, string> = {
  400: "Please check your input and try again.",
  401: "Please sign in to continue.",
  403: "You don't have permission to do that.",
  404: "The requested item could not be found.",
  409: "That conflicts with data that already exists.",
  422: "Please check your input and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again later.",
  502: "Something went wrong on our end. Please try again later.",
  503: "Something went wrong on our end. Please try again later.",
  504: "The server took too long to respond. Please try again.",
}

export function getUserMessage(status: number): string {
  return USER_ERROR_MESSAGES[status] ?? "An unexpected error occurred"
}

function codeForStatus(status: number): string {
  switch (status) {
    case 0:
      return "NETWORK_ERROR"
    case 400:
      return "VALIDATION_ERROR"
    case 401:
      return "UNAUTHORIZED"
    case 403:
      return "FORBIDDEN"
    case 404:
      return "NOT_FOUND"
    case 409:
      return "CONFLICT"
    case 422:
      return "VALIDATION_ERROR"
    case 429:
      return "RATE_LIMITED"
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "UNKNOWN_ERROR"
  }
}

export class ApiError extends Error {
  status: number
  /** Machine-readable code, e.g. UNAUTHORIZED, NETWORK_ERROR */
  code: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code ?? codeForStatus(status)
    this.name = "ApiError"
    // Keep the prototype chain intact so `err instanceof ApiError` works
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  retryIf?: (error: unknown) => boolean
}

// Retry transient failures with exponential backoff + jitter.
// Callers must decide what is retriable via retryIf (e.g. network errors only).
async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 300, maxDelayMs = 2000, retryIf = () => true } = options

  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts || !retryIf(error)) throw error

      const jitter = Math.random() * baseDelayMs
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1) + jitter, maxDelayMs)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
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

  const method = (options.method || "GET").toUpperCase()
  const isIdempotent = method === "GET" || method === "HEAD"

  const execute = async (): Promise<Response> => {
    try {
      return await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })
    } catch (networkError) {
      // fetch() only rejects on network-level failures (offline, DNS, refused)
      console.error(`Network error on ${method} ${endpoint}:`, networkError)
      throw new ApiError(
        "Cannot reach the server. Check your connection and try again.",
        0,
        "NETWORK_ERROR",
      )
    }
  }

  // Retry idempotent reads on network failures only — never mutations, never HTTP errors
  const response = isIdempotent
    ? await withRetry(execute, {
        maxAttempts: 2,
        retryIf: (error) => error instanceof ApiError && error.code === "NETWORK_ERROR",
      })
    : await execute()

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || getUserMessage(response.status)
    throw new ApiError(message, response.status)
  }

  return data as T
}

export const apiClient = {
  auth: {
    register: async (payload: { email: string; password: string; username?: string; phone?: string; address?: string }) => {
      const res = await request<{ user: User; token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (typeof window !== "undefined") {
        localStorage.setItem("clop_token", res.token)
      }
      return res
    },

    login: async (payload: { email: string; password: string }) => {
      const res = await request<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (typeof window !== "undefined") {
        localStorage.setItem("clop_token", res.token)
      }
      return res
    },

    getMe: () => request<User>("/auth/me"),
  },

  users: {
    getProfile: () => request<User>("/users/me"),

    updateProfile: (payload: UpdateProfilePayload) =>
      request<User>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    clearData: () => request<{ success: boolean; message: string }>("/users/me/data", { method: "DELETE" }),
  },

  tasks: {
    getTasks: () => request<TaskItem[]>("/tasks"),

    createTask: (payload: {
      title: string
      category?: string
      durationMinutes?: number
      color?: string
      isGymExercise?: boolean
      setsPlanned?: number
      repsPerSet?: number
      weightKg?: number
      restSeconds?: number
      muscleGroup?: string
    }) =>
      request<TaskItem>("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    updateTask: (
      id: number,
      payload: {
        title?: string
        category?: string
        durationMinutes?: number
        completed?: boolean
        color?: string
        isGymExercise?: boolean
        setsPlanned?: number
        repsPerSet?: number
        weightKg?: number
        restSeconds?: number
        muscleGroup?: string
      }
    ) =>
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

    updateSettings: (payload: {
      notifications?: boolean
      soundEnabled?: boolean
      vibrationEnabled?: boolean
      gymMode?: boolean
      restTimerSeconds?: number
      autoRestTimer?: boolean
      weightUnit?: string
      dailyGoalCount?: number
    }) =>
      request<UserSettingsData>("/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    exportData: () => request<any>("/settings/export"),
  },

  gym: {
    getExercises: () => request<GymExercise[]>("/settings/gym/exercises"),

    createExercise: (payload: {
      name: string
      muscleGroup?: string
      defaultSets?: number
      defaultReps?: number
      defaultWeight?: number
      restSeconds?: number
      notes?: string
    }) =>
      request<GymExercise>("/settings/gym/exercises", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    updateExercise: (
      id: number,
      payload: {
        name?: string
        muscleGroup?: string
        defaultSets?: number
        defaultReps?: number
        defaultWeight?: number
        restSeconds?: number
        notes?: string
      }
    ) =>
      request<GymExercise>(`/settings/gym/exercises/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    deleteExercise: (id: number) => request<{ success: boolean }>(`/settings/gym/exercises/${id}`, { method: "DELETE" }),

    logSet: (payload: {
      exerciseId: number
      taskId?: number
      setNumber: number
      reps: number
      weightKg?: number
      restAfterSec?: number
      completed?: boolean
    }) =>
      request<GymSessionLog>("/settings/gym/log", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getStats: () => request<GymStats>("/settings/gym/stats"),

    getRecentSessions: () => request<GymSessionLog[]>("/settings/gym/sessions"),

    startWorkoutSession: (payload: { exerciseIds: number[]; notes?: string }) =>
      request<WorkoutSession>("/settings/workout/start", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    completeWorkoutSession: (id: number, payload: {
      duration: number;
      totalVolume: number;
      totalReps: number;
      totalSets: number;
      exerciseCount: number;
      notes?: string;
    }) =>
      request<WorkoutSession>(`/settings/workout/${id}/complete`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    getWorkoutHistory: () => request<WorkoutSession[]>("/settings/workout/history"),

    getWorkoutStats: () => request<WorkoutStats>("/settings/workout/stats"),

    // Custom Templates
    getTemplates: () => request<WorkoutTemplate[]>("/settings/templates"),

    createTemplate: (payload: {
      name: string;
      description?: string;
      category?: string;
      difficulty?: string;
      duration?: number;
      exercises: string;
    }) =>
      request<WorkoutTemplate>("/settings/templates", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    deleteTemplate: (id: number) => request<{ success: boolean }>(`/settings/templates/${id}`, { method: "DELETE" }),

    // Progression Tracking
    getExerciseProgression: (exerciseId: number) =>
      request<ExerciseProgression>(`/settings/progression/${exerciseId}`),

    getProgressionStats: () => request<ProgressionExerciseStats[]>("/settings/progression/stats"),

    getPersonalRecords: () => request<PersonalRecord[]>("/settings/progression/records"),
  },
}
