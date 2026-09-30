"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  Plus,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Target,
  Home,
  Settings,
  Trash2,
  Loader2,
  ListTodo,
  RefreshCw,
  Dumbbell,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsPage } from "@/components/settings-page"
import { GymMode } from "@/components/gym-mode"
import { apiClient, ApiError, TaskItem, UserStats, UserSettingsData } from "@/lib/api-client"
import { useAuth } from "./auth-context"
import { toast } from "sonner"

export function Dashboard() {
  const { user, logout } = useAuth()
  type TabType = "home" | "timer" | "tasks" | "gym" | "calendar" | "notifications" | "settings"
  const [activeTab, setActiveTab] = useState<TabType>("home")

  // Remote / local state
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalFocusMinutes: 0,
    totalFocusHours: "0.0h",
    completedTasksCount: 0,
    dayStreak: 0,
    todaysSessionsCount: 0,
    dailyGoalCount: 4,
    dailyProgress: 0,
  })
  const [settings, setSettings] = useState<UserSettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [shortBreakMinutes] = useState(5)
  const [mode, setMode] = useState<"focus" | "break">("focus")
  const [timeLeft, setTimeLeft] = useState(25 * 60) // seconds
  const [currentTaskTitle, setCurrentTaskTitle] = useState("Focus Session")
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [selectedTaskDuration, setSelectedTaskDuration] = useState<number>(25)

  // Dialog state
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskCategory, setNewTaskCategory] = useState("")
  const [newTaskDuration, setNewTaskDuration] = useState<number>(25)
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  // Gym-specific task creation fields
  const [isGymTask, setIsGymTask] = useState(false)
  const [gymSets, setGymSets] = useState(3)
  const [gymReps, setGymReps] = useState(10)
  const [gymWeight, setGymWeight] = useState("")
  const [gymRest, setGymRest] = useState(60)
  const [gymMuscle, setGymMuscle] = useState("")

  const formatTime = (seconds: number) => {
    const validSecs = Math.max(0, Math.floor(seconds || 0))
    const mins = Math.floor(validSecs / 60)
    const secs = validSecs % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Load data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [tasksRes, statsRes, settingsRes] = await Promise.allSettled([
        apiClient.tasks.getTasks(),
        apiClient.sessions.getStats(),
        apiClient.settings.getSettings(),
      ])

      // Apply whatever succeeded — one failing endpoint shouldn't blank the dashboard
      if (tasksRes.status === "fulfilled") {
        setTasks(tasksRes.value || [])
      }
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value || {
          totalSessions: 0,
          totalFocusMinutes: 0,
          totalFocusHours: "0.0h",
          completedTasksCount: 0,
          dayStreak: 0,
          todaysSessionsCount: 0,
          dailyGoalCount: 4,
          dailyProgress: 0,
        })
      }
      if (settingsRes.status === "fulfilled") {
        setSettings(settingsRes.value)
      }

      const failures = [tasksRes, statsRes, settingsRes].filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      )
      if (failures.length > 0) {
        const err = failures[0].reason
        console.error("Dashboard failed to load some data:", err)
        if (err instanceof ApiError && err.code === "UNAUTHORIZED") {
          // Token invalid/expired — end the session instead of misreporting it
          toast.error("Your session has expired. Please sign in again.")
          logout()
        } else if (failures.length === 3) {
          toast.error(err instanceof ApiError ? err.message : "Failed to load your data")
        } else {
          toast.error("Some data couldn't be loaded — check your connection")
        }
      }

      // Apply daily goal from onboarding
      if (typeof window !== "undefined") {
        const savedGoal = localStorage.getItem("clop_daily_target")
        if (savedGoal) {
          setStats((prev) => ({ ...prev, dailyGoalCount: parseInt(savedGoal) || prev.dailyGoalCount }))
        }
      }
    } catch (err) {
      // Unexpected failure outside the API layer (e.g. localStorage access)
      console.error("Unexpected error loading dashboard:", err)
      toast.error("Something went wrong loading the dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addNewTask = async () => {
    const trimmedTitle = newTaskTitle.trim()
    const trimmedCategory = newTaskCategory.trim()
    if (!trimmedTitle) return

    try {
      setIsCreatingTask(true)
      const created = await apiClient.tasks.createTask({
        title: trimmedTitle,
        category: trimmedCategory || (isGymTask ? "Exercise" : "General"),
        durationMinutes: isGymTask ? 0 : Math.max(1, Math.floor(Number(newTaskDuration) || 25)),
        isGymExercise: isGymTask,
        setsPlanned: isGymTask ? gymSets : undefined,
        repsPerSet: isGymTask ? gymReps : undefined,
        weightKg: isGymTask && gymWeight ? parseFloat(gymWeight) : undefined,
        restSeconds: isGymTask ? gymRest : undefined,
        muscleGroup: isGymTask ? gymMuscle || undefined : undefined,
      })
      setTasks((prev) => [created, ...prev])
      resetNewTaskForm()
      setNewTaskOpen(false)
      toast.success(isGymTask ? "Exercise added to tasks" : "Task created successfully")
      fetchData()
    } catch (err: any) {
      console.error("Failed to create task:", err)
      toast.error(err.message || "Failed to create task")
    } finally {
      setIsCreatingTask(false)
    }
  }

  const resetNewTaskForm = () => {
    setNewTaskTitle("")
    setNewTaskCategory("")
    setNewTaskDuration(25)
    setIsGymTask(false)
    setGymSets(3)
    setGymReps(10)
    setGymWeight("")
    setGymRest(60)
    setGymMuscle("")
  }

  const toggleTaskCompleted = async (task: TaskItem) => {
    try {
      const updated = await apiClient.tasks.updateTask(task.id, {
        completed: !task.completed,
      })
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
      fetchData()
      toast.success(updated.completed ? "Task completed!" : "Task marked incomplete")
    } catch (err: any) {
      console.error("Failed to update task:", err)
      toast.error("Failed to update task")
    }
  }

  const deleteTask = async (taskId: number) => {
    try {
      await apiClient.tasks.deleteTask(taskId)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null)
        setCurrentTaskTitle("Focus Session")
        setSelectedTaskDuration(25)
        if (!isTimerRunning) {
          setTimeLeft(25 * 60)
        }
      }
      toast.success("Task deleted")
      fetchData()
    } catch (err: any) {
      console.error("Failed to delete task:", err)
      toast.error("Failed to delete task")
    }
  }

  const selectTaskForFocus = (task: TaskItem) => {
    if (task.isGymExercise) {
      // Gym tasks go to gym mode
      setActiveTab("gym")
      return
    }
    const dur = Math.max(1, task.durationMinutes || 25)
    setSelectedTaskId(task.id)
    setCurrentTaskTitle(task.title)
    setSelectedTaskDuration(dur)
    setMode("focus")
    setIsTimerRunning(false)
    setTimeLeft(dur * 60)
    setActiveTab("timer")
  }

  const getFocusTotalSeconds = () => {
    return Math.max(1, selectedTaskDuration) * 60
  }

  // Audio Alert
  const playBeep = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = "sine"
      o.frequency.value = 880
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.value = 0.08
      o.start()
      setTimeout(() => {
        o.stop()
        ctx.close()
      }, 500)
    } catch (err) {
      // Audio is best-effort (autoplay policies may block it) — never break the timer
      console.warn("Audio alert unavailable:", err)
    }
  }

  const handleSessionComplete = async () => {
    playBeep()
    if (mode === "focus") {
      try {
        await apiClient.sessions.createSession({
          taskId: selectedTaskId || undefined,
          durationMinutes: selectedTaskDuration,
        })
        toast.success("Focus session saved!")
        fetchData()
      } catch (err) {
        console.error("Failed to log session", err)
      }
      setMode("break")
      setTimeLeft(shortBreakMinutes * 60)
    } else {
      setMode("focus")
      setTimeLeft(getFocusTotalSeconds())
      toast.info("Break ended! Ready to focus?")
    }
  }

  // Timer countdown hook
  useEffect(() => {
    if (!isTimerRunning) return

    if (timeLeft <= 0) {
      setIsTimerRunning(false)
      handleSessionComplete()
      return
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isTimerRunning, timeLeft, mode, selectedTaskDuration, selectedTaskId])

  // Separate tasks and gym exercises
  const regularTasks = tasks.filter((t) => !t.isGymExercise)
  const gymTasks = tasks.filter((t) => t.isGymExercise)
  const clampedProgress = Math.min(100, Math.max(0, stats.dailyProgress || 0))

  const renderHomeScreen = () => {
    // Time-aware greeting
    const hour = new Date().getHours()
    const greeting =
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
    const name = user?.username || user?.email?.split("@")[0] || "Friend"

    return (
      <div className="space-y-5 page-transition">
        {/* Greeting + streak badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              {greeting}
            </p>
            <h1 className="text-2xl font-bold text-foreground leading-tight">{name}</h1>
          </div>
          {stats.dayStreak > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl leading-none">🔥</span>
              <span className="text-xs font-bold text-primary">
                {stats.dayStreak}d
              </span>
            </div>
          )}
        </div>

        {/* Daily Progress ring — large, centred, animated fill */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-5">
              {/* Ring */}
              <div className="relative w-28 h-28 shrink-0">
                <svg
                  className="w-28 h-28 -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {/* Track */}
                  <circle
                    cx="50" cy="50" r="40"
                    stroke="currentColor"
                    strokeWidth="9"
                    fill="transparent"
                    className="text-muted/30"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="50" cy="50" r="40"
                    stroke="currentColor"
                    strokeWidth="9"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - clampedProgress / 100)}`}
                    className="text-primary chart-animate"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
                  <span className="text-xl font-bold text-foreground leading-none">
                    {clampedProgress}%
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">done</span>
                </div>
              </div>

              {/* Text summary */}
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Daily Goal</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.todaysSessionsCount} of {stats.dailyGoalCount} Pomodoros
                  </p>
                </div>
                {/* Mini session pips */}
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: stats.dailyGoalCount }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                        i < stats.todaysSessionsCount
                          ? "bg-primary"
                          : "bg-muted/30"
                      }`}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs px-3"
                  onClick={() => {
                    setActiveTab("timer")
                    setIsTimerRunning(true)
                  }}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Start Focus
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Today's Tasks</CardTitle>
            <Button size="sm" className="h-8 text-xs" onClick={() => setNewTaskOpen(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : regularTasks.length === 0 && gymTasks.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <ListTodo className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">No tasks yet</p>
                <Button size="sm" variant="outline" onClick={() => setNewTaskOpen(true)}>
                  Create your first task
                </Button>
              </div>
            ) : (
              <>
                {regularTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    className="w-full flex items-center space-x-3 p-3 glass-card rounded-xl
                      hover:bg-muted/20 active:scale-[0.98] transition-all text-left"
                    onClick={() => selectTaskForFocus(task)}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        task.completed ? "bg-accent" : task.color || "bg-primary"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          task.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{task.category}</p>
                    </div>
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    )}
                  </button>
                ))}
                {gymTasks.length > 0 && (
                  <div className="border-t border-border pt-2 mt-1">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" />
                      Gym
                    </p>
                    {gymTasks.slice(0, 2).map((task) => (
                      <div key={task.id} className="flex items-center space-x-3 p-2 rounded-lg">
                        <Dumbbell className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.setsPlanned}×{task.repsPerSet}
                            {task.weightKg ? ` @ ${task.weightKg}kg` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {regularTasks.length > 3 && (
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground h-8"
                onClick={() => setActiveTab("tasks")}
              >
                View all {regularTasks.length} tasks
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Gym Mode quick access */}
        {settings?.gymMode && (
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Gym Mode</p>
                    <p className="text-xs text-muted-foreground">
                      {gymTasks.length} exercise{gymTasks.length !== 1 ? "s" : ""} queued
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs glass-card bg-transparent"
                  onClick={() => setActiveTab("gym")}
                >
                  Open
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sessions", value: stats.totalSessions, color: "text-primary" },
            { label: "Streak", value: `${stats.dayStreak}d`, color: "text-accent" },
            { label: "Tasks done", value: stats.completedTasksCount, color: "text-foreground" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="glass-card">
              <CardContent className="p-3 text-center">
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const renderTimerScreen = () => {
    const totalSecs = mode === "focus" ? getFocusTotalSeconds() : shortBreakMinutes * 60
    const ratio = Math.min(1, Math.max(0, timeLeft / Math.max(1, totalSecs)))
    const circumference = 2 * Math.PI * 44

    return (
      <div className="space-y-6 page-transition">
        {/* Mode pill */}
        <div className="flex justify-center">
          <div className="flex rounded-full p-0.5 bg-muted/30 gap-0.5">
            {(["focus", "break"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  if (isTimerRunning) return
                  setMode(m)
                  setTimeLeft(m === "focus" ? getFocusTotalSeconds() : shortBreakMinutes * 60)
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "focus" ? "Focus" : "Break"}
              </button>
            ))}
          </div>
        </div>

        {/* Task label */}
        <p className="text-center text-sm text-muted-foreground font-medium truncate px-8">
          {mode === "focus" ? currentTaskTitle : "Time to recharge ☕"}
        </p>

        {/* Circular timer — large, weighted, animated pulse ring */}
        <div className="flex items-center justify-center py-2">
          <div className="relative w-72 h-72">
            {/* Outer pulse ring when running */}
            {isTimerRunning && (
              <div
                className={`absolute inset-0 rounded-full border-2 animate-ping
                  ${mode === "focus" ? "border-primary/20" : "border-accent/20"}`}
                style={{ animationDuration: "2s" }}
              />
            )}

            <svg className="w-72 h-72 -rotate-90" viewBox="0 0 100 100">
              {/* Subtle background fill */}
              <circle
                cx="50" cy="50" r="44"
                fill={mode === "focus" ? "rgba(239,68,68,0.04)" : "rgba(34,197,94,0.04)"}
              />
              {/* Track */}
              <circle
                cx="50" cy="50" r="44"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                className="text-muted/25"
              />
              {/* Progress */}
              <circle
                cx="50" cy="50" r="44"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * ratio}
                className={`chart-animate ${mode === "focus" ? "text-primary" : "text-accent"}`}
                strokeLinecap="round"
              />
            </svg>

            {/* Timer face */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-[3.5rem] font-bold text-foreground leading-none tabular-nums tracking-tight">
                {formatTime(timeLeft)}
              </span>
              <span className={`text-xs font-semibold tracking-widest uppercase ${
                mode === "focus" ? "text-primary/70" : "text-accent/70"
              }`}>
                {mode === "focus" ? `${selectedTaskDuration} min focus` : "break"}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4">
          {/* Reset */}
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full glass-card bg-transparent"
            onClick={() => {
              setIsTimerRunning(false)
              setTimeLeft(mode === "focus" ? getFocusTotalSeconds() : shortBreakMinutes * 60)
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* Play / Pause — primary CTA */}
          <Button
            size="lg"
            className={`w-20 h-20 rounded-full text-base font-bold shadow-lg transition-all
              active:scale-95 ${isTimerRunning ? "bg-muted text-foreground hover:bg-muted/80" : ""}`}
            onClick={() => setIsTimerRunning(!isTimerRunning)}
          >
            {isTimerRunning ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 translate-x-0.5" />
            )}
          </Button>

          {/* Skip — ghost */}
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full glass-card bg-transparent opacity-60 hover:opacity-100"
            onClick={handleSessionComplete}
            title="Skip to next"
          >
            <Clock className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats strip */}
        <Card className="glass-card">
          <CardContent className="py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {stats.todaysSessionsCount}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                  Today
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary tabular-nums">
                  {stats.dayStreak}
                  <span className="text-sm">d</span>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                  Streak
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted-foreground tabular-nums">
                  {stats.dailyGoalCount}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                  Goal
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderTasksScreen = () => {
    const focusTasks = regularTasks.filter((t) => !t.isGymExercise)
    return (
      <div className="space-y-6 page-transition">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground">Manage and track your focus tasks</p>
          </div>
          <Button onClick={() => setNewTaskOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : focusTasks.length === 0 ? (
          <Card className="glass-card text-center py-12">
            <CardContent className="space-y-4">
              <ListTodo className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">No tasks found</h3>
                <p className="text-sm text-muted-foreground">Create a task to begin your focus sessions</p>
              </div>
              <Button onClick={() => setNewTaskOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {focusTasks.map((task) => (
              <Card key={task.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${task.color || "bg-primary"}`}></div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {task.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {task.durationMinutes} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant={task.completed ? "outline" : "default"}
                        onClick={() => toggleTaskCompleted(task)}
                      >
                        {task.completed ? "Undo" : "Complete"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectTaskForFocus(task)}
                      >
                        Focus
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 p-2"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderCalendarScreen = () => (
    <div className="space-y-6 page-transition">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Activity & Calendar</h1>
        <p className="text-muted-foreground">Track your productivity stats over time</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Productivity Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 glass-card rounded-lg text-center">
              <div className="text-3xl font-bold text-primary">{stats.totalFocusHours}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Focus Time</div>
            </div>
            <div className="p-4 glass-card rounded-lg text-center">
              <div className="text-3xl font-bold text-secondary">{stats.totalSessions}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Sessions</div>
            </div>
            <div className="p-4 glass-card rounded-lg text-center">
              <div className="text-3xl font-bold text-foreground">{stats.completedTasksCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Completed Tasks</div>
            </div>
            <div className="p-4 glass-card rounded-lg text-center">
              <div className="text-3xl font-bold text-accent">{stats.dayStreak} Days</div>
              <div className="text-xs text-muted-foreground mt-1">Active Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gym stats inline if gym mode enabled */}
      {settings?.gymMode && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              <span>Gym Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-muted-foreground text-sm">
              Open Gym Mode to see detailed workout stats
            </div>
            <Button variant="outline" className="w-full glass-card bg-transparent" onClick={() => setActiveTab("gym")}>
              Open Gym Mode
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const baseTabs: { key: TabType; icon: typeof Home; label: string }[] = [
    { key: "home", icon: Home, label: "Home" },
    { key: "timer", icon: Clock, label: "Timer" },
    { key: "tasks", icon: CheckCircle2, label: "Tasks" },
    { key: "calendar", icon: Calendar, label: "Stats" },
  ]
  if (settings?.gymMode) {
    baseTabs.splice(2, 0, { key: "gym", icon: Dumbbell, label: "Gym" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <div className="sticky top-0 glass-navbar border-b border-border backdrop-blur-sm p-4 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-foreground">Clop</h1>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => setActiveTab("settings")}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 pb-24 max-w-4xl mx-auto">
        {activeTab === "home" && renderHomeScreen()}
        {activeTab === "timer" && renderTimerScreen()}
        {activeTab === "tasks" && renderTasksScreen()}
        {activeTab === "gym" && settings?.gymMode && <GymMode settings={settings} />}
        {activeTab === "calendar" && renderCalendarScreen()}
        {activeTab === "settings" && <SettingsPage onBack={() => setActiveTab("home")} />}
      </div>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 glass-bottom-nav border-t border-border z-10 pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="flex items-stretch justify-around px-2 py-2 max-w-md mx-auto">
          {[...baseTabs, { key: "settings" as TabType, icon: Settings, label: "Settings" }].map(
            ({ key, icon: Icon, label }) => {
              const isActive = activeTab === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 pt-2 pb-1 transition-colors duration-200
                    ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {isActive && (
                    <span
                      className="absolute -top-2 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200
                      ${isActive ? "bg-primary/15 scale-105" : "scale-100"}`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </button>
              )
            },
          )}
        </div>
      </nav>

      {/* Create Task Dialog */}
      <Dialog open={newTaskOpen} onOpenChange={(open) => { setNewTaskOpen(open); if (!open) resetNewTaskForm() }}>
        <DialogContent className="glass-card" showCloseButton>
          <DialogHeader>
            <DialogTitle>{isGymTask ? "Add Exercise to Tasks" : "Add New Task"}</DialogTitle>
            <DialogDescription>
              {isGymTask ? "Add a gym exercise to your task list." : "Create a new task for your focus sessions."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Gym mode toggle in dialog */}
            {settings?.gymMode && (
              <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                <div className="flex items-center space-x-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Gym Exercise</span>
                </div>
                <button
                  onClick={() => setIsGymTask(!isGymTask)}
                  className={`w-10 h-5 rounded-full transition-colors ${isGymTask ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isGymTask ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {isGymTask ? "Exercise Name" : "Task Title"}
              </label>
              <Input
                placeholder={isGymTask ? "e.g. Bench Press" : "e.g. Design app interface"}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
              />
            </div>

            {isGymTask ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Muscle Group</label>
                  <Input
                    placeholder="e.g. Chest, Back, Legs"
                    value={gymMuscle}
                    onChange={(e) => setGymMuscle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Sets</label>
                    <Input
                      type="number"
                      min={1}
                      value={gymSets}
                      onChange={(e) => setGymSets(parseInt(e.target.value) || 3)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Reps</label>
                    <Input
                      type="number"
                      min={1}
                      value={gymReps}
                      onChange={(e) => setGymReps(parseInt(e.target.value) || 10)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Weight ({settings?.weightUnit || "kg"})
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Optional"
                      value={gymWeight}
                      onChange={(e) => setGymWeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Rest (sec)</label>
                    <Input
                      type="number"
                      min={10}
                      value={gymRest}
                      onChange={(e) => setGymRest(parseInt(e.target.value) || 60)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <Input
                    placeholder="e.g. Design, Coding, Work"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Focus Duration (minutes)</label>
                  <Input
                    type="number"
                    min={1}
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewTaskOpen(false); resetNewTaskForm() }}>
              Cancel
            </Button>
            <Button onClick={addNewTask} disabled={!newTaskTitle.trim() || isCreatingTask}>
              {isCreatingTask ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isCreatingTask ? "Creating..." : isGymTask ? "Add Exercise" : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
