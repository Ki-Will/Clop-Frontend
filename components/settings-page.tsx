"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Bell,
  Palette,
  Shield,
  Download,
  Trash2,
  User,
  Settings,
  ChevronRight,
  LogOut,
  Loader2,
  Dumbbell,
  Clock,
  Plus,
  X,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "./auth-context"
import { apiClient, UserSettingsData, UserStats, GymExercise } from "@/lib/api-client"
import { toast } from "sonner"

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, updateProfile, logout } = useAuth()

  const [settings, setSettings] = useState<UserSettingsData>({
    id: 0,
    userId: user?.id || 0,
    notifications: true,
    soundEnabled: true,
    vibrationEnabled: false,
    gymMode: false,
    restTimerSeconds: 60,
    autoRestTimer: true,
    weightUnit: "kg",
  })

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

  const [displayName, setDisplayName] = useState(user?.username || "")
  const [isSavingName, setIsSavingName] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [gymExercises, setGymExercises] = useState<GymExercise[]>([])
  const [newRestTime, setNewRestTime] = useState(60)
  const [showExerciseAdd, setShowExerciseAdd] = useState(false)
  const [newExName, setNewExName] = useState("")
  const [newExMuscle, setNewExMuscle] = useState("")

  useEffect(() => {
    if (user?.username) {
      setDisplayName(user.username)
    }
  }, [user])

  useEffect(() => {
    apiClient.settings
      .getSettings()
      .then((data) => {
        setSettings(data)
        setNewRestTime(data.restTimerSeconds)
      })
      .catch(() => {})

    apiClient.sessions
      .getStats()
      .then((data) => setStats(data))
      .catch(() => {})

    apiClient.gym
      .getExercises()
      .then((data) => setGymExercises(data))
      .catch(() => {})
  }, [])

  const handleSettingToggle = async (
    key: "notifications" | "soundEnabled" | "vibrationEnabled" | "gymMode" | "autoRestTimer",
    value: boolean
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    try {
      await apiClient.settings.updateSettings({ [key]: value })
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to update settings")
    }
  }

  const handleRestTimerChange = async (value: number) => {
    const clamped = Math.max(10, Math.min(300, value))
    setNewRestTime(clamped)
    setSettings((prev) => ({ ...prev, restTimerSeconds: clamped }))
    try {
      await apiClient.settings.updateSettings({ restTimerSeconds: clamped })
      toast.success("Rest timer updated")
    } catch {
      toast.error("Failed to update rest timer")
    }
  }

  const handleWeightUnitChange = async (unit: string) => {
    setSettings((prev) => ({ ...prev, weightUnit: unit }))
    try {
      await apiClient.settings.updateSettings({ weightUnit: unit })
      toast.success("Weight unit updated")
    } catch {
      toast.error("Failed to update weight unit")
    }
  }

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) return
    try {
      setIsSavingName(true)
      await updateProfile({ username: displayName.trim() })
      toast.success("Profile name updated")
    } catch {
      toast.error("Failed to save display name")
    } finally {
      setIsSavingName(false)
    }
  }

  const handleExportData = async () => {
    try {
      setIsExporting(true)
      const data = await apiClient.settings.exportData()
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`
      const downloadAnchor = document.createElement("a")
      downloadAnchor.setAttribute("href", jsonString)
      downloadAnchor.setAttribute("download", `clop-backup-${new Date().toISOString().split("T")[0]}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      toast.success("Productivity data exported successfully")
    } catch {
      toast.error("Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  const handleClearData = async () => {
    if (!window.confirm("Are you sure you want to clear all your tasks and focus statistics? This action cannot be undone.")) {
      return
    }

    try {
      setIsClearing(true)
      await apiClient.users.clearData()
      toast.success("All data cleared")
      const updatedStats = await apiClient.sessions.getStats()
      setStats(updatedStats)
    } catch {
      toast.error("Failed to clear user data")
    } finally {
      setIsClearing(false)
    }
  }

  const addQuickExercise = async () => {
    if (!newExName.trim()) return
    try {
      const created = await apiClient.gym.createExercise({
        name: newExName.trim(),
        muscleGroup: newExMuscle.trim() || "General",
      })
      setGymExercises((prev) => [created, ...prev])
      setNewExName("")
      setNewExMuscle("")
      setShowExerciseAdd(false)
      toast.success("Exercise added")
    } catch {
      toast.error("Failed to add exercise")
    }
  }

  const deleteQuickExercise = async (id: number) => {
    try {
      await apiClient.gym.deleteExercise(id)
      setGymExercises((prev) => prev.filter((e) => e.id !== id))
      toast.success("Exercise removed")
    } catch {
      toast.error("Failed to delete exercise")
    }
  }

  return (
    <div className="space-y-6 page-transition max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="glass-card bg-transparent">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Customize your Clop app experience</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{user?.username || "User"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Active User
                </Badge>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Display Name Edit */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-primary" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Display Name</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Button onClick={handleSaveDisplayName} disabled={isSavingName}>
                {isSavingName ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Audio */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-primary" />
            <span>Notifications & Sounds</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications when timers end</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(val) => handleSettingToggle("notifications", val)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Sound Alerts</p>
              <p className="text-sm text-muted-foreground">Play a tone on session completion</p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(val) => handleSettingToggle("soundEnabled", val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Gym Mode Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            <span>Gym Mode</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Enable Gym Mode</p>
              <p className="text-sm text-muted-foreground">Track exercises, sets, reps, and rest timers</p>
            </div>
            <Switch
              checked={settings.gymMode}
              onCheckedChange={(val) => handleSettingToggle("gymMode", val)}
            />
          </div>

          {settings.gymMode && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto Rest Timer</p>
                  <p className="text-sm text-muted-foreground">Start rest timer automatically after each set</p>
                </div>
                <Switch
                  checked={settings.autoRestTimer}
                  onCheckedChange={(val) => handleSettingToggle("autoRestTimer", val)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rest Timer Duration (seconds)</label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="number"
                    min={10}
                    max={300}
                    value={newRestTime}
                    onChange={(e) => handleRestTimerChange(parseInt(e.target.value) || 60)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(newRestTime / 60)}:{(newRestTime % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {[30, 60, 90, 120].map((sec) => (
                    <Button
                      key={sec}
                      size="sm"
                      variant={newRestTime === sec ? "default" : "outline"}
                      onClick={() => handleRestTimerChange(sec)}
                      className="text-xs"
                    >
                      {sec}s
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Weight Unit</label>
                <div className="flex space-x-2">
                  {["kg", "lbs"].map((unit) => (
                    <Button
                      key={unit}
                      size="sm"
                      variant={settings.weightUnit === unit ? "default" : "outline"}
                      onClick={() => handleWeightUnitChange(unit)}
                    >
                      {unit}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick Exercise Library */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Exercise Library</label>
                  <Button size="sm" variant="outline" onClick={() => setShowExerciseAdd(!showExerciseAdd)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>

                {showExerciseAdd && (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Exercise name"
                      value={newExName}
                      onChange={(e) => setNewExName(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Muscle group"
                      value={newExMuscle}
                      onChange={(e) => setNewExMuscle(e.target.value)}
                      className="w-28"
                    />
                    <Button size="sm" onClick={addQuickExercise} disabled={!newExName.trim()}>
                      Add
                    </Button>
                  </div>
                )}

                {gymExercises.length > 0 ? (
                  <div className="space-y-1">
                    {gymExercises.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between p-2 glass-card rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-foreground">{ex.name}</span>
                          <Badge variant="secondary" className="text-xs">{ex.muscleGroup}</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteQuickExercise(ex.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No exercises in library yet</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-primary" />
            <span>Appearance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Theme</p>
              <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>Data & Privacy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-between glass-card bg-transparent"
            onClick={handleExportData}
            disabled={isExporting}
          >
            <div className="text-left">
              <p className="font-medium">Export Data</p>
              <p className="text-xs text-muted-foreground">Download backup of tasks and stats in JSON format</p>
            </div>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-between"
            onClick={handleClearData}
            disabled={isClearing}
          >
            <div className="text-left">
              <p className="font-medium">Clear All Data</p>
              <p className="text-xs opacity-80">Delete all your tasks and focus statistics</p>
            </div>
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </CardContent>
      </Card>

      {/* Your Statistics Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary" />
            <span>Your Overall Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
              <div className="text-xs text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-2xl font-bold text-secondary">{stats.totalFocusHours}</div>
              <div className="text-xs text-muted-foreground">Focus Time</div>
            </div>
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-2xl font-bold text-foreground">{stats.completedTasksCount}</div>
              <div className="text-xs text-muted-foreground">Tasks Completed</div>
            </div>
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-2xl font-bold text-accent">{stats.dayStreak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
