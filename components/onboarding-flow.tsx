"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Target, TrendingUp, Trophy } from "lucide-react"

interface OnboardingFlowProps {
  onComplete: () => void
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

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const slide = onboardingSlides[currentSlide]
  const Icon = slide.icon

  return (
    <div className="flex flex-col min-h-screen bg-background px-6 py-8">
      {/* Skip Button */}
      <div className="flex justify-end mb-8">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        {/* Illustration */}
        <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center">
          <Icon className={`w-16 h-16 ${slide.color}`} />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-2xl font-bold text-foreground">{slide.title}</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{slide.description}</p>
        </div>

        {/* Progress Indicators */}
        <div className="flex space-x-2">
          {onboardingSlides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${index === currentSlide ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="mt-8">
        <Button onClick={handleNext} className="w-full h-12 text-lg">
          {currentSlide === onboardingSlides.length - 1 ? "Get Started" : "Next"}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
