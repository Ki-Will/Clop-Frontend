"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChevronRight,
  Target,
  TrendingUp,
  Trophy,
  Dumbbell,
  Sun,
  Moon,
  Zap,
  Clock,
  Flame,
  Check,
} from "lucide-react"

interface OnboardingFlowProps {
  onComplete: () => void
}

type Goal = "productivity" | "fitness" | "both"
type ThemeChoice = "light" | "dark" | "system"

interface OnboardingData {
  goal: Goal | null
  dailyTarget: number
  gymMode: boolean
  theme: ThemeChoice
  experienceLevel: "beginner" | "intermediate" | "advanced"
  workoutFrequency: number
  preferredWorkoutDuration: number
  notificationPreference: "all" | "important" | "none"
  quickExercises: string[]
}

const onboardingSlides = [
  {
    icon: Target,
    title: "Master Your Tasks",
    description: "Organize and prioritize your daily tasks with our intuitive task management system.",
    color: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description: "Monitor your productivity with detailed insights and analytics to boost your performance.",
    color: "text-accent",
  },
  {
    icon: Trophy,
    title: "Achieve Success",
    description: "Complete your goals using the proven Pomodoro technique and celebrate your wins.",
    color: "text-primary",
  },
]

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle")
  const [introComplete, setIntroComplete] = useState(false)

  const [data, setData] = useState<OnboardingData>({
    goal: null,
    dailyTarget: 4,
    gymMode: false,
    theme: "system",
    experienceLevel: "beginner",
    workoutFrequency: 3,
    preferredWorkoutDuration: 45,
    notificationPreference: "all",
    quickExercises: [],
  })

  // Intro slides phase
  const handleNextIntro = () => {
    if (currentSlide >= onboardingSlides.length - 1) {
      setIntroComplete(true)
      setCurrentSlide(0)
      return
    }
    setPhase("out")
    setTimeout(() => {
      setCurrentSlide((s) => s + 1)
      setPhase("in")
      requestAnimationFrame(() => {
        setTimeout(() => setPhase("idle"), 200)
      })
    }, 200)
  }

  const handleSkip = () => {
    onComplete()
  }

  // Interactive setup phase
  const [setupStep, setSetupStep] = useState(0) // 0=goal, 1=daily, 2=experience, 3=frequency, 4=gym, 5=exercises, 6=notifications, 7=theme

  const handleSetupNext = () => {
    if (setupStep < 7) {
      setPhase("out")
      setTimeout(() => {
        setSetupStep((s) => s + 1)
        setPhase("in")
        requestAnimationFrame(() => {
          setTimeout(() => setPhase("idle"), 200)
        })
      }, 200)
    } else {
      // Save preferences to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("clop_onboarding_goal", data.goal || "productivity")
        localStorage.setItem("clop_daily_target", String(data.dailyTarget))
        localStorage.setItem("clop_gym_mode", String(data.gymMode))
        localStorage.setItem("clop_theme", data.theme)
        localStorage.setItem("clop_experience_level", data.experienceLevel)
        localStorage.setItem("clop_workout_frequency", String(data.workoutFrequency))
        localStorage.setItem("clop_workout_duration", String(data.preferredWorkoutDuration))
        localStorage.setItem("clop_notification_pref", data.notificationPreference)
        localStorage.setItem("clop_quick_exercises", JSON.stringify(data.quickExercises))
      }
      onComplete()
    }
  }

  const transitionClass =
    phase === "out"
      ? "opacity-0 translate-y-2"
      : phase === "in"
        ? "opacity-0 -translate-y-2"
        : "opacity-100 translate-y-0"

  // Intro slides
  if (!introComplete) {
    const slide = onboardingSlides[currentSlide]
    const Icon = slide.icon

    return (
      <div className="flex flex-col min-h-screen bg-background px-6 py-8">
        <div className="flex justify-end mb-8">
          <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
            Skip
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-8 transition-all duration-300 ease-out">
          <div className={`w-32 h-32 bg-card rounded-full flex items-center justify-center transform transition-all duration-300 ease-out ${transitionClass}`}>
            <Icon className={`w-16 h-16 ${slide.color}`} />
          </div>

          <div className={`text-center space-y-4 max-w-sm transform transition-all duration-300 ease-out ${transitionClass}`}>
            <h2 className="text-2xl font-bold text-foreground">{slide.title}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">{slide.description}</p>
          </div>

          <div className={`flex space-x-2 transform transition-all duration-300 ease-out ${transitionClass}`}>
            {onboardingSlides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${index === currentSlide ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Button onClick={handleNextIntro} className="w-full h-12 text-lg">
            {currentSlide === onboardingSlides.length - 1 ? "Let's Set Up" : "Next"}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // Setup phase - Goal selection
  const renderGoalStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">What's your main goal?</h2>
        <p className="text-muted-foreground">Choose what matters most to you right now</p>
      </div>

      <div className="grid gap-3">
        {([
          { value: "productivity" as Goal, icon: Zap, title: "Productivity", desc: "Stay focused with Pomodoro timers and task tracking" },
          { value: "fitness" as Goal, icon: Dumbbell, title: "Fitness", desc: "Track workouts, sets, reps, and rest timers" },
          { value: "both" as Goal, icon: Flame, title: "Both", desc: "Get the best of focus sessions and gym tracking" },
        ]).map((opt) => (
          <Card
            key={opt.value}
            className={`glass-card cursor-pointer transition-all ${
              data.goal === opt.value ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
            onClick={() => setData((d) => ({ ...d, goal: opt.value }))}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                data.goal === opt.value ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <opt.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{opt.title}</p>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </div>
              {data.goal === opt.value && <Check className="w-5 h-5 text-primary" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Setup phase - Daily target
  const renderDailyTargetStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Set your daily goal</h2>
        <p className="text-muted-foreground">How many Pomodoro sessions per day?</p>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setData((d) => ({ ...d, dailyTarget: Math.max(1, d.dailyTarget - 1) }))}
          className="w-14 h-14 text-2xl"
        >
          -
        </Button>
        <div className="text-center">
          <div className="text-5xl font-bold text-primary">{data.dailyTarget}</div>
          <p className="text-sm text-muted-foreground mt-1">sessions / day</p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setData((d) => ({ ...d, dailyTarget: Math.min(20, d.dailyTarget + 1) }))}
          className="w-14 h-14 text-2xl"
        >
          +
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {[2, 4, 6, 8].map((n) => (
          <Button
            key={n}
            variant={data.dailyTarget === n ? "default" : "outline"}
            size="sm"
            onClick={() => setData((d) => ({ ...d, dailyTarget: n }))}
          >
            {n}
          </Button>
        ))}
      </div>

      <div className="glass-card p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              That's about {data.dailyTarget * 25} minutes of focused work
            </p>
            <p className="text-xs text-muted-foreground">~{Math.round(data.dailyTarget * 25 / 60 * 10) / 10} hours</p>
          </div>
        </div>
      </div>
    </div>
  )

  // Setup phase - Experience level
  const renderExperienceStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Your experience level</h2>
        <p className="text-muted-foreground">Help us tailor your workout recommendations</p>
      </div>

      <div className="grid gap-3">
        {([
          { value: "beginner" as const, icon: Target, title: "Beginner", desc: "New to working out or returning after a break" },
          { value: "intermediate" as const, icon: TrendingUp, title: "Intermediate", desc: "Consistent for 6+ months with good form" },
          { value: "advanced" as const, icon: Trophy, title: "Advanced", desc: "Experienced athlete with structured programming" },
        ]).map((opt) => (
          <Card
            key={opt.value}
            className={`glass-card cursor-pointer transition-all ${
              data.experienceLevel === opt.value ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
            onClick={() => setData((d) => ({ ...d, experienceLevel: opt.value }))}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                data.experienceLevel === opt.value ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <opt.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{opt.title}</p>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </div>
              {data.experienceLevel === opt.value && <Check className="w-5 h-5 text-primary" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Setup phase - Workout frequency
  const renderFrequencyStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Workout frequency</h2>
        <p className="text-muted-foreground">How often do you plan to work out?</p>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setData((d) => ({ ...d, workoutFrequency: Math.max(1, d.workoutFrequency - 1) }))}
          className="w-14 h-14 text-2xl"
        >
          -
        </Button>
        <div className="text-center">
          <div className="text-5xl font-bold text-primary">{data.workoutFrequency}</div>
          <p className="text-sm text-muted-foreground mt-1">days / week</p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setData((d) => ({ ...d, workoutFrequency: Math.min(7, d.workoutFrequency + 1) }))}
          className="w-14 h-14 text-2xl"
        >
          +
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mt-4">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <Button
            key={n}
            variant={data.workoutFrequency === n ? "default" : "outline"}
            size="sm"
            onClick={() => setData((d) => ({ ...d, workoutFrequency: n }))}
            className="text-xs"
          >
            {n}
          </Button>
        ))}
      </div>

      <div className="glass-card p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <Dumbbell className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {data.workoutFrequency <= 2 ? "Light" : data.workoutFrequency <= 4 ? "Moderate" : "Intense"} schedule
            </p>
            <p className="text-xs text-muted-foreground">
              {data.workoutFrequency <= 2 ? "Great for building consistency" : 
               data.workoutFrequency <= 4 ? "Good balance of training and recovery" : 
               "Make sure to prioritize rest days"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // Setup phase - Workout duration
  const renderDurationStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Preferred duration</h2>
        <p className="text-muted-foreground">How long do you want your workouts to be?</p>
      </div>

      <div className="grid gap-3">
        {([
          { value: 30, title: "30 minutes", desc: "Quick & efficient - perfect for busy days" },
          { value: 45, title: "45 minutes", desc: "Balanced - good coverage of all muscle groups" },
          { value: 60, title: "60 minutes", desc: "Thorough - time for warm-up, work, and cool-down" },
          { value: 90, title: "90 minutes", desc: "Extended - for dedicated training sessions" },
        ]).map((opt) => (
          <Card
            key={opt.value}
            className={`glass-card cursor-pointer transition-all ${
              data.preferredWorkoutDuration === opt.value ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
            onClick={() => setData((d) => ({ ...d, preferredWorkoutDuration: opt.value }))}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                data.preferredWorkoutDuration === opt.value ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{opt.title}</p>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </div>
              {data.preferredWorkoutDuration === opt.value && <Check className="w-5 h-5 text-primary" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Setup phase - Gym mode
  const renderGymModeStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Gym Mode</h2>
        <p className="text-muted-foreground">Track your workouts with exercise-specific timers</p>
      </div>

      <Card
        className={`glass-card cursor-pointer transition-all ${
          data.gymMode ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
        }`}
        onClick={() => setData((d) => ({ ...d, gymMode: !d.gymMode }))}
      >
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                data.gymMode ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Enable Gym Mode</p>
                <p className="text-sm text-muted-foreground">Track sets, reps, weight & rest timers</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${
              data.gymMode ? "bg-primary" : "bg-muted"
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5 ${
                data.gymMode ? "translate-x-6" : "translate-x-0.5"
              }`} />
            </div>
          </div>

          {data.gymMode && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rest timer between sets</span>
                <span className="font-medium text-foreground">60 seconds</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Weight unit</span>
                <span className="font-medium text-foreground">kg</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You can customize these in Settings after onboarding
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {data.gymMode && (
        <div className="glass-card p-4 rounded-lg space-y-3">
          <h4 className="font-medium text-foreground">Gym mode includes:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Rest timer with customizable duration</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Track sets, reps, and weight per exercise</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Exercise library for quick access</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Workout volume and session stats</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )

  // Setup phase - Quick exercises
  const renderExercisesStep = () => {
    const suggestedExercises = [
      "Bench Press", "Squats", "Deadlifts", "Pull-ups",
      "Shoulder Press", "Bicep Curls", "Tricep Dips", "Lunges",
      "Plank", "Rows", "Lat Pulldown", "Leg Press"
    ]

    const toggleExercise = (exercise: string) => {
      setData((d) => ({
        ...d,
        quickExercises: d.quickExercises.includes(exercise)
          ? d.quickExercises.filter((e) => e !== exercise)
          : [...d.quickExercises, exercise]
      }))
    }

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Quick exercises</h2>
          <p className="text-muted-foreground">Select exercises you commonly do (optional)</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {suggestedExercises.map((exercise) => (
            <Button
              key={exercise}
              variant={data.quickExercises.includes(exercise) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleExercise(exercise)}
              className="justify-start h-auto py-3 text-left"
            >
              <div className="flex items-center space-x-2">
                {data.quickExercises.includes(exercise) && <Check className="w-4 h-4" />}
                <span>{exercise}</span>
              </div>
            </Button>
          ))}
        </div>

        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            {data.quickExercises.length} exercises selected. You can add more later in the gym.
          </p>
        </div>
      </div>
    )
  }

  // Setup phase - Notifications
  const renderNotificationsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Stay motivated</h2>
        <p className="text-muted-foreground">Choose how you want to be reminded</p>
      </div>

      <div className="grid gap-3">
        {([
          { value: "all" as const, icon: Bell, title: "All notifications", desc: "Timer alerts, rest reminders, and daily summaries" },
          { value: "important" as const, icon: Zap, title: "Important only", desc: "Timer completion and rest period alerts" },
          { value: "none" as const, icon: Clock, title: "Silent mode", desc: "No notifications - focus without interruptions" },
        ]).map((opt) => (
          <Card
            key={opt.value}
            className={`glass-card cursor-pointer transition-all ${
              data.notificationPreference === opt.value ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
            onClick={() => setData((d) => ({ ...d, notificationPreference: opt.value }))}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                data.notificationPreference === opt.value ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <opt.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{opt.title}</p>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </div>
              {data.notificationPreference === opt.value && <Check className="w-5 h-5 text-primary" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Setup phase - Theme
  const renderThemeStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Choose your theme</h2>
        <p className="text-muted-foreground">Pick what looks best to you</p>
      </div>

      <div className="grid gap-3">
        {([
          { value: "light" as ThemeChoice, icon: Sun, title: "Light", desc: "Clean and bright" },
          { value: "dark" as ThemeChoice, icon: Moon, title: "Dark", desc: "Easy on the eyes" },
          { value: "system" as ThemeChoice, icon: Target, title: "System", desc: "Match your device" },
        ]).map((opt) => (
          <Card
            key={opt.value}
            className={`glass-card cursor-pointer transition-all ${
              data.theme === opt.value ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
            onClick={() => setData((d) => ({ ...d, theme: opt.value }))}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                data.theme === opt.value ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <opt.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{opt.title}</p>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </div>
              {data.theme === opt.value && <Check className="w-5 h-5 text-primary" />}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div className="glass-card p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-foreground text-sm">Your Setup Summary</h4>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>• Goal: {data.goal === "both" ? "Productivity + Fitness" : data.goal === "fitness" ? "Fitness" : "Productivity"}</p>
          <p>• Daily target: {data.dailyTarget} Pomodoro sessions</p>
          <p>• Experience: {data.experienceLevel}</p>
          <p>• Workout frequency: {data.workoutFrequency} days/week</p>
          <p>• Workout duration: {data.preferredWorkoutDuration} minutes</p>
          <p>• Gym mode: {data.gymMode ? "Enabled" : "Disabled"}</p>
          {data.gymMode && <p>• Quick exercises: {data.quickExercises.length} selected</p>}
          <p>• Notifications: {data.notificationPreference}</p>
          <p>• Theme: {data.theme === "system" ? "System default" : data.theme}</p>
        </div>
      </div>
    </div>
  )

  const setupSteps = [
    renderGoalStep,
    renderDailyTargetStep,
    renderExperienceStep,
    renderFrequencyStep,
    renderGymModeStep,
    renderExercisesStep,
    renderNotificationsStep,
    renderThemeStep
  ]
  const stepLabels = ["Goal", "Target", "Level", "Frequency", "Gym", "Exercises", "Alerts", "Theme"]
  const currentSetupStep = setupSteps[setupStep]

  return (
    <div className="flex flex-col min-h-screen bg-background px-6 py-8">
      <div className="flex justify-end mb-4">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground text-sm">
          Skip
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center space-x-2 mb-6">
        {stepLabels.map((label, index) => (
          <div key={index} className="flex-1">
            <div className={`h-1 rounded-full transition-colors ${
              index <= setupStep ? "bg-primary" : "bg-muted"
            }`} />
            <p className={`text-xs mt-1 text-center ${
              index === setupStep ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col justify-center transition-all duration-300 ease-out ${transitionClass}`}>
        {currentSetupStep()}
      </div>

      {/* Next button */}
      <div className="mt-8 space-y-2">
        <Button
          onClick={handleSetupNext}
          className="w-full h-12 text-lg"
          disabled={setupStep === 0 && !data.goal}
        >
          {setupStep === 3 ? "Get Started" : "Continue"}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        {setupStep > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setPhase("out")
              setTimeout(() => {
                setSetupStep((s) => s - 1)
                setPhase("in")
                requestAnimationFrame(() => {
                  setTimeout(() => setPhase("idle"), 200)
                })
              }, 200)
            }}
            className="w-full"
          >
            Back
          </Button>
        )}
      </div>
    </div>
  )
}
