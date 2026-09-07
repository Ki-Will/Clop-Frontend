"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  Plus,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Home,
  Settings,
  Trash2,
  Loader2,
  ListTodo,
  RefreshCw,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsPage } from "@/components/settings-page"
import { apiClient, TaskItem, UserStats } from "@/lib/api-client"
import { useAuth } from "./auth-context"
import { toast } from "sonner"

export function Dashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"home" | "timer" | "tasks" | "calendar" | "notifications" | "settings">(
    "home",
  )

  // Remote state
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
  const [isLoading, setIsLoading] = useState(true)

  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [shortBreakMinutes] = useState(5)
  const [longBreakMinutes] = useState(15)
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Load backend data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [fetchedTasks, fetchedStats] = await Promise.all([
        apiClient.tasks.getTasks(),
        apiClient.sessions.getStats(),
      ])
      setTasks(fetchedTasks)
      setStats(fetchedStats)
    } catch (err: any) {
      toast.error("Failed to load tasks and stats from server")
    } finally {
      setIsLoading(false)
    }
  }, [])

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
        category: trimmedCategory || "General",
        durationMinutes: Math.max(1, Math.floor(Number(newTaskDuration) || 25)),
      })
      setTasks((prev) => [created, ...prev])
      setNewTaskTitle("")
      setNewTaskCategory("")
      setNewTaskDuration(25)
      setNewTaskOpen(false)
      toast.success("Task created successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to create task")
    } finally {
      setIsCreatingTask(false)
    }
  }

  const toggleTaskCompleted = async (task: TaskItem) => {
    try {
      const updated = await apiClient.tasks.updateTask(task.id, {
        completed: !task.completed,
      })
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
      fetchData() // update stats count
      toast.success(updated.completed ? "Task completed!" : "Task marked incomplete")
    } catch (err: any) {
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
      }
      toast.success("Task deleted")
    } catch (err: any) {
      toast.error("Failed to delete task")
    }
  }

  const selectTaskForFocus = (task: TaskItem) => {
    setSelectedTaskId(task.id)
    setCurrentTaskTitle(task.title)
    setSelectedTaskDuration(task.durationMinutes)
    setMode("focus")
    setIsTimerRunning(false)
    setTimeLeft(task.durationMinutes * 60)
    setActiveTab("timer")
  }

  const getFocusTotalSeconds = () => {
    return selectedTaskDuration * 60
  }

  // Audio & Notification Alerts
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
    } catch {}
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

  const renderHomeScreen = () => (
    <div className="space-y-6 page-transition">
      {/* Greeting */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Good morning, {user?.username || user?.email.split("@")[0] || "Friend"}
        </h1>
        <p className="text-muted-foreground">Ready to boost your productivity?</p>
      </div>

      {/* Daily Progress */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <span>Daily Goal Progress</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchData} className="h-8 w-8 p-0">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90 chart-animate" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - (stats.dailyProgress || 0) / 100)}`}
                  className="text-primary chart-animate"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{stats.dailyProgress || 0}%</span>
              </div>
            </div>
          </div>
          <p className="text-center text-muted-foreground">
            {stats.todaysSessionsCount || 0} of {stats.dailyGoalCount || 4} Pomodoros completed today
          </p>
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Tasks</CardTitle>
          <Button size="sm" onClick={() => setNewTaskOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <ListTodo className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
              <p className="text-muted-foreground">No tasks created yet</p>
              <Button size="sm" variant="outline" onClick={() => setNewTaskOpen(true)}>
                Create your first task
              </Button>
            </div>
          ) : (
            tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center space-x-3 p-3 glass-card rounded-lg">
                <div className={`w-3 h-3 rounded-full ${task.color}`}></div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.category}</p>
                </div>
                {task.completed && <CheckCircle2 className="w-5 h-5 text-accent" />}
              </div>
            ))
          )}
          {tasks.length > 3 && (
            <Button variant="outline" className="w-full glass-card bg-transparent" onClick={() => setActiveTab("tasks")}>
              View All {tasks.length} Tasks
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick Start Timer */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-foreground timer-pulse">{formatTime(timeLeft)}</div>
            <p className="text-muted-foreground">Current: {currentTaskTitle}</p>
            <Button size="lg" className="w-full h-12" onClick={() => setActiveTab("timer")}>
              <Play className="w-5 h-5 mr-2" />
              Start Focus Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTimerScreen = () => (
    <div className="space-y-8 page-transition">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{mode === "focus" ? "Focus" : "Break"} Session</h1>
        <p className="text-muted-foreground">
          {mode === "focus" ? currentTaskTitle : "Time to recharge"}
        </p>
      </div>

      {/* Circular Timer */}
      <div className="flex items-center justify-center">
        <div className="relative w-64 h-64">
          <svg className="w-64 h-64 transform -rotate-90 chart-animate" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (timeLeft / (mode === "focus" ? getFocusTotalSeconds() : shortBreakMinutes * 60))}`}
              className={`text-primary chart-animate ${isTimerRunning ? "timer-pulse" : ""}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{formatTime(timeLeft)}</span>
            <span className="text-muted-foreground text-sm">
              {mode === "focus" ? `${selectedTaskDuration} min focus` : `break`}
            </span>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex justify-center space-x-4">
        <Button size="lg" onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-28 h-12 text-base">
          {isTimerRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
          {isTimerRunning ? "Pause" : "Start"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-28 h-12 glass-card bg-transparent text-base"
          onClick={() => {
            setIsTimerRunning(false)
            setTimeLeft(mode === "focus" ? getFocusTotalSeconds() : shortBreakMinutes * 60)
          }}
        >
          Reset
        </Button>
      </div>

      {/* Session Info */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.todaysSessionsCount}</div>
              <div className="text-xs text-muted-foreground">Today's Done</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.dayStreak}d</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-muted-foreground">{stats.dailyGoalCount}</div>
              <div className="text-xs text-muted-foreground">Daily Goal</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTasksScreen = () => (
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
      ) : tasks.length === 0 ? (
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
          {tasks.map((task) => (
            <Card key={task.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${task.color}`}></div>
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
    </div>
  )

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
        {activeTab === "calendar" && renderCalendarScreen()}
        {activeTab === "settings" && <SettingsPage onBack={() => setActiveTab("home")} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 glass-bottom-nav border-t border-border z-10">
        <div className="flex items-center justify-around p-2 max-w-md mx-auto">
          <Button
            variant={activeTab === "home" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("home")}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
          >
            <Home className="w-5 h-5" />
          </Button>
          <Button
            variant={activeTab === "timer" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("timer")}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
          >
            <Clock className="w-5 h-5" />
          </Button>
          <Button
            variant={activeTab === "tasks" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("tasks")}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
          </Button>
          <Button
            variant={activeTab === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("calendar")}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
          >
            <Calendar className="w-5 h-5" />
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("settings")}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent className="glass-card" showCloseButton>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Task Title</label>
              <Input
                placeholder="e.g. Design app interface"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
              />
            </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addNewTask} disabled={!newTaskTitle.trim() || isCreatingTask}>
              {isCreatingTask ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isCreatingTask ? "Creating..." : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
