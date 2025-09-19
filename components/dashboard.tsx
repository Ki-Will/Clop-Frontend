"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Plus, Bell, Calendar, CheckCircle2, Clock, Target, Home, Settings } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsPage } from "@/components/settings-page"
import { AuthFlow } from "./auth-flow"

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<"home" | "timer" | "tasks" | "calendar" | "notifications" | "settings">(
    "home",
  )
  const [userName, setUserName] = useState("Alex")
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [shortBreakMinutes] = useState(5)
  const [longBreakMinutes] = useState(15)
  const [mode, setMode] = useState<"focus" | "break">("focus")
  const [completedFocusCount, setCompletedFocusCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // seconds
  const [currentTask, setCurrentTask] = useState("Design mobile app")
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  const dailyProgress = 30
  const [newTask, setNewtask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskCategory, setNewTaskCategory] = useState("")
  const [newTaskDuration, setNewTaskDuration] = useState<number>(25)
  
  const [todaysTasks, setTodaysTasks] = useState(
    [
      { id: 1, title: "Design mobile app", category: "Design", completed: false, color: "bg-blue-500", durationMinutes: 25 },
      { id: 2, title: "Review code changes", category: "Development", completed: true, color: "bg-green-500", durationMinutes: 30 },
      { id: 3, title: "Team meeting", category: "Meeting", completed: false, color: "bg-purple-500", durationMinutes: 15 },
      { id: 4, title: "Write documentation", category: "Writing", completed: false, color: "bg-orange-500", durationMinutes: 20 },
    ]
  )

  const addNewTask = () => {
    const trimmedTitle = newTaskTitle.trim()
    const trimmedCategory = newTaskCategory.trim()
    if (!trimmedTitle) return
    const nextId = (todaysTasks[todaysTasks.length - 1]?.id ?? 0) + 1
    const task = {
      id: nextId,
      title: trimmedTitle,
      category: trimmedCategory || "General",
      completed: false,
      color: "bg-blue-500",
      durationMinutes: Math.max(1, Math.floor(Number(newTaskDuration) || 25)),
    }
    setTodaysTasks([...todaysTasks, task])
    setNewTaskTitle("")
    setNewTaskCategory("")
    setNewTaskDuration(25)
    setNewtask(false)
  }

  const toggleTaskCompleted = (id: number) => {
    setTodaysTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const selectTaskForFocus = (id: number) => {
    const task = todaysTasks.find((t) => t.id === id)
    if (!task) return
    setSelectedTaskId(id)
    setCurrentTask(task.title)
    setMode("focus")
    setIsTimerRunning(false)
    setTimeLeft(task.durationMinutes * 60)
    setActiveTab("timer")
  }

  const getFocusTotalSeconds = () => {
    const task = selectedTaskId ? todaysTasks.find((t) => t.id === selectedTaskId) : null
    return (task?.durationMinutes ?? focusMinutes) * 60
  }

  // Keep timeLeft in sync when durations change and timer is not running
  useEffect(() => {
    if (isTimerRunning) return
    setTimeLeft((mode === "focus" ? getFocusTotalSeconds() / 1 : shortBreakMinutes * 60))
  }, [focusMinutes, shortBreakMinutes, mode, isTimerRunning, selectedTaskId, todaysTasks])

  // Load username from localStorage and react to storage updates
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("username") : null
    if (stored) setUserName(stored)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "username" && e.newValue) setUserName(e.newValue)
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // Sound / vibration settings
  const getSettings = () => {
    if (typeof window === "undefined") return { sound: true, vibration: false }
    const sound = window.localStorage.getItem("soundEnabled")
    const vibration = window.localStorage.getItem("vibrationEnabled")
    return {
      sound: sound === null ? true : sound === "true",
      vibration: vibration === "true",
    }
  }

  const isMobileDevice = () => {
    if (typeof navigator === "undefined") return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

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
      g.gain.value = 0.05
      o.start()
      setTimeout(() => {
        o.stop()
        ctx.close()
      }, 400)
    } catch {}
  }

  const notifyCompletion = () => {
    const { sound, vibration } = getSettings()
    if (sound) playBeep()
    if (vibration && isMobileDevice() && typeof navigator !== "undefined" && (navigator as any).vibrate) {
      ;(navigator as any).vibrate(200)
    }
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if ((window as any).Notification.permission === "granted") {
          new (window as any).Notification("FocusFlow", {
            body: mode === "focus" ? "Focus session complete. Break time!" : "Break over. Back to focus.",
          })
        } else if ((window as any).Notification.permission !== "denied") {
          ;(window as any).Notification.requestPermission()
        }
      }
    } catch {}
  }

  const ensureNotificationPermission = () => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if ((window as any).Notification.permission === "default") {
          ;(window as any).Notification.requestPermission()
        }
      }
    } catch {}
  }

  // Timer countdown and automatic transitions between focus and break
  useEffect(() => {
    if (!isTimerRunning) return
    if (timeLeft <= 0) {
      if (mode === "focus") {
        const nextCount = completedFocusCount + 1
        setCompletedFocusCount(nextCount)
        const isLong = nextCount % 4 === 0
        setMode("break")
        setTimeLeft((isLong ? longBreakMinutes : shortBreakMinutes) * 60)
        notifyCompletion()
      } else {
        setMode("focus")
        setTimeLeft(getFocusTotalSeconds())
        notifyCompletion()
      }
      return
    }
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [isTimerRunning, timeLeft, mode, completedFocusCount, shortBreakMinutes, longBreakMinutes, selectedTaskId, todaysTasks])

  const renderHomeScreen = () => (
    <div className="space-y-6 page-transition">
      {/* Greeting */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Good morning, {userName}</h1>
        <p className="text-muted-foreground">Ready to boost your productivity?</p>
      </div>

      {/* Daily Progress */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <span>Daily Goal Progress</span>
          </CardTitle>
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
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - dailyProgress / 100)}`}
                  className="text-primary chart-animate"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{dailyProgress}%</span>
              </div>
            </div>
          </div>
          <p className="text-center text-muted-foreground">{Math.floor(dailyProgress / 25)} of 4 Pomodoros completed</p>
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Tasks</CardTitle>
          <Button size="sm" onClick={() => setActiveTab("tasks")}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysTasks.slice(0, 3).map((task) => (
            <div key={task.id} className="flex items-center space-x-3 p-3 glass-card rounded-lg">
              <div className={`w-3 h-3 rounded-full ${task.color}`}></div>
              <div className="flex-1">
                <p
                  className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {task.title}
                </p>
                <p className="text-sm text-muted-foreground">{task.category}</p>
              </div>
              {task.completed && <CheckCircle2 className="w-5 h-5 text-accent" />}
            </div>
          ))}
          <Button variant="outline" className="w-full glass-card bg-transparent" onClick={() => setActiveTab("tasks")}>
            View All Tasks
          </Button>
        </CardContent>
      </Card>

      {/* Quick Start Timer */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-foreground timer-pulse">{formatTime(timeLeft)}</div>
            <p className="text-muted-foreground">Current: {currentTask}</p>
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
          {mode === "focus" ? currentTask : "Time to recharge"}
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
              strokeDashoffset={`${2 * Math.PI * 45 * (timeLeft / (mode === "focus" ? getFocusTotalSeconds() : (shortBreakMinutes * 60)))}`}
              className={`text-primary chart-animate ${isTimerRunning ? "timer-pulse" : ""}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{formatTime(timeLeft)}</span>
            <span className="text-muted-foreground">
              {mode === "focus" ? `${Math.floor(getFocusTotalSeconds() / 60)} min focus` : `break`}
            </span>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex justify-center space-x-4">
        <Button size="lg" onClick={() => { ensureNotificationPermission(); setIsTimerRunning(!isTimerRunning) }} className="w-24 h-12">
          {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-24 h-12 glass-card bg-transparent"
          onClick={() => {
            setIsTimerRunning(false)
            setTimeLeft((mode === "focus" ? getFocusTotalSeconds() : shortBreakMinutes * 60))
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
              <div className="text-2xl font-bold text-foreground">3</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">1</div>
              <div className="text-sm text-muted-foreground">Current</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-muted-foreground">4</div>
              <div className="text-sm text-muted-foreground">Goal</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTasksScreen = () => (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <Button onClick={() => setNewtask(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="space-y-3">
        {todaysTasks.map((task) => (
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
                {task.completed && <CheckCircle2 className="w-5 h-5 text-accent" />}
                <Button
                  size="sm"
                  variant={task.completed ? "outline" : "default"}
                  onClick={() => toggleTaskCompleted(task.id)}
                >
                  {task.completed ? "Undo" : "Complete"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectTaskForFocus(task.id)}
                >
                  Focus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 glass-navbar border-b border-border backdrop-blur-sm p-4 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">FocusFlow</h1>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => setActiveTab("notifications")}>
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {activeTab === "home" && renderHomeScreen()}
        {activeTab === "timer" && renderTimerScreen()}
        {activeTab === "tasks" && renderTasksScreen()}
        {activeTab === "settings" && (
          <SettingsPage onBack={() => setActiveTab("home")} />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 glass-bottom-nav border-t border-border">
        <div className="flex items-center justify-around p-2 opacity-100 backdrop-blur-sm shadow-xs">
          <Button
            variant={activeTab === "home" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("home")}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
          >
            <Home className="w-5 h-5" />
          </Button>
          <Button
            variant={activeTab === "timer" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("timer")}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
          >
            <Clock className="w-5 h-5" />
          </Button>
          <Button
            variant={activeTab === "tasks" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("tasks")}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
          >
            <CheckCircle2 className="w-5 h-5" />
          </Button>
          <Button
            variant={activeTab === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("calendar")}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
          >
            <Calendar className="w-5 h-5" />
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("settings")}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <Dialog open={newTask} onOpenChange={setNewtask}>
        <DialogContent className="glass-card" showCloseButton>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Category</label>
              <Input
                placeholder="e.g. Design, Development"
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
              />
            </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Duration (minutes)</label>
            <Input
              type="number"
              min={1}
              value={newTaskDuration}
              onChange={(e) => setNewTaskDuration(Number(e.target.value))}
            />
          </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewtask(false)}>Cancel</Button>
            <Button onClick={addNewTask} disabled={!newTaskTitle.trim()}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
