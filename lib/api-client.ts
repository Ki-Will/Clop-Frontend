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
