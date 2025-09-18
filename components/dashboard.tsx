"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Plus, Bell, Calendar, CheckCircle2, Clock, Target, Home, Settings } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsPage } from "@/components/settings-page"

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<"home" | "timer" | "tasks" | "calendar" | "notifications" | "settings">(
    "home",
  )
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [currentTask, setCurrentTask] = useState("Design mobile app")

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const dailyProgress = 65
  const todaysTasks = [
    { id: 1, title: "Design mobile app", category: "Design", completed: false, color: "bg-blue-500" },
    { id: 2, title: "Review code changes", category: "Development", completed: true, color: "bg-green-500" },
    { id: 3, title: "Team meeting", category: "Meeting", completed: false, color: "bg-purple-500" },
    { id: 4, title: "Write documentation", category: "Writing", completed: false, color: "bg-orange-500" },
  ]

  const renderHomeScreen = () => (
    <div className="space-y-6 page-transition">
      {/* Greeting */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Good morning, Alex!</h1>
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
        <h1 className="text-2xl font-bold text-foreground">Focus Session</h1>
        <p className="text-muted-foreground">{currentTask}</p>
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
              strokeDashoffset={`${2 * Math.PI * 45 * (timeLeft / (25 * 60))}`}
              className={`text-primary chart-animate ${isTimerRunning ? "timer-pulse" : ""}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{formatTime(timeLeft)}</span>
            <span className="text-muted-foreground">Focus Time</span>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex justify-center space-x-4">
        <Button size="lg" onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-24 h-12">
          {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Button variant="outline" size="lg" className="w-24 h-12 glass-card bg-transparent">
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
        <Button>
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
                      25 min
                    </span>
                  </div>
                </div>
                {task.completed && <CheckCircle2 className="w-5 h-5 text-accent" />}
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
        {activeTab === "settings" && <SettingsPage onBack={() => setActiveTab("home")} />}
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
    </div>
  )
}
