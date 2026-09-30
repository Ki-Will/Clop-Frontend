import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SplashScreen } from '../components/splash-screen'
import { OnboardingFlow } from '../components/onboarding-flow'

describe('SplashScreen and OnboardingFlow Tests', () => {
  it('renders SplashScreen with Clop branding', () => {
    render(<SplashScreen />)
    expect(screen.getByText('Clop')).toBeDefined()
    expect(screen.getByText('Focus · Lift · Win')).toBeDefined()
  })

  it('renders OnboardingFlow and allows navigation', async () => {
    let completed = false
    const handleComplete = () => {
      completed = true
    }

    render(<OnboardingFlow onComplete={handleComplete} />)
    expect(screen.getByText('Master Your Tasks')).toBeDefined()

    // Click Next
    const nextBtn = screen.getByText('Next')
    await act(async () => {
      nextBtn.click()
    })

    // Skip onboarding
    const skipBtn = screen.getByText('Skip')
    await act(async () => {
      skipBtn.click()
    })

    expect(completed).toBe(true)
  })
})
