"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Palette, Shield, Download, Trash2, User, Settings, ChevronRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [notifications, setNotifications] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [focusTime, setFocusTime] = useState([25])
  const [shortBreak, setShortBreak] = useState([5])
  const [longBreak, setLongBreak] = useState([15])
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false)

  const settingsSections = [
    {
      title: "Timer Settings",
      icon: Clock,
      items: [
        {
          label: "Focus Time",
          description: `${focusTime[0]} minutes`,
          type: "slider" as const,
          value: focusTime,
          onChange: setFocusTime,
          min: 15,
          max: 60,
          step: 5,
        },
        {
          label: "Short Break",
          description: `${shortBreak[0]} minutes`,
          type: "slider" as const,
          value: shortBreak,
          onChange: setShortBreak,
          min: 3,
          max: 15,
          step: 1,
        },
        {
          label: "Long Break",
          description: `${longBreak[0]} minutes`,
          type: "slider" as const,
          value: longBreak,
          onChange: setLongBreak,
          min: 10,
          max: 30,
          step: 5,
        },
        {
          label: "Auto-start Breaks",
          description: "Automatically start break timers",
          type: "switch" as const,
          value: autoStartBreaks,
          onChange: setAutoStartBreaks,
        },
        {
          label: "Auto-start Pomodoros",
          description: "Automatically start focus sessions",
          type: "switch" as const,
          value: autoStartPomodoros,
          onChange: setAutoStartPomodoros,
        },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          label: "Push Notifications",
          description: "Get notified when timers complete",
          type: "switch" as const,
          value: notifications,
          onChange: setNotifications,
        },
        {
          label: "Sound Alerts",
          description: "Play sound when timer ends",
          type: "switch" as const,
          value: soundEnabled,
          onChange: setSoundEnabled,
        },
        {
          label: "Vibration",
          description: "Vibrate device on timer completion",
          type: "switch" as const,
          value: vibrationEnabled,
          onChange: setVibrationEnabled,
        },
      ],
    },
    {
      title: "Appearance",
      icon: Palette,
      items: [
        {
          label: "Theme",
          description: "Switch between light and dark mode",
          type: "theme" as const,
        },
      ],
    },
    {
      title: "Data & Privacy",
      icon: Shield,
      items: [
        {
          label: "Export Data",
          description: "Download your productivity data",
          type: "action" as const,
          action: () => console.log("Exporting data..."),
        },
        {
          label: "Clear All Data",
          description: "Reset all tasks and statistics",
          type: "action" as const,
          action: () => console.log("Clearing data..."),
          destructive: true,
        },
      ],
    },
  ]

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case "switch":
        return (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Switch checked={item.value} onCheckedChange={item.onChange} />
          </div>
        )

      case "slider":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <Slider
              value={item.value}
              onValueChange={item.onChange}
              min={item.min}
              max={item.max}
              step={item.step}
              className="w-full"
            />
          </div>
        )

      case "theme":
        return (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <ThemeToggle />
          </div>
        )

      case "action":
        return (
          <Button
            variant={item.destructive ? "destructive" : "outline"}
            className="w-full justify-between glass-card bg-transparent"
            onClick={item.action}
          >
            <div className="text-left">
              <p className="font-medium">{item.label}</p>
              <p className="text-sm opacity-70">{item.description}</p>
            </div>
            {item.destructive ? <Trash2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          </Button>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="glass-card bg-transparent">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Customize your productivity experience</p>
        </div>
      </div>

      {/* Profile Section */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Alex Johnson</h3>
              <p className="text-muted-foreground">alex.johnson@example.com</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Pro Member
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Level 12
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      {settingsSections.map((section, sectionIndex) => (
        <Card key={sectionIndex} className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <section.icon className="w-5 h-5 text-primary" />
              <span>{section.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex}>{renderSettingItem(item)}</div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Statistics Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary" />
            <span>Your Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-2xl font-bold text-primary">127</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-2xl font-bold text-secondary">52h</div>
              <div className="text-sm text-muted-foreground">Focus Time</div>
            </div>
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-2xl font-bold text-foreground">89</div>
              <div className="text-sm text-muted-foreground">Tasks Done</div>
            </div>
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-2xl font-bold text-accent">12</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="glass-card">
        <CardContent className="p-6 text-center space-y-2">
          <h3 className="font-semibold text-foreground">FocusFlow</h3>
          <p className="text-sm text-muted-foreground">Version 2.1.0</p>
          <p className="text-xs text-muted-foreground">Built with ❤️ for productivity enthusiasts</p>
        </CardContent>
      </Card>
    </div>
  )
}
