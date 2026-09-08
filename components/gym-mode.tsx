"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dumbbell,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Check,
  Trash2,
  Clock,
  Flame,
  Activity,
  ChevronRight,
  Loader2,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  BarChart3,
} from "lucide-react"
import { apiClient, GymExercise, GymStats, GymSessionLog, UserSettingsData, ExerciseProgression, ProgressionExerciseStats, PersonalRecord } from "@/lib/api-client"
import { toast } from "sonner"

// Workout Template Types
interface WorkoutTemplateExercise {
  name: string
  muscleGroup: string
  defaultSets: number
  defaultReps: number
  defaultWeight?: number
  restSeconds: number
  notes?: string
}

interface WorkoutTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: number // estimated minutes
  exercises: WorkoutTemplateExercise[]
  icon: string
  color: string
}

// Pre-built workout templates
const workoutTemplates: WorkoutTemplate[] = [
  {
    id: "push-day",
    name: "Push Day",
    description: "Chest, shoulders, and triceps focus",
    category: "Push/Pull/Legs",
    difficulty: "intermediate",
    duration: 45,
    icon: "💪",
    color: "bg-red-500",
    exercises: [
      { name: "Bench Press", muscleGroup: "Chest", defaultSets: 4, defaultReps: 8, defaultWeight: 60, restSeconds: 90 },
      { name: "Incline Dumbbell Press", muscleGroup: "Chest", defaultSets: 3, defaultReps: 10, defaultWeight: 24, restSeconds: 60 },
      { name: "Overhead Press", muscleGroup: "Shoulders", defaultSets: 4, defaultReps: 8, defaultWeight: 40, restSeconds: 90 },
      { name: "Lateral Raises", muscleGroup: "Shoulders", defaultSets: 3, defaultReps: 12, defaultWeight: 10, restSeconds: 45 },
      { name: "Tricep Dips", muscleGroup: "Arms", defaultSets: 3, defaultReps: 12, restSeconds: 60 },
      { name: "Tricep Pushdowns", muscleGroup: "Arms", defaultSets: 3, defaultReps: 12, defaultWeight: 20, restSeconds: 60 },
    ],
  },
  {
    id: "pull-day",
    name: "Pull Day",
    description: "Back and biceps focus",
    category: "Push/Pull/Legs",
    difficulty: "intermediate",
    duration: 45,
    icon: "🏋️",
    color: "bg-blue-500",
    exercises: [
      { name: "Deadlifts", muscleGroup: "Back", defaultSets: 4, defaultReps: 6, defaultWeight: 80, restSeconds: 120 },
      { name: "Pull-ups", muscleGroup: "Back", defaultSets: 4, defaultReps: 8, restSeconds: 90 },
      { name: "Barbell Rows", muscleGroup: "Back", defaultSets: 4, defaultReps: 8, defaultWeight: 60, restSeconds: 90 },
      { name: "Lat Pulldown", muscleGroup: "Back", defaultSets: 3, defaultReps: 10, defaultWeight: 50, restSeconds: 60 },
      { name: "Face Pulls", muscleGroup: "Shoulders", defaultSets: 3, defaultReps: 15, defaultWeight: 15, restSeconds: 45 },
      { name: "Barbell Curls", muscleGroup: "Arms", defaultSets: 3, defaultReps: 10, defaultWeight: 25, restSeconds: 60 },
    ],
  },
  {
    id: "leg-day",
    name: "Leg Day",
    description: "Quads, hamstrings, and calves",
    category: "Push/Pull/Legs",
    difficulty: "intermediate",
    duration: 50,
    icon: "🦵",
    color: "bg-green-500",
    exercises: [
      { name: "Squats", muscleGroup: "Legs", defaultSets: 4, defaultReps: 8, defaultWeight: 80, restSeconds: 120 },
      { name: "Romanian Deadlifts", muscleGroup: "Legs", defaultSets: 4, defaultReps: 8, defaultWeight: 60, restSeconds: 90 },
      { name: "Leg Press", muscleGroup: "Legs", defaultSets: 3, defaultReps: 12, defaultWeight: 120, restSeconds: 90 },
      { name: "Leg Extensions", muscleGroup: "Legs", defaultSets: 3, defaultReps: 12, defaultWeight: 40, restSeconds: 60 },
      { name: "Leg Curls", muscleGroup: "Legs", defaultSets: 3, defaultReps: 12, defaultWeight: 35, restSeconds: 60 },
      { name: "Calf Raises", muscleGroup: "Legs", defaultSets: 4, defaultReps: 15, defaultWeight: 60, restSeconds: 45 },
    ],
  },
  {
    id: "full-body",
    name: "Full Body",
    description: "Complete body workout",
    category: "Full Body",
    difficulty: "beginner",
    duration: 40,
    icon: "🔥",
    color: "bg-orange-500",
    exercises: [
      { name: "Squats", muscleGroup: "Legs", defaultSets: 3, defaultReps: 10, defaultWeight: 40, restSeconds: 90 },
      { name: "Bench Press", muscleGroup: "Chest", defaultSets: 3, defaultReps: 10, defaultWeight: 40, restSeconds: 90 },
      { name: "Barbell Rows", muscleGroup: "Back", defaultSets: 3, defaultReps: 10, defaultWeight: 40, restSeconds: 90 },
      { name: "Overhead Press", muscleGroup: "Shoulders", defaultSets: 3, defaultReps: 10, defaultWeight: 30, restSeconds: 60 },
      { name: "Deadlifts", muscleGroup: "Back", defaultSets: 3, defaultReps: 8, defaultWeight: 60, restSeconds: 120 },
      { name: "Plank", muscleGroup: "Core", defaultSets: 3, defaultReps: 1, restSeconds: 45 },
    ],
  },
  {
    id: "upper-body",
    name: "Upper Body",
    description: "All upper body muscles",
    category: "Split",
    difficulty: "intermediate",
    duration: 45,
    icon: "💪",
    color: "bg-purple-500",
    exercises: [
      { name: "Bench Press", muscleGroup: "Chest", defaultSets: 4, defaultReps: 8, defaultWeight: 60, restSeconds: 90 },
      { name: "Pull-ups", muscleGroup: "Back", defaultSets: 4, defaultReps: 8, restSeconds: 90 },
      { name: "Overhead Press", muscleGroup: "Shoulders", defaultSets: 3, defaultReps: 10, defaultWeight: 40, restSeconds: 60 },
      { name: "Barbell Rows", muscleGroup: "Back", defaultSets: 3, defaultReps: 10, defaultWeight: 50, restSeconds: 60 },
      { name: "Bicep Curls", muscleGroup: "Arms", defaultSets: 3, defaultReps: 12, defaultWeight: 15, restSeconds: 45 },
      { name: "Tricep Dips", muscleGroup: "Arms", defaultSets: 3, defaultReps: 12, restSeconds: 45 },
    ],
  },
  {
    id: "lower-body",
    name: "Lower Body",
    description: "Legs and glutes focused",
    category: "Split",
    difficulty: "intermediate",
    duration: 45,
    icon: "🦵",
    color: "bg-yellow-500",
    exercises: [
      { name: "Squats", muscleGroup: "Legs", defaultSets: 4, defaultReps: 8, defaultWeight: 80, restSeconds: 120 },
      { name: "Romanian Deadlifts", muscleGroup: "Legs", defaultSets: 4, defaultReps: 8, defaultWeight: 60, restSeconds: 90 },
      { name: "Bulgarian Split Squats", muscleGroup: "Legs", defaultSets: 3, defaultReps: 10, defaultWeight: 20, restSeconds: 60 },
      { name: "Leg Press", muscleGroup: "Legs", defaultSets: 3, defaultReps: 12, defaultWeight: 120, restSeconds: 90 },
      { name: "Hip Thrusts", muscleGroup: "Legs", defaultSets: 3, defaultReps: 12, defaultWeight: 60, restSeconds: 60 },
      { name: "Calf Raises", muscleGroup: "Legs", defaultSets: 4, defaultReps: 15, defaultWeight: 60, restSeconds: 45 },
    ],
  },
  {
    id: "push-pull-legs",
    name: "Push/Pull/Legs",
    description: "Classic 3-day split routine",
    category: "Push/Pull/Legs",
    difficulty: "intermediate",
    duration: 50,
    icon: "🔄",
    color: "bg-indigo-500",
    exercises: [
      { name: "Bench Press", muscleGroup: "Chest", defaultSets: 4, defaultReps: 8, defaultWeight: 60, restSeconds: 90 },
      { name: "Overhead Press", muscleGroup: "Shoulders", defaultSets: 4, defaultReps: 8, defaultWeight: 40, restSeconds: 90 },
      { name: "Pull-ups", muscleGroup: "Back", defaultSets: 4, defaultReps: 8, restSeconds: 90 },
      { name: "Barbell Rows", muscleGroup: "Back", defaultSets: 4, defaultReps: 8, defaultWeight: 60, restSeconds: 90 },
      { name: "Squats", muscleGroup: "Legs", defaultSets: 4, defaultReps: 8, defaultWeight: 80, restSeconds: 120 },
      { name: "Deadlifts", muscleGroup: "Legs", defaultSets: 4, defaultReps: 6, defaultWeight: 80, restSeconds: 120 },
    ],
  },
  {
    id: "strength-focus",
    name: "Strength Focus",
    description: "Heavy compounds for strength gains",
    category: "Strength",
    difficulty: "advanced",
    duration: 60,
    icon: "🏋️",
    color: "bg-gray-500",
    exercises: [
      { name: "Squats", muscleGroup: "Legs", defaultSets: 5, defaultReps: 5, defaultWeight: 100, restSeconds: 180 },
      { name: "Bench Press", muscleGroup: "Chest", defaultSets: 5, defaultReps: 5, defaultWeight: 80, restSeconds: 180 },
      { name: "Deadlifts", muscleGroup: "Back", defaultSets: 5, defaultReps: 3, defaultWeight: 120, restSeconds: 180 },
      { name: "Overhead Press", muscleGroup: "Shoulders", defaultSets: 5, defaultReps: 5, defaultWeight: 50, restSeconds: 180 },
    ],
  },
  {
    id: "beginner-full-body",
    name: "Beginner Full Body",
    description: "Perfect for starting your fitness journey",
    category: "Full Body",
    difficulty: "beginner",
    duration: 30,
    icon: "🌱",
    color: "bg-emerald-500",
    exercises: [
      { name: "Goblet Squats", muscleGroup: "Legs", defaultSets: 3, defaultReps: 12, defaultWeight: 10, restSeconds: 60 },
      { name: "Push-ups", muscleGroup: "Chest", defaultSets: 3, defaultReps: 10, restSeconds: 60 },
      { name: "Dumbbell Rows", muscleGroup: "Back", defaultSets: 3, defaultReps: 10, defaultWeight: 10, restSeconds: 60 },
      { name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", defaultSets: 3, defaultReps: 10, defaultWeight: 8, restSeconds: 60 },
      { name: "Lunges", muscleGroup: "Legs", defaultSets: 3, defaultReps: 10, defaultWeight: 10, restSeconds: 60 },
      { name: "Plank", muscleGroup: "Core", defaultSets: 3, defaultReps: 1, restSeconds: 45 },
    ],
  },
  {
    id: "quick-blast",
    name: "Quick Blast",
    description: "20-minute high-intensity session",
    category: "Quick",
    difficulty: "beginner",
    duration: 20,
    icon: "⚡",
    color: "bg-pink-500",
    exercises: [
      { name: "Squats", muscleGroup: "Legs", defaultSets: 2, defaultReps: 15, defaultWeight: 30, restSeconds: 30 },
      { name: "Push-ups", muscleGroup: "Chest", defaultSets: 2, defaultReps: 15, restSeconds: 30 },
      { name: "Bent-over Rows", muscleGroup: "Back", defaultSets: 2, defaultReps: 15, defaultWeight: 20, restSeconds: 30 },
      { name: "Overhead Press", muscleGroup: "Shoulders", defaultSets: 2, defaultReps: 12, defaultWeight: 15, restSeconds: 30 },
      { name: "Lunges", muscleGroup: "Legs", defaultSets: 2, defaultReps: 12, defaultWeight: 10, restSeconds: 30 },
    ],
  },
]

interface GymModeProps {
  settings: UserSettingsData | null
}

type GymView = "exercises" | "active-workout" | "workout-session" | "stats" | "templates" | "progression"

export function GymMode({ settings }: GymModeProps) {
  const [view, setView] = useState<GymView>("exercises")

  // Exercise library
  const [exercises, setExercises] = useState<GymExercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newExerciseOpen, setNewExerciseOpen] = useState(false)
  const [newExName, setNewExName] = useState("")
  const [newExMuscle, setNewExMuscle] = useState("")
  const [newExSets, setNewExSets] = useState(3)
  const [newExReps, setNewExReps] = useState(10)
  const [newExWeight, setNewExWeight] = useState("")
  const [newExRest, setNewExRest] = useState(settings?.restTimerSeconds || 60)

  // Active workout
  const [activeExercise, setActiveExercise] = useState<GymExercise | null>(null)
  const [currentSet, setCurrentSet] = useState(1)
  const [setReps, setSetReps] = useState("")
  const [setWeight, setSetWeight] = useState("")
  const [workoutSets, setWorkoutSets] = useState<GymSessionLog[]>([])
  const [isResting, setIsResting] = useState(false)
  const [restTimeLeft, setRestTimeLeft] = useState(0)
  const restTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Stats
  const [stats, setStats] = useState<GymStats>({
    totalSets: 0,
    totalVolume: 0,
    totalReps: 0,
    todaySets: 0,
    todayVolume: 0,
  })
  const [recentSessions, setRecentSessions] = useState<GymSessionLog[]>([])

  // Workout templates
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null)
  const [templateExercises, setTemplateExercises] = useState<WorkoutTemplateExercise[]>([])

  // Progression tracking
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null)
  const [progressionData, setProgressionData] = useState<ExerciseProgression | null>(null)
  const [progressionStats, setProgressionStats] = useState<ProgressionExerciseStats[]>([])
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [isLoadingProgression, setIsLoadingProgression] = useState(false)

  // Workout session state
  const [workoutSession, setWorkoutSession] = useState<{
    isActive: boolean
    startTime: Date | null
    exercises: Array<{
      exercise: GymExercise
      sets: GymSessionLog[]
      currentSet: number
      isResting: boolean
      restTimeLeft: number
    }>
    currentExerciseIndex: number
    totalVolume: number
    totalReps: number
    duration: number
  }>({
    isActive: false,
    startTime: null,
    exercises: [],
    currentExerciseIndex: 0,
    totalVolume: 0,
    totalReps: 0,
    duration: 0,
  })

  // Session timer
  const [sessionTime, setSessionTime] = useState(0)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchExercises = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.gym.getExercises()
      setExercises(data)
    } catch {
      toast.error("Failed to load exercises")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([apiClient.gym.getStats(), apiClient.gym.getRecentSessions()])
      setStats(s)
      setRecentSessions(r)
    } catch {}
  }, [])

  useEffect(() => {
    fetchExercises()
    fetchStats()
  }, [fetchExercises, fetchStats])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current)
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
    }
  }, [])

  const addExercise = async () => {
    if (!newExName.trim()) return
    try {
      const created = await apiClient.gym.createExercise({
        name: newExName.trim(),
        muscleGroup: newExMuscle.trim() || "General",
        defaultSets: newExSets,
        defaultReps: newExReps,
        defaultWeight: newExWeight ? parseFloat(newExWeight) : undefined,
        restSeconds: newExRest,
      })
      setExercises((prev) => [created, ...prev])
      setNewExName("")
      setNewExMuscle("")
      setNewExSets(3)
      setNewExReps(10)
      setNewExWeight("")
      setNewExRest(settings?.restTimerSeconds || 60)
      setNewExerciseOpen(false)
      toast.success("Exercise added to library")
    } catch {
      toast.error("Failed to create exercise")
    }
  }

  const deleteExercise = async (id: number) => {
    try {
      await apiClient.gym.deleteExercise(id)
      setExercises((prev) => prev.filter((e) => e.id !== id))
      toast.success("Exercise removed")
    } catch {
      toast.error("Failed to delete exercise")
    }
  }

  const startWorkout = (exercise: GymExercise) => {
    setActiveExercise(exercise)
    setCurrentSet(1)
    setSetReps(String(exercise.defaultReps))
    setSetWeight(exercise.defaultWeight ? String(exercise.defaultWeight) : "")
    setWorkoutSets([])
    setView("active-workout")
  }

  const startFullWorkout = (selectedExercises: GymExercise[]) => {
    if (selectedExercises.length === 0) return
    
    const workoutExercises = selectedExercises.map(ex => ({
      exercise: ex,
      sets: [],
      currentSet: 1,
      isResting: false,
      restTimeLeft: 0,
    }))

    setWorkoutSession({
      isActive: true,
      startTime: new Date(),
      exercises: workoutExercises,
      currentExerciseIndex: 0,
      totalVolume: 0,
      totalReps: 0,
      duration: 0,
    })

    // Start session timer
    setSessionTime(0)
    sessionTimerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)

    setView("workout-session")
  }

  const completeSet = async () => {
    if (!activeExercise) return
    try {
      const logged = await apiClient.gym.logSet({
        exerciseId: activeExercise.id,
        setNumber: currentSet,
        reps: parseInt(setReps) || activeExercise.defaultReps,
        weightKg: setWeight ? parseFloat(setWeight) : undefined,
        restAfterSec: activeExercise.restSeconds,
        completed: true,
      })
      setWorkoutSets((prev) => [...prev, logged])

      // Start rest timer
      const restSec = activeExercise.restSeconds || settings?.restTimerSeconds || 60
      setRestTimeLeft(restSec)
      setIsResting(true)

      restTimerRef.current = setInterval(() => {
        setRestTimeLeft((prev) => {
          if (prev <= 1) {
            if (restTimerRef.current) clearInterval(restTimerRef.current)
            setIsResting(false)
            setCurrentSet((s) => s + 1)
            toast.info("Rest over — next set!")
            return 0
          }
          return prev - 1
        })
      }, 1000)

      toast.success(`Set ${currentSet} logged!`)
    } catch {
      toast.error("Failed to log set")
    }
  }

  const skipRest = () => {
    if (restTimerRef.current) clearInterval(restTimerRef.current)
    setIsResting(false)
    setCurrentSet((s) => s + 1)
    setRestTimeLeft(0)
  }

  const finishWorkout = async () => {
    if (restTimerRef.current) clearInterval(restTimerRef.current)
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
    setIsResting(false)
    setActiveExercise(null)
    setWorkoutSession(prev => ({ ...prev, isActive: false }))
    setView("exercises")
    fetchStats()
    toast.success(`Workout complete! ${workoutSets.length} sets logged`)
  }

  const finishFullWorkout = async () => {
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
    
    setWorkoutSession(prev => ({ ...prev, isActive: false, duration: sessionTime }))
    setView("exercises")
    fetchStats()
    toast.success(`Workout complete! Duration: ${formatRestTime(sessionTime)}`)
  }

  const moveNextExercise = () => {
    setWorkoutSession(prev => ({
      ...prev,
      currentExerciseIndex: Math.min(prev.currentExerciseIndex + 1, prev.exercises.length - 1)
    }))
  }

  const movePrevExercise = () => {
    setWorkoutSession(prev => ({
      ...prev,
      currentExerciseIndex: Math.max(prev.currentExerciseIndex - 1, 0)
    }))
  }

  // Start workout from template
  const startWorkoutFromTemplate = async (template: WorkoutTemplate) => {
    try {
      // First, create exercises in the user's library that don't exist yet
      const createdExercises: GymExercise[] = []
      
      for (const templateEx of template.exercises) {
        // Check if exercise already exists in library
        const existingExercise = exercises.find(e => 
          e.name.toLowerCase() === templateEx.name.toLowerCase()
        )
        
        if (existingExercise) {
          createdExercises.push(existingExercise)
        } else {
          // Create new exercise
          const newExercise = await apiClient.gym.createExercise({
            name: templateEx.name,
            muscleGroup: templateEx.muscleGroup,
            defaultSets: templateEx.defaultSets,
            defaultReps: templateEx.defaultReps,
            defaultWeight: templateEx.defaultWeight,
            restSeconds: templateEx.restSeconds,
          })
          createdExercises.push(newExercise)
        }
      }
      
      // Update local exercises state
      fetchExercises()
      
      // Start workout session with these exercises
      startFullWorkout(createdExercises)
      
      toast.success(`Starting ${template.name} workout!`)
    } catch (error) {
      toast.error("Failed to start workout from template")
    }
  }

  // Filter templates by difficulty based on user experience
  const getRecommendedTemplates = () => {
    // For now, show all templates but highlight recommended ones
    return workoutTemplates
  }

  // Progression tracking functions
  const fetchProgressionData = useCallback(async (exerciseId: number) => {
    try {
      setIsLoadingProgression(true)
      const data = await apiClient.gym.getExerciseProgression(exerciseId)
      setProgressionData(data)
    } catch {
      toast.error("Failed to load progression data")
    } finally {
      setIsLoadingProgression(false)
    }
  }, [])

  const fetchProgressionStats = useCallback(async () => {
    try {
      const [stats, records] = await Promise.all([
        apiClient.gym.getProgressionStats(),
        apiClient.gym.getPersonalRecords(),
      ])
      setProgressionStats(stats)
      setPersonalRecords(records)
    } catch {
      // Silent fail for progression stats
    }
  }, [])

  useEffect(() => {
    fetchProgressionStats()
  }, [fetchProgressionStats])

  useEffect(() => {
    if (selectedExerciseId) {
      fetchProgressionData(selectedExerciseId)
    }
  }, [selectedExerciseId, fetchProgressionData])

  const formatRestTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // Muscle group color mapping
  const muscleColor = (group: string) => {
    const colors: Record<string, string> = {
      Chest: "bg-red-500",
      Back: "bg-blue-500",
      Legs: "bg-green-500",
      Shoulders: "bg-yellow-500",
      Arms: "bg-purple-500",
      Core: "bg-orange-500",
      Cardio: "bg-pink-500",
      General: "bg-gray-500",
    }
    return colors[group] || "bg-gray-500"
  }

  // Difficulty badge color
  const difficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800"
      case "intermediate": return "bg-yellow-100 text-yellow-800"
      case "advanced": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // --- PROGRESSION VIEW ---
  if (view === "progression") {
    return (
      <div className="space-y-6 page-transition">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Progression Tracking</h1>
            <p className="text-sm text-muted-foreground">Track your strength gains over time</p>
          </div>
          <Button variant="outline" onClick={() => setView("exercises")}>
            <Dumbbell className="w-4 h-4 mr-1" />
            My Exercises
          </Button>
        </div>

        {/* Personal Records Summary */}
        {personalRecords.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Personal Records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {personalRecords.slice(0, 5).map((record) => (
                  <div key={record.exerciseId} className="flex items-center justify-between p-3 glass-card rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${muscleColor(record.muscleGroup)}`}>
                        <Dumbbell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{record.exerciseName}</p>
                        <p className="text-xs text-muted-foreground">{record.totalSessions} sessions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">{record.maxWeight.weight}kg × {record.maxWeight.reps}</p>
                      <p className="text-xs text-muted-foreground">Max weight</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise Selection for Detailed View */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span>Select Exercise</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Add exercises to your library to track progression
              </p>
            ) : (
              <div className="space-y-2">
                {exercises.map((ex) => (
                  <Button
                    key={ex.id}
                    variant={selectedExerciseId === ex.id ? "default" : "outline"}
                    className="w-full justify-start h-auto py-3"
                    onClick={() => setSelectedExerciseId(ex.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${muscleColor(ex.muscleGroup)}`}>
                        <Dumbbell className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">{ex.muscleGroup}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Progression View */}
        {selectedExerciseId && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Progression Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProgression ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : progressionData ? (
                <div className="space-y-4">
                  {/* Exercise Info */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${muscleColor(progressionData.exercise.muscleGroup)}`}>
                      <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{progressionData.exercise.name}</p>
                      <p className="text-sm text-muted-foreground">{progressionData.totalSessions} total sessions</p>
                    </div>
                  </div>

                  {/* Personal Records */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 glass-card rounded-lg">
                      <div className="text-lg font-bold text-primary">{progressionData.personalRecords.maxWeight}kg</div>
                      <div className="text-xs text-muted-foreground">Max Weight</div>
                    </div>
                    <div className="text-center p-3 glass-card rounded-lg">
                      <div className="text-lg font-bold text-accent">{progressionData.personalRecords.maxReps}</div>
                      <div className="text-xs text-muted-foreground">Max Reps</div>
                    </div>
                    <div className="text-center p-3 glass-card rounded-lg">
                      <div className="text-lg font-bold text-foreground">{progressionData.personalRecords.maxVolume}kg</div>
                      <div className="text-xs text-muted-foreground">Max Volume</div>
                    </div>
                  </div>

                  {/* Trends */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Recent Trends</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 glass-card rounded-lg">
                        <div className="flex items-center space-x-2">
                          {progressionData.trends.weightTrendDirection === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : progressionData.trends.weightTrendDirection === 'down' ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <Minus className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm text-foreground">Weight</span>
                        </div>
                        <p className={`text-lg font-semibold mt-1 ${
                          progressionData.trends.weightTrendDirection === 'up' ? 'text-green-500' :
                          progressionData.trends.weightTrendDirection === 'down' ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {progressionData.trends.weightTrend > 0 ? '+' : ''}{progressionData.trends.weightTrend}kg
                        </p>
                      </div>
                      <div className="p-3 glass-card rounded-lg">
                        <div className="flex items-center space-x-2">
                          {progressionData.trends.repsTrendDirection === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : progressionData.trends.repsTrendDirection === 'down' ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <Minus className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm text-foreground">Reps</span>
                        </div>
                        <p className={`text-lg font-semibold mt-1 ${
                          progressionData.trends.repsTrendDirection === 'up' ? 'text-green-500' :
                          progressionData.trends.repsTrendDirection === 'down' ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {progressionData.trends.repsTrend > 0 ? '+' : ''}{progressionData.trends.repsTrend}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Simple Progression Chart (weight over time) */}
                  {progressionData.progressionData.length > 1 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Weight Progression</h4>
                      <div className="glass-card p-3 rounded-lg">
                        <div className="flex items-end space-x-1 h-32">
                          {progressionData.progressionData.slice(-10).map((point, idx) => {
                            const maxWeight = Math.max(...progressionData.progressionData.map(p => p.maxWeight))
                            const height = maxWeight > 0 ? (point.maxWeight / maxWeight) * 100 : 0
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center">
                                <div className="text-xs text-muted-foreground mb-1">{point.maxWeight}</div>
                                <div
                                  className="w-full bg-primary/20 rounded-t"
                                  style={{ height: `${Math.max(height, 5)}%` }}
                                />
                                <div className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
                                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Volume Progression */}
                  {progressionData.progressionData.length > 1 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Volume Progression</h4>
                      <div className="glass-card p-3 rounded-lg">
                        <div className="flex items-end space-x-1 h-32">
                          {progressionData.progressionData.slice(-10).map((point, idx) => {
                            const maxVolume = Math.max(...progressionData.progressionData.map(p => p.totalVolume))
                            const height = maxVolume > 0 ? (point.totalVolume / maxVolume) * 100 : 0
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center">
                                <div className="text-xs text-muted-foreground mb-1">{point.totalVolume}</div>
                                <div
                                  className="w-full bg-accent/20 rounded-t"
                                  style={{ height: `${Math.max(height, 5)}%` }}
                                />
                                <div className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
                                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 glass-card rounded-lg">
                      <div className="text-lg font-bold text-primary">{progressionData.totalVolume}kg</div>
                      <div className="text-xs text-muted-foreground">Total Volume</div>
                    </div>
                    <div className="text-center p-3 glass-card rounded-lg">
                      <div className="text-lg font-bold text-accent">{progressionData.totalReps}</div>
                      <div className="text-xs text-muted-foreground">Total Reps</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No progression data available yet. Start logging sets!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Exercises Progression Stats */}
        {progressionStats.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Exercise Progression Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {progressionStats.map((stat) => (
                  <div key={stat.exerciseId} className="flex items-center justify-between p-2 glass-card rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${muscleColor(stat.muscleGroup)}`} />
                      <span className="text-sm font-medium text-foreground">{stat.exerciseName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {stat.weightProgression > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : stat.weightProgression < 0 ? (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      ) : (
                        <Minus className="w-3 h-3 text-gray-500" />
                      )}
                      <span className={`text-xs ${
                        stat.weightProgression > 0 ? 'text-green-500' :
                        stat.weightProgression < 0 ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {stat.weightProgression > 0 ? '+' : ''}{stat.weightProgression}kg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // --- TEMPLATES VIEW ---
  if (view === "templates") {
    return (
      <div className="space-y-6 page-transition">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workout Templates</h1>
            <p className="text-sm text-muted-foreground">Pre-built routines for your training</p>
          </div>
          <Button variant="outline" onClick={() => setView("exercises")}>
            <Dumbbell className="w-4 h-4 mr-1" />
            My Exercises
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{workoutTemplates.length}</div>
              <div className="text-xs text-muted-foreground">Templates</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{exercises.length}</div>
              <div className="text-xs text-muted-foreground">Your Exercises</div>
            </CardContent>
          </Card>
        </div>

        {/* Template Categories */}
        <div className="space-y-4">
          {Object.entries(workoutTemplates.reduce((acc, template) => {
            if (!acc[template.category]) acc[template.category] = []
            acc[template.category].push(template)
            return acc
          }, {} as Record<string, WorkoutTemplate[]>)).map(([category, templates]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{category}</h3>
              <div className="grid gap-3">
                {templates.map((template) => (
                  <Card key={template.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl ${template.color}`}>
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-foreground">{template.name}</p>
                            <Badge className={`text-xs ${difficultyColor(template.difficulty)}`}>
                              {template.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Dumbbell className="w-3 h-3 mr-1" />
                              {template.exercises.length} exercises
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              ~{template.duration} min
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => startWorkoutFromTemplate(template)}
                          className="shrink-0"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      </div>
                      
                      {/* Exercise Preview */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex flex-wrap gap-1">
                          {template.exercises.slice(0, 4).map((ex, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {ex.name}
                            </Badge>
                          ))}
                          {template.exercises.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.exercises.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Create Custom Template */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Want a custom routine?</p>
              <Button 
                variant="outline" 
                onClick={() => setView("exercises")}
                className="glass-card bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Build Your Own Workout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- EXERCISES VIEW ---
  if (view === "exercises") {
    return (
      <div className="space-y-6 page-transition">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gym Exercises</h1>
            <p className="text-sm text-muted-foreground">Your exercise library</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setView("templates")}>
              <Flame className="w-4 h-4 mr-1" />
              Templates
            </Button>
            <Button variant="outline" onClick={() => setView("progression")}>
              <TrendingUp className="w-4 h-4 mr-1" />
              Progression
            </Button>
            {exercises.length > 0 && (
              <Button variant="outline" onClick={() => startFullWorkout(exercises.slice(0, 3))}>
                <Play className="w-4 h-4 mr-1" />
                Quick Workout
              </Button>
            )}
            <Button onClick={() => setNewExerciseOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Exercise
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.todaySets}</div>
              <div className="text-xs text-muted-foreground">Sets Today</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{stats.todayVolume}kg</div>
              <div className="text-xs text-muted-foreground">Volume Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Exercise Library */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : exercises.length === 0 ? (
          <Card className="glass-card text-center py-12">
            <CardContent className="space-y-4">
              <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">No exercises yet</h3>
                <p className="text-sm text-muted-foreground">Add exercises to build your workout library</p>
              </div>
              <Button onClick={() => setNewExerciseOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {exercises.map((ex) => (
              <Card key={ex.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${muscleColor(ex.muscleGroup)}`}>
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{ex.name}</p>
                      <div className="flex items-center space-x-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{ex.muscleGroup}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {ex.defaultSets}×{ex.defaultReps}
                          {ex.defaultWeight ? ` @ ${ex.defaultWeight}kg` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-0.5" />
                          {ex.restSeconds}s rest
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button size="sm" onClick={() => startWorkout(ex)}>
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 p-2"
                        onClick={() => deleteExercise(ex.id)}
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

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Recent Sets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentSessions.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${muscleColor(s.exercise?.muscleGroup || "General")}`} />
                    <span className="text-foreground">{s.exercise?.name || "Exercise"}</span>
                  </div>
                  <span className="text-muted-foreground">
                    Set {s.setNumber}: {s.reps} reps{s.weightKg ? ` @ ${s.weightKg}kg` : ""}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Add Exercise Dialog */}
        <Dialog open={newExerciseOpen} onOpenChange={setNewExerciseOpen}>
          <DialogContent className="glass-card" showCloseButton>
            <DialogHeader>
              <DialogTitle>Add Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Exercise Name</label>
                <Input
                  placeholder="e.g. Bench Press"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Muscle Group</label>
                <Input
                  placeholder="e.g. Chest, Back, Legs"
                  value={newExMuscle}
                  onChange={(e) => setNewExMuscle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Sets</label>
                  <Input
                    type="number"
                    min={1}
                    value={newExSets}
                    onChange={(e) => setNewExSets(parseInt(e.target.value) || 3)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Reps</label>
                  <Input
                    type="number"
                    min={1}
                    value={newExReps}
                    onChange={(e) => setNewExReps(parseInt(e.target.value) || 10)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Weight ({settings?.weightUnit || "kg"})</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="Optional"
                    value={newExWeight}
                    onChange={(e) => setNewExWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Rest (sec)</label>
                  <Input
                    type="number"
                    min={10}
                    value={newExRest}
                    onChange={(e) => setNewExRest(parseInt(e.target.value) || 60)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewExerciseOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addExercise} disabled={!newExName.trim()}>
                Add Exercise
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // --- ACTIVE WORKOUT VIEW ---
  if (view === "active-workout" && activeExercise) {
    return (
      <div className="space-y-6 page-transition">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Active Workout</h1>
            <p className="text-sm text-muted-foreground">{activeExercise.name}</p>
          </div>
          <Button variant="outline" onClick={finishWorkout} className="glass-card bg-transparent">
            Finish
          </Button>
        </div>

        {/* Rest Timer (when resting) */}
        {isResting && (
          <Card className="glass-card ring-2 ring-accent">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-accent">Rest Timer</span>
              </div>
              <div className="text-5xl font-bold text-foreground timer-pulse">
                {formatRestTime(restTimeLeft)}
              </div>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={skipRest} className="glass-card bg-transparent">
                  Skip Rest
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Set Input */}
        {!isResting && (
          <Card className="glass-card">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Set {currentSet} of {activeExercise.defaultSets}</p>
                <div className="flex items-center justify-center space-x-4 mt-2">
                  <Badge variant="secondary" className="text-sm">
                    {activeExercise.muscleGroup}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Reps</label>
                  <Input
                    type="number"
                    min={1}
                    value={setReps}
                    onChange={(e) => setSetReps(e.target.value)}
                    className="text-center text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Weight ({settings?.weightUnit || "kg"})
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={setWeight}
                    onChange={(e) => setSetWeight(e.target.value)}
                    placeholder="0"
                    className="text-center text-lg"
                  />
                </div>
              </div>

              <Button onClick={completeSet} className="w-full h-12" size="lg">
                <Check className="w-5 h-5 mr-2" />
                Complete Set
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logged Sets */}
        {workoutSets.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Logged Sets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workoutSets.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 glass-card rounded">
                  <span className="text-sm font-medium text-foreground">Set {s.setNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {s.reps} reps{s.weightKg ? ` × ${s.weightKg}kg` : ""}
                  </span>
                  <Check className="w-4 h-4 text-primary" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Workout Summary (always show stats) */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-primary">{workoutSets.length}</div>
                <div className="text-xs text-muted-foreground">Sets Done</div>
              </div>
              <div>
                <div className="text-xl font-bold text-accent">
                  {workoutSets.reduce((sum, s) => sum + s.reps, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Reps</div>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">
                  {workoutSets.reduce((sum, s) => sum + ((s.weightKg || 0) * s.reps), 0)}kg
                </div>
                <div className="text-xs text-muted-foreground">Volume</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- WORKOUT SESSION VIEW (Multi-exercise with timer coordination) ---
  if (view === "workout-session" && workoutSession.isActive) {
    const currentExerciseData = workoutSession.exercises[workoutSession.currentExerciseIndex]
    const currentExercise = currentExerciseData?.exercise
    const isCurrentResting = currentExerciseData?.isResting || false
    const currentRestTime = currentExerciseData?.restTimeLeft || 0

    return (
      <div className="space-y-6 page-transition">
        {/* Session Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workout Session</h1>
            <p className="text-sm text-muted-foreground">Exercise {workoutSession.currentExerciseIndex + 1} of {workoutSession.exercises.length}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-lg font-bold text-primary timer-pulse">{formatRestTime(sessionTime)}</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
            <Button variant="outline" onClick={finishFullWorkout} className="glass-card bg-transparent">
              Finish
            </Button>
          </div>
        </div>

        {/* Exercise Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={movePrevExercise}
            disabled={workoutSession.currentExerciseIndex === 0}
          >
            Previous Exercise
          </Button>
          <Badge variant="secondary">
            {workoutSession.currentExerciseIndex + 1}/{workoutSession.exercises.length}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={moveNextExercise}
            disabled={workoutSession.currentExerciseIndex === workoutSession.exercises.length - 1}
          >
            Next Exercise
          </Button>
        </div>

        {/* Current Exercise Info */}
        {currentExercise && (
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${muscleColor(currentExercise.muscleGroup)}`}>
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{currentExercise.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{currentExercise.muscleGroup}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {currentExercise.defaultSets}×{currentExercise.defaultReps}
                      {currentExercise.defaultWeight ? ` @ ${currentExercise.defaultWeight}kg` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rest Timer (when resting) */}
        {isCurrentResting && currentRestTime > 0 && (
          <Card className="glass-card ring-2 ring-accent">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-accent">Rest Timer - Next Exercise Ready</span>
              </div>
              <div className="text-5xl font-bold text-foreground timer-pulse">
                {formatRestTime(currentRestTime)}
              </div>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={() => {
                  // Skip rest and move to next exercise
                  setWorkoutSession(prev => {
                    const updated = { ...prev }
                    updated.exercises[prev.currentExerciseIndex].isResting = false
                    updated.exercises[prev.currentExerciseIndex].restTimeLeft = 0
                    return updated
                  })
                }} className="glass-card bg-transparent">
                  Skip Rest
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Set Logging */}
        {!isCurrentResting && (
          <Card className="glass-card">
            <CardContent className="p-4 space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Quick Log Set</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Reps</label>
                  <Input
                    type="number"
                    min={1}
                    defaultValue={currentExercise?.defaultReps || 10}
                    className="text-center"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Weight</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    defaultValue={currentExercise?.defaultWeight || ""}
                    className="text-center"
                  />
                </div>
              </div>
              <Button onClick={async () => {
                if (!currentExercise) return
                try {
                  const logged = await apiClient.gym.logSet({
                    exerciseId: currentExercise.id,
                    setNumber: currentExerciseData.currentSet,
                    reps: parseInt((document.querySelector('input[type="number"]') as HTMLInputElement)?.value || String(currentExercise.defaultReps)),
                    weightKg: parseFloat((document.querySelectorAll('input[type="number"]')[1] as HTMLInputElement)?.value || "0") || undefined,
                    restAfterSec: currentExercise.restSeconds,
                    completed: true,
                  })
                  
                  // Update session state
                  setWorkoutSession(prev => {
                    const updated = { ...prev }
                    updated.exercises[prev.currentExerciseIndex].sets.push(logged)
                    updated.exercises[prev.currentExerciseIndex].currentSet++
                    updated.exercises[prev.currentExerciseIndex].isResting = true
                    updated.exercises[prev.currentExerciseIndex].restTimeLeft = currentExercise.restSeconds
                    updated.totalReps += logged.reps
                    updated.totalVolume += (logged.weightKg || 0) * logged.reps
                    return updated
                  })

                  // Start rest timer for this exercise
                  restTimerRef.current = setInterval(() => {
                    setWorkoutSession(prev => {
                      const updated = { ...prev }
                      const ex = updated.exercises[prev.currentExerciseIndex]
                      if (ex.restTimeLeft <= 1) {
                        ex.isResting = false
                        ex.restTimeLeft = 0
                        if (restTimerRef.current) clearInterval(restTimerRef.current)
                        toast.info("Rest over - ready for next set!")
                      } else {
                        ex.restTimeLeft--
                      }
                      return updated
                    })
                  }, 1000)

                  toast.success(`Set logged for ${currentExercise.name}!`)
                } catch {
                  toast.error("Failed to log set")
                }
              }} className="w-full" size="lg">
                <Check className="w-5 h-5 mr-2" />
                Log Set & Start Rest
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Session Progress */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-primary">{workoutSession.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)}</div>
                <div className="text-xs text-muted-foreground">Total Sets</div>
              </div>
              <div>
                <div className="text-xl font-bold text-accent">{workoutSession.totalReps}</div>
                <div className="text-xs text-muted-foreground">Total Reps</div>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{workoutSession.totalVolume}kg</div>
                <div className="text-xs text-muted-foreground">Total Volume</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercise List Summary */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Workout Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workoutSession.exercises.map((ex, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-2 rounded ${
                  index === workoutSession.currentExerciseIndex ? "bg-primary/10 ring-1 ring-primary" : "glass-card"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${muscleColor(ex.exercise.muscleGroup)}`} />
                  <span className="text-sm font-medium text-foreground">{ex.exercise.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {ex.sets.length}/{ex.exercise.defaultSets} sets
                  </span>
                  {index === workoutSession.currentExerciseIndex && (
                    <Badge variant="default" className="text-xs">Current</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
